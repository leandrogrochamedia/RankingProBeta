// ============================================================
// Ranking Pro — LOADER CANÔNICO (raiz · Opção A · Fase 2+)
// Subpastas qr/avaliar/p usam scripts ../ diretos.
// js/loader.js está DEPRECATED — use ./loader.js na raiz.
// ============================================================

(function () {
  'use strict';

  // Report navigation to DevTool / LOCAL BROWSER parent (works even on file://).
  (function reportPreviewNav() {
    if (window.parent === window) return;

    const MSG = 'ranking-pro-preview-nav';

    function sitePath() {
      let p = location.pathname || '/';
      if (p.startsWith('/app/')) p = p.slice(4) || '/';
      else if (p === '/app') p = '/';
      const file = p.split('/').filter(Boolean).pop() || 'index.html';
      const suffix = `${location.search || ''}${location.hash || ''}`;
      if (file === 'index.html') return `/${suffix}`;
      return `/${file}${suffix}`;
    }

    function report() {
      try {
        window.parent.postMessage({
          type: MSG,
          path: sitePath(),
          href: location.href
        }, '*');
      } catch { /* noop */ }
    }

    report();
    window.addEventListener('popstate', report);
    window.addEventListener('hashchange', report);
    window.addEventListener('pageshow', report);
    window.addEventListener('load', report);
    document.addEventListener('DOMContentLoaded', report);
    document.addEventListener('click', () => setTimeout(report, 0), true);

    const pushState = history.pushState;
    const replaceState = history.replaceState;
    if (typeof pushState === 'function') {
      history.pushState = function (...args) {
        const result = pushState.apply(this, args);
        report();
        return result;
      };
    }
    if (typeof replaceState === 'function') {
      history.replaceState = function (...args) {
        const result = replaceState.apply(this, args);
        report();
        return result;
      };
    }
  })();

  const page = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const isClienteDiscovery = page === 'cliente.html';
  const isCliente = page.includes('cliente');
  const skipFloatingMenu = /^(apendice|widget|sql-log|base-de-dados)/.test(page);

  const CORE = [
    './config.js',
    './shark-mode.js',
    './utils.js',
    './api.js',
    './session.js',
    './flow-registry.js',
    './profile-selector.js',
    './confirm-modal.js',
    './user-greeting.js',
    './menu-lateral.js',
    './dev-role-simulation.js'
  ];

  // menu.js: dock em cliente, meu-perfil, perfil-page, favoritos, dashboards, etc.
  if (!skipFloatingMenu) CORE.push('./menu.js');

  const OPTIONAL = [];
  const needsUser = /^(login|cadastro-cliente|meu-perfil|admin|selecionar-perfil|minhas-avaliacoes)/.test(page)
    || isCliente || page.startsWith('onboarding-') || page.startsWith('selecionar-')
    || /^dashboard-(profissional|estabelecimento)/.test(page);
  const isDashboard = /^dashboard-(profissional|estabelecimento)/.test(page);
  const needsReviews = isClienteDiscovery || /^(perfil-page|minhas-avaliacoes|meu-perfil)/.test(page) || isDashboard;
  const sharkOn = typeof SHARK_MODE !== 'undefined' && SHARK_MODE;
  const sharkDev = sharkOn && (
    (typeof DEBUG_MODE !== 'undefined' && DEBUG_MODE) ||
    (typeof PROOFLY_DEV_MENU !== 'undefined' && PROOFLY_DEV_MENU)
  );
  const needsMarketplace = !sharkOn || sharkDev;

  if (needsUser) OPTIONAL.push('./user-service.js');
  if (page === 'meu-perfil.html') OPTIONAL.push('./meu-perfil.js');
  if (needsReviews) OPTIONAL.push('./reviews-service.js');
  if (needsMarketplace && /^(estabelecimento-marketplace|relatorio-contratante|admin)/.test(page)) {
    OPTIONAL.push('./talent-market.js', './hiring-service.js');
  }
  if (needsMarketplace && /^(estabelecimento-marketplace|perfil-page|dashboard-estabelecimento|dashboard-profissional)/.test(page)) {
    if (!OPTIONAL.includes('./hiring-service.js')) OPTIONAL.push('./hiring-service.js');
  }
  if (!sharkOn || sharkDev) {
    if (isClienteDiscovery && !OPTIONAL.includes('./talent-market.js')) OPTIONAL.push('./talent-market.js');
  }
  if (isDashboard) {
    OPTIONAL.push('./router.js', './components/profile-card.js', './talent-market.js', './hiring-service.js');
  }
  if (page === 'dashboard-estabelecimento.html') {
    OPTIONAL.push('./widget-utils.js', './widget-embed.js');
  }
  if (page === 'buscar.html') OPTIONAL.push('./buscar.js');
  if (isClienteDiscovery) OPTIONAL.push('./qr-upload-decode.js');

  const scripts = CORE.concat(OPTIONAL);
  const CACHE_BUST = '20260628-qr-decode-panel';
  let loaded = 0;

  function loadNext() {
    if (loaded >= scripts.length) {
      window.PROOFLY_SCRIPTS_READY = true;
      document.dispatchEvent(new Event('scriptsLoaded'));
      return;
    }

    const src = scripts[loaded];
    const script = document.createElement('script');
    script.src = src + (src.indexOf('?') >= 0 ? '&' : '?') + 'v=' + CACHE_BUST;
    script.async = false;
    script.onload = function () { loaded++; loadNext(); };
    script.onerror = function () {
      console.error('Erro ao carregar:', src);
      loaded++;
      loadNext();
    };
    document.head.appendChild(script);
  }

  loadNext();
})();