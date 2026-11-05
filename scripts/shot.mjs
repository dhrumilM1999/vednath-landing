// Quick full-page screenshots of one or more URLs for design review (dev only).
// Usage: node scripts/shot.mjs <outDir> <width> <url> [url...]
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const [out, width, ...urls] = process.argv.slice(2);
await mkdir(out, { recursive: true });
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: Number(width), height: Number(width) < 700 ? 820 : 900 }, deviceScaleFactor: 1 });
for (const url of urls) {
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1800);
  // force-render lazy sections + reveal everything for a static review shot
  await p.addStyleTag({ content: '*{content-visibility:visible!important}[data-reveal]{opacity:1!important;transform:none!important}' });
  await p.waitForTimeout(300);
  const name = url.replace(/^https?:\/\/[^/]+/, '').replace(/\/$/, '').replace(/\//g, '_') || '_home';
  await p.screenshot({ path: `${out}/${name}-${width}.jpg`, type: 'jpeg', quality: 72, fullPage: true });
  console.log('shot', name, width);
  await p.close();
}
await b.close();
