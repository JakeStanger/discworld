type KeyboardFunc = (key: string) => void;

class Keyboard {
  private readonly onKeyDown: KeyboardFunc;
  private readonly onKeyUp: KeyboardFunc;

  private _keysDown: {[key: string]: boolean} = {};

  constructor(onKeyDown: KeyboardFunc, onKeyUp: KeyboardFunc) {
    this.onKeyDown = onKeyDown;
    this.onKeyUp = onKeyUp;

    document.addEventListener("keydown", this._onKeyDown.bind(this));
    document.addEventListener("keyup", this._onKeyUp.bind(this));
  }

  private _onKeyDown(ev: KeyboardEvent) {
    this._keysDown[ev.key] = true;
    this.onKeyDown(ev.key);
  }

  private _onKeyUp(ev: KeyboardEvent) {
    this._keysDown[ev.key] = false;
    this.onKeyUp(ev.key);
  }

  public isKeyDown(key: string): boolean {
    return !!this._keysDown[key];
  }
}

export default Keyboard;
