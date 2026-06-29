// =====================================================
// Ranking Pro v2 — Home Cliente (só QR + histórico)
// =====================================================

(function() {
  'use strict';

  function esc(s) {
    return typeof escapeHtml === 'function' ? escapeHtml(s) : String(s || '');
  }

  function isClientProfile() {
    const session = typeof getSession === 'function' ? getSession() : null;
    return !!(session?.userId
      && typeof getActiveProfileType === 'function'
      && getActiveProfileType(session) === 'client');
  }

  async function renderClientChip() {
    const session = typeof getSession === 'function' ? getSession() : null;
    const chip = document.getElementById('avalieClientChip');
    const tooltipEl = document.getElementById('avalieClientTooltip');
    const avatarImg = document.getElementById('avalieClientAvatarImg');
    const avatarFallback = document.getElementById('avalieClientAvatarFallback');

    if (!session?.userId) {
      if (chip) chip.hidden = true;
      return;
    }

    const displayName = session.name || 'Cliente';
    if (chip) {
      chip.hidden = false;
      chip.setAttribute('aria-label', `Seu perfil — ${displayName}`);
      chip.href = isClientProfile() ? './meu-perfil.html' : './login.html';
    }
    if (tooltipEl) tooltipEl.textContent = displayName;

    let avatarUrl = null;
    if (typeof resolveUserAvatarUrl === 'function') {
      avatarUrl = await resolveUserAvatarUrl(session);
    }

    const initial = esc(displayName.charAt(0).toUpperCase() || '?');
    if (avatarImg && avatarFallback) {
      if (avatarUrl) {
        avatarImg.src = avatarUrl;
        avatarImg.alt = displayName;
        avatarImg.hidden = false;
        avatarFallback.hidden = true;
        avatarImg.onerror = function() {
          avatarImg.hidden = true;
          avatarFallback.hidden = false;
          avatarFallback.textContent = initial;
        };
      } else {
        avatarImg.hidden = true;
        avatarFallback.hidden = false;
        avatarFallback.textContent = initial;
      }
    }
  }

  function showDevPill() {
    const dev = (typeof DEBUG_MODE !== 'undefined' && DEBUG_MODE)
      || (typeof PROOFLY_DEV_MENU !== 'undefined' && PROOFLY_DEV_MENU);
    const pill = document.getElementById('devControlPill');
    if (pill && dev) pill.style.display = '';
  }

  function init() {
    document.body.classList.add('cliente-page--avalie');
    showDevPill();
  }

  document.addEventListener('scriptsLoaded', function() {
    renderClientChip();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();