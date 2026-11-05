// Generates the hero sun-ray mandala (inspired by the rays in the Vednath logo) as an SVG,
// then renders the LCP poster images (AVIF + WebP, several widths) with sharp.
// Usage: node scripts/art.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const C = {
  saffron: '#D9731F',
  glow: '#F2A65A',
  gold: '#B8913A',
  forest: '#1F4A3A',
  sage: '#4C6353',
};

const r2 = (n) => Math.round(n * 100) / 100;
const pt = (r, deg) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [r2(r * Math.cos(a)), r2(r * Math.sin(a))];
};

// Long tapered rays, alternating lengths — echoing the logo's rising sun.
let rays = '';
const RAYS = 40;
for (let i = 0; i < RAYS; i++) {
  const deg = (360 / RAYS) * i;
  const outer = i % 2 ? 418 : 478;
  const w = i % 2 ? 1.5 : 2.1;
  const [x1, y1] = pt(238, deg - w);
  const [x2, y2] = pt(238, deg + w);
  const [x3, y3] = pt(outer, deg);
  rays += `M${x1} ${y1}L${x3} ${y3}L${x2} ${y2}Z`;
}

// Lotus petals between the inner and outer rings.
let petals = '';
const PETALS = 16;
for (let i = 0; i < PETALS; i++) {
  petals += `<path transform="rotate(${(360 / PETALS) * i})" d="M0 -118C30 -146 32 -186 0 -216C-32 -186 -30 -146 0 -118Z"/>`;
}
let petals2 = '';
for (let i = 0; i < PETALS; i++) {
  petals2 += `<path transform="rotate(${(360 / PETALS) * i + 360 / PETALS / 2})" d="M0 -132C16 -150 17 -172 0 -192C-17 -172 -16 -150 0 -132Z"/>`;
}

// Dot rings.
const dots = (r, n, size) => {
  let s = '';
  for (let i = 0; i < n; i++) {
    const [x, y] = pt(r, (360 / n) * i);
    s += `<circle cx="${x}" cy="${y}" r="${size}"/>`;
  }
  return s;
};

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-500 -500 1000 1000" width="1000" height="1000">
<defs>
<radialGradient id="core" cx="0" cy="0" r="110" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="${C.glow}" stop-opacity=".95"/>
<stop offset=".65" stop-color="${C.saffron}" stop-opacity=".75"/>
<stop offset="1" stop-color="${C.saffron}" stop-opacity="0"/>
</radialGradient>
<linearGradient id="ray" x1="0" y1="-480" x2="0" y2="480" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="${C.saffron}"/>
<stop offset=".5" stop-color="${C.glow}"/>
<stop offset="1" stop-color="${C.gold}"/>
</linearGradient>
</defs>
<path d="${rays}" fill="url(#ray)" opacity=".55"/>
<g fill="${C.gold}" opacity=".7">${dots(492, 80, 2.2)}</g>
<circle r="232" fill="none" stroke="${C.gold}" stroke-width="1.5" opacity=".8"/>
<circle r="224" fill="none" stroke="${C.gold}" stroke-width=".8" stroke-dasharray="2 6" opacity=".9"/>
<g fill="none" stroke="${C.forest}" stroke-width="1.6" opacity=".75">${petals}</g>
<g fill="${C.sage}" fill-opacity=".08" stroke="${C.sage}" stroke-width="1" opacity=".8">${petals2}</g>
<circle r="112" fill="none" stroke="${C.forest}" stroke-width="1.2" opacity=".6"/>
<g fill="${C.forest}" opacity=".55">${dots(100, 36, 1.6)}</g>
<circle r="104" fill="url(#core)"/>
<circle r="46" fill="none" stroke="#fff" stroke-width="1" opacity=".55"/>
</svg>`;

await mkdir('assets/svg', { recursive: true });
await mkdir('assets/img/hero', { recursive: true });
await writeFile('assets/svg/mandala.svg', svg);

const base = sharp(Buffer.from(svg), { density: 144 });
for (const w of [520, 820, 1200]) {
  const buf = await base.clone().resize(w, w).png().toBuffer();
  await sharp(buf).avif({ quality: 50, effort: 6 }).toFile(`assets/img/hero/mandala-${w}.avif`);
  await sharp(buf).webp({ quality: 74, alphaQuality: 80 }).toFile(`assets/img/hero/mandala-${w}.webp`);
}
console.log('mandala + posters written');

// Open Graph card (1200×630): paper background, sun on the right, logo on the left.
const sun = await base.clone().resize(700, 700).extract({ left: 0, top: 35, width: 600, height: 630 }).png().toBuffer();
const logo = await sharp('assets/img/logo.png').resize({ width: 520 }).toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#F4EDE0' } })
  .composite([
    { input: sun, left: 600, top: 0 },
    { input: logo, left: 80, top: 200 },
  ])
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile('assets/img/og-default.jpg');
console.log('og image written');

