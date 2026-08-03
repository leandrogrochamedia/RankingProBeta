// ============================================================
// Ranking Pro — Menu lateral (atalhos DEV + navegação demo)
// Navegação principal do cliente: header + menu flutuante (menu.js)
// ============================================================

(function() {
  if (typeof PROOFLY_DEV_MENU !== 'undefined' && !PROOFLY_DEV_MENU) return;

  const items = [
    { icon: '🏠', page: './index.html', label: 'Início' },
    { icon: '👤', page: './perfil-page.html', label: 'Perfil (página)' },
    { icon: '🧪', page: './dev-simulation.html', label: 'Simulação DEV' },
    { icon: '📚', page: './apendice.html', label: 'Apêndice DEV' },
    { icon: '📣', page: './widget.html', label: 'Widget' },
    { icon: '📊', page: './admin.html', label: 'Admin' },
    { icon: '🗄️', page: './sql-log.html', label: 'SQL Log' },
    { icon: '🔄', page: '#', label: 'Reset Session', action: 'reset' }
  ];

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const currentBase = currentPage.split('?')[0];

  let html = '<nav class="menu-lateral menu-lateral--dev" aria-label="Navegação lateral">';
  items.forEach(item => {
    const itemBase = item.page.split('?')[0].replace('./', '');
    const active = itemBase === currentBase ? ' active' : '';
    let clickAttr = '';
    if (item.action === 'reset') {
      clickAttr = ` onclick="event.preventDefault(); resetSession();"`;
    }
    html += `
      <a href="${item.page}" class="menu-lateral-item${active}" data-tooltip="${item.label}"${clickAttr}>
        <span class="menu-lateral-icon">${item.icon}</span>
        <span class="menu-lateral-label">${item.label}</span>
      </a>
    `;
  });
  html += '</nav>';

  document.body.insertAdjacentHTML('afterbegin', html);
  document.body.classList.add('has-dev-menu');

})();