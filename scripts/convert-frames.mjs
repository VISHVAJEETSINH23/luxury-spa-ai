/**
 * Hero frames → WebP. Writes two sets next to the source JPGs:
 *   public/frames/frame_0001.webp     1440 wide, for desktop
 *   public/frames/m/frame_0001.webp    768 wide, for phones
 *
 *   node scripts/convert-frames.mjs
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import ffmpeg from "ffmpeg-static";

const dir = path.resolve("public/frames");
const mobileDir = path.join(dir, "m");
mkdirSync(mobileDir, { recursive: true });

const sources = readdirSync(dir).filter((f) => /^frame_\d{4}\.jpg$/.test(f)).sort();

function encode(input, output, width, quality) {
  if (existsSync(output)) return;
  const result = spawnSync(ffmpeg, [
    "-hide_banner", "-loglevel", "error", "-y",
    "-i", input,
    "-vf", `scale=${width}:-2`,
    "-c:v", "libwebp", "-quality", String(quality), "-compression_level", "6",
    output,
  ]);
  if (result.status !== 0) throw new Error(`${input}: ${result.stderr}`);
}

sources.forEach((file, i) => {
  const input = path.join(dir, file);
  const name = file.replace(/\.jpg$/, ".webp");
  encode(input, path.join(dir, name), 1440, 72);
  encode(input, path.join(mobileDir, name), 768, 68);
  if ((i + 1) % 100 === 0) console.log(`${i + 1}/${sources.length}`);
});

console.log(`done: ${sources.length} frames`);
