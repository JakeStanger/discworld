import IChannel from "./IChannel";
import Character from "./entity/character/Character";
import Tile from "./Tile";
import { cube } from "./entity/Cube";
import { shadeColor } from "./utils";
import ChatBox from "./gui/Chatbox";

class Canvas {
  private canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;

  private channels: IChannel[] = [];
  private characters: Character[] = [];
  private readonly playerId: number;

  private readonly gridSize: number;
  private readonly mapSize: number;

  private zoomLevel: number = 1;

  private ground: HTMLImageElement;

  private scene: number[];

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

    // requestAnimationFrame(this.draw);
  }

  public drawScene(
    offsetX: number,
    offsetY: number,
    mouseX: number,
    mouseY: number
  ) {
    const gridSize = this.gridSize;

    const mapSize = this.mapSize;
    const mapHalf = mapSize / 2;

    const context = this.context;

    if (!this.scene) return;

    for (let x = mapSize; x > 0; x--)
      for (let y = 0; y < mapSize; y++) {
        const tile = this.scene[y * mapSize + x];

        if (tile === Tile.Void) continue;

        const tileFront = this.scene[(y + 1) * mapSize + x];
        const tileLeft = this.scene[y * mapSize + (x - 1)];

        const raised = tile === Tile.Wall;

        const posX = (x - (!raised ? 1 : 0) - mapHalf) * gridSize + offsetX;
        const posY = (y + (!raised ? 1 : 0) - mapHalf) * gridSize + offsetY;

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

        if (x === mouseX && y === mouseY && !raised)
          color = shadeColor(color, 20);

        cube({
          ctx: context,
          x: posX,
          y: posY,
          size: gridSize,
          color,
          drawFront:
            tileFront === Tile.Void ||
            tileFront === Tile.Wall ||
            tile === Tile.Wall,
          drawLeft:
            tileLeft === Tile.Void ||
            tileLeft === Tile.Wall ||
            tile == Tile.Wall
        });

        // TODO: Figure a cheaper way of handling this
        // It might be possible to use a binary array for the map and store it in here?
        const offX = x - mapHalf;
        const offY = y - mapHalf;
        const character = this.characters.find(
          c => c.x === offX && c.y === offY
        );
        if (character) this.renderCharacter(character, offsetX, offsetY);
      }
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

  public setScene(scene: number[]) {
    this.scene = scene;
  }
}

export default Canvas;
