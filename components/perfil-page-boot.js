// Boot enxuto: perfil-page.html (core via loader + profile-card + profile-page-view)
(function() {
  'use strict';

  let started = false;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (src.includes('perfil-premium') && typeof ProfilePremium !== 'undefined') return resolve();
      if (src.includes('profile-page-view') && typeof ProfilePageView !== 'undefined') return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(src));
      document.body.appendChild(s);
    });
  }

  function hideLoading() {
    const overlay = document.getElementById('perfilLoadingOverlay');
    if (overlay) overlay.classList.add('hidden');
  }

  async function boot() {
    if (started) return;
    if (typeof getSession !== 'function') return;

    started = true;

    try {
      await loadScript('./components/perfil-premium.js');
      await loadScript('./profile-page-view.js');
      ProfilePageView.init('perfilContent', 'perfilActions');
      await ProfilePageView.loadFromUrl();
      hideLoading();
    } catch (e) {
      hideLoading();
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