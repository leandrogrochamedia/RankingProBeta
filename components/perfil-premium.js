// Perfil Premium — Profissional + Estabelecimento (Apple-level)

(function (global) {
  'use strict';

  const HERO_PROF = 'https://images.unsplash.com/photo-1585747860715-2fc5b7e7d8c5?w=800&q=80';
  const HERO_EST = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80';
  const MENU_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';

  function esc(s) {
    return typeof escapeHtml === 'function' ? escapeHtml(s) : String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function initials(name) {
    return String(name || '?').split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase();
  }

  function avatarUrl(url, item) {
    if (typeof getAvatarUrl === 'function') return getAvatarUrl(url, item);
    return url || '';
  }

  function renderAvatar(url, name, verified) {
    const init = esc(initials(name));
    const img = url
      ? `<img class="pp-avatar" src="${esc(avatarUrl(url))}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>`
      : '';
    const fb = `<span class="pp-avatar-fallback" style="${url ? 'display:none' : ''}">${init}</span>`;
    const badge = verified
      ? '<span class="pp-avatar-verified" aria-label="Verificado">✓</span>'
      : '';
    return `<div class="pp-avatar-wrap">${img}${fb}${badge}</div>`;
  }

  function renderHeader(menuHref) {
    const href = menuHref || './cliente.html';
    return `
      <header class="pp-header">
        <span class="pp-header-brand">🏆 Ranking Pro</span>
        <button type="button" class="pp-header-menu" aria-label="Menu" onclick="location.href='${esc(href)}'">${MENU_SVG}</button>
      </header>`;
  }

  function renderStatCards(cards) {
    return `
      <div class="pp-stats">
        ${cards.map(c => `
          <div class="pp-stat-card">
            <div class="pp-stat-icon pp-stat-icon--${c.tone}">${c.icon}</div>
            <span class="pp-stat-value">${esc(c.value)}</span>
            <span class="pp-stat-label">${esc(c.label)}</span>
          </div>`).join('')}
      </div>`;
  }

  function rankingLabel(score) {
    const s = Number(score) || 0;
    if (s >= 85) return 'Elite';
    if (s >= 70) return 'Top';
    if (s >= 50) return 'Sólido';
    return s > 0 ? `${s}%` : '—';
  }

  function starsHtml(rating) {
    const n = Math.round(Number(rating) || 0);
    let h = '';
    for (let i = 1; i <= 5; i++) h += i <= n ? '★' : '☆';
    return h;
  }

  function shareUrlProf(id) {
    if (typeof publicProfPassportUrl === 'function') {
      const rel = publicProfPassportUrl(id);
      return new URL(rel, global.location.href).href;
    }
    if (typeof RankingProQR !== 'undefined') return RankingProQR.buildProfileUrl(id);
    return `${global.location.origin}${global.location.pathname.replace(/[^/]+$/, '')}p/?id=${encodeURIComponent(id)}`;
  }

  function shareUrlEst(id) {
    if (typeof publicEstVitrineUrl === 'function') {
      const rel = publicEstVitrineUrl(id);
      return new URL(rel, global.location.href).href;
    }
    return `${global.location.origin}${global.location.pathname.replace(/[^/]+$/, '')}e/?id=${encodeURIComponent(id)}`;
  }

  function qrApiUrl(targetUrl) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=8&data=${encodeURIComponent(targetUrl)}`;
  }

  function renderQrCard(entityId, type, title) {
    const dlId = `pp-qr-dl-${type}-${entityId}`;
    const imgId = `pp-qr-img-${type}-${entityId}`;
    return `
      <div class="pp-qr-card" data-pp-qr-type="${type}" data-pp-qr-id="${esc(entityId)}">
        <p class="pp-qr-title">${esc(title)}</p>
        <div class="pp-qr-img-wrap">
          <img id="${imgId}" class="pp-qr-img" width="160" height="160" alt="QR Code" />
        </div>
        <button type="button" class="pp-qr-download" id="${dlId}">Baixar imagem do QR Code</button>
      </div>`;
  }

  function isVerifiedReview(r) {
    if (typeof isReviewVerified === 'function') return isReviewVerified(r);
    if (global.RankingProProfile?.isReviewVerified) return RankingProProfile.isReviewVerified(r);
    return !!(r?.is_verified ?? r?.verified);
  }

  function reviewDateLabel(iso) {
    if (typeof tempoRelativo === 'function') return tempoRelativo(iso);
    if (global.RankingProProfile?.formatRelativeDate) return RankingProProfile.formatRelativeDate(iso);
    return '';
  }

  function publicRoot() {
    return (global.RankingProPaths?.prefix?.() || '../').replace(/\/?$/, '/');
  }

  function renderReviews(reviews, emptyMsg) {
    const list = (reviews || []).slice(0, 10);
    if (!list.length) {
      return `<p class="pp-empty">${esc(emptyMsg || 'Nenhuma avaliação ainda.')}</p>`;
    }
    return list.map(r => {
      const verified = isVerifiedReview(r);
      const date = reviewDateLabel(r.created_at);
      const comment = r.comment
        ? `<p class="pp-review-comment">${esc(r.comment)}</p>`
        : '';
      const vBadge = verified ? '<span class="pp-review-verified">✓ Verificada</span>' : '';
      return `
        <article class="pp-review-card">
          <div class="pp-review-stars">${starsHtml(r.rating)}${vBadge}</div>
          ${comment}
          <p class="pp-review-date">${esc(date)}</p>
        </article>`;
    }).join('');
  }

  function renderContactFooter(contact) {
    if (!contact) return '';
    const { bio, wa, ig } = contact;
    const btns = [];
    if (wa) btns.push(`<a href="${esc(wa)}" class="pp-contact-btn pp-contact-btn--wa" target="_blank" rel="noopener">WhatsApp</a>`);
    if (ig) btns.push(`<a href="${esc(ig)}" class="pp-contact-btn pp-contact-btn--ig" target="_blank" rel="noopener">Instagram</a>`);
    if (!bio && !btns.length) return '';
    return `
      <footer class="pp-contact-footer">
        ${bio ? `<p class="pp-contact-bio">${esc(bio)}</p>` : ''}
        ${btns.length ? `<div class="pp-contact-btns">${btns.join('')}</div>` : ''}
      </footer>`;
  }

  function renderTeamList(members, publicLinks) {
    if (!members?.length) {
      return '<p class="pp-empty">Nenhum profissional vinculado ainda.</p>';
    }
    const root = publicRoot();
    return `<ul class="pp-team-list">${members.map(p => {
      const avg = Number(p.avg_rating) || 0;
      const total = Number(p.total_reviews) || 0;
      const rating = avg > 0 ? `★ ${avg.toFixed(1)} · ${total}` : (total ? `${total} aval.` : 'Sem nota');
      const av = p.avatar_url
        ? `<img class="pp-team-avatar" src="${esc(avatarUrl(p.avatar_url))}" alt=""/>`
        : `<span class="pp-team-avatar-fb">${esc(initials(p.name))}</span>`;
      const href = publicLinks
        ? `${root}p/?id=${encodeURIComponent(p.id)}`
        : (typeof profilePageUrl === 'function'
          ? profilePageUrl('profissional', p.id)
          : `./perfil-page.html?tipo=profissional&id=${encodeURIComponent(p.id)}`);
      return `
        <li>
          <a class="pp-team-row" href="${esc(href)}">
            ${av}
            <span class="pp-team-info">
              <span class="pp-team-name">${esc(p.name)}</span>
              <span class="pp-team-rating">${esc(rating)}</span>
            </span>
          </a>
        </li>`;
    }).join('')}</ul>`;
  }

  async function sharePublic() {
    const url = global.location.href;
    const title = document.title || 'Ranking Pro';
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      if (typeof showAlert === 'function') await showAlert('✅ Copiado!', 'Link copiado para compartilhar.');
    } catch {
      if (typeof showAlert === 'function') await showAlert('Link', url);
    }
  }

  function renderProfessional(data) {
    const {
      prof, avgRating, totalReviews, prooflyScore, clientReviews,
      hasVerified, menuHref, sharkOn, publicMode, contact
    } = data;
    const name = prof.name || 'Profissional';
    const specialty = prof.profile?.specialty || prof.specialty || 'Profissional';
    const photos = typeof getProfilePhotos === 'function' ? getProfilePhotos(prof) : [];
    const heroImg = photos[0] || prof.avatar_url || HERO_PROF;
    const avatar = photos[0] || prof.avatar_url;

    let bond = 'Autônomo';
    if (prof.current_establishment?.name) {
      const estId = prof.current_establishment.id;
      const estHref = publicMode && estId
        ? `${publicRoot()}e/?id=${encodeURIComponent(estId)}`
        : (typeof profilePageUrl === 'function' ? profilePageUrl('estabelecimento', estId) : '#');
      bond = `Atualmente na <a class="pp-bond-link" href="${esc(estHref)}">${esc(prof.current_establishment.name)}</a>`;
    }

    const stats = renderStatCards([
      { icon: '★', tone: 'star', value: avgRating > 0 ? avgRating.toFixed(1) : '—', label: 'Nota' },
      { icon: '💬', tone: 'chat', value: String(totalReviews), label: 'Avaliações' },
      { icon: '🏆', tone: 'trophy', value: rankingLabel(prooflyScore), label: 'Ranking' }
    ]);

    const trust = sharkOn
      ? '<p class="pp-trust-note">Avaliações reais de quem foi atendido. Escaneie o QR Code do profissional no local.</p>'
      : '';

    return `
      <div class="pp-prof" data-pp-entity="prof" data-pp-id="${esc(prof.id)}">
        ${renderHeader(menuHref)}
        <div class="pp-hero" style="background-image:url('${esc(heroImg)}')"></div>
        <div class="pp-identity-wrap">
          ${renderAvatar(avatar, name, hasVerified)}
          <h1 class="pp-name">${esc(name)}</h1>
          <p class="pp-specialty">${esc(specialty)}</p>
          <p class="pp-bond">${bond}</p>
        </div>
        ${stats}
        <button type="button" class="pp-share-btn" onclick="${publicMode ? 'ProfilePremium.sharePublic()' : 'ProfilePageView.shareProfile()'}">Compartilhar minha Reputação</button>
        ${renderQrCard(prof.id, 'prof', 'QR Code — reputação verificável')}
        ${trust}
        <section class="pp-reviews">
          <h2 class="pp-reviews-title">Histórico de Avaliações</h2>
          ${renderReviews(clientReviews, 'Ainda sem avaliações verificadas.')}
        </section>
        ${renderContactFooter(contact)}
      </div>`;
  }

  function renderEstablishment(data) {
    const {
      estab, avgRating, totalReviews, prooflyScore, teamMembers, teamStats,
      reviews, verifiedPct, paginationHtml, menuHref, sharkOn, address, mapsUrl,
      publicMode, contact
    } = data;
    const name = estab.name || 'Estabelecimento';
    const subtitle = estab.type || 'Estabelecimento';
    const location = [estab.neighborhood, estab.city].filter(Boolean).join(', ');
    const photos = typeof getProfilePhotos === 'function' ? getProfilePhotos(estab) : [];
    const heroImg = photos[0] || estab.avatar_url || HERO_EST;
    const avatar = estab.avatar_url || photos[0];
    const teamAvg = teamStats?.avg > 0 ? teamStats.avg.toFixed(1) : '—';

    const stats = renderStatCards([
      { icon: '★', tone: 'star', value: avgRating > 0 ? avgRating.toFixed(1) : '—', label: 'Lugar' },
      { icon: '💬', tone: 'chat', value: String(totalReviews), label: 'Avaliações' },
      { icon: '🏆', tone: 'trophy', value: teamAvg, label: 'Equipe' }
    ]);

    const trust = sharkOn
      ? '<p class="pp-trust-note">Avaliações reais de quem foi atendido. Escaneie o QR Code do estabelecimento no local.</p>'
      : '';

    const addressBlock = address ? `
      <div class="pp-address-card">
        <p class="pp-address-text">${esc(address)}</p>
        ${mapsUrl ? `<a class="pp-map-link" href="${esc(mapsUrl)}" target="_blank" rel="noopener">Ver no mapa →</a>` : ''}
      </div>` : '';

    return `
      <div class="pp-est" data-pp-entity="est" data-pp-id="${esc(estab.id)}">
        ${renderHeader(menuHref)}
        <div class="pp-hero" style="background-image:url('${esc(heroImg)}')"></div>
        <div class="pp-identity-wrap">
          ${renderAvatar(avatar, name, verifiedPct > 0)}
          <h1 class="pp-name">${esc(name)}</h1>
          <p class="pp-specialty">${esc(subtitle)}${location ? ` · ${esc(location)}` : ''}</p>
        </div>
        ${stats}
        <button type="button" class="pp-share-btn" onclick="${publicMode ? 'ProfilePremium.sharePublic()' : 'ProfilePageView.shareProfile()'}">Compartilhar vitrine</button>
        ${renderQrCard(estab.id, 'est', 'QR Code — vitrine do local')}
        ${trust}
        <section class="pp-section">
          <h2 class="pp-section-title">O time</h2>
          ${renderTeamList(teamMembers, publicMode)}
        </section>
        ${addressBlock}
        <section class="pp-reviews">
          <h2 class="pp-reviews-title">Histórico de Avaliações</h2>
          ${renderReviews(reviews, 'Nenhuma avaliação ainda.')}
          ${paginationHtml || ''}
        </section>
        ${renderContactFooter(contact)}
      </div>`;
  }

  function mountQr(root) {
    const wrap = root?.querySelector('[data-pp-entity]');
    if (!wrap) return;
    const type = wrap.dataset.ppEntity;
    const id = wrap.dataset.ppId;
    if (!id) return;

    const url = type === 'prof' ? shareUrlProf(id) : shareUrlEst(id);
    const img = root.querySelector(`#pp-qr-img-${type}-${id}`);
    const dlBtn = root.querySelector(`#pp-qr-dl-${type}-${id}`);
    const qrSrc = qrApiUrl(url);

    if (img) {
      img.src = qrSrc;
      img.dataset.ppQrTarget = url;
    }

    if (dlBtn && img) {
      dlBtn.addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = qrSrc;
        a.download = `ranking-pro-qr-${type}-${id}.png`;
        a.target = '_blank';
        a.rel = 'noopener';
        a.click();
      });
    }
  }

  function hideLoadingOverlay() {
    const el = document.getElementById('perfilLoadingOverlay');
    if (el) el.classList.add('is-hidden');
  }

  global.ProfilePremium = {
    renderProfessional,
    renderEstablishment,
    mountQr,
    hideLoadingOverlay,
    sharePublic,
    shareUrlProf,
    shareUrlEst
  };
})(window);