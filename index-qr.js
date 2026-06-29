// =====================================================
// Ranking Pro — Home (redirects QR/deep-link apenas)
// Scanner QR fica só em cliente.html
// =====================================================

(function() {
  const params = new URLSearchParams(window.location.search);
  const profId = params.get('professionalId') || params.get('professional_id');
  const estId = params.get('establishmentId') || params.get('establishment_id');
  const token = params.get('token') || params.get('qr_token');

  if (token && !profId && !estId) {
    window.location.replace('./qr/?token=' + encodeURIComponent(token));
    return;
  }

  if (profId || estId) {
    let dest;
    if (typeof window.RankingProQR?.buildProfileBuscaUrl === 'function') {
      dest = profId
        ? window.RankingProQR.buildProfileBuscaUrl('professional', profId, { token: token || undefined })
        : window.RankingProQR.buildProfileBuscaUrl('establishment', estId, { token: token || undefined });
    } else {
      const url = new URL('./cliente.html', window.location.href);
      if (profId) url.searchParams.set('professionalId', profId);
      if (estId) url.searchParams.set('establishmentId', estId);
      if (token) url.searchParams.set('token', token);
      dest = url.href;
    }
    if (params.get('qr') === '1' || params.get('verified') === 'qr') {
      const withFlags = new URL(dest, window.location.href);
      if (params.get('qr') === '1') withFlags.searchParams.set('qr', '1');
      if (params.get('verified') === 'qr') withFlags.searchParams.set('verified', 'qr');
      dest = withFlags.href;
    }
    window.location.replace(dest);
  }
})();