// Ranking Pro — public profile data (Proofly: id + avg_rating)

(function (global) {
  'use strict';

  const API = () => global.RankingProAPI;

  async function getProfessionalById(id) {
    const rows = await API().select(
      'professionals',
      '?id=eq.' + encodeURIComponent(id) +
        '&select=id,name,specialty,avatar_url,avg_rating,total_reviews&limit=1'
    );
    return rows?.[0] || null;
  }

  async function getReviewsForProfessional(professionalId) {
    return API().select(
      'reviews',
      '?professional_id=eq.' + encodeURIComponent(professionalId) +
        '&review_type=eq.client_to_professional' +
        '&select=rating,comment,verified,is_verified,created_at&order=created_at.desc'
    );
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
    getReviewsForProfessional,
    isReviewVerified,
    formatRelativeDate,
    renderStars,
    formatRatingDisplay
  };
})(window);