// =====================================================
// PROOFLY - Menu Flutuante Inferior (USUÁRIO)
// =====================================================
// Hubs (sem Voltar): index, cliente, dashboards, marketplace, admin, dev.
// Demais páginas: dock automático com Voltar → destino contextual.
// cliente.html: só “subir ao topo” ao rolar resultados (não é Voltar de página).
// =====================================================

(function() {
  const isDevEnv = (typeof DEBUG_MODE !== 'undefined' && DEBUG_MODE)
    || (typeof PROOFLY_DEV_MENU !== 'undefined' && PROOFLY_DEV_MENU);

  if (isDevEnv && !window.simularCliente) {
    const alreadyLoaded = !!document.querySelector('script[src*="dev-role-simulation.js"]');
    if (!alreadyLoaded) {
      const base = (document.currentScript?.src || '').replace(/menu\.js.*$/, '') || './';
      const sim = document.createElement('script');
      sim.src = `${base}dev-role-simulation.js`;
      sim.async = false;
      document.head.appendChild(sim);
    }
  }

  const session = typeof getSession === 'function' ? getSession() : null;
  const activeType = typeof getActiveProfileType === 'function'
    ? getActiveProfileType(session)
    : null;
  const currentPage = (window.location.pathname.split('/').pop() || 'index.html').split('?')[0];

  /* Home QR limpa — sem dock para visitantes */
  if (!session?.userId && currentPage === 'index.html') {
    return;
  }
  const isDev = isDevEnv;
  const isTouchUI = window.matchMedia('(hover: none), (pointer: coarse)').matches
    || window.innerWidth < 768;

  const profId = session?.professionalId || '';
  const estId = session?.establishmentId || '';

  const SVG_ATTRS = 'class="dock-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';

  const NAV_ICON_SVGS = {
    '🏠': `<svg ${SVG_ATTRS}><path d="M4 10.5L12 4l8 6.5V19a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5z"/></svg>`,
    '🔍': `<svg ${SVG_ATTRS}><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>`,
    '🔐': `<svg ${SVG_ATTRS}><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>`,
    '📷': `<svg ${SVG_ATTRS}><path d="M4 8h3l2-2h6l2 2h3v11H4V8z"/><circle cx="12" cy="13" r="3.25"/></svg>`,
    '❤️': `<svg ${SVG_ATTRS}><path d="M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.4-7 10-7 10z"/></svg>`,
    '👤': `<svg ${SVG_ATTRS}><circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7"/></svg>`,
    '📊': `<svg ${SVG_ATTRS}><path d="M5 19V9"/><path d="M12 19V5"/><path d="M19 19v-7"/></svg>`,
    '💬': `<svg ${SVG_ATTRS}><path d="M5 6h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9l-4 3V8a2 2 0 0 1 2-2z"/></svg>`,
    '🏢': `<svg ${SVG_ATTRS}><path d="M6 20V6l6-3 6 3v14"/><path d="M10 10h.01M14 10h.01M10 14h.01M14 14h.01M10 18h4"/></svg>`,
    '⚙️': `<svg ${SVG_ATTRS}><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`,
    '✨': `<svg ${SVG_ATTRS}><path d="M12 3l1.4 4.2L18 9l-4.6 1.8L12 15l-1.4-4.2L6 9l4.6-1.8L12 3z"/><path d="M5 17l.8 2.4L8 20l-2.2.6L5 23l-.8-2.4L2 20l2.2-.6L5 17z"/></svg>`,
    '🔀': `<svg ${SVG_ATTRS}><path d="M16 3h5v5"/><path d="M8 21H3v-5"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/><path d="M14 14H9a4 4 0 0 0 0 8h1"/><path d="M10 10h5a4 4 0 0 1 0-8h-1"/></svg>`,
    '🚪': `<svg ${SVG_ATTRS}><path d="M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5"/><path d="M15 16l4-4-4-4"/><path d="M19 12H9"/></svg>`,
    '💼': `<svg ${SVG_ATTRS}><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>`,
    '📋': `<svg ${SVG_ATTRS}><path d="M9 5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>`,
    '👥': `<svg ${SVG_ATTRS}><circle cx="9" cy="9" r="2.5"/><circle cx="16" cy="10" r="2"/><path d="M4 19c0-2.8 2.2-5 5-5"/><path d="M13 19c0-2.2 1.6-4 3.5-4.5"/></svg>`
  };

  const BACK_ICON_LEFT = `<svg ${SVG_ATTRS}><path d="M14 6l-6 6 6 6"/></svg>`;
  const BACK_ICON_UP = `<svg ${SVG_ATTRS}><path d="M6 14l6-6 6 6"/></svg>`;
  const BACK_ICON_MARKUP = BACK_ICON_LEFT;
  const DOCK_BUILD = '20260628-dock-edges-v1';

  /* Hubs principais — sem botão Voltar (navegação de destino) */
  const NAV_HUBS = new Set([
    'index.html',
    'cliente.html',
    'dashboard-profissional.html',
    'dashboard-estabelecimento.html',
    'estabelecimento-marketplace.html',
    'admin.html',
    'dev-simulation.html'
  ]);

  function clientHub() {
    return 'cliente.html';
  }

  function profHub() {
    return profId ? 'dashboard-profissional.html' : 'selecionar-profissional.html';
  }

  function estHub() {
    return estId ? 'dashboard-estabelecimento.html' : 'selecionar-estabelecimento.html';
  }

  function sharkEstDockItems() {
    if (typeof sharkEstablishmentDock === 'function') {
      return sharkEstablishmentDock(estId);
    }
    const dash = estId ? 'dashboard-estabelecimento.html' : 'selecionar-estabelecimento.html';
    return [
      { icon: '🏢', page: dash, label: 'Dashboard' },
      { icon: '👥', page: `${dash}#equipe`, label: 'Equipe' },
      { icon: '⚙️', page: `${dash}#perfil`, label: 'Configurações' }
    ];
  }

  function isSharkPublicMenu() {
    return typeof isSharkPublicUI === 'function'
      ? isSharkPublicUI()
      : (typeof SHARK_MODE !== 'undefined' && SHARK_MODE && !(typeof DEBUG_MODE !== 'undefined' && DEBUG_MODE));
  }

  function backItem(page, label = 'Voltar') {
    return {
      icon: '',
      page,
      label,
      dockClass: 'dock-item--back-nav',
      iconMarkup: BACK_ICON_MARKUP
    };
  }

  function logoutItem() {
    return {
      icon: '🚪',
      page: '#',
      label: 'Sair',
      action: 'logout',
      dockClass: 'dock-item--logout-nav'
    };
  }

  function isDockEdgeItem(item) {
    const dockClass = item?.dockClass || '';
    return dockClass.includes('dock-item--back-nav')
      || dockClass.includes('dock-item--back-top')
      || dockClass.includes('dock-item--logout-nav')
      || item?.action === 'logout';
  }

  function resolveBackTarget(page) {
    const targets = {
      'favoritos.html': clientHub,
      'meu-perfil.html': clientHub,
      'minhas-avaliacoes.html': () => (
        (activeType === 'professional' || session?.role === 'profissional') ? profHub() : clientHub()
      ),
      'perfil-page.html': clientHub,
      'configuracoes-cliente.html': () => 'meu-perfil.html',
      'selecionar-perfil.html': () => (session?.userId ? clientHub() : 'index.html'),
      'selecionar-cliente.html': () => 'selecionar-perfil.html',
      'selecionar-profissional.html': () => 'selecionar-perfil.html',
      'selecionar-estabelecimento.html': () => 'selecionar-perfil.html',
      'onboarding-profissional.html': () => 'selecionar-profissional.html',
      'onboarding-estabelecimento.html': () => 'selecionar-estabelecimento.html',
      'login.html': () => 'index.html',
      'cadastro-cliente.html': () => 'login.html',
      'relatorio-contratante.html': estHub
    };
    const resolver = targets[page];
    return resolver ? resolver() : clientHub();
  }

  function buildDockItems(coreItems) {
    if (NAV_HUBS.has(currentPage)) return coreItems;
    let items = [...coreItems];
    const hasBack = items.some(item => item.dockClass?.includes('dock-item--back-nav'));
    if (!hasBack) items = [backItem(resolveBackTarget(currentPage)), ...items];
    return items;
  }

  function clientPerfilDockItem() {
    const clientId = typeof getClientId === 'function' ? getClientId(session) : session?.clientId;
    if (activeType === 'client' || session?.role === 'cliente') {
      return {
        icon: '👤',
        page: clientId ? 'meu-perfil.html' : 'selecionar-cliente.html?force=true',
        label: 'Perfil'
      };
    }
    return thirdNavForRole();
  }

  function thirdNavForRole() {
    if (activeType === 'professional' || session?.role === 'profissional') {
      return { icon: '📊', page: profId ? 'dashboard-profissional.html' : 'selecionar-profissional.html', label: 'Dashboard' };
    }
    if (activeType === 'establishment' || session?.role === 'estabelecimento') {
      return { icon: '🏢', page: estId ? 'dashboard-estabelecimento.html' : 'selecionar-estabelecimento.html', label: 'Meu negócio' };
    }
    if (session?.userId && !activeType) {
      return { icon: '👤', page: 'selecionar-perfil.html', label: 'Definir perfil' };
    }
    const clientId = typeof getClientId === 'function' ? getClientId(session) : session?.clientId;
    return { icon: '✨', page: clientId ? 'meu-perfil.html' : 'selecionar-cliente.html?force=true', label: 'Meu perfil' };
  }

  const PAGE_ITEMS = {
    'index.html': [
      { icon: '🏠', page: 'index.html', label: 'Início' },
      { icon: '🔍', page: 'cliente.html', label: 'Buscar' },
      { icon: '🔐', page: 'login.html', label: 'Entrar' }
    ],
    'cliente.html': () => [
      {
        icon: '',
        page: '#',
        label: 'Voltar ao topo',
        action: 'scroll-to-search-top',
        dockClass: 'dock-item--back-top is-hidden',
        dockId: 'dockBackToSearch',
        iconMarkup: BACK_ICON_UP
      },
      { icon: '🔍', page: 'cliente.html', label: 'Buscar' },
      { icon: '📷', page: '#', label: 'QR', action: 'open-qr-scanner' },
      { icon: '❤️', page: 'favoritos.html', label: 'Favoritos' },
      clientPerfilDockItem()
    ],
    'favoritos.html': () => [
      { icon: '❤️', page: 'favoritos.html', label: 'Favoritos' },
      { icon: '🔍', page: 'cliente.html', label: 'Buscar' },
      thirdNavForRole()
    ],
    'configuracoes-cliente.html': () => [
      { icon: '⚙️', page: 'configuracoes-cliente.html', label: 'Configurações' },
      { icon: '👤', page: 'meu-perfil.html', label: 'Meu perfil' },
      { icon: '🔍', page: 'cliente.html', label: 'Buscar' }
    ],
    'dashboard-profissional.html': () => [
      { icon: '📊', page: 'dashboard-profissional.html', label: 'Dashboard' },
      { icon: '📷', page: 'dev/gerar-qr.html', label: 'QR' },
      { icon: '💬', page: 'minhas-avaliacoes.html', label: 'Avaliações' },
      {
        icon: '👤',
        page: profId ? `p/?id=${profId}` : 'selecionar-profissional.html',
        label: 'Perfil'
      }
    ],
    'profissional.html': [
      { icon: '📊', page: profId ? 'dashboard-profissional.html' : 'selecionar-profissional.html', label: 'Dashboard' },
      { icon: '💬', page: 'minhas-avaliacoes.html', label: 'Avaliações' },
      { icon: '🔍', page: 'cliente.html', label: 'Buscar' }
    ],
    'dashboard-estabelecimento.html': () => (
      isSharkPublicMenu() ? sharkEstDockItems() : [
        { icon: '🏢', page: 'dashboard-estabelecimento.html', label: 'Meu negócio' },
        { icon: '🔍', page: 'estabelecimento-marketplace.html', label: 'Encontrar profissionais' },
        { icon: '❤️', page: 'favoritos.html', label: 'Favoritos' }
      ]
    ),
    'estabelecimento-marketplace.html': [
      { icon: '🔍', page: 'estabelecimento-marketplace.html', label: 'Encontrar profissionais' },
      { icon: '🏢', page: estId ? 'dashboard-estabelecimento.html' : 'selecionar-estabelecimento.html', label: 'Meu negócio' },
      { icon: '❤️', page: 'favoritos.html', label: 'Favoritos' }
    ],
    'estabelecimento.html': [
      { icon: '🏢', page: estId ? 'dashboard-estabelecimento.html' : 'selecionar-estabelecimento.html', label: 'Meu negócio' },
      { icon: '🔍', page: 'estabelecimento-marketplace.html', label: 'Encontrar profissionais' },
      { icon: '❤️', page: 'favoritos.html', label: 'Favoritos' }
    ],
    'perfil-page.html': () => [
      { icon: '🔍', page: 'cliente.html', label: 'Buscar' },
      { icon: '❤️', page: 'favoritos.html', label: 'Favoritos' },
      thirdNavForRole()
    ],
    'meu-perfil.html': () => [
      { icon: '👤', page: 'meu-perfil.html', label: 'Meu perfil' },
      { icon: '🔍', page: 'cliente.html', label: 'Buscar' },
      { icon: '❤️', page: 'favoritos.html', label: 'Favoritos' }
    ],
    'selecionar-perfil.html': [
      { icon: '🔀', page: 'selecionar-perfil.html?forceProfileSelect=true', label: 'Escolher perfil' },
      { icon: '🔍', page: 'cliente.html', label: 'Buscar' },
      { icon: '🏠', page: 'index.html', label: 'Início' }
    ],
    'selecionar-cliente.html': [
      { icon: '✨', page: 'selecionar-cliente.html?force=true', label: 'Meu perfil' },
      { icon: '🔍', page: 'cliente.html', label: 'Buscar' },
      { icon: '❤️', page: 'favoritos.html', label: 'Favoritos' }
    ],
    'selecionar-profissional.html': [
      { icon: '💼', page: 'selecionar-profissional.html?force=true', label: 'Profissional' },
      { icon: '📊', page: profId ? 'dashboard-profissional.html' : 'selecionar-profissional.html', label: 'Dashboard' },
      { icon: '🔍', page: 'cliente.html', label: 'Buscar' }
    ],
    'selecionar-estabelecimento.html': () => (
      isSharkPublicMenu() ? sharkEstDockItems() : [
        { icon: '🏢', page: 'selecionar-estabelecimento.html?force=true', label: 'Estabelecimento' },
        { icon: '📋', page: estId ? 'estabelecimento-marketplace.html' : 'selecionar-estabelecimento.html', label: 'Contratar' },
        { icon: '❤️', page: 'favoritos.html', label: 'Favoritos' }
      ]
    ),
    'onboarding-profissional.html': [
      { icon: '💼', page: 'selecionar-profissional.html?force=true', label: 'Profissional' },
      { icon: '📊', page: 'dashboard-profissional.html', label: 'Dashboard' },
      { icon: '🔍', page: 'cliente.html', label: 'Buscar' }
    ],
    'onboarding-estabelecimento.html': () => (
      isSharkPublicMenu() ? sharkEstDockItems() : [
        { icon: '🏢', page: 'selecionar-estabelecimento.html?force=true', label: 'Estabelecimento' },
        { icon: '🔍', page: 'estabelecimento-marketplace.html', label: 'Encontrar profissionais' },
        { icon: '❤️', page: 'favoritos.html', label: 'Favoritos' }
      ]
    ),
    'login.html': [
      { icon: '🔐', page: 'login.html', label: 'Entrar' },
      { icon: '🔍', page: 'cliente.html', label: 'Buscar' },
      { icon: '🏠', page: 'index.html', label: 'Início' }
    ],
    'cadastro-cliente.html': [
      { icon: '👤', page: 'cadastro-cliente.html', label: 'Cadastro' },
      { icon: '🔍', page: 'cliente.html', label: 'Buscar' },
      { icon: '🏠', page: 'index.html', label: 'Início' }
    ],
    'minhas-avaliacoes.html': () => [
      { icon: '📋', page: 'minhas-avaliacoes.html', label: 'Histórico' },
      { icon: '🔍', page: 'cliente.html', label: 'Buscar' },
      thirdNavForRole()
    ],
    'relatorio-contratante.html': () => [
      { icon: '📋', page: 'relatorio-contratante.html', label: 'Relatório' },
      { icon: '🔍', page: 'estabelecimento-marketplace.html', label: 'Contratar' },
      { icon: '🏢', page: estHub(), label: 'Meu negócio' }
    ],
    'dev-simulation.html': [
      { icon: '⚙️', page: 'dev-simulation.html', label: 'Control Center' },
      { icon: '🔍', page: 'cliente.html', label: 'Buscar' },
      { icon: '📊', page: 'admin.html', label: 'Admin' }
    ],
    'admin.html': [
      { icon: '📊', page: 'admin.html', label: 'Admin' },
      { icon: '🔍', page: 'cliente.html', label: 'Buscar' },
      { icon: '⚙️', page: 'dev-simulation.html', label: 'Control Center' }
    ]
  };

  function getRoleFallbackItems() {
    if (!session?.userId) {
      return [
        { icon: '🏠', page: 'index.html', label: 'Início' },
        { icon: '🔍', page: 'cliente.html', label: 'Buscar' },
        { icon: '❤️', page: 'favoritos.html', label: 'Favoritos' },
        { icon: '🔐', page: 'login.html?returnTo=cliente.html', label: 'Entrar' }
      ];
    }
    if (!activeType) {
      return [
        { icon: '🔍', page: 'cliente.html', label: 'Buscar' },
        { icon: '❤️', page: 'favoritos.html', label: 'Favoritos' },
        { icon: '👤', page: 'selecionar-perfil.html', label: 'Definir perfil' }
      ];
    }
    if (activeType === 'client' || session.role === 'cliente') {
      return [
        { icon: '🔍', page: 'cliente.html', label: 'Buscar' },
        { icon: '📷', page: '#', label: 'QR', action: 'open-qr-scanner' },
        { icon: '❤️', page: 'favoritos.html', label: 'Favoritos' },
        clientPerfilDockItem()
      ];
    }
    if (activeType === 'professional' || session.role === 'profissional') {
      return [
        { icon: '📊', page: profId ? 'dashboard-profissional.html' : 'selecionar-profissional.html', label: 'Dashboard' },
        { icon: '📷', page: 'dev/gerar-qr.html', label: 'QR' },
        { icon: '💬', page: 'minhas-avaliacoes.html', label: 'Avaliações' },
        {
          icon: '👤',
          page: profId ? `p/?id=${profId}` : 'selecionar-profissional.html',
          label: 'Perfil'
        }
      ];
    }
    if (activeType === 'establishment' || session.role === 'estabelecimento') {
      if (isSharkPublicMenu()) return sharkEstDockItems();
      return [
        { icon: '🏢', page: estId ? 'dashboard-estabelecimento.html' : 'selecionar-estabelecimento.html', label: 'Meu negócio' },
        { icon: '🔍', page: estId ? 'estabelecimento-marketplace.html' : 'selecionar-estabelecimento.html', label: 'Encontrar profissionais' },
        { icon: '❤️', page: 'favoritos.html', label: 'Favoritos' }
      ];
    }
    return [
      { icon: '🔍', page: 'cliente.html', label: 'Buscar' },
      { icon: '📊', page: 'admin.html', label: 'Admin' }
    ];
  }

  const pageDef = PAGE_ITEMS[currentPage];
  let items = buildDockItems(
    typeof pageDef === 'function' ? pageDef() : (pageDef || getRoleFallbackItems())
  );

  if (!session?.userId && currentPage === 'index.html') {
    items = [
      ...items,
      { icon: '🔐', page: 'login.html?returnTo=cliente.html', label: 'Entrar' }
    ];
  }

  const DOCK_SLOT_COUNT = 5;
  const DOCK_OVERFLOW_ACTIONS = new Set([
    'simular-cliente',
    'simular-profissional',
    'simular-estabelecimento'
  ]);

  function isDockOverflowItem(item) {
    if (item.action && DOCK_OVERFLOW_ACTIONS.has(item.action)) return true;
    return item.label === 'Alternar perfil';
  }

  if (session?.userId) {
    const hasLogout = items.some(item => item.action === 'logout' || item.label === 'Sair');
    if (!hasLogout) items.push(logoutItem());
  }

  function partitionDockItems(rawItems) {
    const filtered = rawItems.filter(item => !isDockOverflowItem(item));
    let back = null;
    let logout = null;
    const core = [];

    filtered.forEach((item) => {
      if (item.dockClass?.includes('dock-item--back-nav') || item.dockClass?.includes('dock-item--back-top')) {
        if (!back) back = item;
        return;
      }
      if (item.dockClass?.includes('dock-item--logout-nav') || item.action === 'logout') {
        if (!logout) logout = item;
        return;
      }
      core.push(item);
    });

    const hasNavEdges = !!(back || logout);
    const maxCore = hasNavEdges
      ? Math.max(1, DOCK_SLOT_COUNT - (back ? 1 : 0) - (logout ? 1 : 0))
      : DOCK_SLOT_COUNT;

    return {
      hasNavEdges,
      back,
      logout,
      core: hasNavEdges ? core : core.slice(0, maxCore)
    };
  }

  const dockLayout = partitionDockItems(items);

  const ACTION_HANDLERS = {
    logout: 'logout',
    'scroll-to-search-top': 'scrollToSearchTop',
    'open-qr-scanner': 'openQrScanner',
    'simular-cliente': 'simularCliente',
    'simular-profissional': 'simularProfissional',
    'simular-estabelecimento': 'simularEstabelecimento'
  };

  function renderDockIcon(item) {
    if (item.iconMarkup) return item.iconMarkup;
    if (NAV_ICON_SVGS[item.icon]) return NAV_ICON_SVGS[item.icon];
    return `<span class="menu-icon" aria-hidden="true">${item.icon}</span>`;
  }

  function lightHaptic() {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(10);
    }
  }

  function renderDockItem(item) {
    const pageBase = item.page.split('?')[0].replace('./', '');
    const active = (pageBase === currentPage) ? ' active' : '';
    let clickAttr = '';
    if (item.action) {
      const fn = ACTION_HANDLERS[item.action];
      clickAttr = ` onclick="event.preventDefault(); window.${fn}&&window.${fn}();"`;
    }
    const extraClass = item.dockClass ? ` ${item.dockClass}` : '';
    const extraId = item.dockId ? ` id="${item.dockId}"` : '';
    const iconInner = renderDockIcon(item);
    return `
      <a href="${item.page}" class="dock-item${active}${extraClass}"${extraId} data-tooltip="${item.label}" aria-label="${item.label}"${clickAttr}>
        ${iconInner}
      </a>
    `;
  }

  let itemsHtml = '';
  if (dockLayout.hasNavEdges) {
    const startEdge = dockLayout.back ? renderDockItem(dockLayout.back) : '<span class="dock-edge-spacer" aria-hidden="true"></span>';
    const coreHtml = dockLayout.core.map(renderDockItem).join('');
    const endEdge = dockLayout.logout ? renderDockItem(dockLayout.logout) : '<span class="dock-edge-spacer" aria-hidden="true"></span>';
    itemsHtml = `
      <div class="dock-edge dock-edge--start">${startEdge}</div>
      <div class="dock-core">${coreHtml}</div>
      <div class="dock-edge dock-edge--end">${endEdge}</div>
    `;
  } else {
    const slots = [...dockLayout.core];
    while (slots.length < DOCK_SLOT_COUNT) slots.push({ slot: 'empty' });
    slots.forEach((item) => {
      if (item.slot === 'empty') {
        itemsHtml += '<span class="dock-slot-empty" aria-hidden="true"></span>';
        return;
      }
      itemsHtml += renderDockItem(item);
    });
  }

  const trackClass = dockLayout.hasNavEdges
    ? 'floating-menu-track floating-menu-track--nav'
    : 'floating-menu-track';

  const html = `
    <div class="floating-menu-shell" id="floatingMenuShell" data-dock-build="${DOCK_BUILD}" data-item-count="${DOCK_SLOT_COUNT}" data-nav-edges="${dockLayout.hasNavEdges ? '1' : '0'}">
      <nav class="floating-menu" id="floatingMenuNav" aria-label="Menu do usuário">
        <div class="${trackClass}" id="floatingMenuTrack">${itemsHtml}</div>
      </nav>
    </div>
  `;

  document.body.insertAdjacentHTML('afterbegin', html);

  const dockNav = document.getElementById('floatingMenuNav');
  if (dockNav) {
    dockNav.addEventListener('click', (event) => {
      const link = event.target.closest('.dock-item');
      if (!link || link.classList.contains('is-hidden')) return;
      lightHaptic();
    }, { passive: true });
  }

  const CLIENT_NO_SWIPE_PAGES = new Set([
    'cliente.html',
    'favoritos.html',
    'meu-perfil.html',
    'minhas-avaliacoes.html',
    'configuracoes-cliente.html',
    'perfil-page.html',
    'cadastro-cliente.html',
    'selecionar-perfil.html',
    'selecionar-cliente.html',
    'login.html'
  ]);
  if (CLIENT_NO_SWIPE_PAGES.has(currentPage) && typeof initMobileSwipeGuard === 'function') {
    initMobileSwipeGuard();
  }

  window.openQrScanner = function() {
    if (typeof abrirScannerQR === 'function') {
      abrirScannerQR();
      return;
    }
    window.location.href = './cliente.html?scanQr=1';
  };

  window.logout = function() {
    if (typeof resetSessionAndGoHome === 'function') {
      resetSessionAndGoHome();
      return;
    }
    if (typeof clearSession === 'function') clearSession();
    window.location.replace('index.html');
  };

})();