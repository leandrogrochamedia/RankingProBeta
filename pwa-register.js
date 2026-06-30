// Ranking Pro — PWA head tags + service worker (pós vite build)

(function (global) {
  'use strict';

  function assetHref(path) {
    if (typeof RankingProPaths !== 'undefined' && RankingProPaths.prefix) {
      return RankingProPaths.prefix() + String(path || '').replace(/^\.\//, '');
    }
    return './' + String(path || '').replace(/^\.\//, '');
  }

  function injectHead() {
    const doc = global.document;
    if (!doc?.head) return;

    if (!doc.querySelector('link[rel="manifest"]')) {
      const link = doc.createElement('link');
      link.rel = 'manifest';
      link.href = assetHref('manifest.webmanifest');
      doc.head.appendChild(link);
    }

    if (!doc.querySelector('link[rel="apple-touch-icon"]')) {
      const icon = doc.createElement('link');
      icon.rel = 'apple-touch-icon';
      icon.href = assetHref('assets/icons/icon-192.png');
      doc.head.appendChild(icon);
    }

    if (!doc.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
      const meta = doc.createElement('meta');
      meta.name = 'apple-mobile-web-app-capable';
      meta.content = 'yes';
      doc.head.appendChild(meta);
    }

    if (!doc.querySelector('meta[name="apple-mobile-web-app-title"]')) {
      const title = doc.createElement('meta');
      title.name = 'apple-mobile-web-app-title';
      title.content = 'Ranking Pro';
      doc.head.appendChild(title);
    }
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in global.navigator)) return;

    const isLocal = /^(localhost|127\.0\.0\.1)$/.test(global.location.hostname);
    if (global.location.protocol !== 'https:' && !isLocal) return;

    const swUrl = new URL(assetHref('sw.js'), global.location.href).href;
    const scopeUrl = new URL(assetHref('./'), global.location.href).href;

    global.navigator.serviceWorker.register(swUrl, { scope: scopeUrl }).catch(function () {
      /* sw.js existe apenas no artefato dist/ (vite build) */
    });
  }

  injectHead();

  if (global.document.readyState === 'loading') {
    global.document.addEventListener('DOMContentLoaded', registerServiceWorker);
  } else {
    registerServiceWorker();
  }

  global.RankingProPWA = { injectHead, registerServiceWorker };
})(window);