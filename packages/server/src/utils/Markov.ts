import MarkovChain from "markov-strings";
import { Client, User } from "discord.js";
import Message from "../database/models/Message";
import * as path from "path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import * as kleur from "kleur";
import * as config from "../config.json";
import { Op } from "sequelize";

class Markov {
  private client: Client;

  private chains: { [key: string]: MarkovChain } = {};

  private static readonly CACHE_DIR = path.join(
    __dirname,
    "../",
    "../",
    "markov"
  );

  private static instance: Markov;

  constructor(client: Client) {
    this.client = client;
    Markov.instance = this;
  }

  public static get() {
    return Markov.instance;
  }

  /**
   * Makes sure a markov chain for each user exists.
   * If one does not exist, it is created.
   */
  public async load() {
    const members = this.client.guilds
      .get(config.guild)
      .members.filter(m => !m.user.bot)
      .map(m => m.user);

    if (!existsSync(Markov.CACHE_DIR)) mkdirSync(Markov.CACHE_DIR);

    console.log("Begin loading markov chains");

    for (let member of members) {
      console.log("Loading markov chain for " + kleur.cyan(member.username));

      if (existsSync(path.join(Markov.CACHE_DIR, member.id + ".json")))
        this.chains[member.id] = this._readChain(member);
      else this.chains[member.id] = await this._createChain(member);
    }

    console.log(kleur.green("Markov chains loaded"));
  }

  public generate(member: User) {
    return this.chains[member.id]?.generate().string || "";
  }

  private _readChain(member: User): MarkovChain {
    const fileName = path.join(Markov.CACHE_DIR, member.id + ".json");
    const chainData = JSON.parse(readFileSync(fileName).toString());

    const chain = new MarkovChain([""]);

    chain.startWords = chainData.startWords;
    chain.endWords = chainData.endWords;
    chain.corpus = chainData.corpus;
    chain.data = chainData.data;
    chain.options = chainData.options;

    console.log(
      kleur.green("Loaded cached chain for " + kleur.cyan(member.username))
    );

    return chain;
  }

  private async _createChain(member: User): Promise<MarkovChain> {
    console.log(
      kleur.green("Generating new chain for " + kleur.cyan(member.username))
    );

    // TODO: Filter out junk messages
    const messages = (await Message.findAll({
      where: {
        authorId: member.id,
        content: {
          [Op.and]: {
            [Op.notRegexp]: "^[!|$|>|.]"
          },
          [Op.like]: "% %"
        }
      },
      attributes: ["content"]
    })) as Message[];

    const chainMessages = messages
      .map(m => m.content.replace(/[@*`_~]/g, ""))
      .filter(c => c.length > 8);

    if (!chainMessages.length) return null;

    const chain = new MarkovChain(chainMessages);

    chain.buildCorpus();

    const fileName = path.join(Markov.CACHE_DIR, member.id + ".json");
    writeFileSync(fileName, JSON.stringify(chain));

    console.log(
      kleur.green("Generated chain for " + kleur.cyan(member.username))
    );

    return chain;
  }

  public async regenerateChain(member: User) {
    this.chains[member.id] = await this._createChain(member);
  }
}

export default Markov;
