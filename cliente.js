// =====================================================
// PROOFLY - Página Cliente (busca + perfil + pills)
// =====================================================

(function() {
'use strict';

// Uso livre — login e perfil só quando a ação exigir (avaliar, dashboard, etc.)

// ========================================
// VARIÁVEIS GLOBAIS
// ========================================
let paginaProf = 0;
let totalProf = 0;
let listandoProf = false;
let termoProfAtual = '';
let isShowingProfResults = false;

let paginaEst = 0;
let totalEst = 0;
let listandoEst = false;
let termoEstAtual = '';
let isShowingEstResults = false;

let drawerAberto = false;
let drawerTipo = null;
let drawerId = null;

let avaliacaoProfId = null;
let avaliacaoRating = 0;

let avaliacaoEstabId = null;
let avaliacaoEstabRating = 0;

let currentPageEstReviews = 0;
const EST_REVIEWS_PER_PAGE = 10;
const LIMITE = 10;

// Estado global de busca
let activeTab = 'profissionais';
let selectedTags = [];
let searchTerm = '';
let activeStyleFiltersProf = [];
let activeStyleFiltersEst = [];
let styleFiltersHydrated = false;
let scrollNavHandler = null;
function isSharkSearchMode() {
  return typeof isSharkMode === 'function' ? isSharkMode() : (typeof SHARK_MODE !== 'undefined' && !!SHARK_MODE);
}

const SORT_OPTIONS_ALL = [
  { id: 'proximity', label: '📍 Proximidade' },
  { id: 'match', label: '🎯 Match' },
  { id: 'name', label: '🔤 Alfabético' },
  { id: 'qualification', label: '⭐ Qualificação' }
];

const SORT_OPTIONS = isSharkSearchMode()
  ? SORT_OPTIONS_ALL.filter(o => o.id === 'proximity' || o.id === 'name')
  : SORT_OPTIONS_ALL;

let activeSortFiltersProf = isSharkSearchMode() ? ['proximity'] : ['proximity', 'match'];
let activeSortFiltersEst = isSharkSearchMode() ? ['proximity'] : ['proximity', 'match'];

function resolveActiveTab() {
  const estPanel = document.getElementById('panel-est');
  if (estPanel?.classList.contains('active')) return 'estabelecimentos';
  return 'profissionais';
}

function syncSearchState() {
  activeTab = resolveActiveTab();
  if (activeTab === 'profissionais') {
    searchTerm = DOM.profInput ? DOM.profInput.value.trim() : '';
    selectedTags = [...activeStyleFiltersProf];
  } else {
    searchTerm = DOM.estInput ? DOM.estInput.value.trim() : '';
    selectedTags = [...activeStyleFiltersEst];
  }
}

function handleSearchProf(options = {}) {
  activeTab = 'profissionais';
  syncSearchState();
  buscarProfissionais(0, options);
}

function handleSearchEst(options = {}) {
  activeTab = 'estabelecimentos';
  syncSearchState();
  buscarEstabelecimentos(0, options);
}

function handleSearch(options = {}) {
  syncSearchState();
  if (activeTab === 'profissionais') {
    buscarProfissionais(0, options);
  } else {
    buscarEstabelecimentos(0, options);
  }
}
window.handleSearch = handleSearch;
window.handleSearchProf = handleSearchProf;
window.handleSearchEst = handleSearchEst;

const PROF_TAG_COLUMNS = ['music_tags', 'visual_tags', 'personality_tags', 'lifestyle_tags', 'work_tags'];
const EST_TAG_COLUMNS = ['infra_tags', 'music_tags', 'positioning_tags', 'audience_tags', 'vibe_tags'];
const PROF_TEXT_COLUMNS = ['name', 'specialty'];
const EST_TEXT_COLUMNS = ['name'];
const PROF_SEARCH_FIELDS = [
  'name', 'specialty', 'profile.specialty', 'previous_workplaces',
  'current_establishment.name', 'current_establishment.city', 'current_establishment.neighborhood'
];
const EST_SEARCH_FIELDS = ['name', 'type', 'city', 'neighborhood', 'target_audience'];

function getMatchTagsProf() {
  if (styleFiltersHydrated) return activeStyleFiltersProf;
  return typeof getEffectiveClientTags === 'function'
    ? getEffectiveClientTags('prof', activeStyleFiltersProf)
    : activeStyleFiltersProf;
}

function getMatchTagsEst() {
  if (styleFiltersHydrated) return activeStyleFiltersEst;
  return typeof getEffectiveClientTags === 'function'
    ? getEffectiveClientTags('est', activeStyleFiltersEst)
    : activeStyleFiltersEst;
}

function hydrateStyleFiltersFromPrefs() {
  const prefs = typeof getStoredClientPrefs === 'function' ? getStoredClientPrefs() : null;
  if (!prefs?.onboardingDone) return;
  activeStyleFiltersProf = [...(prefs.profTags || [])];
  activeStyleFiltersEst = [...(prefs.estTags || [])];
  styleFiltersHydrated = true;
  renderTinderFilters('prof');
  renderTinderFilters('est');
  renderPillsProf();
  renderPillsEst();
}

function isClienteResultsActive() {
  return isShowingProfResults || isShowingEstResults;
}

function getClienteSearchTopElement() {
  return document.getElementById('clienteSearchTopZone')
    || document.getElementById('clienteAvalieHome')
    || document.getElementById('glassDiscoveryShell')
    || document.getElementById('clienteHeroHeader');
}

function ensureStyleFiltersSession() {
  if (styleFiltersHydrated) return;
  const prefs = typeof getStoredClientPrefs === 'function' ? getStoredClientPrefs() : null;
  if (prefs?.onboardingDone) {
    activeStyleFiltersProf = [...(prefs.profTags || [])];
    activeStyleFiltersEst = [...(prefs.estTags || [])];
  }
  styleFiltersHydrated = true;
}

function scrollToActiveResults() {
  const isProf = activeTab === 'profissionais';
  const target = document.getElementById(isProf ? 'profissionaisList' : 'estabelecimentosList')
    || document.getElementById(isProf ? 'panel-prof' : 'panel-est');
  if (!target) return;
  requestAnimationFrame(() => {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(syncDockBackButton, 420);
  });
}

window.scrollToSearchTop = function() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(syncDockBackButton, 420);
};

function updateDockBackButtonState(mode) {
  const btn = document.getElementById('dockBackToSearch');
  if (!btn) return;
  btn.classList.remove('is-hidden', 'is-dimmed');
  btn.removeAttribute('aria-hidden');
  btn.removeAttribute('aria-disabled');

  if (mode === 'hidden') {
    btn.classList.add('is-hidden');
    btn.setAttribute('aria-hidden', 'true');
    btn.tabIndex = -1;
    return;
  }

  btn.tabIndex = 0;
  if (mode === 'dimmed') {
    btn.classList.add('is-dimmed');
    btn.setAttribute('aria-disabled', 'true');
  }
}

function syncDockBackButton() {
  if (!isClienteResultsActive()) {
    updateDockBackButtonState('hidden');
    return;
  }
  const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
  if (scrollTop <= 20) {
    updateDockBackButtonState('dimmed');
    return;
  }
  updateDockBackButtonState('active');
}

function initClienteScrollNav() {
  if (scrollNavHandler) {
    window.removeEventListener('scroll', scrollNavHandler);
  }
  scrollNavHandler = () => syncDockBackButton();
  window.addEventListener('scroll', scrollNavHandler, { passive: true });
  syncDockBackButton();
}

function initClienteSwipeGuard() {
  if (typeof initMobileSwipeGuard === 'function') initMobileSwipeGuard();
}

function getUserPrefsProf() {
  return typeof buildUserPrefsFromTags === 'function'
    ? buildUserPrefsFromTags(getMatchTagsProf(), 'prof')
    : { music: [], visual: [], personality: [], lifestyle: [], work: [], location: null, price: null };
}

function getUserPrefsEst() {
  return typeof buildUserPrefsFromTags === 'function'
    ? buildUserPrefsFromTags(getMatchTagsEst(), 'est')
    : { infra: [], music: [], positioning: [], audience: [], vibe: [] };
}

function renderSortToolbar(type) {
  const container = document.getElementById(type === 'prof' ? 'sortToolbarProf' : 'sortToolbarEst');
  if (!container) return;

  const activeList = type === 'prof' ? activeSortFiltersProf : activeSortFiltersEst;
  const hintFn = typeof formatSortHint === 'function' ? formatSortHint : () => '';

  container.innerHTML = `
    <span class="filter-row-label">Ordenar por <span style="font-weight:400;text-transform:none;">(combine 2 ou 3)</span></span>
    <div class="sort-pills">
      ${SORT_OPTIONS.map(opt => {
        const active = activeList.includes(opt.id) ? ' active' : '';
        return `<button type="button" class="pill sort-pill${active}" data-sort="${opt.id}">${opt.label}</button>`;
      }).join('')}
    </div>
    <span class="sort-hint">${activeList.length ? `Ordem: ${hintFn(activeList)}` : ''}</span>
  `;

  container.querySelectorAll('button.sort-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      if (type === 'prof') toggleSortFilterProf(btn.dataset.sort);
      else toggleSortFilterEst(btn.dataset.sort);
    });
  });
}

function renderAllSortToolbars() {
  renderSortToolbar('prof');
  renderSortToolbar('est');
}

function updateClientLocationUI(loc) {
  const isAvalie = document.body.classList.contains('cliente-page--avalie');
  const chip = document.getElementById('clientLocationChip');

  if (isAvalie) {
    if (chip) chip.style.display = 'none';
    return;
  }

  if (!chip) return;
  if (loc?.lat != null) {
    chip.style.display = 'inline-flex';
    chip.innerHTML = '<span class="client-location-icon">📍</span><span>Perto de você</span>';
    chip.title = 'Ordenando resultados por proximidade';
  } else {
    chip.style.display = 'none';
    chip.title = '';
  }
}

function initClientLocationFlow() {
  if (typeof detectClientLocation !== 'function') return;
  detectClientLocation().then(loc => {
    updateClientLocationUI(loc);
    if (!loc?.lat) return;
    if (isShowingProfResults) refreshProfResults();
    if (isShowingEstResults) refreshEstResults();
  });
}

window.retryClientLocation = function() {
  if (typeof detectClientLocation !== 'function') return;
  detectClientLocation({ force: true }).then(loc => {
    updateClientLocationUI(loc);
    if (!loc?.lat) return;
    if (isShowingProfResults) refreshProfResults();
    if (isShowingEstResults) refreshEstResults();
  });
};

function toggleSortFilterProf(sortMode) {
  const idx = activeSortFiltersProf.indexOf(sortMode);
  if (idx !== -1) {
    if (activeSortFiltersProf.length === 1) return;
    activeSortFiltersProf.splice(idx, 1);
  } else {
    activeSortFiltersProf.push(sortMode);
  }
  renderSortToolbar('prof');
  refreshProfResults();
}

function toggleSortFilterEst(sortMode) {
  const idx = activeSortFiltersEst.indexOf(sortMode);
  if (idx !== -1) {
    if (activeSortFiltersEst.length === 1) return;
    activeSortFiltersEst.splice(idx, 1);
  } else {
    activeSortFiltersEst.push(sortMode);
  }
  renderSortToolbar('est');
  refreshEstResults();
}

function refreshProfResults() {
  if (!isShowingProfResults) return;
  if (listandoProf && !termoProfAtual && !activeStyleFiltersProf.length) {
    fetchProfissionais(paginaProf, { listAll: true });
  } else if (termoProfAtual || activeStyleFiltersProf.length) {
    fetchProfissionais(paginaProf, { textTerm: termoProfAtual, tags: activeStyleFiltersProf });
  } else {
    fetchProfissionais(paginaProf, { listAll: true });
  }
}

function refreshEstResults() {
  if (!isShowingEstResults) return;
  if (listandoEst && !termoEstAtual && !activeStyleFiltersEst.length) {
    fetchEstabelecimentos(paginaEst, { listAll: true });
  } else if (termoEstAtual || activeStyleFiltersEst.length) {
    fetchEstabelecimentos(paginaEst, { textTerm: termoEstAtual, tags: activeStyleFiltersEst });
  } else {
    fetchEstabelecimentos(paginaEst, { listAll: true });
  }
}

function shouldScrollToResults(options = {}) {
  return options.scrollToResults === true;
}

// ========================================
// POSTGREST — MONTAGEM DE QUERY (sem PGRST)
// ========================================
function pgSanitizeTerm(term) {
  return term.replace(/[%_*\\]/g, '').trim();
}

function pgIlikePattern(term) {
  return `*${pgSanitizeTerm(term)}*`;
}

function pgArrayCsValue(tag) {
  if (/[\s,}"\\]/.test(tag)) {
    return `{"${tag.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"}`;
  }
  return `{${tag}}`;
}

function buildPostgrestFilter(textTerm, tags, textColumns, tagColumns, skipTextFilter = false) {
  const groups = [];

  if (!skipTextFilter && textTerm && textTerm.length >= 2) {
    const pattern = pgIlikePattern(textTerm);
    groups.push(textColumns.map(col => `${col}.ilike.${pattern}`));
  }

  if (tags && tags.length) {
    tags.forEach(tag => {
      const cs = pgArrayCsValue(tag);
      groups.push(tagColumns.map(col => `${col}.cs.${cs}`));
    });
  }

  if (!groups.length) return null;
  if (groups.length === 1) {
    return { key: 'or', value: `(${groups[0].join(',')})` };
  }
  const andParts = groups.map(parts => `or(${parts.join(',')})`).join(',');
  return { key: 'and', value: `(${andParts})` };
}

async function fetchCount(table, params) {
  const countParams = new URLSearchParams(params.toString());
  countParams.set('select', 'id');
  countParams.delete('limit');
  countParams.delete('offset');
  const resp = await fetch(SUPABASE_URL + `/rest/v1/${table}?` + countParams.toString(), {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: 'Bearer ' + SUPABASE_KEY,
      Prefer: 'count=exact'
    }
  });
  const range = resp.headers.get('content-range');
  return parseInt(range?.split('/')[1]) || 0;
}

// ========================================
// DOM REFS
// ========================================
const DOM = {
  profInput: document.getElementById('searchProfInput'),
  profList: document.getElementById('profissionaisList'),
  profPagination: document.getElementById('profissionaisPagination'),
  btnListarProf: document.getElementById('btnListarProf'),
  estInput: document.getElementById('searchEstabInput'),
  estList: document.getElementById('estabelecimentosList'),
  estPagination: document.getElementById('estabelecimentosPagination'),
  btnListarEst: document.getElementById('btnListarEst'),
  drawer: document.getElementById('drawer'),
  drawerOverlay: document.getElementById('drawerOverlay'),
  drawerBody: document.getElementById('drawerBody'),
  drawerActions: document.getElementById('drawerActions'),
  selectedPillsProf: document.getElementById('selectedPillsProf'),
  selectedPillsEst: document.getElementById('selectedPillsEst'),
  recoTrackProf: document.getElementById('recoTrackProf'),
  recoTrackEst: document.getElementById('recoTrackEst'),
  recoWrapProf: document.getElementById('recoWrapProf'),
  recoWrapEst: document.getElementById('recoWrapEst'),
};

const RECO_LIMIT = 12;
const RECO_FETCH_POOL = 28;

const CLIENTE_VIEW_MODE_KEY = 'proofly_cliente_view';
const CLIENTE_VIEW_MODES = ['lista', 'grade', 'cards'];
let clienteListViewMode = 'cards';
let lastProfPageData = null;
let lastProfPage = 0;
let lastEstPageData = null;
let lastEstPage = 0;

// ========================================
// HELPERS DE UI
// ========================================
function emptyStateHTML(icon, title, desc, ctaHtml) {
  return `<div class="empty-state">
    <div class="empty-state-icon">${icon}</div>
    <p class="empty-state-title">${title}</p>
    <p class="empty-state-desc">${desc}</p>
    ${ctaHtml || ''}
  </div>`;
}

function emptyStateProfHTML() {
  const prefs = typeof getStoredClientPrefs === 'function' ? getStoredClientPrefs() : { onboardingDone: false };
  if (prefs.onboardingDone && (prefs.profTags?.length || prefs.estTags?.length)) {
    return emptyStateHTML('✨', 'Pronto para encontrar seu match', 'Toque em "Listar todos" ou refine com os filtros abaixo.');
  }
  return emptyStateHTML(
    '🎯',
    'Defina seu estilo em 15 segundos',
    'O Ranking Pro personaliza compatibilidade, ordenação e destaques com base no que combina com você.',
    '<button type="button" class="empty-state-cta" onclick="abrirOnboardingEstilo(true)">✨ Começar agora</button>'
  );
}

function emptyStateEstHTML() {
  const prefs = typeof getStoredClientPrefs === 'function' ? getStoredClientPrefs() : { onboardingDone: false };
  if (prefs.onboardingDone) {
    return emptyStateHTML('🏢', 'Explore estabelecimentos', 'Clique em "Listar todos" para ver lugares ordenados pelo seu estilo.');
  }
  return emptyStateHTML(
    '🎯',
    'Seu estilo ainda não está definido',
    'Configure preferências para ver estabelecimentos que combinam com você.',
    '<button type="button" class="empty-state-cta" onclick="abrirOnboardingEstilo(true)">✨ Definir meu estilo</button>'
  );
}

const ONBOARDING_PROF_PICKS = [
  'Hip Hop', 'Comunicativo', 'Moderno', 'Premium', 'Extrovertido',
  'Despojado', 'Experiente', 'MPB', 'Detalhista', 'Criativo', 'Casual', 'Noturno'
];
const ONBOARDING_EST_PICKS = [
  'Descontraído', 'Premium', 'Família', 'Animado', 'Acolhedor', 'Wi-Fi', 'Moderno', 'Todos'
];

let onboardingProfSelection = [];
let onboardingEstSelection = [];

function renderStyleBar() {
  const bar = document.getElementById('clientStyleBar');
  const chipsEl = document.getElementById('clientStyleChips');
  if (!bar || !chipsEl || typeof getStoredClientPrefs !== 'function') return;

  const prefs = getStoredClientPrefs();
  const all = [...(prefs.profTags || []), ...(prefs.estTags || [])];
  const unique = [...new Set(all)];
  const isAvalie = isClienteLogadoEntry();

  if (!prefs.onboardingDone || !unique.length) {
    bar.style.display = 'none';
    bar.classList.remove('is-active');
    return;
  }

  chipsEl.innerHTML = unique.map(t =>
    `<span class="client-style-chip">${typeof renderTagWithEmoji === 'function' ? renderTagWithEmoji(t) : t}</span>`
  ).join('');
  bar.style.display = 'block';
  bar.classList.add('is-active');

  const heroP = document.querySelector('.cliente-hero-text p');
  if (heroP && !isAvalie) {
    heroP.textContent = `Resultados personalizados para ${unique.slice(0, 3).join(', ')}${unique.length > 3 ? '…' : ''}.`;
  }
}

function renderOnboardingChips() {
  const profEl = document.getElementById('onboardingProfChips');
  const estEl = document.getElementById('onboardingEstChips');
  if (!profEl || !estEl) return;

  profEl.innerHTML = ONBOARDING_PROF_PICKS.map(tag => {
    const active = onboardingProfSelection.includes(tag) ? ' active' : '';
    return `<button type="button" class="style-onboarding-chip${active}" data-type="prof" data-tag="${tag}" onclick="toggleOnboardingChip('prof','${tag.replace(/'/g, "\\'")}',this)">${typeof renderTagWithEmoji === 'function' ? renderTagWithEmoji(tag) : tag}</button>`;
  }).join('');

  estEl.innerHTML = ONBOARDING_EST_PICKS.map(tag => {
    const active = onboardingEstSelection.includes(tag) ? ' active' : '';
    return `<button type="button" class="style-onboarding-chip${active}" data-type="est" data-tag="${tag}" onclick="toggleOnboardingChip('est','${tag.replace(/'/g, "\\'")}',this)">${typeof renderTagWithEmoji === 'function' ? renderTagWithEmoji(tag) : tag}</button>`;
  }).join('');

  updateOnboardingHint();
}

function updateOnboardingHint() {
  const hint = document.getElementById('onboardingSelectionHint');
  if (!hint) return;
  const total = onboardingProfSelection.length + onboardingEstSelection.length;
  hint.textContent = `${onboardingProfSelection.length} profissional · ${onboardingEstSelection.length} lugares (${total} no total)`;
  const btn = document.getElementById('btnSalvarEstilo');
  if (btn) btn.disabled = onboardingProfSelection.length === 0;
}

window.toggleOnboardingChip = function(type, tag, el) {
  const list = type === 'prof' ? onboardingProfSelection : onboardingEstSelection;
  const max = type === 'prof' ? 5 : 3;
  const idx = list.indexOf(tag);
  if (idx >= 0) {
    list.splice(idx, 1);
    el.classList.remove('active');
  } else {
    if (list.length >= max) {
      if (typeof showAlert === 'function') showAlert('⚠️ Limite', `Máximo de ${max} tags para ${type === 'prof' ? 'profissionais' : 'lugares'}.`);
      return;
    }
    list.push(tag);
    el.classList.add('active');
  }
  updateOnboardingHint();
};

window.abrirOnboardingEstilo = function() {
  const prefs = typeof getStoredClientPrefs === 'function' ? getStoredClientPrefs() : {};
  onboardingProfSelection = [...(prefs.profTags || [])];
  onboardingEstSelection = [...(prefs.estTags || [])];
  renderOnboardingChips();
  const modal = document.getElementById('styleOnboardingModal');
  if (modal) modal.style.display = 'flex';
};

window.fecharOnboardingEstilo = function() {
  const modal = document.getElementById('styleOnboardingModal');
  if (modal) modal.style.display = 'none';
};

window.pularOnboardingEstilo = function() {
  fecharOnboardingEstilo();
};

window.salvarOnboardingEstilo = function() {
  if (!onboardingProfSelection.length) {
    if (typeof showAlert === 'function') showAlert('⚠️', 'Escolha pelo menos 1 preferência de profissional.');
    return;
  }
  if (typeof setStoredClientPrefs === 'function') {
    setStoredClientPrefs({
      onboardingDone: true,
      profTags: onboardingProfSelection,
      estTags: onboardingEstSelection
    });
  }
  const sess = getSession();
  const clientId = typeof getClientId === 'function' ? getClientId(sess) : sess?.clientId;
  const clientApi = typeof CLIENT_PROFILES_API !== 'undefined' ? CLIENT_PROFILES_API : '/rest/v1/client_profiles';
  if (clientId && typeof fetchAPI === 'function') {
    fetchAPI(`${clientApi}?id=eq.${clientId}`, 'PATCH', {
      prof_style_tags: onboardingProfSelection,
      est_style_tags: onboardingEstSelection
    }).catch(e => console.warn('Prefs não salvas no cliente:', e.message));
  }
  fecharOnboardingEstilo();
  hydrateStyleFiltersFromPrefs();
  renderStyleBar();
  if (typeof showUserMessage === 'function') {
    showUserMessage('🎯 Estilo salvo! Atualizando recomendações para você.');
  }
  loadRecommendations();
};

async function hydrateClientFromUser() {
  const sess = getSession();
  if (!sess?.userId || (typeof getClientId === 'function' ? getClientId(sess) : sess.clientId)) return;
  if (typeof fetchUserById !== 'function' || typeof buildSessionFromUser !== 'function') return;
  try {
    const user = await fetchUserById(sess.userId);
    if (user?.client_id) setSession(buildSessionFromUser(user, sess));
  } catch (e) {
    console.warn('Hydrate client_id:', e.message);
  }
}

async function loadClientPrefsFromSession() {
  await hydrateClientFromUser();
  const sess = getSession();
  const clientId = typeof getClientId === 'function' ? getClientId(sess) : sess?.clientId;
  const clientApi = typeof CLIENT_PROFILES_API !== 'undefined' ? CLIENT_PROFILES_API : '/rest/v1/client_profiles';
  if (!clientId || typeof fetchAPI !== 'function') {
    hydrateStyleFiltersFromPrefs();
    return;
  }
  try {
    const data = await fetchAPI(`${clientApi}?id=eq.${clientId}&select=prof_style_tags,est_style_tags,name`);
    if (data?.[0] && typeof syncClientPrefsFromRecord === 'function') {
      syncClientPrefsFromRecord(data[0]);
    }
  } catch (e) {
    console.warn('Não foi possível carregar prefs do cliente:', e.message);
  }
  hydrateStyleFiltersFromPrefs();
}

function isClienteLogadoEntry() {
  const session = typeof getSession === 'function' ? getSession() : null;
  return !!(session?.userId
    && typeof getActiveProfileType === 'function'
    && getActiveProfileType(session) === 'client');
}

async function fetchAvalieSocialStats() {
  let totalReviews = 0;
  let monthReviews = 0;
  if (typeof fetchCount !== 'function') return { totalReviews, monthReviews };

  try {
    totalReviews = await fetchCount('reviews', new URLSearchParams());
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    monthReviews = await fetchCount('reviews', new URLSearchParams({
      created_at: `gte.${monthStart}`
    }));
  } catch (e) {
    console.warn('Stats de avaliações:', e.message);
  }
  return { totalReviews, monthReviews };
}

async function renderAvalieClientChip() {
  if (!isClienteLogadoEntry()) return;

  const session = typeof getSession === 'function' ? getSession() : null;
  const esc = typeof escapeHtml === 'function' ? escapeHtml : (s) => String(s || '');
  const chip = document.getElementById('avalieClientChip');
  const tooltipEl = document.getElementById('avalieClientTooltip');
  const avatarImg = document.getElementById('avalieClientAvatarImg');
  const avatarFallback = document.getElementById('avalieClientAvatarFallback');

  const displayName = session?.name || 'Cliente';
  if (chip) {
    chip.setAttribute('aria-label', `Seu perfil — ${displayName}`);
    chip.href = './meu-perfil.html';
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
      avatarImg.onerror = () => {
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

async function renderClientePremiumHome() {
  await renderAvalieClientChip();
}

function openDiscoverySearchPanel() {
  const btn = document.getElementById('toggleDiscoverySearch');
  const panel = document.getElementById('glassDiscoveryShell');
  if (!panel) return;
  panel.classList.add('is-open');
  if (btn) {
    btn.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
  }
}

window.focusAvalieSearch = function(target) {
  const tab = target === 'est' ? 'est' : 'prof';
  openDiscoverySearchPanel();
  switchTab(tab);
  const shell = document.getElementById('glassDiscoveryShell');
  if (shell) shell.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const input = tab === 'est'
    ? document.getElementById('searchEstabInput')
    : document.getElementById('searchProfInput');
  if (input) setTimeout(() => input.focus(), 450);
};

function initAvaliePanelToggle(btnId, panelId) {
  const btn = document.getElementById(btnId);
  const panel = document.getElementById(panelId);
  if (!btn || !panel) return;
  btn.hidden = false;
  panel.classList.remove('is-open');
  btn.classList.remove('is-open');
  btn.setAttribute('aria-expanded', 'false');
  btn.addEventListener('click', () => {
    const open = panel.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.classList.toggle('is-open', open);
  });
}

function initAdvancedFiltersToggle() {
  if (window._advancedFiltersToggleInit) return;
  window._advancedFiltersToggleInit = true;

  initAvaliePanelToggle('toggleDiscoverySearch', 'glassDiscoveryShell');

  const pairs = [
    ['toggleFiltersProf', 'tinderFiltersProf'],
    ['toggleFiltersEst', 'tinderFiltersEst']
  ];
  pairs.forEach(([btnId, panelId]) => initAvaliePanelToggle(btnId, panelId));
}

function mountAvalieStyleBar() {
  const bar = document.getElementById('clientStyleBar');
  const slot = document.getElementById('clientStyleBarSlot');
  if (!bar || !slot || bar.parentElement === slot) return;
  bar.classList.remove('client-style-bar--in-hero');
  bar.classList.add('client-style-bar--compact');
  slot.appendChild(bar);
}

function isAvalieMode() {
  return document.body.classList.contains('cliente-page--avalie');
}

function isProfSearchActive() {
  return isShowingProfResults
    || !!(DOM.profInput?.value.trim())
    || activeStyleFiltersProf.length > 0;
}

function isEstSearchActive() {
  return isShowingEstResults
    || !!(DOM.estInput?.value.trim())
    || activeStyleFiltersEst.length > 0;
}

function updateSearchCloseVisibility() {
  const closeProf = document.getElementById('btnCloseSearchProf');
  const closeEst = document.getElementById('btnCloseSearchEst');
  if (closeProf) closeProf.hidden = !isAvalieMode() || !isProfSearchActive();
  if (closeEst) closeEst.hidden = !isAvalieMode() || !isEstSearchActive();
}

function clearActiveProfSearch() {
  if (DOM.profInput) DOM.profInput.value = '';
  searchTerm = '';
  activeStyleFiltersProf = [];
  renderTinderFilters('prof');
  renderPillsProf();
  clearProfResults();
  updateSearchCloseVisibility();
}

function clearActiveEstSearch() {
  if (DOM.estInput) DOM.estInput.value = '';
  searchTerm = '';
  activeStyleFiltersEst = [];
  renderTinderFilters('est');
  renderPillsEst();
  clearEstResults();
  updateSearchCloseVisibility();
}

function initAvalieSearchControls() {
  if (!isAvalieMode()) return;

  document.getElementById('avalieHistoricoProf')?.removeAttribute('hidden');
  document.getElementById('avalieHistoricoEst')?.removeAttribute('hidden');

  document.getElementById('btnCloseSearchProf')?.addEventListener('click', clearActiveProfSearch);
  document.getElementById('btnCloseSearchEst')?.addEventListener('click', clearActiveEstSearch);

  DOM.profInput?.addEventListener('input', updateSearchCloseVisibility);
  DOM.estInput?.addEventListener('input', updateSearchCloseVisibility);
  updateSearchCloseVisibility();
}

function initClienteAvalieMode() {
  if (!isClienteLogadoEntry()) return false;

  document.body.classList.add('cliente-page--avalie');
  document.title = '🏆 Ranking Pro — Avaliar';

  const home = document.getElementById('clienteAvalieHome');
  if (home) home.hidden = false;

  const headerLeft = document.getElementById('avalieHeaderLeft');
  if (headerLeft) headerLeft.hidden = false;

  const greeting = document.getElementById('userGreeting');
  if (greeting) greeting.hidden = true;

  mountAvalieStyleBar();
  initAvalieSearchControls();
  initClienteViewModes();
  renderAvalieClientChip();

  return true;
}

async function initClientStyleFlow() {
  await loadClientPrefsFromSession();
  renderStyleBar();
  if (isClienteLogadoEntry()) {
    renderClientePremiumHome();
    return;
  }

  const prefs = typeof getStoredClientPrefs === 'function' ? getStoredClientPrefs() : { onboardingDone: false };
  const urlParams = new URLSearchParams(window.location.search);
  const hasDrawer = urlParams.get('professionalId') || urlParams.get('establishmentId');

  if (!hasDrawer && !prefs.onboardingDone) {
    setTimeout(() => abrirOnboardingEstilo(), 700);
  }
}

function enrichRecoItem(item, type) {
  const isProf = type === 'prof';
  const insight = typeof buildMatchInsight === 'function'
    ? buildMatchInsight(item, isProf ? 'prof' : 'est', isProf ? getMatchTagsProf() : getMatchTagsEst())
    : null;
  const enriched = typeof enrichProfWithTalentMetrics === 'function' && isProf
    ? enrichProfWithTalentMetrics(item)
    : item;
  return {
    ...enriched,
    _prooflyScore: typeof calcularProoflyScoreRapido === 'function'
      ? calcularProoflyScoreRapido(enriched, isProf ? 'prof' : 'est')
      : null,
    _matchPercent: insight?.percent ?? enriched._matchPercent,
    _matchInsight: insight
  };
}

function rankTopRecommendations(items, type) {
  const isProf = type === 'prof';
  let list = (items || []).map(item => enrichRecoItem(item, type));
  const prefs = isProf ? getUserPrefsProf() : getUserPrefsEst();
  const userLoc = typeof getStoredClientLocation === 'function' ? getStoredClientLocation() : null;

  if (typeof aplicarOrdenacao === 'function') {
    const sortKeys = isSharkSearchMode() ? ['proximity', 'name'] : ['match', 'qualification'];
    list = aplicarOrdenacao(list, sortKeys, prefs, isProf ? 'prof' : 'est');
  } else {
    list.sort((a, b) =>
      (Number(b.avg_rating) || 0) - (Number(a.avg_rating) || 0)
      || (Number(b.total_reviews) || 0) - (Number(a.total_reviews) || 0)
    );
  }

  if (userLoc && typeof anexarDistancias === 'function') {
    list = anexarDistancias(list, userLoc, isProf ? 'prof' : 'est')
      .sort((a, b) => {
        const scoreDiff = (Number(b._matchScore) || 0) - (Number(a._matchScore) || 0);
        if (scoreDiff !== 0) return scoreDiff;
        const da = a._distanceKm;
        const db = b._distanceKm;
        if (da == null && db == null) return 0;
        if (da == null) return 1;
        if (db == null) return -1;
        return da - db;
      });
  }

  return list.slice(0, RECO_LIMIT);
}

function renderRecoTrack(trackEl, items, type) {
  if (!trackEl) return;
  if (!items.length) {
    trackEl.innerHTML = '<div class="reco-carousel-empty">Nenhuma recomendação no momento.</div>';
    return;
  }
  if (typeof ProfileCard === 'undefined' || typeof ProfileCard.renderMiniRecoCard !== 'function') {
    trackEl.innerHTML = '<div class="reco-carousel-empty">Carregue os cards para ver recomendações.</div>';
    return;
  }
  trackEl.innerHTML = items.map(item => ProfileCard.renderMiniRecoCard(item, type)).join('');
}

async function fetchTopProfessionals() {
  const select = 'id,name,specialty,avatar_url,avg_rating,total_reviews,profile:professional_profiles(specialty),current_establishment:establishments!professionals_current_establishment_id_fkey(id,name,city,neighborhood)';
  const params = new URLSearchParams();
  params.append('select', select);
  params.append('order', 'avg_rating.desc,total_reviews.desc');
  params.append('limit', String(RECO_FETCH_POOL));
  let data;
  try {
    params.set('is_active', 'eq.true');
    data = await fetchAPI(`/rest/v1/professionals?${params.toString()}`);
  } catch {
    params.delete('is_active');
    data = await fetchAPI(`/rest/v1/professionals?${params.toString()}`);
  }
  return rankTopRecommendations(data, 'prof');
}

async function fetchTopEstablishments() {
  const select = 'id,name,type,city,neighborhood,avatar_url,avg_rating,total_reviews';
  const params = new URLSearchParams();
  params.append('select', select);
  params.append('order', 'avg_rating.desc,total_reviews.desc');
  params.append('limit', String(RECO_FETCH_POOL));
  const data = await fetchAPI(`/rest/v1/establishments?${params.toString()}`);
  return rankTopRecommendations(data, 'est');
}

async function loadRecommendations() {
  if (DOM.recoTrackProf) {
    DOM.recoTrackProf.innerHTML = '<div class="reco-carousel-loading">Carregando recomendações...</div>';
  }
  if (DOM.recoTrackEst) {
    DOM.recoTrackEst.innerHTML = '<div class="reco-carousel-loading">Carregando recomendações...</div>';
  }

  try {
    const [profs, ests] = await Promise.all([
      fetchTopProfessionals().catch(() => []),
      fetchTopEstablishments().catch(() => [])
    ]);
    renderRecoTrack(DOM.recoTrackProf, profs, 'prof');
    renderRecoTrack(DOM.recoTrackEst, ests, 'est');
  } catch (e) {
    console.warn('Erro ao carregar recomendações:', e);
    if (DOM.recoTrackProf) {
      DOM.recoTrackProf.innerHTML = '<div class="reco-carousel-empty">Não foi possível carregar agora.</div>';
    }
    if (DOM.recoTrackEst) {
      DOM.recoTrackEst.innerHTML = '<div class="reco-carousel-empty">Não foi possível carregar agora.</div>';
    }
  }
}

function updateRecoVisibility() {
  const isProf = document.getElementById('panel-prof')?.classList.contains('active');
  DOM.recoWrapProf?.classList.toggle('active', !!isProf);
  DOM.recoWrapEst?.classList.toggle('active', !isProf);
}

function initRecoCarouselArrows() {
  document.querySelectorAll('.reco-arrow').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const dir = Number(btn.dataset.dir) || 1;
      const track = document.getElementById(targetId);
      if (!track) return;
      const amount = Math.max(track.clientWidth * 0.75, 200);
      track.scrollBy({ left: dir * amount, behavior: 'smooth' });
    });
  });
}

window.loadRecommendations = loadRecommendations;

function computeDrawerMatchPercent(item, isProf) {
  if (item._matchPercent != null) return item._matchPercent;
  if (typeof calcularMatchScore !== 'function' || typeof calcularMatchScoreEst !== 'function') return null;
  const prefs = isProf ? getUserPrefsProf() : getUserPrefsEst();
  const score = isProf ? calcularMatchScore(prefs, item) : calcularMatchScoreEst(prefs, item);
  return Math.min(100, Math.round(score));
}

function formatReviewForTinder(r, viewContext = {}) {
  if (typeof formatReviewForDisplay === 'function') {
    return formatReviewForDisplay(r, viewContext);
  }
  return {
    rating: r.rating,
    comment: r.comment,
    created_at: r.created_at,
    context: r.context || ''
  };
}

function setDrawerActions(html) {
  if (DOM.drawerActions) DOM.drawerActions.innerHTML = html || '';
}

function tagCategoriesForDrawer(categories, sharedTags) {
  const withTags = (categories || []).filter(c => c.tags?.length);
  if (!withTags.length) {
    return '<div class="tinder-section"><div class="tinder-section-title">Estilo</div><p class="text-glass-muted" style="font-size:14px;">Nenhuma tag cadastrada ainda.</p></div>';
  }
  return ProfileCard.renderTagCategories(withTags, sharedTags);
}

// Configuração completa de filtros estilo Tinder
const FILTER_CONFIG = {
  prof: [
    { label: '🎵 Música', tags: ['Hip Hop', 'Rock', 'Sertanejo', 'Pop', 'MPB', 'Eletrônico', 'Jazz'] },
    { label: '👕 Visual', tags: ['Streetwear', 'Clássico', 'Moderno', 'Tradicional', 'Casual', 'Elegante', 'Despojado'] },
    { label: '🧠 Personalidade', tags: ['Comunicativo', 'Reservado', 'Extrovertido', 'Detalhista', 'Rápido', 'Perfeccionista', 'Criativo'] },
    { label: '🌿 Estilo de Vida', tags: ['Não bebe', 'Bebe socialmente', 'Não fuma', 'Vegano', 'Esportista', 'Noturno'] },
    { label: '💼 Trabalho', tags: ['Especialista', 'Generalista', 'Experiente', 'Premium', 'Popular'] }
  ],
  est: [
    { label: '🏗️ Infraestrutura', tags: ['Wi-Fi', 'Café', 'Bar', 'Ar Condicionado', 'Estacionamento', 'Pet Friendly', 'Acessibilidade', 'TV'] },
    { label: '🎵 Música Ambiente', tags: ['Hip Hop', 'Rock', 'Sertanejo', 'Pop', 'MPB', 'Eletrônico', 'Jazz', 'Reggae'] },
    { label: '💎 Posicionamento', tags: ['Premium', 'Popular', 'Tradicional', 'Moderno', 'Luxo', 'Despojado'] },
    { label: '👥 Público', tags: ['Família', 'Adulto', 'LGBTQIA+', 'Empresarial', 'Infantil', 'Todos'] },
    { label: '✨ Vibe', tags: ['Descontraído', 'Sério', 'Animado', 'Calmo', 'Intimista', 'Acolhedor'] }
  ]
};

function initClienteTabs() {
  document.querySelectorAll('.cliente-tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });
}

function switchTab(target) {
  const isProf = target === 'prof';
  if ((isProf && activeTab === 'profissionais') || (!isProf && activeTab === 'estabelecimentos')) return;

  document.querySelectorAll('.cliente-tab').forEach(t => {
    const active = t.dataset.tab === target;
    t.classList.toggle('active', active);
    t.setAttribute('aria-selected', active ? 'true' : 'false');
  });

  document.querySelectorAll('.cliente-panel').forEach(p => {
    const active = (isProf && p.id === 'panel-prof') || (!isProf && p.id === 'panel-est');
    p.classList.toggle('active', active);
  });

  document.querySelectorAll('.glass-search-zone').forEach(z => {
    const active = (isProf && z.dataset.zone === 'prof') || (!isProf && z.dataset.zone === 'est');
    z.classList.toggle('active', active);
  });

  if (isProf) {
    activeTab = 'profissionais';
    syncSearchState();
    listarTodosProfissionais();
  } else {
    activeTab = 'estabelecimentos';
    syncSearchState();
    listarTodosEstabelecimentos();
  }
  updateRecoVisibility();
}

function resetProfFilters() {
  activeStyleFiltersProf = [];
  activeSortFiltersProf = isSharkSearchMode() ? ['proximity'] : ['proximity', 'match'];
  DOM.profInput.value = '';
  termoProfAtual = '';
  renderTinderFilters('prof');
  renderPillsProf();
  renderSortToolbar('prof');
}

function resetEstFilters() {
  activeStyleFiltersEst = [];
  activeSortFiltersEst = isSharkSearchMode() ? ['proximity'] : ['proximity', 'match'];
  DOM.estInput.value = '';
  termoEstAtual = '';
  renderTinderFilters('est');
  renderPillsEst();
  renderSortToolbar('est');
}

function renderTinderFilters(type) {
  const container = document.getElementById(type === 'prof' ? 'tinderFiltersProf' : 'tinderFiltersEst');
  if (!container) return;

  const config = FILTER_CONFIG[type];
  const activeList = type === 'prof' ? getMatchTagsProf() : getMatchTagsEst();

  container.innerHTML = config.map(group => `
    <div class="filter-row">
      <span class="filter-row-label">${group.label}</span>
      <div class="pills-container">
        ${group.tags.map(tag => {
          const info = TAG_MAP[tag] || { emoji: '🏷️' };
          const active = activeList.includes(tag) ? ' active' : '';
          return `<button type="button" class="pill${active}" data-tag="${escapeHtml(tag)}">${info.emoji} ${escapeHtml(tag)}</button>`;
        }).join('')}
      </div>
    </div>
  `).join('');

  container.querySelectorAll('button.pill').forEach(btn => {
    btn.addEventListener('click', () => {
      if (type === 'prof') toggleStyleFilterProf(btn);
      else toggleStyleFilterEst(btn);
    });
  });
}

function renderAllTinderFilters() {
  renderTinderFilters('prof');
  renderTinderFilters('est');
}

// ========================================
// PILLS (tags selecionadas com botão X)
// ========================================
function renderPillsProf() {
  const container = DOM.selectedPillsProf;
  if (!container) return;
  if (!activeStyleFiltersProf.length) {
    container.innerHTML = '';
    container.classList.remove('has-pills');
    return;
  }
  container.classList.add('has-pills');
  container.innerHTML = activeStyleFiltersProf.map(tag => {
    const info = TAG_MAP[tag] || { emoji: '🏷️' };
    return `<span class="pill pill-selected">${info.emoji} ${escapeHtml(tag)}<button type="button" class="pill-remove" data-tag="${escapeHtml(tag)}" aria-label="Remover">✕</button></span>`;
  }).join('');
  container.querySelectorAll('.pill-remove').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); removeProfFilter(btn.dataset.tag); });
  });
}

function renderPillsEst() {
  const container = DOM.selectedPillsEst;
  if (!container) return;
  if (!activeStyleFiltersEst.length) {
    container.innerHTML = '';
    container.classList.remove('has-pills');
    return;
  }
  container.classList.add('has-pills');
  container.innerHTML = activeStyleFiltersEst.map(tag => {
    const info = TAG_MAP[tag] || { emoji: '🏷️' };
    return `<span class="pill pill-selected">${info.emoji} ${escapeHtml(tag)}<button type="button" class="pill-remove" data-tag="${escapeHtml(tag)}" aria-label="Remover">✕</button></span>`;
  }).join('');
  container.querySelectorAll('.pill-remove').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); removeEstFilter(btn.dataset.tag); });
  });
}

function removeProfFilter(tag) {
  ensureStyleFiltersSession();
  activeStyleFiltersProf = activeStyleFiltersProf.filter(t => t !== tag);
  renderTinderFilters('prof');
  renderPillsProf();
  if (isShowingProfResults) handleSearch();
}

function removeEstFilter(tag) {
  ensureStyleFiltersSession();
  activeStyleFiltersEst = activeStyleFiltersEst.filter(t => t !== tag);
  renderTinderFilters('est');
  renderPillsEst();
  if (isShowingEstResults) handleSearch();
}

function toggleStyleFilterProf(el) {
  ensureStyleFiltersSession();
  const style = el.dataset.tag;
  const idx = activeStyleFiltersProf.indexOf(style);
  if (idx !== -1) activeStyleFiltersProf.splice(idx, 1);
  else activeStyleFiltersProf.push(style);
  listandoProf = false;
  renderTinderFilters('prof');
  renderPillsProf();
  activeTab = 'profissionais';
  syncSearchState();
  handleSearchProf();
}
window.toggleStyleFilterProf = toggleStyleFilterProf;

function toggleStyleFilterEst(el) {
  ensureStyleFiltersSession();
  const style = el.dataset.tag;
  const idx = activeStyleFiltersEst.indexOf(style);
  if (idx !== -1) activeStyleFiltersEst.splice(idx, 1);
  else activeStyleFiltersEst.push(style);
  listandoEst = false;
  renderTinderFilters('est');
  renderPillsEst();
  activeTab = 'estabelecimentos';
  syncSearchState();
  handleSearchEst();
}
window.toggleStyleFilterEst = toggleStyleFilterEst;

// ========================================
// INICIALIZAÇÃO (script carrega após DOM — não usar só DOMContentLoaded)
// ========================================
function initClientePage() {
  if (window._clientePageInit) return;
  window._clientePageInit = true;

  console.log('✅ initClientePage — abas, filtros Tinder, busca');

  DOM.profList.innerHTML = emptyStateProfHTML();
  DOM.estList.innerHTML = emptyStateEstHTML();

  DOM.profInput.addEventListener('input', () => { if (activeTab === 'profissionais') searchTerm = DOM.profInput.value.trim(); });
  DOM.estInput.addEventListener('input', () => { if (activeTab === 'estabelecimentos') searchTerm = DOM.estInput.value.trim(); });
  DOM.profInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); handleSearchProf({ scrollToResults: true }); }
  });
  DOM.estInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); handleSearchEst({ scrollToResults: true }); }
  });
  document.getElementById('btnBuscarProf')?.addEventListener('click', e => {
    e.preventDefault();
    handleSearchProf({ scrollToResults: true });
  });
  document.getElementById('btnBuscarEst')?.addEventListener('click', e => {
    e.preventDefault();
    handleSearchEst({ scrollToResults: true });
  });

  initClienteAvalieMode();
  if (!isAvalieMode()) initClienteViewModes();
  initClienteTabs();
  initAdvancedFiltersToggle();
  initClienteScrollNav();
  initClienteSwipeGuard();
  renderAllTinderFilters();
  renderAllSortToolbars();
  if (isSharkSearchMode()) {
    document.querySelectorAll('.client-style-bar, .tinder-filters-wrap, .active-pills-bar, #recoCarouselSection').forEach(el => {
      if (el) el.style.display = 'none';
    });
    document.querySelectorAll('.btn-style-edit, .avalie-historico-link').forEach(el => {
      if (el) el.style.display = 'none';
    });
  }
  updateProfButtonState();
  updateEstButtonState();
  initClientLocationFlow();
  updateRecoVisibility();
  initRecoCarouselArrows();
  loadRecommendations();

  const urlParams = new URLSearchParams(window.location.search);
  const professionalId = urlParams.get('professionalId');
  const establishmentId = urlParams.get('establishmentId');
  if (professionalId) {
    const qrFlow = typeof isQrReviewSession === 'function' && isQrReviewSession();
    setTimeout(() => {
      switchTab('prof');
      abrirDrawer('profissional', professionalId);
      if (qrFlow) {
        setTimeout(() => {
          if (typeof abrirAvaliacaoDrawer === 'function') abrirAvaliacaoDrawer(professionalId);
        }, 900);
      }
      if (window.history?.replaceState) {
        const newUrl = window.location.pathname + window.location.search
          .replace(/[?&]professionalId=[^&]*/, '')
          .replace(/[?&]token=[^&]*/, '')
          .replace(/[?&]qr=[^&]*/, '')
          .replace(/[?&]verified=[^&]*/, '');
        window.history.replaceState({}, document.title, newUrl);
      }
    }, 400);
  } else if (establishmentId) {
    setTimeout(() => {
      switchTab('est');
      abrirDrawer('estabelecimento', establishmentId);
      if (window.history?.replaceState) {
        const newUrl = window.location.pathname + window.location.search
          .replace(/[?&]establishmentId=[^&]*/, '')
          .replace(/[?&]token=[^&]*/, '');
        window.history.replaceState({}, document.title, newUrl);
      }
    }, 400);
  } else {
    initClientStyleFlow().then(() => {
      if (urlParams.get('openStyle') === '1' && isClienteLogadoEntry()) {
        setTimeout(() => abrirOnboardingEstilo(), 500);
      }
    });
  }

  if (urlParams.get('scanQr') === '1') {
    setTimeout(() => {
      if (typeof abrirScannerQR === 'function') abrirScannerQR();
      if (window.history?.replaceState) {
        const clean = window.location.pathname + window.location.search
          .replace(/[?&]scanQr=[^&]*/, '')
          .replace(/\?&/, '?')
          .replace(/\?$/, '');
        window.history.replaceState({}, document.title, clean || window.location.pathname);
      }
    }, 500);
  }
}

window.initClientePage = initClientePage;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initClientePage);
} else {
  initClientePage();
}

// ========================================
// FUNÇÕES DE ESTADO DOS BOTÕES
// ========================================
function updateProfButtonState() {
  const btn = DOM.btnListarProf;
  if (!btn) return;
  if (isAvalieMode()) {
    btn.textContent = '📋 Listar todos';
    btn.classList.remove('btn-danger');
    updateSearchCloseVisibility();
    updateResultsToolbarVisibility('prof');
    return;
  }
  if (isShowingProfResults) {
    btn.textContent = '❌ Fechar';
    btn.classList.add('btn-danger');
  } else {
    btn.textContent = '📋 Listar todos';
    btn.classList.remove('btn-danger');
  }
  updateResultsToolbarVisibility('prof');
}

function updateEstButtonState() {
  const btn = DOM.btnListarEst;
  if (!btn) return;
  if (isAvalieMode()) {
    btn.textContent = '📋 Listar todos';
    btn.classList.remove('btn-danger');
    updateSearchCloseVisibility();
    updateResultsToolbarVisibility('est');
    return;
  }
  if (isShowingEstResults) {
    btn.textContent = '❌ Fechar';
    btn.classList.add('btn-danger');
  } else {
    btn.textContent = '📋 Listar todos';
    btn.classList.remove('btn-danger');
  }
  updateResultsToolbarVisibility('est');
}

// ========================================
// PAGINAÇÃO
// ========================================
function renderPagination(container, pagina, total, fnName) {
  if (!total) {
    container.innerHTML = '';
    return;
  }
  const totalPaginas = Math.ceil(total / LIMITE);
  let html = '<div class="pagination-card"><div class="pagination-inner">';
  if (totalPaginas > 1 && pagina > 0) {
    html += `<button class="btn btn-small btn-outline" onclick="${fnName}(${pagina - 1})">← Anterior</button>`;
  }
  html += `<span class="pagination-info">Página <strong>${pagina + 1}</strong> de <strong>${totalPaginas}</strong> <span class="pagination-total">· ${total} resultado${total !== 1 ? 's' : ''}</span></span>`;
  if (totalPaginas > 1 && (pagina + 1) * LIMITE < total) {
    html += `<button class="btn btn-small btn-outline" onclick="${fnName}(${pagina + 1})">Próximo →</button>`;
  }
  html += '</div></div>';
  container.innerHTML = html;
}

// ========================================
// PROFISSIONAIS — BUSCA UNIFICADA
// ========================================
function listarTodosProfissionais() {
  listandoProf = true;
  isShowingProfResults = true;
  termoProfAtual = '';
  updateProfButtonState();
  fetchProfissionais(0, { listAll: true, scrollToResults: true });
}

window.toggleListarProfissionais = function() {
  if (isShowingProfResults) { clearProfResults(); return; }
  resetProfFilters();
  listarTodosProfissionais();
};

function clearProfResults() {
  DOM.profList.innerHTML = emptyStateProfHTML();
  DOM.profPagination.innerHTML = '';
  isShowingProfResults = false;
  listandoProf = false;
  termoProfAtual = '';
  lastProfPageData = null;
  updateProfButtonState();
  updateSearchCloseVisibility();
  updateResultsToolbarVisibility('prof');
  syncDockBackButton();
}

function executarBuscaProf(pagina, options = {}) {
  syncSearchState();
  const termo = searchTerm;
  const tags = selectedTags;

  if (!termo && !tags.length) {
    DOM.profList.innerHTML = emptyStateHTML('✏️', 'Digite um termo ou selecione filtros', 'Use o campo de busca ou toque nas pílulas, depois clique em Buscar.');
    DOM.profPagination.innerHTML = '';
    isShowingProfResults = false;
    updateProfButtonState();
    return;
  }

  if (termo.length > 0 && termo.length < 2 && !tags.length) {
    DOM.profList.innerHTML = emptyStateHTML('✏️', 'Digite pelo menos 2 letras', 'Ou selecione filtros de estilo para buscar.');
    DOM.profPagination.innerHTML = '';
    isShowingProfResults = false;
    updateProfButtonState();
    return;
  }

  listandoProf = false;
  termoProfAtual = termo;
  isShowingProfResults = true;
  updateProfButtonState();
  fetchProfissionais(pagina, { textTerm: termo, tags, ...options });
}

window.buscarProfissionais = function(pagina = 0, options = {}) {
  activeTab = 'profissionais';
  executarBuscaProf(pagina, options);
};

window.goToProfPage = function(pagina) {
  syncSearchState();
  if (listandoProf && !searchTerm && !selectedTags.length) {
    fetchProfissionais(pagina, { listAll: true });
  } else {
    fetchProfissionais(pagina, { textTerm: searchTerm, tags: selectedTags });
  }
};

async function fetchProfissionais(pagina, options = {}) {
  paginaProf = pagina;
  DOM.profList.innerHTML = '<div class="loading">Carregando...</div>';
  DOM.profPagination.innerHTML = '';

  try {
    const select = 'id,name,specialty,avatar_url,avg_rating,total_reviews,gallery_urls,music_tags,visual_tags,personality_tags,lifestyle_tags,work_tags,price_range,previous_workplaces,profile:professional_profiles(specialty,years_experience),current_establishment:establishments!professionals_current_establishment_id_fkey(id,name,city,neighborhood)';
    const textTerm = options.listAll ? '' : (options.textTerm !== undefined ? options.textTerm : DOM.profInput.value.trim());
    const tags = options.listAll ? [] : (options.tags !== undefined ? options.tags : activeStyleFiltersProf);

    const params = new URLSearchParams();
    params.append('select', select);

    const useClientTextSearch = !!(textTerm && textTerm.length >= 2);
    const filter = buildPostgrestFilter(textTerm, tags, PROF_TEXT_COLUMNS, PROF_TAG_COLUMNS, useClientTextSearch);
    if (filter) params.append(filter.key, filter.value);

    const path = `/rest/v1/professionals?${params.toString()}`;
    if (window.DEBUG_MODE) console.log('📡 Profissionais:', path);

    let data = await fetchAPI(path);
    if (useClientTextSearch && typeof filterItemsBySearchText === 'function') {
      data = filterItemsBySearchText(data, textTerm, PROF_SEARCH_FIELDS);
    }

    if (!data.length) {
      DOM.profList.innerHTML = emptyStateHTML('🔍', 'Nenhum profissional encontrado', 'Tente outros termos ou remova alguns filtros.');
      DOM.profPagination.innerHTML = '';
      isShowingProfResults = true;
      updateProfButtonState();
      updateResultsToolbarVisibility('prof');
      if (shouldScrollToResults(options)) scrollToActiveResults();
      syncDockBackButton();
      return;
    }

    const sorted = typeof aplicarOrdenacao === 'function'
      ? aplicarOrdenacao(data, activeSortFiltersProf, getUserPrefsProf(), 'prof')
      : data;

    totalProf = sorted.length;
    const pageData = sorted.slice(pagina * LIMITE, (pagina + 1) * LIMITE).map(p => {
      const insight = !isSharkSearchMode() && typeof buildMatchInsight === 'function'
        ? buildMatchInsight(p, 'prof', getMatchTagsProf())
        : null;
      const enriched = !isSharkSearchMode() && typeof enrichProfWithTalentMetrics === 'function'
        ? enrichProfWithTalentMetrics(p)
        : p;
      return {
        ...enriched,
        _prooflyScore: !isSharkSearchMode() && typeof calcularProoflyScoreRapido === 'function' ? calcularProoflyScoreRapido(p, 'prof') : null,
        _matchPercent: insight?.percent ?? p._matchPercent,
        _matchInsight: insight
      };
    });
    renderProfissionais(pageData, pagina, options);
    if (window.PROOFLY_DEBUG?.isMatchDebugOn?.() && pageData[0]) {
      PROOFLY_DEBUG.logMatch(pageData[0], 'prof', getMatchTagsProf());
    }
    isShowingProfResults = true;
    updateProfButtonState();
  } catch (e) {
    DOM.profList.innerHTML = emptyStateHTML('❌', 'Erro ao carregar', e.message);
    DOM.profPagination.innerHTML = '';
    console.error(e);
  }
}

// ========================================
// ESTABELECIMENTOS — BUSCA UNIFICADA
// ========================================
function listarTodosEstabelecimentos() {
  listandoEst = true;
  isShowingEstResults = true;
  termoEstAtual = '';
  updateEstButtonState();
  fetchEstabelecimentos(0, { listAll: true, scrollToResults: true });
}

window.toggleListarEstabelecimentos = function() {
  if (isShowingEstResults) { clearEstResults(); return; }
  resetEstFilters();
  listarTodosEstabelecimentos();
};

function clearEstResults() {
  DOM.estList.innerHTML = emptyStateEstHTML();
  DOM.estPagination.innerHTML = '';
  isShowingEstResults = false;
  listandoEst = false;
  termoEstAtual = '';
  lastEstPageData = null;
  updateEstButtonState();
  updateSearchCloseVisibility();
  updateResultsToolbarVisibility('est');
  syncDockBackButton();
}

function executarBuscaEst(pagina, options = {}) {
  syncSearchState();
  const termo = searchTerm;
  const tags = selectedTags;

  if (!termo && !tags.length) {
    DOM.estList.innerHTML = emptyStateHTML('✏️', 'Digite um termo ou selecione filtros', 'Use o campo de busca ou toque nas pílulas, depois clique em Buscar.');
    DOM.estPagination.innerHTML = '';
    isShowingEstResults = false;
    updateEstButtonState();
    return;
  }

  if (termo.length > 0 && termo.length < 2 && !tags.length) {
    DOM.estList.innerHTML = emptyStateHTML('✏️', 'Digite pelo menos 2 letras', 'Ou selecione filtros de ambiente para buscar.');
    DOM.estPagination.innerHTML = '';
    isShowingEstResults = false;
    updateEstButtonState();
    return;
  }

  listandoEst = false;
  termoEstAtual = termo;
  isShowingEstResults = true;
  updateEstButtonState();
  fetchEstabelecimentos(pagina, { textTerm: termo, tags, ...options });
}

window.buscarEstabelecimentos = function(pagina = 0, options = {}) {
  activeTab = 'estabelecimentos';
  executarBuscaEst(pagina, options);
};

window.goToEstPage = function(pagina) {
  syncSearchState();
  if (listandoEst && !searchTerm && !selectedTags.length) {
    fetchEstabelecimentos(pagina, { listAll: true });
  } else {
    fetchEstabelecimentos(pagina, { textTerm: searchTerm, tags: selectedTags });
  }
};

async function fetchEstabelecimentos(pagina, options = {}) {
  paginaEst = pagina;
  DOM.estList.innerHTML = '<div class="loading">Carregando...</div>';
  DOM.estPagination.innerHTML = '';

  try {
    const select = 'id,name,type,city,neighborhood,avatar_url,avg_rating,total_reviews,gallery_urls,infra_tags,music_tags,positioning_tags,audience_tags,vibe_tags,target_audience';
    const textTerm = options.listAll ? '' : (options.textTerm !== undefined ? options.textTerm : DOM.estInput.value.trim());
    const tags = options.listAll ? [] : (options.tags !== undefined ? options.tags : activeStyleFiltersEst);

    const params = new URLSearchParams();
    params.append('select', select);

    const useClientTextSearch = !!(textTerm && textTerm.length >= 2);
    const filter = buildPostgrestFilter(textTerm, tags, EST_TEXT_COLUMNS, EST_TAG_COLUMNS, useClientTextSearch);
    if (filter) params.append(filter.key, filter.value);

    const path = `/rest/v1/establishments?${params.toString()}`;
    if (window.DEBUG_MODE) console.log('📡 Estabelecimentos:', path);

    let data = await fetchAPI(path);
    if (useClientTextSearch && typeof filterItemsBySearchText === 'function') {
      data = filterItemsBySearchText(data, textTerm, EST_SEARCH_FIELDS);
    }

    if (!data.length) {
      DOM.estList.innerHTML = emptyStateHTML('🔍', 'Nenhum estabelecimento encontrado', 'Tente outros termos ou remova alguns filtros.');
      DOM.estPagination.innerHTML = '';
      isShowingEstResults = true;
      updateEstButtonState();
      updateResultsToolbarVisibility('est');
      if (shouldScrollToResults(options)) scrollToActiveResults();
      syncDockBackButton();
      return;
    }

    const sorted = typeof aplicarOrdenacao === 'function'
      ? aplicarOrdenacao(data, activeSortFiltersEst, getUserPrefsEst(), 'est')
      : data;

    totalEst = sorted.length;
    const pageData = sorted.slice(pagina * LIMITE, (pagina + 1) * LIMITE).map(e => {
      const insight = typeof buildMatchInsight === 'function'
        ? buildMatchInsight(e, 'est', getMatchTagsEst())
        : null;
      return {
        ...e,
        _prooflyScore: typeof calcularProoflyScoreRapido === 'function' ? calcularProoflyScoreRapido(e, 'est') : null,
        _matchPercent: insight?.percent ?? e._matchPercent,
        _matchInsight: insight
      };
    });
    renderEstabelecimentos(pageData, pagina, options);
    if (window.PROOFLY_DEBUG?.isMatchDebugOn?.() && pageData[0]) {
      PROOFLY_DEBUG.logMatch(pageData[0], 'est', getMatchTagsEst());
    }
    isShowingEstResults = true;
    updateEstButtonState();
  } catch (e) {
    DOM.estList.innerHTML = emptyStateHTML('❌', 'Erro ao carregar', e.message);
    DOM.estPagination.innerHTML = '';
    console.error(e);
  }
}

// ========================================
// MODOS DE VISUALIZAÇÃO (lista · blocos · cards)
// ========================================
function loadClienteViewMode() {
  try {
    const saved = localStorage.getItem(CLIENTE_VIEW_MODE_KEY);
    if (CLIENTE_VIEW_MODES.includes(saved)) clienteListViewMode = saved;
  } catch { /* noop */ }
}

function updateClienteViewToggleUI() {
  document.querySelectorAll('.cliente-view-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === clienteListViewMode);
  });
}

function setClienteViewMode(mode) {
  if (!CLIENTE_VIEW_MODES.includes(mode)) return;
  clienteListViewMode = mode;
  try { localStorage.setItem(CLIENTE_VIEW_MODE_KEY, mode); } catch { /* noop */ }
  updateClienteViewToggleUI();
  if (lastProfPageData) renderProfissionais(lastProfPageData, lastProfPage);
  if (lastEstPageData) renderEstabelecimentos(lastEstPageData, lastEstPage);
}

function initClienteViewModes() {
  loadClienteViewMode();
  updateClienteViewToggleUI();
  document.querySelectorAll('.cliente-view-pill').forEach(btn => {
    btn.addEventListener('click', () => setClienteViewMode(btn.dataset.view));
  });
}

function updateResultsToolbarVisibility(type) {
  const profToolbar = document.getElementById('clienteViewToolbarProf');
  const estToolbar = document.getElementById('clienteViewToolbarEst');
  if (profToolbar) profToolbar.hidden = !isShowingProfResults;
  if (estToolbar) estToolbar.hidden = !isShowingEstResults;
}

function applyClienteResultsListClass(listEl) {
  if (!listEl) return;
  listEl.classList.remove(
    'tinder-results',
    'cliente-results-list',
    'cliente-results-grid',
    'cliente-results-cards'
  );
  if (clienteListViewMode === 'cards') {
    listEl.classList.add('cliente-results-cards', 'tinder-results');
  } else if (clienteListViewMode === 'grade') {
    listEl.classList.add('cliente-results-grid');
  } else {
    listEl.classList.add('cliente-results-list');
  }
}

function avatarUrlForItem(item) {
  const photos = ProfileCard?.getPhotos?.(item) || [];
  const raw = photos[0] || item.avatar_url;
  return typeof getAvatarUrl === 'function' ? getAvatarUrl(raw) : (raw || '');
}

function renderClienteListRow(item, type) {
  const esc = typeof escapeHtml === 'function' ? escapeHtml : (s) => String(s || '');
  const isProf = type === 'prof';
  const drawerType = isProf ? 'profissional' : 'estabelecimento';
  const id = item.id;
  const name = item.name || 'Sem nome';
  const initial = esc(name.charAt(0).toUpperCase());
  const src = avatarUrlForItem(item);
  const specialty = isProf
    ? (item.profile?.specialty || item.specialty || 'Profissional')
    : (item.type || item.city || 'Estabelecimento');
  const avg = item.avg_rating ? Number(item.avg_rating).toFixed(1) : '—';
  const reviews = item.total_reviews || 0;
  const sharkSearch = isSharkSearchMode();
  const match = sharkSearch ? null : (item._matchInsight?.percent ?? item._matchPercent);
  const matchTier = item._matchInsight?.tier || (match >= 80 ? 'hot' : match >= 55 ? 'warm' : 'cool');
  const matchHtml = sharkSearch ? '' : (match != null
    ? `<div class="cliente-result-match cliente-result-match--${matchTier}" aria-label="Match ${Math.round(match)}%"><span class="cliente-result-match-pct">${Math.round(match)}%</span></div>`
    : '<div class="cliente-result-match cliente-result-match--cool"><span class="cliente-result-match-pct">—</span></div>');
  const sub = isProf && item.current_establishment?.name
    ? `${esc(specialty)} · ${esc(item.current_establishment.name)}`
    : esc(specialty);

  return `
    <article class="cliente-result-row" role="button" tabindex="0"
      onclick="openProfile('${drawerType}','${id}')"
      onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openProfile('${drawerType}','${id}');}">
      ${matchHtml}
      <div class="cliente-result-avatar">
        <img src="${src}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
        <div class="cliente-result-avatar-fallback" style="display:none;">${initial}</div>
      </div>
      <div class="cliente-result-main">
        <span class="cliente-result-name">${esc(name)}</span>
        <span class="cliente-result-sub">${sub}</span>
      </div>
      <div class="cliente-result-stats">
        <span>★ ${avg}</span>
        <span>${reviews} aval.</span>
      </div>
      <button type="button" class="cliente-result-open" onclick="event.stopPropagation();openProfile('${drawerType}','${id}')" aria-label="Ver perfil">→</button>
    </article>
  `;
}

function renderClienteGridCell(item, type) {
  const mini = ProfileCard?.renderMiniRecoCard?.(item, type)
    || '<div class="reco-carousel-empty">Card indisponível</div>';
  return `<div class="cliente-result-grid-cell">${mini}</div>`;
}

function renderClienteResultItem(item, type) {
  if (clienteListViewMode === 'grade') return renderClienteGridCell(item, type);
  if (clienteListViewMode === 'lista') return renderClienteListRow(item, type);
  return ProfileCard.renderResultCard(item, type);
}

// ========================================
// RENDERIZAÇÃO DOS RESULTADOS
// ========================================
function renderProfissionais(data, pagina, options = {}) {
  lastProfPageData = data;
  lastProfPage = pagina;
  applyClienteResultsListClass(DOM.profList);
  const html = data.map(prof => renderClienteResultItem(prof, 'prof')).join('');
  DOM.profList.innerHTML = html;
  renderPagination(DOM.profPagination, pagina, totalProf, 'goToProfPage');
  updateResultsToolbarVisibility('prof');
  if (shouldScrollToResults(options)) scrollToActiveResults();
  syncDockBackButton();
}

function renderEstabelecimentos(data, pagina, options = {}) {
  lastEstPageData = data;
  lastEstPage = pagina;
  applyClienteResultsListClass(DOM.estList);
  const html = data.map(e => renderClienteResultItem(e, 'est')).join('');
  DOM.estList.innerHTML = html;
  renderPagination(DOM.estPagination, pagina, totalEst, 'goToEstPage');
  updateResultsToolbarVisibility('est');
  if (shouldScrollToResults(options)) scrollToActiveResults();
  syncDockBackButton();
}

// ========================================
// DRAWER E PERFIS
// ========================================
window.abrirDrawer = function(tipo, id) {
  drawerTipo = tipo;
  drawerId = id;
  drawerAberto = true;
  DOM.drawer.classList.add('open');
  DOM.drawerOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  DOM.drawerBody.innerHTML = '<div class="loading" style="padding:48px 24px;text-align:center;">Carregando perfil...</div>';
  setDrawerActions('');
  if (typeof incrementProfileView === 'function') {
    incrementProfileView(id, tipo === 'profissional' ? 'prof' : 'est');
  }
  if (tipo === 'profissional') {
    carregarPerfilProfissional(id);
  } else {
    currentPageEstReviews = 0;
    carregarPerfilEstabelecimento(id);
  }
};

window.fecharDrawer = function() {
  drawerAberto = false;
  DOM.drawer.classList.remove('open');
  DOM.drawerOverlay.classList.remove('active');
  document.body.style.overflow = '';
  setDrawerActions('');
  const form = document.getElementById('avaliarDrawerForm');
  if (form) form.remove();
  const formEst = document.getElementById('avaliarEstabDrawerForm');
  if (formEst) formEst.remove();
};

// ========================================
// PERFIL PROFISSIONAL (completo)
// ========================================
async function carregarPerfilProfissional(id) {
  avaliacaoProfId = id;
  try {
    const profData = await fetchAPI(
      `/rest/v1/professionals?id=eq.${id}&select=*,current_establishment:establishments!professionals_current_establishment_id_fkey(id,name),profile:professional_profiles(*),music_tags,visual_tags,personality_tags,lifestyle_tags,work_tags,work_style_tags,price_range,previous_workplaces,gallery_urls,salary_expectation,average_job_duration_months,client_portfolio_count,igv_score,available_now,seeking_work`
    );
    if (!profData.length) {
      DOM.drawerBody.innerHTML = '<p style="color:red;">Profissional não encontrado.</p>';
      return;
    }
    const prof = profData[0];
    let hiringPrivate = null;
    try {
      const priv = await fetchAPI(`/rest/v1/professional_private_data?professional_id=eq.${id}&select=birth_date`);
      if (priv?.[0]) hiringPrivate = priv[0];
    } catch { /* noop */ }
    const matchInsight = typeof buildMatchInsight === 'function'
      ? buildMatchInsight(prof, 'prof', getMatchTagsProf())
      : { percent: computeDrawerMatchPercent(prof, true), sharedTags: [], headline: '', subline: '', tier: 'cool' };
    const matchPercent = matchInsight.percent;

    const allReviewsRaw = typeof fetchReviews === 'function'
      ? await fetchReviews(`professional_id=eq.${id}`, { viewContext: { entityType: 'prof', targetProfName: prof.name } })
      : await fetchAPI(`/rest/v1/reviews?professional_id=eq.${id}&select=rating,comment,created_at,verified,review_type,source&order=created_at.desc`);
    const prooflyData = typeof calcularProoflyScoreFromReviews === 'function'
      ? calcularProoflyScoreFromReviews(allReviewsRaw, id, 'prof')
      : { score: calcularProoflyScoreRapido?.(prof, 'prof'), groups: {}, clientStats: {}, estabStats: {}, social: getMockSocialSignals?.(id, 'prof') };
    const clientReviewsAll = typeof filterReviewsByType === 'function'
      ? filterReviewsByType(allReviewsRaw, REVIEW_TYPES.CLIENT_TO_PROF)
      : allReviewsRaw.filter(r => r.review_type === 'client_to_professional' || !r.review_type);
    const ratingStats = prooflyData.clientStats?.total ? prooflyData.clientStats : computeRatingStats(clientReviewsAll);
    const avgRating = ratingStats.total ? ratingStats.avg : (prof.avg_rating || 0);
    const totalReviews = ratingStats.total || prof.total_reviews || 0;

    const estabReviewsForHistory = typeof filterReviewsByType === 'function'
      ? filterReviewsByType(allReviewsRaw, REVIEW_TYPES.ESTAB_TO_PROF)
      : [];
    let workHistory = [];
    try {
      const vinculos = await fetchAPI(
        `/rest/v1/professional_establishment?professional_id=eq.${id}&select=*,establishment:establishment_id(id,name)&order=started_at.desc`
      );
      workHistory = typeof buildWorkHistory === 'function'
        ? buildWorkHistory(vinculos, estabReviewsForHistory, prof.previous_workplaces)
        : [];
    } catch { workHistory = []; }

    const badges = typeof getProoflyBadges === 'function'
      ? getProoflyBadges(prof, prooflyData.score, { clientTotal: ratingStats.total })
      : [];
    const strengths = typeof buildStrengthPoints === 'function'
      ? buildStrengthPoints(prof, 'prof', prooflyData.score, prooflyData.groups)
      : [];

    const heroLines = [];
    if (prof.current_establishment?.name) {
      heroLines.push(`📍 <span class="estab-link" style="cursor:pointer;" onclick="fecharDrawer(); setTimeout(()=>abrirDrawer('estabelecimento','${prof.current_establishment.id}'),300)">${escapeHtml(prof.current_establishment.name)}</span>`);
    } else {
      heroLines.push('📍 Autônomo');
    }
    if (prof.profile?.years_experience) heroLines.push(`⏳ ${prof.profile.years_experience} anos de experiência`);
    if (prof.price_range) heroLines.push(`💰 ${escapeHtml(prof.price_range)}`);
    if (prof.profile?.instagram) {
      const ig = prof.profile.instagram.replace('@', '');
      heroLines.push(`📷 <a href="https://instagram.com/${ig}" target="_blank" rel="noopener" style="color:#f9a8d4;">@${escapeHtml(ig)}</a>`);
    }

    const atendimentosLabel = totalReviews >= 50 ? 'Mais de 50 clientes atendidos' :
      totalReviews >= 20 ? 'Mais de 20 clientes atendidos' :
      totalReviews >= 10 ? 'Mais de 10 clientes atendidos' :
      totalReviews > 0 ? `${totalReviews} clientes atendidos` : 'Ainda sem atendimentos registrados';

    const photos = getProfilePhotos(prof);
    let html = ProfileCard.renderHero({
      name: prof.name,
      subtitle: prof.profile?.specialty || prof.specialty || 'Profissional',
      lines: heroLines,
      avatarUrl: prof.avatar_url,
      photos,
      entityId: prof.id,
      matchPercent,
      matchInsight,
      prooflyScore: prooflyData.score,
      badges,
      type: 'prof',
      avgRating,
      totalReviews
    });

    const estabReviewsRaw = typeof filterReviewsByType === 'function'
      ? filterReviewsByType(allReviewsRaw, REVIEW_TYPES.ESTAB_TO_PROF).slice(0, 5)
      : (typeof fetchReviews === 'function'
        ? await fetchReviews(`professional_id=eq.${id}&review_type=eq.establishment_to_professional`, { limit: 5 })
        : []);
    const profReviewCtx = { entityType: 'prof', targetProfName: prof.name };
    html += ProfileCard.buildProfessionalProfileBody({
      prof, matchInsight, prooflyData, allReviewsRaw, clientReviewsAll,
      estabReviewsRaw, avgRating, totalReviews, strengths, workHistory, profReviewCtx,
      hiringPrivate
    });

    DOM.drawerBody.innerHTML = html;
    setDrawerActions(ProfileCard.renderDrawerActions({
      primaryLabel: '⭐ Avaliar este profissional',
      primaryOnclick: `abrirAvaliacaoDrawer('${prof.id}')`,
      likeType: 'prof',
      likeId: prof.id,
      favType: 'prof',
      favId: prof.id,
      favName: prof.name,
      showReviewsBtn: true
    }));
  } catch (e) {
    DOM.drawerBody.innerHTML = `<p style="color:red;">Erro: ${e.message}</p>`;
    console.error(e);
  }
}

// ========================================
// PERFIL ESTABELECIMENTO (completo)
// ========================================
async function carregarPerfilEstabelecimento(id) {
  try {
    const data = await fetchAPI(
      `/rest/v1/establishments?id=eq.${id}&select=*,infra_tags,music_tags,positioning_tags,audience_tags,vibe_tags,target_audience,gallery_urls`
    );
    if (!data.length) {
      DOM.drawerBody.innerHTML = '<p style="color:red;">Estabelecimento não encontrado.</p>';
      return;
    }
    const e = data[0];
    const matchInsight = typeof buildMatchInsight === 'function'
      ? buildMatchInsight(e, 'est', getMatchTagsEst())
      : { percent: computeDrawerMatchPercent(e, false), sharedTags: [], headline: '', subline: '', tier: 'cool' };
    const matchPercent = matchInsight.percent;

    const allReviewsRaw = typeof fetchReviews === 'function'
      ? await fetchReviews(`establishment_id=eq.${id}`, { viewContext: { entityType: 'est', establishmentId: id, targetEstName: e.name } })
      : await fetchAPI(`/rest/v1/reviews?establishment_id=eq.${id}&select=rating,comment,created_at,verified,review_type,source&order=created_at.desc`);
    const prooflyData = typeof calcularProoflyScoreFromReviews === 'function'
      ? calcularProoflyScoreFromReviews(allReviewsRaw, id, 'est')
      : { score: calcularProoflyScoreRapido?.(e, 'est'), groups: {}, clientStats: {}, estabStats: {}, social: getMockSocialSignals?.(id, 'est') };
    let allReviews = typeof filterReviewsByType === 'function'
      ? filterReviewsByType(allReviewsRaw, REVIEW_TYPES.CLIENT_TO_EST)
      : allReviewsRaw.filter(r => r.review_type === 'client_to_establishment' || !r.review_type);
    if (!allReviews.length) {
      allReviews = allReviewsRaw.filter(r => !r.professional_id);
    }
    const ratingStats = prooflyData.clientStats?.total ? prooflyData.clientStats : computeRatingStats(allReviews);
    const avgRating = ratingStats.total ? ratingStats.avg : (e.avg_rating || 0);
    const totalReviews = ratingStats.total || e.total_reviews || 0;
    const badges = typeof getProoflyBadges === 'function'
      ? getProoflyBadges(e, prooflyData.score, { clientTotal: ratingStats.total })
      : [];
    const strengths = typeof buildStrengthPoints === 'function'
      ? buildStrengthPoints(e, 'est', prooflyData.score, prooflyData.groups)
      : [];
    const reviewOffset = currentPageEstReviews * EST_REVIEWS_PER_PAGE;
    const reviewsPage = allReviews.slice(reviewOffset, reviewOffset + EST_REVIEWS_PER_PAGE);

    const endereco = e.address || [e.street, e.number, e.neighborhood, e.city, e.state, e.country].filter(Boolean).join(', ');
    const heroLines = [];
    if (endereco) heroLines.push(`📍 ${escapeHtml(endereco)}`);
    if (e.phone) heroLines.push(`📞 ${escapeHtml(e.phone)}`);
    if (e.target_audience) heroLines.push(`🎯 ${escapeHtml(e.target_audience)}`);
    if (e.instagram) {
      const ig = e.instagram.replace('@', '');
      heroLines.push(`📷 <a href="https://instagram.com/${ig}" target="_blank" rel="noopener" style="color:#f9a8d4;">@${escapeHtml(ig)}</a>`);
    }

    const photos = getProfilePhotos(e);
    let html = ProfileCard.renderHero({
      name: e.name,
      subtitle: e.type || 'Estabelecimento',
      lines: heroLines,
      avatarUrl: e.avatar_url,
      photos,
      entityId: e.id,
      matchPercent,
      matchInsight,
      prooflyScore: prooflyData.score,
      badges,
      type: 'est',
      avgRating,
      totalReviews
    });

    const estReviewCtx = { entityType: 'est', establishmentId: id, targetEstName: e.name };
    let paginationHtml = '';
    if (totalReviews > EST_REVIEWS_PER_PAGE) {
      const totalPages = Math.ceil(totalReviews / EST_REVIEWS_PER_PAGE);
      paginationHtml = '<div class="pagination" style="margin-top:12px;">';
      if (currentPageEstReviews > 0) {
        paginationHtml += `<button class="btn btn-outline btn-small" onclick="irPaginaEstReviews(${currentPageEstReviews - 1})">← Anterior</button>`;
      }
      paginationHtml += `<span class="text-glass-muted" style="font-size:13px;padding:0 8px;">${currentPageEstReviews + 1} / ${totalPages}</span>`;
      if (currentPageEstReviews < totalPages - 1) {
        paginationHtml += `<button class="btn btn-outline btn-small" onclick="irPaginaEstReviews(${currentPageEstReviews + 1})">Próxima →</button>`;
      }
      paginationHtml += '</div>';
    }
    html += ProfileCard.buildEstablishmentProfileBody({
      estab: e, matchInsight, prooflyData, allReviews: reviewsPage, avgRating, totalReviews,
      strengths, estReviewCtx, paginationHtml,
      tagCategories: [
        { icon: '🏗️', label: 'Infraestrutura', tags: e.infra_tags },
        { icon: '🎵', label: 'Música Ambiente', tags: e.music_tags },
        { icon: '💎', label: 'Posicionamento', tags: e.positioning_tags },
        { icon: '👥', label: 'Público', tags: e.audience_tags },
        { icon: '🌟', label: 'Vibe', tags: e.vibe_tags }
      ]
    });

    DOM.drawerBody.innerHTML = html;
    setDrawerActions(ProfileCard.renderDrawerActions({
      primaryLabel: '⭐ Avaliar este estabelecimento',
      primaryOnclick: `abrirAvaliacaoEstabelecimento('${e.id}')`,
      likeType: 'est',
      likeId: e.id,
      favType: 'est',
      favId: e.id,
      favName: e.name,
      showReviewsBtn: true
    }));
  } catch (e) {
    DOM.drawerBody.innerHTML = `<p style="color:red;">Erro: ${e.message}</p>`;
    console.error(e);
  }
}

window.scrollDrawerToReviews = function() {
  document.getElementById('drawer-reviews-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.irPaginaEstReviews = function(page) {
  currentPageEstReviews = page;
  if (drawerTipo === 'estabelecimento' && drawerId) {
    carregarPerfilEstabelecimento(drawerId);
  }
};

// ========================================
// AVALIAÇÃO NO DRAWER (PROFISSIONAL)
// ========================================
function abrirAvaliacaoDrawer(id) {
  const session = getSession();
  if (!session || !session.userId) {
    localStorage.setItem('avaliarProfId', id);
    let returnPath = `${window.location.pathname}?professionalId=${id}`;
    const qrTok = (() => {
      try { return sessionStorage.getItem('proofly_qr_token'); } catch { return null; }
    })() || (typeof getQrTokenFromUrl === 'function' ? getQrTokenFromUrl() : null);
    if (qrTok) returnPath += `&token=${encodeURIComponent(qrTok)}`;
    window.location.href = `login.html?intent=cliente&returnTo=${encodeURIComponent(returnPath)}`;
    return;
  }

  const oldForm = document.getElementById('avaliarDrawerForm');
  if (oldForm) oldForm.remove();

  avaliacaoProfId = id;
  avaliacaoRating = 0;

  const avaliarHTML = `
    <div id="avaliarDrawerForm" style="margin-top:20px;padding-top:16px;border-top:2px solid #1e293b;">
      <h4 style="text-align:center;color:#f1f5f9;margin-bottom:8px;">⭐ Avaliar profissional</h4>
      <div class="stars-input" id="starsInputDrawer" style="display:flex;gap:8px;justify-content:center;margin:8px 0;">
        <span class="star-input" data-value="1" onclick="setRatingDrawer(1)">☆</span>
        <span class="star-input" data-value="2" onclick="setRatingDrawer(2)">☆</span>
        <span class="star-input" data-value="3" onclick="setRatingDrawer(3)">☆</span>
        <span class="star-input" data-value="4" onclick="setRatingDrawer(4)">☆</span>
        <span class="star-input" data-value="5" onclick="setRatingDrawer(5)">☆</span>
      </div>
      <textarea id="avaliarCommentDrawer" placeholder="Deixe seu comentário..." style="width:100%;padding:10px;border-radius:12px;font-family:inherit;font-size:14px;resize:vertical;min-height:60px;"></textarea>
      <button class="btn btn-green btn-full" onclick="confirmarEnvioAvaliacao()" style="margin-top:10px;">✅ Enviar avaliação</button>
      <div id="avaliarMsgDrawer" class="msg" style="margin-top:10px;"></div>
    </div>
  `;

  DOM.drawerBody.insertAdjacentHTML('beforeend', avaliarHTML);
  document.getElementById('avaliarDrawerForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function setRatingDrawer(value) {
  avaliacaoRating = value;
  const stars = document.querySelectorAll('#starsInputDrawer .star-input');
  stars.forEach((el, i) => {
    el.textContent = i < value ? '★' : '☆';
    el.classList.toggle('active', i < value);
  });
}

async function confirmarEnvioAvaliacao() {
  if (!avaliacaoProfId) {
    await showAlert('⚠️ Atenção', 'Profissional não identificado.');
    return;
  }
  if (avaliacaoRating === 0) {
    await showAlert('⚠️ Atenção', 'Selecione uma nota antes de avaliar.');
    return;
  }

  const confirmado = await showConfirm({
    title: '⭐ Confirmar avaliação',
    message: `Deseja realmente avaliar este profissional com ${avaliacaoRating} estrela${avaliacaoRating > 1 ? 's' : ''}?`,
    confirmText: 'Sim, avaliar',
    cancelText: 'Cancelar',
    danger: false
  });

  if (confirmado) {
    await enviarAvaliacaoDrawer();
  }
}

async function enviarAvaliacaoDrawer() {
  const msgDiv = document.getElementById('avaliarMsgDrawer');
  const comment = document.getElementById('avaliarCommentDrawer').value.trim();

  if (!avaliacaoProfId) {
    await showAlert('❌ Erro', 'Profissional não identificado.');
    return;
  }
  if (avaliacaoRating === 0) {
    await showAlert('⚠️ Atenção', 'Selecione uma nota.');
    return;
  }

  try {
    if (typeof submitReview === 'function') {
      await submitReview({
        rating: avaliacaoRating,
        comment,
        professionalId: avaliacaoProfId
      });
    } else {
      const user = getCurrentUser();
      await fetchAPI('/rest/v1/reviews', 'POST', {
        user_id: user?.id,
        source: 'cliente',
        professional_id: avaliacaoProfId,
        rating: avaliacaoRating,
        comment: comment || null,
        verified: false,
        review_type: REVIEW_TYPES.CLIENT_TO_PROF
      });
    }
    await recalcularMedia(avaliacaoProfId);

    await showAlert('✅ Sucesso!', 'Avaliação registrada com sucesso!');

    setTimeout(() => {
      const form = document.getElementById('avaliarDrawerForm');
      if (form) form.remove();
      carregarPerfilProfissional(avaliacaoProfId);
    }, 1500);
  } catch (e) {
    await showAlert('❌ Erro', 'Erro ao enviar avaliação: ' + e.message);
    console.error(e);
  }
}

// ========================================
// AVALIAÇÃO DE ESTABELECIMENTO
// ========================================
function abrirAvaliacaoEstabelecimento(id) {
  const session = getSession();
  if (!session || !session.userId) {
    localStorage.setItem('avaliarEstabId', id);
    window.location.href = `login.html?intent=cliente&returnTo=${encodeURIComponent(window.location.pathname + '?establishmentId=' + id)}`;
    return;
  }

  const oldForm = document.getElementById('avaliarEstabDrawerForm');
  if (oldForm) oldForm.remove();

  avaliacaoEstabId = id;
  avaliacaoEstabRating = 0;

  const avaliarHTML = `
    <div id="avaliarEstabDrawerForm" style="margin-top:20px;padding-top:16px;border-top:2px solid #1e293b;">
      <h4 style="text-align:center;color:#f1f5f9;margin-bottom:8px;">⭐ Avaliar estabelecimento</h4>
      <div class="stars-input" id="starsInputEstabDrawer" style="display:flex;gap:8px;justify-content:center;margin:8px 0;">
        <span class="star-input" data-value="1" onclick="setRatingEstabDrawer(1)">☆</span>
        <span class="star-input" data-value="2" onclick="setRatingEstabDrawer(2)">☆</span>
        <span class="star-input" data-value="3" onclick="setRatingEstabDrawer(3)">☆</span>
        <span class="star-input" data-value="4" onclick="setRatingEstabDrawer(4)">☆</span>
        <span class="star-input" data-value="5" onclick="setRatingEstabDrawer(5)">☆</span>
      </div>
      <textarea id="avaliarEstabCommentDrawer" placeholder="Deixe seu comentário sobre o estabelecimento..." style="width:100%;padding:10px;border-radius:12px;font-family:inherit;font-size:14px;resize:vertical;min-height:60px;"></textarea>
      <button class="btn btn-green btn-full" onclick="confirmarEnvioAvaliacaoEstab()" style="margin-top:10px;">✅ Enviar avaliação</button>
      <div id="avaliarEstabMsgDrawer" class="msg" style="margin-top:10px;"></div>
    </div>
  `;

  DOM.drawerBody.insertAdjacentHTML('beforeend', avaliarHTML);
  document.getElementById('avaliarEstabDrawerForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function setRatingEstabDrawer(value) {
  avaliacaoEstabRating = value;
  const stars = document.querySelectorAll('#starsInputEstabDrawer .star-input');
  stars.forEach((el, i) => {
    el.textContent = i < value ? '★' : '☆';
    el.classList.toggle('active', i < value);
  });
}

async function confirmarEnvioAvaliacaoEstab() {
  if (!avaliacaoEstabId) {
    await showAlert('⚠️ Atenção', 'Estabelecimento não identificado.');
    return;
  }
  if (avaliacaoEstabRating === 0) {
    await showAlert('⚠️ Atenção', 'Selecione uma nota antes de avaliar.');
    return;
  }

  const confirmado = await showConfirm({
    title: '⭐ Confirmar avaliação',
    message: `Deseja realmente avaliar este estabelecimento com ${avaliacaoEstabRating} estrela${avaliacaoEstabRating > 1 ? 's' : ''}?`,
    confirmText: 'Sim, avaliar',
    cancelText: 'Cancelar',
    danger: false
  });

  if (confirmado) {
    await enviarAvaliacaoEstabDrawer();
  }
}

async function enviarAvaliacaoEstabDrawer() {
  const msgDiv = document.getElementById('avaliarEstabMsgDrawer');
  const comment = document.getElementById('avaliarEstabCommentDrawer').value.trim();

  if (!avaliacaoEstabId) {
    await showAlert('❌ Erro', 'Estabelecimento não identificado.');
    return;
  }
  if (avaliacaoEstabRating === 0) {
    await showAlert('⚠️ Atenção', 'Selecione uma nota.');
    return;
  }

  try {
    if (typeof submitReview === 'function') {
      await submitReview({
        rating: avaliacaoEstabRating,
        comment,
        establishmentId: avaliacaoEstabId
      });
    } else {
      const user = getCurrentUser();
      await fetchAPI('/rest/v1/reviews', 'POST', {
        user_id: user?.id,
        source: 'cliente',
        establishment_id: avaliacaoEstabId,
        rating: avaliacaoEstabRating,
        comment: comment || null,
        verified: false,
        review_type: REVIEW_TYPES.CLIENT_TO_EST
      });
    }
    await showAlert('✅ Sucesso!', 'Avaliação registrada com sucesso!');

    setTimeout(() => {
      const form = document.getElementById('avaliarEstabDrawerForm');
      if (form) form.remove();
      if (drawerTipo === 'estabelecimento' && drawerId) {
        currentPageEstReviews = 0;
        carregarPerfilEstabelecimento(drawerId);
      }
    }, 1500);
  } catch (e) {
    await showAlert('❌ Erro', 'Erro ao enviar avaliação: ' + e.message);
    console.error(e);
  }
}

// ========================================
// QR CODE SCANNER
// ========================================
let qrScanner = null;

function abrirScannerQR() {
  const container = document.getElementById('qrScannerContainer');
  container.classList.add('open');
  document.body.style.overflow = 'hidden';
  const status = document.getElementById('qrScannerStatus');
  if (status) status.textContent = 'Iniciando câmera...';
  if (typeof Html5Qrcode === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
    script.onload = () => { iniciarScanner(); };
    document.head.appendChild(script);
  } else {
    iniciarScanner();
  }
}

function iniciarScanner() {
  const status = document.getElementById('qrScannerStatus');
  if (qrScanner) { qrScanner.clear(); qrScanner = null; }
  qrScanner = new Html5Qrcode("qr-reader");
  const config = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 };
  qrScanner.start({ facingMode: "environment" }, config,
    function(decodedText) {
      status.textContent = '✅ QR Code lido! Redirecionando...';
      fecharScannerQR();
      const norm = typeof window.normalizarUrlQr === 'function'
        ? window.normalizarUrlQr(decodedText)
        : decodedText;
      if (norm) window.location.href = norm;
    },
    function(err) {}
  ).then(() => {
    status.textContent = '✅ Câmera ativa. Aponte para o QR Code.';
  }).catch(err => {
    status.textContent = '❌ Erro ao acessar câmera: ' + err;
    console.error(err);
  });
}

function fecharScannerQR() {
  const container = document.getElementById('qrScannerContainer');
  container.classList.remove('open');
  document.body.style.overflow = '';
  if (qrScanner) {
    qrScanner.stop().then(() => { qrScanner.clear(); qrScanner = null; }).catch(err => { console.warn('Erro ao parar scanner:', err); });
  }
}

window.abrirScannerQR = abrirScannerQR;
window.fecharScannerQR = fecharScannerQR;

// ========================================
// EXPOR FUNÇÕES GLOBAIS
// ========================================
window.abrirDrawer = abrirDrawer;
window.fecharDrawer = fecharDrawer;
window.buscarProfissionais = buscarProfissionais;
window.buscarEstabelecimentos = buscarEstabelecimentos;
window.toggleListarProfissionais = toggleListarProfissionais;
window.toggleListarEstabelecimentos = toggleListarEstabelecimentos;
window.goToProfPage = goToProfPage;
window.goToEstPage = goToEstPage;
window.abrirAvaliacaoDrawer = abrirAvaliacaoDrawer;
window.setRatingDrawer = setRatingDrawer;
window.confirmarEnvioAvaliacao = confirmarEnvioAvaliacao;
window.abrirAvaliacaoEstabelecimento = abrirAvaliacaoEstabelecimento;
window.setRatingEstabDrawer = setRatingEstabDrawer;
window.confirmarEnvioAvaliacaoEstab = confirmarEnvioAvaliacaoEstab;
window.irPaginaEstReviews = irPaginaEstReviews;

})();