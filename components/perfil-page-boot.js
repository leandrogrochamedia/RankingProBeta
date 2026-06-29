// Boot enxuto: perfil-page.html (core via loader + profile-card + profile-page-view)
(function() {
  'use strict';

  let started = false;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (src.includes('profile-card') && typeof ProfileCard !== 'undefined') return resolve();
      if (src.includes('profile-page-view') && typeof ProfilePageView !== 'undefined') return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(src));
      document.body.appendChild(s);
    });
  }

  function configureBackButton(session) {
    const backBtn = document.getElementById('perfilBackBtn');
    if (!backBtn) return;
    const href = typeof defaultSearchPageUrl === 'function'
      ? defaultSearchPageUrl()
      : (session?.role === 'estabelecimento' ? './dashboard-estabelecimento.html' : './cliente.html');
    backBtn.href = href;
    backBtn.textContent = session?.role === 'estabelecimento'
      ? '← Voltar à busca Contratar'
      : '← Voltar à busca';
  }

  async function boot() {
    if (started) return;
    if (typeof getSession !== 'function') return;

    started = true;
    const session = getSession();
    const allowed = session && (
      session.role === 'cliente'
      || session.role === 'estabelecimento'
      || session.role === 'admin'
      || session.provider === 'dev-simulation'
    );
    if (!allowed) {
      window.location.href = 'login.html';
      return;
    }

    configureBackButton(session);

    try {
      await loadScript('./components/profile-card.js');
      await loadScript('./profile-page-view.js');
      ProfilePageView.init('perfilContent', 'perfilActions');
      ProfilePageView.loadFromUrl();
    } catch (e) {
      console.error(e);
      const el = document.getElementById('perfilContent');
      const back = typeof defaultSearchPageUrl === 'function' ? defaultSearchPageUrl() : './cliente.html';
      if (el) {
        el.innerHTML = `<p class="empty-msg">Erro ao carregar perfil. <a href="${back}">Voltar</a></p>`;
      }
    }
  }

  document.addEventListener('scriptsLoaded', boot, { once: true });
  if (typeof getSession === 'function') boot();
})();