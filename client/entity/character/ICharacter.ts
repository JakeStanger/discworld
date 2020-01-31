interface ICharacter {
  id: number,
  displayName: string
  x: number,
  y: number,
  color: string,
  scene: string,
  message?: string
}

export default ICharacter;
