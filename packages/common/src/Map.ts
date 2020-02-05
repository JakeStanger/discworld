import { Tile } from "./Tile";

export function encodeMap() {
  // TODO: Write function
}

function isBuffer(buffer: Buffer | ArrayBuffer): buffer is Buffer {
  return (buffer as Buffer).readUInt8 !== undefined;
}

function readUInt8(buffer: Buffer | ArrayBuffer, ptr: number) {
  if(isBuffer(buffer)) {
    return buffer.readUInt8(ptr);
  } else {
    return new Uint8Array(buffer.slice(ptr, ptr+1))[0];
  }
}

function readUInt16(buffer: Buffer | ArrayBuffer, ptr: number) {


  if(isBuffer(buffer)) {
    return buffer.readUInt16LE(ptr);
  } else {
    return new Uint16Array(buffer.slice(ptr, ptr+2))[0];
  }
}

export type MapDictionary = {[key in Tile]: number[]};

export function decodeMap(buffer: Buffer | ArrayBuffer): MapDictionary {
  let ptr = 0;
  const numTiles = readUInt8(buffer, ptr);
  ptr++;

  const presentTiles = [];
  while(ptr < numTiles + 1) {
    presentTiles.push(readUInt8(buffer, ptr));
    ptr++;
  }

  const tileCount = [];
  while(ptr < numTiles + 1 + numTiles * 2) {
    tileCount.push(readUInt16(buffer, ptr));
    ptr += 2;
  }

  const indexes: MapDictionary = {} as MapDictionary;
  for(const tile of presentTiles) {
    const nextBoundary = ptr + tileCount[presentTiles.indexOf(tile)] * 2;
    indexes[tile] = [];

    while(ptr < nextBoundary) {
      indexes[tile].push(readUInt16(buffer, ptr));
      ptr += 2;
    }
  }

  return indexes;
}
