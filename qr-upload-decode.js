// =====================================================
// Ranking Pro — QR via upload de imagem (debug / desktop)
// Decodifica barcode sem usar câmera (html5-qrcode scanFile)
// =====================================================

(function() {
  'use strict';

  const LIB_URL = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
  let libPromise = null;

  function sitePath(path) {
    const p = String(path || '').replace(/^\.\//, '');
    if (typeof RankingProPaths !== 'undefined' && typeof RankingProPaths.siteUrl === 'function') {
      return RankingProPaths.siteUrl(p);
    }
    return './' + p;
  }

  function absoluteUrl(relativePath) {
    return new URL(relativePath, window.location.href).href;
  }

  function buildClienteBuscaUrl(professionalId, establishmentId, token) {
    if (typeof window.RankingProQR?.buildProfileBuscaUrl === 'function') {
      if (professionalId && !establishmentId) {
        return window.RankingProQR.buildProfileBuscaUrl('professional', professionalId, { token });
      }
      if (establishmentId && !professionalId) {
        return window.RankingProQR.buildProfileBuscaUrl('establishment', establishmentId, { token });
      }
    }
    const dest = new URL(sitePath('cliente.html'), window.location.href);
    if (professionalId) dest.searchParams.set('professionalId', professionalId);
    if (establishmentId) dest.searchParams.set('establishmentId', establishmentId);
    if (token) dest.searchParams.set('token', token);
    return dest.href;
  }

  function extractEntityIds(url) {
    const p = url.searchParams;
    let professionalId = p.get('professionalId') || p.get('professional_id');
    let establishmentId = p.get('establishmentId') || p.get('establishment_id');
    const token = p.get('token') || p.get('qr_token');
    const path = url.pathname || '';

    if (!professionalId && !establishmentId && (/\/p\/?$/.test(path) || path.includes('/p/'))) {
      const pId = p.get('id');
      if (pId) professionalId = pId;
    }

    if (path.includes('perfil-page.html')) {
      const id = p.get('id');
      const tipo = (p.get('tipo') || p.get('type') || '').toLowerCase();
      if (id) {
        if (tipo === 'estabelecimento' || tipo === 'establishment') establishmentId = id;
        else professionalId = id;
      }
    }

    return { professionalId, establishmentId, token };
  }

  function normalizarUrlQr(raw) {
    const text = (raw || '').trim();
    if (!text) return null;

    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text)) {
      return absoluteUrl(sitePath('qr/?token=' + encodeURIComponent(text)));
    }

    try {
      const url = new URL(text, window.location.origin);
      const { professionalId, establishmentId, token } = extractEntityIds(url);

      if (professionalId || establishmentId) {
        return buildClienteBuscaUrl(professionalId, establishmentId, token);
      }

      if (url.pathname.includes('/qr') && token) {
        return absoluteUrl(sitePath('qr/?token=' + encodeURIComponent(token)));
      }

      if (token) {
        return absoluteUrl(sitePath('qr/?token=' + encodeURIComponent(token)));
      }

      if (url.protocol === 'http:' || url.protocol === 'https:') {
        return url.href;
      }
      return text;
    } catch {
      return text;
    }
  }

  function loadHtml5Qrcode() {
    if (typeof Html5Qrcode !== 'undefined') return Promise.resolve();
    if (libPromise) return libPromise;
    libPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = LIB_URL;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Não foi possível carregar o leitor QR.'));
      document.head.appendChild(script);
    });
    return libPromise;
  }

  async function decodeQrFromImageFile(file) {
    await loadHtml5Qrcode();
    return Html5Qrcode.scanFile(file, false);
  }

  /** TESTE — modal com o link antes de redirecionar. Desligar quando validar fluxo. */
  const QR_REDIRECT_PREVIEW = true;

  let pendingQrDecoded = null;
  let pendingQrTarget = null;

  async function confirmAndRedirect(raw) {
    const target = normalizarUrlQr(raw);
    if (!target) return false;

    if (QR_REDIRECT_PREVIEW) {
      const confirmFn = typeof showGlassConfirm === 'function'
        ? showGlassConfirm
        : (typeof showConfirm === 'function' ? showConfirm : null);
      if (confirmFn) {
        const ok = await confirmFn({
          title: '🔗 Link do QR',
          message: `Destino:\n\n${target}`,
          confirmText: 'Abrir link',
          cancelText: 'Cancelar'
        });
        if (!ok) return false;
      } else if (!window.confirm(`Abrir?\n\n${target}`)) {
        return false;
      }
    }

    window.location.href = target;
    return true;
  }

  function redirectFromQrDecoded(raw) {
    const target = normalizarUrlQr(raw);
    if (!target) return false;
    window.location.href = target;
    return true;
  }

  function setHint(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function setQrGoVisible(visible) {
    const goBtn = document.getElementById('qrGoBtn');
    if (goBtn) goBtn.hidden = !visible;
  }

  function setQrDecodePanelVisible(visible) {
    const panel = document.getElementById('qrDecodePanel');
    if (panel) panel.hidden = !visible;
  }

  function renderQrDecodePanel(raw, target) {
    const rawEl = document.getElementById('qrDecodeRaw');
    const targetEl = document.getElementById('qrDecodeTarget');
    if (rawEl) rawEl.textContent = raw || '—';
    if (targetEl) {
      targetEl.textContent = target || '—';
      targetEl.href = target || '#';
    }
    setQrDecodePanelVisible(true);
    const panel = document.getElementById('qrDecodePanel');
    if (panel) {
      requestAnimationFrame(() => {
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  }

  function resetQrUploadState() {
    pendingQrDecoded = null;
    pendingQrTarget = null;
    setQrGoVisible(false);
    setQrDecodePanelVisible(false);
  }

  async function handleQrImageFile(file) {
    const status = document.getElementById('qrScannerStatus');
    const preview = document.getElementById('qrUploadPreview');
    resetQrUploadState();
    if (!file) return;
    if (!file.type?.startsWith('image/')) {
      setHint('qrUploadHint', 'Escolha uma imagem PNG ou JPG com o QR visível');
      return;
    }
    if (preview) {
      preview.src = URL.createObjectURL(file);
      preview.hidden = false;
    }
    setHint('qrUploadHint', 'Lendo barcode na imagem...');
    if (status) status.textContent = 'Lendo imagem do QR...';
    try {
      const decoded = await decodeQrFromImageFile(file);
      const target = normalizarUrlQr(decoded);
      if (!target) {
        setHint('qrUploadHint', 'QR lido, mas o link não foi reconhecido. Tente outra imagem.');
        if (status) status.textContent = '❌ Link não reconhecido.';
        return;
      }
      pendingQrDecoded = decoded;
      pendingQrTarget = target;
      setQrGoVisible(true);
      setQrDecodePanelVisible(false);
      setHint('qrUploadHint', 'Barcode lido — toque em Ir para conferir o link');
      if (status) status.textContent = '✅ QR lido! Toque em Ir no card.';
    } catch (err) {
      console.warn('decodeQrFromImageFile:', err);
      setHint('qrUploadHint', 'Não encontramos QR nesta imagem — tente outra foto');
      if (status) status.textContent = '❌ QR não detectado na imagem.';
    }
  }

  function handleQrGo() {
    if (!pendingQrDecoded || !pendingQrTarget) {
      setHint('qrUploadHint', 'Envie uma imagem do QR primeiro.');
      return;
    }
    if (typeof window.fecharScannerQR === 'function') window.fecharScannerQR();
    renderQrDecodePanel(pendingQrDecoded, pendingQrTarget);
    setHint('qrUploadHint', 'Confira o link abaixo — se estiver certo, toque em Abrir link.');
  }

  async function handleQrConfirmOpen() {
    if (!pendingQrDecoded) {
      setHint('qrUploadHint', 'Nenhum QR carregado.');
      return;
    }
    const ok = await confirmAndRedirect(pendingQrDecoded);
    if (!ok) {
      setHint('qrUploadHint', 'Cancelado — o link continua visível acima para conferir.');
    }
  }

  function bindQrUploadPanel() {
    const panel = document.getElementById('qrUploadPanel');
    if (!panel || panel.dataset.bound === '1') return;
    panel.dataset.bound = '1';

    const input = document.getElementById('qrUploadInput');
    const btn = document.getElementById('qrUploadBtn');
    const goBtn = document.getElementById('qrGoBtn');
    const confirmOpenBtn = document.getElementById('qrConfirmOpenBtn');
    const decodeCloseBtn = document.getElementById('qrDecodeCloseBtn');

    btn?.addEventListener('click', (e) => {
      e.preventDefault();
      input?.click();
    });
    input?.addEventListener('change', async () => {
      const file = input.files?.[0];
      input.value = '';
      await handleQrImageFile(file);
    });
    goBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      handleQrGo();
    });
    confirmOpenBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      handleQrConfirmOpen();
    });
    decodeCloseBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      setQrDecodePanelVisible(false);
      setHint('qrUploadHint', 'Painel fechado — toque em Ir de novo para rever o link.');
    });
  }

  window.QrUploadDecode = {
    loadHtml5Qrcode,
    normalizarUrlQr,
    decodeQrFromImageFile,
    redirectFromQrDecoded,
    confirmAndRedirect,
    bindQrUploadPanel,
    handleQrImageFile
  };
  window.normalizarUrlQr = normalizarUrlQr;

  function boot() {
    bindQrUploadPanel();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();