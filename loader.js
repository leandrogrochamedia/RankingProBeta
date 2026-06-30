// ============================================================
// Ranking Pro — LOADER CANÔNICO (raiz + subpastas via site-paths.js)
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

  function getPageKey() {
    const parts = (location.pathname || '').split('/').filter(Boolean);
    const file = (parts.pop() || 'index.html').toLowerCase();
    // Rotas de pasta (/p/, /e/, /qr/) — servidor entrega index.html mas o path não inclui o arquivo
    if (!/\.html?$/.test(file)) {
      const dir = parts.length ? parts.join('/') + '/' + file : file;
      return dir + '/index.html';
    }
    if (file === 'index.html' && parts.length) {
      return parts.join('/') + '/index.html';
    }
    if (parts.length) {
      return parts.join('/') + '/' + file;
    }
    return file;
  }

  const root = (typeof RankingProPaths !== 'undefined' && RankingProPaths.prefix)
    ? RankingProPaths.prefix()
    : './';

  function rp(path) {
    return root + String(path || '').replace(/^\.\//, '');
  }

  const pageKey = getPageKey();
  const page = pageKey.includes('/') ? pageKey.split('/').pop() : pageKey;
  const isClienteDiscovery = page === 'cliente.html';
  const isCliente = page.includes('cliente');
  const isPublicLanding = /^(p|e)\/index\.html$/.test(pageKey);
  const skipFloatingMenu = /^(apendice|widget|sql-log|base-de-dados)/.test(page)
    || /^(qr|avaliar|p|e)\/index\.html$/.test(pageKey)
    || pageKey === 'dev/gerar-qr.html';

  const CORE = [
    rp('pwa-register.js'),
    rp('config.js'),
    rp('shark-mode.js'),
    rp('utils.js'),
    rp('api.js'),
    rp('session.js'),
    rp('flow-registry.js'),
    rp('profile-selector.js'),
    rp('confirm-modal.js'),
    rp('overlay.js'),
    rp('user-greeting.js')
  ];

  if (!isPublicLanding) {
    CORE.push(rp('menu-lateral.js'), rp('dev-role-simulation.js'));
  }

  if (!skipFloatingMenu) CORE.push(rp('menu.js'));

  const OPTIONAL = [];
  const needsUser = /^(login|cadastro-cliente|meu-perfil|admin|selecionar-perfil|minhas-avaliacoes)/.test(page)
    || isCliente || page.startsWith('onboarding-') || page.startsWith('selecionar-')
    || /^dashboard-(profissional|estabelecimento)/.test(page)
    || pageKey === 'widget.html';
  const isDashboard = /^dashboard-(profissional|estabelecimento)/.test(page);
  const needsReviews = isClienteDiscovery || /^(perfil-page|minhas-avaliacoes|meu-perfil)/.test(page) || isDashboard;
  const sharkOn = typeof SHARK_MODE !== 'undefined' && SHARK_MODE;
  const sharkDev = sharkOn && (
    (typeof DEBUG_MODE !== 'undefined' && DEBUG_MODE) ||
    (typeof PROOFLY_DEV_MENU !== 'undefined' && PROOFLY_DEV_MENU)
  );
  const needsMarketplace = !sharkOn || sharkDev;

  if (needsUser) OPTIONAL.push(rp('user-service.js'));
  if (page === 'meu-perfil.html') OPTIONAL.push(rp('meu-perfil.js'));
  if (needsReviews) OPTIONAL.push(rp('reviews-service.js'));
  if (needsMarketplace && /^(estabelecimento-marketplace|relatorio-contratante|admin)/.test(page)) {
    OPTIONAL.push(rp('talent-market.js'), rp('hiring-service.js'));
  }
  if (needsMarketplace && /^(estabelecimento-marketplace|perfil-page|dashboard-estabelecimento|dashboard-profissional)/.test(page)) {
    if (!OPTIONAL.includes(rp('hiring-service.js'))) OPTIONAL.push(rp('hiring-service.js'));
  }
  if (!sharkOn || sharkDev) {
    if (isClienteDiscovery && !OPTIONAL.includes(rp('talent-market.js'))) OPTIONAL.push(rp('talent-market.js'));
  }
  if (isDashboard) {
    OPTIONAL.push(rp('router.js'), rp('components/profile-card.js'), rp('talent-market.js'), rp('hiring-service.js'));
  }
  if (page === 'dashboard-estabelecimento.html') {
    OPTIONAL.push(rp('widget-utils.js'), rp('widget-embed.js'));
  }
  if (page === 'buscar.html') OPTIONAL.push(rp('buscar.js'));
  if (isClienteDiscovery) {
    OPTIONAL.push(rp('qr-upload-decode.js'), rp('qr-service.js'), rp('services/qr-flow.js'));
  }
  if (isDashboard && !OPTIONAL.includes(rp('qr-service.js'))) {
    OPTIONAL.push(rp('qr-service.js'));
  }

  // F1 — páginas que carregavam scripts manualmente
  if (page === 'onboarding-profissional.html') {
    OPTIONAL.push(rp('seed-images.js'), rp('router.js'));
  }
  if (page === 'onboarding-estabelecimento.html') {
    OPTIONAL.push(rp('seed-images.js'), rp('router.js'));
  }
  if (page === 'selecionar-profissional.html' || page === 'selecionar-estabelecimento.html') {
    OPTIONAL.push(rp('router.js'));
  }
  if (pageKey === 'widget.html') {
    OPTIONAL.push(rp('widget-utils.js'), rp('widget-embed.js'));
  }
  if (pageKey === 'sql-log.html' || pageKey === 'sql-run/027-establishment-owners.html') {
    OPTIONAL.push(rp('sql-embedded.js'), rp('sql-runner.js'));
  }
  if (pageKey === 'dev-simulation.html') {
    OPTIONAL.push(rp('proofly-debug.js'), rp('talent-market.js'), rp('base-de-dados-schema.js'), rp('dev-control-center.js'));
  }
  if (pageKey === 'base-de-dados-completa.html') {
    OPTIONAL.push(rp('base-de-dados-schema.js'), rp('base-de-dados-app.js'));
  }
  if (pageKey === 'qr/index.html' || pageKey === 'avaliar/index.html') {
    OPTIONAL.push(rp('qr-service.js'), rp('services/qr-flow.js'));
  }
  if (pageKey === 'p/index.html' || pageKey === 'e/index.html') {
    OPTIONAL.push(rp('profile-service.js'), rp('components/perfil-premium.js'), rp('passaporte-landing.js'));
  }
  if (pageKey === 'dev/gerar-qr.html') {
    OPTIONAL.push(rp('qr-service.js'), rp('site-nav.js'));
  }
  if (page === 'index.html') {
    OPTIONAL.push(rp('app/screens-registry.js'), rp('app/router.js'));
  }

  // P0 — router em discovery + perfil-page (openProfile default = página)
  if (/^(cliente|favoritos|perfil-page|estabelecimento-marketplace)\.html$/.test(page) || isClienteDiscovery) {
    if (!OPTIONAL.includes(rp('router.js'))) OPTIONAL.push(rp('router.js'));
  }

  const scripts = CORE.concat(OPTIONAL);
  const CACHE_BUST = '20260630-f7-vite-pwa';
  let loaded = 0;

  function loadNext() {
    if (loaded >= scripts.length) {
      window.RANKING_PRO_SCRIPTS_READY = true;
      window.PROOFLY_SCRIPTS_READY = true; // deprecated alias — remover após 1 sprint
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