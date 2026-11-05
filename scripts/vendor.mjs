// Copies third-party runtime files from node_modules into /assets so the site is fully
// self-hosted (no CDN, no render-blocking third-party requests).
// Run after `npm install` or after upgrading a package: npm run vendor
import { copyFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const nm = (...p) => join(ROOT, 'node_modules', ...p);

const files = [
  // GSAP (all plugins are free since 3.13). Loaded lazily by assets/js/motion.js.
  [nm('gsap/dist/gsap.min.js'), 'assets/vendor/gsap/gsap.min.js'],
  [nm('gsap/dist/ScrollTrigger.min.js'), 'assets/vendor/gsap/ScrollTrigger.min.js'],
  [nm('gsap/dist/SplitText.min.js'), 'assets/vendor/gsap/SplitText.min.js'],
  [nm('gsap/dist/DrawSVGPlugin.min.js'), 'assets/vendor/gsap/DrawSVGPlugin.min.js'],
  // Fonts (OFL). Latin subset only; variable axes.
  [nm('@fontsource-variable/fraunces/files/fraunces-latin-opsz-normal.woff2'), 'assets/fonts/fraunces-opsz.woff2'],
  [nm('@fontsource-variable/fraunces/files/fraunces-latin-opsz-italic.woff2'), 'assets/fonts/fraunces-opsz-italic.woff2'],
  [nm('@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2'), 'assets/fonts/manrope.woff2'],
  // Gujarati (used only on /gu/ pages). Whole Gujarati block kept so conjuncts shape correctly.
  [nm('@fontsource/hind-vadodara/files/hind-vadodara-gujarati-400-normal.woff2'), 'assets/fonts/hind-vadodara-400.woff2'],
  [nm('@fontsource/hind-vadodara/files/hind-vadodara-gujarati-600-normal.woff2'), 'assets/fonts/hind-vadodara-600.woff2'],
];

for (const [from, to] of files) {
  const dest = join(ROOT, to);
  await mkdir(join(dest, '..'), { recursive: true });
  await copyFile(from, dest);
  console.log('copied', to);
}
