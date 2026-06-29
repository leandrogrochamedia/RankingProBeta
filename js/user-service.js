// ============================================================
// PROOFLY - USER SERVICE
// Modelo simplificado: users.client_id → client_profiles (1:1)
// ============================================================

const CLIENT_PROFILES_API = '/rest/v1/client_profiles';

/** Vínculos demo — garante owner do Batel no login do Leandro (não apaga professional_id) */
const LEANDRO_DEMO_LINKS = {
  email: 'leandro@proofly.com',
  establishment_id: '10000000-0000-4000-8000-000000000001'
};

async function fetchUserByEmail(email) {
  if (!email) return null;
  try {
    const encoded = encodeURIComponent(email);
    const data = await fetchAPI(`/rest/v1/users?email=eq.${encoded}&select=*`);
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.warn('❌ Erro ao buscar usuário:', error);
    return null;
  }
}

async function fetchUserById(userId) {
  if (!userId) return null;
  try {
    const data = await fetchAPI(`/rest/v1/users?id=eq.${userId}&select=*`);
    return data?.[0] || null;
  } catch (error) {
    console.warn('❌ Erro ao buscar usuário por id:', error);
    return null;
  }
}

async function createUser(userData) {
  try {
    const data = await fetchAPI('/rest/v1/users', 'POST', userData);
    return data && data.length > 0 ? data[0] : userData;
  } catch (error) {
    console.warn('❌ Erro ao criar usuário:', error);
    throw error;
  }
}

async function updateUser(userId, updates) {
  try {
    const data = await fetchAPI(`/rest/v1/users?id=eq.${userId}`, 'PATCH', updates);
    return data && data.length > 0 ? data[0] : updates;
  } catch (error) {
    console.warn('❌ Erro ao atualizar usuário:', error);
    throw error;
  }
}

/** ID do perfil cliente ativo — users.client_id espelhado na sessão */
function getClientId(session) {
  const s = session || (typeof getSession === 'function' ? getSession() : null);
  return s?.clientId || null;
}

function buildSessionFromUser(user, extra = {}) {
  if (!user) return extra;
  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    clientId: user.client_id || extra.clientId || null,
    professionalId: user.professional_id || extra.professionalId || null,
    establishmentId: user.establishment_id || extra.establishmentId || null,
    isAdmin: user.is_admin || false,
    ...extra
  };
}

async function linkUserClientProfile(userId, clientProfileId) {
  if (!userId || !clientProfileId) return null;
  return updateUser(userId, { client_id: clientProfileId });
}

async function syncUserSession(email) {
  if (!email) return null;
  try {
    let user = await fetchUserByEmail(email);
    if (user) {
      if (typeof prepareUserAfterAuth === 'function') {
        user = await prepareUserAfterAuth(user);
      }
      const session = getSession() || {};
      delete session.activeProfile;
      setSession(buildSessionFromUser(user, session));
      return user;
    }
    return null;
  } catch (error) {
    console.warn('❌ Erro ao sincronizar sessão:', error);
    return null;
  }
}

function getCurrentUser() {
  const session = getSession();
  if (!session || !session.userId) return null;
  return {
    id: session.userId,
    name: session.name,
    email: session.email,
    role: session.role,
    clientId: getClientId(session),
    professionalId: session.professionalId,
    establishmentId: session.establishmentId,
    isAdmin: session.isAdmin || false
  };
}

function getReviewSourceFromSession() {
  const session = getSession();
  if (!session) return null;
  if (session.establishmentId && session.role === 'estabelecimento') return 'estabelecimento';
  return 'cliente';
}

/** Garante owner do Batel no Leandro — não remove professional_id cadastrado pelo usuário */
async function ensureDemoUserLinks(user) {
  if (!user || user.email !== LEANDRO_DEMO_LINKS.email) return user;
  const updates = {};
  if (user.establishment_id !== LEANDRO_DEMO_LINKS.establishment_id) {
    updates.establishment_id = LEANDRO_DEMO_LINKS.establishment_id;
  }
  if (!Object.keys(updates).length) return user;
  try {
    const updated = await updateUser(user.id, updates);
    return { ...user, ...updated, ...updates };
  } catch (e) {
    console.warn('⚠️ Não foi possível aplicar vínculos demo:', e.message);
    return user;
  }
}

function matchProfessionalByUserName(userName, professionals) {
  const tokens = String(userName || '')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 3);
  if (!tokens.length) return null;
  const minHits = tokens.length >= 2 ? 2 : 1;
  const hit = (prof) => {
    const pname = (prof.name || '').toLowerCase();
    return tokens.filter((t) => pname.includes(t.toLowerCase())).length;
  };
  const ranked = (professionals || [])
    .map((p) => ({ p, score: hit(p) }))
    .filter((x) => x.score >= minHits)
    .sort((a, b) => b.score - a.score);
  if (ranked.length) return ranked[0].p;
  return (professionals || []).length === 1 ? professionals[0] : null;
}

/** Re-vincula profissional órfão (ex.: onboarding sem users.professional_id) */
async function relinkOrphanedProfessional(user) {
  if (!user?.id || user.professional_id || !user.name || typeof fetchAPI !== 'function') {
    return user;
  }
  const tokens = String(user.name).split(/\s+/).filter((w) => w.length > 3);
  if (!tokens.length) return user;

  try {
    const needle = tokens.slice(0, 2).join(' ');
    const rows = await fetchAPI(
      `/rest/v1/professionals?name=ilike.*${encodeURIComponent(needle)}*&select=id,name,specialty,avatar_url&limit=8`
    );
    const match = matchProfessionalByUserName(user.name, rows);

    if (!match?.id) return user;

    const updated = await updateUser(user.id, { professional_id: match.id });
    console.log('🔗 Profissional re-vinculado ao login:', match.name);
    return { ...user, ...updated, professional_id: match.id };
  } catch (e) {
    console.warn('⚠️ Não foi possível re-vincular profissional:', e.message);
    return user;
  }
}

async function prepareUserAfterAuth(user) {
  let prepared = user;
  if (typeof ensureDemoUserLinks === 'function') {
    prepared = await ensureDemoUserLinks(prepared);
  }
  if (typeof relinkOrphanedProfessional === 'function') {
    prepared = await relinkOrphanedProfessional(prepared);
  }
  return prepared;
}

/** Resolve perfis vinculados ao usuário (owner, profissional, cliente) com nomes */
async function fetchUserAffiliations(userOrSession) {
  const result = { client: null, professional: null, establishment: null, establishments: [] };
  if (!userOrSession || typeof fetchAPI !== 'function') return result;

  const userId = userOrSession.id || userOrSession.userId;
  const userEmail = userOrSession.email;
  const userName = userOrSession.name;
  let profId = userOrSession.professional_id || userOrSession.professionalId;
  const estId = userOrSession.establishment_id || userOrSession.establishmentId;
  const clientId = userOrSession.client_id || userOrSession.clientId;

  try {
    if (!profId && userEmail) {
      const byEmail = await fetchAPI(
        `/rest/v1/professionals?email=eq.${encodeURIComponent(userEmail)}&select=id,name,specialty,avatar_url&limit=1`
      );
      if (byEmail?.[0]) profId = byEmail[0].id;
    }

    if (!profId && userName) {
      const tokens = String(userName).split(/\s+/).filter((w) => w.length > 3);
      if (tokens.length) {
        const needle = tokens.slice(0, 2).join(' ');
        const byName = await fetchAPI(
          `/rest/v1/professionals?name=ilike.*${encodeURIComponent(needle)}*&select=id,name,specialty,avatar_url&limit=8`
        );
        const match = matchProfessionalByUserName(userName, byName);
        if (match?.id) profId = match.id;
      }
    }

    if (profId) {
      const rows = await fetchAPI(
        `/rest/v1/professionals?id=eq.${profId}&select=id,name,specialty,avatar_url,current_establishment:establishments!professionals_current_establishment_id_fkey(name)`
      );
      if (rows?.[0]) result.professional = rows[0];
    }

    if (userId && typeof probeOwnerColumn === 'function') {
      const col = await probeOwnerColumn();
      if (col.exists === true) {
        try {
          const owned = await fetchAPI(
            `/rest/v1/establishments?owner_user_id=eq.${userId}&select=id,name,city,type,avatar_url&order=name`
          );
          if (owned?.length) {
            result.establishments = owned;
            result.establishment = owned[0];
          }
        } catch (ownerErr) {
          console.warn('⚠️ Erro ao buscar establishments por owner:', ownerErr?.message || ownerErr);
        }
      }
    } else if (userId) {
      try {
        const owned = await fetchAPI(
          `/rest/v1/establishments?owner_user_id=eq.${userId}&select=id,name,city,type,avatar_url&order=name`
        );
        if (owned?.length) {
          result.establishments = owned;
          result.establishment = owned[0];
        }
      } catch (ownerErr) {
        const msg = String(ownerErr?.message || ownerErr);
        if (!msg.includes('owner_user_id') && !msg.includes('PGRST204')) {
          console.warn('⚠️ Erro ao buscar establishments por owner:', msg);
        }
      }
    }

    if (estId) {
      const alreadyListed = result.establishments.some((e) => e.id === estId);
      if (!alreadyListed) {
        const rows = await fetchAPI(
          `/rest/v1/establishments?id=eq.${estId}&select=id,name,city,type,avatar_url`
        );
        if (rows?.[0]) {
          result.establishments.push(rows[0]);
          if (!result.establishment) result.establishment = rows[0];
        }
      } else if (!result.establishment) {
        result.establishment = result.establishments.find((e) => e.id === estId) || result.establishments[0];
      }
    }

    if (clientId) {
      const rows = await fetchAPI(
        `${CLIENT_PROFILES_API}?id=eq.${clientId}&select=id,name,city,avatar_url`
      );
      if (rows?.[0]) result.client = rows[0];
    }
  } catch (e) {
    console.warn('⚠️ Erro ao carregar vínculos:', e.message);
  }
  return result;
}

function countUserAffiliations(affiliations) {
  if (!affiliations) return 0;
  let count = 0;
  if (affiliations.client?.id) count += 1;
  if (affiliations.professional?.id) count += 1;
  const estCount = affiliations.establishments?.length
    || (affiliations.establishment?.id ? 1 : 0);
  count += estCount;
  return count;
}

window.CLIENT_PROFILES_API = CLIENT_PROFILES_API;
window.LEANDRO_DEMO_LINKS = LEANDRO_DEMO_LINKS;
window.fetchUserByEmail = fetchUserByEmail;
window.fetchUserById = fetchUserById;
window.createUser = createUser;
window.updateUser = updateUser;
window.getClientId = getClientId;
window.buildSessionFromUser = buildSessionFromUser;
window.linkUserClientProfile = linkUserClientProfile;
window.syncUserSession = syncUserSession;
window.getCurrentUser = getCurrentUser;
window.getReviewSourceFromSession = getReviewSourceFromSession;
window.ensureDemoUserLinks = ensureDemoUserLinks;
window.matchProfessionalByUserName = matchProfessionalByUserName;
window.relinkOrphanedProfessional = relinkOrphanedProfessional;
window.prepareUserAfterAuth = prepareUserAfterAuth;
window.fetchUserAffiliations = fetchUserAffiliations;
window.countUserAffiliations = countUserAffiliations;