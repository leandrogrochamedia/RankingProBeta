// ============================================================
// Ranking Pro — SPA-lite router (hash)
// Gradual: módulos quando existem; senão navega para .html
// ============================================================

(function (global) {
  'use strict';

  const SCREENS = global.RankingProScreens || {};
  const HTML_TO_ROUTE = global.RankingProHtmlToRoute || {};
  let currentRoute = null;
  let booted = false;

  function sitePrefix() {
    if (global.RankingProPaths?.prefix) return global.RankingProPaths.prefix();
    return './';
  }

  function parseHash() {
    const raw = (global.location.hash || '').replace(/^#\/?/, '');
    const qIdx = raw.indexOf('?');
    const path = (qIdx >= 0 ? raw.slice(0, qIdx) : raw).replace(/\/$/, '') || 'home';
    const query = qIdx >= 0 ? raw.slice(qIdx) : '';
    return { path, query };
  }

  function screenForPath(path) {
    if (SCREENS[path]) return SCREENS[path];
    if (path.startsWith('perfil/')) {
      return { route: '/perfil/:type/:id', html: './perfil-page.html', module: null };
    }
    return null;
  }

  function htmlToRoute(href) {
    const str = String(href || '').replace(/^\.\//, '');
    const base = str.split('?')[0].split('#')[0];
    return HTML_TO_ROUTE[base] || null;
  }

  function buildHash(routeKey, query) {
    const screen = SCREENS[routeKey];
    const path = screen?.route?.replace(/^\//, '') || routeKey;
    const qs = query ? (query.startsWith('?') ? query : '?' + query) : '';
    return '#/' + (path === '' ? '' : path) + qs;
  }

  function isShellPage() {
    const page = (global.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    return page === 'index.html' || page === '';
  }

  function hideSplash() {
    const splash = global.document.getElementById('home-splash-root');
    const root = global.document.getElementById('app-root');
    if (splash) splash.hidden = true;
    if (root) root.hidden = false;
  }

  function showSplash() {
    const splash = global.document.getElementById('home-splash-root');
    const root = global.document.getElementById('app-root');
    if (splash) splash.hidden = false;
    if (root) {
      root.hidden = true;
      root.innerHTML = '';
    }
  }

  async function loadScreenModule(screen, root) {
    if (!screen?.module) return false;
    const src = sitePrefix() + screen.module.replace(/^\.\//, '');
    await new Promise(function (resolve, reject) {
      const s = global.document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      global.document.body.appendChild(s);
    });
    if (typeof global.bootDashboardProfissional === 'function' && screen.module.includes('profissional')) {
      global.bootDashboardProfissional();
      return true;
    }
    if (typeof global.bootDashboardEstabelecimento === 'function' && screen.module.includes('estabelecimento')) {
      global.bootDashboardEstabelecimento();
      return true;
    }
    root.innerHTML = `<p class="nucleus-state">Screen <strong>${screen.route}</strong> carregada.</p>`;
    return true;
  }

  async function renderRoute() {
    const { path, query } = parseHash();
    const screen = screenForPath(path);

    if (!screen) {
      if (path === 'home' || path === '') {
        showSplash();
        currentRoute = 'home';
        return;
      }
      global.location.replace(sitePrefix() + 'index.html');
      return;
    }

    if (!isShellPage()) {
      if (screen.html) {
        const dest = screen.html.replace(/^\.\//, sitePrefix().replace(/^\.\//, ''));
        global.location.replace(dest + query);
      }
      return;
    }

    if (!screen.module) {
      if (screen.html && screen.html !== './index.html') {
        const dest = screen.html + (screen.redirectQuery ? query : '');
        if (typeof global.navigateWithTransition === 'function') {
          global.navigateWithTransition(dest);
        } else {
          global.location.href = dest;
        }
        return;
      }
      showSplash();
      currentRoute = path;
      return;
    }

    hideSplash();
    const root = global.document.getElementById('app-root');
    if (!root) return;
    root.innerHTML = '<div class="rp-screen-loading">Carregando…</div>';
    try {
      await loadScreenModule(screen, root);
      currentRoute = path;
      if (screen.title) global.document.title = '🏆 Ranking Pro — ' + screen.title;
    } catch (err) {
      console.error('Router module load failed:', err);
      global.location.href = screen.html || './index.html';
    }
  }

  function navigate(target) {
    const str = String(target || '');
    if (!str || str === '#') return;

    if (str.startsWith('#')) {
      global.location.hash = str;
      return;
    }

    const routeKey = htmlToRoute(str);
    if (routeKey && isShellPage()) {
      const qs = str.includes('?') ? str.split('?').slice(1).join('?') : '';
      global.location.hash = buildHash(routeKey, qs);
      return;
    }

    if (typeof global.navigateWithTransition === 'function') {
      global.navigateWithTransition(str.startsWith('./') ? str : './' + str);
      return;
    }
    global.location.href = str.startsWith('./') ? str : './' + str;
  }

  function start() {
    if (booted) return;
    booted = true;
    global.addEventListener('hashchange', renderRoute);
    global.addEventListener('popstate', renderRoute);
    if (global.location.hash) {
      renderRoute();
    }
  }

  global.RankingProRouter = {
    navigate: navigate,
    renderRoute: renderRoute,
    parseHash: parseHash,
    buildHash: buildHash,
    htmlToRoute: htmlToRoute,
    start: start,
    get currentRoute() { return currentRoute; }
  };

  if (global.document.readyState === 'loading') {
    global.document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})(window);