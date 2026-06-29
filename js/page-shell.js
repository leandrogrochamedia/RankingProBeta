// Injeta header + nav compactos em páginas internas

(function () {
  'use strict';

  function mount() {
    var host = document.getElementById('rp-page-shell');
    if (!host || !window.RankingProPaths) return;

    var brand = host.dataset.brand || 'Ranking Pro';
    host.innerHTML =
      '<header class="rp-header">' +
        '<div class="rp-mark" aria-hidden="true">🏆</div>' +
        '<span class="rp-brand">' + brand + '</span>' +
      '</header>' +
      '<div id="rp-site-nav"></div>';

    if (window.RankingProNav) RankingProNav.mount();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();