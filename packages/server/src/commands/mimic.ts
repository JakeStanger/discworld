import {Message} from "discord.js";
import Markov from "../utils/Markov";
import Webhooks from "../utils/Webhooks";
import DiscordHelper from "../utils/DiscordHelper";

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

export const genchain = async (msg: Message) => {
  const statusMessage = await DiscordHelper.sendOngoing(msg.channel, "Rebuilding your chain");

  await Markov.get().regenerateChain(msg.author);

  return await DiscordHelper.sendSuccess(statusMessage, "Chain rebuilt");
};

mimic.help = "Imitates you or a mentioned person";
genchain.help = "Regenerates your markov chain";
