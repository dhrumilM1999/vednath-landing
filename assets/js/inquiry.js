// inquiry.js: accessible validation for the booking form, then hands the
// message to WhatsApp. There's no backend and nothing is stored.
// Without JS the form still works: native `required` validation runs, and the
// concern text (name="text") is sent to wa.me as a GET request.

import { lang, t } from './i18n.js';

const WA = 'https://wa.me/919925604218';

const M = {
  name: { en: 'Please enter your name.', gu: 'કૃપા કરીને તમારું નામ લખો.' },
  phoneEmpty: { en: 'Please enter your mobile number.', gu: 'કૃપા કરીને તમારો મોબાઇલ નંબર લખો.' },
  phoneBad: { en: 'Please enter a valid 10-digit mobile number, for example 98765 43210.', gu: 'કૃપા કરીને સાચો 10 અંકનો મોબાઇલ નંબર લખો, જેમ કે 98765 43210.' },
  date: { en: 'Please choose today or a later date.', gu: 'કૃપા કરીને આજની અથવા પછીની તારીખ પસંદ કરો.' },
  mode: { en: 'Please choose in person or online.', gu: 'કૃપા કરીને રૂબરૂ અથવા ઑનલાઇન પસંદ કરો.' },
  concern: { en: 'Please keep it under 300 characters.', gu: 'કૃપા કરીને 300 અક્ષરથી ઓછું લખો.' },
  consent: { en: 'Please tick this box to continue.', gu: 'આગળ વધવા માટે આ બૉક્સ પર ટિક કરો.' },
  fix1: { en: 'Please fix this before sending:', gu: 'મોકલતા પહેલાં આ સુધારો:' },
  fixN: { en: (n) => `Please fix these ${n} before sending:`, gu: (n) => `મોકલતા પહેલાં આ ${n} સુધારો:` },
  hello: { en: 'Hello Vednath Ayurved, I would like to book a consultation.', gu: 'નમસ્તે વેદનાથ આયુર્વેદ, મારે કન્સલ્ટેશન બુક કરવું છે.' },
  lName: { en: 'Name', gu: 'નામ' },
  lMobile: { en: 'Mobile', gu: 'મોબાઇલ' },
  lMode: { en: 'Consultation', gu: 'કન્સલ્ટેશન' },
  lService: { en: 'Interested in', gu: 'રસ' },
  lDate: { en: 'Preferred date', gu: 'પસંદગીની તારીખ' },
  lConcern: { en: 'Concern', gu: 'તકલીફ' },
};

const pad = (n) => String(n).padStart(2, '0');
const isoToday = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const pretty = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString(lang === 'gu' ? 'gu-IN' : 'en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

// Accepts 98765 43210, +91 98765-43210, 098765 43210. Indian mobiles start with 6–9.
const normalisePhone = (v) => {
  const digits = v.replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '');
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
};

document.querySelectorAll('[data-inquiry]').forEach((form) => {
  form.noValidate = true; // we show our own, screen-reader-friendly errors
  const $ = (id) => form.querySelector(`#${id}`);
  const name = $('inq-name');
  const phone = $('inq-phone');
  const date = $('inq-date');
  const service = $('inq-service');
  const concern = $('inq-concern');
  const consent = $('inq-consent');
  const modes = [...form.querySelectorAll('input[name="inq-mode"]')];
  const summary = form.querySelector('[data-summary]');
  const done = form.querySelector('[data-done]');

  date.min = isoToday();

  const setError = (input, errId, msg) => {
    const el = form.querySelector(`#${errId}`);
    el.textContent = msg || '';
    const targets = input instanceof Array ? input : [input];
    targets.forEach((t) => t.setAttribute('aria-invalid', msg ? 'true' : 'false'));
    return msg ? { id: targets[0].id || errId, msg, focus: targets[0] } : null;
  };

  const checks = {
    name: () => setError(name, 'inq-name-err', name.value.trim().length < 2 ? t(M.name) : ''),
    phone: () => setError(phone, 'inq-phone-err',
      !phone.value.trim() ? t(M.phoneEmpty) : !normalisePhone(phone.value) ? t(M.phoneBad) : ''),
    date: () => setError(date, 'inq-date-err', date.value && date.value < date.min ? t(M.date) : ''),
    mode: () => setError(modes, 'inq-mode-err', modes.some((m) => m.checked) ? '' : t(M.mode)),
    concern: () => setError(concern, 'inq-concern-err', concern.value.length > 300 ? t(M.concern) : ''),
    consent: () => setError(consent, 'inq-consent-err', consent.checked ? '' : t(M.consent)),
  };

  // Validate a field when the visitor leaves it, but only after they've typed.
  [[name, 'name'], [phone, 'phone'], [date, 'date'], [concern, 'concern']].forEach(([el, key]) => {
    el.addEventListener('blur', () => { if (el.value) checks[key](); });
    el.addEventListener('input', () => { if (el.getAttribute('aria-invalid') === 'true') checks[key](); });
  });
  modes.forEach((m) => m.addEventListener('change', checks.mode));
  consent.addEventListener('change', checks.consent);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    done.hidden = true;
    const errors = Object.values(checks).map((fn) => fn()).filter(Boolean);

    if (errors.length) {
      summary.innerHTML = `<p>${errors.length === 1 ? t(M.fix1) : t(M.fixN)(errors.length)}</p><ul>${errors
        .map((er) => `<li><a href="#${er.focus.id}">${er.msg}</a></li>`).join('')}</ul>`;
      summary.hidden = false;
      summary.focus();
      summary.querySelectorAll('a').forEach((a, i) => a.addEventListener('click', (ev) => {
        ev.preventDefault();
        errors[i].focus.focus();
      }));
      return;
    }
    summary.hidden = true;

    const lines = [
      t(M.hello),
      '',
      `${t(M.lName)}: ${name.value.trim()}`,
      `${t(M.lMobile)}: ${normalisePhone(phone.value)}`,
      `${t(M.lMode)}: ${modes.find((m) => m.checked).value}`,
      `${t(M.lService)}: ${service.value}`,
    ];
    if (date.value) lines.push(`${t(M.lDate)}: ${pretty(date.value)}`);
    if (concern.value.trim()) lines.push(`${t(M.lConcern)}: ${concern.value.trim()}`);
    const url = `${WA}?text=${encodeURIComponent(lines.join('\n'))}`;

    form.querySelector('[data-done-link]').href = url;
    done.hidden = false;
    window.open(url, '_blank', 'noopener');
  });
});
