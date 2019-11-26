import {shadeColor} from "../utils";

export interface ICube {
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  drawLeft?: boolean,
  drawFront?: boolean,
  drawTop?: boolean
}

export const cube = (options: ICube) => {
  const {ctx, x, y, size, color, drawLeft, drawFront, drawTop} = options;

  if (drawLeft !== false) {
    ctx.beginPath();
    ctx.moveTo(x, y + size);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x + size, y - size);
    ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fillStyle = shadeColor(color, -10);
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.fill();
  }

  if (drawFront !== false) {
    ctx.beginPath();
    ctx.moveTo(x, y + size);
    ctx.lineTo(x + size, y + size);
    ctx.lineTo(x + size * 2, y);
    ctx.lineTo(x + size, y);
    ctx.closePath();
    ctx.fillStyle = shadeColor(color, 10);
    ctx.strokeStyle = shadeColor(color, 50);
    ctx.stroke();
    ctx.fill();
  }

  if (drawTop !== false) {
    ctx.beginPath();
    ctx.moveTo(x + size, y);
    ctx.lineTo(x + size * 2, y);
    ctx.lineTo(x + size * 2, y - size);
    ctx.lineTo(x + size, y - size);
    ctx.closePath();
    ctx.fillStyle = shadeColor(color, 20);
    ctx.strokeStyle = shadeColor(color, 60);
    ctx.stroke();
    ctx.fill();
  }
};
