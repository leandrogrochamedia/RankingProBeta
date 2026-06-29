// =====================================================
// PROOFLY — Mercado de talentos (estabelecimento · estilo cliente.html)
// =====================================================

(function() {
  'use strict';

  let session = null;
  let establishment = null;
  let allProfs = [];
  let activeFilters = {};
  let sortBy = 'match';
  let searchTerm = '';
  const selectedIds = new Set();
  const MAX_REPORT = 5;
  const RECO_LIMIT = 12;
  const VIEW_MODE_KEY = 'proofly_contratar_view';
  const VIEW_MODES = ['lista', 'grade', 'cards'];
  const API_PAGE_SIZE = 50;
  const RENDER_BATCH = { lista: 18, grade: 24, cards: 6 };

  let drawerId = null;
  let listViewMode = 'lista';
  let filteredList = [];
  let renderedCount = 0;
  let apiOffset = 0;
  let apiExhausted = false;
  let loadingMore = false;
  let scrollObserver = null;

  const FILTER_MAP = {
    disponivelAgora: { disponivelAgora: true },
    abertoContratacao: { abertoContratacao: true },
    minAnos5: { minAnos: 5 },
    minCarteira20: { minCarteira: 20 },
    minIGV60: { minIGV: 60 },
    styleHipHop: { styleTags: ['Hip Hop'] },
    styleStreetwear: { styleTags: ['Streetwear'] }
  };

  const MATCH_TIER_MAP = { high: 'hot', mid: 'warm', low: 'cool' };
  const SORT_LABELS = {
    match: 'melhor match com seu negócio',
    roi: 'maior ROI estimado',
    igv: 'maior IGV',
    carteira: 'maior carteira de clientes',
    rating: 'melhor nota'
  };

  function prepProfForDisplay(prof) {
    const match = prof._contratanteMatch;
    if (!match) return prof;
    return {
      ...prof,
      _matchInsight: {
        percent: match.percent,
        headline: match.headline || '',
        subline: (match.sharedTags || []).slice(0, 2).join(' · '),
        sharedTags: match.sharedTags || [],
        tier: MATCH_TIER_MAP[match.tier] || (match.percent >= 80 ? 'hot' : match.percent >= 55 ? 'warm' : 'cool')
      },
      _matchPercent: match.percent
    };
  }

  async function loadEstablishment() {
    const estId = session.establishmentId;
    if (!estId) return null;
    try {
      const data = await fetchAPI(
        `/rest/v1/establishments?id=eq.${estId}&select=id,name,city,music_tags,infra_tags,positioning_tags,audience_tags,vibe_tags,style_tags,tags`
      );
      return data?.[0] || null;
    } catch {
      return null;
    }
  }

  function professionalsSelectFields() {
    return [
      'id', 'name', 'specialty', 'avatar_url', 'avg_rating', 'total_reviews', 'price_range',
      'music_tags', 'visual_tags', 'personality_tags', 'work_tags', 'style_tags', 'tags',
      'availability', 'available_now', 'seeking_work', 'salary_expectation',
      'average_job_duration_months', 'work_style_tags',
      'client_portfolio_count', 'igv_score', 'current_establishment_id',
      'profile:professional_profiles(years_experience,specialty)',
      'current_establishment:establishments!professionals_current_establishment_id_fkey(id,name,city,neighborhood)'
    ].join(',');
  }

  function enrichProfessionalRow(p) {
    let enriched = enrichProfWithTalentMetrics(p);
    if (p.igv_score != null && enriched._talentMetrics) {
      enriched._talentMetrics.igv = Number(p.igv_score);
    }
    if (p.client_portfolio_count != null && enriched._talentMetrics?.carteira) {
      enriched._talentMetrics.carteira.total = p.client_portfolio_count;
      enriched._talentMetrics.carteiraLabel = formatCarteiraLabel({ total: p.client_portfolio_count });
    }
    if (typeof enrichProfForContratante === 'function') {
      enriched = enrichProfForContratante(enriched, establishment);
    }
    return enriched;
  }

  async function fetchProfessionalsPage() {
    if (apiExhausted) return [];
    const select = professionalsSelectFields();
    const data = await fetchAPI(
      `/rest/v1/professionals?is_active=eq.true&current_establishment_id=is.null&select=${select}&order=created_at.desc&limit=${API_PAGE_SIZE}&offset=${apiOffset}`
    );
    if (!data?.length) {
      apiExhausted = true;
      return [];
    }
    if (data.length < API_PAGE_SIZE) apiExhausted = true;
    apiOffset += data.length;
    return data.map(enrichProfessionalRow);
  }

  async function loadProfessionals() {
    try {
      apiOffset = 0;
      apiExhausted = false;
      allProfs = await fetchProfessionalsPage();
      renderAlerts();
      renderTopCarousel();
      renderResults();
      updateDecisionHub(buildFilteredList().length);
    } catch (e) {
      teardownInfiniteScroll();
      document.getElementById('contratarResults').innerHTML =
        `<p style="color:#f87171;">Erro: ${escapeHtml(e.message)}</p>`;
    }
  }

  async function fetchMoreProfessionals() {
    if (apiExhausted || loadingMore) return;
    loadingMore = true;
    updateLoadStatus();
    try {
      const chunk = await fetchProfessionalsPage();
      if (!chunk.length) return;
      allProfs = [...allProfs, ...chunk];
      renderAlerts();
      renderTopCarousel();
      filteredList = buildFilteredList();
      appendResultsBatch();
      updateDecisionHub(filteredList.length);
      updateResultsSub(filteredList.length, renderedCount);
    } catch (e) {
      console.error(e);
    } finally {
      loadingMore = false;
      updateLoadStatus();
      scheduleScrollCheck();
    }
  }

  function renderAlerts() {
    const el = document.getElementById('contratarAlerts');
    if (!el || typeof getTalentAlerts !== 'function') return;
    const alerts = getTalentAlerts(allProfs, { minIGV: 60, limit: 5 })
      .map(p => enrichProfForContratante(p, establishment));
    el.innerHTML = renderTalentAlertsHtml(alerts, establishment?.name);
    el.querySelectorAll('.talent-alert-item').forEach((item, i) => {
      const prof = alerts[i];
      if (!prof?.id) return;
      item.style.cursor = 'pointer';
      item.addEventListener('click', () => window.abrirDrawer('profissional', prof.id));
    });
  }

  function formatMarketAvailabilityLabel(total, showing) {
    const n = Math.max(0, Number(total) || 0);
    const shown = Math.min(showing || RECO_LIMIT, n);
    const rounded = n >= 50 ? 50 : n >= 40 ? 40 : n >= 25 ? 25 : n >= 10 ? 10 : n;
    const qty = n > rounded ? `Mais de ${rounded}` : `${n}`;
    const noun = n === 1 ? 'profissional autônomo' : 'profissionais autônomos';
    const live = allProfs.filter(p => p._talentMetrics?.disponivelAgora || p.available_now).length;
    const liveBit = live > 0 ? ` · <strong>${live}</strong> disponíveis agora` : '';
    return `${qty} ${noun} no mercado${liveBit} · exibindo os <strong>${shown}</strong> com melhor match`;
  }

  function renderTopCarousel() {
    const track = document.getElementById('recoTrackTalent');
    const sub = document.getElementById('recoCarouselSub');
    const countEl = document.getElementById('recoCarouselCount');
    if (!track) return;
    const total = allProfs.length;
    if (countEl) {
      countEl.innerHTML = formatMarketAvailabilityLabel(total, RECO_LIMIT);
    }
    if (sub) {
      const estName = establishment?.name ? escapeHtml(establishment.name) : 'seu estabelecimento';
      sub.textContent = total
        ? `Só autônomos — ranking personalizado para ${establishment?.name || 'seu negócio'}`
        : 'Nenhum autônomo cadastrado no mercado ainda';
    }
    const top = [...allProfs]
      .sort((a, b) => (b._contratanteMatch?.percent ?? 0) - (a._contratanteMatch?.percent ?? 0))
      .slice(0, RECO_LIMIT)
      .map(prepProfForDisplay);

    if (!top.length) {
      track.innerHTML = '<div class="reco-carousel-empty">Nenhuma recomendação no momento.</div>';
      return;
    }
    if (typeof ProfileCard === 'undefined' || typeof ProfileCard.renderMiniRecoCard !== 'function') {
      track.innerHTML = '<div class="reco-carousel-empty">Carregando cards...</div>';
      return;
    }
    track.innerHTML = top.map(p => ProfileCard.renderMiniRecoCard(p, 'prof')).join('');
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

  function buildFilterState() {
    const state = { searchTerm: searchTerm.trim() };
    Object.keys(activeFilters).forEach(key => {
      if (!activeFilters[key]) return;
      Object.assign(state, FILTER_MAP[key] || {});
    });
    return state;
  }

  function sortProfessionals(list) {
    const arr = [...list];
    arr.sort((a, b) => {
      const ma = a._talentMetrics;
      const mb = b._talentMetrics;
      if (sortBy === 'match') {
        return (b._contratanteMatch?.percent ?? 0) - (a._contratanteMatch?.percent ?? 0);
      }
      if (sortBy === 'roi') {
        return (b._roiEstimado?.index ?? 0) - (a._roiEstimado?.index ?? 0);
      }
      if (sortBy === 'igv') return (mb?.igv ?? b.igv_score ?? 0) - (ma?.igv ?? a.igv_score ?? 0);
      if (sortBy === 'carteira') {
        return (b.client_portfolio_count ?? mb?.carteira?.total ?? 0) - (a.client_portfolio_count ?? ma?.carteira?.total ?? 0);
      }
      if (sortBy === 'rating') return (Number(b.avg_rating) || 0) - (Number(a.avg_rating) || 0);
      return 0;
    });
    return arr;
  }

  function toggleSelect(id, checked) {
    if (checked) {
      if (selectedIds.size >= MAX_REPORT) {
        showAlert?.('⚠️ Limite', `Selecione no máximo ${MAX_REPORT} profissionais para o relatório.`);
        return false;
      }
      selectedIds.add(id);
    } else {
      selectedIds.delete(id);
    }
    updateReportButton();
    updateDecisionHub();
    syncSelectUI(id);
    return true;
  }

  function updateDecisionHub(filteredCount) {
    const stats = document.getElementById('contratarDecisionStats');
    const chips = document.getElementById('contratarShortlistChips');
    const total = allProfs.length;
    const shown = filteredCount != null ? filteredCount : total;
    if (stats) {
      stats.innerHTML = `
        <div class="contratar-stat"><span class="contratar-stat-val">${shown}</span><span class="contratar-stat-lbl">candidatos</span></div>
        <div class="contratar-stat"><span class="contratar-stat-val">${selectedIds.size}</span><span class="contratar-stat-lbl">na shortlist</span></div>
        <div class="contratar-stat"><span class="contratar-stat-val">${MAX_REPORT}</span><span class="contratar-stat-lbl">máx. PDF</span></div>
      `;
    }
    if (chips) {
      if (!selectedIds.size) {
        chips.innerHTML = '<span class="contratar-shortlist-empty">Nenhum candidato na shortlist — marque 📄 nos candidatos para comparar</span>';
        return;
      }
      const selected = allProfs.filter(p => selectedIds.has(p.id));
      chips.innerHTML = selected.map(p => {
        const m = p._contratanteMatch?.percent;
        return `<button type="button" class="contratar-shortlist-chip" onclick="abrirDrawer('profissional','${p.id}')">
          <span class="contratar-shortlist-name">${escapeHtml(p.name)}</span>
          ${m != null ? `<span class="contratar-shortlist-match">${m}%</span>` : ''}
          <span class="contratar-shortlist-remove" onclick="event.stopPropagation();contratarToggleSelect('${p.id}')" aria-label="Remover">✕</span>
        </button>`;
      }).join('');
    }
  }

  function syncSelectUI(id) {
    document.querySelectorAll(`.contratar-select-cb[data-id="${id}"]`).forEach(cb => {
      cb.checked = selectedIds.has(id);
    });
    document.querySelectorAll(`#contratarResults [data-id="${id}"]`).forEach(wrap => {
      wrap.classList.toggle('selected', selectedIds.has(id));
    });
  }

  function updateReportButton() {
    const btn = document.getElementById('btnGerarRelatorio');
    const hint = document.getElementById('relatorioHint');
    if (btn) btn.disabled = selectedIds.size === 0;
    if (hint) {
      hint.textContent = selectedIds.size
        ? `${selectedIds.size} na shortlist — pronto para gerar relatório PDF comparativo`
        : 'Marque candidatos para comparar e gerar relatório PDF';
    }
  }

  function loadListViewMode() {
    try {
      const saved = localStorage.getItem(VIEW_MODE_KEY);
      if (VIEW_MODES.includes(saved)) listViewMode = saved;
    } catch { /* noop */ }
  }

  function updateViewToggleUI() {
    document.querySelectorAll('.contratar-view-pill').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === listViewMode);
    });
  }

  function setListViewMode(mode) {
    if (!VIEW_MODES.includes(mode)) return;
    listViewMode = mode;
    try { localStorage.setItem(VIEW_MODE_KEY, mode); } catch { /* noop */ }
    updateViewToggleUI();
    renderResults();
  }

  function buildFilteredList() {
    const filters = buildFilterState();
    let list = allProfs.filter(p => passesContratanteFilters(p, filters));
    return sortProfessionals(list);
  }

  function getRenderItemFn() {
    if (listViewMode === 'cards') return renderContratarCardWrap;
    if (listViewMode === 'grade') return renderContratarGridCell;
    return renderContratarDecisionRow;
  }

  function getRenderBatchSize() {
    return RENDER_BATCH[listViewMode] || RENDER_BATCH.lista;
  }

  function applyResultsListClass(itemsEl) {
    if (!itemsEl) return;
    itemsEl.classList.remove(
      'contratar-results-items',
      'contratar-decision-list',
      'contratar-decision-grid',
      'contratar-decision-cards',
      'tinder-results'
    );
    itemsEl.classList.add('contratar-results-items');
    if (listViewMode === 'cards') {
      itemsEl.classList.add('contratar-decision-cards', 'tinder-results');
    } else if (listViewMode === 'grade') {
      itemsEl.classList.add('contratar-decision-grid');
    } else {
      itemsEl.classList.add('contratar-decision-list');
    }
  }

  function updateResultsSub(total, visible) {
    const sub = document.getElementById('contratarResultsSub');
    if (!sub) return;
    const sortLbl = SORT_LABELS[sortBy] || sortBy;
    const base = establishment?.name
      ? `${total} candidato${total === 1 ? '' : 's'} · ${sortLbl} · vs ${establishment.name}`
      : `${total} candidato${total === 1 ? '' : 's'} · ${sortLbl}`;
    sub.textContent = visible < total ? `${base} · exibindo ${visible}` : base;
  }

  function updateLoadStatus() {
    const status = document.getElementById('contratarLoadStatus');
    if (!status) return;
    if (loadingMore) {
      status.textContent = 'Carregando mais profissionais...';
      status.className = 'contratar-load-status is-loading';
      return;
    }
    if (renderedCount < filteredList.length) {
      status.textContent = `Exibindo ${renderedCount} de ${filteredList.length} — role para ver mais`;
      status.className = 'contratar-load-status';
      return;
    }
    if (!apiExhausted) {
      status.textContent = 'Buscando mais profissionais no mercado...';
      status.className = 'contratar-load-status';
      return;
    }
    status.textContent = filteredList.length
      ? `Todos os ${filteredList.length} candidatos carregados`
      : '';
    status.className = 'contratar-load-status is-done';
  }

  function teardownInfiniteScroll() {
    if (scrollObserver) {
      scrollObserver.disconnect();
      scrollObserver = null;
    }
  }

  function setupInfiniteScroll() {
    teardownInfiniteScroll();
    const sentinel = document.getElementById('contratarLoadSentinel');
    if (!sentinel) return;
    scrollObserver = new IntersectionObserver(entries => {
      if (!entries[0]?.isIntersecting || loadingMore) return;
      onResultsScrollEnd();
    }, { root: null, rootMargin: '280px', threshold: 0 });
    scrollObserver.observe(sentinel);
  }

  function onResultsScrollEnd() {
    if (renderedCount < filteredList.length) {
      appendResultsBatch();
      return;
    }
    if (!apiExhausted) fetchMoreProfessionals();
  }

  function scheduleScrollCheck() {
    requestAnimationFrame(() => {
      const sentinel = document.getElementById('contratarLoadSentinel');
      if (!sentinel || loadingMore) return;
      const rect = sentinel.getBoundingClientRect();
      if (rect.top <= window.innerHeight + 300) onResultsScrollEnd();
    });
  }

  function appendResultsBatch() {
    const itemsEl = document.getElementById('contratarResultsItems');
    if (!itemsEl || renderedCount >= filteredList.length) return;
    const renderItem = getRenderItemFn();
    const batch = filteredList.slice(renderedCount, renderedCount + getRenderBatchSize());
    if (!batch.length) return;
    itemsEl.insertAdjacentHTML('beforeend', batch.map(renderItem).join(''));
    renderedCount += batch.length;
    updateResultsSub(filteredList.length, renderedCount);
    updateLoadStatus();
    scheduleScrollCheck();
  }

  function initResultsDelegation() {
    const el = document.getElementById('contratarResults');
    if (!el || el.dataset.delegateBound) return;
    el.dataset.delegateBound = '1';
    el.addEventListener('change', e => {
      const cb = e.target.closest('.contratar-select-cb');
      if (!cb) return;
      const ok = toggleSelect(cb.dataset.id, cb.checked);
      if (!ok) cb.checked = false;
    });
  }

  function renderContratarGridCell(prof) {
    const display = prepProfForDisplay(prof);
    const id = prof.id;
    const checked = selectedIds.has(id) ? 'checked' : '';
    const selectedClass = selectedIds.has(id) ? ' selected' : '';
    const mini = ProfileCard?.renderMiniRecoCard?.(display, 'prof')
      || '<div class="reco-carousel-empty">Card indisponível</div>';
    const hireQuick = typeof HiringFlow !== 'undefined'
      ? `<button type="button" class="contratar-grid-hire" onclick="event.stopPropagation();HiringFlow.openProposalModal('${id}')" title="Propor contratação">🤝</button>`
      : '';
    return `
      <div class="contratar-grid-cell${selectedClass}" data-id="${id}">
        <label class="contratar-grid-select" onclick="event.stopPropagation();" title="Incluir na shortlist / PDF">
          <input type="checkbox" class="contratar-select-cb" data-id="${id}" ${checked} aria-label="Selecionar para shortlist" />
          <span>📄</span>
        </label>
        ${hireQuick}
        ${mini}
      </div>
    `;
  }

  function renderContratarCardWrap(prof) {
    const display = prepProfForDisplay(prof);
    const card = ProfileCard.renderResultCard(display, 'prof');
    const checked = selectedIds.has(prof.id) ? 'checked' : '';
    const selectedClass = selectedIds.has(prof.id) ? ' selected' : '';
    const hireQuick = typeof HiringFlow !== 'undefined'
      ? `<button type="button" class="contratar-hire-quick" onclick="event.stopPropagation();HiringFlow.openProposalModal('${prof.id}')" title="Propor contratação">🤝</button>`
      : '';
    const matchDbg = window.PROOFLY_DEBUG?.isMatchDebugOn?.() && window.PROOFLY_DEBUG?.renderContratanteMatchDebugHtml
      ? PROOFLY_DEBUG.renderContratanteMatchDebugHtml(prof, establishment)
      : '';
    const roi = prof._roiEstimado;
    const match = prof._contratanteMatch;
    const decisionRibbon = match ? `
      <div class="contratar-decision-ribbon" onclick="event.stopPropagation();">
        <span class="contratar-ribbon-match">🎯 ${match.percent}%</span>
        ${roi ? `<span class="contratar-ribbon-roi">📈 ROI ${roi.index}</span>` : ''}
        <span class="contratar-ribbon-hint">${escapeHtml((match.sharedTags || []).slice(0, 2).join(' · ') || match.headline || '')}</span>
      </div>
    ` : '';
    return `
      <div class="contratar-card-wrap${selectedClass}" data-id="${prof.id}">
        <label class="contratar-select-badge" onclick="event.stopPropagation();" title="Incluir na shortlist / PDF">
          <input type="checkbox" class="contratar-select-cb" data-id="${prof.id}" ${checked} aria-label="Selecionar para shortlist" />
          <span>📄</span>
        </label>
        ${hireQuick}
        ${decisionRibbon}
        ${card}
        ${matchDbg}
      </div>
    `;
  }

  function avatarUrlForProf(prof) {
    const photos = ProfileCard?.getPhotos?.(prof) || [];
    const raw = photos[0] || prof.avatar_url;
    return typeof getAvatarUrl === 'function' ? getAvatarUrl(raw) : (raw || '');
  }

  function renderContratarDecisionRow(prof) {
    const id = prof.id;
    const name = prof.name || 'Sem nome';
    const initial = name.charAt(0).toUpperCase();
    const src = avatarUrlForProf(prof);
    const specialty = prof.profile?.specialty || prof.specialty || 'Profissional';
    const avg = prof.avg_rating ? Number(prof.avg_rating).toFixed(1) : '—';
    const checked = selectedIds.has(id) ? 'checked' : '';
    const selectedClass = selectedIds.has(id) ? ' selected' : '';
    const hireQuick = typeof HiringFlow !== 'undefined'
      ? `<button type="button" class="contratar-row-hire" onclick="HiringFlow.openProposalModal('${id}')" title="Propor contratação">🤝</button>`
      : '';
    const matchDbg = window.PROOFLY_DEBUG?.isMatchDebugOn?.() && window.PROOFLY_DEBUG?.renderContratanteMatchDebugHtml
      ? `<div class="contratar-row-debug">${PROOFLY_DEBUG.renderContratanteMatchDebugHtml(prof, establishment)}</div>`
      : '';
    const roi = prof._roiEstimado;
    const match = prof._contratanteMatch;
    const metrics = prof._talentMetrics;
    const igv = metrics?.igv ?? prof.igv_score;
    const carteira = prof.client_portfolio_count ?? metrics?.carteira?.total;
    const matchTier = MATCH_TIER_MAP[match?.tier] || (match?.percent >= 80 ? 'hot' : match?.percent >= 55 ? 'warm' : 'cool');
    const sharedHint = (match?.sharedTags || []).slice(0, 2).join(' · ') || match?.headline || '';
    const disponivel = metrics?.disponivelAgora || prof.available_now;
    const igvHtml = igv != null && typeof renderIGVBadge === 'function'
      ? renderIGVBadge(igv, 'sm')
      : (igv != null ? `<span class="contratar-row-metric contratar-row-igv">💰 ${Math.round(igv)}</span>` : '');

    const statusLabel = disponivel ? '🟢 Disponível' : (metrics?.abertoContratacao || prof.seeking_work ? '🔓 Aberto' : '');

    return `
      <article class="contratar-decision-row${selectedClass}" data-id="${id}" role="button" tabindex="0"
        onclick="abrirDrawer('profissional','${id}')"
        onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();abrirDrawer('profissional','${id}');}">
        <label class="contratar-row-select" onclick="event.stopPropagation();" title="Incluir na shortlist / PDF">
          <input type="checkbox" class="contratar-select-cb" data-id="${id}" ${checked} aria-label="Selecionar para shortlist" />
          <span class="contratar-row-select-icon">📄</span>
        </label>
        ${match ? `<div class="contratar-row-match-hero contratar-row-match--${matchTier}" aria-label="Match ${match.percent}%"><span class="match-hero-pct">${match.percent}%</span><span class="match-hero-lbl">match</span></div>` : '<div class="contratar-row-match-hero contratar-row-match--cool"><span class="match-hero-pct">—</span></div>'}
        <div class="contratar-row-avatar">
          <img src="${src}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
          <div class="contratar-row-avatar-fallback" style="display:none;">${initial}</div>
        </div>
        <div class="contratar-row-main">
          <div class="contratar-row-head">
            <span class="contratar-row-name">${escapeHtml(name)}</span>
            ${statusLabel ? `<span class="contratar-row-live">${statusLabel}</span>` : ''}
          </div>
          <div class="contratar-row-metrics contratar-row-metrics--compact" onclick="event.stopPropagation();">
            ${igvHtml}
            ${carteira ? `<span class="contratar-row-metric contratar-row-carteira" title="Carteira de clientes">👥 ${carteira}</span>` : ''}
          </div>
        </div>
        <div class="contratar-row-actions" onclick="event.stopPropagation();">
          ${hireQuick}
          <button type="button" class="contratar-row-open" onclick="abrirDrawer('profissional','${id}')" aria-label="Ver perfil">→</button>
        </div>
        ${matchDbg}
      </article>
    `;
  }

  function renderResults() {
    const el = document.getElementById('contratarResults');
    if (!el) return;

    filteredList = buildFilteredList();
    renderedCount = 0;
    teardownInfiniteScroll();

    if (!filteredList.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🔍</div><p class="empty-state-title">Nenhum candidato neste filtro</p><p class="empty-state-desc">Ajuste os filtros ou explore o mercado completo.</p></div>`;
      updateResultsSub(0, 0);
      updateDecisionHub(0);
      return;
    }

    el.innerHTML = `
      <div class="contratar-results-items" id="contratarResultsItems"></div>
      <div class="contratar-results-footer" id="contratarResultsFooter">
        <div class="contratar-load-sentinel" id="contratarLoadSentinel" aria-hidden="true"></div>
        <p class="contratar-load-status" id="contratarLoadStatus"></p>
      </div>
    `;

    const itemsEl = document.getElementById('contratarResultsItems');
    applyResultsListClass(itemsEl);
    appendResultsBatch();
    setupInfiniteScroll();
    updateReportButton();
    updateDecisionHub(filteredList.length);

    if (window.PROOFLY_DEBUG?.isMatchDebugOn?.() && filteredList[0] && establishment) {
      PROOFLY_DEBUG.logContratanteMatch?.(filteredList[0], establishment);
    }
  }

  window.renderContratarResults = renderResults;
  window.renderContratarCarousel = renderTopCarousel;

  function gerarRelatorio() {
    if (!selectedIds.size) return;
    const selected = allProfs.filter(p => selectedIds.has(p.id));
    try {
      sessionStorage.setItem('proofly_relatorio_contratante', JSON.stringify({
        profIds: [...selectedIds],
        establishmentId: establishment?.id || session.establishmentId,
        establishmentName: establishment?.name || session.name
      }));
    } catch { /* noop */ }
    if (typeof abrirRelatorioContratante === 'function') {
      abrirRelatorioContratante(establishment || { name: session.name || 'Estabelecimento' }, selected);
      return;
    }
    window.location.href = './relatorio-contratante.html';
  }

  function setDrawerActions(html) {
    const el = document.getElementById('drawerActions');
    if (el) el.innerHTML = html || '';
  }

  window.fecharDrawer = function() {
    drawerId = null;
    document.getElementById('drawer')?.classList.remove('open');
    document.getElementById('drawerOverlay')?.classList.remove('active');
    document.body.style.overflow = '';
    setDrawerActions('');
  };

  window.abrirDrawer = function(tipo, id) {
    if (tipo !== 'profissional') {
      window.location.href = `./perfil-page.html?tipo=${encodeURIComponent(tipo)}&id=${encodeURIComponent(id)}`;
      return;
    }
    drawerId = id;
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('drawerOverlay');
    const body = document.getElementById('drawerBody');
    drawer?.classList.add('open');
    overlay?.classList.add('active');
    document.body.style.overflow = 'hidden';
    body.innerHTML = '<div class="loading" style="padding:48px 24px;text-align:center;">Carregando perfil...</div>';
    setDrawerActions('');
    if (typeof incrementProfileView === 'function') incrementProfileView(id, 'prof');
    carregarPerfilProfissional(id);
  };

  window.contratarToggleSelect = function(id) {
    const next = !selectedIds.has(id);
    toggleSelect(id, next);
    if (drawerId === id) refreshDrawerSelectAction(id);
  };

  function refreshDrawerSelectAction(id) {
    const selected = selectedIds.has(id);
    const hireBtn = typeof HiringFlow !== 'undefined' && HiringFlow.renderDrawerHiringActions
      ? HiringFlow.renderDrawerHiringActions(id)
      : `<button type="button" class="btn btn-tinder-primary btn-tinder-xl" onclick="HiringFlow.openProposalModal('${id}')">🤝 Propor contratação</button>`;
    setDrawerActions(`
      <div class="drawer-actions-inner" style="display:flex;flex-direction:column;gap:10px;">
        ${hireBtn}
        <button type="button" class="btn btn-outline btn-tinder-xl" onclick="contratarToggleSelect('${id}')">
          ${selected ? '✓ No relatório PDF' : '📄 Incluir no relatório PDF'}
        </button>
        <a href="./perfil-page.html?tipo=profissional&id=${id}" class="btn btn-outline btn-tinder-xl" style="text-decoration:none;text-align:center;">Ver página completa →</a>
      </div>
    `);
  }

  async function carregarPerfilProfissional(id) {
    const body = document.getElementById('drawerBody');
    try {
      const profData = await fetchAPI(
        `/rest/v1/professionals?id=eq.${id}&select=*,current_establishment:establishments!professionals_current_establishment_id_fkey(id,name),profile:professional_profiles(*),music_tags,visual_tags,personality_tags,lifestyle_tags,work_tags,work_style_tags,price_range,previous_workplaces,gallery_urls,salary_expectation,average_job_duration_months,client_portfolio_count,igv_score,available_now,seeking_work`
      );
      if (!profData.length) {
        body.innerHTML = '<p style="color:red;">Profissional não encontrado.</p>';
        return;
      }
      let prof = enrichProfWithTalentMetrics(profData[0]);
      if (typeof enrichProfForContratante === 'function') {
        prof = enrichProfForContratante(prof, establishment);
      }
      const match = prof._contratanteMatch;
      const matchInsight = match ? {
        percent: match.percent,
        headline: match.headline || '',
        subline: (match.sharedTags || []).slice(0, 2).join(' · '),
        sharedTags: match.sharedTags || [],
        tier: MATCH_TIER_MAP[match.tier] || 'cool'
      } : { percent: 0, sharedTags: [], headline: '', subline: '', tier: 'cool' };

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
      if (prof.current_establishment?.name) heroLines.push(`📍 ${escapeHtml(prof.current_establishment.name)}`);
      else heroLines.push('📍 Autônomo');
      if (prof.profile?.years_experience) heroLines.push(`⏳ ${prof.profile.years_experience} anos de experiência`);
      if (prof.salary_expectation) heroLines.push(`💵 ${escapeHtml(prof.salary_expectation)}`);
      if (prof._roiEstimado) heroLines.push(`📈 ROI ${prof._roiEstimado.index} — ${escapeHtml(prof._roiEstimado.label)}`);

      const photos = getProfilePhotos(prof);
      let html = '';
      if (establishment && typeof renderContratanteMatchBlock === 'function') {
        html += renderContratanteMatchBlock(prof, establishment);
      }
      html += ProfileCard.renderHero({
        name: prof.name,
        subtitle: prof.profile?.specialty || prof.specialty || 'Profissional',
        lines: heroLines,
        avatarUrl: prof.avatar_url,
        photos,
        entityId: prof.id,
        matchPercent: matchInsight.percent,
        matchInsight,
        prooflyScore: prooflyData.score,
        badges,
        type: 'prof',
        avgRating,
        totalReviews
      });

      const estabReviewsRaw = typeof filterReviewsByType === 'function'
        ? filterReviewsByType(allReviewsRaw, REVIEW_TYPES.ESTAB_TO_PROF).slice(0, 5)
        : [];
      const profReviewCtx = { entityType: 'prof', targetProfName: prof.name };
      html += ProfileCard.buildProfessionalProfileBody({
        prof, matchInsight, prooflyData, allReviewsRaw, clientReviewsAll,
        estabReviewsRaw, avgRating, totalReviews, strengths, workHistory, profReviewCtx
      });

      if (window.PROOFLY_DEBUG?.isMatchDebugOn?.() && establishment) {
        html += PROOFLY_DEBUG.renderContratanteMatchDebugHtml?.(prof, establishment) || '';
        PROOFLY_DEBUG.logContratanteMatch?.(prof, establishment);
      }
      body.innerHTML = html;
      window._hiringDrawerProf = prof;
      window._hiringDrawerEst = establishment;
      refreshDrawerSelectAction(id);
    } catch (e) {
      body.innerHTML = `<p style="color:red;">Erro: ${e.message}</p>`;
      console.error(e);
    }
  }

  function bindUI() {
    document.getElementById('btnContratarBuscar')?.addEventListener('click', () => {
      searchTerm = document.getElementById('contratarSearch').value;
      renderResults();
    });
    document.getElementById('contratarSearch')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        searchTerm = e.target.value;
        renderResults();
      }
    });

    document.querySelectorAll('.contratar-filter-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.filter;
        activeFilters[key] = !activeFilters[key];
        btn.classList.toggle('active', !!activeFilters[key]);
        renderResults();
      });
    });

    document.querySelectorAll('.sort-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        sortBy = btn.dataset.sort;
        document.querySelectorAll('.sort-pill').forEach(b => b.classList.toggle('active', b === btn));
        renderResults();
      });
    });

    document.querySelectorAll('.contratar-view-pill').forEach(btn => {
      btn.addEventListener('click', () => setListViewMode(btn.dataset.view));
    });

    document.getElementById('btnGerarRelatorio')?.addEventListener('click', gerarRelatorio);
    initResultsDelegation();
    initRecoCarouselArrows();
  }

  async function bootContratarPage() {
    session = typeof getSession === 'function' ? getSession() : null;
    if (!session?.userId) {
      window.location.href = './login.html?intent=establishment&returnTo=estabelecimento-marketplace.html';
      return;
    }
    if (typeof enforceProfileGuard === 'function') {
      const current = typeof getActiveProfileType === 'function' ? getActiveProfileType(session) : null;
      if (!current && (session.role === 'estabelecimento' || session.provider === 'dev-simulation')) {
        if (typeof setActiveProfileType === 'function') setActiveProfileType('establishment');
      }
      if (!enforceProfileGuard('establishment')) return;
    } else if (session.role !== 'estabelecimento' && session.role !== 'admin' && session.provider !== 'dev-simulation') {
      window.location.href = './login.html?intent=establishment';
      return;
    }

    establishment = await loadEstablishment();
    loadListViewMode();
    bindUI();
    updateViewToggleUI();
    await loadProfessionals();
    try {
      const openId = sessionStorage.getItem('proofly_open_prof');
      if (openId) {
        sessionStorage.removeItem('proofly_open_prof');
        setTimeout(() => window.abrirDrawer('profissional', openId), 400);
      }
    } catch { /* noop */ }
  }

  let initialized = false;
  window.initContratarPage = async function() {
    if (initialized) return;
    initialized = true;
    await bootContratarPage();
  };
})();