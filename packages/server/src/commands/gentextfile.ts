import { Message } from "discord.js";
import DBMessage from "../database/models/Message";
import DiscordHelper from "../utils/DiscordHelper";
import * as fs from "fs";

export const gentextfile = async (msg: Message) => {
  const messages: DBMessage[] = await DBMessage.findAll({order: ['timestamp'] });

  const textFile = messages.map(msg => `${DiscordHelper.getMember(msg.authorId)?.nickname || 'user'}:\n${msg.content?.replace(/\n/g, ' ')}`).join('\n\n');

  fs.writeFileSync('discord.txt', textFile);

  console.log("done");
};
