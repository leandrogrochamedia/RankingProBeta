// Ranking Pro — Dashboard screen (extraído de dashboard-estabelecimento.html)
function bootDashboardEstabelecimento() {
    // ============================================================
    // DASHBOARD ESTABELECIMENTO – COMPLETO
    // ============================================================

    if (typeof enforceProfileGuard === 'function' && !enforceProfileGuard('establishment')) return;
    const session = getSession();
    if (!session?.userId) {
      window.location.href = './login.html?returnTo=dashboard-estabelecimento.html';
      return;
    }
    if (!session.establishmentId) {
      window.location.href = './selecionar-estabelecimento.html';
      return;
    }

    let estId = session.establishmentId;
    let isEditMode = false;
    let currentEst = null;
    let newAvatarBase64 = null;
    let editGalleryPhotos = [];

    // ===== OPÇÕES PARA CADA CATEGORIA =====
    const infraOptions = ['Wi-Fi', 'Café', 'Bar', 'Ar Condicionado', 'Estacionamento', 'Pet Friendly', 'Acessibilidade', 'TV'];
    const musicOptions = ['Hip Hop', 'Rock', 'Sertanejo', 'Pop', 'Clássico', 'MPB', 'Eletrônico', 'Reggae', 'Jazz', 'Blues'];
    const positioningOptions = ['Premium', 'Popular', 'Tradicional', 'Moderno', 'Luxo', 'Despojado'];
    const audienceOptions = ['Família', 'Adulto', 'LGBTQIA+', 'Empresarial', 'Infantil', 'Terceira idade', 'Todos'];
    const vibeOptions = ['Descontraído', 'Sério', 'Animado', 'Calmo', 'Intimista', 'Grande', 'Acolhedor'];

    // ===== VIEW REFS =====
    const view = {
      name: document.getElementById('viewName'),
      type: document.getElementById('viewType'),
      description: document.getElementById('viewDescription'),
      address: document.getElementById('viewAddress'),
      phone: document.getElementById('viewPhone'),
      instagram: document.getElementById('viewInstagram'),
      infraTags: document.getElementById('viewInfraTags'),
      musicTags: document.getElementById('viewMusicTags'),
      positioningTags: document.getElementById('viewPositioningTags'),
      audienceTags: document.getElementById('viewAudienceTags'),
      vibeTags: document.getElementById('viewVibeTags'),
    };

    // ===== EDIT REFS =====
    const edit = {
      name: document.getElementById('editName'),
      type: document.getElementById('editType'),
      description: document.getElementById('editDescription'),
      street: document.getElementById('editStreet'),
      number: document.getElementById('editNumber'),
      neighborhood: document.getElementById('editNeighborhood'),
      city: document.getElementById('editCity'),
      state: document.getElementById('editState'),
      country: document.getElementById('editCountry'),
      phone: document.getElementById('editPhone'),
      instagram: document.getElementById('editInstagram'),
      infraContainer: document.getElementById('editInfraTagsContainer'),
      musicContainer: document.getElementById('editMusicTagsContainer'),
      positioningContainer: document.getElementById('editPositioningTagsContainer'),
      audienceContainer: document.getElementById('editAudienceTagsContainer'),
      vibeContainer: document.getElementById('editVibeTagsContainer'),
      infraCounter: document.getElementById('infraTagsCounter'),
      musicCounter: document.getElementById('musicTagsCounter'),
      positioningCounter: document.getElementById('positioningTagsCounter'),
      audienceCounter: document.getElementById('audienceTagsCounter'),
      vibeCounter: document.getElementById('vibeTagsCounter'),
    };

    // ===== AVATAR =====
    const avatarImg = document.getElementById('estAvatar');
    const avatarPlaceholder = document.getElementById('estAvatarPlaceholder');
    const avatarFileInput = document.getElementById('avatarFileInput');
    const uploadBtn = document.getElementById('uploadAvatarBtn');

    uploadBtn.addEventListener('click', () => avatarFileInput.click());
    avatarFileInput.addEventListener('change', async function() {
      const file = this.files[0];
      if (!file) return;
      try {
        const dataUrl = await resizeAndCompressImage(file, 300, 300, 0.6);
        newAvatarBase64 = dataUrl;
        avatarImg.src = dataUrl;
        avatarImg.style.display = 'block';
        avatarPlaceholder.style.display = 'none';
        await showAlert('✅ Sucesso!', 'Logo processada.');
      } catch (e) {
        await showAlert('❌ Erro', 'Erro ao processar imagem.');
      }
      this.value = '';
    });

    // ===== GALERIA (EDIÇÃO) =====
    const estGalleryEdit = document.getElementById('estGalleryEdit');
    const estGalleryInput = document.getElementById('estGalleryInput');
    const estGalleryAddBtn = document.getElementById('estGalleryAddBtn');

    function syncEstAvatarFromGallery() {
      const main = editGalleryPhotos[0];
      if (!main) return;
      avatarImg.src = main;
      avatarImg.style.display = 'block';
      avatarPlaceholder.style.display = 'none';
    }

    function renderGalleryEdit() {
      if (!estGalleryEdit) return;
      estGalleryEdit.innerHTML = editGalleryPhotos.map((url, i) => `
        <div class="gallery-slot${i === 0 ? ' primary' : ''}">
          <img src="${url}" alt="" />
          <button type="button" class="remove-photo" onclick="removeEstGalleryPhoto(${i})" aria-label="Remover">✕</button>
        </div>
      `).join('');
      if (editGalleryPhotos.length < 4) {
        estGalleryEdit.innerHTML += `<div class="gallery-slot add-slot" onclick="document.getElementById('estGalleryInput').click()">+</div>`;
      }
      syncEstAvatarFromGallery();
    }

    window.removeEstGalleryPhoto = function(index) {
      editGalleryPhotos.splice(index, 1);
      renderGalleryEdit();
    };

    estGalleryAddBtn?.addEventListener('click', () => estGalleryInput?.click());
    estGalleryInput?.addEventListener('change', async function() {
      const files = Array.from(this.files || []);
      for (const file of files) {
        if (editGalleryPhotos.length >= 4) {
          await showAlert('⚠️ Atenção', 'Máximo de 4 fotos.');
          break;
        }
        try {
          const dataUrl = await resizeAndCompressImage(file, 600, 600, 0.7);
          editGalleryPhotos.push(dataUrl);
        } catch (e) {
          console.warn(e);
        }
      }
      this.value = '';
      renderGalleryEdit();
    });

    // ===== CARREGAR DADOS =====
    async function carregarDados() {
      try {
        const estData = await fetchAPI(
          `/rest/v1/establishments?id=eq.${estId}&select=*,infra_tags,music_tags,positioning_tags,audience_tags,vibe_tags,target_audience,gallery_urls`
        );
        if (!estData.length) {
          await showAlert('❌ Erro', 'Estabelecimento não encontrado.');
          return;
        }
        currentEst = estData[0];
        newAvatarBase64 = null;
        editGalleryPhotos = typeof getProfilePhotos === 'function'
          ? getProfilePhotos(currentEst).slice(0, 4)
          : [];

        preencherVisual();
        preencherEdicao();
        await carregarEstatisticas();

        if (isEditMode) toggleEditMode(false);
        updateEstPublicUrl();
        refreshEstWidgetPanel();
      } catch (e) {
        await showAlert('❌ Erro', 'Erro ao carregar dados: ' + e.message);
        console.error(e);
      }
    }

    // ===== PREENCHER VISUAL =====
    function preencherVisual() {
      const e = currentEst;
      applyProfileAvatar(avatarImg, avatarPlaceholder, e.name, e.avatar_url);
      document.getElementById('estName').textContent = e.name || 'Sem nome';
      const username = formatUsername(e.instagram);
      const usernameEl = document.getElementById('estUsername');
      usernameEl.textContent = username;
      usernameEl.style.display = username ? 'block' : 'none';
      document.getElementById('estCity').textContent = e.type || e.city || 'Estabelecimento';
      const address = [e.street, e.number, e.neighborhood, e.city, e.state].filter(Boolean).join(', ');
      const metaParts = [];
      if (address) metaParts.push(`📍 ${address}`);
      if (e.phone) metaParts.push(`📞 ${e.phone}`);
      document.getElementById('estMeta').textContent = metaParts.join(' · ') || '';
      updateProfileRatingBlock(
        document.getElementById('estRatingBlock'),
        document.getElementById('estRatingStars'),
        document.getElementById('estRatingValue'),
        document.getElementById('estRatingCount'),
        e.avg_rating,
        e.total_reviews
      );
      const reviewTotal = Number(e.total_reviews) || 0;
      const ratingCountEl = document.getElementById('estRatingCount');
      if (ratingCountEl && reviewTotal > 0) {
        ratingCountEl.textContent = `${reviewTotal} avaliação${reviewTotal === 1 ? '' : 'ões'} verificada${reviewTotal === 1 ? '' : 's'}`;
      }
      const verifiedBadge = document.getElementById('estVerifiedBadge');
      if (verifiedBadge) verifiedBadge.hidden = reviewTotal === 0;

      const descCard = document.getElementById('viewDescCard');
      const igCard = document.getElementById('viewInstagramCard');
      const waCard = document.getElementById('viewWhatsappCard');
      const descText = e.description || '';
      const igHandle = e.instagram || '';
      const phoneText = e.phone || '';
      if (descCard) descCard.textContent = descText || 'Descrição ainda não preenchida — edite no perfil público.';
      if (igCard) {
        igCard.textContent = igHandle
          ? `📷 ${formatUsername(igHandle) || '@' + igHandle.replace(/^@/, '')}`
          : 'Instagram não informado';
      }
      if (waCard) waCard.textContent = phoneText ? `💬 ${phoneText}` : 'WhatsApp não informado';

      view.name.textContent = e.name || '-';
      view.type.textContent = e.type || '-';
      view.description.textContent = e.description || '-';
      view.address.textContent = [e.street, e.number, e.neighborhood, e.city, e.state, e.country].filter(Boolean).join(', ') || '-';
      view.phone.textContent = e.phone || '-';
      view.instagram.textContent = e.instagram || '-';

      function renderViewTags(container, tags) {
        if (tags && tags.length) {
          container.innerHTML = tags.map(t => renderTagWithEmoji(t)).join('');
        } else {
          container.innerHTML = '<span style="color:#94a3b8; font-size:13px;">Nenhuma tag</span>';
        }
      }
      renderViewTags(view.infraTags, e.infra_tags || []);
      renderViewTags(view.musicTags, e.music_tags || []);
      renderViewTags(view.positioningTags, e.positioning_tags || []);
      renderViewTags(view.audienceTags, e.audience_tags || []);
      renderViewTags(view.vibeTags, e.vibe_tags || []);

      const galleryEl = document.getElementById('estGalleryDash');
      if (galleryEl && typeof ProfileCard !== 'undefined') {
        const photos = getProfilePhotos(e);
        galleryEl.innerHTML = ProfileCard.renderGalleryPreview(photos, e.id);
      }
    }

    // ===== PREENCHER EDIÇÃO =====
    function preencherEdicao() {
      const e = currentEst;
      edit.name.value = e.name || '';
      edit.type.value = e.type || '';
      edit.description.value = e.description || '';
      edit.street.value = e.street || '';
      edit.number.value = e.number || '';
      edit.neighborhood.value = e.neighborhood || '';
      edit.city.value = e.city || '';
      edit.state.value = e.state || '';
      edit.country.value = e.country || '';
      edit.phone.value = e.phone || '';
      edit.instagram.value = e.instagram || '';

      renderEditChips(edit.infraContainer, infraOptions, e.infra_tags || [], 3, edit.infraCounter);
      renderEditChips(edit.musicContainer, musicOptions, e.music_tags || [], 3, edit.musicCounter);
      renderEditChips(edit.positioningContainer, positioningOptions, e.positioning_tags || [], 3, edit.positioningCounter);
      renderEditChips(edit.audienceContainer, audienceOptions, e.audience_tags || [], 3, edit.audienceCounter);
      renderEditChips(edit.vibeContainer, vibeOptions, e.vibe_tags || [], 3, edit.vibeCounter);
      editGalleryPhotos = typeof getProfilePhotos === 'function'
        ? getProfilePhotos(e).slice(0, 4)
        : [];
      renderGalleryEdit();
    }

    async function carregarRecomendacoesRH() {
      const el = document.getElementById('rhRecoGrid');
      if (!el || typeof HiringFlow === 'undefined') return;
      try {
        const select = [
          'id', 'name', 'specialty', 'avatar_url', 'avg_rating', 'total_reviews',
          'music_tags', 'visual_tags', 'personality_tags', 'work_tags', 'style_tags', 'tags',
          'availability', 'available_now', 'seeking_work', 'salary_expectation',
          'client_portfolio_count', 'igv_score', 'current_establishment_id',
          'profile:professional_profiles(years_experience,specialty)'
        ].join(',');
        const profs = await fetchAPI(
          `/rest/v1/professionals?is_active=eq.true&current_establishment_id=is.null&select=${select}&limit=40`
        );
        const ranked = (profs || [])
          .map(p => {
            let row = typeof enrichProfWithTalentMetrics === 'function' ? enrichProfWithTalentMetrics(p) : p;
            return typeof enrichProfForContratante === 'function' ? enrichProfForContratante(row, currentEst) : row;
          })
          .sort((a, b) => {
            const matchDiff = (b._contratanteMatch?.percent ?? 0) - (a._contratanteMatch?.percent ?? 0);
            if (matchDiff !== 0) return matchDiff;
            const igvDiff = (b._talentMetrics?.igv ?? b.igv_score ?? 0) - (a._talentMetrics?.igv ?? a.igv_score ?? 0);
            if (igvDiff !== 0) return igvDiff;
            return (Number(b.avg_rating) || 0) - (Number(a.avg_rating) || 0);
          })
          .slice(0, 8);
        const sugEl = document.getElementById('estTodaySuggestions');
        if (sugEl) sugEl.textContent = String(ranked.length);
        if (!ranked.length) {
          el.innerHTML = '<p class="prof-dash-muted">Nenhum profissional recomendado agora. Autônomos com boa reputação e disponíveis aparecem aqui.</p>';
          return;
        }
        el.innerHTML = ranked.map(p => HiringFlow.renderRecoHireCard(p, currentEst)).join('');
      } catch (e) {
        console.warn('RH recomendações:', e);
        el.innerHTML = '<p style="color:#94a3b8;">Não foi possível carregar recomendações.</p>';
      }
    }

    function renderPropostasRH() {
      const appsEl = document.getElementById('rhApplicationsList');
      const sentEl = document.getElementById('rhProposalsList');
      if (typeof HiringFlow === 'undefined') return;
      const all = HiringFlow.getProposalsForEstablishment(estId)
        .filter(p => !['hired', 'declined', 'withdrawn'].includes(p.status));
      const applications = all.filter(p => p.initiatedBy === 'professional' || p.type === 'application');
      const sent = all.filter(p => p.initiatedBy !== 'professional' && p.type !== 'application');

      if (appsEl) {
        appsEl.innerHTML = applications.length
          ? applications.map(p => HiringFlow.renderProposalRow(p, 'establishment')).join('')
          : '<p style="color:#94a3b8;font-size:14px;">Nenhuma candidatura ativa. Profissionais podem pedir emprego pelo dashboard deles.</p>';
      }
      if (sentEl) {
        sentEl.innerHTML = sent.length
          ? sent.map(p => HiringFlow.renderProposalRow(p, 'establishment')).join('')
          : '<p style="color:#94a3b8;font-size:14px;">Nenhuma proposta ativa. Encontre talentos em <a href="./estabelecimento-marketplace.html">Contratar</a>.</p>';
      }
    }

    document.addEventListener('proofly:hiring-updated', () => {
      renderPropostasRH();
      carregarRecomendacoesRH();
      carregarEstatisticas();
    });

    // ===== ALERTAS DE TALENTOS (Fase 2) =====
    async function carregarAlertasTalentos() {
      if (typeof isSharkMode === 'function' && isSharkMode()) return;
      const el = document.getElementById('talentAlertsWidget');
      if (!el || typeof getTalentAlerts !== 'function') return;
      try {
        const select = [
          'id', 'name', 'specialty', 'avatar_url', 'avg_rating', 'total_reviews',
          'music_tags', 'visual_tags', 'personality_tags', 'work_tags', 'style_tags', 'tags',
          'availability', 'available_now', 'seeking_work', 'salary_expectation',
          'client_portfolio_count', 'igv_score', 'current_establishment_id',
          'profile:professional_profiles(years_experience)'
        ].join(',');
        const profs = await fetchAPI(
          `/rest/v1/professionals?is_active=eq.true&current_establishment_id=is.null&select=${select}&limit=80`
        );
        const alerts = getTalentAlerts(profs || [], { minIGV: 60, limit: 5 })
          .map(p => {
            let enriched = enrichProfForContratante(p, currentEst);
            return enriched;
          });
        if (!alerts.length) {
          el.innerHTML = '<p style="color:#64748b;font-size:14px;">Nenhuma oportunidade no momento. Autônomos com IGV 60+, disponíveis e abertos a contratação aparecem aqui.</p>';
          return;
        }
        const items = alerts.map(p => {
          const m = p._talentMetrics;
          const match = p._contratanteMatch;
          const url = `./perfil-page.html?tipo=profissional&id=${p.id}`;
          return `<li class="talent-alert-item" onclick="window.location.href='${url}'" style="cursor:pointer;">
            <strong>${escapeHtml(p.name)}</strong>
            <span>IGV ${Math.round(m?.igv ?? 0)}</span>
            ${match ? `<span>Match ${match.percent}%</span>` : ''}
            <span class="talent-pill talent-pill-live sm">🟢 Agora</span>
          </li>`;
        }).join('');
        el.innerHTML = `
          <div class="talent-alerts-block" style="margin:0;">
            <div class="talent-alerts-title">🔔 Top oportunidades para ${escapeHtml(currentEst?.name || 'seu estabelecimento')}</div>
            <ul class="talent-alerts-list">${items}</ul>
          </div>
        `;
      } catch (e) {
        console.warn('Erro ao carregar alertas:', e);
        el.innerHTML = '<p style="color:#94a3b8;font-size:14px;">Não foi possível carregar alertas agora.</p>';
      }
    }

    // ===== CARREGAR ESTATÍSTICAS =====
    async function carregarEstatisticas() {
      try {
        const profs = await fetchAPI(`/rest/v1/professionals?select=id,avg_rating,total_reviews&current_establishment_id=eq.${estId}`);
        document.getElementById('profCount').textContent = profs.length;
        const ratedTeam = (profs || []).filter(p => Number(p.avg_rating) > 0);
        const teamAvg = ratedTeam.length
          ? ratedTeam.reduce((sum, p) => sum + Number(p.avg_rating), 0) / ratedTeam.length
          : 0;
        const teamReviewTotal = (profs || []).reduce((sum, p) => sum + (Number(p.total_reviews) || 0), 0);

        const allReviews = await fetchReviews(`establishment_id=eq.${estId}`);
        const clientReviews = filterReviewsByType(allReviews, REVIEW_TYPES.CLIENT_TO_EST);
        const stats = computeRatingStats(clientReviews);
        const avg = stats.total ? stats.avg : (currentEst.avg_rating || 0);
        const total = stats.total || currentEst.total_reviews || 0;
        const clientTotal = stats.total || 0;

        const todayTitle = document.getElementById('estTodayTitle');
        const todaySub = document.getElementById('estTodaySub');
        const todayHint = document.getElementById('estTodayHint');
        if (todayTitle && currentEst?.name) todayTitle.textContent = currentEst.name;
        if (todaySub && !(typeof isSharkMode === 'function' ? isSharkMode() : SHARK_MODE)) {
          todaySub.textContent = 'Visão rápida para decidir contratações';
        }
        const todayReviews = document.getElementById('estTodayReviews');
        if (todayReviews) todayReviews.textContent = String(total);
        document.getElementById('estTodayActiveProfs').textContent = profs.length;
        document.getElementById('estTodayOpenSlots').textContent = Math.max(0, 3 - profs.length);
        document.getElementById('estTodayAvgPerf').textContent = avg ? avg.toFixed(1) : '—';
        if (todayHint) {
          const sharkOn = typeof isSharkMode === 'function' ? isSharkMode() : (typeof SHARK_MODE !== 'undefined' && SHARK_MODE);
          todayHint.textContent = profs.length
            ? `${profs.length} profissional(is) na equipe · nota média ${avg ? avg.toFixed(1) : '—'}★ · ${total} avaliações`
            : (sharkOn ? 'Nenhum profissional na equipe ainda — use Buscar profissionais.' : 'Nenhum profissional na equipe — use o marketplace para contratar.');
        }
        document.getElementById('reviewCount').textContent = total;
        document.getElementById('avgRating').textContent = avg ? avg.toFixed(1) : '0.0';
        updateProfileRatingBlock(
          document.getElementById('estRatingBlock'),
          document.getElementById('estRatingStars'),
          document.getElementById('estRatingValue'),
          document.getElementById('estRatingCount'),
          avg,
          clientTotal
        );
        const ratingCountEl = document.getElementById('estRatingCount');
        if (ratingCountEl && clientTotal > 0) {
          ratingCountEl.textContent = `${clientTotal} avaliação${clientTotal === 1 ? '' : 'ões'} verificada${clientTotal === 1 ? '' : 's'}`;
        }
        const verifiedBadge = document.getElementById('estVerifiedBadge');
        if (verifiedBadge) verifiedBadge.hidden = clientTotal === 0;
        const teamMeta = document.getElementById('estTeamMeta');
        if (teamMeta) {
          teamMeta.textContent = profs.length
            ? `${profs.length} profissional${profs.length === 1 ? '' : 'is'} na equipe${teamAvg ? ` · média da equipe ${teamAvg.toFixed(1)}★` : ''}`
            : 'Nenhum profissional vinculado no momento';
        }

        const prooflyData = calcularProoflyScoreFromReviews(allReviews, estId, 'est');
        updateProoflyScoreBlock(
          document.getElementById('estProoflyBlock'),
          null,
          document.getElementById('estProoflyLabel'),
          document.getElementById('estProoflyBreakdown'),
          prooflyData
        );
        const badges = getProoflyBadges(currentEst, prooflyData.score, { clientTotal: total });
        document.getElementById('estProoflyBadges').innerHTML = badges.map(b =>
          `<span class="proofly-dash-badge">${b.icon} ${escapeHtml(b.label)}</span>`
        ).join('');
        const social = prooflyData.social || getMockSocialSignals(estId, 'est');
        document.getElementById('estProoflySocial').innerHTML = `
          <span>❤️ ${social.likes || 0} curtidas</span>
          <span>👁️ ${social.views || 0} views</span>
          <span>⭐ ${social.favorites || 0} salvos</span>
        `;

        const estCtx = { entityType: 'est', establishmentId: estId };
        const reviewsList = await fetchReviews(
          `establishment_id=eq.${estId}&review_type=eq.client_to_establishment`,
          { limit: 10, viewContext: estCtx }
        );

        const profReviewsList = await fetchReviews(
          `establishment_id=eq.${estId}&review_type=eq.professional_to_establishment`,
          { limit: 5, viewContext: estCtx }
        );
        const profRevEl = document.getElementById('profEstReviewsList');
        if (profRevEl) {
          profRevEl.innerHTML = typeof renderReviewsListHtml === 'function'
            ? renderReviewsListHtml(profReviewsList, 'Nenhuma avaliação de profissionais ainda.', { entityType: 'est' })
            : '<p style="color:#94a3b8;">Nenhuma avaliação de profissionais ainda.</p>';
        }
        const listEl = document.getElementById('reviewsList');
        listEl.innerHTML = typeof renderReviewsListHtml === 'function'
          ? renderReviewsListHtml(reviewsList, 'Nenhuma avaliação ainda.', { entityType: 'est' })
          : '<p class="prof-dash-muted">Nenhuma avaliação ainda.</p>';
        updateEstReviewAlert(reviewsList);

        // Profissionais vinculados + Centro RH
        const profsList = await fetchAPI(
          `/rest/v1/professionals?select=id,name,specialty,avatar_url,avg_rating,total_reviews,client_portfolio_count,igv_score,profile:professional_profiles(years_experience,specialty)&current_establishment_id=eq.${estId}&order=avg_rating.desc.nullslast&limit=20`
        );
        const estabReviewsByProf = {};
        try {
          const myReviews = await fetchReviews(
            `establishment_id=eq.${estId}&review_type=eq.establishment_to_professional`,
            { limit: 50 }
          );
          (myReviews || []).forEach(r => {
            if (r.professional_id && !estabReviewsByProf[r.professional_id]) {
              estabReviewsByProf[r.professional_id] = r;
            }
          });
        } catch { /* noop */ }

        const teamEl = document.getElementById('rhTeamGrid');
        if (!profsList.length) {
          if (teamEl) teamEl.innerHTML = '<p class="prof-dash-muted">Nenhum profissional na equipe. Contrate pelos <strong>Top Employees</strong> acima.</p>';
        } else {
          let html = '';
          let teamHtml = '';
          profsList.forEach(raw => {
            const p = typeof enrichProfWithTalentMetrics === 'function' ? enrichProfWithTalentMetrics(raw) : raw;
            p._lastEstabReview = estabReviewsByProf[p.id] || null;
            if (typeof HiringFlow !== 'undefined' && HiringFlow.renderTeamCard) {
              teamHtml += HiringFlow.renderTeamCard(p);
            }
            const m = p._talentMetrics;
            const stars = p.avg_rating ? renderStars(Math.round(p.avg_rating)) : '☆☆☆☆☆';
            const sharkOn = typeof isSharkMode === 'function' ? isSharkMode() : (typeof SHARK_MODE !== 'undefined' && SHARK_MODE);
            const igvHtml = !sharkOn && typeof renderIGVBadge === 'function' && m ? renderIGVBadge(m.igv, 'sm') : '';
            html += `
              <div class="prof-item-mini" style="flex-wrap:wrap;">
                <div style="width:36px;height:36px;border-radius:50%;background:#e2e8f0;display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;background:linear-gradient(135deg,#6366f1,#8b5cf6);flex-shrink:0;font-size:14px;">${p.avatar_url ? `<img src="${p.avatar_url}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : p.name.charAt(0).toUpperCase()}</div>
                <div style="flex:1;min-width:140px;"><a href="./p/?id=${encodeURIComponent(p.id)}" style="font-weight:600;color:#0f172a;text-decoration:none;">${escapeHtml(p.name)}</a><div style="font-size:13px;color:#64748b;">${escapeHtml(p.specialty || 'Profissional')}</div>${m ? `<div style="font-size:11px;color:#64748b;margin-top:2px;">${escapeHtml(m.carteiraLabel)}</div>` : ''}</div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
                  <div style="color:#f59e0b;font-size:13px;">${stars} ${p.avg_rating ? p.avg_rating.toFixed(1) : '0.0'}</div>
                  ${igvHtml}
                </div>
                <button type="button" class="btn btn-outline btn-small" style="font-size:11px;padding:4px 10px;" onclick="avaliarProfissionalVinculado('${p.id}','${escapeHtml(p.name).replace(/'/g, "\\'")}')">⭐ Avaliar</button>
              </div>
            `;
          });
          if (teamEl) teamEl.innerHTML = teamHtml || html;
        }

        await carregarRecomendacoesRH();
        renderPropostasRH();
        await carregarAlertasTalentos();
      } catch (e) { console.warn('Erro ao carregar estatísticas:', e); }
    }

    window.avaliarProfissionalVinculado = async function(profId, profName) {
      const ratingStr = prompt(`Nota de 1 a 5 para ${profName}:`, '5');
      if (!ratingStr) return;
      const rating = parseInt(ratingStr, 10);
      if (rating < 1 || rating > 5) {
        await showAlert('⚠️', 'Informe uma nota entre 1 e 5.');
        return;
      }
      const comment = prompt('Comentário (opcional):', '') || '';
      try {
        await submitReview({
          rating,
          comment,
          professionalId: profId,
          reviewType: REVIEW_TYPES.ESTAB_TO_PROF
        });
        await showAlert('✅', 'Avaliação registrada!');
        carregarEstatisticas();
      } catch (e) {
        await showAlert('❌', e.message);
      }
    };

    function updateEstReviewAlert(reviews) {
      const alertEl = document.getElementById('estReviewAlert');
      const textEl = document.getElementById('estReviewAlertText');
      if (!alertEl || !textEl) return;
      const pending = (reviews || []).filter((r) => {
        const rating = Number(r.rating) || 0;
        const hasReply = !!(r.establishment_reply || r.reply || r.response);
        return rating <= 3 && !hasReply;
      });
      if (!pending.length) {
        alertEl.hidden = true;
        return;
      }
      alertEl.hidden = false;
      textEl.textContent = pending.length === 1
        ? '🔔 1 avaliação negativa de cliente sem resposta.'
        : `🔔 ${pending.length} avaliações negativas de clientes sem resposta.`;
    }

    // ===== TOGGLE EDIÇÃO =====
    function toggleEditMode(enable) {
      isEditMode = (enable !== undefined) ? enable : !isEditMode;
      document.body.classList.toggle('edit-mode', isEditMode);
      const editPanel = document.getElementById('estEditPanel');
      const editCta = document.getElementById('estEditCta');
      if (editPanel) editPanel.hidden = !isEditMode;
      if (editCta) editCta.hidden = isEditMode;
      document.getElementById('editToggleBtn').style.display = isEditMode ? 'none' : 'inline-flex';
      document.getElementById('saveBtn').style.display = isEditMode ? 'inline-flex' : 'none';
      document.getElementById('cancelBtn').style.display = isEditMode ? 'inline-flex' : 'none';
      document.getElementById('sairBtn').style.display = isEditMode ? 'none' : 'inline-flex';
      document.getElementById('saveBtnBottom').style.display = isEditMode ? 'inline-flex' : 'none';
      document.getElementById('cancelBtnBottom').style.display = isEditMode ? 'inline-flex' : 'none';
      if (uploadBtn) uploadBtn.style.display = isEditMode ? 'flex' : 'none';
      if (isEditMode) renderGalleryEdit();
    }

    // ===== SALVAR =====
    async function salvarEdicao() {
      const formatted = typeof formatTextFields === 'function'
        ? formatTextFields({
            name: edit.name.value.trim(),
            type: edit.type.value.trim(),
            description: edit.description.value.trim(),
            street: edit.street.value.trim(),
            neighborhood: edit.neighborhood.value.trim(),
            city: edit.city.value.trim(),
            state: edit.state.value.trim()
          }, {
            name: 'establishmentName',
            type: 'specialty',
            description: 'bio',
            street: 'address',
            neighborhood: 'neighborhood',
            city: 'city',
            state: 'state'
          })
        : {
            name: edit.name.value.trim(),
            type: edit.type.value.trim(),
            description: edit.description.value.trim(),
            street: edit.street.value.trim(),
            neighborhood: edit.neighborhood.value.trim(),
            city: edit.city.value.trim(),
            state: edit.state.value.trim()
          };
      const name = formatted.name;
      if (!name) {
        await showAlert('⚠️ Atenção', 'Nome é obrigatório.');
        return;
      }
      if (edit.phone.value.trim() && !formatarTelefone(edit.phone)) {
        await showAlert('⚠️ Atenção', 'Telefone inválido.');
        edit.phone.focus();
        return;
      }

      const infraTags = Array.from(edit.infraContainer.querySelectorAll('.active')).map(el => el.dataset.tag);
      const musicTags = Array.from(edit.musicContainer.querySelectorAll('.active')).map(el => el.dataset.tag);
      const positioningTags = Array.from(edit.positioningContainer.querySelectorAll('.active')).map(el => el.dataset.tag);
      const audienceTags = Array.from(edit.audienceContainer.querySelectorAll('.active')).map(el => el.dataset.tag);
      const vibeTags = Array.from(edit.vibeContainer.querySelectorAll('.active')).map(el => el.dataset.tag);

      const estPayload = {
        name: name,
        type: formatted.type || null,
        description: formatted.description || null,
        street: formatted.street || null,
        number: edit.number.value.trim() || null,
        neighborhood: formatted.neighborhood || null,
        city: formatted.city || null,
        state: formatted.state || null,
        country: edit.country.value.trim() || null,
        phone: edit.phone.value.trim() || null,
        instagram: edit.instagram.value.trim() || null,
        avatar_url: editGalleryPhotos[0] || newAvatarBase64 || currentEst?.avatar_url || null,
        gallery_urls: editGalleryPhotos,
        infra_tags: infraTags,
        music_tags: musicTags,
        positioning_tags: positioningTags,
        audience_tags: audienceTags,
        vibe_tags: vibeTags,
      };

      try {
        await fetchAPI(`/rest/v1/establishments?id=eq.${estId}`, 'PATCH', estPayload);
        await showAlert('✅ Sucesso!', 'Perfil atualizado com sucesso!');
        await carregarDados();
        toggleEditMode(false);
      } catch (e) {
        await showAlert('❌ Erro', 'Erro ao salvar: ' + e.message);
      }
    }

    // ===== CANCELAR =====
    async function cancelarEdicao() {
      const confirmado = await showConfirm({
        title: 'Cancelar edição?',
        message: 'As alterações não salvas serão perdidas.',
        confirmText: 'Sim, cancelar',
        cancelText: 'Continuar editando',
        danger: false
      });
      if (confirmado) {
        carregarDados();
        toggleEditMode(false);
      }
    }

    // ===== SAIR =====
    async function sairModo() {
      const confirmado = await showConfirm({
        title: 'Sair do perfil?',
        message: 'Você será desconectado.',
        confirmText: 'Sair',
        cancelText: 'Ficar',
        danger: false
      });
      if (confirmado) {
        if (typeof resetSessionAndGoHome === 'function') {
          resetSessionAndGoHome();
        } else {
          clearSession();
          window.location.replace('index.html');
        }
      }
    }
    window.sairModo = sairModo;

    function updateEstPublicUrl() {
      const rel = `./e/?id=${encodeURIComponent(estId)}`;
      const url = `${window.location.origin}${window.location.pathname.replace(/[^/]+$/, '')}${rel.replace(/^\.\//, '')}`;
      const input = document.getElementById('estPublicUrl');
      const open = document.getElementById('estPublicUrlOpen');
      if (input) input.value = url;
      if (open) open.href = rel;
    }

    window.copiarLinkReputacaoEstab = async function() {
      const url = document.getElementById('estPublicUrl')?.value || '';
      try {
        await navigator.clipboard.writeText(url);
        await showAlert('✅ Copiado!', 'Link da página de reputação copiado.');
      } catch {
        await showAlert('❌ Erro', 'Não foi possível copiar o link.');
      }
    };

    window.gerarQRCodeEstab = async function() {
      const div = document.getElementById('qrResult');
      div.innerHTML = '<div class="loading">Gerando QR Code...</div>';
      try {
        const token = crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
        const url = RankingProQR.buildProfileBuscaUrl('establishment', estId, { token });
        div.innerHTML = `
          <div class="prof-qr-code-box">
            <div id="qrcodeContainer"></div>
            <p class="prof-qr-code-hint">Cliente escaneia no balcão — avaliação verificada no local</p>
          </div>
        `;
        const renderQr = () => {
          new QRCode(document.getElementById('qrcodeContainer'), { text: url, width: 160, height: 160 });
        };
        if (typeof QRCode === 'undefined') {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js';
          script.onload = renderQr;
          document.head.appendChild(script);
        } else {
          renderQr();
        }
        await showAlert('✅ Sucesso!', 'QR Code gerado — cliente pode escanear no local.');
      } catch (e) {
        div.innerHTML = `<p class="prof-dash-muted">Erro: ${escapeHtml(e.message)}</p>`;
        await showAlert('❌ Erro', 'Erro ao gerar QR Code: ' + e.message);
      }
    };

    // ===== EVENTOS =====
    document.getElementById('editToggleBtn').addEventListener('click', () => {
      toggleEditMode(true);
      const panel = document.getElementById('estEditPanel');
      if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    document.getElementById('saveBtn').addEventListener('click', salvarEdicao);
    document.getElementById('cancelBtn').addEventListener('click', cancelarEdicao);
    document.getElementById('saveBtnBottom').addEventListener('click', salvarEdicao);
    document.getElementById('cancelBtnBottom').addEventListener('click', cancelarEdicao);

    // ===== WIDGET EMBED =====
    function refreshEstWidgetPanel() {
      if (!estId || typeof ProoflyWidgetUtils === 'undefined') return;
      ProoflyWidgetUtils.configureWidgetRuntime();
      const mode = document.getElementById('widgetModeSelect')?.value || 'medium';
      const box = document.getElementById('widgetPreviewBox');
      const codeEl = document.getElementById('widgetEmbedCode');
      const openLink = document.getElementById('widgetOpenPage');
      if (!box) return;
      box.innerHTML = `<div data-proofly-id="${estId}" data-mode="${mode}"></div>`;
      if (window.ProoflyWidget) window.ProoflyWidget.processWidgets();
      const snippet = ProoflyWidgetUtils.buildEmbedSnippet(estId, mode);
      if (codeEl) codeEl.textContent = snippet;
      if (openLink) openLink.href = `./widget.html?id=${encodeURIComponent(estId)}&mode=${encodeURIComponent(mode)}`;
    }

    document.getElementById('widgetModeSelect')?.addEventListener('change', refreshEstWidgetPanel);
    document.getElementById('widgetCopyBtn')?.addEventListener('click', async () => {
      const ok = await ProoflyWidgetUtils?.copyText(ProoflyWidgetUtils.buildEmbedSnippet(estId, document.getElementById('widgetModeSelect')?.value));
      await showAlert(ok ? '✅ Copiado!' : '❌ Erro', ok ? 'Código HTML copiado.' : 'Não foi possível copiar.');
    });
    document.getElementById('widgetCopyIframeBtn')?.addEventListener('click', async () => {
      const ok = await ProoflyWidgetUtils?.copyText(ProoflyWidgetUtils.buildIframeSnippet(estId, document.getElementById('widgetModeSelect')?.value));
      await showAlert(ok ? '✅ Copiado!' : '❌ Erro', ok ? 'Código iframe copiado.' : 'Não foi possível copiar.');
    });

    // ===== INICIALIZAR =====
    if (typeof bindRegistrationFormatting === 'function') {
      bindRegistrationFormatting({
        establishmentName: edit.name,
        specialty: edit.type,
        bio: edit.description,
        street: edit.street,
        neighborhood: edit.neighborhood,
        city: edit.city,
        state: edit.state
      });
    }

    function initSharkEstDashboard() {
      if (!(typeof isSharkMode === 'function' ? isSharkMode() : (typeof SHARK_MODE !== 'undefined' && SHARK_MODE))) return;
      document.querySelectorAll('.shark-frozen-ui').forEach(el => {
        if (el.id === 'rhHubSection') return;
        el.style.display = 'none';
      });
      const rhHub = document.getElementById('rhHubSection');
      if (rhHub) rhHub.style.display = '';
      const plan = document.getElementById('estPlanCard');
      if (plan) plan.hidden = false;
      const sub = document.getElementById('estTodaySub');
      if (sub) sub.textContent = 'Acompanhe a reputação da sua equipe e do seu salão.';
    }

    async function initEstDashboard() {
      initSharkEstDashboard();
      if (uploadBtn) uploadBtn.style.display = 'none';
      updateEstPublicUrl();
      if (typeof hasMultipleProfileRoles === 'function' && hasMultipleProfileRoles(getSession())) {
        const alt = document.getElementById('btnAlternarPerfil');
        if (alt) alt.style.display = 'inline-flex';
      }
      await carregarDados();
      updateEstPublicUrl();
      toggleEditMode(false);
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => initEstDashboard());
    } else {
      initEstDashboard();
    }
}

if (window.RANKING_PRO_SCRIPTS_READY || window.PROOFLY_SCRIPTS_READY) bootDashboardEstabelecimento();
else document.addEventListener('scriptsLoaded', bootDashboardEstabelecimento, { once: true });
