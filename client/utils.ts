export const shuffle = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
};

export const shadeColor = (color, percent) => {
  color = color.substr(1);
  const num = parseInt(color, 16),
    amt = Math.round(2.55 * percent),
    R = (num >> 16) + amt,
    G = (num >> 8 & 0x00FF) + amt,
    B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000
    + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000
    + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100
    + (B < 255 ? B < 1 ? 0 : B : 255))
    .toString(16).slice(1);
};

export const floatsEqual = (num1: number, num2: number, precision = 0.01) => {
  return Math.abs(num1 - num2) < precision;
};

export const between = (num: number, min: number, max: number) => {
  return min < num && num < max;
};
