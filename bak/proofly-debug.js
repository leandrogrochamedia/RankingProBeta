// ============================================================
// PROOFLY — Debug global (sessão, match, flags DEV)
// window.PROOFLY_DEBUG
// ============================================================

(function() {
  const MATCH_KEY = 'proofly_match_debug';
  const DEV_KEY = 'proofly_dev_tools';

  function isEnabled() {
    if (typeof DEBUG_MODE !== 'undefined' && DEBUG_MODE) return true;
    try { return localStorage.getItem(DEV_KEY) === '1'; } catch { return false; }
  }

  function isMatchDebugOn() {
    if (!isEnabled()) return false;
    try { return localStorage.getItem(MATCH_KEY) === '1'; } catch { return false; }
  }

  function setMatchDebug(on) {
    try { localStorage.setItem(MATCH_KEY, on ? '1' : '0'); } catch { /* ignore */ }
    document.body?.classList.toggle('proofly-match-debug', !!on);
    return !!on;
  }

  function toggleMatchDebug() {
    return setMatchDebug(!isMatchDebugOn());
  }

  function getSessionDebug() {
    return typeof getSession === 'function' ? getSession() : null;
  }

  function logSession(label) {
    const s = getSessionDebug();
    const payload = {
      label: label || 'PROOFLY_DEBUG',
      session: s,
      clientId: typeof getClientId === 'function' ? getClientId(s) : s?.clientId,
      prefs: typeof getStoredClientPrefs === 'function' ? getStoredClientPrefs() : null,
      location: typeof getStoredClientLocation === 'function' ? getStoredClientLocation() : null
    };
    console.group(`🧪 ${payload.label}`);
    console.table(s ? [s] : []);
    if (payload.prefs) console.log('prefs', payload.prefs);
    if (payload.location) console.log('location', payload.location);
    console.groupEnd();
    return payload;
  }

  function clearSessionDebug() {
    if (typeof resetAppSession === 'function') {
      resetAppSession();
    } else if (typeof clearSession === 'function') {
      clearSession();
    }
    console.log('🗑️ PROOFLY_DEBUG: sessão e caches locais limpos');
  }

  function logMatch(item, tipo, activeTags) {
    if (typeof buildMatchBreakdown !== 'function') {
      console.warn('buildMatchBreakdown não carregado');
      return null;
    }
    const breakdown = buildMatchBreakdown(item, tipo, activeTags);
    console.group(`🎯 Match ${tipo} — ${item?.name || item?.id || '?'}`);
    console.log('percent', breakdown.percent, '| raw', breakdown.rawScore);
    console.log('sharedTags', breakdown.sharedTags);
    console.table(breakdown.components);
    console.groupEnd();
    return breakdown;
  }

  function logContratanteMatch(prof, establishment) {
    if (typeof buildContratanteMatchBreakdown !== 'function') {
      console.warn('buildContratanteMatchBreakdown não carregado (talent-market.js)');
      return null;
    }
    const b = buildContratanteMatchBreakdown(prof, establishment);
    if (!b) return null;
    console.group(`🎯 Match contratante — ${prof?.name || prof?.id || '?'}`);
    console.log('percent', b.percent, '% |', b.formula);
    console.log('headline', b.headline);
    console.log('sharedTags', b.sharedTags);
    console.table(b.components);
    console.log('estabTags', b.estabTags);
    console.log('profTags', b.profTags);
    console.groupEnd();
    return b;
  }

  function renderContratanteMatchDebugHtml(prof, establishment) {
    if (!isMatchDebugOn() || typeof buildContratanteMatchBreakdown !== 'function') return '';
    const b = buildContratanteMatchBreakdown(prof, establishment);
    if (!b) return '';
    const esc = typeof escapeHtml === 'function' ? escapeHtml : s => String(s || '');
    const rows = (b.components || []).map(c =>
      `<div class="match-debug-row"><span>${esc(c.label)} <em class="match-debug-origin">(${esc(c.weight)} · ${esc(c.origin)})</em></span><span>+${c.points}</span></div>`
    ).join('');
    const shared = (b.sharedTags || []).map(t => `<span class="match-debug-chip">${esc(t)}</span>`).join('') || '—';
    return `
      <div class="match-debug-panel match-debug-contratante" onclick="event.stopPropagation()">
        <div class="match-debug-title">DEBUG contratação · ${b.percent}%</div>
        <div class="match-debug-meta">${esc(b.formula)} · ${esc(b.headline || '')}</div>
        <div class="match-debug-shared">Tags em comum: ${shared}</div>
        <div class="match-debug-rows">${rows}</div>
      </div>`;
  }

  function renderMatchDebugHtml(item, tipo, activeTags) {
    if (!isMatchDebugOn() || typeof buildMatchBreakdown !== 'function') return '';
    const b = buildMatchBreakdown(item, tipo, activeTags);
    const esc = typeof escapeHtml === 'function' ? escapeHtml : s => String(s || '');
    const rows = (b.components || []).map(c =>
      `<div class="match-debug-row"><span>${esc(c.label)}</span><span>+${c.points}</span></div>`
    ).join('');
    const shared = (b.sharedTags || []).map(t => `<span class="match-debug-chip">${esc(t)}</span>`).join('') || '—';
    return `
      <div class="match-debug-panel" onclick="event.stopPropagation()">
        <div class="match-debug-title">DEBUG · ${b.percent ?? '—'}% match</div>
        <div class="match-debug-meta">raw ${b.rawScore} · ${esc(b.tier || '')}</div>
        <div class="match-debug-shared">Tags: ${shared}</div>
        <div class="match-debug-rows">${rows}</div>
      </div>`;
  }

  function syncBodyClasses() {
    document.body?.classList.toggle('proofly-dev-enabled', isEnabled());
    document.body?.classList.toggle('proofly-match-debug', isMatchDebugOn());
  }

  function showDevPill() {
    const pill = document.getElementById('devControlPill');
    if (pill && isEnabled()) pill.style.display = '';
  }

  const api = {
    isEnabled,
    isMatchDebugOn,
    setMatchDebug,
    toggleMatchDebug,
    getSession: getSessionDebug,
    logSession,
    clearSession: clearSessionDebug,
    logMatch,
    logContratanteMatch,
    renderMatchDebugHtml,
    renderContratanteMatchDebugHtml,
    enableDevTools() {
      try { localStorage.setItem(DEV_KEY, '1'); } catch { /* ignore */ }
      syncBodyClasses();
      showDevPill();
    }
  };

  window.PROOFLY_DEBUG = api;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { syncBodyClasses(); showDevPill(); });
  } else {
    syncBodyClasses();
    showDevPill();
  }

  if (isMatchDebugOn()) document.body?.classList.add('proofly-match-debug');
})();