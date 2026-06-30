// ============================================================
// Ranking Pro — Registro de screens (SPA-lite)
// route: hash path · html: fallback full page · module: JS screen (gradual)
// ============================================================

(function (global) {
  'use strict';

  const RANKING_PRO_SCREENS = {
    home: {
      route: '/',
      title: 'Ranking Pro',
      html: './index.html',
      module: null,
      homeLinked: './index.html'
    },
    login: {
      route: '/login',
      title: 'Entrar',
      html: './login.html',
      module: null
    },
    'selecionar-perfil': {
      route: '/selecionar-perfil',
      title: 'Selecionar perfil',
      html: './selecionar-perfil.html',
      module: null
    },
    cliente: {
      route: '/cliente',
      title: 'Buscar',
      html: './cliente.html',
      module: null,
      homeLinked: './cliente.html'
    },
    favoritos: {
      route: '/favoritos',
      title: 'Favoritos',
      html: './favoritos.html',
      module: null
    },
    'meu-perfil': {
      route: '/meu-perfil',
      title: 'Meu perfil',
      html: './meu-perfil.html',
      module: null
    },
    marketplace: {
      route: '/marketplace',
      title: 'Marketplace',
      html: './estabelecimento-marketplace.html',
      module: null
    },
    'dashboard-pro': {
      route: '/dashboard/pro',
      title: 'Dashboard profissional',
      html: './dashboard-profissional.html',
      module: 'screens/dashboard-profissional.js'
    },
    'dashboard-est': {
      route: '/dashboard/est',
      title: 'Dashboard estabelecimento',
      html: './dashboard-estabelecimento.html',
      module: 'screens/dashboard-estabelecimento.js'
    },
    avaliar: {
      route: '/avaliar',
      title: 'Avaliar',
      html: './cliente.html',
      redirectQuery: true
    },
    admin: {
      route: '/admin',
      title: 'Admin',
      html: './admin.html',
      module: null,
      devOnly: true
    }
  };

  const HTML_TO_ROUTE = {
    'index.html': 'home',
    'login.html': 'login',
    'selecionar-perfil.html': 'selecionar-perfil',
    'cliente.html': 'cliente',
    'favoritos.html': 'favoritos',
    'meu-perfil.html': 'meu-perfil',
    'estabelecimento-marketplace.html': 'marketplace',
    'dashboard-profissional.html': 'dashboard-pro',
    'dashboard-estabelecimento.html': 'dashboard-est',
    'admin.html': 'admin'
  };

  global.RankingProScreens = RANKING_PRO_SCREENS;
  global.RankingProHtmlToRoute = HTML_TO_ROUTE;
})(window);