// Measures main-thread long tasks on a page with individual scripts blocked,
// to find what keeps the CPU busy. Serve dist on :5181 first.
// Usage: node scripts/perf-bisect.mjs [path]
import { chromium } from 'playwright';

const path = process.argv[2] || '/';
const variants = {
  'everything': [],
  'no shader': ['shader.js'],
  'no motion (GSAP)': ['motion.js'],
  'no pointer': ['pointer.js'],
  'no shader + no GSAP': ['shader.js', 'motion.js'],
};
const b = await chromium.launch();
for (const [name, block] of Object.entries(variants)) {
  const ctx = await b.newContext({ viewport: { width: 1350, height: 940 } });
  const page = await ctx.newPage();
  await page.route('**/*', (r) => (block.some((s) => r.request().url().endsWith(s)) ? r.abort() : r.continue()));
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.addInitScript(() => {
    window.__lt = [];
    new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lt.push(e.duration))).observe({ type: 'longtask', buffered: true });
  });
  await page.goto('http://localhost:5181' + path, { waitUntil: 'load' });
  await page.waitForTimeout(8000);
  const r = await page.evaluate(() => ({ n: window.__lt.length, total: Math.round(window.__lt.reduce((a, b) => a + b, 0)), blocking: Math.round(window.__lt.reduce((a, b) => a + Math.max(0, b - 50), 0)) }));
  console.log(name.padEnd(22), `${r.n} long tasks, ${r.total} ms total, ~${r.blocking} ms blocking`);
  await ctx.close();
}
await b.close();
