import * as express from "express";
import * as kleur from "kleur";
import * as config from "../config.json";
import {Client, User} from "discord.js";
import * as http from "http";
import * as WebSocket from "ws";
import IClient from "./IClient";
import Markov from "../utils/Markov";

class WebServer {
  private readonly app: express.Express;
  private readonly discord: Client;

  private readonly server: http.Server;

  constructor(discord: Client) {
    this.app = express();

    this.app.use(this._logger);
    this.app.use(express.static('public'));

    this.discord = discord;

    this.server = http.createServer(this.app);

    this.routes();
    this.websocket();

    http.createServer()
  }

  private _logger(request: express.Request, response: express.Response, next) {
    console.log(`${kleur.magenta(request.method)} ${kleur.cyan(request.path)}`);
    next();
  }

  public listen() {
    this.server.listen(config.port);
    console.log("Server listening on " + kleur.cyan(config.port));
  }

  public routes() {
    const app = this.app;

    app.get("/channels", async (req, res) => {
      const channels = this.discord.guilds.get(config.guild).channels
        .filter(c => c.type === "text")
        .map(channel => ({
          name: channel.name,
          id: channel.id,
        }));

      return res.json(channels);
    });
  }

  public websocket() { // TODO: Migrate to to own class
    const wss = new WebSocket.Server({port: config.port+1});

    let clients: IClient[] = [];

    const sendClientList = () => {
      wss.clients.forEach(gameClient => {
        if (gameClient.readyState == WebSocket.OPEN) {
          gameClient.send(JSON.stringify({cmd: "client_list", clients}));
        }
      });
    };

    const sendClientUpdate = (client) => {
      wss.clients.forEach(gameClient => {
        if (gameClient.readyState == WebSocket.OPEN) {
          gameClient.send(JSON.stringify({cmd: "client_update", client}));
        }
      })
    };

    const createClient = (clientData: Partial<IClient>) => ({
      name: "Player #" + Math.round(Math.random() * 1000 + 1),
      x: 1000,
      y: 1000,
      stage: "spawn",
      color: "#333333",
      ...clientData
    });

    wss.on("connection", (ws, req) => {
      let client = undefined;

      const addr = req.connection.remoteAddress;

      ws.on("message", msg => {
        console.log(kleur.magenta(client ? client.name : addr), kleur.cyan(msg.toString()));

        const data = JSON.parse(msg.toString());
        const command = data.cmd;
        switch (command) {
          case "load":
            client = createClient(data.data);
            clients.push(client);
            sendClientList();
            break;
          case "move":
            client.x = data.pos[0];
            client.y = data.pos[1];
            sendClientUpdate(client);
            break;
          case "change_scene":
            client.stage = data.scene;
            sendClientUpdate(client);
            break;
          case "msg":
            const message = Markov.get().generate({id: "142688838127583232"} as User);
            sendClientUpdate({name: client.name, message});
            break;
        }
      });

      ws.onclose = () => {
        clients = clients.filter(c => c.name !== client.name);
        sendClientList();
      };
    });
  }
}

export default WebServer;
