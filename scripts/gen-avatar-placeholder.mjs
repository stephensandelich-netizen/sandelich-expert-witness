// Generates a plain neutral square PNG to use as an avatar placeholder for
// anonymous testimonials (no real photo, and no reason to fake one).
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const SIZE = 240;
const [r, g, b] = [0xd8, 0xdc, 0xdd]; // neutral gray, matches site palette

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 2; // color type: RGB
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const rowLen = SIZE * 3 + 1;
const raw = Buffer.alloc(rowLen * SIZE);
for (let y = 0; y < SIZE; y++) {
  const rowStart = y * rowLen;
  raw[rowStart] = 0; // no filter
  for (let x = 0; x < SIZE; x++) {
    const px = rowStart + 1 + x * 3;
    raw[px] = r;
    raw[px + 1] = g;
    raw[px + 2] = b;
  }
}
const idat = deflateSync(raw);

const png = Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
writeFileSync(new URL("../src/assets/images/testimonials/anonymous.png", import.meta.url), png);
console.log("Wrote anonymous.png placeholder avatar");
