// Prepares the client's official logo (Vednath Ayurved Logo Treadmark/) for the web:
//  - assets/brand/vednath-logo.svg : official SVG with the empty margins trimmed (tight viewBox)
//  - assets/brand/emblem-*.png     : the sun + Shiva emblem, for favicons / app icons
//  - favicon-32.png, apple-touch-icon, icon-192/512
// The original source files (.ai/.eps/.pdf) stay out of the repo (see .gitignore).
// Usage: node scripts/brand.mjs
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const SRC_DIR = 'Vednath Ayurved Logo Treadmark';
const svgPath = `${SRC_DIR}/SVG/Vednath Ayurved.svg`;
await mkdir('assets/brand', { recursive: true });

let svg = await readFile(svgPath, 'utf8');
const [, , vbW, vbH] = svg.match(/viewBox="([\d.\s-]+)"/)[1].trim().split(/\s+/).map(Number);

// Find the drawn area by rendering and trimming, then map pixels back to viewBox units.
const SCALE = 4;
const png = await sharp(Buffer.from(svg), { density: 72 * SCALE }).png().toBuffer();
const { info } = await sharp(png).trim({ threshold: 2 }).toBuffer({ resolveWithObject: true });
const full = await sharp(png).metadata();
const ux = vbW / full.width, uy = vbH / full.height;
const pad = 4; // viewBox units of breathing room
const x = Math.max(0, -info.trimOffsetLeft * ux - pad);
const y = Math.max(0, -info.trimOffsetTop * uy - pad);
const w = Math.min(vbW - x, info.width * ux + pad * 2);
const h = Math.min(vbH - y, info.height * uy + pad * 2);
svg = svg.replace(/viewBox="[^"]+"/, `viewBox="${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}"`)
  .replace('<svg ', `<svg role="img" aria-label="Vednath Ayurved" width="${Math.round(w)}" height="${Math.round(h)}" `);
await writeFile('assets/brand/vednath-logo.svg', svg);
console.log('logo viewBox', x.toFixed(1), y.toFixed(1), w.toFixed(1), h.toFixed(1), `(ratio ${(w / h).toFixed(3)})`);

// Emblem (sun + Shiva) = left ~38% and top ~62% of the trimmed logo.
const trimmed = await sharp(Buffer.from(svg), { density: 72 * 6 }).png().toBuffer();
const tm = await sharp(trimmed).metadata();
const emblem = await sharp(trimmed)
  .extract({ left: 0, top: 0, width: Math.round(tm.width * 0.375), height: Math.round(tm.height * 0.475) })
  .trim({ threshold: 2 })
  .toBuffer();
// Icons: emblem centred on a square with ~8% padding. Opaque icons are composited onto
// the paper colour; the favicon stays transparent.
const square = async (size, bg) => {
  const inner = Math.round(size * 0.84);
  const art = await sharp(emblem).resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const off = Math.round((size - inner) / 2);
  return sharp({ create: { width: size, height: size, channels: 4, background: bg } })
    .composite([{ input: art, left: off, top: off }])
    .png({ compressionLevel: 9 });
};
await (await square(512, '#FBF7EF')).toFile('assets/brand/emblem-512.png');
await (await square(192, '#FBF7EF')).toFile('assets/brand/emblem-192.png');
await (await square(180, '#FBF7EF')).toFile('assets/brand/apple-touch-icon.png');
await (await square(32, { r: 0, g: 0, b: 0, alpha: 0 })).toFile('favicon-32.png');
await sharp(emblem).resize({ width: 600 }).webp({ quality: 85, alphaQuality: 90 }).toFile('assets/brand/emblem.webp');
console.log('emblem + icons written');
