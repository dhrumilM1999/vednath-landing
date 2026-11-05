// Builds the v2 web fonts from node_modules into assets/fonts/.
//  - Anek Latin (Ek Type, an Indian foundry): display face. The variable file is 100+ KB,
//    so we pin the width axis to a condensed instance and keep only the weights and
//    characters we use (HarfBuzz instancer via subset-font).
//  - Hind (Latin) + Hind Vadodara (Gujarati): text faces from the same family, so
//    English and Gujarati pages feel like one publication.
// Usage: node scripts/fonts.mjs
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import subsetFont from 'subset-font';

const OUT = 'assets/fonts';
await mkdir(OUT, { recursive: true });

const ascii = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join('');
const extra = '₹–—‘’“”•…→←↗↓★·×©®™§°½¼¾';

const anek = await readFile('node_modules/@fontsource-variable/anek-latin/files/anek-latin-latin-wdth-normal.woff2');
for (const [width, name] of [[75, 'anek-condensed'], [100, 'anek']]) {
  const out = await subsetFont(anek, ascii + extra, {
    targetFormat: 'woff2',
    variationAxes: { wdth: width, wght: { min: 400, max: 800 } },
  });
  await writeFile(`${OUT}/${name}.woff2`, out);
  console.log(`${name}.woff2`, (out.length / 1024).toFixed(1), 'KB');
}

const copies = [
  ['@fontsource/hind/files/hind-latin-400-normal.woff2', 'hind-400.woff2'],
  ['@fontsource/hind/files/hind-latin-600-normal.woff2', 'hind-600.woff2'],
  ['@fontsource/hind-vadodara/files/hind-vadodara-gujarati-400-normal.woff2', 'hind-vadodara-400.woff2'],
  ['@fontsource/hind-vadodara/files/hind-vadodara-gujarati-600-normal.woff2', 'hind-vadodara-600.woff2'],
  ['@fontsource/hind-vadodara/files/hind-vadodara-gujarati-700-normal.woff2', 'hind-vadodara-700.woff2'],
];
for (const [from, to] of copies) {
  await copyFile(`node_modules/${from}`, `${OUT}/${to}`);
  console.log('copied', to);
}
