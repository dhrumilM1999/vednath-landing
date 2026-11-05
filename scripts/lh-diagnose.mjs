// Prints what is blocking the main thread and what shifts layout on one page.
// Usage: node scripts/serve.mjs 5181 dist  (in another terminal), then
//        node scripts/lh-diagnose.mjs / mobile|desktop
import lighthouse from 'lighthouse';
import { chromium } from 'playwright';

const [path = '/', ff = 'mobile', block] = process.argv.slice(2);
const PORT = 9334;
const b = await chromium.launch({ args: [`--remote-debugging-port=${PORT}`] });
const config = ff === 'desktop' ? (await import('lighthouse/core/config/desktop-config.js')).default : undefined;
const { lhr } = await lighthouse(`http://localhost:5181${path}`, { port: PORT, logLevel: 'error', blockedUrlPatterns: block ? block.split(',') : [] }, config);
await b.close();

const a = lhr.audits;
console.log('Perf', Math.round(lhr.categories.performance.score * 100), '| TBT', a['total-blocking-time'].displayValue, '| LCP', a['largest-contentful-paint'].displayValue, '| CLS', a['cumulative-layout-shift'].displayValue);
console.log('\nLCP element:', a['largest-contentful-paint-element']?.details?.items?.[0]?.items?.[0]?.node?.snippet);
console.log('\nBoot-up time by script:');
for (const i of a['bootup-time'].details?.items || []) console.log(' ', Math.round(i.total), 'ms', i.url);
console.log('\nLong tasks:');
for (const i of (a['long-tasks'].details?.items || []).slice(0, 10)) console.log(' ', Math.round(i.duration), 'ms @', Math.round(i.startTime), i.url);
console.log('\nMain-thread work:');
for (const i of a['mainthread-work-breakdown'].details?.items || []) console.log(' ', Math.round(i.duration), 'ms', i.groupLabel);
console.log('\nFailing accessibility audits:');
for (const ref of lhr.categories.accessibility.auditRefs) {
  const au = a[ref.id];
  if (au.score !== null && au.score < 1) {
    console.log(' ', au.id, '-', au.title);
    for (const it of (au.details?.items || []).slice(0, 4)) console.log('     ', it.node?.snippet?.slice(0, 140), '|', it.node?.explanation?.split('\n')[1]?.slice(0, 120) || '');
  }
}
console.log('\nLCP breakdown:');
for (const it of a['lcp-breakdown-insight']?.details?.items?.[0]?.items || a['largest-contentful-paint-element']?.details?.items?.[1]?.items || []) console.log(' ', it.phase || it.label, Math.round(it.timing ?? it.duration ?? 0), 'ms');
console.log('\nLayout shifts:');
for (const i of a['layout-shifts']?.details?.items || []) console.log(' ', i.score?.toFixed(3), i.node?.snippet?.slice(0, 120));
