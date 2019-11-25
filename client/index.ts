import IChannel from "./IChannel";
import Canvas from "./Canvas";
import Character, {ICharacter} from "./Character";
import Tile from "./Tile";
import {shuffle} from "./utils";
import Connection from "./Connection";

class Controller {
  private static MAP_SIZE = 64;
  private static GRID_SIZE = 32;

  private canvas: Canvas;

  private scene: string;
  private maps: { [key: string]: number[] } = {};

  private characters: Character[] = [];

  private allChannels: IChannel[] = [];
  private sceneChannels: IChannel[] = [];

  private connection: Connection;

  private playerId = "Player #" + Math.round(Math.random() * 1000) + 1;

  constructor() {
    window.addEventListener("load", this.load.bind(this));
    window.addEventListener("keydown", this.move.bind(this))
  }

  public async load() {
    const canvasElement: HTMLCanvasElement = document.querySelector("canvas#game");

    this.canvas = new Canvas(canvasElement, Controller.GRID_SIZE, Controller.MAP_SIZE, this.playerId);

    this.allChannels = await fetch("/channels").then(r => r.json());

    await this.setScene("spawn");

    this.connection = new Connection(
      this.playerId,
      this._addCharacter.bind(this),
      this._updateCharacter.bind(this),
      this._removeCharacter.bind(this)
    );
  }

  private async setScene(scene: string) {
    this.scene = scene;

    if (!this.maps[scene]) await fetch(`/map/${scene}.json`)
      .then(r => r.json()).then(map => this.maps[scene] = map);
    this.canvas.setScene(this.maps[scene]);

    const character = this._getPlayer();
    if (character) {
      const [x, y] = this.getRandomSpawn();

      this._updateCharacter({name: this.playerId, x, y, stage: scene});
      this.connection.move(character);
    }

    const locations = this.getRandomChannelLocations(this.allChannels.length);
    this._setChannels(this.allChannels.map(channel => {
      if (!locations.length) return;
      const [x, y] = locations.pop();
      return {
        ...channel,
        x, y
      }
    }).filter(c => c));

    this._setCanvasCharacters();
    if(this.connection) this.connection.changeScene(character);
  }

  private getTileAt(x, y) {
    const offsetX = x + Controller.MAP_SIZE / 2;
    const offsetY = y + Controller.MAP_SIZE / 2;

    const scene = this.maps[this.scene];
    return scene[offsetY * Controller.MAP_SIZE + offsetX];
  }

  private getChannelAt(x, y) {
    return this.sceneChannels.find(c => c.x === x && c.y === y);
  }

  public static getCoordinatesFromPixel(pixel: number) {
    const y = Math.floor(pixel / Controller.MAP_SIZE);
    const x = pixel % Controller.MAP_SIZE;

    return [x - Controller.MAP_SIZE / 2, y - Controller.MAP_SIZE / 2];
  }

  private getRandomSpawn() {
    const scene = this.maps[this.scene];
    const spawns = scene.reduce((array, tile, i) => {
      if (tile === Tile.Spawn) array.push(i);
      return array;
    }, []);

    shuffle(spawns);
    return Controller.getCoordinatesFromPixel(spawns[0]);
  }

  private getRandomChannelLocations(num: number) {
    const scene = this.maps[this.scene];
    const channels = scene.reduce((array, tile, i) => {
      if (tile === Tile.Channel) array.push(i);
      return array;
    }, []);

    shuffle(channels);

    return channels.slice(0, num).map(Controller.getCoordinatesFromPixel);
  }

  public move(ev: KeyboardEvent) {
    const character = this._getPlayer();

    let x = character.x;
    let y = character.y;

    switch (ev.key) {
      case "ArrowUp":
      case "w":
        y--;
        break;
      case "ArrowDown":
      case "s":
        y++;
        break;
      case "ArrowLeft":
      case "a":
        x--;
        break;
      case "ArrowRight":
      case "d":
        x++;
        break;
      case " ":
        const tile = this.getTileAt(x, y);
        switch (tile) {
          case Tile.Channel:
            const channel = this.getChannelAt(x, y);
            this.setScene(channel.name);
            break;
          case Tile.Exit:
            this.setScene("spawn");
            break;
        }

        return;
    }

    const tile = this.getTileAt(x, y);

    if (tile !== Tile.Void && tile !== Tile.Wall) {
      character.x = x;
      character.y = y;

      this.connection.move(character);
    }
  }

  private _removeCharacter(character: Character) {
    this.characters = this.characters.filter(c => c.name != character.name);
    this._setCanvasCharacters();
  }

  private _addCharacter(character: Character) {
    if (this.characters.find(c => c.name == character.name)) return;

    if (character.x === 1000 && character.y === 1000 && !this._getPlayer()) {
      const [x, y] = this.getRandomSpawn();

      character.x = x;
      character.y = y;

      this.connection.move(character);
    }

    this.characters.push(character);
    this._setCanvasCharacters();
  }

  private _updateCharacter(characterData: Partial<ICharacter>) {

    const character = this.characters.find(c => c.name === characterData.name);
    if(!character) return;

    if (characterData.name !== undefined) character.name = characterData.name;
    if (characterData.x !== undefined) character.x = characterData.x;
    if (characterData.y !== undefined) character.y = characterData.y;
    if (characterData.color !== undefined) character.color = characterData.color;
    if (characterData.stage !== undefined) character.stage = characterData.stage;

    this._setCanvasCharacters();
  }

  private _getPlayer() {
    return this.characters.find(c => c.name == this.playerId);
  }

  private _setChannels(channels: IChannel[]) {
    this.sceneChannels = channels;
    this.canvas.setChannels(channels);
  }

  private _setCanvasCharacters() {
    this.canvas.setCharacters(this.characters.filter(c => c.stage === this.scene));
  }
}

new Controller();
