// Optional viewing helpers only. Every screen is already present without JavaScript.
(() => {
  const board = document.querySelector('.atlas-board');
  const stage = document.querySelector('.atlas-stage');
  const output = document.querySelector('#zoom-label');
  let scale = 1;
  function apply(value) {
    scale = Math.max(.08, Math.min(1.5, value));
    board.style.transform = `scale(${scale})`;
    stage.style.width = `${board.offsetWidth * scale}px`;
    stage.style.height = `${board.offsetHeight * scale}px`;
    output.textContent = `${Math.round(scale * 100)}%`;
  }
  function fit() { apply((innerWidth - 18) / board.offsetWidth); }
  function go(id) {
    const element = document.getElementById(id);
    if (element) scrollTo({ top: element.getBoundingClientRect().top + scrollY - 80, behavior:'instant' });
  }
  document.querySelector('[data-fit]').addEventListener('click', (event) => { event.preventDefault(); fit(); scrollTo(0, 0); });
  document.querySelectorAll('[data-zoom]').forEach((button) => button.addEventListener('click', () => apply(scale * (button.dataset.zoom === '+' ? 1.25 : .8))));
  document.querySelector('#native-size').addEventListener('click', () => apply(1));
  document.querySelector('#flow-select').addEventListener('change', (event) => go(event.target.value));
  document.querySelectorAll('.atlas-cover-bottom nav a').forEach((link) => link.addEventListener('click', (event) => { event.preventDefault(); go(link.hash.slice(1)); }));
  document.querySelectorAll('.atlas-frame').forEach((frame) => frame.addEventListener('dblclick', () => {
    apply(Math.min(1, (innerWidth - 60) / 1440));
    scrollTo({ left: frame.getBoundingClientRect().left + scrollX - 30, top: frame.getBoundingClientRect().top + scrollY - 80, behavior:'instant' });
  }));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { fit(); scrollTo(0, 0); } });
  document.querySelector('#export-html').addEventListener('click', () => {
    const clone = document.documentElement.cloneNode(true);
    clone.querySelector('.atlas-toolbar').remove();
    clone.querySelectorAll('script').forEach((script) => script.remove());
    clone.querySelector('.atlas-stage').removeAttribute('style');
    clone.querySelector('.atlas-stage').style.marginTop = '0';
    clone.querySelector('.atlas-board').removeAttribute('style');
    const url = URL.createObjectURL(new Blob(['<!doctype html>\n' + clone.outerHTML], { type:'text/html;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'tunit-figma.html'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  // Importers see full-size static markup. Only direct file viewing auto-fits the board.
  if (location.protocol === 'file:') { fit(); document.fonts.ready.then(fit); }
})();
