// ============================================================
// PROOFLY — Profile Card (Tinder-like + Hyper Reputation)
// ============================================================

(function(global) {
  'use strict';

  function sharkUI() {
    return typeof isSharkMode === 'function' ? isSharkMode() : (typeof SHARK_MODE !== 'undefined' && !!SHARK_MODE);
  }

  const FAV_KEY = 'proofly_favorites';

  function esc(str) {
    return typeof escapeHtml === 'function' ? escapeHtml(str) : String(str || '');
  }

  function avatarSrc(url, item) {
    let u = url;
    if ((!u || !String(u).trim()) && item && typeof getProfilePhotos === 'function') {
      const photos = getProfilePhotos(item);
      u = photos[0] || u;
    }
    return typeof getAvatarUrl === 'function' ? getAvatarUrl(u) : (u || '');
  }

  function stars(rating) {
    return typeof renderStars === 'function' ? renderStars(Math.round(rating || 0)) : '☆☆☆☆☆';
  }

  function tagChip(tag) {
    return typeof renderTagWithEmoji === 'function' ? renderTagWithEmoji(tag) : `<span class="style-chip">${esc(tag)}</span>`;
  }

  function getFavorites() {
    try {
      return JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
    } catch { return []; }
  }

  function isFavorite(type, id) {
    return getFavorites().some(f => f.type === type && String(f.id) === String(id));
  }

  function toggleFavorite(type, id, name, btn) {
    let favs = getFavorites();
    const idx = favs.findIndex(f => f.type === type && String(f.id) === String(id));
    if (idx >= 0) {
      favs.splice(idx, 1);
      if (btn) {
        btn.classList.remove('active');
        btn.innerHTML = btn.dataset.labelOff || '🤍 Favoritar';
      }
    } else {
      favs.push({ type, id, name, savedAt: Date.now() });
      if (btn) {
        btn.classList.add('active');
        btn.innerHTML = btn.dataset.labelOn || '❤️ Favoritado';
      }
    }
    localStorage.setItem(FAV_KEY, JSON.stringify(favs));
  }

  function mockDistance(id) {
    let hash = 0;
    const s = String(id || '');
    for (let i = 0; i < s.length; i++) hash = ((hash << 5) - hash) + s.charCodeAt(i);
    return (Math.abs(hash) % 12) + 1;
  }

  function collectTags(item, type) {
    if (type === 'prof') {
      return [
        ...(item.music_tags || []),
        ...(item.visual_tags || []),
        ...(item.personality_tags || []),
        ...(item.lifestyle_tags || []),
        ...(item.work_tags || [])
      ].slice(0, 5);
    }
    return [
      ...(item.infra_tags || []),
      ...(item.music_tags || []),
      ...(item.positioning_tags || []),
      ...(item.audience_tags || []),
      ...(item.vibe_tags || [])
    ].slice(0, 5);
  }

  function getCardBadges(item, prooflyScore, type) {
    if (typeof getProoflyBadges !== 'function') return [];
    return getProoflyBadges(item, prooflyScore, { clientTotal: item.total_reviews || 0 }).slice(0, 2);
  }

  function getProoflyScoreTier(score) {
    const s = score == null ? null : Math.max(0, Math.min(100, Number(score)));
    if (s == null || Number.isNaN(s)) {
      return { tier: 'forming', label: '—', short: '—', tagline: 'Aguardando sinais', pct: 0 };
    }
    if (s >= 80) return { tier: 'elite', label: 'Elite', short: 'Elite', tagline: 'Reputação de referência', pct: s };
    if (s >= 60) return { tier: 'strong', label: 'Forte', short: 'Forte', tagline: 'Histórico consistente', pct: s };
    if (s >= 40) return { tier: 'solid', label: 'Sólido', short: 'Sólido', tagline: 'Construindo confiança', pct: s };
    return { tier: 'forming', label: 'Em formação', short: 'Novo', tagline: 'Poucos sinais ainda', pct: s };
  }

  function renderProoflyScoreGauge(score, opts) {
    const options = typeof opts === 'string' ? { size: opts } : (opts || {});
    const size = options.size || 'md';
    const sm = size === 'sm';
    const lg = size === 'lg';
    const tierInfo = getProoflyScoreTier(score);
    const dash = tierInfo.pct;
    const showMeta = options.showMeta !== false && !sm;
    const showNum = options.showNum !== false;
    const showTagline = options.showTagline === true;
    const title = score != null
      ? `Ranking Pro Score ${score} — ${tierInfo.label}`
      : 'Ranking Pro Score — reputação multi-fonte';
    const centerLabel = sm ? tierInfo.short : tierInfo.label;
    const sizeCls = sm ? 'sm' : (lg ? 'lg' : 'md');

    return `
      <div class="proofly-score-gauge ${sizeCls} proofly-tier-${tierInfo.tier}" title="${esc(title)}">
        <div class="proofly-score-ring-viz" aria-hidden="true">
          <svg viewBox="0 0 36 36" class="proofly-score-ring-svg">
            <path class="ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path class="ring-fill" stroke-dasharray="${dash}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          </svg>
          <span class="proofly-score-tier-center">${esc(centerLabel)}</span>
        </div>
        ${showMeta ? `
        <div class="proofly-score-gauge-meta">
          <span class="proofly-score-gauge-kicker">🏆 Ranking Pro Score</span>
          ${showTagline ? `<span class="proofly-score-gauge-tagline">${esc(tierInfo.tagline)}</span>` : ''}
          ${showNum && score != null ? `<span class="proofly-score-gauge-num">${score}<span class="proofly-score-gauge-of">/100</span></span>` : ''}
        </div>` : ''}
      </div>
    `;
  }

  function renderProoflyLevelBar(score) {
    if (score == null) return '';
    const tierInfo = getProoflyScoreTier(score);
    return `
      <div class="proofly-level-bar proofly-tier-${tierInfo.tier}" title="Ranking Pro Score ${score} — ${tierInfo.label}">
        <div class="proofly-level-track">
          <div class="proofly-level-fill" style="width:${tierInfo.pct}%"></div>
        </div>
        <span class="proofly-level-label">${esc(tierInfo.label)}</span>
      </div>
    `;
  }

  function renderProoflyScoreBadge(score, size) {
    return renderProoflyScoreGauge(score, {
      size: size || 'md',
      showMeta: size === 'lg',
      showNum: size === 'lg',
      showTagline: false
    });
  }

  function renderBadges(badges) {
    if (!badges?.length) return '';
    return `<div class="proofly-badges">${badges.map(b =>
      `<span class="proofly-badge proofly-badge-${b.id}">${b.icon} ${esc(b.label)}</span>`
    ).join('')}</div>`;
  }

  function renderSocialSignals(signals, entityId) {
    const { likes, views, favorites } = signals || {};
    const idAttr = entityId ? ` id="social-row-${entityId}"` : '';
    return `<div class="proofly-social-row"${idAttr}>
      <span class="proofly-social-pill">❤️ ${likes || 0} curtidas</span>
      <span class="proofly-social-pill">👁️ ${views || 0} views</span>
      <span class="proofly-social-pill">⭐ ${favorites || 0} salvos</span>
    </div>`;
  }

  function renderWhySection(points) {
    if (!points?.length) return '';
    const items = points.map(p => `<li>${p}</li>`).join('');
    return `<div class="tinder-section proofly-why-section">
      <div class="tinder-section-title">💡 Por que escolher?</div>
      <ul class="proofly-why-list">${items}</ul>
    </div>`;
  }

  function getPhotos(item) {
    return typeof getProfilePhotos === 'function' ? getProfilePhotos(item) : [item?.avatar_url].filter(Boolean);
  }

  function renderMatchRing(percent, tier, size) {
    if (percent == null) return '';
    const t = tier || (percent >= 80 ? 'hot' : percent >= 55 ? 'warm' : 'cool');
    const dash = Math.min(100, Math.max(0, percent));
    const sizeCls = size === 'sm' ? 'sm' : (size === 'lg' ? 'lg' : '');
    return `
      <div class="match-ring-viz${sizeCls ? ` ${sizeCls}` : ''} match-tier-${t}" title="Compatibilidade ${percent}%">
        <svg viewBox="0 0 36 36" class="match-ring-svg" aria-hidden="true">
          <path class="ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          <path class="ring-fill" stroke-dasharray="${dash}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
        </svg>
        <span class="match-ring-pct">${percent}%</span>
      </div>
    `;
  }

  function renderCardMatchOrb(match, tier) {
    if (sharkUI() || match == null) return '';
    const t = tier || (match >= 80 ? 'hot' : match >= 55 ? 'warm' : 'cool');
    return `<div class="tinder-card-match-orb-wrap match-tier-${t}">${renderMatchRing(match, t, 'sm')}</div>`;
  }

  function renderMatchPrefsCta() {
    const onclick = typeof window.abrirOnboardingEstilo === 'function'
      ? "abrirOnboardingEstilo(true)"
      : "window.location.href='./cliente.html'";
    return `
      <div class="match-prefs-cta glass-surface">
        <div class="match-prefs-icon">✨</div>
        <div class="match-prefs-copy">
          <div class="match-prefs-title">Melhore seus resultados escolhendo seu estilo</div>
          <div class="match-prefs-sub">O Ranking Pro calcula compatibilidade real com base no que você busca</div>
        </div>
        <button type="button" class="btn btn-tinder-primary match-prefs-btn" onclick="${onclick}">Definir meu estilo</button>
      </div>
    `;
  }

  function renderMatchInsightBlock(insight) {
    if (sharkUI() || !insight) return '';
    if (insight.needsPrefs) return renderMatchPrefsCta();
    if (insight.percent == null) return '';
    const tier = insight.tier || 'cool';
    const shared = (insight.sharedTags || []).slice(0, 4);
    const chips = shared.map(t => `<span class="match-shared-chip">${tagChip(t)}</span>`).join('');
    const combinaBadge = insight.percent >= 55 || shared.length
      ? '<span class="match-combina-badge">Combina com você</span>'
      : '';
    return `
      <div class="match-insight-block match-tier-${tier}">
        <div class="match-insight-glow"></div>
        <div class="match-insight-inner">
          ${renderMatchRing(insight.percent, tier)}
          <div class="match-insight-copy">
            ${combinaBadge}
            <div class="match-insight-headline">${esc(insight.headline || 'Compatibilidade')} · <strong>${insight.percent}%</strong></div>
            <div class="match-insight-sub">${esc(insight.subline || '')}</div>
            ${chips ? `<div class="match-shared-chips">${chips}</div>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  function renderCredibilityStrip(opts = {}) {
    const score = opts.prooflyScore;
    const igv = opts.igv;
    const carteira = opts.carteira ?? 0;
    const verifiedPct = opts.verifiedPct ?? 0;
    const clientTotal = opts.clientTotal ?? 0;
    const clientAvg = opts.clientAvg ?? 0;
    const estabTotal = opts.estabTotal ?? 0;
    const estabAvg = opts.estabAvg ?? 0;
    const type = opts.type || 'prof';

    const micro = [];
    if (carteira > 0) micro.push(`+${carteira} cliente${carteira === 1 ? '' : 's'} atendido${carteira === 1 ? '' : 's'}`);
    if (verifiedPct > 0) micro.push(`${verifiedPct}% avaliações verificadas`);
    if (!sharkUI() && igv != null && igv > 0 && type === 'prof') micro.push(`IGV ${Math.round(igv)}`);
    if (clientTotal > 0) micro.push(`Nota clientes ${Number(clientAvg).toFixed(1)}`);
    if (estabTotal > 0) micro.push(`${estabTotal} aval. de estabelecimentos`);

    const microHtml = micro.length
      ? `<div class="credibility-micro">${micro.map(m => `<span class="credibility-chip">${esc(m)}</span>`).join('')}</div>`
      : '';

    const tierInfo = getProoflyScoreTier(score);
    return `
      <div class="credibility-strip glass-surface">
        <div class="credibility-strip-top">
          ${score != null ? renderProoflyScoreGauge(score, { size: 'lg', showTagline: true }) : ''}
          <div class="credibility-copy">
            <div class="credibility-title">${score != null ? `Reputação ${esc(tierInfo.label)}` : 'Ranking Pro Score'}</div>
            <div class="credibility-honest">${score != null ? esc(tierInfo.tagline) + ' · ' : ''}Baseado em avaliações reais e atividade no Ranking Pro — não é auto-declarado.</div>
          </div>
        </div>
        ${microHtml}
        <div class="credibility-origin">
          <span class="credibility-origin-item credibility-origin-cliente">👤 ${clientTotal} de clientes${clientTotal ? ` · média ${Number(clientAvg).toFixed(1)}` : ''}</span>
          ${type === 'prof' && estabTotal > 0 ? `<span class="credibility-origin-item credibility-origin-estab">🏢 ${estabTotal} de estabelecimentos${estabAvg ? ` · média ${Number(estabAvg).toFixed(1)}` : ''}</span>` : ''}
        </div>
      </div>
    `;
  }

  function renderReputationOverview(opts = {}) {
    const clientTotal = opts.clientTotal ?? 0;
    const clientAvg = opts.clientAvg ?? 0;
    const estabTotal = opts.estabTotal ?? 0;
    const estabAvg = opts.estabAvg ?? 0;
    const verifiedPct = opts.verifiedPct ?? 0;
    const type = opts.type || 'prof';

    return `
      <div class="reputation-overview glass-surface">
        <div class="reputation-overview-title">🏆 Reputação verificável</div>
        <div class="reputation-overview-grid">
          <div class="reputation-stat reputation-stat-cliente">
            <div class="reputation-stat-label">👤 Clientes</div>
            <div class="reputation-stat-value">${clientTotal}</div>
            <div class="reputation-stat-hint">${clientTotal ? `Média ${Number(clientAvg).toFixed(1)} ★` : 'Aguardando avaliações'}</div>
          </div>
          ${type === 'prof' ? `
          <div class="reputation-stat reputation-stat-estab">
            <div class="reputation-stat-label">🏢 Estabelecimentos</div>
            <div class="reputation-stat-value">${estabTotal}</div>
            <div class="reputation-stat-hint">${estabTotal ? `Média ${Number(estabAvg).toFixed(1)} ★` : 'Sem avaliações ainda'}</div>
          </div>` : ''}
          <div class="reputation-stat reputation-stat-verified">
            <div class="reputation-stat-label">✅ Verificadas</div>
            <div class="reputation-stat-value">${verifiedPct}%</div>
            <div class="reputation-stat-hint">via QR e identidade</div>
          </div>
        </div>
      </div>
    `;
  }

  function renderQuickStyleTags(item, type, sharedTags) {
    const tags = collectTags(item, type === 'est' ? 'est' : 'prof');
    if (!tags.length) return '';
    const sharedSet = new Set(sharedTags || []);
    const chips = tags.map(t =>
      `<span class="quick-style-chip${sharedSet.has(t) ? ' quick-style-shared' : ''}">${tagChip(t)}</span>`
    ).join('');
    return `
      <div class="quick-style-block glass-surface">
        <div class="quick-style-title">✨ Estilo principal</div>
        ${sharedSet.size ? '<div class="quick-style-hint">Tags que batem com o que você busca</div>' : ''}
        <div class="quick-style-chips">${chips}</div>
      </div>
    `;
  }

  function renderSingleReviewCard(r, viewContext) {
    const d = typeof formatReviewForDisplay === 'function'
      ? formatReviewForDisplay(r, viewContext)
      : {
          authorName: r.user?.name || 'Avaliador',
          authorHtml: `<strong class="review-author-name">${esc(r.user?.name || 'Avaliador')}</strong>`,
          verifiedBadge: r.verified ? '<span class="review-badge review-badge-verified">✅ Verificado</span>' : '',
          sourceBadge: '👤 Cliente',
          contextText: '',
          workplaceHtml: ''
        };
    const src = typeof inferReviewSource === 'function' ? inferReviewSource(r) : 'cliente';
    const srcClass = src === 'estabelecimento' ? 'review-card-estab' : src === 'profissional' ? 'review-card-prof' : 'review-card-cliente';
    return `
      <div class="tinder-review-card glass-review-card ${srcClass}">
        <div class="head">
          <span class="stars">${stars(r.rating)}</span>
          <span class="date">${typeof tempoRelativo === 'function' ? tempoRelativo(r.created_at) : ''}</span>
        </div>
        <div class="review-author-block">${d.authorHtml || esc(d.authorName || '')}</div>
        <div class="tinder-review-badges review-badges-row">
          ${d.verifiedBadge || ''}
          <span class="review-badge review-badge-source">${esc(d.sourceBadge || '👤 Cliente')}</span>
        </div>
        ${d.contextText ? `<div class="review-context-line"><span class="review-context-action">${esc(d.contextText)}</span></div>` : ''}
        ${d.workplaceHtml || ''}
        <div class="text">${r.comment ? esc(r.comment) : '<span class="muted">Sem comentário</span>'}</div>
      </div>
    `;
  }

  function renderReviewsGrouped(clientReviews, estabReviews, viewContext = {}, type = 'prof') {
    const clientItems = (clientReviews || []).slice(0, 5).map(r => renderSingleReviewCard(r, viewContext)).join('');
    const estabItems = (estabReviews || []).slice(0, 5).map(r => renderSingleReviewCard(r, viewContext)).join('');
    const clientCount = clientReviews?.length || 0;
    const estabCount = estabReviews?.length || 0;

    let html = '<div class="reviews-grouped">';
    html += `
      <div class="reviews-group reviews-group-cliente glass-surface">
        <div class="reviews-group-header">
          <span class="reviews-group-icon">👤</span>
          <div>
            <div class="reviews-group-title">Avaliações de clientes</div>
            <div class="reviews-group-meta">${clientCount ? `${clientCount} avaliação${clientCount === 1 ? '' : 'ões'} · origem real` : 'Nenhuma ainda'}</div>
          </div>
        </div>
        <div class="tinder-reviews-list">${clientItems || '<p class="tinder-empty-msg">Seja o primeiro a avaliar.</p>'}</div>
      </div>`;

    if (type === 'prof') {
      html += `
      <div class="reviews-group reviews-group-estab glass-surface">
        <div class="reviews-group-header">
          <span class="reviews-group-icon">🏢</span>
          <div>
            <div class="reviews-group-title">Avaliações de estabelecimentos</div>
            <div class="reviews-group-meta">${estabCount ? `${estabCount} avaliação${estabCount === 1 ? '' : 'ões'} · quem já contratou` : 'Nenhuma ainda'}</div>
          </div>
        </div>
        <div class="tinder-reviews-list">${estabItems || '<p class="tinder-empty-msg">Estabelecimentos ainda não avaliaram.</p>'}</div>
      </div>`;
    }
    html += '</div>';
    return html;
  }

  function buildCredibilityMeta(allReviews, prooflyData, prof, avgRating, totalReviews) {
    const clientPool = allReviews || [];
    const verifiedCount = clientPool.filter(r =>
      typeof isReviewVerified === 'function' ? isReviewVerified(r) : r.verified
    ).length;
    const verifiedPct = clientPool.length ? Math.round((verifiedCount / clientPool.length) * 100) : 0;
    let igv = null;
    let carteira = totalReviews;
    if (typeof enrichProfWithTalentMetrics === 'function' && prof) {
      const m = enrichProfWithTalentMetrics(prof, allReviews)._talentMetrics;
      igv = m?.igv;
      carteira = m?.carteira?.total ?? carteira;
    }
    return {
      prooflyScore: prooflyData?.score,
      igv,
      carteira,
      verifiedPct,
      clientTotal: prooflyData?.clientStats?.total ?? totalReviews,
      clientAvg: prooflyData?.clientStats?.avg ?? avgRating,
      estabTotal: prooflyData?.estabStats?.total ?? 0,
      estabAvg: prooflyData?.estabStats?.avg ?? 0
    };
  }

  function buildProfessionalProfileBody(opts) {
    const {
      prof, matchInsight, prooflyData, allReviewsRaw, clientReviewsAll, estabReviewsRaw,
      avgRating, totalReviews, strengths, workHistory, profReviewCtx
    } = opts;
    const cred = buildCredibilityMeta(allReviewsRaw, prooflyData, prof, avgRating, totalReviews);
    const shared = matchInsight?.sharedTags || [];

    let html = '<div class="tinder-profile-content">';
    html += '<div class="profile-decision-stack">';
    html += renderCredibilityStrip({ ...cred, type: 'prof' });
    html += renderReputationOverview({ ...cred, type: 'prof' });
    if (!sharkUI() && typeof renderContratanteHiringSection === 'function') {
      html += renderContratanteHiringSection(prof, { privateData: opts.hiringPrivate });
    }
    html += renderQuickStyleTags(prof, 'prof', shared);
    html += renderTagCategories([
      { icon: '🎵', label: 'Música', tags: prof.music_tags },
      { icon: '👕', label: 'Visual', tags: prof.visual_tags },
      { icon: '🧠', label: 'Personalidade', tags: prof.personality_tags },
      { icon: '🌿', label: 'Estilo de Vida', tags: prof.lifestyle_tags },
      { icon: '💼', label: 'Trabalho', tags: prof.work_tags }
    ], shared);
    if (prof.profile?.bio) {
      html += `<div class="tinder-section glass-surface"><div class="tinder-section-title">Sobre</div><div class="tinder-section-bio">${esc(prof.profile.bio)}</div></div>`;
    }
    if (strengths?.length) html += renderWhySection(strengths);
    html += '</div>';
    html += '<div id="drawer-reviews-section" class="profile-reviews-zone">';
    html += renderReviewsGrouped(clientReviewsAll, estabReviewsRaw, profReviewCtx, 'prof');
    html += '</div>';
    html += renderWorkHistory(workHistory, '💼 Experiência');
    html += '</div>';
    return html;
  }

  function buildEstablishmentProfileBody(opts) {
    const {
      estab, matchInsight, prooflyData, allReviews, avgRating, totalReviews,
      strengths, estReviewCtx, tagCategories, paginationHtml
    } = opts;
    const cred = buildCredibilityMeta(allReviews, prooflyData, null, avgRating, totalReviews);
    const shared = matchInsight?.sharedTags || [];

    let html = '<div class="tinder-profile-content">';
    html += '<div class="profile-decision-stack">';
    html += renderCredibilityStrip({ ...cred, type: 'est', estabTotal: 0 });
    html += renderReputationOverview({ ...cred, type: 'est', estabTotal: 0 });
    html += renderQuickStyleTags(estab, 'est', shared);
    html += renderTagCategories(tagCategories, shared);
    if (estab.description) {
      html += `<div class="tinder-section glass-surface"><div class="tinder-section-title">Sobre o local</div><div class="tinder-section-bio">${esc(estab.description)}</div></div>`;
    }
    if (strengths?.length) html += renderWhySection(strengths);
    html += '</div>';
    html += '<div id="drawer-reviews-section" class="profile-reviews-zone">';
    html += renderReviewsGrouped(allReviews, [], estReviewCtx, 'est');
    html += paginationHtml || '';
    html += '</div>';
    html += '</div>';
    return html;
  }

  function renderPhotoGallery(photos, entityId) {
    const list = (photos || []).filter(Boolean);
    if (list.length <= 1) return '';
    const secondary = list.slice(1, 4);
    const slots = secondary.map((url, i) => `
      <button type="button" class="gallery-secondary-slot gallery-stack-${i + 1}" data-index="${i + 1}"
        onclick="ProfileCard.setHeroPhoto('${entityId}','${url.replace(/'/g, "\\'")}',this)" aria-label="Foto ${i + 2}">
        <img src="${avatarSrc(url)}" alt="" />
        <span class="gallery-slot-shine"></span>
      </button>
    `).join('');
    return `
      <div class="tinder-gallery-wrap" id="gallery-wrap-${entityId}">
        <div class="tinder-gallery-label">
          <span>📸 Explorar fotos</span>
          <span class="gallery-count">+${secondary.length}</span>
        </div>
        <div class="tinder-gallery-secondary" id="gallery-${entityId}">${slots}</div>
      </div>
    `;
  }

  function renderGalleryPreview(photos, entityId) {
    const list = (photos || []).filter(Boolean);
    if (!list.length) {
      return '<p class="dash-gallery-empty">Nenhuma foto na galeria</p>';
    }
    const secondary = list.slice(1, 4);
    const secHtml = secondary.length
      ? `<div class="dash-gallery-secondary">${secondary.map((url, i) => `
          <button type="button" class="gallery-secondary-slot" onclick="ProfileCard.setDashHero('${entityId}','${url.replace(/'/g, "\\'")}',this)">
            <img src="${avatarSrc(url)}" alt="" />
          </button>
        `).join('')}</div>`
      : '';
    return `
      <div class="dash-gallery-preview" id="dash-gallery-${entityId}">
        <div class="dash-gallery-hero">
          <img id="dash-hero-${entityId}" src="${avatarSrc(list[0])}" alt="" />
          <span class="hero-photo-badge">📷 ${list.length} fotos — preview do seu perfil</span>
        </div>
        ${secHtml ? `<div class="tinder-gallery-label" style="padding:12px 0 8px;background:transparent;"><span>Explorar galeria</span><span class="gallery-count">+${secondary.length}</span></div>${secHtml.replace('dash-gallery-secondary', 'dash-gallery-secondary tinder-gallery-secondary')}` : ''}
      </div>
    `;
  }

  function setDashHero(entityId, url, btn) {
    const img = document.getElementById(`dash-hero-${entityId}`);
    if (img) img.src = avatarSrc(url);
    const wrap = document.getElementById(`dash-gallery-${entityId}`);
    wrap?.querySelectorAll('.gallery-secondary-slot').forEach(s => s.classList.remove('active'));
    if (btn) btn.classList.add('active');
  }

  function setHeroPhoto(entityId, url, btn) {
    const heroImg = document.querySelector(`#hero-img-${entityId}`);
    if (heroImg) {
      heroImg.src = avatarSrc(url);
      heroImg.style.display = 'block';
      const fallback = heroImg.nextElementSibling;
      if (fallback?.classList.contains('hero-fallback')) fallback.style.display = 'none';
    }
    const gallery = document.getElementById(`gallery-${entityId}`);
    gallery?.querySelectorAll('.gallery-secondary-slot').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');
  }

  function renderLikeButton(entityType, entityId) {
    const liked = typeof isProfileLikedByUser === 'function' && isProfileLikedByUser(entityId, entityType);
    const count = typeof getLikeCount === 'function' ? getLikeCount(entityId, entityType) : 0;
    const type = entityType === 'prof' ? 'prof' : 'est';
    return `<button type="button" class="btn btn-tinder-action btn-tinder-like${liked ? ' liked' : ''}" id="likeBtn-${entityId}"
      onclick="ProfileCard.handleLike('${type}','${entityId}')">${liked ? '❤️' : '🤍'} Curtir${count ? ` · ${count}` : ''}</button>`;
  }

  function renderFavoriteButton(type, id, name) {
    const fav = isFavorite(type, id);
    const safeName = esc(name).replace(/'/g, "\\'");
    return `<button type="button" class="btn btn-tinder-action btn-tinder-fav${fav ? ' active' : ''}"
      data-label-on="❤️ Favoritado" data-label-off="🤍 Favoritar"
      onclick="ProfileCard.toggleFavorite('${type}','${id}','${safeName}',this)">${fav ? '❤️ Favoritado' : '🤍 Favoritar'}</button>`;
  }

  function handleLike(type, id) {
    if (typeof curtirPerfil !== 'function') return;
    const result = curtirPerfil(id, type);
    const btn = document.getElementById(`likeBtn-${id}`);
    if (btn) {
      btn.classList.add('liked');
      btn.innerHTML = `❤️ Curtir · ${result.count}`;
    }
    const socialRow = document.getElementById(`social-row-${id}`);
    if (socialRow && typeof getMockSocialSignals === 'function') {
      const s = getMockSocialSignals(id, type);
      socialRow.innerHTML = `
        <span class="proofly-social-pill">❤️ ${s.likes || 0} curtidas</span>
        <span class="proofly-social-pill">👁️ ${s.views || 0} views</span>
        <span class="proofly-social-pill">⭐ ${s.favorites || 0} salvos</span>
      `;
    }
    if (!result.already && typeof showUserMessage === 'function') {
      showUserMessage('❤️ Perfil curtido!');
    }
  }

  function renderWorkHistory(entries, title) {
    const sectionTitle = title || '💼 Experiência';
    if (!entries?.length) {
      return `<div class="tinder-section"><div class="tinder-section-title">${sectionTitle}</div>
        <p class="tinder-empty-msg">Nenhum histórico registrado ainda.</p></div>`;
    }
    const rows = entries.map(e => {
      const rating = e.avg != null ? `⭐ ${Number(e.avg).toFixed(1)}` : '— sem nota';
      const status = e.isCurrent ? '<span class="work-current">Atual</span>' : '';
      return `<div class="work-history-item">
        <div class="work-name">${esc(e.name)} ${status}</div>
        <div class="work-rating">${rating}${e.count ? ` <span class="work-count">(${e.count} aval.)</span>` : ''}</div>
      </div>`;
    }).join('');
    return `<div class="tinder-section"><div class="tinder-section-title">${sectionTitle}</div>${rows}</div>`;
  }

  function renderMatchBanner(match, insight) {
    if (sharkUI()) return '';
    const styleOnclick = typeof window.abrirOnboardingEstilo === 'function'
      ? "event.stopPropagation();abrirOnboardingEstilo(true)"
      : "event.stopPropagation();window.location.href='./cliente.html'";
    if (insight?.needsPrefs) {
      return `<div class="tinder-card-match-banner match-tier-cool match-banner-cta" role="button" tabindex="0" onclick="${styleOnclick}">
        <div class="match-banner-left">
          <span class="match-combina-badge sm">Personalize</span>
          <span class="match-hint">✨ Defina seu estilo para ver compatibilidade real</span>
        </div>
        <span class="match-banner-cta-arrow">→</span>
      </div>`;
    }
    if (match == null) return '';
    const tier = insight?.tier || (match >= 80 ? 'hot' : match >= 55 ? 'warm' : 'cool');
    const shared = (insight?.sharedTags || []).slice(0, 3);
    const showCombina = match >= 55 || shared.length > 0;
    const hint = insight?.headline || (showCombina ? 'Combina com você' : 'Compatibilidade');
    const subline = insight?.subline || '';
    const sharedLine = shared.length
      ? `<span class="match-shared-count">${shared.length} ${shared.length === 1 ? 'coisa' : 'coisas'} em comum</span>`
      : '';
    const chips = shared.map(t => `<span class="match-card-chip">${tagChip(t)}</span>`).join('');
    return `
      <div class="tinder-card-match-banner match-tier-${tier}">
        <div class="match-banner-left">
          ${showCombina ? '<span class="match-combina-badge sm">Combina com você</span>' : '<span class="match-combina-badge sm match-combina-muted">Match</span>'}
          <span class="match-hint">${esc(hint)}${sharedLine ? ` · ${sharedLine}` : ''}</span>
          ${subline ? `<span class="match-banner-sub">${esc(subline)}</span>` : ''}
          ${chips ? `<div class="match-card-chips">${chips}</div>` : ''}
        </div>
        ${renderMatchRing(match, tier, 'md')}
      </div>
    `;
  }

  function renderMiniRecoCard(item, type) {
    const isProf = type === 'prof';
    const drawerType = isProf ? 'profissional' : 'estabelecimento';
    const id = item.id;
    const name = item.name || 'Sem nome';
    const initial = name.charAt(0).toUpperCase();
    const src = avatarSrc(item.avatar_url, item);
    const specialty = isProf
      ? (item.profile?.specialty || item.specialty || 'Profissional')
      : (item.type || 'Estabelecimento');
    const avg = item.avg_rating ? Number(item.avg_rating).toFixed(1) : '—';
    const reviews = item.total_reviews || 0;
    const match = item._matchInsight?.percent ?? item._matchPercent;
    const prooflyScore = item._prooflyScore != null
      ? item._prooflyScore
      : (typeof calcularProoflyScoreRapido === 'function' ? calcularProoflyScoreRapido(item, type) : null);
    const loc = isProf
      ? (item.current_establishment?.city || item.current_establishment?.name || '')
      : (item.neighborhood || item.city || '');

    return `
      <article class="reco-mini-card${isProf ? '' : ' reco-mini-card--est'}" role="button" tabindex="0"
        onclick="openProfile('${drawerType}','${id}')"
        onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openProfile('${drawerType}','${id}');}">
        <div class="reco-mini-photo">
          <img src="${src}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
          <div class="reco-mini-fallback" style="display:none;">${initial}</div>
          ${match != null ? `<span class="reco-mini-match">${Math.round(match)}%</span>` : ''}
        </div>
        <div class="reco-mini-body">
          <span class="reco-mini-name" title="${esc(name)}">${esc(name)}</span>
          <span class="reco-mini-meta">${esc(specialty)}</span>
          <span class="reco-mini-stats">
            <span class="reco-mini-rating">★ ${avg}</span>
            <span class="reco-mini-reviews">${reviews} aval.</span>
          </span>
          ${loc ? `<span class="reco-mini-loc">📍 ${esc(loc)}</span>` : ''}
          ${prooflyScore != null ? `<span class="reco-mini-proofly">Ranking Pro ${Math.round(prooflyScore)}</span>` : ''}
        </div>
      </article>
    `;
  }

  function renderResultCard(item, type) {
    const isProf = type === 'prof';
    const id = item.id;
    const name = item.name || 'Sem nome';
    const initial = name.charAt(0).toUpperCase();
    const photos = getPhotos(item);
    const src = avatarSrc(photos[0] || item.avatar_url, item);
    const specialty = isProf
      ? (item.profile?.specialty || item.specialty || 'Profissional')
      : (item.type || item.city || 'Estabelecimento');
    const avg = item.avg_rating ? Number(item.avg_rating).toFixed(1) : '0.0';
    const total = item.total_reviews || 0;
    const insight = item._matchInsight || null;
    const match = insight?.percent ?? (item._matchPercent != null ? item._matchPercent : null);
    const prooflyScore = item._prooflyScore != null
      ? item._prooflyScore
      : (typeof calcularProoflyScoreRapido === 'function' ? calcularProoflyScoreRapido(item, type) : null);
    const distLabel = item._distanceKm != null && typeof formatDistanceKm === 'function'
      ? formatDistanceKm(item._distanceKm)
      : `${mockDistance(id)} km`;
    const fav = isFavorite(type, id);
    const tags = collectTags(item, type).slice(0, 3);
    const chips = tags.map(t => tagChip(t)).join('');
    const drawerType = isProf ? 'profissional' : 'estabelecimento';
    const cardClass = isProf ? 'tinder-card' : 'tinder-card est';
    const cardBadges = getCardBadges(item, prooflyScore, type);

    let sub = esc(specialty);
    if (isProf && item.current_establishment?.name) {
      sub += ` · ${esc(item.current_establishment.name)}`;
    }
    if (!isProf) {
      const end = item.city || 'Próximo a você';
      sub = `📍 ${esc(end)}`;
    }

    const matchTier = insight?.tier || (match >= 80 ? 'hot' : match >= 55 ? 'warm' : 'cool');
    const extraPhotos = Math.max(0, photos.length - 1);
    const exploreCta = match != null && match >= 65 ? '✨ Combina com você' : 'Ver perfil →';

    return `
      <article class="${cardClass}${match >= 72 ? ' card-high-match' : ''}" onclick="openProfile('${drawerType}','${id}')" role="button" tabindex="0">
        <div class="tinder-card-photo">
          <img class="card-hero-img" src="${src}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
          <div class="photo-fallback" style="display:none;">${initial}</div>
          <div class="tinder-card-shine"></div>
          <div class="tinder-card-gradient"></div>
          ${match != null ? renderCardMatchOrb(match, matchTier) : ''}
          ${extraPhotos ? `<span class="tinder-card-photo-count">+${extraPhotos} 📷</span>` : ''}
          <div class="tinder-card-badge-row">
            ${prooflyScore != null ? renderProoflyScoreGauge(prooflyScore, { size: 'sm', showMeta: false }) : ''}
            <button type="button" class="tinder-fav-btn${fav ? ' active' : ''}"
              onclick="event.stopPropagation();ProfileCard.toggleFavorite('${type}','${id}','${esc(name).replace(/'/g, "\\'")}',this)"
              aria-label="Favoritar">${fav ? '❤️' : '🤍'}</button>
          </div>
          <div class="tinder-card-overlay-info">
            <div class="name">${esc(name)}</div>
            <div class="sub">${sub}</div>
          </div>
        </div>
        ${renderMatchBanner(match, insight)}
        <div class="tinder-card-body">
          <div class="tinder-card-score-row">
            <span class="tinder-card-rating">${stars(item.avg_rating)} <strong>${avg}</strong></span>
            ${prooflyScore != null ? renderProoflyLevelBar(prooflyScore) : ''}
            <span class="tinder-card-distance">📍 ${distLabel}</span>
          </div>
          ${isProf && item._talentMetrics && typeof renderTalentCardRow === 'function' ? renderTalentCardRow(item._talentMetrics) : ''}
          ${cardBadges.length ? `<div class="tinder-card-badges">${renderBadges(cardBadges)}</div>` : ''}
          ${chips ? `<div class="tinder-card-chips">${chips}</div>` : ''}
          <div class="tinder-card-explore">${exploreCta}</div>
          ${typeof PROOFLY_DEBUG !== 'undefined' && PROOFLY_DEBUG.isMatchDebugOn() && typeof PROOFLY_DEBUG.renderMatchDebugHtml === 'function'
            ? PROOFLY_DEBUG.renderMatchDebugHtml(item, type, isProf
              ? (typeof getMatchTagsProf === 'function' ? getMatchTagsProf() : [])
              : (typeof getMatchTagsEst === 'function' ? getMatchTagsEst() : []))
            : ''}
        </div>
      </article>
    `;
  }

  function renderHero(opts) {
    const { name, subtitle, lines, avatarUrl, photos, entityId, matchPercent, matchInsight, prooflyScore, badges, type, avgRating, totalReviews } = opts;
    const initial = (name || '?').charAt(0).toUpperCase();
    const photoList = photos?.length ? photos : [avatarUrl].filter(Boolean);
    const src = avatarSrc(photoList[0] || avatarUrl);
    const grad = type === 'est' ? 'linear-gradient(160deg,#0c4a6e,#1e3a5f)' : 'linear-gradient(160deg,#312e81,#1e1b4b)';
    const eid = entityId || 'profile';
    const hasRating = (Number(avgRating) > 0) || (totalReviews || 0) > 0;
    const extraPhotos = Math.max(0, photoList.length - 1);
    const insight = matchInsight || (matchPercent != null
      ? { percent: matchPercent, tier: matchPercent >= 80 ? 'hot' : matchPercent >= 55 ? 'warm' : 'cool', headline: 'Combina com você', subline: '', sharedTags: [] }
      : null);

    return `
      <div class="tinder-profile-hero tinder-hero-alive" style="background:${grad}" id="hero-wrap-${eid}">
        <img class="hero-main-img" id="hero-img-${eid}" src="${src}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
        <div class="hero-fallback" style="display:none;">${initial}</div>
        <div class="hero-vignette"></div>
        <div class="hero-gradient"></div>
        ${extraPhotos ? `<span class="hero-photo-badge">📷 ${photoList.length} fotos</span>` : ''}
        <div class="tinder-hero-score-float pulse-glow hero-score-premium">
          ${prooflyScore != null ? renderProoflyScoreGauge(prooflyScore, { size: 'lg', showTagline: true }) : ''}
        </div>
        ${hasRating ? `<div class="hero-rating-float"><span class="stars">${stars(avgRating)}</span><strong>${Number(avgRating).toFixed(1)}</strong><small>${totalReviews} aval.</small></div>` : ''}
      </div>
      ${renderPhotoGallery(photoList, eid)}
      <div class="tinder-hero-identity">
        <div class="tinder-hero-identity-top">
          <div>
            <h2 class="hero-name">${esc(name)}</h2>
            ${subtitle ? `<p class="hero-specialty">${esc(subtitle)}</p>` : ''}
          </div>
        </div>
        ${(lines || []).length ? `<div class="hero-meta-lines">${lines.map(l => `<div class="hero-meta-line">${l}</div>`).join('')}</div>` : ''}
        <div class="tinder-hero-badges-row">${renderBadges(badges)}</div>
      </div>
      ${insight ? renderMatchInsightBlock(insight) : ''}
    `;
  }

  function renderRatingBar(avg, total) {
    const avgNum = Number(avg) || 0;
    const has = total > 0 || avgNum > 0;
    return `
      <div class="tinder-rating-bar${has ? '' : ' empty'}">
        <span class="stars">${has ? stars(avgNum) : '☆☆☆☆☆'}</span>
        <div>
          <div class="score">${has ? avgNum.toFixed(1) : 'Sem nota ainda'}</div>
          <div class="count">${total > 0 ? `(${total} avaliaç${total === 1 ? 'ão' : 'ões'})` : (has ? 'Nota do estabelecimento' : 'Seja o primeiro a avaliar')}</div>
        </div>
      </div>
    `;
  }

  function renderTagCategories(categories, sharedTags) {
    if (!categories?.length) return '';
    const cats = categories.filter(c => c.tags?.length);
    if (!cats.length) return '';
    const sharedSet = new Set(sharedTags || []);
    return `<div class="tinder-section tinder-tags-section">
      <div class="tinder-section-title">✨ Estilo & afinidade</div>
      ${sharedSet.size ? `<p class="tags-shared-hint">✓ Tags que batem com o que você busca</p>` : ''}
      ${cats.map(cat => `
        <div class="tinder-tag-cat">
          <div class="tinder-tag-cat-label">${cat.icon} ${esc(cat.label)}</div>
          <div class="tinder-tags-grid">
            ${cat.tags.map(t => `<span class="tinder-tag-pill${sharedSet.has(t) ? ' tag-shared' : ''}">${tagChip(t)}</span>`).join('')}
          </div>
        </div>
      `).join('')}
    </div>`;
  }

  function renderReviews(reviews, title, viewContext = {}) {
    if (!reviews?.length) {
      return `<div class="tinder-section tinder-reviews-block">
        <div class="tinder-section-title">${title}</div>
        <p class="tinder-empty-msg">Nenhuma avaliação ainda.</p>
      </div>`;
    }
    const items = reviews.map(r => {
      const d = typeof formatReviewForDisplay === 'function'
        ? formatReviewForDisplay(r, viewContext)
        : {
            authorName: r.user?.name || 'Avaliador',
            authorHtml: `<strong class="review-author-name">${esc(r.user?.name || 'Avaliador')}</strong>`,
            verifiedBadge: r.verified ? '<span class="review-badge review-badge-verified">✅ Verificado</span>' : '',
            sourceBadge: r.sourceBadge || '',
            contextText: r.reviewContext || r.context || '',
            reviewContext: r.reviewContext || r.context || '',
            workplaceHtml: ''
          };
      return `
      <div class="tinder-review-card">
        <div class="head">
          <span class="stars">${stars(r.rating)}</span>
          <span class="date">${typeof tempoRelativo === 'function' ? tempoRelativo(r.created_at) : ''}</span>
        </div>
        <div class="review-author-block">${d.authorHtml || esc(d.authorName || '')}</div>
        <div class="tinder-review-badges review-badges-row">
          ${d.verifiedBadge || ''}
          ${d.sourceBadge ? `<span class="review-badge review-badge-source">${esc(d.sourceBadge)}</span>` : ''}
        </div>
        ${d.contextText || d.reviewContext ? `<div class="review-context-line"><span class="review-context-action">${esc(d.contextText || d.reviewContext)}</span></div>` : ''}
        ${d.workplaceHtml || ''}
        <div class="text">${r.comment ? esc(r.comment) : '<span class="muted">Sem comentário</span>'}</div>
      </div>
    `;
    }).join('');
    return `<div class="tinder-section tinder-reviews-block">
      <div class="tinder-section-title">${title}</div>
      <div class="tinder-reviews-list">${items}</div>
    </div>`;
  }

  function renderDrawerActions(opts) {
    if (typeof opts === 'string') {
      return renderDrawerActions({
        primaryLabel: opts,
        primaryOnclick: arguments[1],
        secondaryLabel: arguments[2],
        secondaryOnclick: arguments[3]
      });
    }
    const {
      primaryLabel, primaryOnclick,
      favType, favId, favName,
      likeType, likeId,
      showReviewsBtn
    } = opts;
    const contactOnclick = opts.contactOnclick || "typeof showAlert==='function'?showAlert('📞 Contato','Em breve: contato direto pelo Ranking Pro.'):alert('Contato em breve')";
    return `
      <div class="drawer-actions-sticky">
        <button type="button" class="btn btn-tinder-primary btn-tinder-xl" onclick="${primaryOnclick}">${primaryLabel}</button>
        <div class="drawer-actions-row">
          ${favType && favId ? renderFavoriteButton(favType, favId, favName || '') : ''}
          <button type="button" class="btn btn-tinder-action btn-tinder-secondary" onclick="${contactOnclick}">📞 Contato</button>
          ${likeType && likeId ? renderLikeButton(likeType, likeId) : ''}
          ${showReviewsBtn ? `<button type="button" class="btn btn-tinder-action btn-tinder-secondary" onclick="scrollDrawerToReviews()">📝 Avaliações</button>` : ''}
        </div>
        <button type="button" class="btn btn-tinder-close btn-tinder-xl" onclick="fecharDrawer()">✕ Fechar</button>
      </div>
    `;
  }

  global.ProfileCard = {
    renderResultCard,
    renderHero,
    renderRatingBar,
    renderTagCategories,
    renderReviews,
    renderReviewsGrouped,
    renderCredibilityStrip,
    renderReputationOverview,
    renderQuickStyleTags,
    buildProfessionalProfileBody,
    buildEstablishmentProfileBody,
    renderDrawerActions,
    renderProoflyScoreBadge,
    renderProoflyScoreGauge,
    renderProoflyLevelBar,
    getProoflyScoreTier,
    renderBadges,
    renderSocialSignals,
    renderWhySection,
    renderWorkHistory,
    renderPhotoGallery,
    renderGalleryPreview,
    renderMatchInsightBlock,
    renderMatchPrefsCta,
    renderMatchRing,
    renderCardMatchOrb,
    renderMiniRecoCard,
    setHeroPhoto,
    setDashHero,
    handleLike,
    toggleFavorite,
    isFavorite,
    mockDistance,
    collectTags,
    getPhotos
  };
})(window);