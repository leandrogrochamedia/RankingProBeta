// Boot compartilhado: cliente.html / cliente-exp.html / cliente-bak.html
(function() {
  'use strict';

  const scriptEl = document.currentScript;
  const appSrc = scriptEl?.dataset?.app || './cliente.js';

  let clienteReady = false;
  const overlay = document.getElementById('loadingOverlay');
  const progressFill = document.getElementById('progressFill');
  const loadingPercent = document.getElementById('loadingPercent');

  function setProgress(v) {
    if (!progressFill || !loadingPercent) return;
    const c = Math.min(100, Math.max(0, v));
    progressFill.style.width = c + '%';
    loadingPercent.textContent = Math.round(c) + '%';
  }

  function showBootError(msg) {
    if (overlay) {
      overlay.classList.add('hidden');
      const box = overlay.querySelector('.loading-box') || overlay;
      if (box && msg) {
        const err = document.createElement('p');
        err.className = 'loading-error text-glass-muted';
        err.style.marginTop = '12px';
        err.textContent = msg;
        box.appendChild(err);
      }
    }
    if (typeof showAlert === 'function') showAlert('❌ Erro', msg || 'Falha ao carregar.');
  }

  function hideOverlay() {
    if (overlay) setTimeout(() => overlay.classList.add('hidden'), 400);
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(src));
      document.body.appendChild(s);
    });
  }

  async function loadAppBundle() {
    if (typeof buscarProfissionais !== 'undefined') {
      if (typeof initClientePage === 'function') initClientePage();
      hideOverlay();
      return;
    }
    try {
      if (typeof ProfileCard === 'undefined') {
        await loadScript('./components/profile-card.js');
      }
      await loadScript(appSrc);
      hideOverlay();
    } catch (e) {
      showBootError('Erro ao carregar a busca. Recarregue a página.');
      console.error(e);
    }
  }

  function onScriptsReady() {
    if (clienteReady) return;
    if (typeof getSession !== 'function') return;

    clienteReady = true;

    if (typeof enforceProfileGuard === 'function') {
      enforceProfileGuard('client', { allowGuest: true });
    }

    const session = typeof getSession === 'function' ? getSession() : null;
    const greeting = document.getElementById('userGreeting');
    if (greeting && typeof renderUserGreeting === 'function') {
      renderUserGreeting(greeting, session);
    }

    setProgress(100);
    loadAppBundle();
  }

  setProgress(0);
  let target = 0;
  const interval = setInterval(() => {
    if (target < 80) {
      target += Math.random() * 3 + 1;
      if (target > 80) target = 80;
      setProgress(target);
    }
  }, 200);

  function finishWait() {
    clearInterval(interval);
    if (!clienteReady) {
      showBootError('Não foi possível iniciar. Verifique a conexão e recarregue.');
    }
  }

  window.prooflyReady = onScriptsReady;
  document.addEventListener('scriptsLoaded', () => {
    clearInterval(interval);
    onScriptsReady();
  }, { once: true });

  if (typeof getSession === 'function') {
    clearInterval(interval);
    onScriptsReady();
  } else {
    setTimeout(finishWait, 8000);
  }
})();