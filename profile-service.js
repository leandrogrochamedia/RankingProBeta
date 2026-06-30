// Ranking Pro — public profile data (Proofly: id + avg_rating)

(function (global) {
  'use strict';

  const API = () => global.RankingProAPI;

  async function getProfessionalById(id) {
    const rows = await API().select(
      'professionals',
      '?id=eq.' + encodeURIComponent(id) +
        '&select=id,name,specialty,bio,phone,avatar_url,avg_rating,total_reviews,gallery_urls,' +
        'profile:professional_profiles(bio,specialty,instagram),' +
        'current_establishment:establishments!professionals_current_establishment_id_fkey(id,name,city)&limit=1'
    );
    return rows?.[0] || null;
  }

  async function getEstablishmentById(id) {
    const rows = await API().select(
      'establishments',
      '?id=eq.' + encodeURIComponent(id) +
        '&select=id,name,type,phone,address,street,number,neighborhood,city,state,country,' +
        'avatar_url,avg_rating,total_reviews,gallery_urls&limit=1'
    );
    return rows?.[0] || null;
  }

  async function getTeamForEstablishment(establishmentId) {
    return API().select(
      'professionals',
      '?current_establishment_id=eq.' + encodeURIComponent(establishmentId) +
        '&select=id,name,avatar_url,avg_rating,total_reviews,' +
        'profile:professional_profiles(specialty)&order=avg_rating.desc'
    );
  }

  function formatEstablishmentAddress(est) {
    if (!est) return '';
    if (est.address) return String(est.address).trim();
    return [
      est.street,
      est.number,
      est.neighborhood,
      est.city,
      est.state,
      est.country
    ].filter(Boolean).join(', ');
  }

  function formatEstablishmentLocation(est) {
    if (!est) return '';
    const parts = [est.neighborhood, est.city].filter(Boolean);
    return parts.join(', ');
  }

  function mapsUrlForEstablishment(est) {
    const q = formatEstablishmentAddress(est);
    if (!q) return null;
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
  }

  function computeTeamStats(team) {
    const list = team || [];
    if (!list.length) return { avg: 0, totalReviews: 0 };
    let weightedSum = 0;
    let weightTotal = 0;
    list.forEach(p => {
      const tr = Number(p.total_reviews) || 0;
      const ar = Number(p.avg_rating) || 0;
      if (tr > 0) {
        weightedSum += ar * tr;
        weightTotal += tr;
      }
    });
    if (weightTotal > 0) {
      return { avg: weightedSum / weightTotal, totalReviews: weightTotal };
    }
    const rated = list.filter(p => Number(p.avg_rating) > 0);
    const avg = rated.length
      ? rated.reduce((s, p) => s + Number(p.avg_rating), 0) / rated.length
      : 0;
    return { avg, totalReviews: 0 };
  }

  function whatsappUrl(phone) {
    const digits = String(phone || '').replace(/\D/g, '');
    if (!digits) return null;
    const n = digits.startsWith('55') ? digits : '55' + digits;
    return 'https://wa.me/' + n;
  }

  function instagramUrl(handle) {
    const h = String(handle || '').replace(/^@/, '').trim();
    return h ? 'https://instagram.com/' + encodeURIComponent(h) : null;
  }

  async function getReviewsForProfessional(professionalId) {
    return API().select(
      'reviews',
      '?professional_id=eq.' + encodeURIComponent(professionalId) +
        '&review_type=eq.client_to_professional' +
        '&select=rating,comment,verified,is_verified,created_at&order=created_at.desc'
    );
  }

  async function getReviewsForEstablishment(establishmentId) {
    return API().select(
      'reviews',
      '?establishment_id=eq.' + encodeURIComponent(establishmentId) +
        '&review_type=eq.client_to_establishment' +
        '&select=rating,comment,verified,is_verified,created_at&order=created_at.desc'
    );
  }

  function quickScoreFromAvg(avg) {
    const n = Number(avg) || 0;
    return n > 0 ? Math.round((n / 5) * 100) : 0;
  }

  function isReviewVerified(review) {
    return !!(review?.is_verified ?? review?.verified);
  }

  function formatRelativeDate(iso) {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return diffDays + ' dias atrás';
    if (diffDays < 30) return Math.floor(diffDays / 7) + ' sem. atrás';
    if (diffDays < 365) return Math.floor(diffDays / 30) + ' mês(es) atrás';
    return Math.floor(diffDays / 365) + ' ano(s) atrás';
  }

  function renderStars(rating) {
    const full = Math.round(rating);
    let html = '';
    for (let i = 1; i <= 5; i++) {
      html += '<span class="star' + (i <= full ? ' filled' : '') + '" aria-hidden="true">★</span>';
    }
    return html;
  }

  function formatRatingDisplay(avg, total) {
    const n = Number(avg) || 0;
    const count = Number(total) || 0;
    const label = count === 1 ? '1 avaliação' : count + ' avaliações';
    return n.toFixed(1) + ' · ' + label;
  }

  global.RankingProProfile = {
    getProfessionalById,
    getEstablishmentById,
    getTeamForEstablishment,
    getReviewsForProfessional,
    getReviewsForEstablishment,
    quickScoreFromAvg,
    isReviewVerified,
    formatRelativeDate,
    renderStars,
    formatRatingDisplay,
    formatEstablishmentAddress,
    formatEstablishmentLocation,
    mapsUrlForEstablishment,
    computeTeamStats,
    whatsappUrl,
    instagramUrl
  };
})(window);