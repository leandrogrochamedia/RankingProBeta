// ============================================================
// Ranking Pro — Registro central de fluxos por persona
// ============================================================
// Fonte única para rotas, intents e entry points.
// Shark Mode Onda 1: marketplace/contratação removidos do dock público do estabelecimento.
// ============================================================

const PERSONA_FLOWS = {
  public: {
    label: 'Visitante',
    entry: './index.html',
    routes: {
      qr: './index.html',
      search: './cliente.html',
      login: './login.html'
    }
  },
  client: {
    type: 'client',
    role: 'cliente',
    icon: '👤',
    label: 'Cliente',
    intents: ['cliente', 'client'],
    homeLinked: './cliente.html',
    homeUnlinked: './selecionar-cliente.html',
    onboarding: './cadastro-cliente.html',
    guards: ['cliente.html', 'favoritos.html', 'minhas-avaliacoes.html'],
    dock: ['cliente.html', 'favoritos.html', 'perfil-page.html']
  },
  professional: {
    type: 'professional',
    role: 'profissional',
    icon: '💼',
    label: 'Profissional',
    intents: ['professional', 'profissional', 'onboarding-profissional'],
    homeLinked: './dashboard-profissional.html',
    homeUnlinked: './selecionar-profissional.html',
    onboarding: './onboarding-profissional.html',
    guards: ['dashboard-profissional.html', 'profissional.html'],
    dock: ['dashboard-profissional.html', 'minhas-avaliacoes.html', 'cliente.html']
  },
  establishment: {
    type: 'establishment',
    role: 'estabelecimento',
    icon: '🏢',
    label: 'Estabelecimento',
    intents: ['establishment', 'estabelecimento', 'onboarding-estabelecimento'],
    homeLinked: './dashboard-estabelecimento.html',
    homeUnlinked: './selecionar-estabelecimento.html',
    onboarding: './onboarding-estabelecimento.html',
    /** Marketplace — DEV only quando SHARK_MODE ativo */
    marketplace: './estabelecimento-marketplace.html',
    /** Shark: só dashboard (marketplace fora dos guards públicos) */
    guardsShark: ['dashboard-estabelecimento.html'],
    guards: ['dashboard-estabelecimento.html', 'estabelecimento-marketplace.html'],
    dockShark: ['dashboard-estabelecimento.html', 'minhas-avaliacoes.html', 'dashboard-estabelecimento.html'],
    dock: ['dashboard-estabelecimento.html', 'estabelecimento-marketplace.html', 'favoritos.html']
  }
};

const LEGACY_REDIRECTS = {
  'contratar.html': './estabelecimento-marketplace.html',
  'profissional.html': './login.html?intent=professional',
  'estabelecimento.html': './login.html?intent=establishment',
  'cliente-home.html': './cliente.html',
  'index copy.html': './index.html'
};

/** Shark Onda 1 — redirecionamentos de páginas legadas congeladas */
const SHARK_LEGACY_REDIRECTS = {
  'contratar.html': './dashboard-estabelecimento.html',
  'estabelecimento-marketplace.html': './dashboard-estabelecimento.html',
  'relatorio-contratante.html': './dashboard-estabelecimento.html'
};

function isSharkModeActive() {
  return typeof isSharkMode === 'function' ? isSharkMode() : (typeof SHARK_MODE !== 'undefined' && !!SHARK_MODE);
}

function isSharkPublicUI() {
  return isSharkModeActive() && !(typeof isSharkDevAccess === 'function' && isSharkDevAccess());
}

function getLegacyRedirect(page) {
  const base = String(page || '').split('?')[0].replace('./', '');
  if (isSharkPublicUI() && SHARK_LEGACY_REDIRECTS[base]) {
    return SHARK_LEGACY_REDIRECTS[base];
  }
  return LEGACY_REDIRECTS[base] || null;
}

function getEstablishmentDock() {
  const flow = PERSONA_FLOWS.establishment;
  if (isSharkPublicUI()) return flow.dockShark;
  return flow.dock;
}

function getEstablishmentGuards() {
  const flow = PERSONA_FLOWS.establishment;
  if (isSharkPublicUI()) return flow.guardsShark;
  return flow.guards;
}

function getPersonaFlow(type) {
  const key = type === 'client' || type === 'cliente' ? 'client'
    : type === 'professional' || type === 'profissional' ? 'professional'
    : type === 'establishment' || type === 'estabelecimento' ? 'establishment'
    : type;
  return PERSONA_FLOWS[key] || null;
}

function resolvePersonaHome(type, session) {
  const flow = getPersonaFlow(type);
  if (!flow) return './selecionar-perfil.html';
  const s = session || {};
  switch (flow.type) {
    case 'client':
      return (s.clientId) ? flow.homeLinked : flow.homeUnlinked;
    case 'professional':
      return s.professionalId ? flow.homeLinked : flow.homeUnlinked;
    case 'establishment':
      return s.establishmentId ? flow.homeLinked : flow.homeUnlinked;
    default:
      return './selecionar-perfil.html';
  }
}

function intentToPersonaType(intent) {
  if (!intent) return null;
  if (intent === 'onboarding-profissional') return 'professional';
  if (intent === 'onboarding-estabelecimento') return 'establishment';
  for (const flow of Object.values(PERSONA_FLOWS)) {
    if (flow.intents && flow.intents.includes(intent)) return flow.type;
  }
  return null;
}

function resolveOnboardingUrl(intent) {
  if (intent === 'onboarding-profissional') return './onboarding-profissional.html';
  if (intent === 'onboarding-estabelecimento') return './onboarding-estabelecimento.html';
  return null;
}

window.PERSONA_FLOWS = PERSONA_FLOWS;
window.LEGACY_REDIRECTS = LEGACY_REDIRECTS;
window.SHARK_LEGACY_REDIRECTS = SHARK_LEGACY_REDIRECTS;
window.getPersonaFlow = getPersonaFlow;
window.resolvePersonaHome = resolvePersonaHome;
window.intentToPersonaType = intentToPersonaType;
window.resolveOnboardingUrl = resolveOnboardingUrl;
window.getLegacyRedirect = getLegacyRedirect;
window.getEstablishmentDock = getEstablishmentDock;
window.getEstablishmentGuards = getEstablishmentGuards;
window.isSharkPublicUI = isSharkPublicUI;