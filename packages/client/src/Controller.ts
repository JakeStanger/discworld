import IChannel from "./IChannel";
import Canvas from "./Canvas";
import Character from "./entity/character/Character";
import Tile from "./Tile";
import { shuffle } from "./utils";
import Connection from "./connection/Connection";
import Keyboard from "./Keyboard";
import ChatBox from "./gui/Chatbox";

class Controller {
  public static MAP_SIZE = 64;
  private static GRID_SIZE = 32;

  private canvas: Canvas;

  private chatBox: ChatBox;

  private keyboard: Keyboard;

  private scene: string;
  private maps: { [key: string]: number[] } = {};

  private characters: Character[] = [];
  private player: Character;

  private allChannels: IChannel[] = [];
  private sceneChannels: IChannel[] = [];

  private connection: Connection;

  private readonly playerId = Math.round(Math.random() * 10000);

  constructor() {
    window.addEventListener("load", this.load.bind(this));

    this.loop = this.loop.bind(this);
    this.onKeyPress = this.onKeyPress.bind(this);
  }

  public async load() {
    const canvasElement: HTMLCanvasElement = document.querySelector(
      "canvas#game"
    );

    this.chatBox = new ChatBox();

    this.canvas = new Canvas(
      canvasElement,
      Controller.GRID_SIZE,
      Controller.MAP_SIZE,
      this.playerId,
      this.chatBox
    );

    this.keyboard = new Keyboard(this.onKeyPress, () => {});

    this.loop();

    this.allChannels = await fetch("/channels").then(r => r.json());

    await this.setScene("spawn");

    this.connection = new Connection(
      this.playerId,
      this._addCharacter.bind(this),
      this._updateCharacter.bind(this),
      this._removeCharacter.bind(this)
    );
  }

  public loop() {
    this.canvas.draw();

    if (this.player !== undefined && this.keyboard !== undefined) this.move();

    requestAnimationFrame(this.loop);
  }

  private async setScene(scene: string) {
    this.scene = scene;

    if (!this.maps[scene])
      await fetch(`/map/${scene}.json`)
        .then(r => r.json())
        .then(map => (this.maps[scene] = map));
    this.canvas.setScene(this.maps[scene]);

    const character = this.player;
    if (character) {
      const [x, y] = this.getRandomSpawn();

      this._updateCharacter({
        id: this.playerId,
        x,
        y,
        scene: scene
      });
      this.connection.move(character);
    }

    const locations = this.getRandomChannelLocations(this.allChannels.length);
    this._setChannels(
      this.allChannels
        .map(channel => {
          if (!locations.length) return;
          const [x, y] = locations.pop();
          return {
            ...channel,
            x,
            y
          };
        })
        .filter(c => c)
    );

    this._setCanvasCharacters();
    if (this.connection) this.connection.changeStage(character);
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

  private getCharacterAt(x, y) {
    return this.characters.find(c => c.x === x && c.y === y);
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

  private onKeyPress(key: string) {
    const { x, y } = this.player;

    if (this.chatBox.isFocused() && key !== "Enter" && key !== "Escape") return;

    switch (key) {
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
        break;

      case "m":
        this.connection.message();
        break;

      case "Enter":
        if (this.chatBox.isFocused()) {
          this.connection.message(this.chatBox.getValue());
          this.chatBox.setValue("");
        } else this.chatBox.focus();

        break;
      case "Escape":
        if(this.chatBox.isFocused()) this.chatBox.blur();
    }
  }

  private move() {
    const character = this.player;
    if (!character) return;

    this.characters.forEach(c => c.move());

    if (character.isMoving || this.chatBox.isFocused()) return;

    const keyboard = this.keyboard;

    let x = character.x;
    let y = character.y;

    let deltaX: number = 0;
    let deltaY: number = 0;

    if (keyboard.isKeyDown("ArrowUp") || keyboard.isKeyDown("w")) deltaY = -1;
    else if (keyboard.isKeyDown("ArrowDown") || keyboard.isKeyDown("s"))
      deltaY = 1;

    if (keyboard.isKeyDown("ArrowLeft") || keyboard.isKeyDown("a")) deltaX = -1;
    else if (keyboard.isKeyDown("ArrowRight") || keyboard.isKeyDown("d"))
      deltaX = 1;

    if (deltaX === 0 && deltaY === 0) return;

    const nextX = x + deltaX;
    const nextY = y + deltaY;

    const tile = this.getTileAt(nextX, nextY);

    if (
      tile !== Tile.Void &&
      tile !== Tile.Wall &&
      !this.getCharacterAt(nextX, nextY)
    ) {
      character.setDelta(deltaX, deltaY);

      this.connection.move(character);
    }
  }

  private _removeCharacter(character: Character) {
    this.characters = this.characters.filter(c => c.id != character.id);

    this._setCanvasCharacters();
  }

  private _addCharacter(character: Character) {
    if (this.characters.find(c => c.id == character.id)) return;

    if (character.x === 1000 && character.y === 1000 && !this.player) {
      const [x, y] = this.getRandomSpawn();

      character.x = x;
      character.y = y;

      this.player = character;

      this.connection.move(character);
    } else {
      character.x -= Controller.MAP_SIZE / 2;
      character.y -= Controller.MAP_SIZE / 2;
    }

    this.characters.push(character);

    this._setCanvasCharacters();
  }

  private _updateCharacter(characterData: Partial<Character>) {
    const character = this.characters.find(c => c.id === characterData.id);
    if (!character) return;

    if (characterData.displayName !== undefined)
      character.displayName = characterData.displayName;
    if (characterData.color !== undefined)
      character.color = characterData.color;
    if (characterData.scene !== undefined) {
      character.scene = characterData.scene;

      if (character.id === this.player.id) {
        const [x, y] = this.getRandomSpawn();

        character.x = x;
        character.y = y;

        this.connection.move(character);
      }
    }

    if (characterData.message !== undefined)
      character.setMessage(characterData.message);

    // do not set the current player's location
    if (character.id !== this.player.id) {
      const newX =
        characterData.x !== undefined
          ? characterData.x - Controller.MAP_SIZE / 2
          : character.x;
      const newY =
        characterData.y !== undefined
          ? characterData.y - Controller.MAP_SIZE / 2
          : character.y;

      character.x = newX;
      character.y = newY;

      // const deltaX = newX - character.x;
      // const deltaY = newY - character.y;
      //
      // if (between(Math.abs(deltaX), 0, 3) || between(Math.abs(deltaY), 0, 3))
      //   character.setDelta(deltaX, deltaY);
      // else {
      //   character.x = newX;
      //   character.y = newY;
      // }
    }

    this._setCanvasCharacters();
  }

  private _setChannels(channels: IChannel[]) {
    this.sceneChannels = channels;
    this.canvas.setChannels(channels);
  }

  private _setCanvasCharacters() {
    this.canvas.setCharacters(
      this.characters
        .filter(c => c.scene === this.scene)
        .sort((a, b) => {
          if (a.y === b.y) return b.x - a.x;
          return a.y - b.y;
        })
    );
  }
}

export default Controller;
