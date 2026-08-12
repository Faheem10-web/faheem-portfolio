/**
 * trim-chatbot-v2.mjs
 * More conservative trim — uses threshold 240 (catches soft white edges)
 * and 8% padding to ensure the FULL round sphere is 100% visible.
 */

import sharp from "sharp";
import { resolve } from "path";

const ROOT = resolve(".");
const SRC  = resolve(ROOT, "public/assets/chatboart.png");
const DST  = resolve(ROOT, "public/assets/chatbot-cropped.png");

// 1. Load RGBA pixel buffer
const imgMeta = await sharp(SRC).metadata();
const { width: W, height: H } = imgMeta;
console.log(`Source: ${W}x${H}px`);

const { data } = await sharp(SRC)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const pixels = data;

// Conservative background: alpha<20 OR all channels>=240 (near-white)
// This catches soft AA edges of the white sphere shell
function isBackground(r, g, b, a) {
  if (a < 20) return true;
  // Pure white / near-white background pixels
  if (r >= 240 && g >= 240 && b >= 240) return true;
  return false;
}

// 2. Find bounding box of robot content
let minX = W, minY = H, maxX = 0, maxY = 0;

for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    const r = pixels[i], g = pixels[i+1], b = pixels[i+2], a = pixels[i+3];
    if (!isBackground(r, g, b, a)) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}

console.log(`Robot bbox: (${minX},${minY}) -> (${maxX},${maxY})`);
const robotW = maxX - minX + 1;
const robotH = maxY - minY + 1;
console.log(`Robot dimensions: ${robotW}x${robotH}px`);

// 3. Generous safe padding: 8% of largest dimension, min 20px
const largest = Math.max(robotW, robotH);
const pad = Math.max(20, Math.round(largest * 0.08));

// Square canvas, robot centred
const inner  = largest;
const canvas = inner + pad * 2;
const offsetX = pad + Math.round((inner - robotW) / 2) - minX;
const offsetY = pad + Math.round((inner - robotH) / 2) - minY;

console.log(`Padding: ${pad}px each side`);
console.log(`Canvas: ${canvas}x${canvas}px`);
console.log(`Robot fill: ${(100 * inner / canvas).toFixed(1)}%`);

// 4. Build transparent output buffer — copy non-background pixels
const outBuf = Buffer.alloc(canvas * canvas * 4, 0);

for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const si = (y * W + x) * 4;
    const r = pixels[si], g = pixels[si+1], b = pixels[si+2], a = pixels[si+3];
    if (isBackground(r, g, b, a)) continue;

    const outX = x + offsetX;
    const outY = y + offsetY;
    if (outX < 0 || outX >= canvas || outY < 0 || outY >= canvas) continue;

    const di = (outY * canvas + outX) * 4;
    outBuf[di]   = r;
    outBuf[di+1] = g;
    outBuf[di+2] = b;
    outBuf[di+3] = a;
  }
}

// 5. Write PNG with transparency
await sharp(outBuf, { raw: { width: canvas, height: canvas, channels: 4 } })
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(DST);

console.log("DONE: " + DST);
console.log(`Full round robot — ${(100 * inner / canvas).toFixed(1)}% fill, ${pad}px breathing room`);
