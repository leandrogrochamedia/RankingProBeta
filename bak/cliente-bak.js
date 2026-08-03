// =====================================================
// PROOFLY - Página Cliente (busca + perfil + pills)
// =====================================================

(function() {
'use strict';

if (typeof getSession !== 'function') {
  window.location.href = 'login.html';
  return;
}
const session = getSession();
if (!session || session.role !== 'cliente') {
  window.location.href = 'login.html';
  return;
}

console.log('✅ Cliente autenticado com sucesso!');

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
let activeSortFiltersProf = ['proximity', 'match'];
let activeSortFiltersEst = ['proximity', 'match'];

const SORT_OPTIONS = [
  { id: 'proximity', label: '📍 Proximidade' },
  { id: 'match', label: '🎯 Match' },
  { id: 'name', label: '🔤 Alfabético' },
  { id: 'qualification', label: '⭐ Qualificação' }
];

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

function handleSearchProf() {
  activeTab = 'profissionais';
  syncSearchState();
  buscarProfissionais(0);
}

function handleSearchEst() {
  activeTab = 'estabelecimentos';
  syncSearchState();
  buscarEstabelecimentos(0);
}

function handleSearch() {
  syncSearchState();
  if (activeTab === 'profissionais') {
    buscarProfissionais(0);
  } else {
    buscarEstabelecimentos(0);
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
  return typeof getEffectiveClientTags === 'function'
    ? getEffectiveClientTags('prof', activeStyleFiltersProf)
    : activeStyleFiltersProf;
}

function getMatchTagsEst() {
  return typeof getEffectiveClientTags === 'function'
    ? getEffectiveClientTags('est', activeStyleFiltersEst)
    : activeStyleFiltersEst;
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
  const chip = document.getElementById('clientLocationChip');
  if (!chip) return;
  if (loc?.lat != null) {
    chip.style.display = 'inline-flex';
    chip.innerHTML = '<span class="client-location-icon">📍</span><span>Perto de você</span>';
    chip.title = 'Toque para atualizar localização';
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
};

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

  if (!prefs.onboardingDone || !unique.length) {
    bar.style.display = 'none';
    return;
  }

  chipsEl.innerHTML = unique.map(t =>
    `<span class="client-style-chip">${typeof renderTagWithEmoji === 'function' ? renderTagWithEmoji(t) : t}</span>`
  ).join('');
  bar.style.display = 'block';

  const heroP = document.querySelector('.cliente-hero-text p');
  if (heroP) {
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
  if (sess?.clientId && typeof fetchAPI === 'function') {
    const clientApi = typeof CLIENT_PROFILES_API !== 'undefined' ? CLIENT_PROFILES_API : '/rest/v1/client_profiles';
    fetchAPI(`${clientApi}?id=eq.${sess.clientId}`, 'PATCH', {
      prof_style_tags: onboardingProfSelection,
      est_style_tags: onboardingEstSelection
    }).catch(e => console.warn('Prefs não salvas no cliente:', e.message));
  }
  fecharOnboardingEstilo();
  renderStyleBar();
  if (typeof showUserMessage === 'function') {
    showUserMessage('🎯 Estilo salvo! Mostrando recomendações para você.');
  }
  listarTodosProfissionais();
};

async function loadClientPrefsFromSession() {
  const sess = getSession();
  if (!sess?.clientId || typeof fetchAPI !== 'function') return;
  try {
    const clientApi = typeof CLIENT_PROFILES_API !== 'undefined' ? CLIENT_PROFILES_API : '/rest/v1/client_profiles';
    const data = await fetchAPI(`${clientApi}?id=eq.${sess.clientId}&select=prof_style_tags,est_style_tags,name`);
    if (data?.[0] && typeof syncClientPrefsFromRecord === 'function') {
      syncClientPrefsFromRecord(data[0]);
    }
  } catch (e) {
    console.warn('Não foi possível carregar prefs do cliente:', e.message);
  }
}

async function initClientStyleFlow() {
  await loadClientPrefsFromSession();
  renderStyleBar();
  const prefs = typeof getStoredClientPrefs === 'function' ? getStoredClientPrefs() : { onboardingDone: false };
  const urlParams = new URLSearchParams(window.location.search);
  const hasDrawer = urlParams.get('professionalId') || urlParams.get('establishmentId');

  if (!hasDrawer && !prefs.onboardingDone) {
    setTimeout(() => abrirOnboardingEstilo(), 700);
  } else if (!hasDrawer && prefs.onboardingDone && (prefs.profTags?.length || prefs.estTags?.length)) {
    setTimeout(() => listarTodosProfissionais(), 400);
  }
}

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
}

function resetProfFilters() {
  activeStyleFiltersProf = [];
  activeSortFiltersProf = ['proximity', 'match'];
  DOM.profInput.value = '';
  termoProfAtual = '';
  renderTinderFilters('prof');
  renderPillsProf();
  renderSortToolbar('prof');
}

function resetEstFilters() {
  activeStyleFiltersEst = [];
  activeSortFiltersEst = ['proximity', 'match'];
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
  const activeList = type === 'prof' ? activeStyleFiltersProf : activeStyleFiltersEst;

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
  activeStyleFiltersProf = activeStyleFiltersProf.filter(t => t !== tag);
  renderTinderFilters('prof');
  renderPillsProf();
  if (isShowingProfResults) handleSearch();
}

function removeEstFilter(tag) {
  activeStyleFiltersEst = activeStyleFiltersEst.filter(t => t !== tag);
  renderTinderFilters('est');
  renderPillsEst();
  if (isShowingEstResults) handleSearch();
}

function toggleStyleFilterProf(el) {
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
    if (e.key === 'Enter') { e.preventDefault(); handleSearchProf(); }
  });
  DOM.estInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); handleSearchEst(); }
  });
  document.getElementById('btnBuscarProf')?.addEventListener('click', e => {
    e.preventDefault();
    handleSearchProf();
  });
  document.getElementById('btnBuscarEst')?.addEventListener('click', e => {
    e.preventDefault();
    handleSearchEst();
  });

  initClienteTabs();
  renderAllTinderFilters();
  renderAllSortToolbars();
  updateProfButtonState();
  updateEstButtonState();
  initClientLocationFlow();

  const urlParams = new URLSearchParams(window.location.search);
  const professionalId = urlParams.get('professionalId');
  const establishmentId = urlParams.get('establishmentId');
  if (professionalId) {
    setTimeout(() => {
      switchTab('prof');
      abrirDrawer('profissional', professionalId);
      if (window.history?.replaceState) {
        const newUrl = window.location.pathname + window.location.search
          .replace(/[?&]professionalId=[^&]*/, '')
          .replace(/[?&]token=[^&]*/, '');
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
    initClientStyleFlow();
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
  if (isShowingProfResults) {
    btn.textContent = '❌ Fechar';
    btn.classList.add('btn-danger');
  } else {
    btn.textContent = '📋 Listar todos';
    btn.classList.remove('btn-danger');
  }
}

function updateEstButtonState() {
  const btn = DOM.btnListarEst;
  if (isShowingEstResults) {
    btn.textContent = '❌ Fechar';
    btn.classList.add('btn-danger');
  } else {
    btn.textContent = '📋 Listar todos';
    btn.classList.remove('btn-danger');
  }
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
  fetchProfissionais(0, { listAll: true });
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
  updateProfButtonState();
}

function executarBuscaProf(pagina) {
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
  fetchProfissionais(pagina, { textTerm: termo, tags });
}

window.buscarProfissionais = function(pagina = 0) {
  activeTab = 'profissionais';
  executarBuscaProf(pagina);
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
      isShowingProfResults = false;
      updateProfButtonState();
      return;
    }

    const sorted = typeof aplicarOrdenacao === 'function'
      ? aplicarOrdenacao(data, activeSortFiltersProf, getUserPrefsProf(), 'prof')
      : data;

    totalProf = sorted.length;
    const pageData = sorted.slice(pagina * LIMITE, (pagina + 1) * LIMITE).map(p => {
      const insight = typeof buildMatchInsight === 'function'
        ? buildMatchInsight(p, 'prof', getMatchTagsProf())
        : null;
      return {
        ...p,
        _prooflyScore: typeof calcularProoflyScoreRapido === 'function' ? calcularProoflyScoreRapido(p, 'prof') : null,
        _matchPercent: insight?.percent ?? p._matchPercent,
        _matchInsight: insight
      };
    });
    renderProfissionais(pageData, pagina);
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
  fetchEstabelecimentos(0, { listAll: true });
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
  updateEstButtonState();
}

function executarBuscaEst(pagina) {
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
  fetchEstabelecimentos(pagina, { textTerm: termo, tags });
}

window.buscarEstabelecimentos = function(pagina = 0) {
  activeTab = 'estabelecimentos';
  executarBuscaEst(pagina);
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
      isShowingEstResults = false;
      updateEstButtonState();
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
    renderEstabelecimentos(pageData, pagina);
    isShowingEstResults = true;
    updateEstButtonState();
  } catch (e) {
    DOM.estList.innerHTML = emptyStateHTML('❌', 'Erro ao carregar', e.message);
    DOM.estPagination.innerHTML = '';
    console.error(e);
  }
}

// ========================================
// RENDERIZAÇÃO DOS RESULTADOS
// ========================================
function renderProfissionais(data, pagina) {
  const html = data.map(prof => ProfileCard.renderResultCard(prof, 'prof')).join('');
  DOM.profList.innerHTML = html;
  renderPagination(DOM.profPagination, pagina, totalProf, 'goToProfPage');
}

function renderEstabelecimentos(data, pagina) {
  const html = data.map(e => ProfileCard.renderResultCard(e, 'est')).join('');
  DOM.estList.innerHTML = html;
  renderPagination(DOM.estPagination, pagina, totalEst, 'goToEstPage');
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
      `/rest/v1/professionals?id=eq.${id}&select=*,current_establishment:establishments!professionals_current_establishment_id_fkey(id,name),profile:professional_profiles(*),music_tags,visual_tags,personality_tags,lifestyle_tags,work_tags,price_range,previous_workplaces,gallery_urls`
    );
    if (!profData.length) {
      DOM.drawerBody.innerHTML = '<p style="color:red;">Profissional não encontrado.</p>';
      return;
    }
    const prof = profData[0];
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

    html += '<div class="tinder-profile-content">';
    html += ProfileCard.renderSocialSignals(prooflyData.social, prof.id);
    html += ProfileCard.renderRatingBar(avgRating, totalReviews);
    html += ProfileCard.renderWhySection(strengths);
    if (prof.profile?.bio) {
      html += `<div class="tinder-section"><div class="tinder-section-title">Sobre</div><div class="tinder-section-bio">${escapeHtml(prof.profile.bio)}</div></div>`;
    }
    html += `<div class="tinder-stat-pill">📊 ${atendimentosLabel}</div>`;
    html += tagCategoriesForDrawer([
      { icon: '🎵', label: 'Música', tags: prof.music_tags },
      { icon: '👕', label: 'Visual', tags: prof.visual_tags },
      { icon: '🧠', label: 'Personalidade', tags: prof.personality_tags },
      { icon: '🌿', label: 'Estilo de Vida', tags: prof.lifestyle_tags },
      { icon: '💼', label: 'Trabalho', tags: prof.work_tags }
    ], matchInsight.sharedTags);
    html += ProfileCard.renderWorkHistory(workHistory, '💼 Experiência');

    html += '<div id="drawer-reviews-section">';
    const profReviewCtx = { entityType: 'prof', targetProfName: prof.name };
    html += ProfileCard.renderReviews(
      clientReviewsAll.slice(0, 5),
      `📝 Avaliações de Clientes (${totalReviews})`,
      profReviewCtx
    );

    const estabReviewsRaw = typeof filterReviewsByType === 'function'
      ? filterReviewsByType(allReviewsRaw, REVIEW_TYPES.ESTAB_TO_PROF).slice(0, 5)
      : (typeof fetchReviews === 'function'
        ? await fetchReviews(`professional_id=eq.${id}&review_type=eq.establishment_to_professional`, { limit: 5 })
        : []);
    html += ProfileCard.renderReviews(
      estabReviewsRaw,
      `🏢 Avaliações de Estabelecimentos (${estabReviewsRaw.length})`,
      profReviewCtx
    );
    html += '</div></div>';

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

    html += '<div class="tinder-profile-content">';
    html += ProfileCard.renderSocialSignals(prooflyData.social, e.id);
    html += ProfileCard.renderRatingBar(avgRating, totalReviews);
    html += ProfileCard.renderWhySection(strengths);
    if (e.description) {
      html += `<div class="tinder-section"><div class="tinder-section-title">Sobre o local</div><div class="tinder-section-bio">${escapeHtml(e.description)}</div></div>`;
    }
    html += tagCategoriesForDrawer([
      { icon: '🏗️', label: 'Infraestrutura', tags: e.infra_tags },
      { icon: '🎵', label: 'Música Ambiente', tags: e.music_tags },
      { icon: '💎', label: 'Posicionamento', tags: e.positioning_tags },
      { icon: '👥', label: 'Público', tags: e.audience_tags },
      { icon: '🌟', label: 'Vibe', tags: e.vibe_tags }
    ], matchInsight.sharedTags);

    const estReviewCtx = { entityType: 'est', establishmentId: id, targetEstName: e.name };
    html += '<div id="drawer-reviews-section">';
    html += ProfileCard.renderReviews(reviewsPage, `📝 Avaliações do local (${totalReviews})`, estReviewCtx);

    if (totalReviews > EST_REVIEWS_PER_PAGE) {
      const totalPages = Math.ceil(totalReviews / EST_REVIEWS_PER_PAGE);
      html += '<div class="pagination" style="margin-top:12px;">';
      if (currentPageEstReviews > 0) {
        html += `<button class="btn btn-outline btn-small" onclick="irPaginaEstReviews(${currentPageEstReviews - 1})">← Anterior</button>`;
      }
      html += `<span style="color:#94a3b8;font-size:13px;padding:0 8px;">${currentPageEstReviews + 1} / ${totalPages}</span>`;
      if (currentPageEstReviews < totalPages - 1) {
        html += `<button class="btn btn-outline btn-small" onclick="irPaginaEstReviews(${currentPageEstReviews + 1})">Próxima →</button>`;
      }
      html += '</div>';
    }
    html += '</div></div>';

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
    window.location.href = `login.html?intent=cliente&returnTo=${encodeURIComponent(window.location.pathname + '?professionalId=' + id)}`;
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
      <textarea id="avaliarCommentDrawer" placeholder="Deixe seu comentário..." style="width:100%;padding:10px;border:2px solid #e2e8f0;border-radius:12px;font-family:inherit;font-size:14px;resize:vertical;min-height:60px;background:#f8fafc;color:#0f172a;"></textarea>
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
      <textarea id="avaliarEstabCommentDrawer" placeholder="Deixe seu comentário sobre o estabelecimento..." style="width:100%;padding:10px;border:2px solid #e2e8f0;border-radius:12px;font-family:inherit;font-size:14px;resize:vertical;min-height:60px;background:#f8fafc;color:#0f172a;"></textarea>
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
  status.textContent = 'Iniciando câmera...';
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
      window.location.href = decodedText;
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