// Full verification of the BUILT site (dist/):
//  - Playwright screenshots at 360 / 768 / 1440 px  → docs/screenshots/
//  - horizontal-scroll, console-error and failed-request checks on key pages
//  - crawl of every internal link on every page (must return 200)
//  - reduced-motion test (no GSAP, no marquee, no shader, content visible)
//  - keyboard test (skip link, visible focus, quiz operable by keyboard)
//  - Lighthouse mobile + desktop                    → docs/lighthouse/
//
// Requires (dev only, not saved to package.json):
//   npm i --no-save playwright@1.56.1 lighthouse@12.8.2 && npx playwright install chromium
// Usage: npm run build && node scripts/verify.mjs
import { spawn } from 'node:child_process';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const DIST = join(ROOT, 'dist');
const PORT = 5181;
const ORIGIN = `http://localhost:${PORT}`;
const SHOTS = join(ROOT, 'docs', 'screenshots');
const LH = join(ROOT, 'docs', 'lighthouse');
await mkdir(SHOTS, { recursive: true });
await mkdir(LH, { recursive: true });

const server = spawn(process.execPath, [join(ROOT, 'scripts', 'serve.mjs'), String(PORT), 'dist'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));

const problems = [];
const fail = (...m) => { problems.push(m.join(' ')); console.log('  ✗', ...m); };
const ok = (...m) => console.log('  ✓', ...m);

const browser = await chromium.launch();

// ---------- 1. Screenshots + per-page checks ----------
console.log('\n1. Screenshots, horizontal scroll, console errors');
const KEY = ['/', '/services/panchakarma/', '/conditions/', '/prakriti-quiz/', '/contact/', '/blog/water-in-sharad-ritu/'];
const PAGES = [...KEY, ...KEY.map((p) => '/gu' + p)];
const WIDTHS = [360, 768, 1440];
for (const width of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width, height: width < 768 ? 780 : 900 }, deviceScaleFactor: 1 });
  for (const path of PAGES) {
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('response', (r) => r.status() >= 400 && r.url().startsWith(ORIGIN) && errors.push(`${r.status()} ${r.url()}`));
    await page.goto(ORIGIN + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
    const name = (path === '/' ? 'home' : path.replace(/^\/|\/$/g, '').replaceAll('/', '-')) || 'home';
    const label = name.startsWith('gu') ? name : `en-${name}`;
    await page.screenshot({ path: join(SHOTS, `${label}-${width}.jpg`), type: 'jpeg', quality: 70, fullPage: path === '/' || path === '/gu/' });
    if (sw > iw) fail(`${path} @${width}: horizontal scroll (${sw} > ${iw})`);
    if (errors.length) fail(`${path} @${width}: ${errors.join(' | ')}`);
    await page.close();
  }
  await ctx.close();
  ok(`${PAGES.length} pages at ${width}px`);
}

// ---------- 2. Link crawl ----------
console.log('\n2. Internal link crawl');
const files = [];
(async function walk() {})();
async function* htmlFiles(d) {
  for (const e of await readdir(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) yield* htmlFiles(p);
    else if (e.name.endsWith('.html')) yield p;
  }
}
for await (const f of htmlFiles(DIST)) {
  const rel = relative(DIST, f).split(sep).join('/');
  files.push(rel === 'index.html' ? '/' : rel.endsWith('/index.html') ? '/' + rel.slice(0, -10) : '/' + rel);
}
const seen = new Set();
const page = await browser.newPage();
for (const url of files) {
  await page.goto(ORIGIN + url);
  const links = await page.$$eval('a[href], link[href], img[src], source[srcset], script[src]', (els) =>
    els.flatMap((e) => (e.getAttribute('href') || e.getAttribute('src') || e.getAttribute('srcset') || '')
      .split(',').map((s) => s.trim().split(/\s+/)[0])));
  for (const l of links) if (l.startsWith('/') && !l.startsWith('//')) seen.add(l.split('#')[0]);
}
let broken = 0;
for (const l of seen) {
  const r = await fetch(ORIGIN + l);
  if (r.status !== 200) { broken++; fail(`broken link ${l} → ${r.status}`); }
}
ok(`${files.length} pages, ${seen.size} unique internal URLs, ${broken} broken`);

// ---------- 3. Reduced motion ----------
console.log('\n3. Reduced motion');
{
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  await p.goto(ORIGIN + '/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(4000);
  const r = await p.evaluate(() => ({
    gsap: !!window.gsap,
    marquee: getComputedStyle(document.querySelector('.marquee__track')).animationName,
    hidden: [...document.querySelectorAll('[data-reveal]')].filter((e) => getComputedStyle(e).opacity !== '1').length,
    shader: !!document.querySelector('.hero__shader.is-live'),
    pinned: !!document.querySelector('[data-journey].is-pinned, [data-hscroll].is-pinned'),
  }));
  r.gsap ? fail('GSAP loaded under reduced motion') : ok('GSAP not loaded');
  r.marquee !== 'none' ? fail('marquee still animating') : ok('marquee static');
  r.hidden ? fail(`${r.hidden} reveal elements hidden`) : ok('all content visible');
  r.shader ? fail('shader running') : ok('no WebGL shader');
  r.pinned ? fail('journey pinned') : ok('journey not pinned (stacked)');
  await ctx.close();
}

// ---------- 4. Keyboard ----------
console.log('\n4. Keyboard');
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  await p.goto(ORIGIN + '/', { waitUntil: 'networkidle' });
  await p.keyboard.press('Tab');
  const first = await p.evaluate(() => ({ cls: document.activeElement.className, outline: getComputedStyle(document.activeElement).outlineStyle }));
  first.cls.includes('skip-link') ? ok('first Tab lands on the skip link') : fail(`first Tab focused "${first.cls}"`);
  await p.keyboard.press('Tab');
  const second = await p.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
  second !== 'none' ? ok('focus ring visible') : fail('no visible focus ring');

  await p.goto(ORIGIN + '/prakriti-quiz/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(500);
  await p.focus('input[name="q1"]');
  await p.keyboard.press('ArrowDown');            // choose an option with arrow keys
  await p.keyboard.press('Tab');                  // → Back (disabled, skipped) → Next
  let active = await p.evaluate(() => document.activeElement.matches('[data-next-q]') ? 'next' : document.activeElement.outerHTML.slice(0, 60));
  if (active !== 'next') { await p.keyboard.press('Tab'); active = await p.evaluate(() => document.activeElement.matches('[data-next-q]') ? 'next' : document.activeElement.outerHTML.slice(0, 60)); }
  await p.keyboard.press('Enter');
  const q2 = await p.evaluate(() => document.querySelectorAll('.quiz__q')[1].classList.contains('is-current'));
  active === 'next' && q2 ? ok('quiz answerable and advanced by keyboard') : fail(`quiz keyboard flow failed (${active}, q2=${q2})`);
  await ctx.close();
}
await browser.close();

// ---------- 5. Lighthouse ----------
console.log('\n5. Lighthouse');
const { default: lighthouse } = await import('lighthouse');
// Playwright launches Chromium with a DevTools port; Lighthouse connects to it.
const LH_PORT = 9333;
const lhBrowser = await chromium.launch({ args: [`--remote-debugging-port=${LH_PORT}`] });
const chrome = { port: LH_PORT, kill: () => lhBrowser.close() };
const scores = [];
for (const path of ['/', '/gu/', '/contact/', '/services/panchakarma/']) {
  for (const formFactor of ['mobile', 'desktop']) {
    const config = formFactor === 'desktop'
      ? (await import('lighthouse/core/config/desktop-config.js')).default
      : undefined;
    const res = await lighthouse(ORIGIN + path, { port: chrome.port, output: 'html', logLevel: 'error' }, config);
    const c = res.lhr.categories;
    const row = {
      page: path, formFactor,
      performance: Math.round(c.performance.score * 100),
      accessibility: Math.round(c.accessibility.score * 100),
      bestPractices: Math.round(c['best-practices'].score * 100),
      seo: Math.round(c.seo.score * 100),
      lcp: res.lhr.audits['largest-contentful-paint'].displayValue,
      cls: res.lhr.audits['cumulative-layout-shift'].displayValue,
      tbt: res.lhr.audits['total-blocking-time'].displayValue,
    };
    scores.push(row);
    const slug = (path === '/' ? 'home' : path.replace(/^\/|\/$/g, '').replaceAll('/', '-'));
    await writeFile(join(LH, `${slug}-${formFactor}.html`), res.report);
    console.log(`  ${path.padEnd(24)} ${formFactor.padEnd(8)} P${row.performance} A${row.accessibility} BP${row.bestPractices} SEO${row.seo}  LCP ${row.lcp}  CLS ${row.cls}  TBT ${row.tbt}`);
  }
}
await chrome.kill();
await writeFile(join(LH, 'summary.json'), JSON.stringify(scores, null, 2));

server.kill();
console.log(`\n${problems.length ? `${problems.length} problem(s) found.` : 'All checks passed.'}`);
process.exit(problems.length ? 1 : 0);
