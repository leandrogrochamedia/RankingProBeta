// =====================================================
// PROOFLY — Fluxo de contratação (proposta → negociação → vínculo)
// Persistência: localStorage (+ Supabase quando tabela existir)
// =====================================================

(function(global) {
  'use strict';

  const STORAGE_KEY = 'proofly_hiring_proposals_v1';

  const HIRING_STATUS = {
    proposed: { label: 'Proposta enviada', icon: '📨', color: '#6366f1' },
    negotiating: { label: 'Em negociação', icon: '🤝', color: '#f59e0b' },
    accepted: { label: 'Aceita', icon: '✅', color: '#10b981' },
    declined: { label: 'Recusada', icon: '❌', color: '#ef4444' },
    withdrawn: { label: 'Cancelada', icon: '🚫', color: '#94a3b8' },
    hired: { label: 'Contratado', icon: '🎉', color: '#059669' }
  };

  const COMP_MODELS = [
    { id: 'comissao', label: 'Comissão por atendimento' },
    { id: 'fixo_comissao', label: 'Fixo + comissão' },
    { id: 'parceria', label: 'Parceria / aluguel de cadeira' },
    { id: 'a_combinar', label: 'A combinar' }
  ];

  function uid() {
    return 'hp_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
  }

  function readAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function writeAll(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch { /* noop */ }
  }

  function isViewerContratante(session) {
    const s = session || (typeof getSession === 'function' ? getSession() : null);
    return !!(s?.establishmentId && (s.activeProfile === 'establishment' || s.role === 'estabelecimento'));
  }

  function getProposalsForEstablishment(establishmentId) {
    if (!establishmentId) return [];
    return readAll()
      .filter(p => p.establishmentId === establishmentId)
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
  }

  function getProposalsForProfessional(professionalId) {
    if (!professionalId) return [];
    return readAll()
      .filter(p => p.professionalId === professionalId)
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
  }

  function getActiveProposal(establishmentId, professionalId) {
    const active = ['proposed', 'negotiating', 'accepted'];
    return readAll().find(p =>
      p.establishmentId === establishmentId
      && p.professionalId === professionalId
      && active.includes(p.status)
    ) || null;
  }

  function getProposalById(id) {
    return readAll().find(p => p.id === id) || null;
  }

  function proposalConflictMessage(existing) {
    if (!existing) return '';
    if (existing.initiatedBy === 'professional') {
      return 'Este profissional já enviou candidatura — responda na lista de candidaturas.';
    }
    return 'Já existe uma proposta ativa para este profissional.';
  }

  function createProposal(payload) {
    const existing = getActiveProposal(payload.establishmentId, payload.professionalId);
    if (existing) return { ok: false, error: proposalConflictMessage(existing), proposal: existing };

    const now = new Date().toISOString();
    const proposal = {
      id: uid(),
      establishmentId: payload.establishmentId,
      establishmentName: payload.establishmentName || 'Estabelecimento',
      professionalId: payload.professionalId,
      professionalName: payload.professionalName || 'Profissional',
      initiatedBy: 'establishment',
      type: payload.type || 'negotiate',
      compensationModel: payload.compensationModel || 'a_combinar',
      offerText: (payload.offerText || '').trim(),
      message: (payload.message || '').trim(),
      startDate: payload.startDate || null,
      matchPercent: payload.matchPercent ?? null,
      roiIndex: payload.roiIndex ?? null,
      status: 'proposed',
      history: [{ at: now, by: 'establishment', action: 'proposed', note: payload.message || 'Proposta inicial' }],
      createdAt: now,
      updatedAt: now
    };

    const list = readAll();
    list.push(proposal);
    writeAll(list);
    syncProposalToRemote(proposal).catch(() => {});
    return { ok: true, proposal };
  }

  function createApplication(payload) {
    const existing = getActiveProposal(payload.establishmentId, payload.professionalId);
    if (existing) {
      const err = existing.initiatedBy === 'establishment'
        ? 'Este estabelecimento já enviou uma proposta para você — responda na caixa de entrada.'
        : 'Você já enviou candidatura para este estabelecimento.';
      return { ok: false, error: err, proposal: existing };
    }

    const now = new Date().toISOString();
    const proposal = {
      id: uid(),
      establishmentId: payload.establishmentId,
      establishmentName: payload.establishmentName || 'Estabelecimento',
      professionalId: payload.professionalId,
      professionalName: payload.professionalName || 'Profissional',
      initiatedBy: 'professional',
      type: 'application',
      compensationModel: payload.compensationModel || 'a_combinar',
      offerText: (payload.offerText || '').trim(),
      message: (payload.message || '').trim(),
      startDate: payload.startDate || null,
      matchPercent: payload.matchPercent ?? null,
      roiIndex: payload.roiIndex ?? null,
      status: 'proposed',
      history: [{ at: now, by: 'professional', action: 'application', note: payload.message || 'Candidatura enviada' }],
      createdAt: now,
      updatedAt: now
    };

    const list = readAll();
    list.push(proposal);
    writeAll(list);
    syncProposalToRemote(proposal).catch(() => {});
    return { ok: true, proposal };
  }

  function updateProposal(id, patch) {
    const list = readAll();
    const idx = list.findIndex(p => p.id === id);
    if (idx < 0) return null;
    const now = new Date().toISOString();
    list[idx] = { ...list[idx], ...patch, updatedAt: now };
    writeAll(list);
    return list[idx];
  }

  function appendHistory(proposal, entry) {
    const history = [...(proposal.history || []), { ...entry, at: new Date().toISOString() }];
    return updateProposal(proposal.id, { history, status: entry.status || proposal.status });
  }

  function updateProposalStatus(id, status, note, by) {
    const p = getProposalById(id);
    if (!p) return null;
    return appendHistory(p, { by: by || 'system', action: status, status, note: note || '' });
  }

  async function syncProposalToRemote(proposal) {
    if (typeof fetchAPI !== 'function') return;
    try {
      await fetchAPI('/rest/v1/hiring_proposals', 'POST', {
        id: proposal.id,
        establishment_id: proposal.establishmentId,
        professional_id: proposal.professionalId,
        status: proposal.status,
        proposal_type: proposal.type,
        compensation_model: proposal.compensationModel,
        offer_text: proposal.offerText,
        message: proposal.message,
        match_percent: proposal.matchPercent,
        payload: proposal
      });
    } catch { /* tabela opcional */ }
  }

  async function finalizeHire(proposal) {
    if (!proposal?.professionalId || !proposal?.establishmentId) return { ok: false, error: 'Dados incompletos' };
    try {
      if (typeof fetchAPI === 'function') {
        await fetchAPI(`/rest/v1/professionals?id=eq.${proposal.professionalId}`, 'PATCH', {
          current_establishment_id: proposal.establishmentId,
          seeking_work: false,
          available_now: false
        });
        try {
          await fetchAPI('/rest/v1/professional_establishments', 'POST', {
            professional_id: proposal.professionalId,
            establishment_id: proposal.establishmentId,
            is_current: true,
            started_at: new Date().toISOString().slice(0, 10)
          });
        } catch {
          try {
            await fetchAPI('/rest/v1/professional_establishment', 'POST', {
              professional_id: proposal.professionalId,
              establishment_id: proposal.establishmentId,
              is_current: true,
              started_at: new Date().toISOString().slice(0, 10)
            });
          } catch { /* noop */ }
        }
      }
      updateProposalStatus(proposal.id, 'hired', 'Profissional vinculado ao estabelecimento', 'system');
      return { ok: true };
    } catch (e) {
      updateProposalStatus(proposal.id, 'accepted', 'Aceito localmente — vínculo pendente no servidor', 'system');
      return { ok: true, warning: e.message };
    }
  }

  function statusMeta(status) {
    return HIRING_STATUS[status] || HIRING_STATUS.proposed;
  }

  function renderStatusPill(status) {
    const m = statusMeta(status);
    return `<span class="hiring-status-pill" style="--hiring-color:${m.color}">${m.icon} ${m.label}</span>`;
  }

  function performanceTier(prof) {
    const rating = Number(prof.avg_rating) || 0;
    const igv = prof._talentMetrics?.igv ?? prof.igv_score ?? 0;
    if (rating >= 4.5 && igv >= 55) return { label: 'Alta performance', cls: 'perf-high', icon: '🟢' };
    if (rating >= 3.8 || igv >= 45) return { label: 'Estável', cls: 'perf-mid', icon: '🟡' };
    return { label: 'Atenção', cls: 'perf-low', icon: '🔴' };
  }

  function renderTeamCard(prof, opts) {
    const o = opts || {};
    const m = prof._talentMetrics || (typeof enrichProfWithTalentMetrics === 'function' ? enrichProfWithTalentMetrics(prof)._talentMetrics : null);
    const perf = performanceTier({ ...prof, _talentMetrics: m });
    const stars = typeof renderStars === 'function' ? renderStars(Math.round(prof.avg_rating || 0)) : '★';
    const igvHtml = m && typeof renderIGVBadge === 'function' ? renderIGVBadge(m.igv, 'sm') : '';
    const reviews = prof.total_reviews || 0;
    const estabReview = prof._lastEstabReview;
    const reviewSnippet = estabReview?.comment
      ? `<p class="rh-team-review">"${escapeHtml(String(estabReview.comment).slice(0, 80))}${estabReview.comment.length > 80 ? '…' : ''}"</p>`
      : '<p class="rh-team-review rh-team-review-empty">Sem avaliação sua ainda</p>';
    const url = `./perfil-page.html?tipo=profissional&id=${prof.id}`;

    return `
      <article class="rh-team-card ${perf.cls}">
        <div class="rh-team-card-head">
          <div class="rh-team-avatar">${prof.avatar_url
            ? `<img src="${escapeHtml(prof.avatar_url)}" alt="" />`
            : escapeHtml((prof.name || '?').charAt(0).toUpperCase())}</div>
          <div class="rh-team-meta">
            <div class="rh-team-name">${escapeHtml(prof.name)}</div>
            <div class="rh-team-spec">${escapeHtml(prof.specialty || prof.profile?.specialty || 'Profissional')}</div>
            <span class="rh-perf-pill">${perf.icon} ${perf.label}</span>
          </div>
        </div>
        <div class="rh-team-stats">
          <span>${stars} <strong>${prof.avg_rating ? Number(prof.avg_rating).toFixed(1) : '—'}</strong></span>
          <span>${reviews} aval.</span>
          ${igvHtml}
        </div>
        ${reviewSnippet}
        <div class="rh-team-actions">
          <button type="button" class="btn btn-outline btn-small" onclick="avaliarProfissionalVinculado('${prof.id}','${escapeHtml(prof.name).replace(/'/g, "\\'")}')">⭐ Avaliar</button>
          <a href="${url}" class="btn btn-small" style="text-decoration:none;">Ver perfil</a>
        </div>
      </article>
    `;
  }

  function renderRecoHireCard(prof, establishment) {
    let enriched = prof;
    if (typeof enrichProfForContratante === 'function' && establishment) {
      enriched = enrichProfForContratante(prof, establishment);
    }
    const match = enriched._contratanteMatch;
    const roi = enriched._roiEstimado;
    const m = enriched._talentMetrics;
    const proposal = establishment?.id
      ? getActiveProposal(establishment.id, prof.id)
      : null;

    return `
      <article class="rh-reco-card" data-prof-id="${prof.id}">
        <div class="rh-reco-top">
          <div class="rh-reco-name">${escapeHtml(prof.name)}</div>
          <div class="rh-reco-spec">${escapeHtml(prof.specialty || 'Profissional')}</div>
        </div>
        <div class="rh-reco-badges">
          <span class="roi-badge">★ ${prof.avg_rating ? Number(prof.avg_rating).toFixed(1) : '—'}</span>
          ${m && typeof renderIGVBadge === 'function' ? renderIGVBadge(m.igv, 'sm') : (m?.igv != null ? `<span class="talent-pill sm">IGV ${Math.round(m.igv)}</span>` : '')}
          ${match ? `<span class="match-badge">Match ${match.percent}%</span>` : ''}
          ${m?.disponivelAgora ? '<span class="talent-pill talent-pill-live sm">🟢 Disponível agora</span>' : ''}
          ${prof.salary_expectation ? `<span class="talent-pill sm">${escapeHtml(prof.salary_expectation)}</span>` : ''}
        </div>
        ${proposal ? `<div class="rh-reco-proposal">${renderStatusPill(proposal.status)}</div>` : ''}
        <div class="rh-reco-actions">
          <button type="button" class="btn btn-small" onclick="HiringFlow.openProposalModal('${prof.id}')">🤝 ${proposal ? 'Ver proposta' : 'Contratar'}</button>
          <a href="${typeof profilePageUrl === 'function' ? profilePageUrl('profissional', prof.id) : `./perfil-page.html?tipo=profissional&id=${prof.id}`}" class="btn btn-outline btn-small" style="text-decoration:none;">Ver perfil</a>
        </div>
      </article>
    `;
  }

  function renderProposalRow(proposal, viewer) {
    const isEst = viewer === 'establishment';
    const isApplication = proposal.initiatedBy === 'professional' || proposal.type === 'application';
    const title = isEst ? proposal.professionalName : proposal.establishmentName;
    const sub = isEst
      ? (isApplication
        ? (proposal.message || 'Candidatura recebida')
        : (proposal.offerText || proposal.compensationModel))
      : (isApplication
        ? (proposal.message || 'Candidatura enviada')
        : (proposal.message || 'Nova oportunidade'));
    const modelLabel = COMP_MODELS.find(c => c.id === proposal.compensationModel)?.label || proposal.compensationModel;
    const kindBadge = isApplication
      ? `<span class="hiring-kind-pill hiring-kind-application">${isEst ? '📥 Candidatura' : '📤 Candidatura'}</span>`
      : `<span class="hiring-kind-pill hiring-kind-offer">${isEst ? '📤 Proposta' : '📨 Proposta'}</span>`;

    let actions = '';
    if (isEst && isApplication && proposal.status === 'proposed') {
      actions = `
        <button type="button" class="btn btn-small" onclick="HiringFlow.respondAsEstablishment('${proposal.id}','accepted')">✅ Contratar</button>
        <button type="button" class="btn btn-outline btn-small" onclick="HiringFlow.respondAsEstablishment('${proposal.id}','negotiating')">💬 Negociar</button>
        <button type="button" class="btn btn-outline btn-small" onclick="HiringFlow.respondAsEstablishment('${proposal.id}','declined')">Recusar</button>
      `;
    } else if (isEst && isApplication && proposal.status === 'negotiating') {
      actions = `
        <button type="button" class="btn btn-small" onclick="HiringFlow.respondAsEstablishment('${proposal.id}','accepted')">✅ Aceitar</button>
        <button type="button" class="btn btn-outline btn-small" onclick="HiringFlow.respondAsEstablishment('${proposal.id}','declined')">Recusar</button>
      `;
    } else if (isEst && !isApplication && ['proposed', 'negotiating'].includes(proposal.status)) {
      actions = `<button type="button" class="btn btn-outline btn-small" onclick="HiringFlow.cancelProposal('${proposal.id}')">Cancelar</button>`;
    }
    if (!isEst && !isApplication && proposal.status === 'proposed') {
      actions = `
        <button type="button" class="btn btn-small" onclick="HiringFlow.respondProposal('${proposal.id}','accepted')">✅ Aceitar</button>
        <button type="button" class="btn btn-outline btn-small" onclick="HiringFlow.respondProposal('${proposal.id}','negotiating')">💬 Negociar</button>
        <button type="button" class="btn btn-outline btn-small" onclick="HiringFlow.respondProposal('${proposal.id}','declined')">Recusar</button>
      `;
    }
    if (!isEst && !isApplication && proposal.status === 'negotiating') {
      actions = `
        <button type="button" class="btn btn-small" onclick="HiringFlow.respondProposal('${proposal.id}','accepted')">✅ Aceitar condições</button>
        <button type="button" class="btn btn-outline btn-small" onclick="HiringFlow.respondProposal('${proposal.id}','declined')">Recusar</button>
      `;
    }
    if (!isEst && isApplication && ['proposed', 'negotiating'].includes(proposal.status)) {
      actions = `<button type="button" class="btn btn-outline btn-small" onclick="HiringFlow.cancelApplication('${proposal.id}')">Cancelar candidatura</button>`;
    }

    return `
      <article class="hiring-proposal-row" data-id="${proposal.id}">
        <div class="hiring-proposal-main">
          <div class="hiring-proposal-title">${escapeHtml(title)} ${kindBadge}</div>
          <div class="hiring-proposal-sub">${escapeHtml(sub)} · ${escapeHtml(modelLabel)}</div>
          ${proposal.matchPercent != null ? `<div class="hiring-proposal-match">Match ${proposal.matchPercent}%${proposal.roiIndex != null ? ` · ROI ${proposal.roiIndex}` : ''}</div>` : ''}
        </div>
        <div class="hiring-proposal-side">
          ${renderStatusPill(proposal.status)}
          <div class="hiring-proposal-actions">${actions}</div>
        </div>
      </article>
    `;
  }

  function renderEstabOpportunityCard(est, prof) {
    let enriched = prof;
    if (typeof enrichProfForContratante === 'function' && est) {
      enriched = enrichProfForContratante(prof, est);
    }
    const match = enriched._contratanteMatch;
    const proposal = est?.id && prof?.id ? getActiveProposal(est.id, prof.id) : null;
    const isApplication = proposal?.initiatedBy === 'professional';
    const isOffer = proposal && !isApplication;
    const city = est.city || est.neighborhood || '';
    const rating = est.avg_rating ? Number(est.avg_rating).toFixed(1) : '—';

    let ctaLabel = '💼 Pedir emprego';
    let ctaAction = `HiringFlow.openApplyModal('${est.id}')`;
    if (isOffer) {
      ctaLabel = '📨 Ver proposta';
      ctaAction = `HiringFlow.openApplyModal('${est.id}')`;
    } else if (isApplication) {
      ctaLabel = '📤 Candidatura enviada';
      ctaAction = `HiringFlow.openApplyModal('${est.id}')`;
    }

    return `
      <article class="rh-reco-card rh-estab-card" data-est-id="${est.id}">
        <div class="rh-reco-top">
          <div class="rh-reco-name">${escapeHtml(est.name)}</div>
          <div class="rh-reco-spec">${escapeHtml(est.type || 'Estabelecimento')}${city ? ` · 📍 ${escapeHtml(city)}` : ''}</div>
        </div>
        <div class="rh-reco-badges">
          <span class="roi-badge">★ ${rating}</span>
          ${est.total_reviews ? `<span class="talent-pill sm">${est.total_reviews} aval. verificadas</span>` : ''}
          ${match ? `<span class="match-badge">Match ${match.percent}%</span>` : ''}
        </div>
        ${match?.sharedTags?.length ? `<p class="rh-estab-hint">${escapeHtml(match.sharedTags.slice(0, 2).join(' · '))}</p>` : ''}
        ${proposal ? `<div class="rh-reco-proposal">${renderStatusPill(proposal.status)}</div>` : ''}
        <div class="rh-reco-actions">
          <button type="button" class="btn btn-small" onclick="${ctaAction}">${ctaLabel}</button>
          <a href="${typeof profilePageUrl === 'function' ? profilePageUrl('estabelecimento', est.id) : `./perfil-page.html?id=${est.id}&type=establishment&tipo=estabelecimento`}" class="btn btn-outline btn-small" style="text-decoration:none;">Ver perfil</a>
        </div>
      </article>
    `;
  }

  function ensureModalShell() {
    if (document.getElementById('hiringProposalModal')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div id="hiringProposalModal" class="hiring-modal" style="display:none;" role="dialog" aria-modal="true" aria-labelledby="hiringModalTitle">
        <div class="hiring-modal-backdrop" onclick="HiringFlow.closeModal()"></div>
        <div class="hiring-modal-sheet glass-surface">
          <button type="button" class="hiring-modal-close" onclick="HiringFlow.closeModal()" aria-label="Fechar">✕</button>
          <h2 id="hiringModalTitle" class="hiring-modal-title">Propor contratação</h2>
          <p id="hiringModalSub" class="hiring-modal-sub"></p>
          <div id="hiringModalBody"></div>
        </div>
      </div>
    `);
  }

  let modalContext = null;

  function closeModal() {
    const el = document.getElementById('hiringProposalModal');
    if (el) el.style.display = 'none';
    document.body.style.overflow = '';
    modalContext = null;
  }

  function openProposalModal(professionalId, options) {
    const opts = options || {};
    const session = typeof getSession === 'function' ? getSession() : null;
    if (!session?.establishmentId) {
      showAlert?.('⚠️', 'Selecione o perfil de estabelecimento para contratar.');
      return;
    }
    ensureModalShell();
    modalContext = { professionalId, prof: opts.prof || null, establishment: opts.establishment || null };

    if (!modalContext.prof && global._hiringDrawerProf?.id === professionalId) {
      modalContext.prof = global._hiringDrawerProf;
    }
    if (!modalContext.establishment && global._hiringDrawerEst) {
      modalContext.establishment = global._hiringDrawerEst;
    }

    const loadProf = modalContext.prof
      ? Promise.resolve(modalContext.prof)
      : fetchAPI(`/rest/v1/professionals?id=eq.${professionalId}&select=id,name,specialty,salary_expectation,seeking_work,current_establishment_id,igv_score,client_portfolio_count,profile:professional_profiles(specialty)`)
        .then(d => d?.[0] || null);

    const loadEst = modalContext.establishment
      ? Promise.resolve(modalContext.establishment)
      : fetchAPI(`/rest/v1/establishments?id=eq.${session.establishmentId}&select=id,name,music_tags,infra_tags,positioning_tags,audience_tags,vibe_tags,style_tags,tags`)
        .then(d => d?.[0] || null);

    Promise.all([loadProf, loadEst]).then(([prof, est]) => {
      if (!prof) {
        showAlert?.('❌', 'Profissional não encontrado.');
        return;
      }
      modalContext.prof = prof;
      modalContext.establishment = est;

      const existing = getActiveProposal(session.establishmentId, professionalId);
      const enriched = typeof enrichProfForContratante === 'function' ? enrichProfForContratante(prof, est) : prof;
      const match = enriched._contratanteMatch;
      const roi = enriched._roiEstimado;

      document.getElementById('hiringModalTitle').textContent = existing
        ? `Proposta · ${prof.name}`
        : `Contratar ${prof.name}`;
      document.getElementById('hiringModalSub').innerHTML = match
        ? `Match <strong>${match.percent}%</strong>${roi ? ` · ROI estimado <strong>${roi.index}</strong>` : ''} com ${escapeHtml(est?.name || session.establishmentName || 'seu negócio')}`
        : `Envie uma proposta para ${escapeHtml(prof.name)}`;

      if (existing) {
        document.getElementById('hiringModalBody').innerHTML = `
          <div class="hiring-existing-block">
            ${renderStatusPill(existing.status)}
            <p><strong>Modelo:</strong> ${escapeHtml(COMP_MODELS.find(c => c.id === existing.compensationModel)?.label || existing.compensationModel)}</p>
            ${existing.offerText ? `<p><strong>Proposta:</strong> ${escapeHtml(existing.offerText)}</p>` : ''}
            ${existing.message ? `<p><strong>Mensagem:</strong> ${escapeHtml(existing.message)}</p>` : ''}
            <p class="text-glass-muted" style="font-size:12px;">Enviada em ${new Date(existing.createdAt).toLocaleDateString('pt-BR')}</p>
          </div>
          <div class="hiring-modal-actions">
            <button type="button" class="btn btn-outline" onclick="HiringFlow.closeModal()">Fechar</button>
            ${['proposed', 'negotiating'].includes(existing.status)
              ? `<button type="button" class="btn" onclick="HiringFlow.cancelProposal('${existing.id}', true)">Cancelar proposta</button>`
              : ''}
          </div>
        `;
      } else {
        if (prof.current_establishment_id === session.establishmentId) {
          document.getElementById('hiringModalBody').innerHTML = `
            <p>Este profissional já faz parte da sua equipe.</p>
            <div class="hiring-modal-actions"><button type="button" class="btn" onclick="HiringFlow.closeModal()">OK</button></div>
          `;
        } else if (prof.current_establishment_id && prof.seeking_work === false) {
          document.getElementById('hiringModalBody').innerHTML = `
            <p>Profissional vinculado a outro estabelecimento no momento. Você ainda pode enviar uma proposta de negociação.</p>
            ${buildProposalFormHtml(prof)}
          `;
        } else {
          document.getElementById('hiringModalBody').innerHTML = buildProposalFormHtml(prof);
        }
      }

      const modal = document.getElementById('hiringProposalModal');
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }).catch(e => {
      showAlert?.('❌', e.message || 'Erro ao abrir proposta.');
    });
  }

  function buildProposalFormHtml(prof) {
    const modelOpts = COMP_MODELS.map(c =>
      `<option value="${c.id}">${c.label}</option>`
    ).join('');
    const salaryHint = prof.salary_expectation
      ? `<p class="hiring-salary-hint">Pretensão do profissional: <strong>${escapeHtml(prof.salary_expectation)}</strong></p>`
      : '';

    return `
      ${salaryHint}
      <div class="hiring-form-grid">
        <label class="hiring-field">
          <span>Tipo de abordagem</span>
          <select id="hiringType">
            <option value="negotiate">🤝 Negociar contratação</option>
            <option value="direct">📨 Proposta direta</option>
          </select>
        </label>
        <label class="hiring-field">
          <span>Modelo de remuneração</span>
          <select id="hiringCompModel">${modelOpts}</select>
        </label>
        <label class="hiring-field hiring-field-wide">
          <span>Sua proposta (valor / % / condições)</span>
          <input type="text" id="hiringOffer" placeholder="Ex: 40% comissão + R$800 fixo" />
        </label>
        <label class="hiring-field hiring-field-wide">
          <span>Mensagem para o profissional</span>
          <textarea id="hiringMessage" rows="3" placeholder="Conte por que ele combina com seu negócio..."></textarea>
        </label>
        <label class="hiring-field">
          <span>Início desejado</span>
          <input type="date" id="hiringStartDate" />
        </label>
      </div>
      <div class="hiring-modal-actions">
        <button type="button" class="btn btn-outline" onclick="HiringFlow.closeModal()">Cancelar</button>
        <button type="button" class="btn btn-tinder-primary" onclick="HiringFlow.submitProposal()">📨 Enviar proposta</button>
      </div>
    `;
  }

  function submitProposal() {
    const session = typeof getSession === 'function' ? getSession() : null;
    if (!session?.establishmentId || !modalContext?.professionalId) return;

    const prof = modalContext.prof || {};
    const est = modalContext.establishment || {};
    const enriched = typeof enrichProfForContratante === 'function'
      ? enrichProfForContratante(prof, est)
      : prof;

    const result = createProposal({
      establishmentId: session.establishmentId,
      establishmentName: est.name || session.establishmentName || session.name,
      professionalId: modalContext.professionalId,
      professionalName: prof.name,
      type: document.getElementById('hiringType')?.value || 'negotiate',
      compensationModel: document.getElementById('hiringCompModel')?.value || 'a_combinar',
      offerText: document.getElementById('hiringOffer')?.value || '',
      message: document.getElementById('hiringMessage')?.value || '',
      startDate: document.getElementById('hiringStartDate')?.value || null,
      matchPercent: enriched._contratanteMatch?.percent ?? null,
      roiIndex: enriched._roiEstimado?.index ?? null
    });

    if (!result.ok) {
      showAlert?.('⚠️', result.error);
      if (result.proposal) openProposalModal(modalContext.professionalId, { prof, establishment: est });
      return;
    }

    closeModal();
    showAlert?.('✅ Proposta enviada!', `${prof.name} receberá sua proposta no dashboard profissional.`);
    if (typeof modalContext?.onSuccess === 'function') modalContext.onSuccess(result.proposal);
    document.dispatchEvent(new CustomEvent('proofly:hiring-updated', { detail: result.proposal }));
  }

  async function cancelProposal(id, closeAfter) {
    updateProposalStatus(id, 'withdrawn', 'Cancelada pelo estabelecimento', 'establishment');
    if (closeAfter) closeModal();
    showAlert?.('Proposta cancelada', '');
    document.dispatchEvent(new CustomEvent('proofly:hiring-updated'));
  }

  function cancelApplication(id, closeAfter) {
    updateProposalStatus(id, 'withdrawn', 'Candidatura cancelada pelo profissional', 'professional');
    if (closeAfter) closeModal();
    showAlert?.('Candidatura cancelada', '');
    document.dispatchEvent(new CustomEvent('proofly:hiring-updated'));
  }

  function buildApplicationFormHtml(est) {
    const modelOpts = COMP_MODELS.map(c =>
      `<option value="${c.id}">${c.label}</option>`
    ).join('');
    return `
      <div class="hiring-form-grid">
        <label class="hiring-field hiring-field-wide">
          <span>Por que você quer trabalhar aqui?</span>
          <textarea id="applyMessage" rows="3" placeholder="Conte seu fit com o estilo do estabelecimento..."></textarea>
        </label>
        <label class="hiring-field">
          <span>Pretensão / modelo desejado</span>
          <select id="applyCompModel">${modelOpts}</select>
        </label>
        <label class="hiring-field">
          <span>Sua proposta (opcional)</span>
          <input type="text" id="applyOffer" placeholder="Ex: 40% comissão" />
        </label>
        <label class="hiring-field">
          <span>Disponível a partir de</span>
          <input type="date" id="applyStartDate" />
        </label>
      </div>
      <div class="hiring-modal-actions">
        <button type="button" class="btn btn-outline" onclick="HiringFlow.closeModal()">Cancelar</button>
        <button type="button" class="btn btn-tinder-primary" onclick="HiringFlow.submitApplication()">💼 Enviar candidatura</button>
      </div>
    `;
  }

  function openApplyModal(establishmentId, options) {
    const opts = options || {};
    const session = typeof getSession === 'function' ? getSession() : null;
    if (!session?.professionalId) {
      showAlert?.('⚠️', 'Selecione o perfil de profissional para candidatar-se.');
      return;
    }
    ensureModalShell();
    modalContext = {
      establishmentId,
      professionalId: session.professionalId,
      establishment: opts.establishment || null,
      prof: opts.prof || global._hiringDrawerProf || null
    };

    const loadEst = modalContext.establishment
      ? Promise.resolve(modalContext.establishment)
      : fetchAPI(`/rest/v1/establishments?id=eq.${establishmentId}&select=id,name,type,city,neighborhood,avg_rating,total_reviews,music_tags,infra_tags,positioning_tags,audience_tags,vibe_tags,style_tags,tags`)
        .then(d => d?.[0] || null);

    const loadProf = modalContext.prof
      ? Promise.resolve(modalContext.prof)
      : fetchAPI(`/rest/v1/professionals?id=eq.${session.professionalId}&select=id,name,specialty,salary_expectation,seeking_work,current_establishment_id,igv_score,client_portfolio_count,avg_rating,music_tags,visual_tags,personality_tags,work_tags,style_tags,tags,profile:professional_profiles(specialty,years_experience)`)
        .then(d => d?.[0] || null);

    Promise.all([loadEst, loadProf]).then(([est, prof]) => {
      if (!est) {
        showAlert?.('❌', 'Estabelecimento não encontrado.');
        return;
      }
      modalContext.establishment = est;
      modalContext.prof = prof;

      const existing = getActiveProposal(establishmentId, session.professionalId);
      const enriched = typeof enrichProfForContratante === 'function' ? enrichProfForContratante(prof || {}, est) : {};
      const match = enriched._contratanteMatch;

      document.getElementById('hiringModalTitle').textContent = existing?.initiatedBy === 'professional'
        ? `Candidatura · ${est.name}`
        : existing
          ? `Proposta de ${est.name}`
          : `Pedir emprego em ${est.name}`;
      document.getElementById('hiringModalSub').innerHTML = match
        ? `Seu match com este local: <strong>${match.percent}%</strong>${match.headline ? ` · ${escapeHtml(match.headline)}` : ''}`
        : `Envie sua candidatura para ${escapeHtml(est.name)}`;

      if (prof?.current_establishment_id === establishmentId) {
        document.getElementById('hiringModalBody').innerHTML = `
          <p>Você já faz parte da equipe de <strong>${escapeHtml(est.name)}</strong>.</p>
          <div class="hiring-modal-actions"><button type="button" class="btn" onclick="HiringFlow.closeModal()">OK</button></div>
        `;
      } else if (existing?.initiatedBy === 'establishment') {
        document.getElementById('hiringModalBody').innerHTML = `
          <div class="hiring-existing-block">
            ${renderStatusPill(existing.status)}
            <p>Este estabelecimento já enviou uma proposta para você.</p>
            ${existing.message ? `<p><strong>Mensagem:</strong> ${escapeHtml(existing.message)}</p>` : ''}
            ${existing.offerText ? `<p><strong>Condições:</strong> ${escapeHtml(existing.offerText)}</p>` : ''}
          </div>
          <div class="hiring-modal-actions">
            <button type="button" class="btn btn-outline" onclick="HiringFlow.closeModal()">Fechar</button>
            ${existing.status === 'proposed' ? `<button type="button" class="btn" onclick="HiringFlow.respondProposal('${existing.id}','accepted');HiringFlow.closeModal();">✅ Aceitar</button>` : ''}
          </div>
        `;
      } else if (existing?.initiatedBy === 'professional') {
        document.getElementById('hiringModalBody').innerHTML = `
          <div class="hiring-existing-block">
            ${renderStatusPill(existing.status)}
            ${existing.message ? `<p><strong>Sua mensagem:</strong> ${escapeHtml(existing.message)}</p>` : ''}
            ${existing.offerText ? `<p><strong>Sua proposta:</strong> ${escapeHtml(existing.offerText)}</p>` : ''}
            <p class="text-glass-muted" style="font-size:12px;">Enviada em ${new Date(existing.createdAt).toLocaleDateString('pt-BR')}</p>
          </div>
          <div class="hiring-modal-actions">
            <button type="button" class="btn btn-outline" onclick="HiringFlow.closeModal()">Fechar</button>
            ${['proposed', 'negotiating'].includes(existing.status)
              ? `<button type="button" class="btn" onclick="HiringFlow.cancelApplication('${existing.id}', true)">Cancelar candidatura</button>`
              : ''}
          </div>
        `;
      } else if (prof?.current_establishment_id && prof.seeking_work === false) {
        document.getElementById('hiringModalBody').innerHTML = `
          <p>Você está vinculado a outro estabelecimento. Marque-se como <strong>aberto a oportunidades</strong> no perfil para candidatar-se.</p>
          <div class="hiring-modal-actions"><button type="button" class="btn" onclick="HiringFlow.closeModal()">OK</button></div>
        `;
      } else {
        document.getElementById('hiringModalBody').innerHTML = buildApplicationFormHtml(est);
      }

      document.getElementById('hiringProposalModal').style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }).catch(e => showAlert?.('❌', e.message || 'Erro ao abrir candidatura.'));
  }

  function submitApplication() {
    const session = typeof getSession === 'function' ? getSession() : null;
    if (!session?.professionalId || !modalContext?.establishmentId) return;

    const est = modalContext.establishment || {};
    const prof = modalContext.prof || {};
    const enriched = typeof enrichProfForContratante === 'function'
      ? enrichProfForContratante(prof, est)
      : prof;

    const result = createApplication({
      establishmentId: modalContext.establishmentId,
      establishmentName: est.name || 'Estabelecimento',
      professionalId: session.professionalId,
      professionalName: prof.name || session.name || 'Profissional',
      compensationModel: document.getElementById('applyCompModel')?.value || 'a_combinar',
      offerText: document.getElementById('applyOffer')?.value || '',
      message: document.getElementById('applyMessage')?.value || '',
      startDate: document.getElementById('applyStartDate')?.value || null,
      matchPercent: enriched._contratanteMatch?.percent ?? null,
      roiIndex: enriched._roiEstimado?.index ?? null
    });

    if (!result.ok) {
      showAlert?.('⚠️', result.error);
      if (result.proposal) openApplyModal(modalContext.establishmentId, { prof, establishment: est });
      return;
    }

    closeModal();
    showAlert?.('✅ Candidatura enviada!', `${est.name} receberá seu interesse no dashboard do estabelecimento.`);
    document.dispatchEvent(new CustomEvent('proofly:hiring-updated', { detail: result.proposal }));
  }

  async function respondAsEstablishment(id, status) {
    const p = getProposalById(id);
    if (!p) return;

    if (status === 'negotiating') {
      const counter = prompt('Sua contraproposta ou mensagem ao profissional (opcional):', '') || '';
      appendHistory(p, { by: 'establishment', action: 'negotiating', status: 'negotiating', note: counter });
      showAlert?.('💬 Negociação', 'O profissional será notificado.');
      document.dispatchEvent(new CustomEvent('proofly:hiring-updated'));
      return;
    }

    if (status === 'declined') {
      const reason = prompt('Motivo (opcional):', '') || '';
      updateProposalStatus(id, 'declined', reason, 'establishment');
      showAlert?.('Candidatura recusada', '');
      document.dispatchEvent(new CustomEvent('proofly:hiring-updated'));
      return;
    }

    if (status === 'accepted') {
      const updated = updateProposalStatus(id, 'accepted', 'Aceita pelo estabelecimento', 'establishment');
      const hire = await finalizeHire(updated);
      showAlert?.('🎉 Contratado!', hire.warning
        ? 'Vínculo salvo localmente — confira no servidor.'
        : `${p.professionalName} entrou na sua equipe!`);
      document.dispatchEvent(new CustomEvent('proofly:hiring-updated'));
    }
  }

  async function respondProposal(id, status) {
    const p = getProposalById(id);
    if (!p) return;

    if (status === 'negotiating') {
      const counter = prompt('Sua contraproposta ou dúvida (opcional):', '') || '';
      appendHistory(p, { by: 'professional', action: 'negotiating', status: 'negotiating', note: counter });
      showAlert?.('💬 Negociação', 'O estabelecimento será notificado.');
      document.dispatchEvent(new CustomEvent('proofly:hiring-updated'));
      return;
    }

    if (status === 'declined') {
      const reason = prompt('Motivo (opcional):', '') || '';
      updateProposalStatus(id, 'declined', reason, 'professional');
      showAlert?.('Proposta recusada', '');
      document.dispatchEvent(new CustomEvent('proofly:hiring-updated'));
      return;
    }

    if (status === 'accepted') {
      const updated = updateProposalStatus(id, 'accepted', 'Aceita pelo profissional', 'professional');
      const hire = await finalizeHire(updated);
      showAlert?.('🎉 Parabéns!', hire.warning
        ? 'Proposta aceita. Vínculo salvo localmente — confira no servidor.'
        : `${p.establishmentName} e você estão conectados!`);
      document.dispatchEvent(new CustomEvent('proofly:hiring-updated'));
      return;
    }
  }

  function renderDrawerHiringActions(professionalId, prof, establishment) {
    const session = typeof getSession === 'function' ? getSession() : null;
    if (!session?.establishmentId) return '';
    const existing = getActiveProposal(session.establishmentId, professionalId);
    const label = existing ? '📋 Ver proposta' : '🤝 Propor contratação';
    return `
      <button type="button" class="btn btn-tinder-primary btn-tinder-xl" onclick="HiringFlow.openProposalModal('${professionalId}')">${label}</button>
    `;
  }

  function injectHiringStyles() {
    if (document.getElementById('hiring-flow-styles')) return;
    const style = document.createElement('style');
    style.id = 'hiring-flow-styles';
    style.textContent = `
      /* Modal shell: overlay-system.css */
      .hiring-salary-hint { font-size:13px; color:#c4b5fd; margin:0 0 12px; }
      .hiring-status-pill { display:inline-flex; align-items:center; gap:6px; font-size:11px; font-weight:700; padding:5px 12px; border-radius:999px; background:color-mix(in srgb, var(--hiring-color) 18%, transparent); color:var(--hiring-color); border:1px solid color-mix(in srgb, var(--hiring-color) 35%, transparent); }
      .hiring-proposal-row { display:flex; flex-wrap:wrap; gap:12px; justify-content:space-between; align-items:flex-start; padding:14px 16px; border-radius:14px; background:#f8fafc; border:1px solid #e2e8f0; margin-bottom:10px; }
      .hiring-proposal-title { font-weight:700; color:#0f172a; }
      .hiring-proposal-sub { font-size:13px; color:#64748b; margin-top:2px; }
      .hiring-proposal-match { font-size:12px; color:#6366f1; margin-top:4px; }
      .hiring-proposal-actions { display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; }
      .hiring-kind-pill { font-size:10px; font-weight:700; padding:2px 8px; border-radius:999px; vertical-align:middle; margin-left:6px; }
      .hiring-kind-application { background:#ecfdf5; color:#059669; border:1px solid #a7f3d0; }
      .hiring-kind-offer { background:#eef2ff; color:#4f46e5; border:1px solid #c7d2fe; }
      .rh-estab-hint { font-size:12px; color:#64748b; margin:0 0 8px; min-height:18px; }
      .career-hub-banner { background:linear-gradient(135deg,#ecfdf5,#eef2ff) !important; border-color:#a7f3d0 !important; }
      .career-hub-banner h3 { color:#065f46 !important; }
      .rh-hub-banner { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:12px; padding:18px 20px; border-radius:18px; background:linear-gradient(135deg,#eef2ff,#ecfdf5); border:1px solid #c7d2fe; margin-bottom:20px; }
      .rh-hub-banner h3 { margin:0; font-size:17px; color:#312e81; }
      .rh-hub-banner p { margin:4px 0 0; font-size:13px; color:#64748b; }
      .rh-team-grid, .rh-reco-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:12px; }
      .rh-team-card, .rh-reco-card { padding:14px 16px; border-radius:16px; background:#fff; border:1px solid #e2e8f0; box-shadow:0 2px 8px rgba(0,0,0,0.04); }
      .rh-team-card.perf-high { border-left:4px solid #10b981; }
      .rh-team-card.perf-mid { border-left:4px solid #f59e0b; }
      .rh-team-card.perf-low { border-left:4px solid #ef4444; }
      .rh-team-card-head { display:flex; gap:12px; align-items:center; }
      .rh-team-avatar { width:44px; height:44px; border-radius:50%; overflow:hidden; background:linear-gradient(135deg,#6366f1,#8b5cf6); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; flex-shrink:0; }
      .rh-team-avatar img { width:100%; height:100%; object-fit:cover; }
      .rh-team-name { font-weight:700; color:#0f172a; }
      .rh-team-spec { font-size:12px; color:#64748b; }
      .rh-perf-pill { display:inline-block; font-size:10px; font-weight:700; margin-top:4px; color:#475569; }
      .rh-team-stats { display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin:10px 0; font-size:13px; color:#64748b; }
      .rh-team-review { font-size:12px; color:#475569; font-style:italic; margin:0 0 10px; min-height:32px; }
      .rh-team-review-empty { color:#94a3b8; font-style:normal; }
      .rh-team-actions, .rh-reco-actions { display:flex; flex-wrap:wrap; gap:8px; }
      .rh-reco-name { font-weight:700; color:#0f172a; }
      .rh-reco-spec { font-size:12px; color:#64748b; }
      .rh-reco-badges { display:flex; flex-wrap:wrap; gap:6px; margin:10px 0; }
      .rh-reco-proposal { margin-bottom:8px; }
      @media (max-width:520px) { .hiring-form-grid { grid-template-columns:1fr; } }
    `;
    document.head.appendChild(style);
  }

  injectHiringStyles();

  const HiringFlow = {
    openProposalModal,
    openApplyModal,
    closeModal,
    submitProposal,
    submitApplication,
    cancelProposal,
    cancelApplication,
    respondProposal,
    respondAsEstablishment,
    renderDrawerHiringActions,
    renderTeamCard,
    renderRecoHireCard,
    renderEstabOpportunityCard,
    renderProposalRow,
    createApplication,
    getProposalsForEstablishment,
    getProposalsForProfessional,
    getActiveProposal,
    isViewerContratante,
    finalizeHire,
    COMP_MODELS,
    HIRING_STATUS
  };

  global.HiringFlow = HiringFlow;
  global.HiringService = HiringFlow;
})(window);