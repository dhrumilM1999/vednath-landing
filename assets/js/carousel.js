// carousel.js — progressive enhancement over a native CSS scroll-snap strip.
// Without JS: swipe/scroll works. With JS: prev/next buttons, mouse drag,
// arrow keys, and a live "slide x of y" announcement.

document.querySelectorAll('[data-carousel]').forEach((root) => {
  const vp = root.querySelector('.carousel__viewport');
  const slides = [...vp.children];
  const prev = root.querySelector('[data-prev]');
  const next = root.querySelector('[data-next]');
  const status = root.querySelector('[data-status]');
  const controls = root.querySelector('.carousel__controls');
  if (controls) controls.hidden = false;

  const step = () => slides[0].getBoundingClientRect().width + parseFloat(getComputedStyle(vp).columnGap || 16);
  const current = () => Math.round(vp.scrollLeft / step());
  const smooth = matchMedia('(prefers-reduced-motion: no-preference)').matches ? 'smooth' : 'auto';
  const go = (dir) => vp.scrollBy({ left: dir * step(), behavior: smooth });

  const update = () => {
    const max = vp.scrollWidth - vp.clientWidth - 2;
    if (prev) prev.disabled = vp.scrollLeft <= 2;
    if (next) next.disabled = vp.scrollLeft >= max;
    if (status) status.textContent = `Review ${Math.min(slides.length, current() + 1)} of ${slides.length}`;
  };

  prev?.addEventListener('click', () => go(-1));
  next?.addEventListener('click', () => go(1));
  vp.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  vp.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  });

  // Mouse drag (touch already scrolls natively).
  let down = false, startX = 0, startLeft = 0, moved = false;
  vp.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') return;
    down = true; moved = false;
    startX = e.clientX;
    startLeft = vp.scrollLeft;
  });
  addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 4) { moved = true; vp.classList.add('is-dragging'); }
    vp.scrollLeft = startLeft - dx;
  });
  addEventListener('pointerup', () => {
    if (!down) return;
    down = false;
    vp.classList.remove('is-dragging');
    if (moved) {
      const i = Math.round(vp.scrollLeft / step());
      vp.scrollTo({ left: i * step(), behavior: smooth });
    }
  });
  vp.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);

  update();
});
