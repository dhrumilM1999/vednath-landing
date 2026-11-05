// Measures web font vs fallback so size-adjust/ascent overrides can be tuned (dev only).
import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage();
await p.goto('http://localhost:5181/styleguide/');
await p.evaluate(() => document.fonts.ready);
const r = await p.evaluate(async () => {
  const text = 'Healing that begins at the root. Care for every stage of life.';
  const m = (fam, weight = 340, style = 'normal') => {
    const s = document.createElement('span');
    s.style.cssText = `font-family:${fam};font-size:100px;font-weight:${weight};font-style:${style};position:absolute;white-space:nowrap;line-height:normal`;
    s.textContent = text;
    document.body.append(s);
    const r = s.getBoundingClientRect();
    s.remove();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  };
  await document.fonts.load('340 100px Fraunces');
  await document.fonts.load('450 100px Manrope');
  return {
    fraunces: m("'Fraunces'"), georgia: m('Georgia'), frFallback: m("'Fraunces Fallback'"),
    manrope: m("'Manrope'", 450), arial: m('Arial', 450), mnFallback: m("'Manrope Fallback'", 450),
  };
});
console.log(r);
await b.close();
