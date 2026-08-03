// =====================================================
// PROOFLY — Mercado de talentos (IGV + carteira calculada)
// Profissional como "ativo" — dados reais, não auto-declarados
// =====================================================

/** Fórmula Fase 1 (transparente — igual ao SQL 014):
 *  IGV = min(100, carteira×0.45 + nota×7 + anos×4 + verificação×5)
 *  Carteira = clientes únicos (user_id distinto), nunca auto-declarado */
const IGV_FORMULA = {
  carteira: 0.45,
  nota: 7,
  anos: 4,
  verificacao: 5
};

const DAY_NAMES_PT = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

function calcularCarteiraClientes(reviews) {
  const pool = typeof filterReviewsByType === 'function'
    ? filterReviewsByType(reviews, REVIEW_TYPES.CLIENT_TO_PROF)
    : (reviews || []).filter(r => r.review_type === 'client_to_professional' || !r.review_type);
  const uniqueUsers = new Set(pool.map(r => r.user_id).filter(Boolean));
  const verified = pool.filter(r => (typeof isReviewVerified === 'function' ? isReviewVerified(r) : r.verified)).length;
  const total = uniqueUsers.size > 0 ? uniqueUsers.size : pool.length;
  return {
    total,
    uniqueClients: uniqueUsers.size,
    reviewCount: pool.length,
    verified,
    verifiedRatio: pool.length ? verified / pool.length : 0
  };
}

function calcularIGVScore(carteiraCount, avgRating, yearsExperience, verifiedRatio) {
  const raw = (Number(carteiraCount) || 0) * IGV_FORMULA.carteira
    + (Number(avgRating) || 0) * IGV_FORMULA.nota
    + (Number(yearsExperience) || 0) * IGV_FORMULA.anos
    + (Number(verifiedRatio) || 0) * IGV_FORMULA.verificacao;
  return Math.min(100, Math.max(0, Math.round(raw * 100) / 100));
}

function formatCarteiraLabel(carteira) {
  const n = carteira?.total || 0;
  if (n >= 200) return 'Atendeu mais de 200 clientes no Ranking Pro';
  if (n >= 100) return 'Atendeu mais de 100 clientes no Ranking Pro';
  if (n >= 50) return 'Atendeu mais de 50 clientes no Ranking Pro';
  if (n >= 20) return 'Atendeu mais de 20 clientes no Ranking Pro';
  if (n >= 10) return 'Atendeu mais de 10 clientes no Ranking Pro';
  if (n > 0) return `${n} cliente${n === 1 ? '' : 's'} atendido${n === 1 ? '' : 's'} no Ranking Pro`;
  return 'Carteira em formação no Ranking Pro';
}

function calcularIGV(prof, reviewsOrOpts) {
  const years = prof?.profile?.years_experience ?? prof?.years_experience ?? 0;
  let carteira;
  let clientAvg = 0;
  let verifiedRatio = 0;

  if (Array.isArray(reviewsOrOpts)) {
    carteira = calcularCarteiraClientes(reviewsOrOpts);
    const stats = computeRatingStats(
      typeof filterReviewsByType === 'function'
        ? filterReviewsByType(reviewsOrOpts, REVIEW_TYPES.CLIENT_TO_PROF)
        : reviewsOrOpts
    );
    clientAvg = stats.avg;
    verifiedRatio = carteira.verifiedRatio;
  } else {
    const opts = reviewsOrOpts || {};
    const count = opts.clientPortfolio ?? prof?.client_portfolio_count ?? 0;
    carteira = {
      total: count,
      uniqueClients: count,
      reviewCount: prof?.total_reviews ?? 0,
      verifiedRatio: opts.verifiedRatio ?? 0
    };
    clientAvg = opts.clientAvg ?? prof?.avg_rating ?? 0;
    verifiedRatio = opts.verifiedRatio ?? 0;
  }

  const carteiraPts = (carteira.total || 0) * IGV_FORMULA.carteira;
  const notaPts = (Number(clientAvg) || 0) * IGV_FORMULA.nota;
  const anosPts = (Number(years) || 0) * IGV_FORMULA.anos;
  const verifPts = (verifiedRatio || 0) * IGV_FORMULA.verificacao;
  let igv = calcularIGVScore(carteira.total, clientAvg, years, verifiedRatio);

  if (!Array.isArray(reviewsOrOpts) && prof?.igv_score != null && prof.igv_score > 0) {
    igv = Number(prof.igv_score);
  }

  return {
    igv,
    carteira,
    carteiraLabel: formatCarteiraLabel(carteira),
    yearsExperience: years,
    clientAvg: Number(clientAvg) || 0,
    breakdown: { carteiraPts, notaPts, anosPts, verifPts },
    formula: 'carteira×0.45 + nota×7 + anos×4 + verificação×5'
  };
}

function isDisponivelAgora(prof) {
  if (prof?.available_now === true) return true;
  const today = DAY_NAMES_PT[new Date().getDay()];
  const days = prof?.availability || [];
  return days.some(d => String(d).toLowerCase().includes(today.toLowerCase().slice(0, 3))
    || String(d) === today);
}

function isAbertoContratacao(prof) {
  if (prof?.seeking_work === false) return false;
  if (prof?.current_establishment_id && prof?.seeking_work == null) return false;
  return prof?.seeking_work !== false;
}

/** Sem vínculo ativo com estabelecimento — elegível para recomendação de contratação */
function isProfAutonomo(prof) {
  return prof != null && (prof.current_establishment_id == null || prof.current_establishment_id === '');
}

function filterProfissionaisAutonomos(list) {
  return (list || []).filter(isProfAutonomo);
}

function enrichProfWithTalentMetrics(prof, reviews) {
  const metrics = reviews?.length
    ? calcularIGV(prof, reviews)
    : calcularIGV(prof, {
      clientPortfolio: prof.client_portfolio_count ?? 0,
      clientAvg: prof.avg_rating,
      verifiedRatio: 0
    });
  return {
    ...prof,
    _talentMetrics: {
      ...metrics,
      disponivelAgora: isDisponivelAgora(prof),
      abertoContratacao: isAbertoContratacao(prof),
      salaryExpectation: prof.salary_expectation || null
    }
  };
}

function passesContratanteFilters(prof, filters) {
  if (!prof) return false;
  const m = prof._talentMetrics || enrichProfWithTalentMetrics(prof)._talentMetrics;

  if (filters.disponivelAgora && !m.disponivelAgora) return false;
  if (filters.abertoContratacao && !m.abertoContratacao) return false;
  if (filters.minAnos && (m.yearsExperience || 0) < filters.minAnos) return false;
  const carteiraVal = prof.client_portfolio_count ?? m.carteira?.total ?? 0;
  if (filters.minCarteira && carteiraVal < filters.minCarteira) return false;
  const igvVal = m.igv ?? prof.igv_score ?? 0;
  if (filters.minIGV && igvVal < filters.minIGV) return false;

  if (filters.styleTags?.length) {
    const profTags = [
      ...(prof.music_tags || []),
      ...(prof.visual_tags || []),
      ...(prof.personality_tags || []),
      ...(prof.work_tags || []),
      ...(prof.style_tags || []),
      ...(prof.tags || [])
    ].map(t => String(t).toLowerCase());
    const wanted = filters.styleTags.map(t => String(t).toLowerCase());
    if (!wanted.some(t => profTags.some(pt => pt.includes(t) || t.includes(pt)))) return false;
  }

  if (filters.searchTerm) {
    const q = filters.searchTerm.toLowerCase();
    const hay = [prof.name, prof.specialty, prof.profile?.specialty, m.carteiraLabel]
      .filter(Boolean).join(' ').toLowerCase();
    if (!hay.includes(q)) return false;
  }

  return true;
}

function renderIGVBadge(igv, size = 'md') {
  const v = Math.round(igv || 0);
  const tier = v >= 75 ? 'high' : v >= 50 ? 'mid' : 'low';
  return `<span class="igv-badge igv-badge-${size} igv-tier-${tier}" title="Índice de Geração de Valor — calculado pelas avaliações reais">💰 IGV ${v}</span>`;
}

function renderContratanteHiringSection(prof, opts = {}) {
  const m = typeof buildContratanteHiringMetrics === 'function'
    ? buildContratanteHiringMetrics(prof, opts)
    : {};
  const esc = typeof escapeHtml === 'function' ? escapeHtml : s => String(s || '');
  const dash = opts.variant === 'dash' ? ' contratante-hiring-dash' : '';
  const glass = opts.variant === 'dash' ? '' : ' glass-surface';

  const stat = (val, lbl, hint, wide) => `
    <div class="hiring-stat${wide ? ' hiring-stat-wide' : ''}">
      <div class="hiring-stat-value">${val != null && val !== '' ? esc(String(val)) : '—'}</div>
      <div class="hiring-stat-label">${esc(lbl)}</div>
      ${hint ? `<div class="hiring-stat-hint">${esc(hint)}</div>` : ''}
    </div>`;

  const workStyleHtml = (m.workStyleTags || []).length
    ? m.workStyleTags.map(t => `<span class="hiring-style-chip">${esc(t)}</span>`).join('')
    : '<span class="hiring-empty">Não informado</span>';

  const carteiraDisplay = m.carteira > 0 ? String(m.carteira) : '—';
  const ritmo = m.clientsPerYear != null ? `~${m.clientsPerYear} clientes/ano` : null;

  return `
    <section class="contratante-hiring-block${dash}${glass}" aria-label="Informações para contratantes">
      <header class="contratante-hiring-header">
        <div class="contratante-hiring-title-row">
          <span class="contratante-hiring-icon" aria-hidden="true">📋</span>
          <div>
            <h3 class="contratante-hiring-title">Informações para Contratantes</h3>
            <p class="contratante-hiring-sub">O que o dono da barbearia vê para decidir a contratação</p>
          </div>
        </div>
      </header>
      <div class="contratante-hiring-carteira-banner">
        <span class="contratante-hiring-carteira-icon">👥</span>
        <div>
          <div class="contratante-hiring-carteira-main">${esc(m.carteiraLabel || 'Carteira em formação')}</div>
          <div class="contratante-hiring-carteira-sub">Calculado automaticamente pelas avaliações no Ranking Pro</div>
        </div>
      </div>
      <div class="contratante-hiring-grid">
        ${stat(m.yearsExperience != null ? `${m.yearsExperience} anos` : null, 'Anos de profissão', 'tempo na área')}
        ${stat(carteiraDisplay, 'Clientes únicos', 'carteira Ranking Pro')}
        ${stat(m.avgJobDuration, 'Permanência média', 'últimos empregos')}
        ${stat(m.age != null ? `${m.age} anos` : null, 'Idade', 'estimada')}
        ${stat(m.salaryExpectation, 'Pretensão salarial', 'comissão / salário')}
        ${stat(ritmo, 'Ritmo aproximado', 'clientes por ano')}
      </div>
      <div class="contratante-hiring-tags-block">
        <div class="contratante-hiring-tags-label">💼 Estilo de trabalho</div>
        <div class="contratante-hiring-tags">${workStyleHtml}</div>
      </div>
      <p class="contratante-hiring-foot">Dados declarados pelo profissional + métricas reais do Ranking Pro (carteira e IGV não são auto-declarados).</p>
    </section>
  `;
}

function renderTalentMarketBlock(prof, metrics) {
  const m = metrics || prof?._talentMetrics || calcularIGV(prof);
  const disp = isDisponivelAgora(prof);
  const aberto = isAbertoContratacao(prof);

  return `
    <div class="talent-market-block">
      <div class="talent-market-header">
        <span class="talent-market-title">📈 Mercado de talentos</span>
        <span class="talent-market-auto">Calculado automaticamente — não é auto-declarado</span>
      </div>
      <div class="talent-market-grid">
        <div class="talent-stat talent-stat-igv">
          <div class="talent-stat-value">${m.igv}</div>
          <div class="talent-stat-label">IGV</div>
          <div class="talent-stat-hint">Índice de Geração de Valor</div>
        </div>
        <div class="talent-stat">
          <div class="talent-stat-value">${m.carteira?.total || 0}</div>
          <div class="talent-stat-label">Carteira</div>
          <div class="talent-stat-hint">clientes no Ranking Pro</div>
        </div>
        <div class="talent-stat">
          <div class="talent-stat-value">${m.yearsExperience || '—'}</div>
          <div class="talent-stat-label">Anos</div>
          <div class="talent-stat-hint">de carreira</div>
        </div>
        <div class="talent-stat">
          <div class="talent-stat-value">${m.clientAvg ? m.clientAvg.toFixed(1) : '—'}</div>
          <div class="talent-stat-label">Nota</div>
          <div class="talent-stat-hint">média clientes</div>
        </div>
      </div>
      <p class="talent-carteira-line"><strong>${escapeHtml(m.carteiraLabel)}</strong></p>
      <p class="talent-formula-line" style="font-size:11px;color:rgba(234,234,234,0.45);margin:0 0 10px;">
        IGV = carteira×0.45 + nota×7 + anos×4 + verificação×5 (máx. 100)
      </p>
      <div class="talent-market-badges">
        ${renderIGVBadge(m.igv)}
        ${disp ? '<span class="talent-pill talent-pill-live">🟢 Disponível agora</span>' : ''}
        ${aberto ? '<span class="talent-pill">🔓 Aberto a contratação</span>' : '<span class="talent-pill talent-pill-muted">Vinculado</span>'}
        ${prof.salary_expectation ? `<span class="talent-pill">💵 ${escapeHtml(prof.salary_expectation)}</span>` : ''}
      </div>
    </div>
  `;
}

function renderTalentCardRow(metrics) {
  if (!metrics) return '';
  return `
    <div class="tinder-card-talent">
      ${renderIGVBadge(metrics.igv, 'sm')}
      <span class="talent-carteira-chip">${escapeHtml(metrics.carteiraLabel)}</span>
      ${metrics.disponivelAgora ? '<span class="talent-pill talent-pill-live sm">🟢 Agora</span>' : ''}
    </div>
  `;
}

// ----- Fase 2: Match Avançado + ROI + Alertas + Relatório -----

function collectProfTags(prof) {
  return [
    ...(prof?.music_tags || []),
    ...(prof?.visual_tags || []),
    ...(prof?.personality_tags || []),
    ...(prof?.work_tags || []),
    ...(prof?.style_tags || []),
    ...(prof?.tags || [])
  ].filter(Boolean).map(t => String(t).trim());
}

function collectEstabTags(estab) {
  return [
    ...(estab?.music_tags || []),
    ...(estab?.infra_tags || []),
    ...(estab?.positioning_tags || []),
    ...(estab?.audience_tags || []),
    ...(estab?.vibe_tags || []),
    ...(estab?.style_tags || []),
    ...(estab?.tags || [])
  ].filter(Boolean).map(t => String(t).trim());
}

function findSharedStyleTags(profTags, estabTags) {
  const p = profTags.map(t => t.toLowerCase());
  const e = estabTags.map(t => t.toLowerCase());
  const shared = [];
  e.forEach(et => {
    if (p.some(pt => pt === et || pt.includes(et) || et.includes(pt))) {
      const orig = estabTags.find(t => t.toLowerCase() === et) || profTags.find(t => t.toLowerCase() === et) || et;
      if (!shared.includes(orig)) shared.push(orig);
    }
  });
  return shared;
}

function calcularAfinidadeEstilo(profTags, estabTags) {
  if (!estabTags.length) return 50;
  const shared = findSharedStyleTags(profTags, estabTags);
  if (!shared.length) return 15;
  const ratio = shared.length / Math.max(estabTags.length, 1);
  return Math.min(100, Math.round(40 + ratio * 60));
}

function buildContratanteMatchBreakdown(prof, establishment) {
  if (!prof || !establishment) return null;
  const match = calcularMatchContratante(prof, establishment);
  const igvPart = Math.round(match.igv * 0.55 * 10) / 10;
  const stylePart = Math.round(match.styleScore * 0.45 * 10) / 10;
  return {
    percent: match.percent,
    igv: match.igv,
    styleScore: match.styleScore,
    sharedTags: match.sharedTags || [],
    headline: match.headline,
    tier: match.tier,
    formula: 'Match = IGV×0.55 + afinidade de estilo×0.45',
    components: [
      { label: 'IGV (geração de valor)', points: igvPart, raw: match.igv, weight: '55%', origin: 'avaliações + carteira no Ranking Pro' },
      { label: 'Afinidade de estilo', points: stylePart, raw: match.styleScore, weight: '45%', origin: 'tags em comum com o estabelecimento' }
    ],
    estabTags: collectEstabTags(establishment).slice(0, 8),
    profTags: collectProfTags(prof).slice(0, 8)
  };
}

function calcularMatchContratante(prof, establishment) {
  const m = prof._talentMetrics || enrichProfWithTalentMetrics(prof)._talentMetrics;
  const igv = Number(m.igv ?? prof.igv_score ?? 0);
  const profTags = collectProfTags(prof);
  const estabTags = collectEstabTags(establishment);
  const styleScore = calcularAfinidadeEstilo(profTags, estabTags);
  const sharedTags = findSharedStyleTags(profTags, estabTags);
  const percent = Math.min(100, Math.round(igv * 0.55 + styleScore * 0.45));
  let headline = 'Compatibilidade moderada';
  if (percent >= 80) headline = 'Investimento altamente recomendado';
  else if (percent >= 65) headline = 'Forte fit com seu estabelecimento';
  else if (percent >= 45) headline = 'Potencial com ajustes de estilo';

  return {
    percent,
    igv,
    styleScore,
    sharedTags,
    headline,
    tier: percent >= 75 ? 'high' : percent >= 50 ? 'mid' : 'low'
  };
}

function parseTicketMedio(priceRange) {
  const s = String(priceRange || '').toLowerCase();
  if (s.includes('200')) return 150;
  if (s.includes('100')) return 85;
  if (s.includes('50')) return 45;
  if (s.includes('acima')) return 180;
  return 70;
}

function calcularROIEstimado(prof) {
  const m = prof._talentMetrics || enrichProfWithTalentMetrics(prof)._talentMetrics;
  const carteira = prof.client_portfolio_count ?? m.carteira?.total ?? 0;
  const rating = Number(prof.avg_rating) || 0;
  const igv = Number(m.igv ?? prof.igv_score ?? 0);
  const ticket = parseTicketMedio(prof.price_range);
  const raw = (carteira * 0.12 + rating * 10 + igv * 0.35) * (ticket / 70);
  const index = Math.min(100, Math.max(0, Math.round(raw)));
  const label = index >= 75 ? 'Alto potencial de retorno'
    : index >= 50 ? 'Retorno moderado estimado'
    : index >= 25 ? 'Retorno em construção'
    : 'Ainda sem histórico suficiente';
  const faturamentoEstimado = Math.round(carteira * ticket * (rating / 5) * 0.08);
  return { index, label, ticketMedio: ticket, faturamentoEstimado };
}

function enrichProfForContratante(prof, establishment) {
  const match = establishment ? calcularMatchContratante(prof, establishment) : null;
  const roi = calcularROIEstimado(prof);
  return {
    ...prof,
    _contratanteMatch: match,
    _roiEstimado: roi
  };
}

function getTalentAlerts(profs, options = {}) {
  const minIGV = options.minIGV ?? 60;
  const autonomoOnly = options.autonomoOnly !== false;
  let pool = profs || [];
  if (autonomoOnly) pool = filterProfissionaisAutonomos(pool);
  return pool
    .map(p => enrichProfWithTalentMetrics(p))
    .filter(p => {
      const m = p._talentMetrics;
      const igv = m?.igv ?? p.igv_score ?? 0;
      return igv >= minIGV && m?.disponivelAgora && m?.abertoContratacao;
    })
    .sort((a, b) => (b._talentMetrics?.igv ?? b.igv_score ?? 0) - (a._talentMetrics?.igv ?? a.igv_score ?? 0))
    .slice(0, options.limit ?? 5);
}

function renderContratanteMatchBlock(prof, establishment, options = {}) {
  if (!establishment || !prof) return '';
  const enriched = typeof enrichProfForContratante === 'function'
    ? enrichProfForContratante(prof, establishment)
    : prof;
  const match = options.match || enriched._contratanteMatch || calcularMatchContratante(enriched, establishment);
  const roi = options.roi || enriched._roiEstimado || calcularROIEstimado(enriched);
  const m = enriched._talentMetrics || enrichProfWithTalentMetrics(enriched)._talentMetrics;
  const shared = (match.sharedTags || []).slice(0, 5);
  const tierClass = match.tier === 'high' ? 'match-tier-high' : match.tier === 'mid' ? 'match-tier-mid' : 'match-tier-low';

  return `
    <div class="contratante-match-block ${tierClass}">
      <div class="contratante-match-header">
        <span class="contratante-match-title">🎯 Match para contratação</span>
        <span class="contratante-match-estab">vs ${escapeHtml(establishment.name || 'seu estabelecimento')}</span>
      </div>
      <div class="contratante-match-grid">
        <div class="contratante-match-stat contratante-match-main">
          <div class="contratante-match-value">${match.percent}%</div>
          <div class="contratante-match-label">Match</div>
          <div class="contratante-match-hint">${escapeHtml(match.headline)}</div>
        </div>
        <div class="contratante-match-stat">
          <div class="contratante-match-value">${Math.round(match.igv)}</div>
          <div class="contratante-match-label">IGV</div>
          <div class="contratante-match-hint">geração de valor</div>
        </div>
        <div class="contratante-match-stat">
          <div class="contratante-match-value">${match.styleScore}%</div>
          <div class="contratante-match-label">Estilo</div>
          <div class="contratante-match-hint">afinidade com o local</div>
        </div>
        <div class="contratante-match-stat">
          <div class="contratante-match-value">${roi.index}</div>
          <div class="contratante-match-label">ROI est.</div>
          <div class="contratante-match-hint">${escapeHtml(roi.label)}</div>
        </div>
      </div>
      <p class="contratante-match-formula" style="font-size:11px;color:rgba(234,234,234,0.45);margin:0 0 10px;">
        Match = IGV×0.55 + estilo do estabelecimento×0.45 · ROI = estimativa conservadora (carteira × ticket × reputação)
      </p>
      <div class="talent-market-badges">
        <span class="match-badge">🎯 ${match.percent}% fit</span>
        ${renderIGVBadge(m.igv, 'sm')}
        <span class="roi-badge">📈 ROI ${roi.index}</span>
        ${m.disponivelAgora ? '<span class="talent-pill talent-pill-live">🟢 Disponível agora</span>' : ''}
        ${m.abertoContratacao ? '<span class="talent-pill">🔓 Aberto a contratação</span>' : ''}
      </div>
      ${shared.length ? `<p class="contratante-match-shared" style="font-size:13px;color:#c4b5fd;margin:10px 0 0;">✨ Estilo em comum: ${shared.map(t => escapeHtml(t)).join(' · ')}</p>` : ''}
      ${roi.faturamentoEstimado ? `<p style="font-size:12px;color:rgba(234,234,234,0.5);margin:6px 0 0;">Faturamento estimado no Ranking Pro: ~R$ ${roi.faturamentoEstimado.toLocaleString('pt-BR')}/mês</p>` : ''}
    </div>
  `;
}

function renderTalentAlertsHtml(alerts, establishmentName) {
  if (!alerts?.length) return '';
  const items = alerts.map(p => {
    const m = p._talentMetrics;
    const match = p._contratanteMatch;
    return `<li class="talent-alert-item">
      <strong>${escapeHtml(p.name)}</strong>
      <span>IGV ${Math.round(m?.igv ?? 0)}</span>
      ${match ? `<span>Match ${match.percent}%</span>` : ''}
      <span class="talent-pill talent-pill-live sm">🟢 Agora</span>
    </li>`;
  }).join('');
  return `
    <div class="talent-alerts-block">
      <div class="talent-alerts-title">🔔 Oportunidades agora${establishmentName ? ` para ${escapeHtml(establishmentName)}` : ''}</div>
      <ul class="talent-alerts-list">${items}</ul>
    </div>
  `;
}

function buildRelatorioContratanteHtml(establishment, professionals, options = {}) {
  const estName = establishment?.name || 'Estabelecimento';
  const date = new Date().toLocaleDateString('pt-BR', { dateStyle: 'long' });
  const rows = (professionals || []).map((p, i) => {
    const m = p._talentMetrics || enrichProfWithTalentMetrics(p)._talentMetrics;
    const match = p._contratanteMatch || (establishment ? calcularMatchContratante(p, establishment) : null);
    const roi = p._roiEstimado || calcularROIEstimado(p);
    const shared = (match?.sharedTags || []).slice(0, 4).join(', ') || '—';
    return `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${escapeHtml(p.name)}</strong><br><small>${escapeHtml(p.profile?.specialty || p.specialty || '')}</small></td>
        <td>${Math.round(m?.igv ?? p.igv_score ?? 0)}</td>
        <td>${m?.carteira?.total ?? p.client_portfolio_count ?? 0}</td>
        <td>${match ? match.percent + '%' : '—'}</td>
        <td>${roi.index} <small>(${escapeHtml(roi.label)})</small></td>
        <td>${m?.yearsExperience ?? '—'} anos</td>
        <td>${p.avg_rating ? Number(p.avg_rating).toFixed(1) : '—'}</td>
        <td>${escapeHtml(shared)}</td>
        <td>${escapeHtml((p.work_style_tags || []).slice(0, 2).join(', ') || '—')}</td>
        <td>${p.average_job_duration_months ? (typeof formatJobDurationMonths === 'function' ? formatJobDurationMonths(p.average_job_duration_months) : p.average_job_duration_months + 'm') : '—'}</td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Relatório Ranking Pro — ${escapeHtml(estName)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; color: #0f172a; padding: 32px; max-width: 900px; margin: 0 auto; }
    h1 { font-size: 22px; margin: 0 0 4px; }
    .sub { color: #64748b; font-size: 14px; margin-bottom: 24px; }
    .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border: 1px solid #e2e8f0; padding: 10px 8px; text-align: left; vertical-align: top; }
    th { background: #f1f5f9; font-weight: 700; }
    .footer { margin-top: 32px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
    @media print { body { padding: 16px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <button class="no-print" onclick="window.print()" style="margin-bottom:16px;padding:10px 20px;border-radius:8px;border:none;background:#6366f1;color:#fff;font-weight:600;cursor:pointer;">🖨️ Imprimir / Salvar PDF</button>
  <h1>🏆 Ranking Pro — Relatório de Contratação</h1>
  <p class="sub">${escapeHtml(estName)} · ${date}</p>
  <div class="box">
    <strong>Mitigação de risco:</strong> candidatos ranqueados por IGV (dados reais), match de estilo com seu estabelecimento e índice de ROI estimado.
    Carteira calculada automaticamente — não auto-declarada.
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th><th>Profissional</th><th>IGV</th><th>Carteira</th><th>Match</th><th>ROI est.</th><th>Carreira</th><th>Nota</th><th>Estilo em comum</th><th>Estilo trabalho</th><th>Permanência</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">
    Ranking Pro — plataforma de mercado de talentos baseada em dados reais.<br>
    IGV = carteira×0.45 + nota×7 + anos×4 + verificação×5 · ROI = estimativa conservadora (carteira × ticket × reputação).
    ${options.note ? `<br>${escapeHtml(options.note)}` : ''}
  </div>
</body>
</html>`;
}

function abrirRelatorioContratante(establishment, professionals) {
  const html = buildRelatorioContratanteHtml(establishment, professionals);
  const w = window.open('', '_blank');
  if (!w) {
    alert('Permita pop-ups para gerar o relatório PDF.');
    return;
  }
  w.document.write(html);
  w.document.close();
}

(function injectTalentStyles() {
  if (document.getElementById('proofly-talent-styles')) return;
  const s = document.createElement('style');
  s.id = 'proofly-talent-styles';
  s.textContent = `
    .talent-market-block { margin: 16px 0; padding: 18px; border-radius: 18px; background: linear-gradient(135deg, rgba(16,185,129,0.12), rgba(99,102,241,0.1)); border: 1px solid rgba(255,255,255,0.08); }
    .talent-market-header { display:flex; flex-wrap:wrap; justify-content:space-between; gap:8px; margin-bottom:14px; }
    .talent-market-title { font-weight:700; font-size:15px; color:#ecfdf5; }
    .talent-market-auto { font-size:11px; color:rgba(234,234,234,0.5); }
    .talent-market-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
    @media (max-width:600px) { .talent-market-grid { grid-template-columns:repeat(2,1fr); } }
    .talent-stat { text-align:center; padding:10px 6px; border-radius:12px; background:rgba(0,0,0,0.2); }
    .talent-stat-igv { background:rgba(16,185,129,0.15); }
    .talent-stat-value { font-size:22px; font-weight:800; color:#fff; line-height:1.1; }
    .talent-stat-label { font-size:11px; font-weight:700; color:#a7f3d0; text-transform:uppercase; letter-spacing:0.04em; margin-top:4px; }
    .talent-stat-hint { font-size:10px; color:rgba(234,234,234,0.45); margin-top:2px; }
    .talent-carteira-line { font-size:14px; color:#d1fae5; margin:12px 0 10px; line-height:1.45; }
    .talent-market-badges, .tinder-card-talent { display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
    .tinder-card-talent { margin-top:8px; }
    .igv-badge { font-size:11px; font-weight:800; padding:4px 10px; border-radius:999px; }
    .igv-badge-sm { font-size:10px; padding:3px 8px; }
    .igv-tier-high { background:rgba(16,185,129,0.25); color:#6ee7b7; }
    .igv-tier-mid { background:rgba(99,102,241,0.25); color:#c7d2fe; }
    .igv-tier-low { background:rgba(148,163,184,0.2); color:#cbd5e1; }
    .talent-carteira-chip { font-size:11px; color:#94a3b8; font-weight:500; }
    .talent-pill { font-size:11px; font-weight:600; padding:3px 10px; border-radius:999px; background:rgba(255,255,255,0.08); color:#e2e8f0; }
    .talent-pill.sm { font-size:10px; padding:2px 8px; }
    .talent-pill-live { background:rgba(16,185,129,0.2); color:#6ee7b7; }
    .talent-pill-muted { opacity:0.65; }
    .contratar-filters { display:flex; flex-wrap:wrap; gap:8px; margin:16px 0; }
    .contratar-filter-chip { padding:8px 14px; border-radius:999px; border:1.5px solid rgba(255,255,255,0.12); background:rgba(255,255,255,0.04); color:#eaeaea; font-size:13px; font-weight:600; cursor:pointer; }
    .contratar-filter-chip.active { background:rgba(99,102,241,0.35); border-color:#6366f1; color:#fff; }
    .contratar-result-card { padding:16px; border-radius:18px; background:rgba(255,255,255,0.05); margin-bottom:12px; cursor:pointer; border:1px solid rgba(255,255,255,0.06); transition:0.2s; }
    .contratar-result-card:hover { transform:translateY(-2px); border-color:rgba(99,102,241,0.35); }
    .contratar-result-card.selected { border-color:#6366f1; box-shadow:0 0 0 2px rgba(99,102,241,0.35); }
    .talent-alerts-block { margin-bottom:16px; padding:14px 16px; border-radius:16px; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.25); }
    .talent-alerts-title { font-weight:700; font-size:14px; color:#6ee7b7; margin-bottom:10px; }
    .talent-alerts-list { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:8px; }
    .talent-alert-item { display:flex; flex-wrap:wrap; gap:8px; align-items:center; font-size:13px; color:#d1fae5; }
    .match-badge { font-size:11px; font-weight:700; padding:3px 10px; border-radius:999px; background:rgba(139,92,246,0.25); color:#ddd6fe; }
    .roi-badge { font-size:11px; font-weight:600; padding:3px 10px; border-radius:999px; background:rgba(245,158,11,0.2); color:#fcd34d; }
    .contratar-toolbar { display:flex; flex-wrap:wrap; gap:10px; align-items:center; margin-bottom:16px; }
    .contratar-select-cb { width:18px; height:18px; accent-color:#6366f1; cursor:pointer; flex-shrink:0; }
    .contratante-match-block { margin:16px 0; padding:18px; border-radius:18px; background:linear-gradient(135deg, rgba(139,92,246,0.14), rgba(99,102,241,0.1)); border:1px solid rgba(139,92,246,0.25); }
    .contratante-match-header { display:flex; flex-wrap:wrap; justify-content:space-between; gap:8px; margin-bottom:14px; }
    .contratante-match-title { font-weight:700; font-size:15px; color:#ede9fe; }
    .contratante-match-estab { font-size:11px; color:rgba(234,234,234,0.5); }
    .contratante-match-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:12px; }
    @media (max-width:600px) { .contratante-match-grid { grid-template-columns:repeat(2,1fr); } }
    .contratante-match-stat { text-align:center; padding:10px 6px; border-radius:12px; background:rgba(0,0,0,0.2); }
    .contratante-match-main { background:rgba(139,92,246,0.18); }
    .contratante-match-value { font-size:22px; font-weight:800; color:#fff; line-height:1.1; }
    .contratante-match-label { font-size:11px; font-weight:700; color:#ddd6fe; text-transform:uppercase; letter-spacing:0.04em; margin-top:4px; }
    .contratante-match-hint { font-size:10px; color:rgba(234,234,234,0.45); margin-top:2px; line-height:1.3; }
    .match-tier-high { border-color:rgba(16,185,129,0.35); }
    .match-tier-mid { border-color:rgba(99,102,241,0.35); }
    .talent-alerts-widget .talent-alert-item { cursor:pointer; }
    .talent-alerts-widget .talent-alert-item:hover { opacity:0.85; }
    .contratante-hiring-block { margin:16px 0; padding:20px 18px; border-radius:var(--glass-radius, 22px); border:1px solid rgba(245,158,11,0.28); }
    .contratante-hiring-block.glass-surface { background:rgba(255,255,255,0.06) !important; backdrop-filter:blur(28px) saturate(160%); -webkit-backdrop-filter:blur(28px) saturate(160%); box-shadow:0 12px 40px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.08); }
    .contratante-hiring-header { margin-bottom:16px; }
    .contratante-hiring-title-row { display:flex; align-items:flex-start; gap:12px; }
    .contratante-hiring-icon { font-size:28px; line-height:1; flex-shrink:0; }
    .contratante-hiring-title { margin:0; font-weight:800; font-size:17px; color:#fef3c7; letter-spacing:-0.02em; }
    .contratante-hiring-sub { margin:4px 0 0; font-size:12px; color:rgba(234,234,234,0.55); line-height:1.4; }
    .contratante-hiring-carteira-banner { display:flex; align-items:center; gap:12px; padding:14px 16px; margin-bottom:14px; border-radius:14px; background:linear-gradient(135deg, rgba(16,185,129,0.18), rgba(99,102,241,0.12)); border:1px solid rgba(16,185,129,0.3); }
    .contratante-hiring-carteira-icon { font-size:26px; flex-shrink:0; }
    .contratante-hiring-carteira-main { font-size:14px; font-weight:700; color:#d1fae5; line-height:1.35; }
    .contratante-hiring-carteira-sub { font-size:11px; color:rgba(234,234,234,0.45); margin-top:3px; }
    .contratante-hiring-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:14px; }
    @media (max-width:520px) { .contratante-hiring-grid { grid-template-columns:repeat(2,1fr); } .contratante-hiring-title { font-size:15px; } }
    .hiring-stat { text-align:center; padding:12px 8px; border-radius:12px; background:rgba(0,0,0,0.22); border:1px solid rgba(255,255,255,0.06); min-height:72px; display:flex; flex-direction:column; justify-content:center; }
    .hiring-stat-value { font-size:17px; font-weight:800; color:#fff; line-height:1.2; word-break:break-word; }
    .hiring-stat-label { font-size:10px; font-weight:700; color:#fcd34d; text-transform:uppercase; letter-spacing:0.04em; margin-top:5px; }
    .hiring-stat-hint { font-size:9px; color:rgba(234,234,234,0.4); margin-top:3px; line-height:1.25; }
    .contratante-hiring-tags-block { margin-top:12px; }
    .contratante-hiring-tags-label { font-size:12px; font-weight:700; color:#e2e8f0; margin-bottom:8px; }
    .contratante-hiring-tags { display:flex; flex-wrap:wrap; gap:6px; }
    .hiring-style-chip { font-size:11px; font-weight:600; padding:5px 12px; border-radius:999px; background:rgba(99,102,241,0.28); color:#c7d2fe; border:1px solid rgba(99,102,241,0.35); }
    .hiring-empty { font-size:12px; color:rgba(234,234,234,0.4); }
    .contratante-hiring-foot { font-size:10px; color:rgba(234,234,234,0.38); margin:14px 0 0; line-height:1.45; }
    .contratante-hiring-dash { margin:0; padding:22px 20px; border-radius:18px; background:linear-gradient(135deg,#fffbeb,#eef2ff); border:1px solid #fde68a; }
    .contratante-hiring-dash .contratante-hiring-title { color:#92400e; }
    .contratante-hiring-dash .contratante-hiring-sub { color:#78716c; }
    .contratante-hiring-dash .contratante-hiring-carteira-banner { background:linear-gradient(135deg,#ecfdf5,#eef2ff); border-color:#a7f3d0; }
    .contratante-hiring-dash .contratante-hiring-carteira-main { color:#065f46; }
    .contratante-hiring-dash .contratante-hiring-carteira-sub { color:#64748b; }
    .contratante-hiring-dash .hiring-stat { background:#fff; border-color:#e2e8f0; }
    .contratante-hiring-dash .hiring-stat-value { color:#0f172a; font-size:16px; }
    .contratante-hiring-dash .hiring-stat-label { color:#b45309; }
    .contratante-hiring-dash .hiring-stat-hint { color:#94a3b8; }
    .contratante-hiring-dash .hiring-style-chip { background:#eef2ff; color:#4338ca; border:1px solid #c7d2fe; }
    .contratante-hiring-dash .contratante-hiring-tags-label { color:#475569; }
    .contratante-hiring-dash .contratante-hiring-foot { color:#94a3b8; }
  `;
  document.head.appendChild(s);
})();

window.calcularIGVScore = calcularIGVScore;
window.IGV_FORMULA = IGV_FORMULA;
window.calcularCarteiraClientes = calcularCarteiraClientes;
window.formatCarteiraLabel = formatCarteiraLabel;
window.calcularIGV = calcularIGV;
window.isDisponivelAgora = isDisponivelAgora;
window.isAbertoContratacao = isAbertoContratacao;
window.enrichProfWithTalentMetrics = enrichProfWithTalentMetrics;
window.isProfAutonomo = isProfAutonomo;
window.filterProfissionaisAutonomos = filterProfissionaisAutonomos;
window.passesContratanteFilters = passesContratanteFilters;
window.renderIGVBadge = renderIGVBadge;
window.renderTalentMarketBlock = renderTalentMarketBlock;
window.renderTalentCardRow = renderTalentCardRow;
window.collectProfTags = collectProfTags;
window.collectEstabTags = collectEstabTags;
window.buildContratanteMatchBreakdown = buildContratanteMatchBreakdown;
window.calcularMatchContratante = calcularMatchContratante;
window.calcularROIEstimado = calcularROIEstimado;
window.enrichProfForContratante = enrichProfForContratante;
window.getTalentAlerts = getTalentAlerts;
window.renderContratanteMatchBlock = renderContratanteMatchBlock;
window.renderTalentAlertsHtml = renderTalentAlertsHtml;
window.buildRelatorioContratanteHtml = buildRelatorioContratanteHtml;
window.abrirRelatorioContratante = abrirRelatorioContratante;
window.renderContratanteHiringSection = renderContratanteHiringSection;