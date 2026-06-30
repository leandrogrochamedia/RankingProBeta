// Perfil Premium Boot — Apple Design + Data Visualization
(function() {
  'use strict';
  
  // Helper functions
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  
  function getInitials(name) {
    return String(name || '?').split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase();
  }
  
  function formatRelativeDate(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses atrás`;
    return `${Math.floor(diffDays / 365)} anos atrás`;
  }
  
  function generateStars(rating) {
    const full = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    let stars = '';
    for (let i = 0; i < full; i++) stars += '★';
    if (hasHalf) stars += '½';
    while (stars.length < 5) stars += '☆';
    return stars.slice(0, 5);
  }
  
  function getRankingTier(score) {
    if (score >= 90) return { label: 'ELITE', color: '#FFD700' };
    if (score >= 75) return { label: 'OURO', color: '#FFA500' };
    if (score >= 60) return { label: 'PRATA', color: '#C0C0C0' };
    if (score >= 40) return { label: 'BRONZE', color: '#CD7F32' };
    return { label: 'MEMBRO', color: '#888888' };
  }
  
  // State
  let currentTipo = null;
  let currentId = null;
  let currentPage = 0;
  const REVIEWS_PER_PAGE = 10;
  
  // Render functions
  function renderHeader(title) {
    return `
      <header class="perfil-header animate-in">
        <div class="header-back" onclick="history.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </div>
        <span class="header-title">${escapeHtml(title)}</span>
        <div class="header-action" onclick="ProfilePremium.shareProfile()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
            <polyline points="16 6 12 2 8 6"/>
            <line x1="12" y1="2" x2="12" y2="15"/>
          </svg>
        </div>
      </header>
    `;
  }
  
  function renderHero(imageUrl, isVerified) {
    return `
      <section class="hero-section animate-in delay-1">
        <img class="hero-image" src="${escapeHtml(imageUrl)}" alt="" onerror="this.style.background='linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'"/>
        <div class="hero-gradient"></div>
        ${isVerified ? '<div class="hero-badge"><span class="verified-badge">✓ Verificado</span></div>' : ''}
      </section>
    `;
  }
  
  function renderAvatar(url, name, isVerified) {
    const initials = getInitials(name);
    if (url) {
      return `
        <div class="avatar-wrapper">
          <img class="avatar" src="${escapeHtml(url)}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>
          <div class="avatar-fallback" style="display:none">${initials}</div>
          ${isVerified ? '<div class="verified-check">✓</div>' : ''}
        </div>
      `;
    }
    return `
      <div class="avatar-wrapper">
        <div class="avatar-fallback">${initials}</div>
        ${isVerified ? '<div class="verified-check">✓</div>' : ''}
      </div>
    `;
  }
  
  function renderProfileInfo(name, specialty, location) {
    return `
      <div class="profile-info-card animate-in delay-2">
        <div class="avatar-container">
          ${renderAvatar(null, name, false)}
        </div>
        <h1 class="profile-name">${escapeHtml(name)}</h1>
        <p class="profile-specialty">${escapeHtml(specialty)}</p>
        ${location ? `<p class="profile-location">📍 ${escapeHtml(location)}</p>` : ''}
      </div>
    `;
  }
  
  function renderStats(avgRating, totalReviews, prooflyScore) {
    const tier = getRankingTier(prooflyScore || 0);
    return `
      <div class="stats-grid animate-in delay-3">
        <div class="stat-card">
          <div class="stat-icon">⭐</div>
          <span class="stat-value">${avgRating > 0 ? avgRating.toFixed(1) : '—'}</span>
          <span class="stat-label">Nota</span>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💬</div>
          <span class="stat-value">${totalReviews || 0}</span>
          <span class="stat-label">Avaliações</span>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🏆</div>
          <span class="stat-value">${tier.label}</span>
          <span class="stat-label">Ranking</span>
        </div>
      </div>
    `;
  }
  
  function renderActionButtons() {
    return `
      <div class="action-buttons animate-in delay-4">
        <button class="btn-primary" onclick="ProfilePremium.hireProfessional()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          Contratar
        </button>
        <button class="btn-secondary" onclick="ProfilePremium.shareProfile()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="18" cy="5" r="3"/>
            <circle cx="6" cy="12" r="3"/>
            <circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </button>
      </div>
    `;
  }
  
  function renderRatingChart(reviews) {
    const distribution = [0, 0, 0, 0, 0];
    reviews.forEach(r => {
      const rating = Math.round(Number(r.rating) || 0);
      if (rating >= 1 && rating <= 5) distribution[rating - 1]++;
    });
    
    const maxCount = Math.max(...distribution, 1);
    const total = distribution.reduce((a, b) => a + b, 0);
    const avg = total > 0 
      ? (distribution.reduce((sum, count, i) => sum + count * (i + 1), 0) / total)
      : 0;
    
    return `
      <div class="rating-chart-card animate-in">
        <div class="rating-chart-header">
          <span class="rating-chart-title">Distribuição de Notas</span>
          <div class="rating-chart-average">
            <span class="average-score">${avg.toFixed(1)}</span>
            <span class="average-stars">${generateStars(avg)}</span>
          </div>
        </div>
        <div class="rating-bars">
          ${[5, 4, 3, 2, 1].map((stars, idx) => {
            const count = distribution[stars - 1];
            const percentage = (count / maxCount) * 100;
            return `
              <div class="rating-bar-row">
                <span class="rating-bar-label">${stars}★</span>
                <div class="rating-bar-track">
                  <div class="rating-bar-fill" style="width: ${percentage}%"></div>
                </div>
                <span class="rating-bar-count">${count}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }
  
  function renderRankingCard(prooflyScore) {
    const tier = getRankingTier(prooflyScore || 0);
    const percentile = Math.min(99, Math.floor(prooflyScore || 0));
    
    return `
      <div class="ranking-card animate-in">
        <div class="ranking-icon">🏆</div>
        <div class="ranking-info">
          <div class="ranking-label">Posição no Ranking</div>
          <div class="ranking-tier">${tier.label}</div>
          <div class="ranking-percentile">Top ${percentile}% dos profissionais</div>
        </div>
      </div>
    `;
  }
  
  function renderTags(tags) {
    if (!tags || !tags.length) return '';
    return `
      <div class="tags-container animate-in">
        ${tags.map(tag => `<span class="tag-chip">${escapeHtml(tag)}</span>`).join('')}
      </div>
    `;
  }
  
  function renderReviews(reviews, page = 0) {
    const startIndex = page * REVIEWS_PER_PAGE;
    const paginatedReviews = reviews.slice(startIndex, startIndex + REVIEWS_PER_PAGE);
    const totalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE);
    
    if (!paginatedReviews.length) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">💬</div>
          <p>Sem avaliações ainda</p>
        </div>
      `;
    }
    
    return `
      <div class="reviews-section">
        ${paginatedReviews.map((review, idx) => `
          <div class="review-card animate-in" style="animation-delay: ${idx * 0.05}s">
            <div class="review-header">
              <div class="reviewer-avatar">${getInitials(review.reviewer_name || 'Cliente')}</div>
              <div class="reviewer-info">
                <div class="reviewer-name">${escapeHtml(review.reviewer_name || 'Cliente Anônimo')}</div>
                <div class="review-date">${formatRelativeDate(review.created_at)}</div>
              </div>
              <div class="review-rating">${generateStars(review.rating)}</div>
            </div>
            ${review.comment ? `<p class="review-comment">${escapeHtml(review.comment)}</p>` : ''}
            ${review.verified ? '<div class="verified-review-badge">✓ Avaliação Verificada</div>' : ''}
          </div>
        `).join('')}
        ${totalPages > 1 ? `
          <div style="display:flex;justify-content:center;gap:8px;margin-top:16px;">
            ${page > 0 ? `<button class="btn-secondary" onclick="ProfilePremium.loadReviews(${page - 1})" style="width:auto;padding:0 16px;">← Anterior</button>` : ''}
            <span style="display:flex;align-items:center;color:var(--text-tertiary);font-size:14px;">${page + 1} / ${totalPages}</span>
            ${page < totalPages - 1 ? `<button class="btn-secondary" onclick="ProfilePremium.loadReviews(${page + 1})" style="width:auto;padding:0 16px;">Próxima →</button>` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }
  
  function renderContactSection(contact) {
    if (!contact || (!contact.whatsapp && !contact.instagram)) return '';
    
    return `
      <div class="contact-card animate-in">
        ${contact.bio ? `<p class="contact-bio">${escapeHtml(contact.bio)}</p>` : ''}
        <div class="contact-buttons">
          ${contact.whatsapp ? `
            <a href="${escapeHtml(contact.whatsapp)}" class="contact-btn btn-whatsapp" target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              WhatsApp
            </a>
          ` : ''}
          ${contact.instagram ? `
            <a href="${escapeHtml(contact.instagram)}" class="contact-btn btn-instagram" target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              Instagram
            </a>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  function renderQRCode(entityType, entityId) {
    const baseUrl = window.location.origin + window.location.pathname.replace(/[^/]+$/, '');
    const profileUrl = `${baseUrl}perfil-page.html?tipo=${entityType}&id=${entityId}`;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(profileUrl)}`;
    
    return `
      <div class="qr-section animate-in">
        <div class="qr-card">
          <p class="qr-title">QR Code do Perfil</p>
          <img class="qr-code-img" src="${qrApiUrl}" alt="QR Code"/>
          <button class="btn-download-qr" onclick="ProfilePremium.downloadQR('${qrApiUrl}', 'qr-${entityType}-${entityId}.png')">
            Baixar QR Code
          </button>
        </div>
      </div>
    `;
  }
  
  function renderTeamList(members) {
    if (!members || !members.length) return '';
    
    return `
      <h2 class="section-title">Equipe</h2>
      <ul class="team-list animate-in">
        ${members.map(member => `
          <li class="team-item" onclick="ProfilePremium.navigateToProfile('profissional', '${member.id}')">
            ${member.avatar_url 
              ? `<img class="team-avatar" src="${escapeHtml(member.avatar_url)}" alt=""/>`
              : `<div class="team-avatar-fallback">${getInitials(member.name)}</div>`
            }
            <div class="team-info">
              <span class="team-name">${escapeHtml(member.name)}</span>
              ${member.avg_rating ? `<span class="team-rating">⭐ ${Number(member.avg_rating).toFixed(1)} · ${member.total_reviews || 0} avaliações</span>` : ''}
            </div>
          </li>
        `).join('')}
      </ul>
    `;
  }
  
  function renderError(message) {
    return `
      <div class="error-state">
        <h2>Ops! Algo deu errado</h2>
        <p>${escapeHtml(message)}</p>
        <button class="btn-primary" onclick="history.back()" style="width:auto;padding:12px 32px;">Voltar</button>
      </div>
    `;
  }
  
  // Main render function
  async function renderProfile(tipo, id) {
    const container = document.getElementById('perfilContainer');
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    try {
      // Fetch data based on type
      let data;
      if (tipo === 'profissional') {
        const response = await fetch(`/api/professional/${id}`);
        if (!response.ok) throw new Error('Profissional não encontrado');
        data = await response.json();
      } else if (tipo === 'estabelecimento') {
        const response = await fetch(`/api/establishment/${id}`);
        if (!response.ok) throw new Error('Estabelecimento não encontrado');
        data = await response.json();
      } else {
        throw new Error('Tipo inválido');
      }
      
      // Render based on type
      if (tipo === 'profissional') {
        const heroImage = data.photos?.[0] || data.avatar_url || 'https://images.unsplash.com/photo-1585747860715-2fc5b7e7d8c5?w=800&q=80';
        const specialty = data.specialty || data.profile?.specialty || 'Profissional';
        const location = data.current_establishment?.name || 'Autônomo';
        
        container.innerHTML = `
          ${renderHeader(data.name)}
          ${renderHero(heroImage, data.verified)}
          ${renderProfileInfo(data.name, specialty, location)}
          ${renderStats(data.avg_rating, data.total_reviews, data.proofly_score)}
          ${renderActionButtons()}
          ${renderRankingCard(data.proofly_score)}
          ${renderRatingChart(data.reviews || [])}
          ${renderTags(data.tags)}
          <h2 class="section-title">Avaliações</h2>
          ${renderReviews(data.reviews || [], 0)}
          ${renderContactSection(data.contact)}
          ${renderQRCode('profissional', id)}
        `;
      } else {
        const heroImage = data.photos?.[0] || data.avatar_url || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80';
        const subtitle = data.type || 'Estabelecimento';
        const location = [data.neighborhood, data.city].filter(Boolean).join(', ');
        
        container.innerHTML = `
          ${renderHeader(data.name)}
          ${renderHero(heroImage, data.verified)}
          ${renderProfileInfo(data.name, subtitle, location)}
          ${renderStats(data.avg_rating, data.total_reviews, data.proofly_score)}
          ${renderActionButtons()}
          ${renderRankingCard(data.proofly_score)}
          ${renderRatingChart(data.reviews || [])}
          ${renderTeamList(data.team_members || [])}
          <h2 class="section-title">Avaliações</h2>
          ${renderReviews(data.reviews || [], 0)}
          ${renderContactSection(data.contact)}
          ${renderQRCode('estabelecimento', id)}
        `;
      }
      
      // Hide loading
      loadingOverlay.classList.add('is-hidden');
      
    } catch (error) {
      console.error('Error loading profile:', error);
      container.innerHTML = renderError(error.message);
      loadingOverlay.classList.add('is-hidden');
    }
  }
  
  // Initialize from URL params
  function initFromURL() {
    const params = new URLSearchParams(window.location.search);
    const tipo = params.get('tipo');
    const id = params.get('id');
    
    if (tipo && id) {
      renderProfile(tipo, id);
    } else {
      const container = document.getElementById('perfilContainer');
      const loadingOverlay = document.getElementById('loadingOverlay');
      container.innerHTML = renderError('Perfil não especificado');
      loadingOverlay.classList.add('is-hidden');
    }
  }
  
  // Expose global API
  window.ProfilePremium = {
    shareProfile: async function() {
      const url = window.location.href;
      const title = document.title;
      
      if (navigator.share) {
        try {
          await navigator.share({ title, url });
          return;
        } catch (err) {
          if (err.name !== 'AbortError') console.error(err);
        }
      }
      
      try {
        await navigator.clipboard.writeText(url);
        alert('✅ Link copiado!');
      } catch {
        prompt('Copie o link:', url);
      }
    },
    
    hireProfessional: function() {
      alert('Funcionalidade de contratação em desenvolvimento!');
    },
    
    downloadQR: function(url, filename) {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.target = '_blank';
      a.click();
    },
    
    loadReviews: function(page) {
      currentPage = page;
      // Re-render with new page
      const params = new URLSearchParams(window.location.search);
      renderProfile(params.get('tipo'), params.get('id'));
    },
    
    navigateToProfile: function(tipo, id) {
      window.location.href = `perfil-page.html?tipo=${tipo}&id=${id}`;
    }
  };
  
  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFromURL);
  } else {
    initFromURL();
  }
})();
