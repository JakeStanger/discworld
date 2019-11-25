import {Sequelize, Model, DataTypes} from "sequelize";
import Message from "./Message";

class Reaction extends Model {
  public id: number;

  public messageId: string;
  public emojiId: string;

  public message: Message;

  public static load(database: Sequelize) {
    Reaction.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      emojiId: DataTypes.STRING
    }, {
      sequelize: database,
      tableName: "reactions"
    })
  }
}

export default Reaction;
