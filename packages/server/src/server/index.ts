import * as express from "express";
import * as kleur from "kleur";
import * as config from "../config.json";
import { Client } from "discord.js";
import * as http from "http";
import WebsocketServer from "./Websocket";

class WebServer {
  private readonly app: express.Express;
  private readonly discord: Client;

  private readonly server: http.Server;

  constructor(discord: Client) {
    this.app = express();

    this.app.use(this._logger);
    this.app.use(express.static('public'));

    this.discord = discord;

    this.server = http.createServer(this.app);

    this.routes();


    http.createServer()
  }

  private _logger(request: express.Request, response: express.Response, next) {
    console.log(`${kleur.magenta(request.method)} ${kleur.cyan(request.path)}`);
    next();
  }

  public listen() {
    this.server.listen(config.port);
    new WebsocketServer();
    console.log("Server listening on " + kleur.cyan(config.port));
    console.log("Websocket server listening on " + kleur.cyan(config.port + 1));
  }

  public routes() {
    const app = this.app;

    app.get("/channels", async (req, res) => {
      const channels = this.discord.guilds.get(config.guild).channels
        .filter(c => c.type === "text")
        .map(channel => ({
          name: channel.name,
          id: channel.id,
        }));

      return res.json(channels);
    });
  }
}

export default WebServer;
