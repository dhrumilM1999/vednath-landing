// motion.js — GSAP scroll scenes. Loaded on idle after `load`, only when
// prefers-reduced-motion is "no-preference". The page is complete without it:
// every element's final state is already in the HTML/CSS.

const V = '/assets/vendor/gsap/';
const loadScript = (src) =>
  new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = V + src;
    s.onload = res;
    s.onerror = rej;
    document.head.append(s);
  });

await loadScript('gsap.min.js');
await Promise.all(['ScrollTrigger.min.js', 'SplitText.min.js', 'DrawSVGPlugin.min.js'].map(loadScript));

const { gsap, ScrollTrigger, SplitText, DrawSVGPlugin } = window;
gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin);
gsap.defaults({ ease: 'expo.out', duration: 1.1 });

const mm = gsap.matchMedia();

mm.add('(prefers-reduced-motion: no-preference)', () => {
  /* ---- Editorial headings: word-by-word rise ---- */
  document.querySelectorAll('[data-split]').forEach((el) => {
    const split = SplitText.create(el, { type: 'words', mask: 'words', aria: 'auto' });
    gsap.from(split.words, {
      yPercent: 110,
      opacity: 0,
      stagger: 0.06,
      duration: 1.2,
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });

  /* ---- Botanical line art draws itself as you scroll ---- */
  document.querySelectorAll('[data-draw]').forEach((svg) => {
    const paths = svg.querySelectorAll('path, line, circle, ellipse, polyline');
    gsap.fromTo(
      paths,
      { drawSVG: '0%' },
      {
        drawSVG: '100%',
        ease: 'none',
        stagger: 0.04,
        scrollTrigger: { trigger: svg, start: 'top 85%', end: 'bottom 45%', scrub: 0.8 },
      }
    );
  });

  /* ---- Count-up stats (real values are already in the HTML) ---- */
  document.querySelectorAll('[data-count]').forEach((el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = (el.dataset.count.split('.')[1] || '').length;
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target,
      duration: 1.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: () => (el.textContent = obj.v.toFixed(decimals)),
    });
  });

  /* ---- Gentle parallax ---- */
  document.querySelectorAll('[data-parallax]').forEach((el) => {
    gsap.to(el, {
      yPercent: parseFloat(el.dataset.parallax) || -12,
      ease: 'none',
      scrollTrigger: { trigger: el.closest('section') || el, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  /* ---- Hero: the sun sinks and the headline lifts as you leave ---- */
  const hero = document.querySelector('.hero');
  if (hero) {
    gsap.to('.hero__sun', {
      yPercent: 18,
      scale: 1.08,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
    });
    gsap.to('.hero__content', {
      yPercent: -10,
      opacity: 0.2,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'center center', end: 'bottom top', scrub: true },
    });
  }
});

/* ---- Pinned Panchakarma Journey (tablet/desktop: pinned + scrubbed) ---- */
mm.add('(prefers-reduced-motion: no-preference) and (min-width: 760px)', () => {
  const journey = document.querySelector('[data-journey]');
  if (!journey) return;
  const steps = gsap.utils.toArray('.journey__step', journey);
  const arts = gsap.utils.toArray('.journey__art', journey);
  const dots = gsap.utils.toArray('.journey__dot', journey);
  journey.classList.add('is-pinned');

  // opacity (not autoAlpha/visibility) keeps every step in the accessibility tree,
  // so screen-reader users get all three stages regardless of scroll position.
  gsap.set(steps.slice(1), { opacity: 0, y: 40 });
  gsap.set(arts.slice(1), { scale: 0.9 });

  const tl = gsap.timeline({
    defaults: { ease: 'power2.inOut', duration: 1 },
    scrollTrigger: {
      trigger: journey,
      start: 'top top',
      end: () => `+=${window.innerHeight * steps.length}`,
      pin: true,
      scrub: 0.6,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const i = Math.min(steps.length - 1, Math.floor(self.progress * steps.length));
        dots.forEach((d, n) => d.classList.toggle('is-active', n <= i));
      },
    },
  });

  tl.fromTo('.journey__progress-fill', { scaleY: 0 }, { scaleY: 1, ease: 'none', duration: steps.length }, 0);
  steps.forEach((step, i) => {
    if (i === 0) return;
    const at = i - 0.5;
    tl.to(steps[i - 1], { opacity: 0, y: -40 }, at)
      .to(arts[i - 1], { scale: 1.08 }, at)
      .to(step, { opacity: 1, y: 0 }, at + 0.15)
      .to(arts[i], { scale: 1 }, at + 0.15);
  });

  return () => journey.classList.remove('is-pinned');
});

// Fonts swapping in can shift layout; recalc trigger positions once they're ready.
document.fonts?.ready.then(() => ScrollTrigger.refresh());
