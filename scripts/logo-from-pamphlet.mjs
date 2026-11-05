// INTERIM logo: crops the wordmark from the official pamphlet and keys out the cream
// background so it sits on any light surface. Replace with the clinic's vector logo
// (see TODO-CLIENT.md) as soon as it arrives.
// Usage: node scripts/logo-from-pamphlet.mjs
import sharp from 'sharp';

const SRC = 'docs/source/pamphlet.png';
const crop = { left: 50, top: 28, width: 310, height: 140 };

const { data, info } = await sharp(SRC)
  .extract(crop)
  .resize({ width: 620, kernel: 'lanczos3' })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

// Background colour sampled from the top-left corner.
const [br, bg, bb] = [data[0], data[1], data[2]];
for (let i = 0; i < data.length; i += 4) {
  const d = Math.hypot(data[i] - br, data[i + 1] - bg, data[i + 2] - bb);
  // Soft key: fully transparent near the background, fully opaque past 70.
  const a = Math.max(0, Math.min(1, (d - 22) / 48));
  data[i + 3] = Math.round(a * 255);
}

const img = sharp(data, { raw: info }).trim({ threshold: 1 });
await img.clone().png({ compressionLevel: 9, palette: true }).toFile('assets/img/logo.png');
await img.clone().webp({ quality: 88, alphaQuality: 90 }).toFile('assets/img/logo.webp');
const meta = await sharp('assets/img/logo.png').metadata();
console.log('logo', meta.width, 'x', meta.height);

// Favicon set from the sun emblem (left part of the mark).
const emblem = await sharp(SRC).extract({ left: 58, top: 30, width: 118, height: 98 }).toBuffer();
const square = await sharp(emblem)
  .resize(512, 512, { fit: 'contain', background: '#F4EDE0' })
  .png()
  .toBuffer();
await sharp(square).resize(180).png({ palette: true, quality: 85, compressionLevel: 9 }).toFile('assets/img/apple-touch-icon.png');
await sharp(square).resize(192).png({ palette: true, quality: 85, compressionLevel: 9 }).toFile('assets/img/icon-192.png');
await sharp(square).resize(512).png({ palette: true, quality: 85, compressionLevel: 9 }).toFile('assets/img/icon-512.png');
await sharp(square).resize(32).png({ palette: true, quality: 85, compressionLevel: 9 }).toFile('favicon-32.png');
console.log('favicons done');

