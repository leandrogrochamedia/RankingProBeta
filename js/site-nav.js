// Ranking Pro — navegação pills (design system glass)

(function (global) {
  'use strict';

  const P = () => global.RankingProPaths;

  function hasSession() {
    return typeof global.getSession === 'function' && !!global.getSession()?.userId;
  }

  function currentKey() {
    const path = global.location.pathname.toLowerCase();
    if (path.includes('/dev/')) return 'dev';
    if (path.includes('/p/')) return 'profile';
    if (path.includes('/avaliar/')) return 'avaliar';
    if (path.includes('/qr/')) return 'qr';
    if (path.includes('login')) return 'login';
    return 'home';
  }

  function renderNav(host) {
    if (!host || !P()) return;
    const key = currentKey();
    const items = [
      { key: 'home', label: 'Início', href: P().siteUrl('index.html') }
    ];

    if (!hasSession()) {
      items.push({ key: 'login', label: 'Entrar', href: P().siteUrl('login.html') });
    }

    items.push({ key: 'dev', label: 'Gerar QR', href: P().siteUrl('dev/gerar-qr.html') });

    if (hasSession()) {
      items.push({ key: 'profile', label: 'Perfil', href: P().siteUrl('p/'), id: 'nav-profile' });
    }

    host.innerHTML =
      '<nav class="nucleus-nav" aria-label="Navegação">' +
      '<div class="pills-container">' +
      items.map(function (item) {
        const cls = 'pill' + (item.key === key ? ' active' : '');
        const id = item.id ? ' id="' + item.id + '"' : '';
        return '<a class="' + cls + '"' + id + ' href="' + item.href + '">' + item.label + '</a>';
      }).join('') +
      '</div></nav>';
  }

  function mount() {
    const host = document.getElementById('rp-site-nav');
    if (!host) return;
    renderNav(host);
    const params = new URLSearchParams(global.location.search);
    const profId = params.get('id');
    const navProfile = document.getElementById('nav-profile');
    if (profId && navProfile) {
      navProfile.href = P().siteUrl('p/?id=' + encodeURIComponent(profId));
    }
  }

  function remount() {
    mount();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }

  document.addEventListener('scriptsLoaded', remount);

  global.RankingProNav = { renderNav, mount, remount };
})(window);