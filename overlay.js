// ============================================================
// Ranking Pro — Overlay unificado (wrapper fino sobre confirm-modal)
// ============================================================

(function () {
  'use strict';

  let qrScannerInstance = null;
  let qrScannerOverlay = null;
  let styleOnboardingOverlay = null;

  function closeGenericSheet(overlay, onClose) {
    if (!overlay) return;
    overlay.classList.add('closing');
    document.body.style.overflow = '';
    setTimeout(function () {
      if (overlay.parentNode) overlay.remove();
      if (typeof onClose === 'function') onClose();
    }, 200);
  }

  function sheet(html, opts) {
    const options = opts || {};
    const overlay = document.createElement('div');
    overlay.className = 'rp-overlay rp-overlay--sheet hiring-modal';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    const backdrop = document.createElement('div');
    backdrop.className = 'hiring-modal-backdrop rp-overlay-backdrop';

    const panel = document.createElement('div');
    panel.className = 'rp-overlay-panel hiring-modal-sheet glass-surface';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'hiring-modal-close rp-overlay-close';
    closeBtn.setAttribute('aria-label', 'Fechar');
    closeBtn.textContent = '✕';

    if (options.title) {
      const title = document.createElement('h2');
      title.className = 'hiring-modal-title rp-overlay-title';
      title.id = 'hiringModalTitle';
      title.textContent = options.title;
      panel.appendChild(title);
    }

    const body = document.createElement('div');
    body.className = 'rp-overlay-sheet-body';
    body.innerHTML = html || '';

    panel.appendChild(closeBtn);
    panel.appendChild(body);
    overlay.appendChild(backdrop);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    function close() {
      closeGenericSheet(overlay, options.onClose);
    }

    closeBtn.addEventListener('click', close);
    backdrop.addEventListener('click', close);

    return { close: close, el: overlay, body: body };
  }

  function closeQrScanner() {
    if (qrScannerInstance) {
      qrScannerInstance.stop()
        .then(function () { qrScannerInstance.clear(); qrScannerInstance = null; })
        .catch(function (err) { console.warn('Erro ao parar scanner:', err); });
    }
    if (qrScannerOverlay) {
      qrScannerOverlay.classList.remove('open');
      if (qrScannerOverlay.parentNode) qrScannerOverlay.remove();
      qrScannerOverlay = null;
    }
    document.body.style.overflow = '';
  }

  function iniciarQrScanner(onScan) {
    const status = document.getElementById('qrScannerStatus');
    if (qrScannerInstance) {
      qrScannerInstance.clear();
      qrScannerInstance = null;
    }
    qrScannerInstance = new Html5Qrcode('qr-reader');
    const config = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 };
    qrScannerInstance.start({ facingMode: 'environment' }, config,
      function (decodedText) {
        if (status) status.textContent = '✅ QR Code lido! Redirecionando...';
        closeQrScanner();
        if (typeof onScan === 'function') {
          onScan(decodedText);
          return;
        }
        const norm = typeof window.normalizarUrlQr === 'function'
          ? window.normalizarUrlQr(decodedText)
          : decodedText;
        if (norm) window.location.href = norm;
      },
      function () { /* noop */ }
    ).then(function () {
      if (status) status.textContent = '✅ Câmera ativa. Aponte para o QR Code.';
    }).catch(function (err) {
      if (status) status.textContent = '❌ Erro ao acessar câmera: ' + err;
      console.error(err);
    });
  }

  function openQrScanner(opts) {
    const options = opts || {};
    if (qrScannerOverlay) return { close: closeQrScanner };

    const overlay = document.createElement('div');
    overlay.className = 'qr-modal qr-modal--cliente open';
    overlay.id = 'qrScannerContainer';
    overlay.innerHTML = [
      '<div class="qr-modal-backdrop"></div>',
      '<div class="qr-modal-content">',
      '  <div class="qr-modal-header">',
      '    <h3>📷 Escanear QR Code</h3>',
      '    <button type="button" class="qr-modal-close" aria-label="Fechar">✕</button>',
      '  </div>',
      '  <div class="scanner-box" id="qrScannerBox">',
      '    <div id="qr-reader"></div>',
      '  </div>',
      '  <p id="qrScannerStatus" class="qr-status">Iniciando câmera...</p>',
      '</div>'
    ].join('');
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    qrScannerOverlay = overlay;

    overlay.querySelector('.qr-modal-backdrop').addEventListener('click', closeQrScanner);
    overlay.querySelector('.qr-modal-close').addEventListener('click', closeQrScanner);

    function bootScanner() {
      iniciarQrScanner(options.onScan);
    }

    if (typeof Html5Qrcode === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
      script.onload = bootScanner;
      document.head.appendChild(script);
    } else {
      bootScanner();
    }

    return { close: closeQrScanner };
  }

  function closeStyleOnboarding() {
    if (styleOnboardingOverlay) {
      styleOnboardingOverlay.style.display = 'none';
      if (styleOnboardingOverlay.parentNode) styleOnboardingOverlay.remove();
      styleOnboardingOverlay = null;
    }
    document.body.style.overflow = '';
  }

  function openStyleOnboarding(opts) {
    const options = opts || {};
    if (styleOnboardingOverlay) {
      styleOnboardingOverlay.style.display = 'flex';
      if (typeof options.onOpen === 'function') options.onOpen();
      return { close: closeStyleOnboarding, el: styleOnboardingOverlay };
    }

    const overlay = document.createElement('div');
    overlay.id = 'styleOnboardingModal';
    overlay.className = 'style-onboarding-modal';
    overlay.style.display = 'flex';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'styleOnboardingTitle');
    overlay.innerHTML = [
      '<div class="style-onboarding-backdrop"></div>',
      '<div class="style-onboarding-sheet">',
      '  <button type="button" class="style-onboarding-close" aria-label="Fechar">✕</button>',
      '  <h2 id="styleOnboardingTitle">O que combina com você?</h2>',
      '  <p class="style-onboarding-sub">Escolha até 5 preferências — o Ranking Pro personaliza seus matches e destaca quem tem afinidade com você.</p>',
      '  <div class="style-onboarding-section">',
      '    <h3>👤 Profissionais</h3>',
      '    <div id="onboardingProfChips" class="style-onboarding-chips"></div>',
      '  </div>',
      '  <div class="style-onboarding-section">',
      '    <h3>🏢 Lugares <span class="optional">(opcional, até 3)</span></h3>',
      '    <div id="onboardingEstChips" class="style-onboarding-chips"></div>',
      '  </div>',
      '  <p id="onboardingSelectionHint" class="style-onboarding-hint">0 selecionadas</p>',
      '  <button type="button" class="btn btn-tinder-primary btn-tinder-xl" id="btnSalvarEstilo">✨ Salvar e ver recomendações</button>',
      '  <button type="button" class="style-onboarding-skip" id="btnPularEstilo">Agora não</button>',
      '</div>'
    ].join('');
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    styleOnboardingOverlay = overlay;

    overlay.querySelector('.style-onboarding-backdrop').addEventListener('click', closeStyleOnboarding);
    overlay.querySelector('.style-onboarding-close').addEventListener('click', closeStyleOnboarding);
    overlay.querySelector('#btnSalvarEstilo').addEventListener('click', function () {
      if (typeof window.salvarOnboardingEstilo === 'function') window.salvarOnboardingEstilo();
    });
    overlay.querySelector('#btnPularEstilo').addEventListener('click', function () {
      if (typeof window.pularOnboardingEstilo === 'function') window.pularOnboardingEstilo();
    });

    if (typeof options.onOpen === 'function') options.onOpen();

    return { close: closeStyleOnboarding, el: overlay };
  }

  window.openQrScanner = openQrScanner;
  window.fecharScannerQR = closeQrScanner;
  window.openStyleOnboarding = openStyleOnboarding;
  window.fecharOnboardingEstilo = closeStyleOnboarding;

  window.RankingProOverlay = {
    alert: function (title, message, options) {
      return typeof showAlert === 'function' ? showAlert(title, message, options) : Promise.resolve();
    },
    confirm: function (options) {
      return typeof showConfirm === 'function' ? showConfirm(options) : Promise.resolve(false);
    },
    sheet: sheet,
    qrScanner: openQrScanner,
    styleOnboarding: openStyleOnboarding
  };
})();