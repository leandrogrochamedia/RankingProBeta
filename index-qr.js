// Ranking Pro — Home entry (QR / deep-link → qr-flow canônico)
(function () {
  'use strict';
  if (typeof RankingProQrFlow !== 'undefined' && RankingProQrFlow.handleIndexEntry()) return;

  const params = new URLSearchParams(window.location.search);
  const profId = params.get('professionalId') || params.get('professional_id');
  const estId = params.get('establishmentId') || params.get('establishment_id');
  const token = params.get('token') || params.get('qr_token');

  if (token && !profId && !estId) {
    window.location.replace('./qr/?token=' + encodeURIComponent(token));
    return;
  }

  if (profId || estId) {
    const url = new URL('./cliente.html', window.location.href);
    if (profId) url.searchParams.set('professionalId', profId);
    if (estId) url.searchParams.set('establishmentId', estId);
    if (token) url.searchParams.set('token', token);
    if (params.get('qr') === '1') url.searchParams.set('qr', '1');
    if (params.get('verified') === 'qr') url.searchParams.set('verified', 'qr');
    window.location.replace(url.href);
  }
})();