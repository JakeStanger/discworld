import Character from "./Character";

type CharacterFunc = (character: Character) => void;

class Connection {
  private readonly ws: WebSocket;

  private clients: Character[] = [];


  private readonly addCharacter: CharacterFunc;
  private readonly updateCharacter: CharacterFunc;
  private readonly removeCharacter: CharacterFunc;


  constructor(playerId: string, addCharacter: CharacterFunc, updateCharacter: CharacterFunc, removeCharacter: CharacterFunc) {
    this.addCharacter = addCharacter;
    this.updateCharacter = updateCharacter;
    this.removeCharacter = removeCharacter;


    let wsLocation = window.location.href.replace("http", "ws");
    if(wsLocation.indexOf("localhost") == -1) wsLocation += "/ws";
    else wsLocation = wsLocation.replace(/(\d{2,5})/, ((_, p) => (parseInt(p) + 1).toString()));
    this.ws = new WebSocket(wsLocation);

    this.ws.onopen = () => {
      this.ws.send(JSON.stringify({
        cmd: "load",
        data: {
          name: playerId,
          stage: "spawn"
        }
      }));
    };

    this.ws.onmessage = msg => {
      const data = JSON.parse(msg.data);
      const command = data.cmd;
      switch(command) {
        case "client_list":
          data.clients.forEach(client => {
            if(this.clients.find(c => c.name === client.name)) return;
            else {
              const character = new Character(client);
              this.addCharacter(character);
              this.clients.push(character);
            }
          });

          this.clients.forEach(client => {
            if(!data.clients.find(c => c.name === client.name )) {
              this.removeCharacter(client);
              this.clients = this.clients.filter(c => c.name !== client.name);
            }
          });
          break;
        case "client_update":
          const client = data.client;
          this.updateCharacter(client);
      }
    };
  }

  public move(character: Character) {
    this.ws.send(JSON.stringify({cmd: "move", pos: [character.nextX, character.nextY]}));
  }

  public changeScene(character: Character) {
    this.ws.send(JSON.stringify({cmd: "change_scene", scene: character.stage}));
  }

  public message() {
    this.ws.send(JSON.stringify({cmd: "msg"}));
  }
}

export default Connection;
