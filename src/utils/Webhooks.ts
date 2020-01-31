import {Channel, Client, Collection, Webhook} from "discord.js";
import * as config from "../config.json";
import fetch from "node-fetch";
import * as kleur from "kleur";
import DiscordHelper from "./DiscordHelper";

class Webhooks {
  private static instance: Webhooks;

  private webhooks: Collection<string, Webhook>;

  constructor() {
    Webhooks.instance = this;
  }

  public static get() {
    return Webhooks.instance;
  }

  public async load() {
    const client = DiscordHelper.client;

    const channels = await client.guilds.get(config.guild).channels;

    const existingWebhooks = await client.guilds.get(config.guild).fetchWebhooks();

    await Promise.all(channels.map(channel => new Promise(resolve => {
      const existingHook = existingWebhooks.find(hook => hook.channelID === channel.id);
      if (!existingHook) {
        fetch(`https://discordapp.com/api/v6/channels/${channel.id}/webhooks`, {
          method: "POST",
          headers: {
            Authorization: "Bot " + client.token,
            Accept: "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: channel.name
          })
        }).then(resolve).catch(console.error);
      } else resolve();
    })));

    this.webhooks = await client.guilds.get(config.guild).fetchWebhooks();
  }

  public getHook(channel: Channel) {
    return this.webhooks.find(hook => hook.channelID === channel.id);
  }
}

export default Webhooks;
