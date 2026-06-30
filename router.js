// ============================================================
// Ranking Pro — Roteador (intent · redirect · transição suave)
// ============================================================

(function (global) {
  'use strict';

  const TRANSITION_MS = 200;

  function resolveRedirect(intent, user) {
    const onboardingUrl = typeof resolveOnboardingUrl === 'function'
      ? resolveOnboardingUrl(intent)
      : null;
    if (onboardingUrl) return onboardingUrl;

    const profileFromIntent = typeof profileTypeFromIntent === 'function'
      ? profileTypeFromIntent(intent)
      : (typeof intentToPersonaType === 'function' ? intentToPersonaType(intent) : null);

    const session = typeof getSession === 'function' ? getSession() : null;
    const merged = {
      ...(session || {}),
      ...(user || {}),
      professionalId: user?.professional_id ?? session?.professionalId,
      establishmentId: user?.establishment_id ?? session?.establishmentId,
      clientId: user?.client_id ?? session?.clientId
    };

    if (profileFromIntent) {
      if (typeof resolvePersonaHome === 'function') {
        return resolvePersonaHome(profileFromIntent, merged);
      }
      return typeof getProfileHomeUrl === 'function'
        ? getProfileHomeUrl(profileFromIntent, merged)
        : './selecionar-perfil.html';
    }

    const activeType = typeof getActiveProfileType === 'function'
      ? getActiveProfileType(session || user)
      : null;

    if (activeType) {
      if (typeof resolvePersonaHome === 'function') {
        return resolvePersonaHome(activeType, merged);
      }
      if (typeof getProfileHomeUrl === 'function') {
        return getProfileHomeUrl(activeType, merged);
      }
    }

    if (merged.userId) return './selecionar-perfil.html';
    return './index.html';
  }

  function executeRedirect(session) {
    const params = new URLSearchParams(global.location.search);
    const intent = params.get('intent');
    const url = resolveRedirect(intent, session);
    const current = global.location.pathname.split('/').pop() || 'index.html';
    const target = url.replace('./', '');
    if (target !== current) {
      navigateWithTransition(url);
    }
  }

  function normalizeTipo(tipo) {
    const t = String(tipo || '').toLowerCase();
    if (t === 'prof' || t === 'professional') return 'profissional';
    if (t === 'est' || t === 'establishment') return 'estabelecimento';
    return t;
  }

  function profileUrl(tipo, id) {
    if (typeof profilePageUrl === 'function') {
      return profilePageUrl(normalizeTipo(tipo), id);
    }
    const isProf = normalizeTipo(tipo) === 'profissional';
    const type = isProf ? 'professional' : 'establishment';
    const legacy = isProf ? 'profissional' : 'estabelecimento';
    return `./perfil-page.html?id=${encodeURIComponent(id)}&type=${type}&tipo=${legacy}`;
  }

  function applyFocusFadeOut() {
    document.body.classList.add('rp-focus-fade-out');
  }

  function fadeNavigate(url) {
    const href = String(url || '');
    if (!href || href === '#') return;

    applyFocusFadeOut();

    let veil = document.getElementById('rpPageTransition');
    if (!veil) {
      veil = document.createElement('div');
      veil.id = 'rpPageTransition';
      veil.className = 'rp-page-transition';
      document.body.appendChild(veil);
    }

    veil.classList.add('is-active');
    window.setTimeout(() => {
      global.location.href = href;
    }, TRANSITION_MS);
  }

  function navigateWithTransition(url, opts) {
    const options = opts || {};
    const href = String(url || '');
    if (!href || href === '#') return Promise.resolve();

    if (options.replace) {
      if (global.document.startViewTransition && !options.forceFade) {
        global.document.startViewTransition(() => {
          global.location.replace(href);
        });
        return Promise.resolve();
      }
      fadeNavigate(href);
      return new Promise((resolve) => {
        window.setTimeout(resolve, TRANSITION_MS + 20);
      });
    }

    if (global.document.startViewTransition && !options.forceFade) {
      global.document.startViewTransition(() => {
        global.location.href = href;
      });
      return Promise.resolve();
    }

    fadeNavigate(href);
    return new Promise((resolve) => {
      window.setTimeout(resolve, TRANSITION_MS + 20);
    });
  }

  function openProfileDrawer(tipo, id) {
    if (typeof global.abrirDrawer === 'function') {
      global.abrirDrawer(normalizeTipo(tipo), id);
      return true;
    }
    return false;
  }

  function openProfile(tipo, id, opts) {
    const options = { forcePage: true, ...(opts || {}) };
    const normalized = normalizeTipo(tipo);
    if (!id) return false;

    if (options.mode === 'drawer' && !options.forcePage && openProfileDrawer(normalized, id)) {
      return true;
    }

    navigateWithTransition(profileUrl(normalized, id), { forceFade: true });
    return true;
  }

  function closeProfileView() {
    document.body.classList.remove('profile-view-open');
  }

  global.resolveRedirect = resolveRedirect;
  global.executeRedirect = executeRedirect;
  global.navigateWithTransition = navigateWithTransition;
  global.RankingProRouter = {
    navigate: navigateWithTransition,
    openProfile,
    closeProfileView,
    profileUrl,
    TRANSITION_MS
  };
})();