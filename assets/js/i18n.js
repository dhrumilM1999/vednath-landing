// i18n.js: tiny helper. The page language comes from <html lang>.
// Usage: t({ en: 'Pause', gu: 'થોભો' })
export const lang = document.documentElement.lang === 'gu' ? 'gu' : 'en';
export const t = (dict) => (dict[lang] !== undefined ? dict[lang] : dict.en);
