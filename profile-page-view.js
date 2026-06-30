// =====================================================
// PROOFLY — Perfil em página dedicada (menor RAM que drawer persistente)
// =====================================================

(function(global) {
  'use strict';

  let drawerTipo = null;
  let drawerId = null;
  let avaliacaoProfId = null;
  let avaliacaoRating = 0;
  let avaliacaoEstabId = null;
  let avaliacaoEstabRating = 0;
  let currentPageEstReviews = 0;
  const EST_REVIEWS_PER_PAGE = 10;

  const els = {
    content: null,
    actions: null
  };

  function getMatchTagsProf() {
    return typeof getEffectiveClientTags === 'function'
      ? getEffectiveClientTags('prof', [])
      : (typeof getStoredClientPrefs === 'function' ? getStoredClientPrefs().profTags || [] : []);
  }

  function getMatchTagsEst() {
    return typeof getEffectiveClientTags === 'function'
      ? getEffectiveClientTags('est', [])
      : (typeof getStoredClientPrefs === 'function' ? getStoredClientPrefs().estTags || [] : []);
  }

  function getUserPrefsProf() {
    return typeof buildUserPrefsFromTags === 'function'
      ? buildUserPrefsFromTags(getMatchTagsProf(), 'prof')
      : { music: [], visual: [], personality: [], lifestyle: [], work: [], location: null, price: null };
  }

  function getUserPrefsEst() {
    return typeof buildUserPrefsFromTags === 'function'
      ? buildUserPrefsFromTags(getMatchTagsEst(), 'est')
      : { infra: [], music: [], positioning: [], audience: [], vibe: [] };
  }

  function computeDrawerMatchPercent(item, isProf) {
    if (item._matchPercent != null) return item._matchPercent;
    if (typeof calcularMatchScore !== 'function' || typeof calcularMatchScoreEst !== 'function') return null;
    const prefs = isProf ? getUserPrefsProf() : getUserPrefsEst();
    const score = isProf ? calcularMatchScore(prefs, item) : calcularMatchScoreEst(prefs, item);
    return Math.min(100, Math.round(score));
  }

  function setPageActions(html) {
    if (!els.actions) return;
    const content = html || '';
    els.actions.innerHTML = content;
    if (content.trim()) {
      els.actions.hidden = false;
      els.actions.removeAttribute('aria-hidden');
    } else {
      els.actions.hidden = true;
      els.actions.setAttribute('aria-hidden', 'true');
    }
  }

  function isSharkPublicProfile() {
    return typeof isSharkMode === 'function'
      ? isSharkMode()
      : (typeof SHARK_MODE !== 'undefined' && !!SHARK_MODE);
  }

  function renderQrTrustNote(entity) {
    const label = entity === 'estabelecimento' ? 'estabelecimento' : 'profissional';
    return `Avaliações reais de quem foi atendido. Escaneie o QR Code do ${label} no local.`;
  }

  function resolveContactHref(entity, phone) {
    const raw = phone || entity?.phone || entity?.profile?.whatsapp || entity?.profile?.phone || entity?.whatsapp;
    if (!raw) return null;
    if (typeof global.RankingProProfile?.whatsappUrl === 'function') {
      return global.RankingProProfile.whatsappUrl(raw);
    }
    const digits = String(raw).replace(/\D/g, '');
    return digits ? `https://wa.me/${digits}` : null;
  }

  async function shareProfile() {
    const url = window.location.href;
    const title = document.title || 'Ranking Pro';
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return;
      }
    }
    await copyShareLink(url);
  }

  function tagCategoriesForDrawer(categories, sharedTags) {
    const withTags = (categories || []).filter(c => c.tags?.length);
    if (!withTags.length) {
      return '<div class="tinder-section"><div class="tinder-section-title">Estilo</div><p class="text-glass-muted" style="font-size:14px;">Nenhuma tag cadastrada ainda.</p></div>';
    }
    return ProfileCard.renderTagCategories(withTags, sharedTags);
  }

  function profilePageUrl(tipo, id) {
    return `./perfil-page.html?tipo=${encodeURIComponent(tipo)}&id=${encodeURIComponent(id)}`;
  }

  function isViewerContratante() {
    const sess = typeof getSession === 'function' ? getSession() : null;
    return !!(sess && (sess.role === 'estabelecimento' || sess.provider === 'dev-simulation') && sess.establishmentId);
  }

  async function loadViewerEstablishment() {
    const sess = typeof getSession === 'function' ? getSession() : null;
    if (!sess?.establishmentId) return null;
    try {
      const data = await fetchAPI(
        `/rest/v1/establishments?id=eq.${sess.establishmentId}&select=id,name,city,music_tags,infra_tags,positioning_tags,audience_tags,vibe_tags,style_tags,tags`
      );
      return data?.[0] || null;
    } catch {
      return null;
    }
  }

  global.navigateToProfile = function(tipo, id) {
    if (typeof global.RankingProRouter?.openProfile === 'function') {
      global.RankingProRouter.openProfile(tipo, id, { forcePage: true });
      return;
    }
    if (typeof global.navigateWithTransition === 'function') {
      global.navigateWithTransition(profilePageUrl(tipo, id));
      return;
    }
    global.location.href = profilePageUrl(tipo, id);
  };

  async function loadProfessionalProfile(id) {
    avaliacaoProfId = id;
    drawerTipo = 'profissional';
    drawerId = id;
    els.content.innerHTML = '<div class="loading" style="padding:48px 24px;text-align:center;">Carregando perfil...</div>';
    setPageActions('');

    try {
      const profData = await fetchAPI(
        `/rest/v1/professionals?id=eq.${id}&select=*,current_establishment:establishments!professionals_current_establishment_id_fkey(id,name),profile:professional_profiles(*),music_tags,visual_tags,personality_tags,lifestyle_tags,work_tags,work_style_tags,price_range,previous_workplaces,gallery_urls,available_now,seeking_work,salary_expectation,average_job_duration_months,client_portfolio_count,igv_score,availability`
      );
      if (!profData.length) {
        els.content.innerHTML = '<p style="color:red;">Profissional não encontrado.</p>';
        return;
      }
      let prof = profData[0];
      let hiringPrivate = null;
      try {
        const priv = await fetchAPI(`/rest/v1/professional_private_data?professional_id=eq.${id}&select=birth_date`);
        if (priv?.[0]) hiringPrivate = priv[0];
      } catch { /* noop */ }
      const viewerEst = isViewerContratante() ? await loadViewerEstablishment() : null;
      let matchInsight;
      if (viewerEst && typeof enrichProfForContratante === 'function') {
        const enriched = enrichProfForContratante(prof, viewerEst);
        const cm = enriched._contratanteMatch;
        matchInsight = cm ? {
          percent: cm.percent,
          headline: cm.headline || '',
          subline: (cm.sharedTags || []).slice(0, 2).join(' · '),
          sharedTags: cm.sharedTags || [],
          tier: cm.tier === 'high' ? 'hot' : cm.tier === 'mid' ? 'warm' : 'cool'
        } : { percent: 0, sharedTags: [], headline: '', subline: '', tier: 'cool' };
        prof = enriched;
      } else {
        matchInsight = typeof buildMatchInsight === 'function'
          ? buildMatchInsight(prof, 'prof', getMatchTagsProf())
          : { percent: computeDrawerMatchPercent(prof, true), sharedTags: [], headline: '', subline: '', tier: 'cool' };
      }

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
      if (prof.current_establishment?.name) {
        const estId = prof.current_establishment.id;
        heroLines.push(`📍 <span class="estab-link" style="cursor:pointer;" onclick="navigateToProfile('estabelecimento','${estId}')">${escapeHtml(prof.current_establishment.name)}</span>`);
      } else {
        heroLines.push('📍 Autônomo');
      }
      if (prof.profile?.years_experience) heroLines.push(`⏳ ${prof.profile.years_experience} anos de experiência`);
      if (prof.price_range) heroLines.push(`💰 ${escapeHtml(prof.price_range)}`);
      if (prof.profile?.instagram) {
        const ig = prof.profile.instagram.replace('@', '');
        heroLines.push(`📷 <a href="https://instagram.com/${ig}" target="_blank" rel="noopener" style="color:#f9a8d4;">@${escapeHtml(ig)}</a>`);
      }

      const sharkOn = typeof isSharkMode === 'function' ? isSharkMode() : (typeof SHARK_MODE !== 'undefined' && !!SHARK_MODE);
      const verifiedReviews = clientReviewsAll.filter(r =>
        typeof isReviewVerified === 'function' ? isReviewVerified(r) : r.verified
      );
      const hasVerified = verifiedReviews.length > 0;
      const reviewsForList = hasVerified ? verifiedReviews : clientReviewsAll;

      const html = ProfilePremium.renderProfessional({
        prof,
        avgRating,
        totalReviews,
        prooflyScore: prooflyData.score,
        clientReviews: reviewsForList,
        hasVerified,
        menuHref: typeof defaultSearchPageUrl === 'function' ? defaultSearchPageUrl() : './cliente.html',
        sharkOn
      });

      els.content.innerHTML = html;
      ProfilePremium.mountQr(els.content);
      ProfilePremium.hideLoadingOverlay();
      setPageActions('');
      document.title = `${prof.name} — Ranking Pro`;
    } catch (e) {
      ProfilePremium?.hideLoadingOverlay?.();
      els.content.innerHTML = `<p class="pp-empty">Erro: ${escapeHtml(e.message)}</p>`;
      console.error(e);
    }
  }

  async function loadEstablishmentProfile(id) {
    drawerTipo = 'estabelecimento';
    drawerId = id;
    els.content.innerHTML = '<div class="loading" style="padding:48px 24px;text-align:center;">Carregando perfil...</div>';
    setPageActions('');

    try {
      const data = await fetchAPI(
        `/rest/v1/establishments?id=eq.${id}&select=*,infra_tags,music_tags,positioning_tags,audience_tags,vibe_tags,target_audience,gallery_urls`
      );
      if (!data.length) {
        els.content.innerHTML = '<p style="color:red;">Estabelecimento não encontrado.</p>';
        return;
      }
      const e = data[0];
      const matchInsight = typeof buildMatchInsight === 'function'
        ? buildMatchInsight(e, 'est', getMatchTagsEst())
        : { percent: computeDrawerMatchPercent(e, false), sharedTags: [], headline: '', subline: '', tier: 'cool' };

      const allReviewsRaw = typeof fetchReviews === 'function'
        ? await fetchReviews(`establishment_id=eq.${id}`, { viewContext: { entityType: 'est', establishmentId: id, targetEstName: e.name } })
        : await fetchAPI(`/rest/v1/reviews?establishment_id=eq.${id}&select=rating,comment,created_at,verified,review_type,source&order=created_at.desc`);
      const prooflyData = typeof calcularProoflyScoreFromReviews === 'function'
        ? calcularProoflyScoreFromReviews(allReviewsRaw, id, 'est')
        : { score: calcularProoflyScoreRapido?.(e, 'est'), groups: {}, clientStats: {}, estabStats: {}, social: getMockSocialSignals?.(id, 'est') };
      let allReviews = typeof filterReviewsByType === 'function'
        ? filterReviewsByType(allReviewsRaw, REVIEW_TYPES.CLIENT_TO_EST)
        : allReviewsRaw.filter(r => r.review_type === 'client_to_establishment' || !r.review_type);
      if (!allReviews.length) allReviews = allReviewsRaw.filter(r => !r.professional_id);

      const ratingStats = prooflyData.clientStats?.total ? prooflyData.clientStats : computeRatingStats(allReviews);
      const avgRating = ratingStats.total ? ratingStats.avg : (e.avg_rating || 0);
      const totalReviews = ratingStats.total || e.total_reviews || 0;
      const badges = typeof getProoflyBadges === 'function'
        ? getProoflyBadges(e, prooflyData.score, { clientTotal: ratingStats.total })
        : [];
      const strengths = typeof buildStrengthPoints === 'function'
        ? buildStrengthPoints(e, 'est', prooflyData.score, prooflyData.groups)
        : [];

      let teamMembers = [];
      try {
        teamMembers = await fetchAPI(
          `/rest/v1/professionals?current_establishment_id=eq.${id}&select=id,name,avatar_url,avg_rating,total_reviews,profile:professional_profiles(specialty)&order=avg_rating.desc`
        );
      } catch { teamMembers = []; }

      const teamReviews = allReviewsRaw.filter(r => r.professional_id);
      let teamStats = typeof computeRatingStats === 'function'
        ? computeRatingStats(teamReviews)
        : { avg: 0, total: 0 };
      if (!teamStats.total && teamMembers.length) {
        let weightedSum = 0;
        let weightTotal = 0;
        teamMembers.forEach(p => {
          const tr = Number(p.total_reviews) || 0;
          const ar = Number(p.avg_rating) || 0;
          if (tr > 0) {
            weightedSum += ar * tr;
            weightTotal += tr;
          }
        });
        teamStats = {
          avg: weightTotal ? weightedSum / weightTotal : 0,
          total: weightTotal
        };
      }

      const verifiedCount = allReviews.filter(r =>
        typeof isReviewVerified === 'function' ? isReviewVerified(r) : r.verified
      ).length;
      const verifiedPct = allReviews.length
        ? Math.round((verifiedCount / allReviews.length) * 100)
        : 0;

      const reviewOffset = currentPageEstReviews * EST_REVIEWS_PER_PAGE;
      const reviewsPage = allReviews.slice(reviewOffset, reviewOffset + EST_REVIEWS_PER_PAGE);
      const endereco = e.address || [e.street, e.number, e.neighborhood, e.city, e.state, e.country].filter(Boolean).join(', ');
      const mapsUrl = endereco
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`
        : null;

      const sharkEst = isSharkPublicProfile();
      let paginationHtml = '';
      if (totalReviews > EST_REVIEWS_PER_PAGE) {
        const totalPages = Math.ceil(totalReviews / EST_REVIEWS_PER_PAGE);
        paginationHtml = '<div class="pp-pagination">';
        if (currentPageEstReviews > 0) {
          paginationHtml += `<button type="button" onclick="ProfilePageView.irPaginaEstReviews(${currentPageEstReviews - 1})">← Anterior</button>`;
        }
        paginationHtml += `<span style="font-size:13px;color:var(--text-muted);padding:0 8px;">${currentPageEstReviews + 1} / ${totalPages}</span>`;
        if (currentPageEstReviews < totalPages - 1) {
          paginationHtml += `<button type="button" onclick="ProfilePageView.irPaginaEstReviews(${currentPageEstReviews + 1})">Próxima →</button>`;
        }
        paginationHtml += '</div>';
      }

      const html = ProfilePremium.renderEstablishment({
        estab: e,
        avgRating,
        totalReviews,
        prooflyScore: prooflyData.score,
        teamMembers,
        teamStats,
        reviews: reviewsPage,
        verifiedPct,
        paginationHtml,
        menuHref: typeof defaultSearchPageUrl === 'function' ? defaultSearchPageUrl() : './cliente.html',
        sharkOn: sharkEst,
        address: endereco,
        mapsUrl
      });

      els.content.innerHTML = html;
      ProfilePremium.mountQr(els.content);
      ProfilePremium.hideLoadingOverlay();
      setPageActions('');
      document.title = `${e.name} — Ranking Pro`;
    } catch (err) {
      ProfilePremium?.hideLoadingOverlay?.();
      els.content.innerHTML = `<p class="pp-empty">Erro: ${escapeHtml(err.message)}</p>`;
      console.error(err);
    }
  }

  function abrirAvaliacaoProf(id) {
    const session = getSession();
    if (!session?.userId) {
      localStorage.setItem('avaliarProfId', id);
      global.location.href = `login.html?intent=cliente&returnTo=${encodeURIComponent(`perfil-page.html?tipo=profissional&id=${id}`)}`;
      return;
    }
    document.getElementById('avaliarDrawerForm')?.remove();
    avaliacaoProfId = id;
    avaliacaoRating = 0;
    els.content.insertAdjacentHTML('beforeend', `
      <div id="avaliarDrawerForm" class="perfil-avaliar-form">
        <h4>⭐ Avaliar profissional</h4>
        <div class="stars-input" id="starsInputDrawer">
          ${[1,2,3,4,5].map(n => `<span class="star-input" data-value="${n}" onclick="ProfilePageView.setRatingProf(${n})">☆</span>`).join('')}
        </div>
        <textarea id="avaliarCommentDrawer" placeholder="Deixe seu comentário..."></textarea>
        <button class="btn btn-green btn-full" onclick="ProfilePageView.confirmarAvaliacaoProf()">✅ Enviar avaliação</button>
      </div>
    `);
    document.getElementById('avaliarDrawerForm')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function abrirAvaliacaoEst(id) {
    const session = getSession();
    if (!session?.userId) {
      global.location.href = `login.html?intent=cliente&returnTo=${encodeURIComponent(`perfil-page.html?tipo=estabelecimento&id=${id}`)}`;
      return;
    }
    document.getElementById('avaliarEstabDrawerForm')?.remove();
    avaliacaoEstabId = id;
    avaliacaoEstabRating = 0;
    els.content.insertAdjacentHTML('beforeend', `
      <div id="avaliarEstabDrawerForm" class="perfil-avaliar-form">
        <h4>⭐ Avaliar estabelecimento</h4>
        <div class="stars-input" id="starsInputEstabDrawer">
          ${[1,2,3,4,5].map(n => `<span class="star-input" data-value="${n}" onclick="ProfilePageView.setRatingEst(${n})">☆</span>`).join('')}
        </div>
        <textarea id="avaliarEstabCommentDrawer" placeholder="Deixe seu comentário sobre o estabelecimento..."></textarea>
        <button class="btn btn-green btn-full" onclick="ProfilePageView.confirmarAvaliacaoEst()">✅ Enviar avaliação</button>
      </div>
    `);
    document.getElementById('avaliarEstabDrawerForm')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function confirmarAvaliacaoProf() {
    if (!avaliacaoProfId || !avaliacaoRating) {
      await showAlert('⚠️ Atenção', 'Selecione uma nota antes de avaliar.');
      return;
    }
    const ok = await showConfirm({
      title: '⭐ Confirmar avaliação',
      message: `Avaliar com ${avaliacaoRating} estrela${avaliacaoRating > 1 ? 's' : ''}?`,
      confirmText: 'Sim, avaliar',
      cancelText: 'Cancelar',
      danger: false
    });
    if (!ok) return;
    const comment = document.getElementById('avaliarCommentDrawer')?.value.trim() || '';
    await submitReview({ rating: avaliacaoRating, comment, professionalId: avaliacaoProfId });
    await showAlert('✅ Sucesso!', 'Avaliação registrada!');
    document.getElementById('avaliarDrawerForm')?.remove();
    loadProfessionalProfile(avaliacaoProfId);
  }

  async function confirmarAvaliacaoEst() {
    if (!avaliacaoEstabId || !avaliacaoEstabRating) {
      await showAlert('⚠️ Atenção', 'Selecione uma nota antes de avaliar.');
      return;
    }
    const ok = await showConfirm({
      title: '⭐ Confirmar avaliação',
      message: `Avaliar com ${avaliacaoEstabRating} estrela${avaliacaoEstabRating > 1 ? 's' : ''}?`,
      confirmText: 'Sim, avaliar',
      cancelText: 'Cancelar',
      danger: false
    });
    if (!ok) return;
    const comment = document.getElementById('avaliarEstabCommentDrawer')?.value.trim() || '';
    await submitReview({ rating: avaliacaoEstabRating, comment, establishmentId: avaliacaoEstabId });
    await showAlert('✅ Sucesso!', 'Avaliação registrada!');
    document.getElementById('avaliarEstabDrawerForm')?.remove();
    loadEstablishmentProfile(avaliacaoEstabId);
  }

  async function copyShareLink(urlOverride) {
    const input = document.getElementById('profShareUrlInput');
    const url = urlOverride || input?.value || window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      if (typeof showAlert === 'function') await showAlert('✅ Copiado!', 'Link da página de reputação copiado.');
    } catch {
      if (typeof showAlert === 'function') await showAlert('❌ Erro', 'Não foi possível copiar o link.');
    }
  }

  global.ProfilePageView = {
    copyShareLink,
    shareProfile,
    init(contentId, actionsId) {
      els.content = document.getElementById(contentId);
      els.actions = document.getElementById(actionsId);
      global.scrollDrawerToReviews = function() {
        document.getElementById('drawer-reviews-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
    },
    async loadFromUrl() {
      const params = new URLSearchParams(global.location.search);
      let tipo = params.get('tipo');
      let id = params.get('id');
      if (!id && params.get('professionalId')) {
        tipo = 'profissional';
        id = params.get('professionalId');
      } else if (!id && params.get('establishmentId')) {
        tipo = 'estabelecimento';
        id = params.get('establishmentId');
      }
      if (!tipo || !id) {
        const back = typeof defaultSearchPageUrl === 'function' ? defaultSearchPageUrl() : './cliente.html';
        els.content.innerHTML = `<p class="empty-msg">Perfil não informado. <a href="${back}">Voltar à busca</a></p>`;
        return;
      }
      if (typeof incrementProfileView === 'function') {
        incrementProfileView(id, tipo === 'profissional' ? 'prof' : 'est');
      }
      if (tipo === 'profissional') {
        await loadProfessionalProfile(id);
        if (params.get('avaliar') === '1') {
          setTimeout(() => abrirAvaliacaoProf(id), 500);
        }
      } else {
        await loadEstablishmentProfile(id);
      }
    },
    abrirAvaliacaoProf,
    abrirAvaliacaoEst,
    setRatingProf(v) {
      avaliacaoRating = v;
      document.querySelectorAll('#starsInputDrawer .star-input').forEach((el, i) => {
        el.textContent = i < v ? '★' : '☆';
        el.classList.toggle('active', i < v);
      });
    },
    setRatingEst(v) {
      avaliacaoEstabRating = v;
      document.querySelectorAll('#starsInputEstabDrawer .star-input').forEach((el, i) => {
        el.textContent = i < v ? '★' : '☆';
        el.classList.toggle('active', i < v);
      });
    },
    confirmarAvaliacaoProf,
    confirmarAvaliacaoEst,
    irPaginaEstReviews(page) {
      currentPageEstReviews = page;
      if (drawerTipo === 'estabelecimento' && drawerId) loadEstablishmentProfile(drawerId);
    }
  };
})(window);