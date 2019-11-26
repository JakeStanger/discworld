import * as config from "./config.json";
import * as Discord from "discord.js";
import * as kleur from "kleur";
import Database from "./database";
const client = new Discord.Client();

import * as commands from "./commands";
import IDatabaseConfig from "./database/IDatabaseConfig";
import { writeMessage } from "./commands/sync";
import WebServer from "./server";


client.on('ready', () => {
  console.log(`Logged in as ${kleur.cyan(client.user.tag)}`);
});

client.on('message', async msg => {
    const content = msg.content;
    if(content.startsWith(config.prefix)) {
        const command = content.substr(1).split(" ")[0];
        if(command in commands) {
            console.log(`Command: ${kleur.green(command)}`);
            commands[command](msg);
        }
    }

    await writeMessage(msg, true);
});

async function init() {
  const database = new Database();
  await database.setup(config.database as IDatabaseConfig);

  await client.login(config.token);
}

init().then(() => {
  new WebServer(client).listen();
});