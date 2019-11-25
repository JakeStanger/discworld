import {Sequelize, Model, DataTypes} from "sequelize";
import Message from "./Message";

class Mention extends Model {
  public id: number;
  public messageId: string;
  public userId: string;

  public message: Message;

  public static load(database: Sequelize) {
    Mention.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: DataTypes.STRING
    }, {
      sequelize: database,
      tableName: "mentions"
    })
  }
}

export default Mention;
