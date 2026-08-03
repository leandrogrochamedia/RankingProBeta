// =====================================================
// PROOFLY - Gerenciador Centralizado de Sessão
// =====================================================
// Identidade: userId + users.client_id (espelhado em clientId)
// activeProfile — 'client' | 'professional' | 'establishment'
// =====================================================

function getSession() {
  try {
    const raw = sessionStorage.getItem('proofly_session');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Erro ao ler sessão:', e);
    return null;
  }
}

function setSession(data) {
  try {
    sessionStorage.setItem('proofly_session', JSON.stringify(data));
    console.log('✅ Sessão salva (temporária):', data);
  } catch (e) {
    console.warn('Erro ao salvar sessão:', e);
  }
}

function clearSession() {
  try {
    sessionStorage.removeItem('proofly_session');
    console.log('🗑️ Sessão removida');
  } catch (e) {
    console.warn('Erro ao limpar sessão:', e);
  }
}

const LOCAL_SESSION_CACHE_KEYS = [
  'selectedProfessionalId',
  'selectedEstablishmentId',
  'selected_establishment_id',
  'proofly_client_prefs',
  'widgetEstabId',
  'userLogged',
  'avaliarProfId',
  'avaliarEstabId'
];

function clearLocalSessionCaches() {
  LOCAL_SESSION_CACHE_KEYS.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch { /* ignore */ }
  });
}

/** Limpa sessão + caches locais de auth/perfil (não remove favoritos nem flags DEV) */
function resetAppSession() {
  clearSession();
  clearLocalSessionCaches();
  const gone = getSession() === null;
  if (!gone) {
    try {
      sessionStorage.clear();
    } catch { /* ignore */ }
  }
  return getSession() === null;
}

/** Reset completo e volta para a landing — uso em Sair / Reset Session */
function resetSessionAndGoHome() {
  const cleared = resetAppSession();
  console.log(cleared ? '🏠 Sessão encerrada → landing' : '⚠️ Falha ao limpar sessão');
  window.location.replace('./index.html');
}

// ===== NOVAS FUNÇÕES PARA MULTI-PERFIL =====

function setActiveProfile(type, id) {
  const session = getSession() || {};
  const roleMap = {
    client: 'cliente',
    cliente: 'cliente',
    professional: 'profissional',
    profissional: 'profissional',
    establishment: 'estabelecimento',
    estabelecimento: 'estabelecimento'
  };
  const profileMap = {
    client: 'client',
    cliente: 'client',
    professional: 'professional',
    profissional: 'professional',
    establishment: 'establishment',
    estabelecimento: 'establishment'
  };

  if (typeof type === 'object' && type?.type) {
    id = type.id ?? id;
    type = type.type;
  }

  const profileType = profileMap[type] || type;
  if (profileType) session.activeProfile = profileType;
  if (roleMap[type]) session.role = roleMap[type];

  if (id !== undefined && id !== null) {
    if (profileType === 'client') session.clientId = id;
    if (profileType === 'professional') session.professionalId = id;
    if (profileType === 'establishment') session.establishmentId = id;
  }

  setSession(session);
}

function getActiveProfile() {
  const session = getSession();
  const ap = session?.activeProfile;
  if (!ap) return null;
  if (typeof ap === 'string') return ap;
  if (ap.type) {
    const map = {
      client: 'client',
      professional: 'professional',
      establishment: 'establishment'
    };
    return map[ap.type] || null;
  }
  return null;
}

/** Atualiza clientId na sessão após link em users.client_id */
function setClientId(clientProfileId) {
  const session = getSession();
  if (!session) return;
  session.clientId = clientProfileId || null;
  setSession(session);
}

// EXPOR GLOBALMENTE
window.getSession = getSession;
window.setSession = setSession;
window.clearSession = clearSession;
window.clearLocalSessionCaches = clearLocalSessionCaches;
window.resetAppSession = resetAppSession;
window.resetSessionAndGoHome = resetSessionAndGoHome;
window.resetSession = resetSessionAndGoHome;
window.setActiveProfile = setActiveProfile;
window.getActiveProfile = getActiveProfile;
window.setClientId = setClientId;