// inquiry.js: accessible validation for the booking form, then hands the
// message to WhatsApp. There's no backend and nothing is stored.
// Without JS the form still works: native `required` validation runs, and the
// concern text (name="text") is sent to wa.me as a GET request.

const WA = 'https://wa.me/919925604218';

const pad = (n) => String(n).padStart(2, '0');
const isoToday = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const pretty = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

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
    name: () => setError(name, 'inq-name-err', name.value.trim().length < 2 ? 'Please enter your name.' : ''),
    phone: () => setError(phone, 'inq-phone-err',
      !phone.value.trim() ? 'Please enter your mobile number.'
        : !normalisePhone(phone.value) ? 'Please enter a valid 10-digit mobile number, for example 98765 43210.' : ''),
    date: () => setError(date, 'inq-date-err', date.value && date.value < date.min ? 'Please choose today or a later date.' : ''),
    mode: () => setError(modes, 'inq-mode-err', modes.some((m) => m.checked) ? '' : 'Please choose in person or online.'),
    concern: () => setError(concern, 'inq-concern-err', concern.value.length > 300 ? 'Please keep it under 300 characters.' : ''),
    consent: () => setError(consent, 'inq-consent-err', consent.checked ? '' : 'Please tick this box to continue.'),
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
      summary.innerHTML = `<p>Please fix ${errors.length === 1 ? 'this' : `these ${errors.length}`} before sending:</p><ul>${errors
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
      'Hello Vednath Ayurved, I would like to book a consultation.',
      '',
      `Name: ${name.value.trim()}`,
      `Mobile: ${normalisePhone(phone.value)}`,
      `Consultation: ${modes.find((m) => m.checked).value}`,
      `Interested in: ${service.value}`,
    ];
    if (date.value) lines.push(`Preferred date: ${pretty(date.value)}`);
    if (concern.value.trim()) lines.push(`Concern: ${concern.value.trim()}`);
    const url = `${WA}?text=${encodeURIComponent(lines.join('\n'))}`;

    form.querySelector('[data-done-link]').href = url;
    done.hidden = false;
    window.open(url, '_blank', 'noopener');
  });
});
