// ============================================================
// Ranking Pro — Menu lateral (atalhos DEV + navegação demo)
// Navegação principal do cliente: header + menu flutuante (menu.js)
// ============================================================

(function() {
  if (typeof PROOFLY_DEV_MENU !== 'undefined' && !PROOFLY_DEV_MENU) return;

  if (!window.simularCliente) {
    const base = (document.currentScript?.src || '').replace(/menu-lateral\.js.*$/, '') || './';
    const sim = document.createElement('script');
    sim.src = `${base}dev-role-simulation.js`;
    sim.async = false;
    document.head.appendChild(sim);
  }

  const EDGE_PX = 100;
  const isTouchUI = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  const items = [
    { icon: '🏠', page: './index.html', label: 'Início' },
    { icon: '👤', action: 'simular-cliente', label: 'Cliente' },
    { icon: '💼', action: 'simular-profissional', label: 'Profissional' },
    { icon: '🏢', action: 'simular-estabelecimento', label: 'Estabelecimento' },
    { icon: '🧪', page: './dev-simulation.html', label: 'Simulação DEV' },
    { icon: '📚', page: './apendice.html', label: 'Apêndice DEV' },
    { icon: '📣', page: './widget.html', label: 'Widget' },
    { icon: '📊', page: './admin.html', label: 'Admin' },
    { icon: '🗄️', page: './sql-log.html', label: 'SQL Log' },
    { icon: '📄', page: './perfil-page.html', label: 'Perfil (página)' },
    { icon: '🔍', page: './estabelecimento-marketplace.html', label: 'Marketplace (DEV)' },
    { icon: '📋', page: './relatorio-contratante.html', label: 'Relatório RH (DEV)' },
    { icon: '🚪', page: '#', label: 'Sair', action: 'logout' }
  ];

  const ACTION_HANDLERS = {
    'simular-cliente': 'simularCliente',
    'simular-profissional': 'simularProfissional',
    'simular-estabelecimento': 'simularEstabelecimento',
    logout: 'logout'
  };

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const currentBase = currentPage.split('?')[0];

  let html = '<nav class="menu-lateral menu-lateral--dev" aria-label="Navegação lateral">';
  items.forEach(item => {
    const itemBase = item.page ? item.page.split('?')[0].replace('./', '') : '';
    const active = itemBase && itemBase === currentBase ? ' active' : '';
    let clickAttr = '';
    if (item.action) {
      const fn = ACTION_HANDLERS[item.action];
      if (item.action === 'logout') {
        clickAttr = ` onclick="event.preventDefault(); (typeof resetSessionAndGoHome==='function'?resetSessionAndGoHome:logout)();"`;
      } else {
        clickAttr = ` onclick="event.preventDefault(); window.${fn}&&window.${fn}();"`;
      }
    }
    const href = item.page || '#';
    html += `
      <a href="${href}" class="menu-lateral-item${active}" data-tooltip="${item.label}"${clickAttr}>
        <span class="menu-lateral-icon">${item.icon}</span>
        <span class="menu-lateral-label">${item.label}</span>
      </a>
    `;
  });
  html += '</nav>';

  const edgeZone = document.createElement('div');
  edgeZone.className = 'dev-menu-edge-zone';
  edgeZone.setAttribute('aria-hidden', 'true');
  document.body.insertAdjacentHTML('afterbegin', html);
  document.body.appendChild(edgeZone);
  document.body.classList.add('has-dev-menu');

  const nav = document.querySelector('.menu-lateral--dev');
  if (!nav) return;

  let hideTimer = null;

  function showDevMenu() {
    clearTimeout(hideTimer);
    nav.classList.add('is-visible');
    document.body.classList.add('dev-menu-open');
  }

  function scheduleHide(delay) {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      nav.classList.remove('is-visible');
      document.body.classList.remove('dev-menu-open');
    }, delay ?? (isTouchUI ? 420 : 280));
  }

  function nearLeftEdge(clientX) {
    return typeof clientX === 'number' && clientX <= EDGE_PX;
  }

  edgeZone.addEventListener('mouseenter', showDevMenu);
  edgeZone.addEventListener('mousemove', showDevMenu);
  nav.addEventListener('mouseenter', showDevMenu);
  nav.addEventListener('mouseleave', () => scheduleHide());
  edgeZone.addEventListener('mouseleave', (e) => {
    if (!nav.contains(e.relatedTarget)) scheduleHide();
  });

  edgeZone.addEventListener('touchstart', (e) => {
    const x = e.touches?.[0]?.clientX;
    if (nearLeftEdge(x)) showDevMenu();
  }, { passive: true });

  document.addEventListener('touchstart', (e) => {
    const x = e.touches?.[0]?.clientX;
    if (nearLeftEdge(x)) {
      showDevMenu();
      return;
    }
    if (nav.classList.contains('is-visible')) {
      const target = e.target;
      if (!nav.contains(target) && !edgeZone.contains(target)) {
        scheduleHide(120);
      }
    }
  }, { passive: true });

  nav.addEventListener('touchstart', () => showDevMenu(), { passive: true });

})();