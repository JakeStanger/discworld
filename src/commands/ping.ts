import {Message} from "discord.js";

export const ping = async (msg: Message) => {
  await msg.reply("pong");
};
