// pointer.js — desktop-only niceties (fine pointer + motion allowed):
// magnetic buttons, 3D tilt + cursor spotlight on bento cards, and a soft custom cursor.
// Pure rAF + transforms; no layout reads inside the animation loop.

const lerp = (a, b, t) => a + (b - a) * t;

/* ---------- Custom cursor (the native cursor stays visible: no a11y loss) ---------- */
const dot = document.createElement('div');
dot.className = 'cursor';
dot.setAttribute('aria-hidden', 'true');
document.body.append(dot);
let cx = -100, cy = -100, tx = -100, ty = -100, craf = 0;
const tick = () => {
  cx = lerp(cx, tx, 0.22);
  cy = lerp(cy, ty, 0.22);
  dot.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
  // Stop the loop once the dot has caught up — no idle rAF burning battery.
  craf = Math.abs(cx - tx) + Math.abs(cy - ty) > 0.2 ? requestAnimationFrame(tick) : 0;
};
const wake = () => { if (!craf) craf = requestAnimationFrame(tick); };
addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; wake(); }, { passive: true });
document.addEventListener('pointerover', (e) => {
  dot.classList.toggle('is-hover', !!e.target.closest('a, button, [data-magnetic], .bento__card'));
});
document.documentElement.addEventListener('pointerleave', () => { tx = ty = -100; wake(); });

/* ---------- Magnetic buttons ---------- */
document.querySelectorAll('[data-magnetic]').forEach((el) => {
  const strength = parseFloat(el.dataset.magnetic) || 0.3;
  let rect, x = 0, y = 0, gx = 0, gy = 0, raf = 0;
  const loop = () => {
    x = lerp(x, gx, 0.18);
    y = lerp(y, gy, 0.18);
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    if (Math.abs(x - gx) > 0.1 || Math.abs(y - gy) > 0.1) raf = requestAnimationFrame(loop);
    else raf = 0;
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
  el.addEventListener('pointerenter', () => { rect = el.getBoundingClientRect(); });
  el.addEventListener('pointermove', (e) => {
    rect ||= el.getBoundingClientRect();
    gx = (e.clientX - (rect.left + rect.width / 2)) * strength;
    gy = (e.clientY - (rect.top + rect.height / 2)) * strength;
    kick();
  });
  el.addEventListener('pointerleave', () => { gx = gy = 0; rect = null; kick(); });
});

/* ---------- Bento: tilt + spotlight ---------- */
document.querySelectorAll('[data-tilt]').forEach((card) => {
  let rect, rx = 0, ry = 0, grx = 0, gry = 0, raf = 0;
  const loop = () => {
    rx = lerp(rx, grx, 0.12);
    ry = lerp(ry, gry, 0.12);
    card.style.transform = `perspective(1100px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    if (Math.abs(rx - grx) > 0.01 || Math.abs(ry - gry) > 0.01) raf = requestAnimationFrame(loop);
    else raf = 0;
  };
  card.addEventListener('pointerenter', () => { rect = card.getBoundingClientRect(); });
  card.addEventListener('pointermove', (e) => {
    rect ||= card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    card.style.setProperty('--mx', `${px * 100}%`);
    card.style.setProperty('--my', `${py * 100}%`);
    gry = (px - 0.5) * 6;
    grx = (0.5 - py) * 6;
    if (!raf) raf = requestAnimationFrame(loop);
  });
  card.addEventListener('pointerleave', () => {
    grx = gry = 0;
    rect = null;
    if (!raf) raf = requestAnimationFrame(loop);
  });
});
