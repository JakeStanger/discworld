import IChannel from "./IChannel";
import Character from "./entity/character/Character";
import { Tile } from "@discworld/common";
import { cube } from "./entity/Cube";
import { shadeColor } from "./utils";
import ChatBox from "./gui/Chatbox";
import { MapDictionary } from "@discworld/common";

type RenderCharacter = {
  character: Character;
  isCharacter: boolean;
  index: number;
};

function isRenderCharacter(
  object: number | RenderCharacter
): object is RenderCharacter {
  return (object as RenderCharacter).isCharacter;
}

class Canvas {
  private canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;

  private channels: IChannel[] = [];
  private characters: Character[] = [];
  private readonly playerId: number;

  private readonly gridSize: number;
  private readonly mapSize: number;
  private readonly mapHalf: number;

  private zoomLevel: number = 1;

  private ground: HTMLImageElement;

  private scene: MapDictionary;

  private mouseX: number;
  private mouseY: number;

  private readonly chatBox: ChatBox;

  constructor(
    canvas: HTMLCanvasElement,
    gridSize: number,
    mapSize: number,
    playerId: number,
    chatBox: ChatBox
  ) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");

    this.gridSize = gridSize;
    this.mapSize = mapSize;
    this.mapHalf = mapSize / 2;

    this.playerId = playerId;

    this.chatBox = chatBox;

    this.draw = this.draw.bind(this);
    this.resize = this.resize.bind(this);
    this.zoom = this.zoom.bind(this);

    this.ground = new Image(gridSize, gridSize);
    this.ground.src = "/img/ground.png";

    this.ground.onload = () => {
      this.resize();
      this.draw();
    };

    window.addEventListener("resize", this.resize);
    this.canvas.addEventListener("wheel", this.zoom);

    this.canvas.addEventListener("mousemove", ev => {
      const rect = canvas.getBoundingClientRect();

      this.mouseX = ev.clientX - rect.left;
      this.mouseY = ev.clientY - rect.top;
    });
  }

  private zoom(ev: WheelEvent) {
    let delta = ev.deltaY;
    if (delta > 3) delta = 3;
    if (delta < -3) delta = -3;

    let newZoom = this.zoomLevel - delta * 0.05;
    if (newZoom < 0.6) newZoom = 0.6;
    if (newZoom > 3.5) newZoom = 3.5;
    if (newZoom != this.zoomLevel) {
      this.zoomLevel = newZoom;
    }
  }

  /** We want a square canvas */
  private static getSize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    if (width < height) return width;
    else return height;
  }

  private resize() {
    const size = Canvas.getSize();
    this.canvas.width = size;
    this.canvas.height = size;
  }

  public draw() {
    const ctx = this.context;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();

    this.context.translate(this.canvas.width / 2, this.canvas.height / 2);
    this.context.scale(this.zoomLevel, 0.5 * this.zoomLevel);
    this.context.rotate((-45 * Math.PI) / 180);

    const character = this.characters.find(c => c.id == this.playerId) || {
      posX: 0,
      posY: 0
    };
    const offsetX = -character.posX * this.gridSize - this.gridSize / 2;
    const offsetY = -character.posY * this.gridSize - this.gridSize / 2;

    const matrix = this.context.getTransform().invertSelf();

    const mx = this.mouseX;
    const my = this.mouseY;

    const mouseX =
      Math.round((mx * matrix.a + my * matrix.c + matrix.e) / this.gridSize) +
      character.posX +
      this.gridSize;
    const mouseY =
      Math.round((mx * matrix.b + my * matrix.d + matrix.f) / this.gridSize) +
      character.posY +
      this.gridSize;

    this.drawScene(offsetX, offsetY, mouseX, mouseY);
    this.renderLabels(offsetX, offsetY);

    ctx.restore();

    ctx.fillStyle = "#ffffff";
    ctx.fillText("Test", 10, 10);

    this.chatBox.draw(ctx, this.mouseX, this.mouseY);
  }

  private async _drawTiles(
    tile: Tile,
    offsetX,
    offsetY,
    mouseX: number,
    mouseY: number
  ) {
    const gridSize = this.gridSize;
    const mapSize = this.mapSize;
    const mapHalf = this.mapHalf;

    const raised = tile === Tile.Wall;

    let color = "#2d2d2d";

    switch (tile) {
      case Tile.Wall:
        color = "#aaaaaa";
        break;
      case Tile.Spawn:
        color = "#555555";
        break;
      case Tile.Channel:
        color = "#33cc33";
        break;
      case Tile.Exit:
        color = "#ffaaff";
        break;
    }

    const tileMap: (number | RenderCharacter)[] = [...this.scene[tile]];

    if (!tileMap) return;

    if (tile === Tile.Wall) {
      const characters: RenderCharacter[] = this.characters.map(character => ({
        index: character.x + mapHalf + (character.y + mapHalf) * mapSize,
        isCharacter: true,
        character
      }));

      characters.forEach(character => {
        const upperIndex: number = tileMap.reduce(
          (prev: number, curr: number) =>
            curr > character.index &&
            Math.abs(curr - character.index) < Math.abs(prev - character.index)
              ? curr
              : prev
        ) as number;

        tileMap.splice(tileMap.indexOf(upperIndex) + 1, 0, character);
      });
    }

    tileMap.forEach(index => {
      if (isRenderCharacter(index)) {
        this.renderCharacter(index.character, offsetX, offsetY);
        return;
      }

      const y = Math.floor((index as number) / mapSize);
      const x = (index as number) % mapSize;

      let tileColor = color;

      if (x === mouseX && y === mouseY && !raised)
        tileColor = shadeColor(color, 20);

      const posX = (x - (!raised ? 1 : 0) - mapHalf) * gridSize + offsetX;
      const posY = (y + (!raised ? 1 : 0) - mapHalf) * gridSize + offsetY;

      cube({
        ctx: this.context,
        x: posX,
        y: posY,
        size: gridSize,
        color: tileColor,
        drawLeft: raised,
        drawFront: raised
      });
    });
  }

  public drawScene(
    offsetX: number,
    offsetY: number,
    mouseX: number,
    mouseY: number
  ) {
    if (!this.scene) return;

    // get required character information
    const tiles = Object.keys(this.scene).map(tile => parseInt(tile));

    // Only render z = 0 on first pass
    tiles
      .filter(tile => tile !== Tile.Wall && tile !== Tile.Void)
      .forEach(tile => this._drawTiles(tile, offsetX, offsetY, mouseX, mouseY));

    // Render entities with z = 1
    tiles
      .filter(tile => tile === Tile.Wall)
      .forEach(tile => this._drawTiles(tile, offsetX, offsetY, mouseX, mouseY));
  }

  private renderCharacter(
    character: Character,
    offsetX: number,
    offsetY: number
  ) {
    const ctx = this.context;
    const size = this.gridSize;

    const cubeSize = size * 0.6 + Math.sin(Date.now() / 500);

    const x = -cubeSize / 2;
    const y = -cubeSize / 2;

    ctx.fillStyle = "#ffffff0a";

    if (character.id == this.playerId) {
      ctx.fillRect(-size / 2, -size / 2, size, size);

      cube({ ctx, x, y, size: cubeSize, color: character.color });
    } else {
      const posX = character.posX * size + offsetX;
      const posY = character.posY * size + offsetY;

      cube({
        ctx,
        x: posX + size * 0.25,
        y: posY + size * 0.25,
        size: size * 0.5,
        color: character.color
      });
    }
  }

  private renderLabels(offsetX: number, offsetY: number) {
    const ctx = this.context;

    ctx.save();
    const matrix = ctx.getTransform();
    ctx.resetTransform();

    ctx.font = "11px Source Code Pro";

    this.channels.forEach(channel => {
      const cx = channel.x * this.gridSize + offsetX + this.gridSize;
      const cy = channel.y * this.gridSize + offsetY;

      const x = cx * matrix.a + cy * matrix.c + matrix.e;
      const y = cx * matrix.b + cy * matrix.d + matrix.f;

      ctx.fillStyle = "#00000033";
      ctx.fillRect(x - 10, y - 15, channel.name.length * 7 + 20, 9 + 15);

      ctx.fillStyle = "#ffffff";
      ctx.fillText(channel.name, x, y);
    });

    ctx.font = "18px Source Code Pro";

    this.characters.forEach(character => {
      const cx = character.posX * this.gridSize + offsetX + this.gridSize;
      const cy = character.posY * this.gridSize + offsetY - this.gridSize;

      const x = cx * matrix.a + cy * matrix.c + matrix.e;
      const y = cx * matrix.b + cy * matrix.d + matrix.f;

      const display = character.message || character.displayName;

      ctx.fillStyle = character.message ? "#ffffffaa" : "#00000033";
      ctx.fillRect(x - 10, y - 20, display.length * 11 + 20, 9 + 20);

      ctx.fillStyle = character.message ? "#333333" : "#ffffff";
      ctx.fillText(display, x, y);
    });

    ctx.restore();
  }

  public setChannels(channels: IChannel[]) {
    this.channels = channels;
  }

  public setCharacters(characters: Character[]) {
    this.characters = characters;
  }

  public setScene(scene: MapDictionary) {
    this.scene = scene;
  }
}

export default Canvas;
