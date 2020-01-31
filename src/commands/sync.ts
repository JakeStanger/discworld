import {Message, RichEmbedOptions} from "discord.js";
import DBMessage from "../database/models/Message";
import * as kleur from "kleur";
import Reaction from "../database/models/Reaction";
import Mention from "../database/models/Mention";
import {DateTime} from "luxon";

let msgCount: number = 0;
let prevMonth: string;
let syncInProgress: boolean = false;

export async function writeMessage(msg: Message, log = false) {
  if (!msg.author.bot && msg.content) {
    try {
      const exists = await DBMessage.findOne({where: {id: msg.id}});

      if (exists) return;

      if(log) console.log("Write message: ", kleur.cyan(msg.id));

      const [message] = await DBMessage.findOrCreate({
        where: {
          id: msg.id,
          content: msg.content,
          timestamp: msg.createdTimestamp,
          authorId: msg.author.id,
          channelId: msg.channel.id
        }
      });

      await Promise.all(msg.reactions.map(react => new Promise(resolve =>
        Reaction.findOrCreate({where: {emojiId: react.emoji.identifier, MessageId: msg.id}}).then(resolve)
      )));

      await Promise.all(msg.mentions.users.map(mention => new Promise(resolve =>
        Mention.findOrCreate({where: {userId: mention.id, MessageId: msg.id}})
          .then(m => message.addMention(m)).then(resolve)
      )));

      msgCount++;
    } catch (err) {
      console.error(err);
    }


  }
}

async function getNextMessageSet(msg: Message, statusMessage: Message) {
  console.log(`Fetching before: ${kleur.cyan(DateTime.fromMillis(msg.createdTimestamp).toISO())}`,
    kleur.magenta(msgCount));

  if (DateTime.fromMillis(msg.createdTimestamp).toFormat("yyyy-MM") != prevMonth)
    await statusMessage.edit("", {embed: getEmbed(msg)});
  prevMonth = DateTime.fromMillis(msg.createdTimestamp).toFormat("yyyy-MM");

  const messages = await msg.channel.fetchMessages({before: msg.id});
  await Promise.all(messages.map(msg =>
    new Promise(resolve => writeMessage(msg).then(resolve))));


  const last = messages.last();
  if (last && last.id !== msg.id) {
    await getNextMessageSet(messages.last(), statusMessage);
  }

}

function getEmbed(msg: Message, progress = true): RichEmbedOptions {
  return {
    title: progress ? "Syncing" : "Sync complete",
    description: `Syncing at: **${progress ?
      DateTime.fromMillis(msg.createdTimestamp).toFormat("yyyy-MM")
      : prevMonth}**\nMessage count: **${msgCount}**`,
    color: progress ? 0xffbf00 : 0x6eff64
  };
}

export const sync = async (msg: Message) => {
  if (syncInProgress) return;
  syncInProgress = true;
  msgCount = 0;

  prevMonth = DateTime.fromMillis(msg.createdTimestamp).toFormat("yyyy-MM");

  const statusMessage: Message = await msg.reply("", {embed: getEmbed(msg)}) as Message;

  await getNextMessageSet(msg, statusMessage);
  console.log(kleur.green("Sync complete"));

  await statusMessage.edit("", {embed: getEmbed(msg, false)});
  syncInProgress = false;
};

sync.help = "Synchronises all messages in the channel with the database";
