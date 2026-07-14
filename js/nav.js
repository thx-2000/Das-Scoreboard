/**
 * Burger-Menue fuer schmale Bildschirme (siehe css/style.css .app-nav-toggle
 * fuer den Breakpoint). Auf breiteren Bildschirmen ist der Toggle-Button
 * per CSS unsichtbar und die Nav immer offen - dieses Skript greift dann
 * nicht ein.
 */
(function initNavToggle() {
  const toggleBtn = document.getElementById('nav-toggle-btn');
  const nav = document.getElementById('app-nav');
  if (!toggleBtn || !nav) return;

  function setOpen(isOpen) {
    nav.classList.toggle('is-open', isOpen);
    toggleBtn.setAttribute('aria-expanded', String(isOpen));
    const label = window.t ? window.t(isOpen ? 'common.nav.closeMenu' : 'common.nav.openMenu') : null;
    if (label) toggleBtn.setAttribute('aria-label', label);
  }

  toggleBtn.addEventListener('click', () => {
    setOpen(!nav.classList.contains('is-open'));
  });

  document.addEventListener('click', (event) => {
    if (!nav.classList.contains('is-open')) return;
    if (nav.contains(event.target) || toggleBtn.contains(event.target)) return;
    setOpen(false);
  });

  nav.addEventListener('click', (event) => {
    if (event.target.tagName === 'A') setOpen(false);
  });
})();
