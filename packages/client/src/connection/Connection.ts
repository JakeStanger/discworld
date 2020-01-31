import Character from "../entity/character/Character";
import { Message } from "@discworld/common";
import Controller from "../Controller";
import * as utf8 from "utf8";
import ICharacter from "../entity/character/ICharacter";

type CharacterFunc = (character: Partial<ICharacter>) => void;

class Connection {
  private readonly ws: WebSocket;

  private clients: Character[] = [];

  private readonly addCharacter: CharacterFunc;
  private readonly updateCharacter: CharacterFunc;
  private readonly removeCharacter: CharacterFunc;


  constructor(playerId: number, addCharacter: CharacterFunc, updateCharacter: CharacterFunc, removeCharacter: CharacterFunc) {
    this.addCharacter = addCharacter;
    this.updateCharacter = updateCharacter;
    this.removeCharacter = removeCharacter;


    let wsLocation = window.location.href.replace("http", "ws");
    if (wsLocation.indexOf("localhost") == -1) wsLocation += "/ws";
    else wsLocation = wsLocation.replace(/(\d{2,5})/, ((_, p) => (parseInt(p) + 1).toString()));
    this.ws = new WebSocket(wsLocation);

    this.ws.binaryType = "arraybuffer";

    this.ws.onopen = () => {
      const data = new Uint16Array(2);
      data[0] = Message.Load;
      data[1] = playerId;

      this.ws.send(data);
    };

    this.ws.onmessage = msg => {
      if (typeof msg.data == "string") {
        const data = JSON.parse(msg.data);
        const command = data.cmd;
        switch (command) {
          case "client_list":
            data.clients.forEach(client => {
              if (this.clients.find(c => c.id === client.id)) return;
              else {
                const character = new Character(client);
                this.addCharacter(character);
                this.clients.push(character);
              }
            });

            this.clients.forEach(client => {
              if (!data.clients.find(c => c.id === client.id)) {
                this.removeCharacter(client);
                this.clients = this.clients.filter(c => c.id !== client.id);
              }
            });
            break;
        }
      } else {
        const data = new Uint16Array(msg.data);
        const command = data[0];
        const id = data[1];

        switch (command) {
          case Message.Move: {
            const x = data[2];
            const y = data[3];

            updateCharacter({
              id,
              x,
              y
            });
            break;
          }

          case Message.Scene: {
            const dec = new TextDecoder("utf-16");
            const scene = utf8.decode(dec.decode(data.slice(2)));

            updateCharacter({
              id,
              scene
            });
            break;
          }

          case Message.Message: {
            const dec = new TextDecoder("utf-16");
            const message = utf8.decode(dec.decode(data.slice(2)));

            updateCharacter({
              id,
              message
            });

            break;
          }

          case Message.Login:
            const color = "#" + ((1 << 24) + (data[2] << 16) + (data[3] << 8) + data[4])
              .toString(16).slice(1);

            const dec = new TextDecoder("utf-16");
            const displayName = utf8.decode(dec.decode(data.slice(5)));

            updateCharacter({
              id,
              color,
              displayName
            })
        }
      }
    };
  }

  public move(character: Character) {
    const data = new Uint8Array(3);
    data[0] = Message.Move;

    // Since we are sending unsigned ints we need positive coordinates
    data[1] = character.nextX + Controller.MAP_SIZE / 2;
    data[2] = character.nextY + Controller.MAP_SIZE / 2;

    this.ws.send(data);
  }

  public changeStage(character: Character) {
    const data = new Uint8Array(1 + character.scene.length);
    data[0] = Message.Scene;

    const enc = new TextEncoder();
    const encoded = enc.encode(character.scene);

    data.set(encoded, 1);

    this.ws.send(data);
  }

  public message(message?: string) {
    const data = new Uint8Array(1 + (message ? message.length : 0));
    data[0] = Message.Message;

    console.log(message);

    const enc = new TextEncoder();
    const encoded = enc.encode(message);

    data.set(encoded, 1);

    this.ws.send(data);
  }
}

export default Connection;
