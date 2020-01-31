import {
  Client,
  DMChannel,
  GroupDMChannel,
  Message,
  RichEmbedOptions,
  TextChannel
} from "discord.js";
import * as config from "../config.json";

type MessageChannel = TextChannel | DMChannel | GroupDMChannel;

class DiscordHelper {
  public static client: Client;

  public static readonly COLOR_SUCCESS = 0x6eff64;
  public static readonly COLOR_ONGOING = 0xffbf00;
  public static readonly COLOR_ERROR = 0xb32b14;

  public static getGuild() {
    return DiscordHelper.client.guilds.get(config.guild);
  }

  public static getDefaultChannel() {
    return DiscordHelper.getGuild().channels.get(config.defaultChannel);
  }

  public static getChannelByName(name: string) {
    return DiscordHelper.getGuild().channels.find(c => c.name === name);
  }

  public static getMember(id: string) {
    return DiscordHelper.getGuild().members.get(id);
  }

  public static async sendEmbed(sendObj: MessageChannel | Message, embed: RichEmbedOptions | string): Promise<Message> {
    return (DiscordHelper.isMessage(sendObj) ?
      await sendObj.edit("", { embed: DiscordHelper.getEmbed(embed) }) :
      await sendObj.send("", { embed: DiscordHelper.getEmbed(embed) })) as Message;
  }

  public static async sendSuccess(sendObj: MessageChannel | Message, embed: RichEmbedOptions | string) {
    return await DiscordHelper.sendEmbed(sendObj, {
      ...DiscordHelper.getEmbed(embed),
      color: DiscordHelper.COLOR_SUCCESS
    })
  }

  public static async sendOngoing(sendObj: MessageChannel, embed: RichEmbedOptions | string) {
    return await DiscordHelper.sendEmbed(sendObj, {
      ...DiscordHelper.getEmbed(embed),
      color: DiscordHelper.COLOR_ONGOING
    })
  }

  public static async sendError(sendObj: MessageChannel | Message, embed: RichEmbedOptions | string) {
    return await DiscordHelper.sendEmbed(sendObj, {
      ...DiscordHelper.getEmbed(embed),
      color: DiscordHelper.COLOR_ERROR
    })
  }

  private static isMessage(sendObj: MessageChannel | Message): sendObj is Message {
    return (sendObj as Message).author !== undefined;
  }

  private static getEmbed(embed: RichEmbedOptions | string): RichEmbedOptions {
    return typeof embed === "string" ? { title: embed } : embed;
  }
}

export default DiscordHelper;
