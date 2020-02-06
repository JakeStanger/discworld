class ChatBox {
  public value: string = "";

  private mouseX: number;
  private mouseY: number;

  private ctx: CanvasRenderingContext2D;

  private readonly input: HTMLInputElement;

  constructor() {
    this.input = document.createElement("input");

    this.input.style.opacity = "0";
    this.input.style.height = "0";
    this.input.style.position = "fixed";

    document.body.append(this.input);

    document.addEventListener("click", ev => {
      if (!this.isFocused() && this.mouseIsOver()) {
        ev.preventDefault();
        this.focus();
      }
    });
  }

  public draw(ctx: CanvasRenderingContext2D, mouseX: number, mouseY: number) {
    const BOX_WIDTH = ctx.canvas.width - 40;
    const BOX_HEIGHT = 50;

    // how not to program :)
    this.mouseX = mouseX;
    this.mouseY = mouseY;
    this.ctx = ctx;

    // draw box
    ctx.fillStyle = this.isFocused() ? "#aaaaaacc" : "#aaaaaaaa";
    ctx.fillRect(
      20,
      ctx.canvas.height - BOX_HEIGHT - 20,
      BOX_WIDTH,
      BOX_HEIGHT
    );

    // draw outline
    ctx.strokeStyle = this.isFocused() ? "#797979" : "#333333";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.rect(20, ctx.canvas.height - BOX_HEIGHT - 20, BOX_WIDTH, BOX_HEIGHT);
    ctx.stroke();
    ctx.lineWidth = 1;

    // draw text
    ctx.font = "22px Source Code Pro";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(this.input.value, 30, ctx.canvas.height - BOX_HEIGHT + 11);
  }

  public focus() {
    this.input.focus();
  }

  public blur() {
    this.input.blur();
  }

  public isFocused() {
    return this.input === document.activeElement;
  }

  public getValue() {
    return this.input.value;
  }

  public setValue(value: string) {
    this.input.value = value;
  }

  private mouseIsOver() {
    // more examples of how not to write code :|
    const BOX_WIDTH = this.ctx.canvas.width * 0.7;
    const BOX_HEIGHT = 50;

    return (
      this.mouseX > 20 &&
      this.mouseX < 20 + BOX_WIDTH &&
      this.mouseY > this.ctx.canvas.height - BOX_HEIGHT - 20 &&
      this.mouseY < this.ctx.canvas.height - 20
    );
  }
}

export default ChatBox;
