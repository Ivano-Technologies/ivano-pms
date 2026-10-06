/**
 * Builds favicon.ico + standard PNG sizes from `public/brand/iv1-mark.svg`, set on a
 * paper #FAF7F2 tile. Optical centring matches the company site favicon: the IV1 mark is
 * visually heavy on its right arm, so it is nudged slightly left and kept at ~72% of the tile.
 * Run via `pnpm run generate:favicons` or web `prebuild`.
 */
import { readFile, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import pngToIco from "png-to-ico";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const markSvg = join(root, "public/brand/iv1-mark.svg");
const publicDir = join(root, "public");
const PAPER = "#FAF7F2";

async function tile(svg, size, { rounded = false } = {}) {
  const markW = Math.round(size * 0.72);
  const mark = await sharp(svg, { density: 384 }).resize({ width: markW }).png().toBuffer();
  const meta = await sharp(mark).metadata();
  const left = Math.round((size - (meta.width ?? markW)) / 2 - size * 0.015);
  const top = Math.round((size - (meta.height ?? markW)) / 2);
  const radius = rounded ? Math.round(size * 0.22) : 0;
  const bg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="${PAPER}"/></svg>`
  );
  return sharp(bg).composite([{ input: mark, left, top }]).png().toBuffer();
}

async function main() {
  const svg = await readFile(markSvg);

  const buf32 = await tile(svg, 32);
  await writeFile(join(publicDir, "favicon-32x32.png"), buf32);

  const buf48 = await tile(svg, 48);
  const buf16 = await tile(svg, 16);

  const buf180 = await tile(svg, 180);
  await writeFile(join(publicDir, "apple-touch-icon.png"), buf180);

  const ico = await pngToIco([buf16, buf32, buf48]);
  await writeFile(join(publicDir, "favicon.ico"), ico);
  await writeFile(join(root, "src/app/favicon.ico"), ico);

  const icon = await tile(svg, 512, { rounded: true });
  await writeFile(join(root, "src/app/icon.png"), icon);

  console.warn(
    "generate-favicons: wrote favicon.ico, favicon-32x32.png, apple-touch-icon.png, app/icon.png"
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
