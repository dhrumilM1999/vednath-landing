// core.js — the only JS needed for first paint (~3 KB gz).
// Everything heavier (GSAP scenes, pointer effects, shader, carousel, quiz) is
// imported lazily, after load / on idle / on interaction.

const root = document.documentElement;
const motionOK = matchMedia('(prefers-reduced-motion: no-preference)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const conn = navigator.connection || {};
const lowEnd =
  conn.saveData === true ||
  /(^|-)2g$/.test(conn.effectiveType || '') ||
  (navigator.hardwareConcurrency || 4) < 6 ||
  (navigator.deviceMemory || 4) < 4;


const idle = (fn) =>
  'requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 2500 }) : setTimeout(fn, 1200);
const afterLoad = (fn) =>
  document.readyState === 'complete' ? idle(fn) : addEventListener('load', () => idle(fn), { once: true });

/* ---------- Header: scrolled state ---------- */
const header = document.querySelector('.site-header');
if (header) {
  const sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  sentinel.style.cssText = 'position:absolute;top:0;height:8px;width:1px;';
  document.body.prepend(sentinel);
  new IntersectionObserver(([e]) => header.classList.toggle('is-scrolled', !e.isIntersecting)).observe(sentinel);
}

/* ---------- Mobile nav disclosure ---------- */
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('site-nav');
if (toggle && nav) {
  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    header?.classList.toggle('menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) nav.querySelector('a')?.focus();
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });
  matchMedia('(min-width: 1080px)').addEventListener('change', () => setOpen(false));
}

/* ---------- Reveal on scroll (CSS transitions; GSAP not required) ---------- */
const reveals = document.querySelectorAll('[data-reveal]');
if (reveals.length) {
  if (!motionOK || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const el = e.target;
            el.classList.add('is-in');
            io.unobserve(el);
            // Once revealed, drop the hook so its long transform transition
            // doesn't fight hover effects (tilt, magnetic) later.
            el.addEventListener('transitionend', (ev) => {
              if (ev.propertyName === 'transform') el.removeAttribute('data-reveal');
            });
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    );
    reveals.forEach((el) => io.observe(el));
  }
}

/* ---------- Marquee pause button (WCAG 2.2.2) + offscreen pause ---------- */
document.querySelectorAll('.marquee__toggle').forEach((btn) => {
  const m = document.getElementById(btn.getAttribute('aria-controls'));
  btn.addEventListener('click', () => {
    const paused = m.classList.toggle('is-paused');
    btn.setAttribute('aria-pressed', String(paused));
    const gu = root.lang === 'gu';
    btn.querySelector('span').textContent = paused ? (gu ? 'ચાલુ કરો' : 'Play') : (gu ? 'થોભાવો' : 'Pause');
    m.querySelector('.marquee__track').style.animationPlayState = paused ? 'paused' : '';
  });
});
document.querySelectorAll('.marquee').forEach((m) => {
  new IntersectionObserver(([e]) => {
    m.querySelector('.marquee__track').style.animationPlayState =
      e.isIntersecting && !m.classList.contains('is-paused') ? '' : 'paused';
  }).observe(m);
});

/* ---------- Tap ripple on buttons ---------- */
document.addEventListener('pointerdown', (e) => {
  const btn = e.target.closest('.btn');
  if (!btn || !motionOK) return;
  const r = btn.getBoundingClientRect();
  const dot = document.createElement('span');
  dot.className = 'ripple';
  dot.style.left = `${e.clientX - r.left}px`;
  dot.style.top = `${e.clientY - r.top}px`;
  btn.append(dot);
  dot.addEventListener('animationend', () => dot.remove(), { once: true });
});

/* ---------- Map facade: a plain link to Google Maps until the visitor asks ---------- */
document.querySelectorAll('[data-map-src]').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const frame = document.createElement('iframe');
    frame.src = link.dataset.mapSrc;
    frame.title = 'Vednath Ayurved location on Google Maps';
    frame.loading = 'lazy';
    frame.referrerPolicy = 'no-referrer-when-downgrade';
    frame.allowFullscreen = true;
    frame.className = 'map-frame';
    link.replaceWith(frame);
    frame.focus();
  });
});

/* ---------- Hero: start ambient motion only after load ---------- */
// Scoped to the hero (not <html>) so adding the class doesn't restyle the whole page.
afterLoad(() => document.querySelector('.hero')?.classList.add('is-loaded'));

/* ---------- Lazy enhancements ---------- */
if (document.querySelector('[data-carousel]')) {
  const start = () => import('./carousel.js');
  'IntersectionObserver' in window
    ? new IntersectionObserver((es, o) => {
        if (es.some((e) => e.isIntersecting)) { o.disconnect(); start(); }
      }, { rootMargin: '400px' }).observe(document.querySelector('[data-carousel]'))
    : start();
}

// Page features: loaded only on pages that have them, as soon as the DOM is ready
// (these are interactive, so they shouldn't wait for idle).
if (document.querySelector('[data-inquiry]')) import('./inquiry.js');
if (document.querySelector('[data-filter]')) import('./filter.js');
if (document.querySelector('[data-quiz]')) import('./quiz.js');

// GSAP (~50 KB gz) is only needed for effects below the fold, so it loads on the
// visitor's first scroll / touch / key press instead of competing with first paint.
const onFirst = (events, fn) => {
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    events.forEach((e) => removeEventListener(e, run, true));
    fn();
  };
  events.forEach((e) => addEventListener(e, run, { capture: true, passive: true }));
  if (scrollY > 0) run(); // reloaded mid-page
};

if (motionOK) {
  onFirst(['scroll', 'wheel', 'touchstart', 'pointerdown', 'keydown'], () => import('./motion.js'));
  if (finePointer) onFirst(['pointermove'], () => import('./pointer.js'));
  // WebGL only on large, fine-pointer screens; phones keep the (free) CSS sun.
  // shader.js also bails out if the GPU is a software renderer.
  const bigScreen = matchMedia('(min-width: 1024px) and (pointer: fine)').matches;
  if (!lowEnd && bigScreen && document.querySelector('[data-shader]')) afterLoad(() => import('./shader.js'));
}
