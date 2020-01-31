import {Message} from "discord.js";
import {Canvas, loadImage} from "canvas";
import {existsSync, writeFileSync} from "fs";

function getType(r: number, g: number, b: number, a: number) {
  // Void
  if (r === 0 && g === 0 && b === 0 && a === 0) return 0;

  // Ground
  if (r === 0 && g === 0 && b === 0 && a === 255) return 1;

  // Wall
  if (r === 255 && g === 0 && b === 0) return 2;

  // Spawn
  if(r === 0 && g === 255 && b === 0) return 3;

  // Channel
  if(r === 0 && g === 0 && b === 255) return 4;

  // Exit
  if(r === 255 && g === 255 && b === 255) return 5;
}

export const genmap = async (msg: Message) => {
  const mapName = msg.content.split(" ")[1];
  if (!mapName) return await msg.reply("No map name specified");

  if (!existsSync(`maps/${mapName}.png`)) return await msg.reply("That map does not exist");
  const image = await loadImage(`maps/${mapName}.png`);

  const MAP_SIZE = 64;

  const canvas = new Canvas(MAP_SIZE, MAP_SIZE);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, MAP_SIZE, MAP_SIZE).data;

  const mapData = [];
  for (let i = 0; i < imageData.length; i += 4) {
    const type = getType(imageData[i], imageData[i + 1], imageData[i + 2], imageData[i + 3]);
    mapData.push(type);
  }

  writeFileSync(`public/map/${mapName}.json`, JSON.stringify(mapData));

  return await msg.reply("Map data generated");
};

genmap.help = "Generates a game map from an image";
