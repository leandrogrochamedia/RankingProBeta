// ============================================================
// PROOFLY — Seletor de perfil multi-role (client / professional / establishment)
// ============================================================

const PROFILE_TYPES = {
  client: {
    role: 'cliente',
    icon: '👤',
    label: 'Cliente',
    subtitle: 'Avaliar com QR ou buscar profissionais',
    intent: 'cliente'
  },
  professional: {
    role: 'profissional',
    icon: '💼',
    label: 'Profissional',
    subtitle: 'Seu perfil profissional',
    intent: 'professional'
  },
  establishment: {
    role: 'estabelecimento',
    icon: '🏢',
    label: 'Estabelecimento',
    subtitle: 'Contratar profissionais para seu negócio',
    intent: 'establishment'
  }
};

const PROFILE_SELECTOR_URL = './selecionar-perfil.html';
const PROFILE_FORCE_PARAM = 'forceProfileSelect';

function normalizeProfileType(value) {
  if (!value) return null;
  if (typeof value === 'string') {
    return PROFILE_TYPES[value] ? value : null;
  }
  if (typeof value === 'object' && value.type) {
    const map = {
      client: 'client',
      cliente: 'client',
      professional: 'professional',
      profissional: 'professional',
      establishment: 'establishment',
      estabelecimento: 'establishment'
    };
    return map[value.type] || null;
  }
  return null;
}

/** Só conta escolha explícita do usuário — role do banco NÃO pula o seletor */
function getActiveProfileType(session) {
  const s = session || (typeof getSession === 'function' ? getSession() : null);
  return normalizeProfileType(s?.activeProfile);
}

function hasExplicitActiveProfile(session) {
  return !!getActiveProfileType(session);
}

/** Quantos papéis vinculados o usuário tem (cliente / profissional / estabelecimento) */
function countLinkedProfileRoles(session) {
  const s = session || (typeof getSession === 'function' ? getSession() : null) || {};
  let n = 0;
  if (s.clientId) n += 1;
  if (s.professionalId) n += 1;
  if (s.establishmentId) n += 1;
  return n;
}

function hasMultipleProfileRoles(session) {
  return countLinkedProfileRoles(session) > 1;
}

function getProfileRoleBadge(session) {
  const s = session || (typeof getSession === 'function' ? getSession() : null) || {};
  const parts = [];
  if (s.professionalId) parts.push('💼');
  if (s.establishmentId) parts.push('🏢');
  if (s.clientId && !parts.length) parts.push('👤');
  else if (s.clientId) parts.push('👤');
  if (!parts.length) return '';
  return parts.join(' + ');
}

function setActiveProfileType(type) {
  const profileType = normalizeProfileType(type);
  if (!profileType) return;
  const meta = PROFILE_TYPES[profileType];
  const session = (typeof getSession === 'function' ? getSession() : null) || {};
  session.activeProfile = profileType;
  session.role = meta.role;
  if (typeof setSession === 'function') setSession(session);
}

function getProfileHomeUrl(type, session) {
  const profileType = normalizeProfileType(type);
  const s = session || (typeof getSession === 'function' ? getSession() : null) || {};
  if (!profileType) return PROFILE_SELECTOR_URL;

  switch (profileType) {
    case 'client':
      return (typeof getClientId === 'function' ? getClientId(s) : s.clientId)
        ? './cliente.html'
        : './selecionar-cliente.html';
    case 'professional':
      return s.professionalId ? './dashboard-profissional.html' : './selecionar-profissional.html';
    case 'establishment':
      return s.establishmentId ? './dashboard-estabelecimento.html' : './selecionar-estabelecimento.html';
    default:
      return PROFILE_SELECTOR_URL;
  }
}

function redirectToActiveProfileHome(session) {
  const s = session || (typeof getSession === 'function' ? getSession() : null);
  const type = getActiveProfileType(s);
  if (!type) return false;
  window.location.href = getProfileHomeUrl(type, s);
  return true;
}

function isForceProfileSelect() {
  return new URLSearchParams(window.location.search).get(PROFILE_FORCE_PARAM) === 'true';
}

function getProfileSelectorUrl(force) {
  return force ? `${PROFILE_SELECTOR_URL}?${PROFILE_FORCE_PARAM}=true` : PROFILE_SELECTOR_URL;
}

function shouldShowProfileSelector(session) {
  const s = session || (typeof getSession === 'function' ? getSession() : null);
  if (!s?.userId) return true;
  if (isForceProfileSelect()) return true;
  return !getActiveProfileType(s);
}

function enforceProfileGuard(requiredType, options = {}) {
  const profileType = normalizeProfileType(requiredType);
  if (!profileType) return true;

  const session = typeof getSession === 'function' ? getSession() : null;
  if (!session?.userId) {
    if (options.allowGuest) return true;
    window.location.href = `./login.html?returnTo=${encodeURIComponent(window.location.pathname.split('/').pop() + window.location.search)}`;
    return false;
  }

  const current = getActiveProfileType(session);
  if (current === profileType) return true;

  if (current) {
    window.location.href = getProfileHomeUrl(current, session);
  } else {
    window.location.href = getProfileSelectorUrl();
  }
  return false;
}

/** Exige login; permite uma ou mais personas (ex.: minhas-avaliacoes). */
function enforceProfileGuardAny(allowedTypes) {
  const types = (allowedTypes || []).map(normalizeProfileType).filter(Boolean);
  if (!types.length) return true;

  const session = typeof getSession === 'function' ? getSession() : null;
  if (!session?.userId) {
    window.location.href = `./login.html?returnTo=${encodeURIComponent(window.location.pathname.split('/').pop() + window.location.search)}`;
    return false;
  }

  const current = getActiveProfileType(session);
  if (!current) {
    window.location.href = getProfileSelectorUrl();
    return false;
  }
  if (types.includes(current)) return true;

  window.location.href = getProfileHomeUrl(current, session);
  return false;
}

function getProfileHintFromUrl() {
  const hint = new URLSearchParams(window.location.search).get('hintProfile');
  return normalizeProfileType(hint);
}

function selectProfileAndGo(type) {
  setActiveProfileType(type);
  const session = typeof getSession === 'function' ? getSession() : null;
  window.location.href = getProfileHomeUrl(type, session);
}

/** Monta opções do seletor pós-login (owner / prof / cliente ou genérico) */
function buildProfileEntryOptions(affiliations) {
  const aff = affiliations || {};
  const linked = [];
  const generic = [];

  const ownedEstablishments = aff.establishments?.length
    ? aff.establishments
    : (aff.establishment?.id ? [aff.establishment] : []);

  ownedEstablishments.forEach((est) => {
    linked.push({
      type: 'establishment',
      icon: '🏢',
      title: est.name,
      subtitle: `Contratar talentos · ${est.city || est.type || 'Estabelecimento'}`,
      badge: 'Owner',
      badgeRole: 'owner',
      entityId: est.id,
      entityName: est.name,
      linked: true
    });
  });

  if (aff.professional?.id) {
    const prof = aff.professional;
    const extra = prof.specialty || prof.current_establishment?.name || 'Profissional';
    linked.push({
      type: 'professional',
      icon: '💼',
      title: prof.name,
      subtitle: `Perfil profissional vinculado · ${extra}`,
      badge: 'Profissional',
      badgeRole: 'professional',
      entityId: prof.id,
      entityName: prof.name,
      linked: true
    });
  }
  if (aff.client?.id) {
    const cli = aff.client;
    linked.push({
      type: 'client',
      icon: '👤',
      title: cli.name,
      subtitle: `Avaliar com QR ou buscar · ${cli.city || 'área cliente'}`,
      badge: 'Cliente',
      badgeRole: 'client',
      entityId: cli.id,
      entityName: cli.name,
      linked: true
    });
  }

  if (linked.length) {
    linked.push({
      type: 'client',
      icon: '🔍',
      title: 'Só explorar',
      subtitle: 'Buscar sem escolher área agora',
      linked: false,
      browseOnly: true
    });
    return linked;
  }

  generic.push(
    {
      type: 'professional',
      icon: '💼',
      title: PROFILE_TYPES.professional.label,
      subtitle: 'Cadastrar ou vincular seu perfil profissional',
      linked: false
    },
    {
      type: 'establishment',
      icon: '🏢',
      title: PROFILE_TYPES.establishment.label,
      subtitle: 'Cadastrar ou vincular seu estabelecimento',
      linked: false
    },
    {
      type: 'client',
      icon: '👤',
      title: PROFILE_TYPES.client.label,
      subtitle: PROFILE_TYPES.client.subtitle,
      linked: false
    }
  );
  return generic;
}

function applyAffiliationToSession(type, entityId, entityName) {
  const profileType = normalizeProfileType(type);
  if (!profileType) return null;
  const meta = PROFILE_TYPES[profileType];
  const session = (typeof getSession === 'function' ? getSession() : null) || {};
  session.activeProfile = profileType;
  session.role = meta.role;
  if (profileType === 'professional' && entityId) {
    session.professionalId = entityId;
    if (entityName) session.professionalName = entityName;
  }
  if (profileType === 'establishment' && entityId) {
    session.establishmentId = entityId;
    if (entityName) session.establishmentName = entityName;
  }
  if (profileType === 'client' && entityId) {
    session.clientId = entityId;
  }
  if (typeof setSession === 'function') setSession(session);
  return session;
}

function getPostLoginReturnTo() {
  const params = new URLSearchParams(window.location.search);
  const rawReturn = params.get('returnTo');
  if (!rawReturn) return null;
  try {
    const decoded = decodeURIComponent(rawReturn);
    if (/^https?:\/\//i.test(decoded) || decoded.includes('//')) return null;
    return decoded.startsWith('./') || decoded.startsWith('/')
      ? decoded
      : './' + decoded;
  } catch {
    return null;
  }
}

function redirectAfterAffiliationSelection(type, session) {
  const returnTo = getPostLoginReturnTo();
  if (returnTo) {
    window.location.href = returnTo;
    return;
  }
  window.location.href = getProfileHomeUrl(type, session);
}

function selectAffiliationAndGo(option) {
  if (!option) return;
  if (option.browseOnly) {
    const session = (typeof getSession === 'function' ? getSession() : null) || {};
    delete session.activeProfile;
    if (typeof setSession === 'function') setSession(session);
    const returnTo = getPostLoginReturnTo();
    window.location.href = returnTo || './cliente.html';
    return;
  }
  if (option.linked && option.entityId) {
    const session = applyAffiliationToSession(option.type, option.entityId, option.entityName);
    redirectAfterAffiliationSelection(option.type, session);
    return;
  }
  selectProfileAndGo(option.type);
}

function redirectAfterLogin(intent) {
  const onboardingUrl = typeof resolveOnboardingUrl === 'function'
    ? resolveOnboardingUrl(intent)
    : null;
  if (onboardingUrl) {
    window.location.href = `${onboardingUrl}?force=true`;
    return;
  }

  const returnTo = getPostLoginReturnTo();
  if (returnTo) {
    window.location.href = returnTo;
    return;
  }

  window.location.href = routeAfterLogin(intent);
}

function routeAfterLogin(intent) {
  const onboardingIntents = ['onboarding-profissional', 'onboarding-estabelecimento'];
  if (onboardingIntents.includes(intent)) {
    return `./${intent}.html?force=true`;
  }

  let url = getProfileSelectorUrl();
  const extra = new URLSearchParams();
  const returnTo = getPostLoginReturnTo();
  if (returnTo) {
    extra.set('returnTo', returnTo.replace(/^\.\//, ''));
  }
  const hint = profileTypeFromIntent(intent);
  if (hint) extra.set('hintProfile', hint);
  const qs = extra.toString();
  if (qs) url += (url.includes('?') ? '&' : '?') + qs;
  return url;
}

function profileTypeFromIntent(intent) {
  const map = {
    cliente: 'client',
    client: 'client',
    professional: 'professional',
    profissional: 'professional',
    establishment: 'establishment',
    estabelecimento: 'establishment'
  };
  return map[intent] || null;
}

window.PROFILE_TYPES = PROFILE_TYPES;
window.PROFILE_SELECTOR_URL = PROFILE_SELECTOR_URL;
window.PROFILE_FORCE_PARAM = PROFILE_FORCE_PARAM;
window.normalizeProfileType = normalizeProfileType;
window.getActiveProfileType = getActiveProfileType;
window.hasExplicitActiveProfile = hasExplicitActiveProfile;
window.countLinkedProfileRoles = countLinkedProfileRoles;
window.hasMultipleProfileRoles = hasMultipleProfileRoles;
window.getProfileRoleBadge = getProfileRoleBadge;
window.setActiveProfileType = setActiveProfileType;
window.getProfileHomeUrl = getProfileHomeUrl;
window.redirectToActiveProfileHome = redirectToActiveProfileHome;
window.isForceProfileSelect = isForceProfileSelect;
window.getProfileSelectorUrl = getProfileSelectorUrl;
window.shouldShowProfileSelector = shouldShowProfileSelector;
window.enforceProfileGuard = enforceProfileGuard;
window.enforceProfileGuardAny = enforceProfileGuardAny;
window.selectProfileAndGo = selectProfileAndGo;
window.buildProfileEntryOptions = buildProfileEntryOptions;
window.applyAffiliationToSession = applyAffiliationToSession;
window.getPostLoginReturnTo = getPostLoginReturnTo;
window.redirectAfterAffiliationSelection = redirectAfterAffiliationSelection;
window.selectAffiliationAndGo = selectAffiliationAndGo;
window.routeAfterLogin = routeAfterLogin;
window.redirectAfterLogin = redirectAfterLogin;
window.profileTypeFromIntent = profileTypeFromIntent;
window.getProfileHintFromUrl = getProfileHintFromUrl;