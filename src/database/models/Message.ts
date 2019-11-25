import {Sequelize, Model, DataTypes} from "sequelize";
import Mention from "./Mention";
import Reaction from "./Reaction";


class Message extends Model {
  public id: string;
  public content: string;
  public timestamp: string;
  public authorId: string;
  public channelId: string;

  public edited: boolean;
  public pinned: boolean;
  public tts: boolean;

  public mentions: Mention[];
  public reactions: Reaction[];

  public url: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static load(database: Sequelize) {
    Message.init({
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
      },
      content: DataTypes.TEXT,
      timestamp: DataTypes.DATE,
      authorId: DataTypes.STRING,
      channelId: DataTypes.STRING
    }, {
      sequelize: database,
      tableName: "messages"
    });

    Message.hasMany(Reaction, {as: "reactions"});
    Message.hasMany(Mention, {as: "mentions"});
  }
}

export default Message;
