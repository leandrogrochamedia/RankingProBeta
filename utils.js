// =====================================================
// PROOFLY - UTILS (completo + Match Engine)
// =====================================================

// ===== MAPA DE TAGS COMPLETO =====
const TAG_MAP = {
  // PROFISSIONAL - MÚSICA
  'Hip Hop': { emoji: '🎧', category: 'Música' },
  'Rock': { emoji: '🎸', category: 'Música' },
  'Sertanejo': { emoji: '🎶', category: 'Música' },
  'Pop': { emoji: '🎤', category: 'Música' },
  'Clássico': { emoji: '🎻', category: 'Música' },
  'MPB': { emoji: '🎵', category: 'Música' },
  'Eletrônico': { emoji: '🪩', category: 'Música' },
  'Reggae': { emoji: '🇯🇲', category: 'Música' },
  'Jazz': { emoji: '🎷', category: 'Música' },
  'Blues': { emoji: '🎹', category: 'Música' },
  
  // PROFISSIONAL - VISUAL
  'Streetwear': { emoji: '👕', category: 'Visual' },
  'Clássico': { emoji: '💈', category: 'Visual' },
  'Moderno': { emoji: '✨', category: 'Visual' },
  'Tradicional': { emoji: '🏛️', category: 'Visual' },
  'Casual': { emoji: '👔', category: 'Visual' },
  'Urbano': { emoji: '🏙️', category: 'Visual' },
  'Elegante': { emoji: '👔', category: 'Visual' },
  'Despojado': { emoji: '😎', category: 'Visual' },
  
  // PROFISSIONAL - PERSONALIDADE
  'Comunicativo': { emoji: '🗣️', category: 'Personalidade' },
  'Reservado': { emoji: '🤫', category: 'Personalidade' },
  'Extrovertido': { emoji: '🎭', category: 'Personalidade' },
  'Detalhista': { emoji: '🔍', category: 'Personalidade' },
  'Rápido': { emoji: '⚡', category: 'Personalidade' },
  'Perfeccionista': { emoji: '✨', category: 'Personalidade' },
  'Criativo': { emoji: '🎨', category: 'Personalidade' },
  'Ousado': { emoji: '🔥', category: 'Personalidade' },
  
  // PROFISSIONAL - ESTILO DE VIDA
  'Não bebe': { emoji: '🚫🍺', category: 'Estilo de Vida' },
  'Bebe socialmente': { emoji: '🍻', category: 'Estilo de Vida' },
  'Não fuma': { emoji: '🚭', category: 'Estilo de Vida' },
  'Fuma': { emoji: '🚬', category: 'Estilo de Vida' },
  'Vegano': { emoji: '🥗', category: 'Estilo de Vida' },
  'Esportista': { emoji: '🏃', category: 'Estilo de Vida' },
  'Religioso': { emoji: '🙏', category: 'Estilo de Vida' },
  'Noturno': { emoji: '🌙', category: 'Estilo de Vida' },
  
  // PROFISSIONAL - TRABALHO
  'Especialista': { emoji: '🎯', category: 'Trabalho' },
  'Generalista': { emoji: '🧠', category: 'Trabalho' },
  'Experiente': { emoji: '🏆', category: 'Trabalho' },
  'Iniciante': { emoji: '🌱', category: 'Trabalho' },
  'Premium': { emoji: '💎', category: 'Trabalho' },
  'Popular': { emoji: '🔥', category: 'Trabalho' },
  
  // ESTABELECIMENTO - INFRAESTRUTURA
  'Wi-Fi': { emoji: '📶', category: 'Infraestrutura' },
  'Café': { emoji: '☕', category: 'Infraestrutura' },
  'Bar': { emoji: '🍺', category: 'Infraestrutura' },
  'Ar Condicionado': { emoji: '❄️', category: 'Infraestrutura' },
  'Estacionamento': { emoji: '🅿️', category: 'Infraestrutura' },
  'Pet Friendly': { emoji: '🐾', category: 'Infraestrutura' },
  'Acessibilidade': { emoji: '♿', category: 'Infraestrutura' },
  'TV': { emoji: '📺', category: 'Infraestrutura' },
  
  // ESTABELECIMENTO - MÚSICA
  'Hip Hop': { emoji: '🎧', category: 'Música Ambiente' },
  'Rock': { emoji: '🎸', category: 'Música Ambiente' },
  'Sertanejo': { emoji: '🎶', category: 'Música Ambiente' },
  'Pop': { emoji: '🎤', category: 'Música Ambiente' },
  'Clássico': { emoji: '🎻', category: 'Música Ambiente' },
  'MPB': { emoji: '🎵', category: 'Música Ambiente' },
  'Eletrônico': { emoji: '🪩', category: 'Música Ambiente' },
  'Reggae': { emoji: '🇯🇲', category: 'Música Ambiente' },
  'Jazz': { emoji: '🎷', category: 'Música Ambiente' },
  'Blues': { emoji: '🎹', category: 'Música Ambiente' },
  
  // ESTABELECIMENTO - POSICIONAMENTO
  'Premium': { emoji: '💎', category: 'Posicionamento' },
  'Popular': { emoji: '🔥', category: 'Posicionamento' },
  'Tradicional': { emoji: '🏛️', category: 'Posicionamento' },
  'Moderno': { emoji: '✨', category: 'Posicionamento' },
  'Luxo': { emoji: '💎', category: 'Posicionamento' },
  'Despojado': { emoji: '😎', category: 'Posicionamento' },
  
  // ESTABELECIMENTO - PÚBLICO
  'Família': { emoji: '👨‍👩‍👧', category: 'Público' },
  'Adulto': { emoji: '🧑', category: 'Público' },
  'LGBTQIA+': { emoji: '🏳️‍🌈', category: 'Público' },
  'Empresarial': { emoji: '💼', category: 'Público' },
  'Infantil': { emoji: '🧒', category: 'Público' },
  'Terceira idade': { emoji: '👴', category: 'Público' },
  'Todos': { emoji: '🌍', category: 'Público' },
  
  // ESTABELECIMENTO - VIBE
  'Descontraído': { emoji: '😌', category: 'Vibe' },
  'Sério': { emoji: '🧐', category: 'Vibe' },
  'Animado': { emoji: '🎉', category: 'Vibe' },
  'Calmo': { emoji: '🧘', category: 'Vibe' },
  'Intimista': { emoji: '🕯️', category: 'Vibe' },
  'Grande': { emoji: '🏛️', category: 'Vibe' },
  'Acolhedor': { emoji: '🤗', category: 'Vibe' },
};

// ===== FUNÇÕES EXISTENTES =====
function renderTagWithEmoji(tag) {
  const info = TAG_MAP[tag] || { emoji: '🏷️', category: 'Outro' };
  return `<span class="style-chip" title="${info.category}">${info.emoji} ${escapeHtml(tag)}</span>`;
}

function renderEditChips(container, options, selected, maxCount, counterEl) {
  container.innerHTML = '';
  options.forEach(tag => {
    const active = selected.includes(tag) ? 'active' : '';
    const chip = document.createElement('span');
    chip.className = `chip-edit ${active}`;
    chip.dataset.tag = tag;
    chip.textContent = tag;
    chip.onclick = function() {
      const idx = selected.indexOf(tag);
      if (idx !== -1) {
        selected.splice(idx, 1);
        this.classList.remove('active');
      } else {
        if (selected.length >= maxCount) {
          showAlert('⚠️ Atenção', `Máximo de ${maxCount} tags por categoria.`);
          return;
        }
        selected.push(tag);
        this.classList.add('active');
      }
      if (counterEl) counterEl.textContent = `${selected.length} selecionada${selected.length !== 1 ? 's' : ''}`;
    };
    container.appendChild(chip);
  });
  if (counterEl) counterEl.textContent = `${selected.length} selecionada${selected.length !== 1 ? 's' : ''}`;
}

function buildTagSearchConditions(searchTerm, tagColumns) {
  if (!searchTerm || searchTerm.length < 2) return '';
  const conditions = tagColumns.map(col => 
    `${col}::text ILIKE '%${encodeURIComponent(searchTerm)}%'`
  );
  return conditions.join(' OR ');
}

function showUserMessage(msg, isError = false, isWarning = false) {
  const d = document.getElementById('userMessage');
  if (!d) return;
  d.textContent = msg;
  d.className = 'user-message ' + (isWarning ? 'warning' : (isError ? 'error' : 'success'));
  d.style.display = 'block';
  clearTimeout(window.userMsgTimeout);
  window.userMsgTimeout = setTimeout(() => d.style.display = 'none', 5000);
}

function renderStars(rating) {
  let s = '';
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  for (let i = 0; i < 5; i++) {
    if (i < full) s += '★';
    else if (i === full && half) s += '⯨';
    else s += '☆';
  }
  return s;
}

function computeRatingStats(reviews) {
  const ratings = (reviews || [])
    .map(r => (typeof r === 'number' ? r : r?.rating))
    .filter(r => r >= 1 && r <= 5);
  const total = ratings.length;
  const distribution = [0, 0, 0, 0, 0];
  ratings.forEach(r => { distribution[5 - r]++; });
  const avg = total ? ratings.reduce((sum, r) => sum + r, 0) / total : 0;
  return { avg, total, distribution };
}

function renderRatingDistribution(distribution, total) {
  let html = '<div class="rating-distribution">';
  for (let i = 0; i < 5; i++) {
    const count = distribution[i] || 0;
    const pct = total ? Math.round((count / total) * 100) : 0;
    html += `<div class="rating-bar"><span>${5 - i}★</span><div class="rating-bar-bg"><div class="rating-bar-fill" style="width:${pct}%;"></div></div><span class="rating-bar-count">${count}</span></div>`;
  }
  html += '</div>';
  return html;
}

function renderRatingSummary(reviews, fallbackAvg, fallbackTotal) {
  const stats = computeRatingStats(reviews);
  const avg = stats.total ? stats.avg : (fallbackAvg || 0);
  const total = stats.total || fallbackTotal || 0;
  const countLabel = total === 1 ? '1 avaliação' : `${total} avaliações`;
  return `
    <div class="rating-summary">
      <div class="rating-summary-score">
        <div class="rating-big">${avg.toFixed(1)}</div>
        <div class="stars-display">${renderStars(avg)}</div>
        <div class="rating-count-label">${total ? countLabel : '0 avaliações'}</div>
      </div>
      ${renderRatingDistribution(stats.distribution, stats.total)}
    </div>
  `;
}

const DEFAULT_AVATAR_URL = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect fill="%23e2e8f0" width="120" height="120"/><circle cx="60" cy="46" r="22" fill="%2394a3b8"/><ellipse cx="60" cy="98" rx="34" ry="26" fill="%2394a3b8"/></svg>'
);

function getAvatarUrl(url) {
  return url && String(url).trim() ? url : DEFAULT_AVATAR_URL;
}

function formatUsername(instagram) {
  if (!instagram) return '';
  const handle = instagram.replace(/^@/, '').trim();
  return handle ? `@${handle}` : '';
}

function updateProfileRatingBlock(blockEl, starsEl, valueEl, countEl, avg, total) {
  if (!blockEl) return;
  const rating = Number(avg) || 0;
  const reviews = Number(total) || 0;
  if (starsEl) starsEl.textContent = reviews ? renderStars(Math.round(rating)) : '☆☆☆☆☆';
  if (valueEl) valueEl.textContent = reviews ? rating.toFixed(1) : '—';
  if (countEl) {
    countEl.textContent = reviews
      ? `(${reviews} avaliaç${reviews === 1 ? 'ão' : 'ões'})`
      : 'Sem avaliações ainda';
  }
  blockEl.classList.toggle('empty', !reviews);
}

// ===== HYPER REPUTATION — MULTI-SOURCE REVIEWS + PROOFLY SCORE =====
const REVIEW_TYPES = {
  CLIENT_TO_PROF: 'client_to_professional',
  ESTAB_TO_PROF: 'establishment_to_professional',
  CLIENT_TO_EST: 'client_to_establishment',
  PROF_TO_EST: 'professional_to_establishment',
  PROFILE_LIKE: 'profile_like'
};

const PROOFLY_WEIGHTS = { client: 0.5, establishment: 0.3, social: 0.2 };

function filterReviewsByType(reviews, type) {
  return (reviews || []).filter(r => {
    if (r.review_type === type) return true;
    if (!r.review_type && type === REVIEW_TYPES.CLIENT_TO_PROF) return true;
    if (typeof inferReviewSource === 'function') {
      if (type === REVIEW_TYPES.ESTAB_TO_PROF && inferReviewSource(r) === 'estabelecimento' && r.professional_id) return true;
      if (type === REVIEW_TYPES.CLIENT_TO_PROF && inferReviewSource(r) === 'cliente' && r.professional_id) return true;
      if (type === REVIEW_TYPES.CLIENT_TO_EST && inferReviewSource(r) === 'cliente' && r.establishment_id) return true;
      if (type === REVIEW_TYPES.PROF_TO_EST && inferReviewSource(r) === 'profissional') return true;
    }
    return false;
  });
}

function groupReviewsForProofly(reviews, entityType) {
  if (entityType === 'prof') {
    return {
      client: filterReviewsByType(reviews, REVIEW_TYPES.CLIENT_TO_PROF),
      establishment: filterReviewsByType(reviews, REVIEW_TYPES.ESTAB_TO_PROF),
      profileLikes: filterReviewsByType(reviews, REVIEW_TYPES.PROFILE_LIKE)
    };
  }
  return {
    client: filterReviewsByType(reviews, REVIEW_TYPES.CLIENT_TO_EST),
    establishment: filterReviewsByType(reviews, REVIEW_TYPES.PROF_TO_EST),
    profileLikes: filterReviewsByType(reviews, REVIEW_TYPES.PROFILE_LIKE)
  };
}

function ratingSourceToScore(avg, total) {
  if (!total || !avg) return 0;
  const base = (Number(avg) / 5) * 100;
  const volumeBoost = Math.min(10, total * 0.4);
  return Math.min(100, base + volumeBoost);
}

function _entityHash(id) {
  let hash = 0;
  const s = String(id || '');
  for (let i = 0; i < s.length; i++) hash = ((hash << 5) - hash) + s.charCodeAt(i);
  return Math.abs(hash);
}

const CLIENT_PREFS_KEY = 'proofly_client_prefs';

function getStoredClientPrefs() {
  try {
    const raw = localStorage.getItem(CLIENT_PREFS_KEY);
    if (!raw) return { onboardingDone: false, profTags: [], estTags: [] };
    const data = JSON.parse(raw);
    return {
      onboardingDone: !!data.onboardingDone,
      profTags: Array.isArray(data.profTags) ? data.profTags : [],
      estTags: Array.isArray(data.estTags) ? data.estTags : [],
      updatedAt: data.updatedAt || null
    };
  } catch {
    return { onboardingDone: false, profTags: [], estTags: [] };
  }
}

function setStoredClientPrefs(prefs) {
  const current = getStoredClientPrefs();
  const next = {
    ...current,
    ...prefs,
    profTags: prefs.profTags != null ? prefs.profTags : current.profTags,
    estTags: prefs.estTags != null ? prefs.estTags : current.estTags,
    onboardingDone: prefs.onboardingDone != null ? prefs.onboardingDone : current.onboardingDone,
    updatedAt: Date.now()
  };
  localStorage.setItem(CLIENT_PREFS_KEY, JSON.stringify(next));
  return next;
}

function getEffectiveClientTags(tipo, sessionTags) {
  const stored = getStoredClientPrefs();
  const base = tipo === 'prof' ? stored.profTags : stored.estTags;
  return [...new Set([...(base || []), ...(sessionTags || [])])];
}

function getStoredFavorites() {
  try {
    return JSON.parse(localStorage.getItem('proofly_favorites') || '[]');
  } catch {
    return [];
  }
}

function removeStoredFavorite(type, id) {
  const favs = getStoredFavorites().filter(f => !(f.type === type && String(f.id) === String(id)));
  localStorage.setItem('proofly_favorites', JSON.stringify(favs));
  return favs;
}

function getMockSocialSignals(entityId, entityType) {
  const typeKey = entityType === 'prof' ? 'prof' : 'est';
  let views = 0;
  let favorites = 0;
  try {
    views = parseInt(localStorage.getItem(`proofly_views_${typeKey}_${entityId}`) || '0', 10);
    const favs = JSON.parse(localStorage.getItem('proofly_favorites') || '[]');
    favorites = favs.filter(f => f.type === typeKey && f.id === entityId).length;
  } catch { /* noop */ }
  const hash = _entityHash(entityId);
  if (!views) views = (hash % 480) + 40;
  const likes = getLikeCount(entityId, entityType);
  return { likes, views, favorites, likedByUser: isProfileLikedByUser(entityId, entityType) };
}

function socialSignalsToScore({ likes, views, favorites, profileLikes }) {
  const raw = (likes || 0) * 1.1 + (favorites || 0) * 4 + (profileLikes || 0) * 2.5 + Math.min(views || 0, 250) * 0.12;
  return Math.min(100, Math.round(raw));
}

function calcularProoflyScore(sources) {
  const clientScore = ratingSourceToScore(sources.clientAvg, sources.clientTotal);
  const estabScore = ratingSourceToScore(sources.estabAvg, sources.estabTotal);
  const socialScore = socialSignalsToScore(sources);
  const score = clientScore * PROOFLY_WEIGHTS.client
    + estabScore * PROOFLY_WEIGHTS.establishment
    + socialScore * PROOFLY_WEIGHTS.social;
  return Math.round(Math.min(100, Math.max(0, score)));
}

function calcularProoflyScoreFromReviews(reviews, entityId, entityType) {
  const groups = groupReviewsForProofly(reviews, entityType);
  const clientStats = computeRatingStats(groups.client);
  const estabStats = computeRatingStats(groups.establishment);
  const social = getMockSocialSignals(entityId, entityType);
  const ratedPool = [...groups.client, ...groups.establishment];
  const weighted = typeof calcularMediaPonderadaReviews === 'function'
    ? calcularMediaPonderadaReviews(ratedPool)
    : null;
  const legacyScore = calcularProoflyScore({
    clientAvg: clientStats.avg,
    clientTotal: clientStats.total,
    estabAvg: estabStats.avg,
    estabTotal: estabStats.total,
    profileLikes: groups.profileLikes.length,
    ...social
  });
  const score = weighted?.total ? weighted.score : legacyScore;
  return {
    score,
    weightedAvg: weighted?.weightedAvg || 0,
    weightedTotal: weighted?.total || 0,
    groups,
    clientStats,
    estabStats,
    social: { ...social, profileLikes: groups.profileLikes.length }
  };
}

function calcularProoflyScoreRapido(item, entityType) {
  const social = getMockSocialSignals(item.id, entityType);
  return calcularProoflyScore({
    clientAvg: item.avg_rating || 0,
    clientTotal: item.total_reviews || 0,
    estabAvg: item._estabReviewAvg || 0,
    estabTotal: item._estabReviewTotal || 0,
    profileLikes: item._profileLikes || 0,
    ...social
  });
}

function getProoflyBadges(item, score, stats) {
  const badges = [];
  const clientTotal = stats?.clientTotal ?? item.total_reviews ?? 0;
  if (score >= 85) badges.push({ id: 'top', label: 'Top Rated', icon: '⭐' });
  if (score >= 78) badges.push({ id: 'hot', label: 'Em Alta', icon: '🔥' });
  if (clientTotal >= 5) badges.push({ id: 'verified', label: 'Verificado', icon: '✅' });
  if (score >= 65) badges.push({ id: 'trusted', label: 'Confiável', icon: '🛡️' });
  if ((item.work_tags || []).includes('Premium') || (item.positioning_tags || []).includes('Premium')) {
    badges.push({ id: 'premium', label: 'Premium', icon: '💎' });
  }
  return badges;
}

function buildStrengthPoints(item, entityType, score, groups) {
  const points = [];
  const clientStats = computeRatingStats(groups?.client || []);
  const estabStats = computeRatingStats(groups?.establishment || []);

  if (clientStats.total >= 3 && clientStats.avg >= 4.2) {
    points.push(`⭐ ${clientStats.avg.toFixed(1)} de média com ${clientStats.total} clientes`);
  } else if (clientStats.total >= 8) {
    points.push(`📝 ${clientStats.total} avaliações de clientes`);
  }
  if (estabStats.total >= 1) {
    points.push(`🏢 Reconhecido por ${estabStats.total} estabelecimento(s)`);
  }
  if (score >= 70) points.push(`🏆 Ranking Pro Score ${score}/100`);

  const tagList = entityType === 'prof'
    ? [...(item.music_tags || []), ...(item.work_tags || []), ...(item.personality_tags || [])]
    : [...(item.vibe_tags || []), ...(item.positioning_tags || []), ...(item.infra_tags || [])];
  tagList.slice(0, 3).forEach(tag => {
    const info = TAG_MAP[tag] || { emoji: '🏷️' };
    points.push(`${info.emoji} Destaque em ${tag}`);
  });
  if (item.profile?.years_experience >= 3) {
    points.push(`⏳ ${item.profile.years_experience} anos de experiência`);
  }
  return points.slice(0, 5);
}

function buildWorkHistory(vinculos, estabReviews, previousWorkplaces) {
  const ratingsByEst = {};
  (estabReviews || []).forEach(r => {
    const eid = r.establishment_id;
    if (!eid) return;
    if (!ratingsByEst[eid]) ratingsByEst[eid] = [];
    ratingsByEst[eid].push(r.rating);
  });

  const entries = (vinculos || []).map(v => {
    const eid = v.establishment?.id || v.establishment_id;
    const ratings = ratingsByEst[eid] || [];
    const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
    return {
      establishmentId: eid,
      name: v.establishment?.name || 'Estabelecimento',
      avg,
      isCurrent: !!v.is_current,
      count: ratings.length
    };
  });

  if (!entries.length && previousWorkplaces) {
    previousWorkplaces.split(/[,;|\n]/).map(s => s.trim()).filter(Boolean).forEach(name => {
      entries.push({ name, avg: null, isCurrent: false, count: 0 });
    });
  }
  return entries;
}

const CLIENT_PROF_STYLE_PICKS = [
  'Hip Hop', 'Comunicativo', 'Moderno', 'Premium', 'Extrovertido',
  'Despojado', 'Experiente', 'MPB', 'Detalhista', 'Criativo', 'Casual', 'Noturno'
];
const CLIENT_EST_STYLE_PICKS = [
  'Descontraído', 'Premium', 'Família', 'Animado', 'Acolhedor', 'Wi-Fi', 'Moderno', 'Todos'
];

const WORK_STYLE_TAG_OPTIONS = [
  'Alto volume', 'Atendimento premium', 'Detalhista', 'Rápido e objetivo',
  'Fiel ao estilo do salão', 'Criativo', 'Paciente', 'Foco em fidelização'
];

function formatCepDisplay(zip) {
  const d = String(zip || '').replace(/\D/g, '');
  if (d.length !== 8) return zip || '—';
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

function calcAgeFromBirthDate(birthDate) {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age >= 0 && age < 120 ? age : null;
}

function formatJobDurationMonths(months) {
  const n = parseInt(months, 10);
  if (!n || n <= 0) return null;
  if (n < 12) return `${n} ${n === 1 ? 'mês' : 'meses'}`;
  const years = Math.floor(n / 12);
  const rem = n % 12;
  if (!rem) return `${years} ${years === 1 ? 'ano' : 'anos'}`;
  return `${years}a ${rem}m`;
}

function calcClientsPerYear(carteira, yearsExperience) {
  const c = Number(carteira) || 0;
  const y = Number(yearsExperience) || 0;
  if (!c || !y) return null;
  return Math.round((c / y) * 10) / 10;
}

function formatCarteiraContratanteLabel(count) {
  const n = Number(count) || 0;
  if (n === 0) return 'Carteira em formação no Ranking Pro';
  if (n === 1) return 'Atendeu 1 cliente único no Ranking Pro';
  return `Atendeu ${n} clientes únicos no Ranking Pro`;
}

function buildContratanteHiringMetrics(prof, opts = {}) {
  const years = prof?.profile?.years_experience ?? prof?.years_experience ?? 0;
  const carteira = prof?.client_portfolio_count
    ?? prof?._talentMetrics?.carteira?.total
    ?? 0;
  const age = opts.privateData?.birth_date
    ? calcAgeFromBirthDate(opts.privateData.birth_date)
    : null;
  const clientsPerYear = calcClientsPerYear(carteira, years);
  return {
    yearsExperience: years || null,
    carteira,
    carteiraLabel: formatCarteiraContratanteLabel(carteira),
    avgJobDuration: formatJobDurationMonths(prof?.average_job_duration_months),
    salaryExpectation: prof?.salary_expectation || null,
    workStyleTags: prof?.work_style_tags || [],
    musicTags: prof?.music_tags || [],
    age,
    clientsPerYear,
    avgRating: prof?.avg_rating ? Number(prof.avg_rating).toFixed(1) : null
  };
}

function getProoflyScoreTierInfo(score) {
  const s = score == null ? 0 : Math.max(0, Math.min(100, Number(score)));
  if (s >= 80) return { tier: 'elite', label: 'Elite', tagline: 'Reputação de referência', pct: s };
  if (s >= 60) return { tier: 'strong', label: 'Forte', tagline: 'Histórico consistente', pct: s };
  if (s >= 40) return { tier: 'solid', label: 'Sólido', tagline: 'Construindo confiança', pct: s };
  return { tier: 'forming', label: 'Em formação', tagline: 'Poucos sinais ainda', pct: s };
}

function renderProoflyScoreRingHtml(score) {
  const tier = getProoflyScoreTierInfo(score);
  const dash = tier.pct;
  return `
    <div class="proofly-score-ring-viz" aria-hidden="true">
      <svg viewBox="0 0 36 36" class="proofly-score-ring-svg">
        <path class="ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
        <path class="ring-fill" stroke-dasharray="${dash}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
      </svg>
      <span class="proofly-score-tier-center">${tier.label}</span>
    </div>
    <span class="num">${score}/100</span>
  `;
}

function updateProoflyScoreBlock(blockEl, scoreEl, labelEl, breakdownEl, data) {
  if (!blockEl) return;
  const score = data?.score ?? 0;
  const hasData = (data?.clientStats?.total || 0) + (data?.estabStats?.total || 0) > 0 || score > 0;
  const tier = getProoflyScoreTierInfo(score);
  blockEl.classList.toggle('empty', !hasData && score < 20);
  blockEl.classList.remove('proofly-tier-elite', 'proofly-tier-strong', 'proofly-tier-solid', 'proofly-tier-forming');
  blockEl.classList.add(`proofly-tier-${tier.tier}`);
  const ringEl = blockEl.querySelector('.proofly-score-ring');
  if (ringEl) {
    ringEl.innerHTML = renderProoflyScoreRingHtml(score);
  } else if (scoreEl) {
    scoreEl.textContent = `${score}`;
  }
  if (labelEl) {
    labelEl.textContent = hasData ? `Reputação ${tier.label}` : 'Construindo reputação';
  }
  if (breakdownEl && data) {
    const wAvg = data.weightedAvg ? data.weightedAvg.toFixed(1) : '—';
    const c = data.clientStats?.total || 0;
    const e = data.estabStats?.total || 0;
    breakdownEl.textContent = hasData
      ? `${tier.tagline} · Média ponderada ${wAvg}★ · ${c} cliente(s) ×1 · ${e} estab. ×3`
      : 'Aguardando avaliações...';
  }
}

function incrementProfileView(entityId, entityType) {
  const typeKey = entityType === 'prof' ? 'prof' : 'est';
  const key = `proofly_views_${typeKey}_${entityId}`;
  try {
    const v = parseInt(localStorage.getItem(key) || '0', 10) + 1;
    localStorage.setItem(key, String(v));
  } catch { /* noop */ }
}

function profilePageUrl(tipo, id) {
  const isProf = tipo === 'profissional' || tipo === 'professional';
  const type = isProf ? 'professional' : 'establishment';
  const legacyTipo = isProf ? 'profissional' : 'estabelecimento';
  return `./perfil-page.html?id=${encodeURIComponent(id)}&type=${type}&tipo=${legacyTipo}`;
}

function openProfile(tipo, id) {
  if (typeof window.abrirDrawer === 'function') {
    window.abrirDrawer(tipo, id);
    return;
  }
  window.location.href = profilePageUrl(tipo, id);
}

function defaultSearchPageUrl() {
  const sess = typeof getSession === 'function' ? getSession() : null;
  if (sess?.role === 'estabelecimento') return './dashboard-estabelecimento.html';
  return './cliente.html';
}

const MAX_GALLERY_PHOTOS = 4;

function getProfilePhotos(item) {
  const photos = [];
  const add = url => {
    if (url && String(url).trim() && !photos.includes(url)) photos.push(url);
  };
  add(item?.avatar_url);
  (item?.gallery_urls || []).forEach(add);
  if (!photos.length && item?.id && typeof window.SeedImages !== 'undefined') {
    const seeded = window.SeedImages.resolvePhotos(item);
    if (seeded) {
      add(seeded.avatar_url);
      (seeded.gallery_urls || []).forEach(add);
    }
  }
  return photos.slice(0, MAX_GALLERY_PHOTOS);
}

function getLikeCount(entityId, entityType) {
  const typeKey = entityType === 'prof' ? 'prof' : 'est';
  let stored = 0;
  try {
    stored = parseInt(localStorage.getItem(`proofly_likes_${typeKey}_${entityId}`) || '0', 10);
  } catch { /* noop */ }
  const mockBase = (_entityHash(entityId) % 48) + 6;
  return stored + mockBase;
}

function isProfileLikedByUser(entityId, entityType) {
  const typeKey = entityType === 'prof' ? 'prof' : 'est';
  try {
    return localStorage.getItem(`proofly_liked_${typeKey}_${entityId}`) === '1';
  } catch { return false; }
}

function curtirPerfil(entityId, entityType) {
  const typeKey = entityType === 'prof' ? 'prof' : 'est';
  const likedKey = `proofly_liked_${typeKey}_${entityId}`;
  const countKey = `proofly_likes_${typeKey}_${entityId}`;
  if (isProfileLikedByUser(entityId, entityType)) {
    return { liked: true, count: getLikeCount(entityId, entityType), already: true };
  }
  try {
    localStorage.setItem(likedKey, '1');
    const next = parseInt(localStorage.getItem(countKey) || '0', 10) + 1;
    localStorage.setItem(countKey, String(next));
  } catch { /* noop */ }
  return { liked: true, count: getLikeCount(entityId, entityType), already: false };
}

function applyProfileAvatar(imgEl, placeholderEl, name, url) {
  const src = getAvatarUrl(url);
  const initial = (name || '?').charAt(0).toUpperCase();
  if (!imgEl) return;
  imgEl.src = src;
  imgEl.style.display = 'block';
  imgEl.onerror = function() {
    this.onerror = null;
    this.style.display = 'none';
    if (placeholderEl) {
      placeholderEl.style.display = 'flex';
      placeholderEl.textContent = initial;
    }
  };
  if (url && String(url).trim()) {
    if (placeholderEl) placeholderEl.style.display = 'none';
  } else if (placeholderEl) {
    placeholderEl.style.display = 'none';
  }
}

function renderDrawerAvatar(name, url) {
  const initial = (name || '?').charAt(0).toUpperCase();
  const src = getAvatarUrl(url);
  return `<img src="${src}" class="avatar-img" alt="" onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex';"><div class="avatar-placeholder" style="display:none;">${initial}</div>`;
}

function renderResultAvatar(name, url) {
  const initial = (name || '?').charAt(0).toUpperCase();
  const src = getAvatarUrl(url);
  return `<img src="${src}" class="result-avatar" alt="" onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex';"><div class="result-avatar-placeholder" style="display:none;">${initial}</div>`;
}

function tempoRelativo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const then = new Date(dateStr);
  let diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `Há ${diff}s`;
  diff = Math.floor(diff / 60);
  if (diff < 60) return `Há ${diff}min`;
  diff = Math.floor(diff / 60);
  if (diff < 24) return `Há ${diff}h`;
  diff = Math.floor(diff / 24);
  if (diff < 7) return `Há ${diff}d`;
  if (diff < 30) return `Há ${Math.floor(diff / 7)} sem`;
  if (diff < 365) return `Há ${Math.floor(diff / 30)} meses`;
  return then.toLocaleDateString('pt-BR');
}

// ===== NORMALIZAÇÃO DE TEXTO (busca + cadastro) =====
const PT_TITLE_LOWER_WORDS = new Set([
  'de', 'da', 'do', 'dos', 'das', 'e', 'em', 'no', 'na', 'nos', 'nas',
  'a', 'o', 'as', 'os', 'ao', 'aos', 'à', 'às'
]);

function normalizeForSearch(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleCaseToken(token, isFirstWord) {
  if (!token) return '';
  const lower = token.toLowerCase();
  if (!isFirstWord && PT_TITLE_LOWER_WORDS.has(lower)) return lower;
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function formatTitleCasePt(text) {
  const cleaned = String(text || '').trim().replace(/\s+/g, ' ');
  if (!cleaned) return '';
  return cleaned.split(' ').map((word, index) => {
    if (word.includes('-')) {
      return word.split('-').map((part, partIndex) =>
        titleCaseToken(part, index === 0 && partIndex === 0)
      ).join('-');
    }
    if (word.includes("'")) {
      return word.split("'").map((part, partIndex) =>
        titleCaseToken(part, index === 0 && partIndex === 0)
      ).join("'");
    }
    return titleCaseToken(word, index === 0);
  }).join(' ');
}

function formatPersonName(text) {
  return formatTitleCasePt(text);
}

function formatAddressLine(text) {
  return formatTitleCasePt(text);
}

function formatCityName(text) {
  return formatTitleCasePt(text);
}

function formatNeighborhoodName(text) {
  return formatTitleCasePt(text);
}

function formatComplement(text) {
  return formatTitleCasePt(text);
}

function formatEstablishmentName(text) {
  return formatTitleCasePt(text);
}

function formatSpecialtyText(text) {
  return formatTitleCasePt(text);
}

function formatBioText(text) {
  const cleaned = String(text || '').trim().replace(/\s+/g, ' ');
  if (!cleaned) return '';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function formatStateUf(text) {
  return String(text || '').replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2);
}

function getNestedFieldValue(item, path) {
  return String(path).split('.').reduce((acc, key) => {
    if (acc == null) return null;
    return acc[key];
  }, item);
}

function matchesSearchText(item, term, fieldPaths) {
  const normTerm = normalizeForSearch(term);
  if (!normTerm) return true;
  const tokens = normTerm.split(' ').filter(Boolean);
  const haystack = (fieldPaths || [])
    .map(path => normalizeForSearch(getNestedFieldValue(item, path)))
    .filter(Boolean)
    .join(' ');
  if (!haystack) return false;
  return tokens.every(token => haystack.includes(token));
}

function filterItemsBySearchText(items, term, fieldPaths) {
  if (!term || term.length < 2) return items || [];
  return (items || []).filter(item => matchesSearchText(item, term, fieldPaths));
}

function bindInputFormatting(input, formatter) {
  if (!input || typeof formatter !== 'function') return;
  input.addEventListener('blur', () => {
    const formatted = formatter(input.value);
    if (formatted != null) input.value = formatted;
  });
}

function bindRegistrationFormatting(fieldMap) {
  const formatters = {
    name: formatPersonName,
    establishmentName: formatEstablishmentName,
    specialty: formatSpecialtyText,
    bio: formatBioText,
    street: formatAddressLine,
    neighborhood: formatNeighborhoodName,
    city: formatCityName,
    state: formatStateUf,
    complement: formatComplement
  };
  Object.entries(fieldMap || {}).forEach(([key, input]) => {
    if (input && formatters[key]) bindInputFormatting(input, formatters[key]);
  });
}

function formatTextFields(values, schema) {
  const formatters = {
    personName: formatPersonName,
    establishmentName: formatEstablishmentName,
    specialty: formatSpecialtyText,
    bio: formatBioText,
    address: formatAddressLine,
    neighborhood: formatNeighborhoodName,
    city: formatCityName,
    state: formatStateUf,
    complement: formatComplement
  };
  const result = { ...values };
  Object.entries(schema || {}).forEach(([key, type]) => {
    if (result[key] == null || result[key] === '') return;
    const fn = formatters[type];
    if (fn) result[key] = fn(String(result[key]));
  });
  return result;
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function sanitizeInput(value) {
  if (!value) return '';
  return escapeHtml(value);
}

function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const sanitized = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const val = obj[key];
      if (typeof val === 'string') {
        sanitized[key] = sanitizeInput(val);
      } else if (Array.isArray(val)) {
        sanitized[key] = val.map(item => typeof item === 'string' ? sanitizeInput(item) : item);
      } else if (typeof val === 'object' && val !== null) {
        sanitized[key] = sanitizeObject(val);
      } else {
        sanitized[key] = val;
      }
    }
  }
  return sanitized;
}

function onlyNumbers(event) {
  const input = event.target;
  input.value = input.value.replace(/\D/g, '');
}

function onlyNumbersInput(input) {
  if (!input) return;
  input.value = input.value.replace(/\D/g, '');
}

function onlyLettersInput(input, allowSpaces = true) {
  if (!input) return;
  const re = allowSpaces ? /[^a-zA-ZÀ-ÿ\s'.-]/g : /[^a-zA-ZÀ-ÿ]/g;
  input.value = input.value.replace(re, '');
}

function onlyUpperLettersInput(input, maxLen) {
  if (!input) return;
  let v = input.value.replace(/[^a-zA-Z]/g, '').toUpperCase();
  if (maxLen) v = v.slice(0, maxLen);
  input.value = v;
}

function formatarDataNascimento(input) {
  let value = input.value.replace(/\D/g, '');
  if (value.length > 8) value = value.slice(0, 8);
  let formatted = value;
  if (value.length > 4) formatted = `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`;
  else if (value.length > 2) formatted = `${value.slice(0, 2)}/${value.slice(2)}`;
  input.value = formatted;
  return formatted;
}

function parseDataBR(str) {
  const m = (str || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const d = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10);
  const y = parseInt(m[3], 10);
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function validarDataNascimento(input) {
  const value = input.value.trim();
  const errorEl = input.parentElement?.querySelector('.error-message');
  if (!value) {
    input.classList.remove('error');
    if (errorEl) errorEl.classList.remove('show');
    return true;
  }
  const iso = parseDataBR(value);
  const isValid = !!iso;
  input.classList.toggle('error', !isValid);
  if (errorEl) errorEl.classList.toggle('show', !isValid);
  return isValid ? iso : null;
}

function validarEmailInput(input) {
  const value = (input?.value || '').trim();
  const errorEl = input?.parentElement?.querySelector('.error-message');
  if (!value) {
    input.classList.remove('error');
    if (errorEl) errorEl.classList.remove('show');
    return false;
  }
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  input.classList.toggle('error', !isValid);
  if (errorEl) errorEl.classList.toggle('show', !isValid);
  return isValid;
}

function syncClientPrefsFromRecord(client) {
  if (!client || typeof setStoredClientPrefs !== 'function') return;
  const profTags = client.prof_style_tags || [];
  const estTags = client.est_style_tags || [];
  setStoredClientPrefs({
    onboardingDone: profTags.length > 0 || estTags.length > 0,
    profTags,
    estTags
  });
}

function formatarTelefone(input) {
  let value = input.value.replace(/\D/g, '');
  if (value.length === 0) { input.value = ''; input.classList.remove('error'); return true; }
  let formatted = '';
  if (value.length <= 2) formatted = `(${value}`;
  else if (value.length <= 6) formatted = `(${value.substring(0,2)}) ${value.substring(2)}`;
  else if (value.length <= 10) formatted = `(${value.substring(0,2)}) ${value.substring(2,6)}-${value.substring(6)}`;
  else formatted = `(${value.substring(0,2)}) ${value.substring(2,7)}-${value.substring(7,11)}`;
  input.value = formatted;
  const digits = input.value.replace(/\D/g, '');
  const isValid = digits.length >= 10;
  input.classList.toggle('error', !isValid && digits.length > 0);
  return isValid;
}

function formatarCPF(input) {
  let value = input.value.replace(/\D/g, '');
  if (value.length > 11) value = value.slice(0, 11);
  let formatted = '';
  if (value.length <= 3) formatted = value;
  else if (value.length <= 6) formatted = `${value.substring(0,3)}.${value.substring(3)}`;
  else if (value.length <= 9) formatted = `${value.substring(0,3)}.${value.substring(3,6)}.${value.substring(6)}`;
  else formatted = `${value.substring(0,3)}.${value.substring(3,6)}.${value.substring(6,9)}-${value.substring(9)}`;
  input.value = formatted;
  validarCPF(input);
}

function validarCPF(input) {
  const value = input.value.replace(/\D/g, '');
  const errorEl = input.parentElement?.querySelector('.error-message');
  if (value.length === 0) { input.classList.remove('error'); if (errorEl) errorEl.classList.remove('show'); return true; }
  const isValid = validarCPFReal(value);
  input.classList.toggle('error', !isValid);
  if (errorEl) errorEl.classList.toggle('show', !isValid);
  return isValid;
}

const SKIP_CPF_VALIDATION = true;

function validarCPFReal(cpf) {
  if (SKIP_CPF_VALIDATION) {
    cpf = String(cpf || '').replace(/\D/g, '');
    return cpf.length >= 11;
  }
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i);
  let resto = soma % 11;
  let digito = resto < 2 ? 0 : 11 - resto;
  if (parseInt(cpf.charAt(9)) !== digito) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i);
  resto = soma % 11;
  digito = resto < 2 ? 0 : 11 - resto;
  if (parseInt(cpf.charAt(10)) !== digito) return false;
  return true;
}

function initMobileSwipeGuard() {
  if (window._prooflySwipeGuardInit) return;
  window._prooflySwipeGuardInit = true;

  const isTouchUI = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  if (!isTouchUI) return;

  document.body.classList.add('cliente-no-swipe-nav');

  let touchStartX = 0;
  let touchStartY = 0;

  document.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (e.touches.length !== 1) return;
    const dx = Math.abs(e.touches[0].clientX - touchStartX);
    const dy = Math.abs(e.touches[0].clientY - touchStartY);
    const target = e.target;
    const inMenu = target?.closest?.(
      '.floating-menu, .floating-menu-shell, .reco-carousel-track, .menu-lateral, .menu-lateral-shell'
    );
    if (inMenu) return;
    if (dx > dy && dx > 12) {
      e.preventDefault();
    }
  }, { passive: false });
}

function formatarCEP(input) {
  let value = input.value.replace(/\D/g, '');
  if (value.length > 8) value = value.slice(0, 8);
  if (value.length <= 5) input.value = value;
  else input.value = `${value.substring(0,5)}-${value.substring(5)}`;
}

function resolveFormFieldRef(ref) {
  if (!ref) return null;
  if (typeof ref === 'string') return document.getElementById(ref);
  return ref;
}

function setupCepAutoFill(cepInput, fields) {
  const cepEl = resolveFormFieldRef(cepInput);
  if (!cepEl || typeof cepEl.addEventListener !== 'function') return;
  const street = resolveFormFieldRef(fields?.street);
  const neighborhood = resolveFormFieldRef(fields?.neighborhood);
  const city = resolveFormFieldRef(fields?.city);
  const state = resolveFormFieldRef(fields?.state);
  let loading = false, timeoutId = null;
  async function handleCep() {
    const value = cepEl.value.replace(/\D/g, '');
    if (value.length !== 8) return;
    if (loading) return;
    loading = true;
    const spinner = document.createElement('span');
    spinner.className = 'cep-loading';
    spinner.textContent = '⏳';
    cepEl.parentNode.appendChild(spinner);
    cepEl.disabled = true;
    try {
      const response = await fetch(`https://viacep.com.br/ws/${value}/json/`);
      const data = await response.json();
      if (data.erro) { showAlert('⚠️ Atenção', 'CEP não encontrado.'); return; }
      const fmtStreet = typeof formatAddressLine === 'function' ? formatAddressLine : (v) => v;
      const fmtNeighborhood = typeof formatNeighborhoodName === 'function' ? formatNeighborhoodName : (v) => v;
      const fmtCity = typeof formatCityName === 'function' ? formatCityName : (v) => v;
      const fmtState = typeof formatStateUf === 'function' ? formatStateUf : (v) => v;
      if (street) { street.value = fmtStreet(data.logradouro || ''); highlightField(street); }
      if (neighborhood) { neighborhood.value = fmtNeighborhood(data.bairro || ''); highlightField(neighborhood); }
      if (city) { city.value = fmtCity(data.localidade || ''); highlightField(city); }
      if (state) { state.value = fmtState(data.uf || ''); highlightField(state); }
    } catch (e) { showAlert('❌ Erro', 'Não foi possível buscar o CEP.'); }
    finally {
      loading = false; cepEl.disabled = false;
      const spinnerEl = cepEl.parentNode.querySelector('.cep-loading');
      if (spinnerEl) spinnerEl.remove();
    }
  }
  function highlightField(field) {
    if (!field?.classList) return;
    field.classList.add('cep-filled');
    setTimeout(() => field.classList.remove('cep-filled'), 600);
  }
  cepEl.addEventListener('blur', function() {
    clearTimeout(timeoutId);
    if (this.value.replace(/\D/g, '').length === 8) handleCep();
  });
  cepEl.addEventListener('input', function() {
    const val = this.value.replace(/\D/g, '');
    if (val.length === 8) { clearTimeout(timeoutId); timeoutId = setTimeout(handleCep, 500); }
  });
}

function resizeAndCompressImage(file, maxWidth = 300, maxHeight = 300, quality = 0.6) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        let width = img.width, height = img.height;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio); height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function previewAvatar(fileInput, previewElement, placeholderElement) {
  const file = fileInput.files[0];
  if (!file) { previewElement.style.display = 'none'; if (placeholderElement) placeholderElement.style.display = 'flex'; return; }
  const reader = new FileReader();
  reader.onload = function(e) {
    previewElement.src = e.target.result;
    previewElement.style.display = 'block';
    if (placeholderElement) placeholderElement.style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function getTagClass(tag) {
  const music = ['Rap','Rock','MPB','Pagode'];
  const visual = ['Street','Casual','Urbano'];
  const amenity = ['Wi-Fi','TV','Ar Condicionado','Estacionamento'];
  if (music.includes(tag)) return 'prof-tag prof-tag-music';
  if (visual.includes(tag)) return 'prof-tag prof-tag-visual';
  if (amenity.includes(tag)) return 'prof-tag prof-tag-amenity';
  return 'prof-tag';
}

// ===== EXPOR FUNÇÕES EXISTENTES =====
window.TAG_MAP = TAG_MAP;
window.renderTagWithEmoji = renderTagWithEmoji;
window.renderEditChips = renderEditChips;
window.buildTagSearchConditions = buildTagSearchConditions;
window.showUserMessage = showUserMessage;
window.renderStars = renderStars;
window.computeRatingStats = computeRatingStats;
window.renderRatingDistribution = renderRatingDistribution;
window.renderRatingSummary = renderRatingSummary;
window.DEFAULT_AVATAR_URL = DEFAULT_AVATAR_URL;
window.getAvatarUrl = getAvatarUrl;
window.formatUsername = formatUsername;
window.updateProfileRatingBlock = updateProfileRatingBlock;
window.REVIEW_TYPES = REVIEW_TYPES;
window.PROOFLY_WEIGHTS = PROOFLY_WEIGHTS;
window.filterReviewsByType = filterReviewsByType;
window.groupReviewsForProofly = groupReviewsForProofly;
window.calcularProoflyScore = calcularProoflyScore;
window.calcularProoflyScoreFromReviews = calcularProoflyScoreFromReviews;
window.calcularProoflyScoreRapido = calcularProoflyScoreRapido;
window.getProoflyBadges = getProoflyBadges;
window.buildStrengthPoints = buildStrengthPoints;
window.buildWorkHistory = buildWorkHistory;
window.CLIENT_PROF_STYLE_PICKS = CLIENT_PROF_STYLE_PICKS;
window.CLIENT_EST_STYLE_PICKS = CLIENT_EST_STYLE_PICKS;
window.formatCepDisplay = formatCepDisplay;
window.WORK_STYLE_TAG_OPTIONS = WORK_STYLE_TAG_OPTIONS;
window.calcAgeFromBirthDate = calcAgeFromBirthDate;
window.formatJobDurationMonths = formatJobDurationMonths;
window.calcClientsPerYear = calcClientsPerYear;
window.buildContratanteHiringMetrics = buildContratanteHiringMetrics;
window.formatCarteiraContratanteLabel = formatCarteiraContratanteLabel;
window.getMockSocialSignals = getMockSocialSignals;
window.updateProoflyScoreBlock = updateProoflyScoreBlock;
window.incrementProfileView = incrementProfileView;
window.profilePageUrl = profilePageUrl;
window.openProfile = openProfile;
window.defaultSearchPageUrl = defaultSearchPageUrl;
window.getProfilePhotos = getProfilePhotos;
window.getStoredFavorites = getStoredFavorites;
window.removeStoredFavorite = removeStoredFavorite;
window.CLIENT_PREFS_KEY = CLIENT_PREFS_KEY;
window.getStoredClientPrefs = getStoredClientPrefs;
window.setStoredClientPrefs = setStoredClientPrefs;
window.getEffectiveClientTags = getEffectiveClientTags;
window.getLikeCount = getLikeCount;
window.isProfileLikedByUser = isProfileLikedByUser;
window.curtirPerfil = curtirPerfil;
window.MAX_GALLERY_PHOTOS = MAX_GALLERY_PHOTOS;
window.ratingSourceToScore = ratingSourceToScore;
window.applyProfileAvatar = applyProfileAvatar;
window.renderDrawerAvatar = renderDrawerAvatar;
window.renderResultAvatar = renderResultAvatar;
window.tempoRelativo = tempoRelativo;
window.escapeHtml = escapeHtml;
window.sanitizeInput = sanitizeInput;
window.sanitizeObject = sanitizeObject;
window.onlyNumbers = onlyNumbers;
window.onlyNumbersInput = onlyNumbersInput;
window.onlyLettersInput = onlyLettersInput;
window.onlyUpperLettersInput = onlyUpperLettersInput;
window.formatarDataNascimento = formatarDataNascimento;
window.parseDataBR = parseDataBR;
window.validarDataNascimento = validarDataNascimento;
window.validarEmailInput = validarEmailInput;
window.syncClientPrefsFromRecord = syncClientPrefsFromRecord;
window.formatarTelefone = formatarTelefone;
window.formatarCPF = formatarCPF;
window.validarCPF = validarCPF;
window.validarCPFReal = validarCPFReal;
window.initMobileSwipeGuard = initMobileSwipeGuard;
window.formatarCEP = formatarCEP;
window.setupCepAutoFill = setupCepAutoFill;
window.resizeAndCompressImage = resizeAndCompressImage;
window.previewAvatar = previewAvatar;
window.getTagClass = getTagClass;

// Injetar estilos para CEP
(function injectCepStyles() {
  if (document.getElementById('cep-styles')) return;
  const style = document.createElement('style');
  style.id = 'cep-styles';
  style.textContent = `
    .cep-loading { margin-left: 8px; font-size: 16px; display: inline-block; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .cep-filled { background-color: #e0e7ff !important; transition: background 0.3s ease; }
    .form-group input.error, .form-group textarea.error { border-color: #ef4444; background-color: #fef2f2; }
    .form-group .error-message { color: #ef4444; font-size: 13px; margin-top: 4px; display: none; }
    .form-group .error-message.show { display: block; }
  `;
  document.head.appendChild(style);
})();

console.log("utils.js carregado");

// ========================================
// MATCH ENGINE (robusto e limpo)
// ========================================

const MATCH_WEIGHTS = {
  music: 2,
  visual: 2,
  personality: 3,
  lifestyle: 2,
  work: 3,
  location: 4,
  price: 2,
  rating: 3
};

const MATCH_WEIGHTS_EST = {
  infra: 2,
  music: 2,
  positioning: 3,
  audience: 3,
  vibe: 3,
  rating: 3
};

const PROF_TAG_CATEGORY_MAP = {
  'Música': 'music',
  'Visual': 'visual',
  'Personalidade': 'personality',
  'Estilo de Vida': 'lifestyle',
  'Trabalho': 'work'
};

const EST_TAG_CATEGORY_MAP = {
  'Infraestrutura': 'infra',
  'Música Ambiente': 'music',
  'Posicionamento': 'positioning',
  'Público': 'audience',
  'Vibe': 'vibe'
};

window.MATCH_WEIGHTS = MATCH_WEIGHTS;
window.MATCH_WEIGHTS_EST = MATCH_WEIGHTS_EST;

// ========================================
// Localização do cliente (GPS + proximidade)
// ========================================

const CLIENT_LOCATION_KEY = 'proofly_client_location';
const LOCATION_CACHE_MS = 30 * 60 * 1000;
const LOCATION_STALE_MS = 24 * 60 * 60 * 1000;

const BR_CITY_COORDS = {
  'sao paulo': { lat: -23.5505, lng: -46.6333 },
  'rio de janeiro': { lat: -22.9068, lng: -43.1729 },
  'belo horizonte': { lat: -19.9167, lng: -43.9345 },
  'brasilia': { lat: -15.7939, lng: -47.8828 },
  'curitiba': { lat: -25.4284, lng: -49.2733 },
  'porto alegre': { lat: -30.0346, lng: -51.2177 },
  'salvador': { lat: -12.9777, lng: -38.5016 },
  'recife': { lat: -8.0476, lng: -34.877 },
  'fortaleza': { lat: -3.7319, lng: -38.5267 },
  'campinas': { lat: -22.9099, lng: -47.0626 },
  'santos': { lat: -23.9608, lng: -46.3336 },
  'guarulhos': { lat: -23.4628, lng: -46.5333 },
  'niteroi': { lat: -22.8832, lng: -43.1034 },
  'florianopolis': { lat: -27.5954, lng: -48.548 },
  'goiania': { lat: -16.6869, lng: -49.2648 }
};

function normalizeCityKey(city) {
  return String(city || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function hashToUnit(str) {
  let hash = 0;
  const s = String(str || '');
  for (let i = 0; i < s.length; i++) hash = ((hash << 5) - hash) + s.charCodeAt(i);
  return (Math.abs(hash) % 10000) / 10000;
}

function getStoredClientLocation() {
  try {
    const raw = localStorage.getItem(CLIENT_LOCATION_KEY);
    if (!raw) return null;
    const loc = JSON.parse(raw);
    if (loc?.lat == null || loc?.lng == null) return null;
    if (Date.now() - (loc.at || 0) > LOCATION_STALE_MS) return null;
    return loc;
  } catch {
    return null;
  }
}

function storeClientLocation(loc) {
  if (!loc?.lat || !loc?.lng) return;
  try {
    localStorage.setItem(CLIENT_LOCATION_KEY, JSON.stringify(loc));
  } catch { /* noop */ }
}

function detectClientLocation(options = {}) {
  const cached = getStoredClientLocation();
  if (cached && !options.force && Date.now() - (cached.at || 0) < LOCATION_CACHE_MS) {
    return Promise.resolve(cached);
  }

  if (!navigator.geolocation) {
    return Promise.resolve(cached);
  }

  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          at: Date.now(),
          source: 'gps'
        };
        storeClientLocation(loc);
        resolve(loc);
      },
      () => resolve(cached),
      {
        enableHighAccuracy: false,
        timeout: options.timeout || 12000,
        maximumAge: LOCATION_CACHE_MS
      }
    );
  });
}

function haversineKm(a, b) {
  if (!a?.lat || !b?.lat) return null;
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function offsetFromCenter(center, seed, minKm, maxKm) {
  const u1 = hashToUnit(seed + ':a');
  const u2 = hashToUnit(seed + ':b');
  const angle = u1 * 2 * Math.PI;
  const radiusKm = minKm + u2 * (maxKm - minKm);
  const cosLat = Math.cos(center.lat * Math.PI / 180) || 1;
  return {
    lat: center.lat + (radiusKm / 111) * Math.cos(angle),
    lng: center.lng + (radiusKm / (111 * cosLat)) * Math.sin(angle)
  };
}

function getItemCity(item, tipo) {
  if (tipo === 'est') return item?.city || null;
  return item?.current_establishment?.city || item?.city || null;
}

function estimateItemCoords(item, tipo, userLoc) {
  const seed = item?.id || item?.name || 'item';
  const cityKey = normalizeCityKey(getItemCity(item, tipo));
  const cityCenter = BR_CITY_COORDS[cityKey];

  if (cityCenter) {
    const coords = offsetFromCenter(cityCenter, seed, 0.4, 8);
    return { ...coords, precision: 'city' };
  }

  if (userLoc?.lat != null) {
    const coords = offsetFromCenter(
      { lat: userLoc.lat, lng: userLoc.lng },
      seed,
      1.5,
      28
    );
    return { ...coords, precision: 'estimate' };
  }

  return null;
}

function anexarDistancias(lista, userLoc, tipo) {
  if (!userLoc?.lat) {
    return (lista || []).map(item => ({ ...item, _distanceKm: null }));
  }
  const origin = { lat: userLoc.lat, lng: userLoc.lng };
  return (lista || []).map(item => {
    const coords = estimateItemCoords(item, tipo, userLoc);
    const km = coords ? haversineKm(origin, coords) : null;
    return {
      ...item,
      _distanceKm: km != null ? Math.round(km * 10) / 10 : null,
      _locationPrecision: coords?.precision || null
    };
  });
}

function formatDistanceKm(km) {
  if (km == null || Number.isNaN(km)) return null;
  if (km < 1) return `${Math.max(100, Math.round(km * 1000))} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

function intersect(arr1 = [], arr2 = []) {
  if (!arr1 || !arr2) return 0;
  return arr1.filter(x => arr2.includes(x)).length;
}

function calcularProximidade(userLoc, itemLoc) {
  if (!userLoc || !itemLoc) return 0;
  return userLoc === itemLoc ? 1 : 0;
}

function calcularCompatibilidadePreco(userPrice, itemPrice) {
  if (!userPrice || !itemPrice) return 0;
  return userPrice === itemPrice ? 1 : 0;
}

function calcularMatchScore(userPrefs, item) {
  let score = 0;

  score += intersect(userPrefs.music, item.music_tags || []) * MATCH_WEIGHTS.music;
  score += intersect(userPrefs.visual, item.visual_tags || []) * MATCH_WEIGHTS.visual;
  score += intersect(userPrefs.personality, item.personality_tags || []) * MATCH_WEIGHTS.personality;
  score += intersect(userPrefs.lifestyle, item.lifestyle_tags || []) * MATCH_WEIGHTS.lifestyle;
  score += intersect(userPrefs.work, item.work_tags || []) * MATCH_WEIGHTS.work;

  score += calcularProximidade(userPrefs.location, item.location) * MATCH_WEIGHTS.location;
  score += calcularCompatibilidadePreco(userPrefs.price, item.price_range) * MATCH_WEIGHTS.price;

  score += (item.avg_rating || 0) * MATCH_WEIGHTS.rating;

  return score;
}

function normalizarScore(score) {
  return Math.min(100, Math.round(score));
}

function calcularMatchScoreEst(userPrefs, item) {
  let score = 0;

  score += intersect(userPrefs.infra, item.infra_tags || []) * MATCH_WEIGHTS_EST.infra;
  score += intersect(userPrefs.music, item.music_tags || []) * MATCH_WEIGHTS_EST.music;
  score += intersect(userPrefs.positioning, item.positioning_tags || []) * MATCH_WEIGHTS_EST.positioning;
  score += intersect(userPrefs.audience, item.audience_tags || []) * MATCH_WEIGHTS_EST.audience;
  score += intersect(userPrefs.vibe, item.vibe_tags || []) * MATCH_WEIGHTS_EST.vibe;

  score += (item.avg_rating || 0) * MATCH_WEIGHTS_EST.rating;

  return score;
}

function buildUserPrefsFromTags(activeTags, tipo) {
  if (tipo === 'prof') {
    const prefs = { music: [], visual: [], personality: [], lifestyle: [], work: [], location: null, price: null };
    (activeTags || []).forEach(tag => {
      const cat = TAG_MAP[tag]?.category;
      const key = PROF_TAG_CATEGORY_MAP[cat];
      if (key) prefs[key].push(tag);
    });
    return prefs;
  }

  const prefs = { infra: [], music: [], positioning: [], audience: [], vibe: [] };
  (activeTags || []).forEach(tag => {
    const cat = TAG_MAP[tag]?.category;
    const key = EST_TAG_CATEGORY_MAP[cat];
    if (key) prefs[key].push(tag);
  });
  return prefs;
}

function getAllProfileTags(item, tipo) {
  if (tipo === 'prof') {
    return [
      ...(item.music_tags || []),
      ...(item.visual_tags || []),
      ...(item.personality_tags || []),
      ...(item.lifestyle_tags || []),
      ...(item.work_tags || [])
    ];
  }
  return [
    ...(item.infra_tags || []),
    ...(item.music_tags || []),
    ...(item.positioning_tags || []),
    ...(item.audience_tags || []),
    ...(item.vibe_tags || [])
  ];
}

function buildMatchBreakdown(item, tipo, activeTags) {
  const tags = activeTags || [];
  const insight = buildMatchInsight(item, tipo, tags);
  if (insight.needsPrefs) {
    return { ...insight, components: [], prefsTags: tags };
  }

  const prefs = buildUserPrefsFromTags(tags, tipo);
  const components = [];

  if (tipo === 'prof') {
    const add = (key, label, userArr, itemArr, weight) => {
      const hits = intersect(userArr, itemArr || []);
      if (!hits && !(itemArr || []).length) return;
      components.push({
        key, label, hits, weight,
        points: hits * weight,
        userTags: userArr,
        profileTags: (itemArr || []).filter(t => userArr.includes(t))
      });
    };
    add('music', 'Música', prefs.music, item.music_tags, MATCH_WEIGHTS.music);
    add('visual', 'Visual', prefs.visual, item.visual_tags, MATCH_WEIGHTS.visual);
    add('personality', 'Personalidade', prefs.personality, item.personality_tags, MATCH_WEIGHTS.personality);
    add('lifestyle', 'Estilo de vida', prefs.lifestyle, item.lifestyle_tags, MATCH_WEIGHTS.lifestyle);
    add('work', 'Trabalho', prefs.work, item.work_tags, MATCH_WEIGHTS.work);
    const locPts = calcularProximidade(prefs.location, item.location) * MATCH_WEIGHTS.location;
    if (locPts) components.push({ key: 'location', label: 'Localização', hits: 1, weight: MATCH_WEIGHTS.location, points: locPts });
    const pricePts = calcularCompatibilidadePreco(prefs.price, item.price_range) * MATCH_WEIGHTS.price;
    if (pricePts) components.push({ key: 'price', label: 'Preço', hits: 1, weight: MATCH_WEIGHTS.price, points: pricePts });
    const ratingPts = (item.avg_rating || 0) * MATCH_WEIGHTS.rating;
    components.push({
      key: 'rating', label: 'Nota média', hits: item.avg_rating || 0,
      weight: MATCH_WEIGHTS.rating, points: ratingPts,
      profileTags: [`${item.avg_rating || 0}★ (${item.total_reviews || 0} reviews)`]
    });
  } else {
    const add = (key, label, userArr, itemArr, weight) => {
      const hits = intersect(userArr, itemArr || []);
      components.push({
        key, label, hits, weight,
        points: hits * weight,
        userTags: userArr,
        profileTags: (itemArr || []).filter(t => userArr.includes(t))
      });
    };
    add('infra', 'Infra', prefs.infra, item.infra_tags, MATCH_WEIGHTS_EST.infra);
    add('music', 'Música', prefs.music, item.music_tags, MATCH_WEIGHTS_EST.music);
    add('positioning', 'Posicionamento', prefs.positioning, item.positioning_tags, MATCH_WEIGHTS_EST.positioning);
    add('audience', 'Público', prefs.audience, item.audience_tags, MATCH_WEIGHTS_EST.audience);
    add('vibe', 'Vibe', prefs.vibe, item.vibe_tags, MATCH_WEIGHTS_EST.vibe);
    components.push({
      key: 'rating', label: 'Nota média', hits: item.avg_rating || 0,
      weight: MATCH_WEIGHTS_EST.rating,
      points: (item.avg_rating || 0) * MATCH_WEIGHTS_EST.rating,
      profileTags: [`${item.avg_rating || 0}★`]
    });
  }

  return {
    percent: insight.percent,
    rawScore: insight.rawScore,
    sharedTags: insight.sharedTags,
    tier: insight.tier,
    needsPrefs: false,
    prefsTags: tags,
    components: components.sort((a, b) => (b.points || 0) - (a.points || 0))
  };
}

function buildMatchInsight(item, tipo, activeTags) {
  const tags = activeTags || [];
  if (!tags.length) {
    return {
      percent: null,
      sharedTags: [],
      headline: 'Melhore seus resultados',
      subline: 'Escolha seu estilo para ver compatibilidade real',
      tier: 'cool',
      rawScore: 0,
      needsPrefs: true
    };
  }

  const prefs = buildUserPrefsFromTags(tags, tipo);
  const calc = tipo === 'prof' ? calcularMatchScore : calcularMatchScoreEst;
  const rawScore = calc(prefs, item);
  const percent = normalizarScore(rawScore);
  const profileTags = getAllProfileTags(item, tipo);
  const sharedTags = tags.filter(t => profileTags.includes(t));

  let headline = '';
  let subline = '';
  let tier = 'cool';

  if (percent >= 80) tier = 'hot';
  else if (percent >= 55) tier = 'warm';

  if (sharedTags.length) {
    headline = 'Combina com você';
    subline = sharedTags.length === 1
      ? '1 coisa em comum com o que você busca'
      : `${sharedTags.length} coisas em comum com o que você busca`;
  } else if (percent >= 72) {
    headline = 'Combina com você';
    subline = 'Reputação e estilo alinhados ao seu perfil';
  } else if (percent >= 50) {
    headline = 'Boa chance de conexão';
    subline = 'Vale explorar o perfil completo';
  } else {
    headline = 'Descubra se combina';
    subline = 'Toque nas tags — pode surpreender';
  }

  return { percent, sharedTags, headline, subline, tier, rawScore, needsPrefs: false };
}

function anexarMatchScores(lista, userPrefs, tipo) {
  const calc = tipo === 'prof' ? calcularMatchScore : calcularMatchScoreEst;
  return lista.map(item => {
    const score = calc(userPrefs, item);
    return { ...item, _matchScore: score, _matchPercent: normalizarScore(score) };
  });
}

function comparadorQualificacao(a, b, tipo) {
  const ratingDiff = (b.avg_rating || 0) - (a.avg_rating || 0);
  if (ratingDiff !== 0) return ratingDiff;

  const reviewsDiff = (b.total_reviews || 0) - (a.total_reviews || 0);
  if (reviewsDiff !== 0) return reviewsDiff;

  if (tipo === 'prof') {
    const expA = a.profile?.years_experience || 0;
    const expB = b.profile?.years_experience || 0;
    return expB - expA;
  }

  return (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' });
}

function aplicarOrdenacao(lista, sortModes, userPrefs, tipo) {
  const modes = sortModes?.length ? sortModes : ['proximity', 'match'];
  let withScores = anexarMatchScores(lista, userPrefs, tipo);
  const userLoc = getStoredClientLocation();
  if (userLoc || modes.includes('proximity')) {
    withScores = anexarDistancias(withScores, userLoc, tipo);
  }

  const comparators = modes.map(mode => {
    switch (mode) {
      case 'proximity':
        return (a, b) => {
          const da = a._distanceKm;
          const db = b._distanceKm;
          if (da == null && db == null) return 0;
          if (da == null) return 1;
          if (db == null) return -1;
          return da - db;
        };
      case 'match':
        return (a, b) => (b._matchScore || 0) - (a._matchScore || 0);
      case 'name':
        return (a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' });
      case 'qualification':
        return (a, b) => comparadorQualificacao(a, b, tipo);
      default:
        return () => 0;
    }
  });

  return withScores.sort((a, b) => {
    for (const cmp of comparators) {
      const result = cmp(a, b);
      if (result !== 0) return result;
    }
    return 0;
  });
}

function ordenarPorMatch(lista, userPrefs) {
  return aplicarOrdenacao(lista, ['match'], userPrefs, 'prof');
}

const SORT_MODE_LABELS = {
  proximity: '📍 Proximidade',
  match: '🎯 Match',
  name: '🔤 Alfabético',
  qualification: '⭐ Qualificação'
};

function formatSortHint(sortModes) {
  if (!sortModes?.length) return '';
  return sortModes.map(m => SORT_MODE_LABELS[m] || m).join(' → ');
}

window.calcularMatchScore = calcularMatchScore;
window.calcularMatchScoreEst = calcularMatchScoreEst;
window.buildUserPrefsFromTags = buildUserPrefsFromTags;
window.buildMatchInsight = buildMatchInsight;
window.buildMatchBreakdown = buildMatchBreakdown;
window.getAllProfileTags = getAllProfileTags;
window.aplicarOrdenacao = aplicarOrdenacao;
window.ordenarPorMatch = ordenarPorMatch;
window.formatSortHint = formatSortHint;
window.SORT_MODE_LABELS = SORT_MODE_LABELS;
window.CLIENT_LOCATION_KEY = CLIENT_LOCATION_KEY;
window.getStoredClientLocation = getStoredClientLocation;
window.detectClientLocation = detectClientLocation;
window.anexarDistancias = anexarDistancias;
window.formatDistanceKm = formatDistanceKm;
window.haversineKm = haversineKm;
window.estimateItemCoords = estimateItemCoords;
window.normalizeForSearch = normalizeForSearch;
window.formatTitleCasePt = formatTitleCasePt;
window.formatPersonName = formatPersonName;
window.formatAddressLine = formatAddressLine;
window.formatCityName = formatCityName;
window.formatNeighborhoodName = formatNeighborhoodName;
window.formatComplement = formatComplement;
window.formatEstablishmentName = formatEstablishmentName;
window.formatSpecialtyText = formatSpecialtyText;
window.formatBioText = formatBioText;
window.formatStateUf = formatStateUf;
window.matchesSearchText = matchesSearchText;
window.filterItemsBySearchText = filterItemsBySearchText;
window.bindInputFormatting = bindInputFormatting;
window.bindRegistrationFormatting = bindRegistrationFormatting;
window.formatTextFields = formatTextFields;