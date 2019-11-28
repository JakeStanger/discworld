import {floatsEqual} from "./utils";

export interface ICharacter {
  name: string,
  x: number,
  y: number,
  color: string,
  stage: string
}

/**
 * A player object
 */
class Character {
  /**
   * The player name
   */
  public name: string;

  /**
   * The player color
   */
  public color: string = "#ff8d4b";

  /**
   * The current scene
   */
  public stage: string;

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
    const {name, x, y, color, stage} = data;

    if (name !== undefined) this.name = name;
    if (x !== undefined) this.x = x;
    if (y !== undefined) this.y = y;
    if (color !== undefined) this.color = color;
    if (stage !== undefined) this.stage = stage;
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
    if(this.messsageCooldown) {
      this.messsageCooldown--;
      if(this.messsageCooldown === 0) this.message = undefined;
    }

    if(this.isMoving) {
      if(this.deltaX > 0) {
        this.offsetX += Character.SPEED;
        this.deltaX -= Character.SPEED;
      }
      else if(this.deltaX < 0) {
        this.offsetX -= Character.SPEED;
        this.deltaX += Character.SPEED;
      }

      if(this.deltaY > 0) {
        this.offsetY += Character.SPEED;
        this.deltaY -= Character.SPEED;
      }
      else if(this.deltaY < 0) {
        this.offsetY -= Character.SPEED;
        this.deltaY += Character.SPEED;
      }

      if(floatsEqual(Math.abs(this.offsetX), 1)) {
        this.x += Math.round(this.offsetX);
        this.offsetX = 0;
      }
      if(floatsEqual(Math.abs(this.offsetY), 1)) {
        this.y += Math.round(this.offsetY);
        this.offsetY = 0;
      }

      if(this.offsetX === 0 && this.offsetY === 0) {
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
    if (!this.isMoving) {
      this.deltaX = deltaX;
      this.deltaY = deltaY;

      this.isMoving = true;
    }
  }

  public setMessage(message: string) {
    this.message = message;
    this.messsageCooldown = 180;
  }
}

export default Character;
