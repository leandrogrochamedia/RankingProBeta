// Boot compartilhado: estabelecimento-marketplace.html
(function() {
  'use strict';

  const scriptEl = document.currentScript;
  const appSrc = scriptEl?.dataset?.app || './estabelecimento-marketplace.js';

  let appReady = false;
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
    if (typeof window.initContratarPage === 'function') {
      window.initContratarPage();
      hideOverlay();
      return;
    }
    try {
      if (typeof ProfileCard === 'undefined') {
        await loadScript('./components/profile-card.js');
      }
      await loadScript(appSrc);
      if (typeof window.initContratarPage === 'function') {
        await window.initContratarPage();
      }
      hideOverlay();
    } catch (e) {
      showBootError('Erro ao carregar o mercado de talentos. Recarregue a página.');
      console.error(e);
    }
  }

  function onScriptsReady() {
    if (appReady) return;
    if (typeof getSession !== 'function') return;

    appReady = true;
    const session = getSession();
    const greeting = document.getElementById('userGreeting');
    if (greeting && typeof renderUserGreeting === 'function') {
      renderUserGreeting(greeting, session);
    }

    const switchUrl = typeof getProfileSelectorUrl === 'function'
      ? getProfileSelectorUrl(true)
      : './selecionar-perfil.html?forceProfileSelect=true';
    const heroActions = document.querySelector('.cliente-hero-actions');
    if (heroActions && !document.getElementById('btnTrocarPerfil') && typeof hasMultipleProfileRoles === 'function' && hasMultipleProfileRoles(session)) {
      heroActions.insertAdjacentHTML('beforeend',
        `<a href="${switchUrl}" id="btnTrocarPerfil" class="btn-ios-pill btn-ios-pill-ghost" style="text-decoration:none;" aria-label="Alternar perfil"><span>🔀</span><span>Alternar perfil</span></a>`
      );
    }
    if (heroActions && typeof PROOFLY_DEBUG !== 'undefined' && PROOFLY_DEBUG.isEnabled?.() && !document.getElementById('btnMatchDebug')) {
      const on = PROOFLY_DEBUG.isMatchDebugOn?.();
      heroActions.insertAdjacentHTML('beforeend',
        `<button type="button" id="btnMatchDebug" class="btn-ios-pill btn-ios-pill-dev" title="Exibir origem do match nos cards"><span>🎯</span><span>Match ${on ? 'ON' : 'OFF'}</span></button>`
      );
      document.getElementById('btnMatchDebug')?.addEventListener('click', () => {
        const enabled = PROOFLY_DEBUG.toggleMatchDebug();
        const btn = document.getElementById('btnMatchDebug');
        if (btn) btn.innerHTML = `<span>🎯</span><span>Match ${enabled ? 'ON' : 'OFF'}</span>`;
        if (typeof window.renderContratarResults === 'function') window.renderContratarResults();
        if (typeof window.renderContratarCarousel === 'function') window.renderContratarCarousel();
      });
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
    if (!appReady) {
      showBootError('Não foi possível iniciar. Verifique a conexão e recarregue.');
    }
  }

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