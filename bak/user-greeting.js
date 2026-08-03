// ============================================================
// PROOFLY — Saudação com avatar do perfil ativo
// ============================================================

(function() {
  function resolveProfileUrl(session) {
    if (!session?.userId) return './login.html?returnTo=cliente.html';
    const activeType = typeof getActiveProfileType === 'function'
      ? getActiveProfileType(session)
      : null;
    if (!activeType) return './selecionar-perfil.html';
    if (activeType === 'client') return './meu-perfil.html';
    if (activeType === 'professional') {
      const pid = session.professionalId;
      return pid ? `./perfil-page.html?tipo=profissional&id=${encodeURIComponent(pid)}` : './selecionar-profissional.html';
    }
    if (activeType === 'establishment') {
      const eid = session.establishmentId;
      return eid ? `./perfil-page.html?tipo=estabelecimento&id=${encodeURIComponent(eid)}` : './selecionar-estabelecimento.html';
    }
    return './meu-perfil.html';
  }

  async function resolveUserAvatarUrl(session) {
    if (!session || typeof fetchAPI !== 'function') return null;

    const activeType = typeof getActiveProfileType === 'function'
      ? getActiveProfileType(session)
      : null;

    const tryFetch = async (table, id) => {
      if (!id) return null;
      try {
        const rows = await fetchAPI(`/rest/v1/${table}?id=eq.${id}&select=avatar_url&limit=1`);
        const url = rows?.[0]?.avatar_url;
        return url && String(url).trim() ? url : null;
      } catch {
        return null;
      }
    };

    if (activeType === 'professional' && session.professionalId) {
      const url = await tryFetch('professionals', session.professionalId);
      if (url) return url;
    }
    if (activeType === 'establishment' && session.establishmentId) {
      const url = await tryFetch('establishments', session.establishmentId);
      if (url) return url;
    }

    const clientId = typeof getClientId === 'function' ? getClientId(session) : session.clientId;
    if (clientId) {
      const url = await tryFetch('client_profiles', clientId);
      if (url) return url;
    }

    if (session.userId && typeof fetchUserById === 'function') {
      try {
        const user = await fetchUserById(session.userId);
        if (user?.client_id) {
          return tryFetch('client_profiles', user.client_id);
        }
      } catch { /* ignore */ }
    }

    return null;
  }

  function buildAvatarMarkup(name, avatarUrl) {
    const esc = typeof escapeHtml === 'function' ? escapeHtml : (s) => String(s || '');
    const initial = esc((name || '?').charAt(0).toUpperCase());
    if (avatarUrl) {
      return `<span class="user-chip-avatar"><img src="${esc(avatarUrl)}" alt="" loading="lazy" onerror="this.closest('.user-chip-avatar').innerHTML='<span class=\\'user-chip-initial\\'>${initial}</span>'" /></span>`;
    }
    return `<span class="user-chip-avatar user-chip-avatar--fallback"><span class="user-chip-initial">${initial}</span></span>`;
  }

  async function renderUserGreeting(container, session) {
    if (!container) return;
    const esc = typeof escapeHtml === 'function' ? escapeHtml : (s) => String(s || '');
    const s = session || (typeof getSession === 'function' ? getSession() : null);

    if (!s?.userId) {
      container.innerHTML = `<a href="./login.html?returnTo=cliente.html" class="user-greeting-chip user-greeting-chip--guest user-greeting-chip--avatar-only" aria-label="Entrar">${buildAvatarMarkup('Entrar', null)}<span class="user-chip-tooltip">Entrar</span></a>`;
      return;
    }

    const profileUrl = resolveProfileUrl(s);
    const displayName = s.name || 'você';

    if (typeof getActiveProfileType === 'function' && !getActiveProfileType(s)) {
      container.innerHTML = `<a href="./selecionar-perfil.html" class="user-greeting-chip user-greeting-chip--avatar-only" aria-label="Definir perfil — ${esc(displayName)}">${buildAvatarMarkup(displayName, null)}<span class="user-chip-tooltip">${esc(displayName)}</span></a>`;
      return;
    }

    const avatarUrl = await resolveUserAvatarUrl(s);

    container.innerHTML = `
      <a href="${profileUrl}" class="user-greeting-chip user-greeting-chip--avatar-only" aria-label="Seu perfil — ${esc(displayName)}">
        ${buildAvatarMarkup(displayName, avatarUrl)}
        <span class="user-chip-tooltip">${esc(displayName)}</span>
      </a>
    `;
  }

  window.resolveUserAvatarUrl = resolveUserAvatarUrl;
  window.renderUserGreeting = renderUserGreeting;
})();