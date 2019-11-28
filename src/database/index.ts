import { Sequelize } from "sequelize";
import IDatabaseConfig from "./IDatabaseConfig";
import * as kleur from "kleur";
import Message from "./models/Message";
import Reaction from "./models/Reaction";
import Mention from "./models/Mention";

class Database {
  private database: Sequelize;

  public async setup(conf: IDatabaseConfig) {
    this.database = new Sequelize(conf.name, conf.username, conf.password, {
      host: conf.host,
      dialect: conf.dialect,
      dialectOptions: {
        timezone: 'Etc/GMT0'
      },
      define: {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
      },
      logging: conf.logging
    });

    return await new Promise((resolve, reject) => this.database.authenticate().then(() => {
      console.log(kleur.green("Connected to database ") + kleur.cyan(`${conf.name}@${conf.host}`));

      Reaction.load(this.database);
      Mention.load(this.database);
      Message.load(this.database);

      this.database.sync().then(resolve);

    }).catch(err => {
      console.log(kleur.red("Failed to connect to database ") + kleur.cyan(`${conf.name}@${conf.host}`));
      console.error(err);
      reject(err);
    }));
  }
}

export default Database;
