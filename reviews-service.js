// =====================================================
// PROOFLY - Reviews Service (autoria + contexto + rastreio)
// =====================================================

const REVIEW_SELECT_CORE = [
  'id', 'rating', 'comment', 'created_at', 'verified',
  'review_type', 'source', 'user_id', 'professional_id', 'establishment_id'
];

const REVIEW_SELECT_BASE = [...REVIEW_SELECT_CORE, 'is_verified'].join(',');

const REVIEW_SELECT_LEGACY = REVIEW_SELECT_CORE.join(',');

/** Banco antigo sem user_id / source / is_verified */
const REVIEW_SELECT_MINIMAL = [
  'id', 'rating', 'comment', 'created_at', 'verified',
  'review_type', 'professional_id', 'establishment_id'
].join(',');

const REVIEW_SELECT_JOINS = [
  'professional:professionals!professional_id(id,name)',
  'establishment:establishments!establishment_id(id,name)'
].join(',');

const REVIEW_API_SELECT = `${REVIEW_SELECT_BASE},user:users!reviews_user_id_fkey(id,name),${REVIEW_SELECT_JOINS}`;

function isReviewSchemaError(msg) {
  const m = msg || '';
  return m.includes('PGRST200')
    || m.includes('relationship')
    || m.includes('Could not find')
    || m.includes('is_verified')
    || m.includes('user_id')
    || m.includes('source')
    || m.includes('42703');
}

function buildReviewSelectAttempts(fieldSet) {
  const joinOnly = `${fieldSet},${REVIEW_SELECT_JOINS}`;
  return [
    `${joinOnly},user:users!reviews_user_id_fkey(id,name)`,
    `${joinOnly},user:users!user_id(id,name)`,
    joinOnly
  ];
}

const REVIEW_RATING_WEIGHTS = {
  cliente: 1,
  cliente_recorrente: 2,
  estabelecimento: 3,
  profissional: 2
};

const REVIEW_SOURCE_LABELS = {
  cliente: '👤 Cliente',
  estabelecimento: '🏢 Estabelecimento',
  profissional: '💼 Profissional'
};

const PROF_ROLE_LABELS = {
  atual: 'Atual',
  ex: 'Ex-funcionário',
  autonomo: 'Autônomo'
};

function isReviewVerified(review) {
  return !!(review?.is_verified ?? review?.verified);
}

function inferReviewSource(review) {
  if (review?.source) return review.source;
  const rt = review?.review_type;
  if (rt === 'establishment_to_professional') return 'estabelecimento';
  if (rt === 'professional_to_establishment') return 'profissional';
  return 'cliente';
}

function getReviewRatingWeight(review) {
  if (review.is_recurrent || review.recurrent) return REVIEW_RATING_WEIGHTS.cliente_recorrente;
  const src = inferReviewSource(review);
  return REVIEW_RATING_WEIGHTS[src] || REVIEW_RATING_WEIGHTS.cliente;
}

function calcularMediaPonderadaReviews(reviews) {
  const rated = (reviews || []).filter(r => {
    const rt = r.rating;
    return rt >= 1 && rt <= 5 && r.review_type !== REVIEW_TYPES.PROFILE_LIKE;
  });
  if (!rated.length) {
    return { weightedAvg: 0, score: 0, total: 0, weightSum: 0 };
  }
  let sum = 0;
  let weightSum = 0;
  rated.forEach(r => {
    const w = getReviewRatingWeight(r);
    sum += r.rating * w;
    weightSum += w;
  });
  const weightedAvg = sum / weightSum;
  const score = Math.round(Math.min(100, Math.max(0, (weightedAvg / 5) * 100)));
  return { weightedAvg, score, total: rated.length, weightSum };
}

async function hydrateReviewUsers(reviews) {
  if (!reviews?.length) return reviews || [];
  const ids = [...new Set(reviews.map(r => r.user_id).filter(Boolean))];
  if (!ids.length) return reviews;

  try {
    const users = await fetchAPI(`/rest/v1/users?id=in.(${ids.join(',')})&select=id,name`);
    const map = Object.fromEntries((users || []).map(u => [u.id, u]));
    return reviews.map(r => ({
      ...r,
      user: r.user?.name ? r.user : (r.user_id ? map[r.user_id] || null : null)
    }));
  } catch (e) {
    console.warn('hydrateReviewUsers:', e.message);
    return reviews;
  }
}

async function enrichReviewsWithProfRoles(reviews, establishmentId) {
  if (!reviews?.length || !establishmentId) return reviews;

  const profIds = [...new Set(
    reviews
      .filter(r => inferReviewSource(r) === 'profissional' && r.professional_id)
      .map(r => r.professional_id)
  )];
  if (!profIds.length) return reviews;

  const roleMap = {};
  const workplaceMap = {};
  try {
    const [links, profs] = await Promise.all([
      fetchAPI(
        `/rest/v1/professional_establishment?establishment_id=eq.${establishmentId}&professional_id=in.(${profIds.join(',')})&select=professional_id,is_current`
      ),
      fetchAPI(
        `/rest/v1/professionals?id=in.(${profIds.join(',')})&select=id,current_establishment_id,current_establishment:establishments!professionals_current_establishment_id_fkey(id,name)`
      )
    ]);
    const profById = Object.fromEntries((profs || []).map(p => [p.id, p]));
    (links || []).forEach(l => {
      roleMap[l.professional_id] = l.is_current ? 'atual' : 'ex';
    });
    profIds.forEach(id => {
      if (!roleMap[id]) roleMap[id] = 'autonomo';
      const prof = profById[id];
      const cur = prof?.current_establishment?.name;
      if (roleMap[id] === 'atual') {
        workplaceMap[id] = cur || null;
      } else if (roleMap[id] === 'autonomo' && cur) {
        workplaceMap[id] = cur;
      }
    });
  } catch (e) {
    console.warn('enrichReviewsWithProfRoles:', e.message);
    profIds.forEach(id => { if (!roleMap[id]) roleMap[id] = 'autonomo'; });
  }

  return reviews.map(r => {
    if (!r.professional_id || inferReviewSource(r) !== 'profissional') return r;
    const key = roleMap[r.professional_id] || 'autonomo';
    const workplace = workplaceMap[r.professional_id] || null;
    return {
      ...r,
      _profRoleKey: key,
      _profRole: PROF_ROLE_LABELS[key] || 'Autônomo',
      _profWorkplace: workplace
    };
  });
}

async function enrichReviewsForDisplay(reviews, viewContext = {}) {
  let list = (reviews || []).map(r => ({
    ...r,
    verified: isReviewVerified(r),
    is_verified: isReviewVerified(r)
  }));
  list = await hydrateReviewUsers(list);
  if (viewContext.establishmentId) {
    list = await enrichReviewsWithProfRoles(list, viewContext.establishmentId);
  }
  return list;
}

async function fetchReviews(filters, options = {}) {
  const order = options.order || 'created_at.desc';
  const limitQ = options.limit ? `&limit=${options.limit}` : '';
  const filterQ = filters ? `${filters}&` : '';
  const basePath = `/rest/v1/reviews?${filterQ}order=${order}${limitQ}`;

  const fieldSets = [REVIEW_SELECT_BASE, REVIEW_SELECT_LEGACY, REVIEW_SELECT_MINIMAL];
  let data = [];
  let lastError = null;
  let fetched = false;

  outer:
  for (const fieldSet of fieldSets) {
    for (const sel of buildReviewSelectAttempts(fieldSet)) {
      try {
        data = await fetchAPI(`${basePath}&select=${sel}`);
        if (!sel.includes('user:users')) {
          data = await hydrateReviewUsers(data);
        }
        fetched = true;
        break outer;
      } catch (e) {
        lastError = e;
        if (!isReviewSchemaError(e.message)) throw e;
      }
    }
  }

  if (!fetched && lastError) throw lastError;

  if (options.viewContext) {
    return enrichReviewsForDisplay(data, options.viewContext);
  }
  return data.map(r => ({ ...r, verified: isReviewVerified(r), is_verified: isReviewVerified(r) }));
}

function getReviewAuthorName(review) {
  const src = inferReviewSource(review);
  if (src === 'estabelecimento') {
    return review?.establishment?.name || review?.user?.name || 'Estabelecimento';
  }
  if (src === 'profissional') {
    return review?.professional?.name || review?.user?.name || 'Profissional';
  }
  if (review?.user?.name) return review.user.name;
  return 'Avaliador não identificado';
}

function getReviewAuthorProfileLink(review) {
  const src = inferReviewSource(review);
  if (src === 'estabelecimento' && review.establishment_id) {
    return { drawerType: 'estabelecimento', id: review.establishment_id };
  }
  if (src === 'profissional' && review.professional_id) {
    return { drawerType: 'profissional', id: review.professional_id };
  }
  return null;
}

function renderReviewAuthorHtml(review) {
  const name = escapeHtml(getReviewAuthorName(review));
  const link = getReviewAuthorProfileLink(review);
  if (link && typeof window.openProfile === 'function') {
    return `<a href="#" class="review-author-link" onclick="event.preventDefault();openProfile('${link.drawerType}','${link.id}')" style="color:#6366f1;font-weight:600;text-decoration:none;">${name}</a>`;
  }
  if (link && typeof window.profilePageUrl === 'function') {
    const href = window.profilePageUrl(link.drawerType, link.id);
    return `<a href="${href}" class="review-author-link" style="color:#6366f1;font-weight:600;text-decoration:none;">${name}</a>`;
  }
  return `<strong class="review-author-name">${name}</strong>`;
}

function getReviewSourceBadge(review) {
  const src = inferReviewSource(review);
  return REVIEW_SOURCE_LABELS[src] || REVIEW_SOURCE_LABELS.cliente;
}

function getReviewVerifiedBadge(review) {
  if (!isReviewVerified(review)) return '';
  const src = inferReviewSource(review);
  const label = src === 'cliente' ? '✅ Cliente verificado' : '✅ Verificado';
  return `<span class="review-badge review-badge-verified">${label}</span>`;
}

function getReviewContextAction(review, viewContext = {}) {
  const src = inferReviewSource(review);
  const targetsProf = review.review_type === 'establishment_to_professional'
    || review.review_type === 'client_to_professional'
    || (src === 'estabelecimento' && review.professional_id)
    || (src === 'cliente' && review.professional_id && !review.establishment_id);

  if (targetsProf) return 'avaliou este profissional';
  if (review.review_type === 'professional_to_establishment' || src === 'profissional'
    || review.review_type === 'client_to_establishment'
    || (src === 'cliente' && review.establishment_id)) {
    return 'avaliou este estabelecimento';
  }
  return 'deixou uma avaliação';
}

/** Rótulo da linha contextual (sem nome do autor) */
function getReviewContextSubjectLabel(review, viewContext = {}) {
  const src = inferReviewSource(review);
  if (src === 'cliente') return 'Cliente';
  if (src === 'estabelecimento') return 'Estabelecimento';
  if (src === 'profissional') {
    const key = review._profRoleKey
      || (review._profRole === 'Ex-funcionário' ? 'ex' : review._profRole === 'Atual' ? 'atual' : review._profRole === 'Autônomo' ? 'autonomo' : null)
      || viewContext.profRoleKey;
    if (key === 'ex') return 'Ex-funcionário';
    if (key === 'autonomo') return 'Profissional autônomo';
    return 'Profissional';
  }
  return 'Avaliador';
}

function getReviewContextText(review, viewContext = {}) {
  return `${getReviewContextSubjectLabel(review, viewContext)} ${getReviewContextAction(review, viewContext)}`;
}

function formatReviewContext(review, viewContext = {}) {
  return getReviewContextText(review, viewContext);
}

function renderReviewWorkplaceHtml(review) {
  const src = inferReviewSource(review);
  if (src !== 'profissional' || !review._profWorkplace) return '';
  const prefix = review._profRoleKey === 'atual' ? 'Trabalha em' : 'Atua em';
  return `<div class="review-workplace-line">${prefix} <strong>${escapeHtml(review._profWorkplace)}</strong></div>`;
}

function renderReviewContextHtml(review, viewContext = {}) {
  const contextText = getReviewContextText(review, viewContext);
  return `
    <div class="review-author-block">${renderReviewAuthorHtml(review)}</div>
    <div class="review-context-line"><span class="review-context-action">${escapeHtml(contextText)}</span></div>
    ${renderReviewWorkplaceHtml(review)}
  `;
}

function formatReviewForDisplay(review, viewContext = {}) {
  const authorName = getReviewAuthorName(review);
  const sourceBadge = getReviewSourceBadge(review);
  const verifiedBadge = getReviewVerifiedBadge(review);
  const reviewContext = formatReviewContext(review, viewContext);
  const verified = isReviewVerified(review);
  return {
    rating: review.rating,
    comment: review.comment,
    created_at: review.created_at,
    verified,
    is_verified: verified,
    authorName,
    sourceBadge,
    verifiedBadge,
    reviewContext: getReviewContextText(review, viewContext),
    contextText: getReviewContextText(review, viewContext),
    workplaceHtml: renderReviewWorkplaceHtml(review),
    contextHtml: renderReviewContextHtml(review, viewContext),
    authorHtml: renderReviewAuthorHtml(review),
    profileLink: getReviewAuthorProfileLink(review),
    context: `${sourceBadge}${verified ? ' · ✅ Verificado' : ''} · ${reviewContext}`,
    badgesHtml: `${verifiedBadge}<span class="review-badge review-badge-source">${sourceBadge}</span>`
  };
}

function isQrReviewSession() {
  try {
    return sessionStorage.getItem('proofly_qr_review') === '1';
  } catch {
    return false;
  }
}

function markQrReviewSession(active = true) {
  try {
    if (active) sessionStorage.setItem('proofly_qr_review', '1');
    else sessionStorage.removeItem('proofly_qr_review');
  } catch { /* noop */ }
}

function getQrTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('token') || params.get('qr_token') || null;
}

function initQrReviewFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const token = getQrTokenFromUrl();
  if (params.get('verified') === 'qr' || params.get('qr') === '1' || token) {
    markQrReviewSession(true);
    if (token) {
      try { sessionStorage.setItem('proofly_qr_token', token); } catch { /* noop */ }
    }
  }
}

function resolveReviewTypeAndSource({ professionalId, establishmentId, reviewType }) {
  const session = typeof getSession === 'function' ? getSession() : null;

  if (reviewType) {
    let source = 'cliente';
    if (reviewType === REVIEW_TYPES.ESTAB_TO_PROF) source = 'estabelecimento';
    else if (reviewType === REVIEW_TYPES.PROF_TO_EST) source = 'profissional';
    return { reviewType, source };
  }

  if (session?.establishmentId && professionalId) {
    return {
      reviewType: REVIEW_TYPES.ESTAB_TO_PROF,
      source: 'estabelecimento',
      reviewerEstablishmentId: session.establishmentId
    };
  }
  if (session?.professionalId && establishmentId) {
    return {
      reviewType: REVIEW_TYPES.PROF_TO_EST,
      source: 'profissional',
      reviewerProfessionalId: session.professionalId
    };
  }
  if (professionalId) {
    return { reviewType: REVIEW_TYPES.CLIENT_TO_PROF, source: 'cliente' };
  }
  if (establishmentId) {
    return { reviewType: REVIEW_TYPES.CLIENT_TO_EST, source: 'cliente' };
  }
  throw new Error('Informe professional_id ou establishment_id');
}

function buildReviewPayload({ rating, comment, professionalId, establishmentId, verified, reviewType }) {
  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (!user?.id) {
    throw new Error('Usuário não autenticado. Use Simulação DEV ou faça login antes de avaliar.');
  }

  const session = typeof getSession === 'function' ? getSession() : null;
  const resolved = resolveReviewTypeAndSource({ professionalId, establishmentId, reviewType });
  let estabId = establishmentId || null;
  let profId = professionalId || null;

  if (resolved.reviewType === REVIEW_TYPES.ESTAB_TO_PROF) {
    profId = professionalId;
    estabId = resolved.reviewerEstablishmentId || session?.establishmentId;
  } else if (resolved.reviewType === REVIEW_TYPES.PROF_TO_EST) {
    estabId = establishmentId;
    profId = resolved.reviewerProfessionalId || session?.professionalId || null;
  }

  if (!profId && !estabId) {
    throw new Error('Avaliação precisa de professional_id ou establishment_id');
  }

  const isVerified = verified != null ? !!verified : isQrReviewSession();
  const qrToken = (() => {
    try { return sessionStorage.getItem('proofly_qr_token'); } catch { return null; }
  })() || getQrTokenFromUrl();

  const payload = {
    user_id: user.id,
    source: resolved.source,
    review_type: resolved.reviewType,
    rating,
    comment: comment || null,
    verified: isVerified,
    is_verified: isVerified,
    professional_id: profId,
    establishment_id: estabId,
    rating_weight: getReviewRatingWeight({ source: resolved.source, is_verified: isVerified })
  };

  if (isVerified && qrToken) payload.qr_token = qrToken;

  if (profId && estabId && (resolved.source === 'profissional' || resolved.reviewType === REVIEW_TYPES.CLIENT_TO_PROF)) {
    payload.prof_link_snapshot = {
      professional_id: profId,
      establishment_id: estabId,
      captured_at: new Date().toISOString()
    };
  }

  return payload;
}

async function submitReview(opts) {
  let body = buildReviewPayload(opts);

  if (body.review_type === REVIEW_TYPES.CLIENT_TO_PROF && body.professional_id && !body.prof_link_snapshot) {
    try {
      const rows = await fetchAPI(
        `/rest/v1/professionals?id=eq.${body.professional_id}&select=id,current_establishment_id&limit=1`
      );
      const estabId = rows?.[0]?.current_establishment_id;
      if (estabId) {
        body.establishment_id = body.establishment_id || estabId;
        body.prof_link_snapshot = {
          professional_id: body.professional_id,
          establishment_id: estabId,
          captured_at: new Date().toISOString()
        };
      }
    } catch (e) {
      console.warn('submitReview snapshot:', e.message);
    }
  }
  const optionalFields = ['is_verified', 'source', 'user_id', 'qr_token', 'rating_weight', 'prof_link_snapshot'];

  for (let attempt = 0; attempt <= optionalFields.length; attempt++) {
    try {
      const result = await fetchAPI('/rest/v1/reviews', 'POST', body);
      if (isQrReviewSession()) {
        markQrReviewSession(false);
        try { sessionStorage.removeItem('proofly_qr_token'); } catch { /* noop */ }
      }
      return result;
    } catch (e) {
      const msg = e.message || '';
      const drop = optionalFields.find(f => msg.includes(f) && Object.prototype.hasOwnProperty.call(body, f));
      if (!drop) throw e;
      const next = { ...body };
      delete next[drop];
      body = next;
    }
  }
}

function renderReviewMiniHtml(review, viewContext = {}) {
  const d = formatReviewForDisplay(review, viewContext);
  const src = inferReviewSource(review);
  const srcClass = src === 'estabelecimento' ? ' review-estab' : src === 'profissional' ? ' review-prof' : '';
  return `
    <div class="review-item-mini${srcClass}">
      <div class="meta">
        <span>${typeof renderStars === 'function' ? renderStars(d.rating) : d.rating + '★'}</span>
        <span>${typeof tempoRelativo === 'function' ? tempoRelativo(d.created_at) : ''}</span>
      </div>
      <div class="review-author-block">${d.authorHtml}</div>
      <div class="review-badges-row">
        ${d.verifiedBadge}
        <span class="review-badge review-badge-source">${d.sourceBadge}</span>
      </div>
      <div class="review-context-line"><span class="review-context-action">${escapeHtml(d.contextText || d.reviewContext)}</span></div>
      ${d.workplaceHtml || ''}
      ${d.comment ? `<div class="comment">${escapeHtml(d.comment)}</div>` : ''}
    </div>
  `;
}

function renderReviewsListHtml(reviews, emptyMsg, viewContext = {}) {
  if (!reviews?.length) {
    return `<p class="review-empty-msg">${emptyMsg || 'Nenhuma avaliação ainda.'}</p>`;
  }
  return reviews.map(r => renderReviewMiniHtml(r, viewContext)).join('');
}

window.REVIEW_SELECT_BASE = REVIEW_SELECT_BASE;
window.REVIEW_API_SELECT = REVIEW_API_SELECT;
window.REVIEW_RATING_WEIGHTS = REVIEW_RATING_WEIGHTS;
window.REVIEW_SOURCE_LABELS = REVIEW_SOURCE_LABELS;
window.isReviewVerified = isReviewVerified;
window.fetchReviews = fetchReviews;
window.enrichReviewsForDisplay = enrichReviewsForDisplay;
window.hydrateReviewUsers = hydrateReviewUsers;
window.inferReviewSource = inferReviewSource;
window.getReviewRatingWeight = getReviewRatingWeight;
window.calcularMediaPonderadaReviews = calcularMediaPonderadaReviews;
window.getReviewAuthorName = getReviewAuthorName;
window.getReviewAuthorProfileLink = getReviewAuthorProfileLink;
window.renderReviewAuthorHtml = renderReviewAuthorHtml;
window.getReviewSourceBadge = getReviewSourceBadge;
window.getReviewVerifiedBadge = getReviewVerifiedBadge;
window.getReviewContextAction = getReviewContextAction;
window.getReviewContextSubjectLabel = getReviewContextSubjectLabel;
window.getReviewContextText = getReviewContextText;
window.formatReviewContext = formatReviewContext;
window.renderReviewContextHtml = renderReviewContextHtml;
window.formatReviewForDisplay = formatReviewForDisplay;
window.buildReviewPayload = buildReviewPayload;
window.submitReview = submitReview;
window.renderReviewMiniHtml = renderReviewMiniHtml;
window.renderReviewsListHtml = renderReviewsListHtml;
window.isQrReviewSession = isQrReviewSession;
window.markQrReviewSession = markQrReviewSession;
window.initQrReviewFromUrl = initQrReviewFromUrl;

(function injectReviewStyles() {
  if (document.getElementById('proofly-review-styles')) return;
  const style = document.createElement('style');
  style.id = 'proofly-review-styles';
  style.textContent = `
    .review-author-row, .review-badges-row { display:flex; flex-wrap:wrap; align-items:center; gap:6px; margin-top:6px; }
    .review-badge { font-size:11px; padding:2px 8px; border-radius:999px; font-weight:600; }
    .review-badge-source { background:rgba(99,102,241,0.2); color:#a5b4fc; }
    .review-badge-verified { background:rgba(16,185,129,0.2); color:#6ee7b7; }
    .review-item-mini { border-left:4px solid #6366f1; background:rgba(255,255,255,0.04); border-radius:14px; }
    .review-item-mini .review-author-name, .review-item-mini .review-author-link { font-size:14px; font-weight:700; }
    .review-item-mini.review-estab { border-left-color:#8b5cf6; }
    .review-author-block { margin-top:6px; }
    .review-workplace-line { font-size:12px; color:#64748b; margin-top:4px; }
    .review-workplace-line strong { font-weight:600; color:#475569; }
    .review-context-line { font-size:12px; color:#64748b; margin-top:4px; line-height:1.5; }
    .review-context-action, .review-context-role { font-weight:400; color:#64748b; }
    .review-author-name { font-weight:700; color:#0f172a; }
    .review-author-link { font-weight:700 !important; color:#4f46e5 !important; }
    .review-author-link:hover { text-decoration:underline !important; }
    .review-item-mini { background:#f8fafc; border:1px solid #e2e8f0; border-left:4px solid #6366f1; border-radius:14px; padding:14px 16px; margin-bottom:10px; }
    .review-item-mini .comment { margin-top:8px; color:#334155; font-size:14px; line-height:1.5; }
    .review-item-mini .meta { display:flex; justify-content:space-between; font-size:13px; color:#64748b; margin-bottom:4px; }
    .review-empty-msg { color:#94a3b8; }
  `;
  document.head.appendChild(style);
})();

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQrReviewFromUrl);
  } else {
    initQrReviewFromUrl();
  }
}