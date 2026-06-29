// Ranking Pro — sessão centralizada (proofly_session)

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
  } catch (e) {
    console.warn('Erro ao salvar sessão:', e);
  }
}

function clearSession() {
  try {
    sessionStorage.removeItem('proofly_session');
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
  LOCAL_SESSION_CACHE_KEYS.forEach(function (key) {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  });
}

function resetAppSession() {
  clearSession();
  clearLocalSessionCaches();
  if (getSession() !== null) {
    try { sessionStorage.clear(); } catch { /* ignore */ }
  }
  return getSession() === null;
}

function resetSessionAndGoHome() {
  resetAppSession();
  const home = (typeof RankingProPaths !== 'undefined')
    ? RankingProPaths.siteUrl('index.html')
    : './index.html';
  window.location.replace(home);
}

function setActiveProfile(type, id) {
  const session = getSession() || {};
  const roleMap = {
    client: 'cliente', cliente: 'cliente',
    professional: 'profissional', profissional: 'profissional',
    establishment: 'estabelecimento', estabelecimento: 'estabelecimento'
  };
  const profileMap = {
    client: 'client', cliente: 'client',
    professional: 'professional', profissional: 'professional',
    establishment: 'establishment', estabelecimento: 'establishment'
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
    const map = { client: 'client', professional: 'professional', establishment: 'establishment' };
    return map[ap.type] || null;
  }
  return null;
}

function setClientId(clientProfileId) {
  const session = getSession();
  if (!session) return;
  session.clientId = clientProfileId || null;
  setSession(session);
}

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