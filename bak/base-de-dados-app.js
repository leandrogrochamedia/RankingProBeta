(function() {
  'use strict';

  const schema = window.PROOFLY_DB_SCHEMA;
  if (!schema) return;

  const state = {
    filter: '',
    group: 'all',
    view: 'diagram',
    expanded: new Set(),
    counts: {},
    countErrors: {},
    countsLoading: false,
    highlightTable: null,
    highlightRelation: null
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function esc(str) {
    const d = document.createElement('div');
    d.textContent = str == null ? '' : String(str);
    return d.innerHTML;
  }

  function hl(text, query) {
    if (!query) return esc(text);
    const raw = String(text ?? '');
    const idx = raw.toLowerCase().indexOf(query.toLowerCase());
    if (idx < 0) return esc(raw);
    return esc(raw.slice(0, idx)) + '<mark class="db-hl">' + esc(raw.slice(idx, idx + query.length)) + '</mark>' + esc(raw.slice(idx + query.length));
  }

  function getGroupMeta(id) {
    return schema.groups.find(g => g.id === id) || { label: id, icon: '📦', color: '#64748b' };
  }

  function filteredTables() {
    const q = state.filter.trim().toLowerCase();
    return schema.tables.filter(t => {
      if (state.group !== 'all' && t.group !== state.group) return false;
      if (!q) return true;
      if (t.name.toLowerCase().includes(q)) return true;
      if ((t.description || '').toLowerCase().includes(q)) return true;
      return t.columns.some(c =>
        c.name.toLowerCase().includes(q) ||
        (c.type || '').toLowerCase().includes(q) ||
        (c.desc || '').toLowerCase().includes(q)
      );
    });
  }

  function computeStats() {
    const tables = schema.tables.filter(t => t.kind !== 'view');
    const views = schema.tables.filter(t => t.kind === 'view');
    const cols = schema.tables.reduce((n, t) => n + t.columns.length, 0);
    const fks = schema.tables.reduce((n, t) => n + (t.foreignKeys?.length || t.columns.filter(c => c.isForeignKey).length), 0);
    return { tables: tables.length, views: views.length, columns: cols, fks, relations: schema.relations.length };
  }

  function moduleRowCount(groupId) {
    return schema.tables
      .filter(t => t.group === groupId && t.kind !== 'view')
      .reduce((sum, t) => sum + (state.counts[t.name] || 0), 0);
  }

  function renderKpis() {
    const s = computeStats();
    const kpiEl = $('#dbKpis');
    if (!kpiEl) return;
    kpiEl.innerHTML = `
      <div class="db-kpi"><span class="db-kpi-val">${s.tables}</span><span class="db-kpi-lbl">Tabelas</span></div>
      <div class="db-kpi"><span class="db-kpi-val">${s.views}</span><span class="db-kpi-lbl">Views</span></div>
      <div class="db-kpi"><span class="db-kpi-val">${s.columns}</span><span class="db-kpi-lbl">Colunas</span></div>
      <div class="db-kpi"><span class="db-kpi-val">${s.fks}</span><span class="db-kpi-lbl">FKs</span></div>
      <div class="db-kpi"><span class="db-kpi-val">${s.relations}</span><span class="db-kpi-lbl">Relações</span></div>
      <div class="db-kpi db-kpi-live"><span class="db-kpi-val" id="kpiLiveRows">—</span><span class="db-kpi-lbl">Registros (live)</span></div>
    `;
  }

  function renderModuleCards() {
    const el = $('#dbModules');
    if (!el) return;
    el.innerHTML = schema.groups.map(g => {
      const tables = schema.tables.filter(t => t.group === g.id);
      const rows = moduleRowCount(g.id);
      const active = state.group === g.id ? ' active' : '';
      return `
        <button type="button" class="db-module-card${active}" data-group="${g.id}" style="--accent:${g.color}">
          <div class="db-module-top">
            <span class="db-module-icon" style="background:${g.color}22;color:${g.color}">${g.icon}</span>
            <h4>${esc(g.label)}</h4>
          </div>
          <div class="db-module-stats">
            <span><strong>${tables.length}</strong> entidades</span>
            <span><strong>${rows.toLocaleString('pt-BR')}</strong> rows</span>
          </div>
        </button>
      `;
    }).join('');

    el.querySelectorAll('.db-module-card').forEach(card => {
      card.addEventListener('click', () => {
        state.group = card.dataset.group;
        renderNav();
        renderModuleCards();
        renderIndex();
        renderDiagram();
        renderTables();
      });
    });
  }

  function renderNav() {
    const nav = $('#dbNav');
    if (!nav) return;
    const items = [{ id: 'all', label: 'Todas', icon: '🗂️', color: '#64748b' }, ...schema.groups];
    nav.innerHTML = items.map(g => `
      <button type="button" class="db-nav-item${state.group === g.id ? ' active' : ''}" data-group="${g.id}">
        <span class="db-nav-icon">${g.icon}</span>
        <span>${esc(g.label || g.id)}</span>
        <span class="db-nav-count">${g.id === 'all' ? schema.tables.length : schema.tables.filter(t => t.group === g.id).length}</span>
      </button>
    `).join('');
    nav.querySelectorAll('.db-nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        state.group = btn.dataset.group;
        renderNav();
        renderModuleCards();
        renderIndex();
        renderDiagram();
        renderTables();
      });
    });
  }

  function renderIndex() {
    const el = $('#dbIndex');
    if (!el) return;
    const tables = filteredTables();
    el.innerHTML = tables.map(t => `
      <button type="button" class="db-index-item" data-jump="${esc(t.name)}">${esc(t.name)}</button>
    `).join('');
    el.querySelectorAll('.db-index-item').forEach(btn => {
      btn.addEventListener('click', () => scrollToTable(btn.dataset.jump, true));
    });
  }

  function visibleRelations() {
    if (state.group === 'all') return schema.relations;
    const names = new Set(schema.tables.filter(t => t.group === state.group).map(t => t.name));
    return schema.relations.filter(r => names.has(r.from) || names.has(r.to));
  }

  function renderRelations() {
    const el = $('#dbRelations');
    if (!el) return;
    const rels = visibleRelations();
    el.innerHTML = rels.map((r, i) => {
      const key = `${r.from}|${r.to}|${r.label}`;
      const active = state.highlightRelation === key ? ' active' : '';
      return `
        <button type="button" class="db-rel-chip${active}" data-rel-idx="${i}" data-rel-key="${esc(key)}">
          <span class="db-rel-from">${esc(r.from)}</span>
          <span class="db-rel-arrow">→</span>
          <span class="db-rel-to">${esc(r.to)}</span>
          <span class="db-rel-label">${esc(r.label)}</span>
        </button>
      `;
    }).join('');

    el.querySelectorAll('.db-rel-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const key = chip.dataset.relKey;
        state.highlightRelation = state.highlightRelation === key ? null : key;
        const rel = rels[parseInt(chip.dataset.relIdx, 10)];
        if (rel) {
          state.highlightTable = rel.from;
          renderRelations();
          renderDiagram();
          renderTables();
          scrollToTable(rel.from, true);
        }
      });
    });
  }

  const DIAGRAM_LAYOUT = {
    auth: { x: 40, y: 40, cols: 1 },
    core: { x: 280, y: 40, cols: 1 },
    profiles: { x: 520, y: 40, cols: 1 },
    tags: { x: 40, y: 280, cols: 2 },
    relations: { x: 400, y: 280, cols: 1 },
    reviews: { x: 640, y: 280, cols: 1 },
    views: { x: 640, y: 420, cols: 1 }
  };

  const NODE_W = 148;
  const NODE_H = 36;
  const NODE_GAP_Y = 12;
  const NODE_GAP_X = 16;

  function diagramNodes() {
    const tables = state.group === 'all'
      ? schema.tables
      : schema.tables.filter(t => t.group === state.group);

    const positions = {};
    const byGroup = {};
    tables.forEach(t => {
      if (!byGroup[t.group]) byGroup[t.group] = [];
      byGroup[t.group].push(t);
    });

    Object.entries(byGroup).forEach(([groupId, list]) => {
      const layout = DIAGRAM_LAYOUT[groupId] || { x: 40, y: 40, cols: 1 };
      list.forEach((t, i) => {
        const col = i % layout.cols;
        const row = Math.floor(i / layout.cols);
        positions[t.name] = {
          x: layout.x + col * (NODE_W + NODE_GAP_X),
          y: layout.y + row * (NODE_H + NODE_GAP_Y),
          group: groupId,
          table: t
        };
      });
    });
    return positions;
  }

  function renderDiagram() {
    const wrap = $('#dbDiagram');
    if (!wrap) return;

    const positions = diagramNodes();
    const names = new Set(Object.keys(positions));
    const rels = visibleRelations().filter(r => names.has(r.from) && names.has(r.to));

    let maxX = 0;
    let maxY = 0;
    Object.values(positions).forEach(p => {
      maxX = Math.max(maxX, p.x + NODE_W + 40);
      maxY = Math.max(maxY, p.y + NODE_H + 60);
    });

    const edges = rels.map(r => {
      const a = positions[r.from];
      const b = positions[r.to];
      if (!a || !b) return '';
      const x1 = a.x + NODE_W;
      const y1 = a.y + NODE_H / 2;
      const x2 = b.x;
      const y2 = b.y + NODE_H / 2;
      const mx = (x1 + x2) / 2;
      const key = `${r.from}|${r.to}|${r.label}`;
      const hlRel = state.highlightRelation === key;
      const hlTbl = state.highlightTable && (r.from === state.highlightTable || r.to === state.highlightTable);
      let cls = 'db-diagram-edge';
      if (state.highlightTable || state.highlightRelation) {
        cls += hlRel || hlTbl ? ' highlight' : ' dim';
      }
      return `<path class="${cls}" d="M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}" data-from="${esc(r.from)}" data-to="${esc(r.to)}"/>`;
    }).join('');

    const nodes = Object.entries(positions).map(([name, p]) => {
      const g = getGroupMeta(p.group);
      const dim = state.highlightTable && state.highlightTable !== name &&
        !rels.some(r => (r.from === state.highlightTable && r.to === name) || (r.to === state.highlightTable && r.from === name));
      const highlight = state.highlightTable === name;
      return `
        <g class="db-diagram-node${dim ? ' dim' : ''}${highlight ? ' highlight' : ''}" data-node="${esc(name)}" transform="translate(${p.x},${p.y})">
          <rect width="${NODE_W}" height="${NODE_H}" rx="8" fill="${g.color}22" stroke="${g.color}" />
          <text x="10" y="22">${esc(name)}</text>
        </g>
      `;
    }).join('');

    const groupLabels = state.group === 'all'
      ? schema.groups.map(g => {
          const layout = DIAGRAM_LAYOUT[g.id];
          if (!layout) return '';
          const hasTables = schema.tables.some(t => t.group === g.id);
          if (!hasTables) return '';
          return `<text x="${layout.x}" y="${layout.y - 12}" fill="#64748b" font-size="10" font-weight="700" font-family="DM Sans, sans-serif">${g.icon} ${esc(g.label)}</text>`;
        }).join('')
      : '';

    wrap.innerHTML = `
      <svg class="db-diagram-svg" width="${maxX}" height="${maxY}" viewBox="0 0 ${maxX} ${maxY}">
        ${groupLabels}
        ${edges}
        ${nodes}
      </svg>
    `;

    wrap.querySelectorAll('.db-diagram-node').forEach(node => {
      node.addEventListener('click', () => {
        const name = node.dataset.node;
        state.highlightTable = state.highlightTable === name ? null : name;
        renderDiagram();
        renderTables();
        scrollToTable(name, true);
      });
    });
  }

  function typeClass(type) {
    const t = (type || '').toUpperCase();
    if (t.includes('UUID')) return 'db-type-uuid';
    if (t.includes('JSON')) return 'db-type-json';
    if (t.includes('BOOL')) return 'db-type-bool';
    if (t.includes('INT') || t.includes('NUMERIC') || t.includes('DECIMAL')) return 'db-type-num';
    if (t.includes('TEXT') || t.includes('CHAR') || t.includes('DATE') || t.includes('TIME')) return 'db-type-text';
    return '';
  }

  function colBadges(col) {
    let html = '';
    if (col.isPrimary) html += '<span class="db-badge db-badge-pk">PK</span>';
    if (col.isForeignKey) html += '<span class="db-badge db-badge-fk">FK</span>';
    if (col.nullable === false) html += '<span class="db-badge db-badge-nn">NOT NULL</span>';
    else html += '<span class="db-badge db-badge-null">NULL</span>';
    return html;
  }

  function countBadge(table) {
    if (state.countErrors[table.name]) {
      return '<span class="db-table-count err">erro</span>';
    }
    const count = state.counts[table.name];
    if (count != null) {
      return `<span class="db-table-count">${count.toLocaleString('pt-BR')} rows</span>`;
    }
    if (state.countsLoading) {
      return '<span class="db-table-count loading">…</span>';
    }
    return '';
  }

  function renderTableCard(table) {
    const g = getGroupMeta(table.group);
    const q = state.filter.trim();
    const open = state.expanded.has(table.name) || !!q;
    const highlight = state.highlightTable === table.name;

    const meta = [];
    if (table.kind === 'view') meta.push('<span class="db-tag db-tag-view">VIEW</span>');
    else meta.push('<span class="db-tag db-tag-table">TABLE</span>');
    meta.push(`<span class="db-tag">${g.icon} ${esc(g.label)}</span>`);

    let extra = '';
    if (table.foreignKeys?.length) {
      extra += `<div class="db-table-meta"><strong>FK:</strong> ${table.foreignKeys.map(esc).join(' · ')}</div>`;
    }
    if (table.indexes?.length) {
      extra += `<div class="db-table-meta"><strong>Índices:</strong> ${table.indexes.map(esc).join(' · ')}</div>`;
    }
    if (table.unique?.length) {
      extra += `<div class="db-table-meta"><strong>UNIQUE:</strong> ${table.unique.map(esc).join(' · ')}</div>`;
    }
    if (table.checks?.length) {
      extra += `<div class="db-table-meta"><strong>CHECK:</strong> ${table.checks.map(esc).join(' · ')}</div>`;
    }
    if (table.source) {
      extra += `<div class="db-table-meta"><strong>SQL:</strong> <code>${esc(table.source)}</code></div>`;
    }

    const rows = table.columns.map(col => {
      const match = q && (
        col.name.toLowerCase().includes(q.toLowerCase()) ||
        (col.type || '').toLowerCase().includes(q.toLowerCase()) ||
        (col.desc || '').toLowerCase().includes(q.toLowerCase())
      );
      return `
        <tr class="${match ? 'match' : ''}">
          <td><button type="button" class="db-copy-col" data-copy="${esc(col.name)}" title="Copiar">${hl(col.name, q)}</button></td>
          <td><code class="${typeClass(col.type)}">${hl(col.type, q)}</code></td>
          <td class="db-badges-cell">${colBadges(col)}</td>
          <td><code class="db-default">${esc(col.default || '—')}</code></td>
          <td>${col.references ? `<span class="db-fk-ref">${esc(col.references)}</span>` : '—'}</td>
          <td class="db-desc-cell">${hl(col.desc || '—', q)}</td>
        </tr>
      `;
    }).join('');

    return `
      <article class="db-table-card${open ? ' open' : ''}${highlight ? ' highlight' : ''}" id="tbl-${esc(table.name)}" style="--accent:${g.color}">
        <header class="db-table-head" data-toggle="${esc(table.name)}">
          <div class="db-table-title-wrap">
            <h3 class="db-table-name">${hl(table.name, q)}</h3>
            <div class="db-table-tags">${meta.join('')}</div>
          </div>
          <div class="db-table-head-right">
            <button type="button" class="db-btn-copy-tbl" data-copy-tbl="${esc(table.name)}" title="Copiar nome">📋</button>
            ${countBadge(table)}
            <span class="db-col-count">${table.columns.length} col.</span>
            <span class="db-chevron" aria-hidden="true">▾</span>
          </div>
        </header>
        ${table.description ? `<p class="db-table-desc">${hl(table.description, q)}</p>` : ''}
        <div class="db-table-body">
          ${extra}
          <div class="db-table-scroll">
            <table class="db-cols-table">
              <thead>
                <tr>
                  <th>Coluna</th><th>Tipo</th><th>Constraints</th><th>Default</th><th>Referência</th><th>Descrição</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>
      </article>
    `;
  }

  function renderTables() {
    const root = $('#dbTables');
    const empty = $('#dbEmpty');
    if (!root) return;

    const tables = filteredTables();
    if (!tables.length) {
      root.innerHTML = '';
      if (empty) empty.style.display = 'block';
      renderIndex();
      return;
    }
    if (empty) empty.style.display = 'none';

    if (state.group === 'all' && !state.filter.trim()) {
      const grouped = {};
      tables.forEach(t => {
        if (!grouped[t.group]) grouped[t.group] = [];
        grouped[t.group].push(t);
      });
      root.innerHTML = schema.groups
        .filter(g => grouped[g.id]?.length)
        .map(g => `
          <div class="db-group-block" data-group-block="${g.id}">
            <div class="db-group-header">
              <span style="font-size:18px">${g.icon}</span>
              <h3>${esc(g.label)}</h3>
              <span>${grouped[g.id].length} entidade(s)</span>
            </div>
            <div class="db-tables">${grouped[g.id].map(renderTableCard).join('')}</div>
          </div>
        `).join('');
    } else {
      root.innerHTML = `<div class="db-tables">${tables.map(renderTableCard).join('')}</div>`;
    }

    bindTableEvents(root);
    renderIndex();
    renderRelations();
  }

  function bindTableEvents(root) {
    root.querySelectorAll('.db-table-head').forEach(head => {
      head.addEventListener('click', e => {
        if (e.target.closest('.db-btn-copy-tbl')) return;
        const name = head.dataset.toggle;
        const card = head.closest('.db-table-card');
        if (state.expanded.has(name)) state.expanded.delete(name);
        else state.expanded.add(name);
        card?.classList.toggle('open');
      });
    });

    root.querySelectorAll('.db-copy-col, .db-btn-copy-tbl').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const text = btn.dataset.copy || btn.dataset.copyTbl;
        navigator.clipboard?.writeText(text).then(() => toast(`Copiado: ${text}`));
      });
    });
  }

  function scrollToTable(name, expand) {
    if (expand) {
      state.expanded.add(name);
      renderTables();
    }
    const el = document.getElementById(`tbl-${name}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.classList.add('highlight');
      setTimeout(() => el.classList.remove('highlight'), 1800);
    }
    $$('.db-index-item').forEach(item => {
      item.classList.toggle('active', item.dataset.jump === name);
    });
  }

  function toast(msg) {
    const t = $('#dbToast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._tm);
    toast._tm = setTimeout(() => t.classList.remove('show'), 2200);
  }

  function countColumn(table) {
    const pk = table.columns.find(c => c.isPrimary);
    if (pk) return pk.name;
    return table.columns[0]?.name || 'id';
  }

  async function fetchTableCount(table) {
    if (typeof SUPABASE_URL === 'undefined' || typeof SUPABASE_KEY === 'undefined') return null;
    const col = countColumn(table);
    try {
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/${table.name}?select=${col}`, {
        method: 'HEAD',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Prefer: 'count=exact'
        }
      });
      if (!resp.ok) throw new Error(String(resp.status));
      const range = resp.headers.get('content-range');
      const total = range?.split('/')?.[1];
      return total ? parseInt(total, 10) : 0;
    } catch {
      try {
        const col2 = countColumn(table);
        const resp = await fetch(`${SUPABASE_URL}/rest/v1/${table.name}?select=${col2}&limit=1`, {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            Prefer: 'count=exact'
          }
        });
        if (!resp.ok) throw new Error(String(resp.status));
        const range = resp.headers.get('content-range');
        return parseInt(range?.split('/')?.[1] || '0', 10);
      } catch {
        return null;
      }
    }
  }

  async function loadLiveCounts() {
    const status = $('#dbLiveStatus');
    const pill = $('#dbLivePill');
    state.countsLoading = true;
    state.countErrors = {};
    if (status) status.textContent = 'Sincronizando contagens…';
    if (pill) pill.textContent = '● Sincronizando…';
    renderTables();
    renderModuleCards();

    const hasConfig = typeof SUPABASE_URL !== 'undefined' && typeof SUPABASE_KEY !== 'undefined';
    let total = 0;

    if (hasConfig) {
      await Promise.all(schema.tables.map(async t => {
        const n = await fetchTableCount(t);
        if (n != null) {
          state.counts[t.name] = n;
          if (t.kind !== 'view') total += n;
        } else {
          state.countErrors[t.name] = true;
        }
      }));
    }

    state.countsLoading = false;
    const live = $('#kpiLiveRows');
    if (live) live.textContent = hasConfig ? total.toLocaleString('pt-BR') : '—';

    const time = new Date().toLocaleTimeString('pt-BR');
    if (status) {
      status.textContent = hasConfig
        ? `Atualizado ${time} · Supabase REST`
        : 'Modo estático — config.js não encontrado';
    }
    if (pill) {
      pill.textContent = hasConfig ? `● Live ${time}` : '● Estático';
    }

    renderTables();
    renderModuleCards();
    renderDiagram();
  }

  function setView(view) {
    state.view = view;
    $('#dbDiagramPanel')?.toggleAttribute('hidden', view !== 'diagram');
    $('#dbRelationsPanel')?.toggleAttribute('hidden', view !== 'relations');
    $$('.db-view-tabs .db-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });
  }

  function exportJson() {
    const payload = {
      exportedAt: new Date().toISOString(),
      liveCounts: state.counts,
      schema
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'proofly-schema.json';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Schema + contagens exportados');
  }

  function bindUi() {
    const search = $('#dbSearch');
    search?.addEventListener('input', e => {
      state.filter = e.target.value;
      renderTables();
      renderDiagram();
    });

    $('#dbBtnRefresh')?.addEventListener('click', () => loadLiveCounts());
    $('#dbBtnExpand')?.addEventListener('click', () => {
      filteredTables().forEach(t => state.expanded.add(t.name));
      renderTables();
    });
    $('#dbBtnCollapse')?.addEventListener('click', () => {
      state.expanded.clear();
      renderTables();
    });
    $('#dbBtnExport')?.addEventListener('click', exportJson);
    $('#dbBtnSql')?.addEventListener('click', () => window.open('./schema.sql', '_blank'));

    $$('.db-view-tabs .db-btn').forEach(btn => {
      btn.addEventListener('click', () => setView(btn.dataset.view));
    });

    document.addEventListener('keydown', e => {
      if (e.key === '/' && document.activeElement !== search) {
        e.preventDefault();
        search?.focus();
      }
      if (e.key === 'Escape') {
        state.highlightTable = null;
        state.highlightRelation = null;
        if (document.activeElement === search) {
          search.value = '';
          state.filter = '';
          search.blur();
          renderTables();
          renderDiagram();
        }
      }
    });
  }

  function init() {
    $('#dbVersion').textContent = schema.version || '—';
    renderKpis();
    renderNav();
    renderModuleCards();
    renderDiagram();
    renderRelations();
    renderTables();
    bindUi();
    loadLiveCounts();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();