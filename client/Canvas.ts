import IChannel from "./IChannel";
import Character from "./Character";
import Tile from "./Tile";
import {cube} from "./entity/Cube";

class Canvas {
  private canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;

  private channels: IChannel[] = [];
  private characters: Character[] = [];
  private playerId: string;

  private readonly gridSize: number;
  private readonly mapSize: number;

  private zoomLevel: number = 1;

  private ground: HTMLImageElement;

  private scene: number[];

  constructor(canvas: HTMLCanvasElement, gridSize: number, mapSize: number, playerId: string) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");

    this.gridSize = gridSize;
    this.mapSize = mapSize;

    this.playerId = playerId;

    this.draw = this.draw.bind(this);
    this.resize = this.resize.bind(this);
    this.zoom = this.zoom.bind(this);

    this.ground = new Image(gridSize, gridSize);
    this.ground.src = "/img/ground.png";

    this.ground.onload = this.resize;

    window.addEventListener("resize", this.resize);
    this.canvas.addEventListener("wheel", this.zoom);
  }

  private zoom(ev: WheelEvent) {
    const newZoom = this.zoomLevel - (ev.deltaY * 0.05);
    if (newZoom > 0.6 && newZoom < 3.5) {
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

    this.draw();
  }

  public draw() {
    const ctx = this.context;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();

    this.context.translate(this.canvas.width / 2, this.canvas.height / 2);
    this.context.scale(this.zoomLevel, 0.5 * this.zoomLevel);
    this.context.rotate(-45 * Math.PI / 180);

    const character = this.characters.find(c => c.name == this.playerId) || {x: 0, y: 0};
    const offsetX = -character.x * this.gridSize - (this.gridSize / 2);
    const offsetY = -character.y * this.gridSize - (this.gridSize / 2);


    this.drawScene(offsetX, offsetY);
    this.renderCharacters(offsetX, offsetY);
    this.renderChannels(offsetX, offsetY);

    ctx.restore();

    ctx.fillStyle = "#ffffff";
    ctx.fillText("Test", 10, 10);

    requestAnimationFrame(this.draw);
  }

  public drawScene(offsetX: number, offsetY: number) {
    const gridSize = this.gridSize;

    const mapSize = this.mapSize;
    const mapHalf = mapSize / 2;

    const context = this.context;

    if (!this.scene) return;

    for (let i = 0; i < mapSize * mapSize; i++) {
      const x = Math.floor(i / mapSize);
      const y = i % mapSize;

      const posX = (x - mapHalf) * gridSize + offsetX;
      const posY = (y - mapHalf) * gridSize + offsetY;

      const tile = this.scene[y * mapSize + x];

      switch (tile) {
        case Tile.Ground:
          context.fillStyle = "#2d2d2d";
          context.fillRect(posX, posY, gridSize, gridSize);
          break;
        case Tile.Wall:
          context.fillStyle = "#ffffff";
          context.fillRect(posX, posY, gridSize, gridSize);
          // cube(context, posX,posY, gridSize, "#ffffff");
          break;
        case Tile.Spawn:
          context.fillStyle = "#aaaaaa";
          context.fillRect(posX, posY, gridSize, gridSize);
          break;
        case Tile.Channel:
          context.fillStyle = "#33cc33";
          context.fillRect(posX, posY, gridSize, gridSize);
          break;
        case Tile.Exit:
          context.fillStyle = "#ffaaff";
          context.fillRect(posX, posY, gridSize, gridSize);
          break;
      }
    }
  }

  public renderChannels(offsetX: number, offsetY: number) {
    const ctx = this.context;

    ctx.font = "12px Source Code Pro";

    ctx.fillStyle = "#ffffff";

    this.channels.forEach(channel => ctx.fillText(channel.name,
      (channel.x * this.gridSize) + offsetX + this.gridSize / 8,
      (channel.y * this.gridSize) + offsetY + this.gridSize / 2));
  }

  public renderCharacters(offsetX: number, offsetY: number) {
    const ctx = this.context;
    const size = this.gridSize;

    const cubeSize = size * 0.6 + (Math.sin(Date.now() / 500));

    const x = (-cubeSize) / 2;
    const y = (-cubeSize) / 2;

    this.characters.forEach(character => {
      ctx.fillStyle = "#ffffff0a";

      if (character.name == this.playerId) {
        ctx.fillRect(-size / 2, -size / 2, size, size);
        cube(ctx, x, y, cubeSize, character.color);
      } else {
        const posX = (character.x * size) + offsetX;
        const posY = (character.y * size) + offsetY;

        // ctx.fillRect(-size / 2, -size / 2, size, size);
        cube(ctx, posX + size * 0.25, posY + size * 0.25, size * 0.5, character.color);
      }
    });
  }

  public setChannels(channels: IChannel[]) {
    this.channels = channels;
  }

  public setCharacters(characters: Character[]) {
    this.characters = characters;
  }

  public setScene(scene: number[]) {
    this.scene = scene;
  }
}

export default Canvas;
