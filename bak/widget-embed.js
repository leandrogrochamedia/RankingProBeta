// ============================================================
// PROOFLY - WIDGET DE PROVA SOCIAL (EMBED)
// ============================================================

(function() {
  'use strict';

  function detectWidgetCssUrl() {
    if (window.PROOFLY_WIDGET_CSS) return window.PROOFLY_WIDGET_CSS;
    const script = document.currentScript
      || [...document.querySelectorAll('script')].reverse().find(s => (s.src || '').includes('widget-embed'));
    if (script?.src) return script.src.replace(/widget-embed\.js(\?.*)?$/, 'widget.css');
    return './widget.css';
  }

  const CONFIG = {
    API_BASE: window.PROOFLY_API_BASE
      || (typeof SUPABASE_URL !== 'undefined' ? `${SUPABASE_URL}/rest/v1` : 'https://pyywdhjstvhmarvzijji.supabase.co/rest/v1'),
    API_KEY: window.PROOFLY_API_KEY
      || (typeof SUPABASE_KEY !== 'undefined' ? SUPABASE_KEY : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5eXdkaGpzdHZobWFydnppamppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzODE4NTEsImV4cCI6MjA5Njk1Nzg1MX0.uLu4Xhazrrrmf9MCp7BzZFUYLBR1J8QHQmqp0f3E1Yg'),
    WIDGET_CSS: detectWidgetCssUrl()
  };

  const REVIEW_SELECT_SAFE = [
    'rating', 'comment', 'created_at', 'verified', 'is_verified', 'review_type', 'source', 'user_id',
    'professional:professionals!professional_id(id,name)',
    'establishment:establishments!establishment_id(id,name)'
  ].join(',');
  const REVIEW_SELECT_LEGACY = [
    'rating', 'comment', 'created_at', 'verified', 'review_type', 'source', 'user_id',
    'professional:professionals!professional_id(id,name)',
    'establishment:establishments!establishment_id(id,name)'
  ].join(',');
  const REVIEW_SELECT_MINIMAL = [
    'rating', 'comment', 'created_at', 'verified', 'review_type',
    'professional:professionals!professional_id(id,name)',
    'establishment:establishments!establishment_id(id,name)'
  ].join(',');

  function loadCSS() {
    if (document.querySelector('link[data-proofly-widget]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = CONFIG.WIDGET_CSS;
    link.setAttribute('data-proofly-widget', 'true');
    document.head.appendChild(link);
  }

  async function apiGet(path) {
    const headers = {
      apikey: CONFIG.API_KEY,
      Authorization: 'Bearer ' + CONFIG.API_KEY,
      'Content-Type': 'application/json'
    };
    const res = await fetch(`${CONFIG.API_BASE}${path}`, { headers });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }
    return res.json();
  }

  async function hydrateUsers(reviews) {
    const ids = [...new Set((reviews || []).map(r => r.user_id).filter(Boolean))];
    if (!ids.length) return reviews;
    try {
      const users = await apiGet(`/users?id=in.(${ids.join(',')})&select=id,name`);
      const map = Object.fromEntries(users.map(u => [u.id, u]));
      return reviews.map(r => ({ ...r, user: r.user_id ? map[r.user_id] : null }));
    } catch {
      return reviews;
    }
  }

  function isReviewFetchError(msg) {
    const m = msg || '';
    return m.includes('PGRST200') || m.includes('relationship')
      || m.includes('is_verified') || m.includes('source') || m.includes('user_id') || m.includes('42703');
  }

  async function fetchEstablishmentReviews(establishmentId) {
    const base = `/reviews?establishment_id=eq.${establishmentId}&review_type=in.(client_to_establishment,professional_to_establishment)&order=created_at.desc&limit=10`;
    const fieldSets = [REVIEW_SELECT_SAFE, REVIEW_SELECT_LEGACY, REVIEW_SELECT_MINIMAL];
    let lastError = null;

    for (const fields of fieldSets) {
      const attempts = [
        `${base}&select=${fields},user:users!reviews_user_id_fkey(id,name)`,
        `${base}&select=${fields}`,
      ];
      for (const path of attempts) {
        try {
          const data = await apiGet(path);
          if (!path.includes('user:users')) return hydrateUsers(data);
          return data;
        } catch (e) {
          lastError = e;
          if (!isReviewFetchError(e.message)) throw e;
        }
      }
    }
    if (lastError) throw lastError;
    return [];
  }

  function renderStars(rating) {
    let s = '';
    for (let i = 0; i < 5; i++) s += i < rating ? '★' : '☆';
    return s;
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function inferSource(review) {
    if (review?.source) return review.source;
    const rt = review?.review_type;
    if (rt === 'establishment_to_professional') return 'estabelecimento';
    if (rt === 'professional_to_establishment') return 'profissional';
    return 'cliente';
  }

  function isVerified(review) {
    return !!(review?.is_verified ?? review?.verified);
  }

  function getAuthorName(review) {
    const src = inferSource(review);
    if (src === 'estabelecimento') {
      return review?.establishment?.name || review?.user?.name || 'Estabelecimento';
    }
    if (src === 'profissional') {
      return review?.professional?.name || review?.user?.name || 'Profissional';
    }
    if (review?.user?.name) return review.user.name;
    return 'Avaliador não identificado';
  }

  function getSourceBadge(review) {
    const map = { cliente: '👤 Cliente', estabelecimento: '🏢 Estabelecimento', profissional: '💼 Profissional' };
    return map[inferSource(review)] || '👤 Cliente';
  }

  function getVerifiedLabel(review) {
    if (!isVerified(review)) return '';
    return inferSource(review) === 'cliente' ? '✅ Cliente verificado' : '✅ Verificado';
  }

  function getContextSubjectLabel(review) {
    const src = inferSource(review);
    if (src === 'cliente') return 'Cliente';
    if (src === 'estabelecimento') return 'Estabelecimento';
    if (src === 'profissional') {
      if (review._profRoleKey === 'ex') return 'Ex-funcionário';
      if (review._profRoleKey === 'autonomo') return 'Profissional autônomo';
      return 'Profissional';
    }
    return 'Avaliador';
  }

  function getContextText(review) {
    const subject = getContextSubjectLabel(review);
    return `${subject} avaliou este estabelecimento`;
  }

  async function enrichProfRoles(reviews, establishmentId) {
    const profIds = [...new Set(
      (reviews || [])
        .filter(r => inferSource(r) === 'profissional' && r.professional_id)
        .map(r => r.professional_id)
    )];
    if (!profIds.length) return reviews;

    const roleMap = {};
    const workplaceMap = {};
    try {
      const [links, profs] = await Promise.all([
        apiGet(`/professional_establishment?establishment_id=eq.${establishmentId}&professional_id=in.(${profIds.join(',')})&select=professional_id,is_current`),
        apiGet(`/professionals?id=in.(${profIds.join(',')})&select=id,current_establishment_id,current_establishment:establishments!professionals_current_establishment_id_fkey(id,name)`)
      ]);
      const profById = Object.fromEntries((profs || []).map(p => [p.id, p]));
      (links || []).forEach(l => {
        roleMap[l.professional_id] = l.is_current ? 'atual' : 'ex';
      });
      profIds.forEach(id => {
        if (!roleMap[id]) roleMap[id] = 'autonomo';
        const prof = profById[id];
        const cur = prof?.current_establishment?.name;
        if (roleMap[id] === 'atual') workplaceMap[id] = cur || null;
        else if (roleMap[id] === 'autonomo' && cur) workplaceMap[id] = cur;
      });
    } catch {
      profIds.forEach(id => { if (!roleMap[id]) roleMap[id] = 'autonomo'; });
    }

    return reviews.map(r => {
      if (!r.professional_id || inferSource(r) !== 'profissional') return r;
      const key = roleMap[r.professional_id] || 'autonomo';
      return {
        ...r,
        _profRoleKey: key,
        _profWorkplace: workplaceMap[r.professional_id] || null
      };
    });
  }

  async function fetchWidgetData(establishmentId) {
    const estData = await apiGet(`/establishments?id=eq.${establishmentId}&select=name,avatar_url,address,city,state`);
    if (!estData?.length) throw new Error('Estabelecimento não encontrado');
    const establishment = estData[0];
    let reviews = await fetchEstablishmentReviews(establishmentId);
    reviews = await enrichProfRoles(reviews, establishmentId);

    let avg = 0;
    const total = reviews.length;
    if (total > 0) {
      avg = reviews.reduce((acc, r) => acc + r.rating, 0) / total;
    }

    return { establishment, reviews, avg, total };
  }

  function renderWidget(container, data, mode) {
    const { establishment, reviews, avg, total } = data;
    const avgFixed = avg.toFixed(1);
    const stars = renderStars(Math.round(avg));
    const isVerified = total >= 5;

    let html = `
      <div class="pw-widget pw-mode-${mode}">
        <div class="pw-header">
          <div class="pw-header-left">
            ${establishment.avatar_url ? `<img src="${establishment.avatar_url}" class="pw-avatar" onerror="this.style.display='none'">` : ''}
            <div>
              <div class="pw-name">${escapeHtml(establishment.name)}</div>
              <div class="pw-address">${escapeHtml(establishment.city || '')}${establishment.state ? ', ' + escapeHtml(establishment.state) : ''}</div>
            </div>
          </div>
          <div class="pw-header-right">
            <div class="pw-rating">
              <span class="pw-stars">${stars}</span>
              <span class="pw-score">${avgFixed}</span>
            </div>
            <div class="pw-total">${total} avaliações</div>
            ${isVerified ? '<div class="pw-badge">✅ Verificado por Ranking Pro</div>' : ''}
          </div>
        </div>
    `;

    if (mode !== 'compact' && reviews.length > 0) {
      const limit = mode === 'medium' ? 3 : 5;
      const list = reviews.slice(0, limit);
      html += `<div class="pw-reviews">`;
      list.forEach(r => {
        const stars = renderStars(r.rating);
        const date = new Date(r.created_at).toLocaleDateString('pt-BR');
        const author = getAuthorName(r);
        const badge = getSourceBadge(r);
        const verifiedLabel = getVerifiedLabel(r);
        const ctx = getContextText(r);
        const profAssoc = (inferSource(r) === 'cliente' && r.professional?.name)
          ? `<div class="pw-review-prof" style="font-size:11px;color:#818cf8;">Atendido por ${escapeHtml(r.professional.name)}</div>`
          : '';
        const workplace = (inferSource(r) === 'profissional' && r._profWorkplace)
          ? `<div class="pw-review-workplace" style="font-size:11px;color:#64748b;">${r._profRoleKey === 'atual' ? 'Trabalha em' : 'Atua em'} <strong>${escapeHtml(r._profWorkplace)}</strong></div>`
          : '';
        html += `
          <div class="pw-review-item">
            <div class="pw-review-header">
              <span class="pw-review-stars">${stars}</span>
              <span class="pw-review-date">${date}</span>
            </div>
            <div class="pw-review-author">
              <strong>${escapeHtml(author)}</strong>
            </div>
            <div class="pw-review-badges" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px;font-size:11px;">
              ${verifiedLabel ? `<span class="pw-review-verified" style="color:#059669;font-weight:600;">${escapeHtml(verifiedLabel)}</span>` : ''}
              <span class="pw-review-badge">${escapeHtml(badge)}</span>
            </div>
            <div class="pw-review-ctx" style="font-size:12px;color:#64748b;margin-top:4px;">${escapeHtml(ctx)}</div>
            ${workplace}
            ${profAssoc}
            ${r.comment ? `<div class="pw-review-comment">${escapeHtml(r.comment)}</div>` : ''}
          </div>
        `;
      });
      if (reviews.length > limit) {
        const moreUrl = (window.PROOFLY_APP_BASE || '').replace(/\/$/, '') + '/cliente.html';
        html += `<div class="pw-more"><a href="${moreUrl}" target="_blank" rel="noopener">Ver mais avaliações →</a></div>`;
      }
      html += `</div>`;
    }

    html += `
      <div class="pw-footer">
        <span class="pw-powered">🏆 Ranking Pro — reputação verificada</span>
      </div>
    </div>`;

    container.innerHTML = html;
  }

  async function processWidgets() {
    const elements = document.querySelectorAll('[data-proofly-id]');
    for (const el of elements) {
      const id = el.getAttribute('data-proofly-id');
      const mode = el.getAttribute('data-mode') || 'medium';
      if (!id) continue;

      el.innerHTML = `<div class="pw-loading">Carregando avaliações...</div>`;

      try {
        const data = await fetchWidgetData(id);
        renderWidget(el, data, mode);
      } catch (err) {
        el.innerHTML = `<div class="pw-error">⚠️ Não foi possível carregar as avaliações. Tente novamente mais tarde.</div>`;
        console.error('[Ranking Pro Widget] Erro:', err);
      }
    }
  }

  function init() {
    loadCSS();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', processWidgets);
    } else {
      processWidgets();
    }
  }

  window.ProoflyWidget = { init, processWidgets, fetchWidgetData, renderWidget };
  init();
})();