// filter.js: category buttons and a search box for the conditions grid.
// Without JS every card is visible, so nothing is lost.

document.querySelectorAll('[data-filter]').forEach((root) => {
  const buttons = [...root.querySelectorAll('[data-cat-btn]')];
  const search = root.querySelector('[data-search]');
  const cards = [...document.querySelectorAll(root.dataset.filter)];
  const count = root.querySelector('[data-count-live]');
  root.hidden = false;

  let active = 'all';
  const apply = () => {
    const q = (search?.value || '').trim().toLowerCase();
    let shown = 0;
    cards.forEach((card) => {
      const inCat = active === 'all' || card.dataset.cat === active;
      const inText = !q || card.textContent.toLowerCase().includes(q);
      const show = inCat && inText;
      const was = !card.hidden;
      card.hidden = !show;
      card.classList.toggle('is-shown', show && !was);
      if (show) shown++;
    });
    if (count) count.textContent = shown === cards.length
      ? `Showing all ${shown} condition groups.`
      : `Showing ${shown} of ${cards.length} condition groups.`;
  };

  buttons.forEach((btn) => btn.addEventListener('click', () => {
    active = btn.dataset.catBtn;
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    apply();
  }));
  search?.addEventListener('input', apply);

  // Deep link: /conditions/#skin selects that category.
  const fromHash = location.hash.slice(1);
  const match = buttons.find((b) => b.dataset.catBtn === fromHash);
  if (match) match.click(); else apply();
});
