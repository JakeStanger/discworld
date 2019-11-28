import {Message} from "discord.js";
import Markov from "../utils/Markov";
import Webhooks from "../utils/Webhooks";

export const mimic = async (msg: Message) => {
  const user = (msg.mentions.users && msg.mentions.users.size) ? msg.mentions.users.first() : msg.author;

  const member = await msg.guild.members.find(m => m.id === user.id);

  const string = [
    Markov.get().generate(user),
    Markov.get().generate(user),
    Markov.get().generate(user)
  ].join(". ") + ".";

  await Webhooks.get().getHook(msg.channel).send(string, {
    username: member.nickname,
    avatarURL: user.avatarURL
  });
};
