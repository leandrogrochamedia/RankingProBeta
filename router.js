// ============================================================
// PROOFLY - ROTEADOR CENTRAL
// ============================================================
// Responsável por: intent + session + redirecionamento
// ============================================================

/**
 * Resolve o redirecionamento correto baseado em intent e usuário
 * @param {string} intent - Parâmetro da URL (?intent=...)
 * @param {Object} user - Objeto do usuário (da sessão ou do banco)
 * @returns {string} URL de destino
 */
function resolveRedirect(intent, user) {
  const onboardingUrl = typeof resolveOnboardingUrl === 'function'
    ? resolveOnboardingUrl(intent)
    : null;
  if (onboardingUrl) return onboardingUrl;

  const profileFromIntent = typeof profileTypeFromIntent === 'function'
    ? profileTypeFromIntent(intent)
    : (typeof intentToPersonaType === 'function' ? intentToPersonaType(intent) : null);

  const session = typeof getSession === 'function' ? getSession() : null;
  const merged = {
    ...(session || {}),
    ...(user || {}),
    professionalId: user?.professional_id ?? session?.professionalId,
    establishmentId: user?.establishment_id ?? session?.establishmentId,
    clientId: user?.client_id ?? session?.clientId
  };

  if (profileFromIntent) {
    if (typeof resolvePersonaHome === 'function') {
      return resolvePersonaHome(profileFromIntent, merged);
    }
    return typeof getProfileHomeUrl === 'function'
      ? getProfileHomeUrl(profileFromIntent, merged)
      : './selecionar-perfil.html';
  }

  const activeType = typeof getActiveProfileType === 'function'
    ? getActiveProfileType(session || user)
    : null;

  if (activeType) {
    if (typeof resolvePersonaHome === 'function') {
      return resolvePersonaHome(activeType, merged);
    }
    if (typeof getProfileHomeUrl === 'function') {
      return getProfileHomeUrl(activeType, merged);
    }
  }

  if (merged.userId) return './selecionar-perfil.html';
  return './index.html';
}

/**
 * Executa o redirecionamento com base na URL atual e sessão
 * @param {Object} session - Objeto da sessão (getSession())
 */
function executeRedirect(session) {
  const params = new URLSearchParams(window.location.search);
  const intent = params.get('intent');
  const url = resolveRedirect(intent, session);
  const current = window.location.pathname.split('/').pop() || 'index.html';
  const target = url.replace('./', '');
  if (target !== current) {
    window.location.href = url;
  }
}

window.resolveRedirect = resolveRedirect;
window.executeRedirect = executeRedirect;