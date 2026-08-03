// ============================================================
// PROOFLY - USER SERVICE
// Modelo simplificado: users.client_id → client_profiles (1:1)
// ============================================================

const CLIENT_PROFILES_API = '/rest/v1/client_profiles';

/** Vínculos demo — aplicados no login se o usuário ainda não tiver owner/prof */
/** Leandro = owner do Batel Barber. Sem professional_id (Lucas Santos era só demo confuso). */
const LEANDRO_DEMO_LINKS = {
  email: 'leandro@proofly.com',
  establishment_id: '10000000-0000-4000-8000-000000000001',
  professional_id: null
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
    const user = await fetchUserByEmail(email);
    if (user) {
      const session = getSession() || {};
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

/** Aplica vínculos demo ao Leandro (owner + prof) se ainda não existirem no banco */
async function ensureDemoUserLinks(user) {
  if (!user || user.email !== LEANDRO_DEMO_LINKS.email) return user;
  const updates = {};
  if (user.establishment_id !== LEANDRO_DEMO_LINKS.establishment_id) {
    updates.establishment_id = LEANDRO_DEMO_LINKS.establishment_id;
  }
  if (LEANDRO_DEMO_LINKS.professional_id === null && user.professional_id) {
    updates.professional_id = null;
  } else if (LEANDRO_DEMO_LINKS.professional_id && user.professional_id !== LEANDRO_DEMO_LINKS.professional_id) {
    updates.professional_id = LEANDRO_DEMO_LINKS.professional_id;
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

/** Resolve perfis vinculados ao usuário (owner, profissional, cliente) com nomes */
async function fetchUserAffiliations(userOrSession) {
  const result = { client: null, professional: null, establishment: null, establishments: [] };
  if (!userOrSession || typeof fetchAPI !== 'function') return result;

  const userId = userOrSession.id || userOrSession.userId;
  const profId = userOrSession.professional_id || userOrSession.professionalId;
  const estId = userOrSession.establishment_id || userOrSession.establishmentId;
  const clientId = userOrSession.client_id || userOrSession.clientId;

  try {
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
window.fetchUserAffiliations = fetchUserAffiliations;
window.countUserAffiliations = countUserAffiliations;