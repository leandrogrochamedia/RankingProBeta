// Ranking Pro — Home QR (entrada + scanner)

(function () {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  const profId = params.get('professionalId') || params.get('professional_id');
  const estId = params.get('establishmentId') || params.get('establishment_id');
  const token = params.get('token') || params.get('qr_token');

  function sitePath(path) {
    return (typeof RankingProPaths !== 'undefined')
      ? RankingProPaths.siteUrl(path)
      : './' + path;
  }

  if (token && !profId && !estId) {
    window.location.replace(sitePath('qr/?token=' + encodeURIComponent(token)));
    return;
  }

  if (profId || estId) {
    const dest = new URL(sitePath('cliente.html'), window.location.href);
    if (profId) dest.searchParams.set('professionalId', profId);
    if (estId) dest.searchParams.set('establishmentId', estId);
    if (token) dest.searchParams.set('token', token);
    window.location.replace(dest.pathname + dest.search);
    return;
  }

  let qrScanner = null;

  function abrirScannerQR() {
    const container = document.getElementById('qrScannerContainer');
    if (!container) return;
    container.classList.add('open');
    document.body.style.overflow = 'hidden';
    const status = document.getElementById('qrScannerStatus');
    if (status) status.textContent = 'Iniciando câmera...';
    if (typeof Html5Qrcode === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
      script.onload = iniciarScanner;
      document.head.appendChild(script);
    } else {
      iniciarScanner();
    }
  }

  function normalizarUrlQr(raw) {
    const text = (raw || '').trim();
    if (!text) return null;
    try {
      const url = new URL(text, window.location.origin);
      const p = url.searchParams;
      const tok = p.get('token') || p.get('qr_token');
      if (tok) {
        return sitePath('qr/?token=' + encodeURIComponent(tok));
      }
      const pid = p.get('professionalId') || p.get('professional_id');
      const eid = p.get('establishmentId') || p.get('establishment_id');
      if (pid || eid) {
        const dest = new URL(sitePath('cliente.html'), window.location.href);
        if (pid) dest.searchParams.set('professionalId', pid);
        if (eid) dest.searchParams.set('establishmentId', eid);
        if (tok) dest.searchParams.set('token', tok);
        return dest.pathname + dest.search;
      }
      if (url.pathname.includes('/qr')) {
        const t = p.get('token');
        if (t) return sitePath('qr/?token=' + encodeURIComponent(t));
      }
      return url.pathname + url.search + url.hash;
    } catch {
      return text;
    }
  }

  function iniciarScanner() {
    const status = document.getElementById('qrScannerStatus');
    if (qrScanner) { qrScanner.clear(); qrScanner = null; }
    qrScanner = new Html5Qrcode('qr-reader');
    const config = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 };
    qrScanner.start({ facingMode: 'environment' }, config,
      function (decodedText) {
        if (status) status.textContent = 'QR Code lido! Redirecionando...';
        fecharScannerQR();
        const target = normalizarUrlQr(decodedText);
        if (target) window.location.href = target;
      },
      function () {}
    ).then(function () {
      if (status) status.textContent = 'Câmera ativa. Aponte para o QR Code.';
    }).catch(function (err) {
      if (status) status.textContent = 'Erro ao acessar câmera: ' + err;
      console.error(err);
    });
  }

  function fecharScannerQR() {
    const container = document.getElementById('qrScannerContainer');
    if (container) container.classList.remove('open');
    document.body.style.overflow = '';
    if (qrScanner) {
      qrScanner.stop().then(function () {
        qrScanner.clear();
        qrScanner = null;
      }).catch(function (err) { console.warn('Erro ao parar scanner:', err); });
    }
  }

  window.abrirScannerQR = abrirScannerQR;
  window.fecharScannerQR = fecharScannerQR;

  document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('btnScanQr');
    if (btn) btn.addEventListener('click', abrirScannerQR);
  });
})();