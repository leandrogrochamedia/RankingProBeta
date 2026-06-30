// /p/ e /e/ — boot público usando ProfilePremium (mesmo visual do perfil-page)

(function (global) {
  'use strict';

  const MENU_HOME = '../buscar.html';

  function showLoading(root, show) {
    const el = root.querySelector('#state-loading');
    if (el) el.classList.toggle('passaporte-hidden', !show);
  }

  function showError(root) {
    root.querySelector('#state-loading')?.classList.add('passaporte-hidden');
    root.querySelector('#state-content')?.classList.add('passaporte-hidden');
    root.querySelector('#state-error')?.classList.remove('passaporte-hidden');
  }

  function renderInto(root, html) {
    const content = root.querySelector('#state-content');
    if (!content) return;
    content.innerHTML = html;
    ProfilePremium.mountQr(content);
    root.querySelector('#state-loading')?.classList.add('passaporte-hidden');
    root.querySelector('#state-error')?.classList.add('passaporte-hidden');
    content.classList.remove('passaporte-hidden');
  }

  async function bootProfessional(root, profId) {
    if (!profId || !global.RankingProProfile || !global.ProfilePremium) {
      showError(root);
      return;
    }

    showLoading(root, true);

    try {
      const P = global.RankingProProfile;
      const prof = await P.getProfessionalById(profId);
      if (!prof) {
        showError(root);
        return;
      }

      const reviews = await P.getReviewsForProfessional(prof.id);
      const verifiedReviews = (reviews || []).filter(P.isReviewVerified);
      const hasVerified = verifiedReviews.length > 0;

      let avgRating = Number(prof.avg_rating) || 0;
      if (hasVerified) {
        avgRating = verifiedReviews.reduce((s, r) => s + Number(r.rating || 0), 0) / verifiedReviews.length;
      }
      const totalReviews = hasVerified
        ? verifiedReviews.length
        : (Number(prof.total_reviews) || 0);
      const reviewsForList = hasVerified ? verifiedReviews : (reviews || []);

      const html = ProfilePremium.renderProfessional({
        prof,
        avgRating,
        totalReviews,
        prooflyScore: P.quickScoreFromAvg(avgRating),
        clientReviews: reviewsForList,
        hasVerified,
        menuHref: MENU_HOME,
        sharkOn: true,
        publicMode: true,
        contact: {
          bio: prof.profile?.bio || prof.bio || '',
          wa: P.whatsappUrl(prof.phone),
          ig: P.instagramUrl(prof.profile?.instagram)
        }
      });

      renderInto(root, html);
      document.title = `${prof.name} — Passaporte Ranking Pro`;
    } catch (err) {
      console.error(err);
      showError(root);
    }
  }

  async function bootEstablishment(root, estId) {
    if (!estId || !global.RankingProProfile || !global.ProfilePremium) {
      showError(root);
      return;
    }

    showLoading(root, true);

    try {
      const P = global.RankingProProfile;
      const estab = await P.getEstablishmentById(estId);
      if (!estab) {
        showError(root);
        return;
      }

      const [team, reviews] = await Promise.all([
        P.getTeamForEstablishment(estId),
        P.getReviewsForEstablishment(estId)
      ]);

      const teamStats = P.computeTeamStats(team);
      const address = P.formatEstablishmentAddress(estab);
      const mapsUrl = P.mapsUrlForEstablishment(estab);
      const verifiedReviews = (reviews || []).filter(P.isReviewVerified);
      const verifiedPct = reviews.length
        ? Math.round((verifiedReviews.length / reviews.length) * 100)
        : 0;
      const avgRating = Number(estab.avg_rating) || 0;
      const totalReviews = Number(estab.total_reviews) || reviews.length || 0;

      const html = ProfilePremium.renderEstablishment({
        estab,
        avgRating,
        totalReviews,
        prooflyScore: P.quickScoreFromAvg(avgRating),
        teamMembers: team || [],
        teamStats,
        reviews: reviews || [],
        verifiedPct,
        menuHref: MENU_HOME,
        sharkOn: true,
        publicMode: true,
        address,
        mapsUrl,
        contact: {
          wa: P.whatsappUrl(estab.phone),
          ig: null
        }
      });

      renderInto(root, html);
      document.title = `${estab.name} — Vitrine Ranking Pro`;
    } catch (err) {
      console.error(err);
      showError(root);
    }
  }

  global.PassaporteLanding = {
    bootProfessional,
    bootEstablishment
  };
})(window);