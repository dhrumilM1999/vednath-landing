// Verifies the WCAG contrast ratios claimed in assets/css/tokens.css.
// Usage: node scripts/check-contrast.mjs   (exits 1 if any text pair < 4.5:1)
const hex = (h) => h.replace('#', '').match(/../g).map((x) => parseInt(x, 16) / 255);
const lum = (h) => {
  const [r, g, b] = hex(h).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

const pairs = [
  ['ink on bg', '#1c2620', '#f4ede0'],
  ['ink-soft on bg', '#33433a', '#f4ede0'],
  ['ink-muted on bg', '#4a5a4f', '#f4ede0'],
  ['ink-muted on bg-deep', '#4a5a4f', '#ebe2d0'],
  ['ink-muted on surface', '#4a5a4f', '#fbf6ec'],
  ['forest on bg', '#1f4a3a', '#f4ede0'],
  ['sage on bg', '#4c6353', '#f4ede0'],
  ['saffron-text on bg', '#9a4a0e', '#f4ede0'],
  ['saffron-text on bg-deep', '#9a4a0e', '#ebe2d0'],
  ['saffron-text on surface', '#9a4a0e', '#fbf6ec'],
  ['kumkum on bg', '#8e2a24', '#f4ede0'],
  ['on-forest on forest', '#f4ede0', '#1f4a3a'],
  ['on-forest on forest-deep', '#f4ede0', '#143329'],
  ['on-forest-muted on forest', '#c9d1bf', '#1f4a3a'],
  ['on-forest-muted on forest-deep', '#c9d1bf', '#143329'],
  ['gold-soft on forest', '#e3cf9c', '#1f4a3a'],
  ['white on whatsapp btn', '#ffffff', '#1d5c3f'],
  ['white on saffron-text btn', '#ffffff', '#9a4a0e'],
  ['on-forest on mobile bar', '#f4ede0', '#143329'],
];

let fail = 0;
for (const [name, fg, bg] of pairs) {
  const r = ratio(fg, bg);
  const ok = r >= 4.5;
  if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${r.toFixed(2).padStart(5)}:1  ${name}`);
}
process.exit(fail ? 1 : 0);
