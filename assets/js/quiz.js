// quiz.js: the "Know your Prakriti" self-check. Runs in the browser only and
// sends nothing anywhere. Shows one question at a time, works fully by keyboard,
// and announces progress and the result to screen readers.

const INFO = {
  vata: {
    name: 'Vata',
    elements: 'Air + Space',
    text: 'Light, quick and creative. When Vata is out of balance, Ayurveda describes dryness, gas and bloating, an anxious mind and light, broken sleep.',
    tips: ['A regular daily routine', 'Warm, freshly cooked, slightly oily food', 'Warm oil massage (Abhyanga)', 'Early, unhurried bedtimes'],
  },
  pitta: {
    name: 'Pitta',
    elements: 'Fire + Water',
    text: 'Sharp, focused and warm. When Pitta is out of balance, Ayurveda describes acidity, irritability, excess heat and skin that flares easily.',
    tips: ['Never skip meals', 'Cooling foods and drinks, not ice-cold ones', 'Avoiding the midday sun and very spicy food', 'Time to unwind in the evening'],
  },
  kapha: {
    name: 'Kapha',
    elements: 'Earth + Water',
    text: 'Steady, calm and strong. When Kapha is out of balance, Ayurveda describes heaviness, slow digestion, congestion and a tendency to gain weight.',
    tips: ['Light, warm meals with spices like ginger', 'Daily vigorous exercise', 'Rising early, avoiding daytime naps', 'Variety and new activity'],
  },
};

const form = document.querySelector('[data-quiz]');
if (form) {
  const qs = [...form.querySelectorAll('.quiz__q')];
  const bar = form.querySelector('[data-bar]');
  const countEl = form.querySelector('[data-qcount]');
  const prev = form.querySelector('[data-prev-q]');
  const next = form.querySelector('[data-next-q]');
  const nav = form.querySelector('.quiz__nav');
  const error = form.querySelector('[data-qerror]');
  const result = document.querySelector('[data-result]');
  const restart = document.querySelector('[data-restart]');
  let i = 0;

  form.classList.add('quiz--stepped');
  nav.hidden = false;
  form.querySelector('[data-noscript-submit]')?.remove();

  const show = (n, focus = true) => {
    qs.forEach((q, k) => q.classList.toggle('is-current', k === n));
    i = n;
    prev.disabled = n === 0;
    next.querySelector('span').textContent = n === qs.length - 1 ? 'See my result' : 'Next question';
    bar.style.width = `${(n / qs.length) * 100}%`;
    countEl.textContent = `Question ${n + 1} of ${qs.length}`;
    error.textContent = '';
    if (focus) qs[n].querySelector('legend').focus();
  };

  qs.forEach((q) => q.querySelector('legend').setAttribute('tabindex', '-1'));

  const answered = (q) => !!q.querySelector('input:checked');

  const finish = () => {
    const score = { vata: 0, pitta: 0, kapha: 0 };
    qs.forEach((q) => { score[q.querySelector('input:checked').value]++; });
    const total = qs.length;
    const ranked = Object.entries(score).sort((a, b) => b[1] - a[1]);
    // Dual type when the top two are within one answer of each other.
    const dual = ranked[0][1] - ranked[1][1] <= 1;
    const [a, b] = [INFO[ranked[0][0]], INFO[ranked[1][0]]];

    result.querySelector('[data-r-dosha]').textContent = dual ? `${a.name}–${b.name}` : a.name;
    result.querySelector('[data-r-elements]').textContent = dual ? `${a.elements} · ${b.elements}` : a.elements;
    result.querySelector('[data-r-text]').textContent = dual
      ? `Two doshas seem almost equally active in you. ${a.name}: ${a.text} ${b.name}: ${b.text}`
      : a.text;
    result.querySelector('[data-r-tips]').innerHTML = a.tips.map((t) => `<li>${t}</li>`).join('');
    result.querySelector('[data-r-tips-title]').textContent = `Habits Ayurveda often suggests for ${a.name}`;

    Object.entries(score).forEach(([k, v]) => {
      const pct = Math.round((v / total) * 100);
      const row = result.querySelector(`[data-r-bar="${k}"]`);
      row.querySelector('.result__fill').style.setProperty('--v', '0');
      row.querySelector('[data-pct]').textContent = `${pct}%`;
      requestAnimationFrame(() => requestAnimationFrame(() => row.querySelector('.result__fill').style.setProperty('--v', String(v / total))));
    });

    bar.style.width = '100%';
    form.hidden = true;
    result.hidden = false;
    result.querySelector('h2').focus();
    result.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  next.addEventListener('click', () => {
    if (!answered(qs[i])) {
      error.textContent = 'Please choose the answer that fits you best.';
      qs[i].querySelector('input').focus();
      return;
    }
    if (i < qs.length - 1) show(i + 1); else finish();
  });
  prev.addEventListener('click', () => { if (i > 0) show(i - 1); });
  form.addEventListener('submit', (e) => { e.preventDefault(); next.click(); });
  form.addEventListener('change', () => { error.textContent = ''; });

  restart?.addEventListener('click', () => {
    form.reset();
    result.hidden = true;
    form.hidden = false;
    show(0);
  });

  show(0, false);
}
