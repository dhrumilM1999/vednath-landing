// quiz.js: the "Know your Prakriti" self-check. Runs in the browser only and
// sends nothing anywhere. Shows one question at a time, works fully by keyboard,
// and announces progress and the result to screen readers.

import { lang, t } from './i18n.js';

const INFO_ALL = {
  en: {
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
  },
  gu: {
    vata: {
      name: 'વાત',
      elements: 'વાયુ + આકાશ',
      text: 'હળવા, ઝડપી અને સર્જનાત્મક. વાત અસંતુલિત થાય ત્યારે આયુર્વેદ શુષ્કતા, ગૅસ અને પેટ ફૂલવું, ચિંતાતુર મન અને હળવી, તૂટક ઊંઘનું વર્ણન કરે છે.',
      tips: ['નિયમિત દિનચર્યા', 'ગરમ, તાજો રાંધેલો, થોડો સ્નિગ્ધ ખોરાક', 'ગરમ તેલથી અભ્યંગ (માલિશ)', 'વહેલું અને શાંતિથી સૂવું'],
    },
    pitta: {
      name: 'પિત્ત',
      elements: 'અગ્નિ + જળ',
      text: 'તીક્ષ્ણ, એકાગ્ર અને ઉષ્ણ. પિત્ત અસંતુલિત થાય ત્યારે આયુર્વેદ એસિડિટી, ચીડિયાપણું, શરીરમાં વધુ ગરમી અને ચામડીની તકલીફોનું વર્ણન કરે છે.',
      tips: ['ક્યારેય ભોજન ન છોડવું', 'ઠંડક આપતા ખોરાક અને પીણાં, બરફ જેવા ઠંડા નહીં', 'બપોરનો તડકો અને વધુ તીખું ટાળવું', 'સાંજે મનને શાંત કરવાનો સમય'],
    },
    kapha: {
      name: 'કફ',
      elements: 'પૃથ્વી + જળ',
      text: 'સ્થિર, શાંત અને મજબૂત. કફ અસંતુલિત થાય ત્યારે આયુર્વેદ ભારેપણું, ધીમું પાચન, શરદી-કફ અને વજન વધવાની વૃત્તિનું વર્ણન કરે છે.',
      tips: ['આદુ જેવા મસાલા સાથે હળવું, ગરમ ભોજન', 'રોજ સારી કસરત', 'વહેલા ઊઠવું, દિવસે ન સૂવું', 'નવી પ્રવૃત્તિ અને વૈવિધ્ય'],
    },
  },
};
const INFO = INFO_ALL[lang];
const S = {
  last: { en: 'See my result', gu: 'મારું પરિણામ જુઓ' },
  next: { en: 'Next question', gu: 'આગળનો પ્રશ્ન' },
  count: { en: (n, total) => `Question ${n} of ${total}`, gu: (n, total) => `${total} માંથી પ્રશ્ન ${n}` },
  pick: { en: 'Please choose the answer that fits you best.', gu: 'કૃપા કરીને તમને સૌથી વધુ લાગુ પડતો જવાબ પસંદ કરો.' },
  dual: { en: 'Two doshas seem almost equally active in you.', gu: 'તમારામાં બે દોષ લગભગ સરખા સક્રિય લાગે છે.' },
  tips: { en: (n) => `Habits Ayurveda often suggests for ${n}`, gu: (n) => `${n} માટે આયુર્વેદ સૂચવે છે તેવી આદતો` },
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
    next.querySelector('span').textContent = n === qs.length - 1 ? t(S.last) : t(S.next);
    bar.style.width = `${(n / qs.length) * 100}%`;
    countEl.textContent = t(S.count)(n + 1, qs.length);
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
      ? `${t(S.dual)} ${a.name}: ${a.text} ${b.name}: ${b.text}`
      : a.text;
    result.querySelector('[data-r-tips]').innerHTML = a.tips.map((tip) => `<li>${tip}</li>`).join('');
    result.querySelector('[data-r-tips-title]').textContent = t(S.tips)(a.name);

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
      error.textContent = t(S.pick);
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
