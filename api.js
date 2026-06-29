// =====================================================
// PROOFLY - Comunicação com Supabase
// =====================================================

async function fetchAPI(path, method = 'GET', body = null, options = {}) {
  const opts = {
    method,
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": "Bearer " + SUPABASE_KEY,
      "Content-Type": "application/json"
    }
  };

  if (body && typeof body === 'object' && !options.skipSanitize) {
    if (typeof sanitizeObject === 'function') {
      body = sanitizeObject(body);
    } else {
      body = sanitizeObjectFallback(body);
    }
  }

  if (['POST', 'PATCH', 'PUT'].includes(method.toUpperCase())) {
    opts.headers['Prefer'] = 'return=representation';
  }

  if (body) opts.body = JSON.stringify(body);
  if (DEBUG_MODE) console.log(`📡 ${method} ${path}`, body || '');
  const resp = await fetch(SUPABASE_URL + path, opts);
  const text = await resp.text();
  let data;
  try { data = JSON.parse(text); } catch(e) { data = text; }
  if (DEBUG_MODE) console.log(`✅ Resp ${resp.status}:`, data);
  if (!resp.ok) throw new Error(`Erro ${resp.status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
  return data;
}

async function recalcularMedia(profId) {
  try {
    const [reviews, profRows] = await Promise.all([
      fetchAPI(
        `/rest/v1/reviews?professional_id=eq.${profId}&select=rating,review_type,source,user_id,verified,is_verified`
      ),
      fetchAPI(
        `/rest/v1/professionals?id=eq.${profId}&select=avg_rating,profile:professional_profiles(years_experience)`
      )
    ]);
    const prof = profRows?.[0] || {};
    const clientPool = typeof filterReviewsByType === 'function'
      ? filterReviewsByType(reviews, REVIEW_TYPES.CLIENT_TO_PROF)
      : reviews.filter(r => r.review_type === 'client_to_professional' || !r.review_type);
    const total = clientPool.length;
    const avg = total ? parseFloat((clientPool.reduce((s, r) => s + r.rating, 0) / total).toFixed(2)) : 0;

    const patch = { avg_rating: avg, total_reviews: total };

    if (typeof calcularCarteiraClientes === 'function' && typeof calcularIGV === 'function') {
      const carteira = calcularCarteiraClientes(reviews);
      const igvData = calcularIGV(
        { avg_rating: avg, profile: prof.profile },
        reviews
      );
      patch.client_portfolio_count = carteira.uniqueClients || carteira.total;
      patch.igv_score = igvData.igv;
    }

    try {
      await fetchAPI(`/rest/v1/professionals?id=eq.${profId}`, 'PATCH', patch);
    } catch (patchErr) {
      const msg = patchErr.message || '';
      if (msg.includes('client_portfolio_count') || msg.includes('igv_score')) {
        await fetchAPI(`/rest/v1/professionals?id=eq.${profId}`, 'PATCH', {
          avg_rating: avg,
          total_reviews: total
        });
      } else {
        throw patchErr;
      }
    }
  } catch (e) {
    console.error('Erro ao recalcular média:', e);
  }
}

/** Backfill DEV: recalcula carteira + IGV de todos os profissionais via API */
async function backfillAllTalentMetrics(options = {}) {
  const limit = options.limit || 200;
  const profs = await fetchAPI(`/rest/v1/professionals?select=id&limit=${limit}`);
  const results = { ok: 0, fail: 0, errors: [] };
  for (const p of profs || []) {
    try {
      await recalcularMedia(p.id);
      results.ok += 1;
    } catch (e) {
      results.fail += 1;
      results.errors.push({ id: p.id, message: e.message });
    }
  }
  return results;
}

window.backfillAllTalentMetrics = backfillAllTalentMetrics;
window.fetchAPI = fetchAPI;

// Ranking Pro API (núcleo QR / REST helpers — compatível com qr-service.js)
(function () {
  function getRankingConfig() {
    const cfg = window.RANKING_PRO_CONFIG || {};
    const url = cfg.SUPABASE_URL || window.SUPABASE_URL;
    const key = cfg.SUPABASE_ANON_KEY || cfg.SUPABASE_KEY || window.SUPABASE_KEY;
    if (!url || !key) throw new Error('Configure config.js com SUPABASE_URL e SUPABASE_KEY.');
    return { SUPABASE_URL: url, SUPABASE_ANON_KEY: key };
  }

  async function rankingFetchRest(path, options) {
    options = options || {};
    const { SUPABASE_URL, SUPABASE_ANON_KEY } = getRankingConfig();
    const url = SUPABASE_URL.replace(/\/$/, '') + path;
    const headers = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      ...(options.prefer ? { Prefer: options.prefer } : {}),
      ...(options.headers || {})
    };
    const res = await fetch(url, { method: options.method || 'GET', headers, body: options.body });
    const text = await res.text();
    let data = null;
    if (text) { try { data = JSON.parse(text); } catch { data = text; } }
    if (!res.ok) {
      const msg = data?.message || data?.error || data?.hint || res.statusText || 'Erro na API';
      throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
    return data;
  }

  async function rankingRpc(fnName, params) {
    return rankingFetchRest('/rest/v1/rpc/' + fnName, {
      method: 'POST',
      body: JSON.stringify(params || {})
    });
  }

  async function rankingSelect(table, query) {
    const q = (query || '').startsWith('?') ? query : '?' + (query || '');
    return rankingFetchRest('/rest/v1/' + table + q);
  }

  async function rankingInsert(table, row) {
    const data = await rankingFetchRest('/rest/v1/' + table, {
      method: 'POST',
      prefer: 'return=representation',
      body: JSON.stringify(row)
    });
    return Array.isArray(data) ? data[0] : data;
  }

  async function rankingUpdate(table, query, patch) {
    const q = query.startsWith('?') ? query : '?' + query;
    const data = await rankingFetchRest('/rest/v1/' + table + q, {
      method: 'PATCH',
      prefer: 'return=representation',
      body: JSON.stringify(patch)
    });
    return Array.isArray(data) ? data[0] : data;
  }

  window.RankingProAPI = {
    getConfig: getRankingConfig,
    rpc: rankingRpc,
    select: rankingSelect,
    insert: rankingInsert,
    update: rankingUpdate,
    fetchAPI: fetchAPI
  };
})();

// Fallback (caso sanitizeObject não exista em utils.js)
function sanitizeObjectFallback(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const sanitized = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const val = obj[key];
      if (typeof val === 'string') {
        sanitized[key] = escapeHtml(val);
      } else if (Array.isArray(val)) {
        sanitized[key] = val.map(item => typeof item === 'string' ? escapeHtml(item) : item);
      } else if (typeof val === 'object' && val !== null) {
        sanitized[key] = sanitizeObjectFallback(val);
      } else {
        sanitized[key] = val;
      }
    }
  }
  return sanitized;
}