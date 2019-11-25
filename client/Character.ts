export interface ICharacter {
  name: string,
  x: number,
  y: number,
  color: string,
  stage: string
}


class Character {
  public name: string;

  public x = 0;
  public y = 0;

  public color: string = "#ff8d4b";
  public stage: string;


  constructor(data: Partial<ICharacter>) {
    const {name, x, y, color, stage} = data;

    if(name !== undefined) this.name = name;
    if(x !== undefined) this.x = x;
    if(y !== undefined) this.y = y;
    if(color !== undefined) this.color = color;
    if(stage !== undefined) this.stage = stage;
  }
}

export default Character;
