// Ranking Pro — Shark Mode v1 (escopo congelado)

(function () {
  'use strict';

  const SHARK_FROZEN_PAGES = [
    'estabelecimento-marketplace.html',
    'relatorio-contratante.html',
    'contratar.html'
  ];

  function isSharkMode() {
    return typeof SHARK_MODE !== 'undefined' && !!SHARK_MODE;
  }

  function isSharkDevAccess() {
    if (!isSharkMode()) return true;
    return !!(
      (typeof DEBUG_MODE !== 'undefined' && DEBUG_MODE) ||
      (typeof PROOFLY_DEV_MENU !== 'undefined' && PROOFLY_DEV_MENU)
    );
  }

  function currentPageName() {
    return (window.location.pathname.split('/').pop() || 'index.html').split('?')[0];
  }

  function isSharkFrozenPage(page) {
    const p = String(page || currentPageName()).split('?')[0].replace('./', '');
    return SHARK_FROZEN_PAGES.includes(p);
  }

  function enforceSharkFrozenRedirect() {
    if (!isSharkMode() || isSharkDevAccess()) return false;
    if (!isSharkFrozenPage()) return false;
    window.location.replace('./dashboard-estabelecimento.html');
    return true;
  }

  function applySharkModeClass() {
    if (isSharkMode()) document.documentElement.classList.add('shark-mode');
  }

  applySharkModeClass();
  enforceSharkFrozenRedirect();

  window.SHARK_FROZEN_PAGES = SHARK_FROZEN_PAGES;
  window.isSharkMode = isSharkMode;
  window.isSharkDevAccess = isSharkDevAccess;
  window.isSharkFrozenPage = isSharkFrozenPage;
  window.enforceSharkFrozenRedirect = enforceSharkFrozenRedirect;
})();