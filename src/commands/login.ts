import { Message } from "discord.js";
import WebsocketServer from "../server/Websocket";
import DiscordHelper from "../utils/DiscordHelper";

export const login = async (msg: Message) => {
  const code = msg.content.split(" ")[1];
  if (!code) return await DiscordHelper.sendError(msg.channel, "No code specified");

  if (/[^\d]/.test(code))
    return await DiscordHelper.sendError(msg.channel, "Invalid code format");

  const connection = WebsocketServer.get().getConnectionByGameId(parseInt(code));
  if (!connection) return await DiscordHelper.sendError(msg.channel, "Client not found");

  connection.login(msg.member);

  await DiscordHelper.sendSuccess(msg.channel, `Logged in as Player #${connection.client.id}`);
};

login.help = "<id> - Logs in as a game character";
