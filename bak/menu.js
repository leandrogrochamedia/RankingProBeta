// =====================================================
// PROOFLY - Menu Flutuante Inferior (USUÁRIO)
// =====================================================
// Uso livre: menu aparece também sem sessão (busca + entrar).
// Perfil definido depois via login → selecionar-perfil.
// =====================================================

(function() {
  const session = typeof getSession === 'function' ? getSession() : null;
  const activeType = typeof getActiveProfileType === 'function'
    ? getActiveProfileType(session)
    : null;
  let items = [];

  if (!session?.userId) {
    items = [
      { icon: '🏠', page: 'index.html', label: 'Início' },
      { icon: '🔍', page: 'cliente.html', label: 'Buscar' },
      { icon: '❤️', page: 'favoritos.html', label: 'Favoritos' },
      { icon: '🔐', page: 'login.html?returnTo=cliente.html', label: 'Entrar' },
    ];
  } else if (!activeType) {
    items = [
      { icon: '🔍', page: 'cliente.html', label: 'Buscar' },
      { icon: '❤️', page: 'favoritos.html', label: 'Favoritos' },
      { icon: '👤', page: 'selecionar-perfil.html', label: 'Definir perfil' },
    ];
  } else if (activeType === 'client' || session.role === 'cliente') {
    items = [
      { icon: '🔍', page: 'cliente.html', label: 'Buscar' },
      { icon: '❤️', page: 'favoritos.html', label: 'Favoritos' },
      { icon: '✨', page: 'selecionar-cliente.html?force=true', label: 'Meu perfil' },
    ];
  } else if (activeType === 'professional' || session.role === 'profissional') {
    const profId = session.professionalId || '';
    items = [
      { icon: '🔍', page: 'cliente.html', label: 'Buscar' },
      { icon: '📊', page: profId ? 'dashboard-profissional.html' : 'selecionar-profissional.html', label: 'Dashboard' },
      { icon: '💬', page: profId ? 'dashboard-profissional.html' : 'selecionar-profissional.html', label: 'Avaliações' },
    ];
  } else if (activeType === 'establishment' || session.role === 'estabelecimento') {
    const estId = session.establishmentId || '';
    items = [
      { icon: '🔍', page: estId ? 'contratar.html' : 'selecionar-estabelecimento.html', label: 'Contratar' },
      { icon: '🏢', page: estId ? 'dashboard-estabelecimento.html' : 'selecionar-estabelecimento.html', label: 'Meu negócio' },
      { icon: '❤️', page: 'favoritos.html', label: 'Favoritos' },
    ];
  } else {
    items = [
      { icon: '🔍', page: 'cliente.html', label: 'Buscar' },
      { icon: '📊', page: 'admin.html', label: 'Admin' },
    ];
  }

  if (session?.userId) {
    if (activeType) {
      const switchUrl = typeof getProfileSelectorUrl === 'function'
        ? getProfileSelectorUrl(true)
        : './selecionar-perfil.html?forceProfileSelect=true';
      items.push({
        icon: '🔀',
        page: switchUrl,
        label: 'Trocar perfil'
      });
    }
    items.push({
      icon: '🚪',
      page: '#',
      label: 'Sair',
      action: 'logout'
    });
  }

  const currentPage = window.location.pathname.split('/').pop() || 'cliente.html';

  let html = '<nav class="floating-menu" aria-label="Menu do usuário">';
  items.forEach(item => {
    const pageBase = item.page.split('?')[0];
    const active = (pageBase === currentPage) ? ' active' : '';
    const clickAttr = item.action === 'logout' ? ` onclick="event.preventDefault(); logout();"` : '';
    html += `
      <a href="${item.page}" class="menu-item${active}" data-tooltip="${item.label}"${clickAttr}>
        <span class="menu-icon">${item.icon}</span>
      </a>
    `;
  });
  html += '</nav>';

  document.body.insertAdjacentHTML('afterbegin', html);

  window.logout = function() {
    if (typeof resetSessionAndGoHome === 'function') {
      resetSessionAndGoHome();
      return;
    }
    if (typeof clearSession === 'function') clearSession();
    window.location.replace('index.html');
  };
})();