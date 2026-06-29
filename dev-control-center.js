// ============================================================
// PROOFLY — Control Center (dev-simulation.html)
// ============================================================

(function() {
  const PREVIEW_TABLES = [
    'users', 'client_profiles', 'professionals', 'establishments', 'reviews'
  ];

  function esc(s) {
    return typeof escapeHtml === 'function' ? escapeHtml(s) : String(s || '');
  }

  function renderSessionLive() {
    const el = document.getElementById('ccSessionLive');
    if (!el) return;
    const s = typeof getSession === 'function' ? getSession() : null;
    if (!s) {
      el.innerHTML = '<p class="cc-empty">Sessão vazia — use “Trocar papel” abaixo.</p>';
      return;
    }
    const activeProfile = typeof getActiveProfileType === 'function'
      ? getActiveProfileType(s)
      : (typeof s.activeProfile === 'string' ? s.activeProfile : s.activeProfile?.type);
    const rows = [
      ['userId', s.userId],
      ['activeProfile', activeProfile],
      ['role', s.role],
      ['name', s.name],
      ['email', s.email],
      ['clientId', s.clientId || (typeof getClientId === 'function' ? getClientId(s) : null)],
      ['professionalId', s.professionalId],
      ['establishmentId', s.establishmentId],
      ['provider', s.provider || '—']
    ];
    el.innerHTML = rows.map(([k, v]) =>
      `<div class="cc-kv"><span class="cc-k">${esc(k)}</span><span class="cc-v">${esc(v || '—')}</span></div>`
    ).join('');
  }

  function renderMatchDebug() {
    const el = document.getElementById('ccMatchDebug');
    if (!el || typeof buildMatchBreakdown !== 'function') return;

    const prefs = typeof getStoredClientPrefs === 'function' ? getStoredClientPrefs() : {};
    const profTags = prefs.profTags || [];
    const estTags = prefs.estTags || [];

    el.innerHTML = `
      <p class="cc-hint">Tags ativas do cliente (local + perfil)</p>
      <div class="cc-tags-row">
        <span class="cc-tag-label">Prof</span>
        ${profTags.length ? profTags.map(t => `<span class="cc-chip">${esc(t)}</span>`).join('') : '<span class="cc-muted">nenhuma</span>'}
      </div>
      <div class="cc-tags-row">
        <span class="cc-tag-label">Est</span>
        ${estTags.length ? estTags.map(t => `<span class="cc-chip">${esc(t)}</span>`).join('') : '<span class="cc-muted">nenhuma</span>'}
      </div>
      <p class="cc-hint" style="margin-top:12px;">Exemplo com perfil demo (se existir no banco)</p>
      <div id="ccMatchSample" class="cc-match-sample">Carregando amostra...</div>
    `;

    loadMatchSample(profTags, estTags);
  }

  async function loadMatchSample(profTags, estTags) {
    const box = document.getElementById('ccMatchSample');
    if (!box || typeof fetchAPI !== 'function') return;
    try {
      const profs = await fetchAPI('/rest/v1/professionals?current_establishment_id=is.null&select=id,name,music_tags,visual_tags,personality_tags,lifestyle_tags,work_tags,style_tags,igv_score,avg_rating,total_reviews,client_portfolio_count&limit=1');
      const p = profs?.[0];
      if (!p) {
        box.textContent = 'Sem profissionais autônomos no banco.';
        return;
      }
      const b = buildMatchBreakdown(p, 'prof', profTags);
      let html = `
        <div class="cc-match-head"><strong>${esc(p.name)}</strong> (cliente) · ${b.percent ?? '—'}%</div>
        <div class="cc-match-shared">Em comum: ${(b.sharedTags || []).join(', ') || '—'}</div>
        <div class="cc-match-rows">${(b.components || []).slice(0, 6).map(c =>
          `<div class="cc-match-row"><span>${esc(c.label)}</span><span>+${c.points}</span></div>`
        ).join('')}</div>
      `;
      const sess = typeof getSession === 'function' ? getSession() : null;
      const estId = sess?.establishmentId || '10000000-0000-4000-8000-000000000001';
      if (typeof buildContratanteMatchBreakdown === 'function') {
        const ests = await fetchAPI(`/rest/v1/establishments?id=eq.${estId}&select=id,name,music_tags,infra_tags,positioning_tags,audience_tags,vibe_tags,style_tags,tags&limit=1`);
        const est = ests?.[0];
        if (est) {
          const bc = buildContratanteMatchBreakdown(p, est);
          html += `
            <div class="cc-match-head" style="margin-top:14px"><strong>${esc(p.name)}</strong> (contratar) · ${bc.percent ?? '—'}%</div>
            <div class="cc-match-shared">Tags: ${(bc.sharedTags || []).join(', ') || '—'}</div>
            <div class="cc-match-rows">${(bc.components || []).map(c =>
              `<div class="cc-match-row"><span>${esc(c.label)} (${esc(c.weight)})</span><span>+${c.points}</span></div>`
            ).join('')}</div>
            <p class="cc-muted" style="margin-top:6px;font-size:11px;">${esc(bc.formula || '')}</p>
          `;
        }
      }
      box.innerHTML = html;
      if (estTags.length) {
        const ests = await fetchAPI('/rest/v1/establishments?select=id,name,infra_tags,music_tags,positioning_tags,audience_tags,vibe_tags,avg_rating&limit=1');
        const e = ests?.[0];
        if (e) {
          const be = buildMatchBreakdown(e, 'est', estTags);
          box.innerHTML += `
            <div class="cc-match-head" style="margin-top:14px"><strong>${esc(e.name)}</strong> (est cliente) · ${be.percent ?? '—'}%</div>
            <div class="cc-match-rows">${(be.components || []).slice(0, 4).map(c =>
              `<div class="cc-match-row"><span>${esc(c.label)}</span><span>+${c.points}</span></div>`
            ).join('')}</div>
          `;
        }
      }
    } catch (e) {
      box.textContent = 'Erro: ' + e.message;
    }
  }

  async function renderDbLight() {
    const el = document.getElementById('ccDbLight');
    if (!el) return;

    if (window.PROOFLY_DB_SCHEMA?.tables) {
      const names = window.PROOFLY_DB_SCHEMA.tables.map(t => t.name);
      el.innerHTML = `<p class="cc-hint">Schema (${names.length} tabelas no modelo)</p>
        <div class="cc-schema-chips">${names.slice(0, 12).map(n => `<span class="cc-chip">${esc(n)}</span>`).join('')}</div>
        <div id="ccDbPreviews"></div>`;
    } else {
      el.innerHTML = '<div id="ccDbPreviews"></div>';
    }

    const prev = document.getElementById('ccDbPreviews');
    if (!prev || typeof fetchAPI !== 'function') return;
    prev.innerHTML = '<p class="cc-muted">Carregando previews...</p>';

    const blocks = [];
    for (const table of PREVIEW_TABLES) {
      try {
        const rows = await fetchAPI(`/rest/v1/${table}?select=*&limit=5`);
        const cols = rows?.[0] ? Object.keys(rows[0]).slice(0, 8) : [];
        blocks.push(`
          <details class="cc-db-table">
            <summary><strong>${esc(table)}</strong> <span class="cc-muted">(${rows?.length || 0} amostra)</span></summary>
            <p class="cc-cols">${cols.map(c => esc(c)).join(' · ') || '—'}</p>
            <pre class="cc-pre">${esc(JSON.stringify(rows?.slice(0, 2) || [], null, 2))}</pre>
          </details>
        `);
      } catch (e) {
        blocks.push(`<details class="cc-db-table"><summary>${esc(table)}</summary><p class="cc-err">${esc(e.message)}</p></details>`);
      }
    }
    prev.innerHTML = blocks.join('');
  }

  function bindControls() {
    document.getElementById('ccLogSession')?.addEventListener('click', () => {
      if (window.PROOFLY_DEBUG) PROOFLY_DEBUG.logSession('Control Center');
      else console.log(getSession());
    });
    document.getElementById('ccClearSession')?.addEventListener('click', () => {
      if (window.PROOFLY_DEBUG) PROOFLY_DEBUG.clearSession();
      renderSessionLive();
    });
    document.getElementById('ccToggleMatch')?.addEventListener('click', () => {
      if (!window.PROOFLY_DEBUG) return;
      const on = PROOFLY_DEBUG.toggleMatchDebug();
      const lbl = document.getElementById('ccMatchToggleLabel');
      if (lbl) lbl.textContent = on ? 'Match debug: ON' : 'Match debug: OFF';
    });
    document.getElementById('ccRefresh')?.addEventListener('click', () => {
      renderSessionLive();
      renderMatchDebug();
      renderDbLight();
    });

    const on = window.PROOFLY_DEBUG?.isMatchDebugOn?.();
    const lbl = document.getElementById('ccMatchToggleLabel');
    if (lbl) lbl.textContent = on ? 'Match debug: ON' : 'Match debug: OFF';
  }

  window.initControlCenter = function() {
    renderSessionLive();
    renderMatchDebug();
    renderDbLight();
    bindControls();
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('controlCenter')) initControlCenter();
  });
})();