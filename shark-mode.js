// ============================================================
// RANKING PRO — Shark Mode (Investor Blueprint)
// Congela marketplace/contratar na UI pública. Cliente = cliente.html.
// ============================================================

(function() {
  'use strict';

  /** Páginas congeladas — acessíveis só com DEBUG_MODE ou menu DEV */
  const SHARK_FROZEN_PAGES = [
    'estabelecimento-marketplace.html',
    'relatorio-contratante.html',
    'contratar.html'
  ];

  /** Investor: mercado de talentos visível nos dashboards */
  const SHARK_TALENT_HUB_PAGES = [
    'dashboard-profissional.html',
    'dashboard-estabelecimento.html'
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

  function isTalentHubDashboard(page) {
    const p = String(page || currentPageName()).split('?')[0].replace('./', '');
    return SHARK_TALENT_HUB_PAGES.includes(p);
  }

  /** Dock estabelecimento — Shark: reputação + equipe, sem marketplace */
  function sharkEstablishmentDock(estId) {
    const dash = estId ? './dashboard-estabelecimento.html' : './selecionar-estabelecimento.html';
    return [
      { icon: '🏢', page: dash, label: 'Dashboard' },
      { icon: '👥', page: `${dash}#rhHubSection`, label: 'Equipe' },
      { icon: '⚙️', page: `${dash}#perfil`, label: 'Configurações' }
    ];
  }

  function enforceSharkFrozenRedirect() {
    if (!isSharkMode() || isSharkDevAccess()) return false;
    if (!isSharkFrozenPage()) return false;
    window.location.replace('./dashboard-estabelecimento.html');
    return true;
  }

  function injectSharkFrozenBanner() {
    if (!isSharkMode() || !isSharkDevAccess() || !isSharkFrozenPage()) return;
    if (document.getElementById('sharkFrozenBanner')) return;
    const banner = document.createElement('div');
    banner.id = 'sharkFrozenBanner';
    banner.className = 'shark-frozen-banner';
    banner.setAttribute('role', 'status');
    banner.textContent = '⚠️ Funcionalidade congelada no Shark Mode — visível apenas em DEV.';
    document.body.insertBefore(banner, document.body.firstChild);
    document.body.classList.add('has-shark-frozen-banner');
  }

  function applySharkModeClass() {
    if (isSharkMode()) {
      document.documentElement.classList.add('shark-mode');
    }
  }

  function shouldLoadHiringModules(page) {
    if (!isSharkMode()) return true;
    const p = String(page || currentPageName()).toLowerCase();
    if (isSharkDevAccess()) return true;
    if (/^dashboard-(profissional|estabelecimento)/.test(p)) return true;
    return SHARK_FROZEN_PAGES.some(f => p.includes(f.replace('.html', '')))
      || p.includes('perfil-page');
  }

  function shouldLoadTalentMarket(page) {
    if (!isSharkMode()) return true;
    const p = String(page || currentPageName()).toLowerCase();
    if (isSharkDevAccess()) return true;
    if (/^dashboard-(profissional|estabelecimento)/.test(p)) return true;
    return p.includes('admin') || SHARK_FROZEN_PAGES.some(f => p.includes(f.replace('.html', '')));
  }

  applySharkModeClass();
  enforceSharkFrozenRedirect();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectSharkFrozenBanner);
  } else {
    injectSharkFrozenBanner();
  }

  window.SHARK_FROZEN_PAGES = SHARK_FROZEN_PAGES;
  window.isSharkMode = isSharkMode;
  window.isSharkDevAccess = isSharkDevAccess;
  window.isSharkFrozenPage = isSharkFrozenPage;
  window.sharkEstablishmentDock = sharkEstablishmentDock;
  window.enforceSharkFrozenRedirect = enforceSharkFrozenRedirect;
  window.injectSharkFrozenBanner = injectSharkFrozenBanner;
  window.SHARK_TALENT_HUB_PAGES = SHARK_TALENT_HUB_PAGES;
  window.isTalentHubDashboard = isTalentHubDashboard;
  window.shouldLoadHiringModules = shouldLoadHiringModules;
  window.shouldLoadTalentMarket = shouldLoadTalentMarket;
})();