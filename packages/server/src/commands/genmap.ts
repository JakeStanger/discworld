import { Message } from "discord.js";
import { Canvas, loadImage } from "canvas";
import { appendFileSync, existsSync, writeFileSync } from "fs";
import { Tile } from "@discworld/common";
import { groupBy, map } from "lodash";

function getType(r: number, g: number, b: number, a: number): Tile {
  // transparent
  if (r === 0 && g === 0 && b === 0 && a === 0) return Tile.Void;

  // black
  if (r === 0 && g === 0 && b === 0 && a === 255) return Tile.Ground;

  // red
  if (r === 255 && g === 0 && b === 0) return Tile.Wall;

  // green
  if (r === 0 && g === 255 && b === 0) return Tile.Spawn;

  // blue
  if (r === 0 && g === 0 && b === 255) return Tile.Channel;

  // white
  if (r === 255 && g === 255 && b === 255) return Tile.Exit;
}

export const genmap = async (msg: Message) => {
  const mapName = msg.content.split(" ")[1];
  if (!mapName) return await msg.reply("No map name specified");

  if (!existsSync(`maps/${mapName}.png`))
    return await msg.reply("That map does not exist");
  const image = await loadImage(`maps/${mapName}.png`);

  const MAP_SIZE = 64;

  const canvas = new Canvas(MAP_SIZE, MAP_SIZE);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, MAP_SIZE, MAP_SIZE).data;

  let mapData = {};
  let presentTiles = [];

  for (let i = 0; i < imageData.length; i += 4) {
    const type = getType(
      imageData[i],
      imageData[i + 1],
      imageData[i + 2],
      imageData[i + 3]
    );

    if(type === Tile.Void) continue;

    if (!mapData[type]) {
      mapData[type] = [];
      presentTiles.push(type);
    }
    const tileIndex = i / 4;
    mapData[type].push(tileIndex);
  }

  presentTiles = presentTiles.sort((a, b) => a -b);

  const fileName = `public/map/${mapName}`;

  // number of tile types
  writeFileSync(fileName, Buffer.from(new Uint8Array([Object.keys(mapData).length])));

  // tiles present
  appendFileSync(
    fileName,
    Buffer.from(new Uint8Array(presentTiles))
  );

  // number of occurrences for each tile
  appendFileSync(
    fileName,
    Buffer.from(new Uint16Array(Object.keys(mapData).map(tile => mapData[tile]).map(tile => tile.length)).buffer)
  );

  // index for each occurrence
  Object.keys(mapData).map(tile => mapData[tile]).forEach(tile => {
    const rows = groupBy(tile, index => Math.floor(index / MAP_SIZE));
    const rowArray = map(rows, row => row.reverse());

    appendFileSync(
      fileName,
      Buffer.from(new Uint16Array([].concat.apply([], rowArray)).buffer)
    );
  });

  return await msg.reply("Map data generated");
};

genmap.help = "Generates a game map from an image";
