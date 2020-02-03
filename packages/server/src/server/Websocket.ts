import * as WebSocket from "ws";
import { Server } from "ws";
import * as config from "../config.json";
import IClient from "./IClient";
import * as kleur from "kleur";
import Markov from "../utils/Markov";
import { GuildMember, User } from "discord.js";
import * as crypto from "crypto";
import Webhooks from "../utils/Webhooks";
import DiscordHelper from "../utils/DiscordHelper";
import { Message } from "@discworld/common";

class WebsocketServer {
  private static instance: WebsocketServer;

  private wss: Server;

  private connections: WebsocketConnection[] = [];

  constructor() {
    WebsocketServer.instance = this;

    this.wss = new WebSocket.Server({ port: config.port + 1 });

    this.sendClientUpdate = this.sendClientUpdate.bind(this);

    this.wss.on("connection", this.onConnection.bind(this));
  }

  public static get() {
    return WebsocketServer.instance;
  }

  public sendClientList() {
    this.wss.clients.forEach(gameClient => {
      if (gameClient.readyState == WebSocket.OPEN) {
        gameClient.send(
          JSON.stringify({
            cmd: "client_list",
            clients: this.connections.map(con => con.client)
          })
        );
      }
    });
  }

  public sendClientUpdate(update: Uint16Array) {
    this.wss.clients.forEach(gameClient => {
      if (gameClient.readyState == WebSocket.OPEN) {
        gameClient.send(update);
      }
    });
  }

  private onConnection(ws: WebSocket, req: Request) {
    const id = crypto.randomBytes(10).toString("hex");
    const connection = new WebsocketConnection(ws, id);
    this.connections.push(connection);
  }

  public removeConnection(connection: WebsocketConnection) {
    this.connections = this.connections.filter(con => con.id !== connection.id);
    this.sendClientList();
  }

  public getConnectionByGameId(id: number): WebsocketConnection {
    return this.connections.find(c => c.client && c.client.id === id);
  }

  public getConnectionByDiscordId(id: string): WebsocketConnection {
    return this.connections.find(c => c.discordId === id);
  }
}

class WebsocketConnection {
  public client: IClient;
  public id: string;
  public discordId: string;

  private ws: WebSocket;

  constructor(ws: WebSocket, id: string) {
    this.ws = ws;
    this.id = id;

    ws.on("message", this.onMessage.bind(this));
    ws.on("close", this.removeClient.bind(this));
  }

  private static createClient(id: number): IClient {
    return {
      id,
      displayName: "Player #" + id,
      x: 1000,
      y: 1000,
      stage: "spawn",
      color: "#333333"
    };
  }

  private async onMessage(msg: Buffer) {
    let client = this.client;
    const sendClientUpdate = WebsocketServer.get().sendClientUpdate;

    // console.log(
    //   kleur.cyan(Message[msg[0]].toUpperCase()),
    //   this.client ? kleur.magenta(this.client.id) : "",
    //   msg.slice(1)
    // );

    const command = msg[0];
    switch (command) {
      case Message.Load:
        // Load is a U16 array as it has to send the player id
        this.client = WebsocketConnection.createClient(msg.readUInt16LE(2));
        WebsocketServer.get().sendClientList();
        break;
      case Message.Move:
        client.x = msg[1] as number;
        client.y = msg[2] as number;

        const moveData = new Uint16Array(4);
        moveData[0] = Message.Move;
        moveData[1] = client.id;
        moveData[2] = client.x;
        moveData[3] = client.y;

        sendClientUpdate(moveData);
        break;
      case Message.Scene:
        const stageEncoded = msg.slice(1);

        const dec = new TextDecoder();
        const stage = dec.decode(stageEncoded);
        client.stage = stage;

        const sceneData = new Uint16Array(2 + stageEncoded.length);
        sceneData[0] = Message.Scene;
        sceneData[1] = client.id;
        sceneData.set(stageEncoded, 2);

        sendClientUpdate(sceneData);
        break;
      case Message.Message:
        if (this.discordId) {
          let message: string;
          if (msg.length > 1) {
            const messageEncoded = msg.slice(1);

            const dec = new TextDecoder();
            message = dec.decode(messageEncoded);
          } else {
            message = Markov.get().generate({
              id: this.discordId
            } as User);
          }

          this.sendGameMessage(message);

          const member = DiscordHelper.getMember(this.discordId);

          const channel =
            DiscordHelper.getChannelByName(this.client.stage) ||
            DiscordHelper.getDefaultChannel();

          Webhooks.get()
            .getHook(channel)
            .send(message, {
              username: member.nickname,
              avatarURL: member.user.avatarURL
            });
        }
        break;
    }
  }

  private removeClient() {
    WebsocketServer.get().removeConnection(this);
  }

  public login(member: GuildMember) {
    this.discordId = member.id;

    this.client.displayName = member.nickname;
    this.client.color = member.displayHexColor;

    const enc = new TextEncoder();
    const encoded = enc.encode(member.nickname);

    const data = new Uint16Array(5 + encoded.length);
    data[0] = Message.Login;
    data[1] = this.client.id;

    data[2] = (member.displayColor >> 16) & 255;
    data[3] = (member.displayColor >> 8) & 255;
    data[4] = member.displayColor & 255;

    data.set(encoded, 5);

    WebsocketServer.get().sendClientUpdate(data);
  }

  public sendGameMessage(message: string) {
    const enc = new TextEncoder();
    const encoded = enc.encode(message);

    const data = new Uint16Array(2 + encoded.length);
    data[0] = Message.Message;
    data[1] = this.client.id;
    data.set(encoded, 2);

    WebsocketServer.get().sendClientUpdate(data);
  }
}

export default WebsocketServer;
