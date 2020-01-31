import { floatsEqual } from "../../utils";
import ICharacter from "./ICharacter";
import Direction from "./Direction";

/**
 * A player object
 */
class Character implements ICharacter {
  /**
   * The player id
   */
  public id: number;

  /**
   * the player display name
   */
  public displayName: string;

  /**
   * The player color
   */
  public color: string = "#ff8d4b";

  /**
   * The current scene
   */
  public scene: string = "spawn";

  /**
   * The current tile X position
   */
  public x = 0;

  /**
   * The current tile Y position
   */
  public y = 0;

  /**
   * Whether the character is currently
   * transitioning between tiles
   */
  public isMoving: boolean = false;

  /**
   * The X distance left to move
   */
  public deltaX: number = 0;

  /**
   * The Y distance left to move
   */
  public deltaY: number = 0;

  /**
   * The direction the character is pointing
   */
  public direction: Direction;

  /**
   * The X distance from the current tile
   */
  private offsetX: number = 0;

  /**
   * The Y distance from the current tile
   */
  private offsetY: number = 0;

  /**
   * The offset distance to move per tick
   */
  private static readonly SPEED = 0.2;

  /**
   * The current display message.
   */
  public message: string;

  private messsageCooldown: number = 0;


  constructor(data: Partial<ICharacter>) {
    const { id, x, y, color, scene } = data;

    if (id !== undefined) this.id = id;
    if (x !== undefined) this.x = x;
    if (y !== undefined) this.y = y;
    if (color !== undefined) this.color = color;
    if (scene !== undefined) this.scene = scene;

    this.displayName = "Player #" + id;
  }

  /**
   * The current actual X position
   * including the transition offset.
   */
  public get posX() {
    return this.x + this.offsetX;
  }

  /**
   * The current actual Y position
   * including the transition offset.
   */
  public get posY() {
    return this.y + this.offsetY;
  }

  /**
   * The destination X position
   */
  public get nextX() {
    return this.x + this.deltaX;
  }

  /**
   * The destination Y position
   */
  public get nextY() {
    return this.y + this.deltaY;
  }

  /**
   * Transitions the character from its
   * current position towards its next
   * position.
   *
   * This is called once per tick.
   */
  public move() {
    if (this.messsageCooldown) {
      this.messsageCooldown--;
      if (this.messsageCooldown === 0) this.message = undefined;
    }

    const distanceX = Math.abs(this.x - this.nextX);
    const distanceY = Math.abs(this.y - this.nextY);

    const distance = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));

    const speed = Character.SPEED * Math.sqrt(distance);
    const precision = speed * 1.1;

    const distanceXTravelled = Math.abs(this.x - this.posX);
    const distanceYTravelled = Math.abs(this.y - this.posY);

    const distanceTravelled = Math.sqrt(Math.pow(distanceXTravelled, 2) + Math.pow(distanceYTravelled, 2));

    if (this.isMoving) {
      if (this.deltaX > 0) {
        this.offsetX += speed;
      } else if (this.deltaX < 0) {
        this.offsetX -= speed;
      }

      if (this.deltaY > 0) {
        this.offsetY += speed;
      } else if (this.deltaY < 0) {
        this.offsetY -= speed;
      }

      if (floatsEqual(distance, distanceTravelled, precision)) {
        this.x += Math.round(this.offsetX);
        this.y += Math.round(this.offsetY);
        this.offsetX = 0;
        this.offsetY = 0;
      }

      if (this.offsetX === 0 && this.offsetY === 0) {
        this.isMoving = false;
        this.deltaX = 0;
        this.deltaY = 0;
      }
    }
  }

  /**
   * Sets the X and Y delta for the character
   * and marks it as moving.
   *
   * @param deltaX The X distance to add
   * @param deltaY The Y distance to add
   */
  public setDelta(deltaX: number, deltaY: number) {
    this.deltaX = deltaX;
    this.deltaY = deltaY;

    this.setDirection();

    this.isMoving = true;
  }

  private setDirection() {
     if(this.deltaY > 0) this.direction = Direction.Down;
     else if(this.deltaY < 0) this.direction = Direction.Up;

     if (this.deltaX > 0) this.direction = Direction.Right;
     else if(this.deltaX < 0) this.direction = Direction.Left;
  }

  public setMessage(message: string) {
    this.message = message;
    this.messsageCooldown = 180;
  }
}

export default Character;
