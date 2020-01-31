import {Dialect} from "sequelize";

interface IDatabaseConfig {
  name: string;
  username: string;
  password: string;
  host: string;
  dialect: Dialect;
  logging: boolean;
}

export default IDatabaseConfig;
