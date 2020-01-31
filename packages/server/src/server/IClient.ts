interface IClient {
  id: number
  displayName: string;
  x: number;
  y: number;
  stage: string;
  color: string;
  message?: string;
}

export default IClient;
