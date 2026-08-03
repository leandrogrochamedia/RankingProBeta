// ============================================================
// PROOFLY - LOADER CENTRAL (core + opcional por página)
// ============================================================

(function() {
  const page = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();

  const CORE = [
    './config.js',
    './seed-images.js',
    './utils.js',
    './api.js',
    './session.js',
    './profile-selector.js',
    './proofly-debug.js',
    './router.js',
    './confirm-modal.js',
    './cep.js',
    './menu.js',
    './menu-lateral.js'
  ];

  const OPTIONAL = [];
  const isCliente = page.includes('cliente');
  const needsUser = /^(login|cadastro-cliente|admin|contratar|relatorio-contratante|selecionar-perfil)/.test(page)
    || isCliente || page.startsWith('onboarding-') || page.startsWith('selecionar-');
  const needsReviews = isCliente || /^(perfil-page|contratar|relatorio-contratante|admin)/.test(page);
  const needsTalent = isCliente || /^(contratar|relatorio-contratante|admin)/.test(page);
  const needsHiring = /^(contratar|perfil-page|dashboard-estabelecimento|dashboard-profissional)/.test(page);

  if (needsUser) OPTIONAL.push('./user-service.js');
  if (needsReviews) OPTIONAL.push('./reviews-service.js');
  if (needsTalent) OPTIONAL.push('./talent-market.js');
  if (needsHiring) OPTIONAL.push('./hiring-service.js');

  const scripts = [...CORE, ...OPTIONAL];
  let loaded = 0;

  function loadNext() {
    if (loaded >= scripts.length) {
      document.dispatchEvent(new Event('scriptsLoaded'));
      return;
    }

    const src = scripts[loaded];
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.onload = function() {
      loaded++;
      loadNext();
    };
    script.onerror = function() {
      console.error('❌ Erro ao carregar:', src);
      loaded++;
      loadNext();
    };
    document.head.appendChild(script);
  }

  loadNext();
})();