(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);

  const PUD = window.PreviewUrlDisplay;

  const els = {
    frame: $('#previewFrame'),
    urlRootLabel: $('#previewUrlRoot'),
    urlLabel: $('#previewUrl'),
    urlIframeLabel: $('#previewIframeUrl'),
    modeBadge: $('#viewerModeBadge'),
    meta: $('#viewerMeta'),
    metaSource: $('#viewerMetaSource'),
    metaDevice: $('#viewerMetaDevice'),
    tabLocal: $('#tabLocal'),
    tabOnline: $('#tabOnline'),
    btnDesktop: $('#btnDesktop'),
    btnMobile: $('#btnMobile'),
    btnRefresh: $('#btnRefresh'),
    btnOpen: $('#btnOpenExternal'),
    frameWrap: $('#frameWrap'),
    previewViewport: $('#previewViewport'),
    mobileChrome: $('#mobileChrome'),
    mobileTime: $('#mobileTime'),
    empty: $('#viewerEmpty'),
    emptyIcon: $('#viewerEmptyIcon'),
    emptyEyebrow: $('#viewerEmptyEyebrow'),
    emptyTitle: $('#viewerEmptyTitle'),
    emptyText: $('#viewerEmptyText'),
    btnEmptyPrimary: $('#btnEmptyPrimary'),
    btnEmptySecondary: $('#btnEmptySecondary'),
    btnEmptyTertiary: $('#btnEmptyTertiary')
  };

  const ONLINE_PREVIEW = 'https://leandrogrochamedia.github.io/RankingProBeta/index.html';
  const DEVTOOL_URL = 'http://127.0.0.1:8790/';
  const DEVTOOL_PREVIEW = 'http://127.0.0.1:8790/app/index.html';
  const DEVTOOL_LAUNCHER = 'http://127.0.0.1:8789';
  const SANDBOX_LOCAL = 'allow-scripts allow-same-origin allow-forms allow-popups allow-modals';
  const SANDBOX_ONLINE = 'allow-scripts allow-forms allow-popups allow-modals';
  const PREVIEW_NAV_MSG = 'ranking-pro-preview-nav';

  const MOBILE_DEVICE = {
    name: 'iPhone 15 Pro Max',
    width: 430,
    height: 932,
    bezel: 12,
    safeTop: 67
  };

  const MOBILE_SAFE_STYLE_ID = 'devtool-mobile-safe-inset';
  const MOBILE_PREVIEW_CLASS = 'devtool-mobile-preview';

  const EMPTY_COPY = {
    loading: {
      eyebrow: 'Aguarde',
      title: 'Carregando preview…',
      text: 'Buscando o app na fonte selecionada.',
      className: 'is-loading'
    },
    'error-timeout': {
      eyebrow: 'Tempo esgotado',
      title: 'O preview não respondeu',
      text: 'A página demorou demais para carregar. Verifique a conexão ou troque a fonte do preview.',
      className: 'is-error'
    },
    'error-network': {
      eyebrow: 'Falha de rede',
      title: 'Não foi possível abrir a URL',
      text: 'O endereço remoto não está acessível agora. Tente recarregar ou use o preview local via DevTool.',
      className: 'is-error'
    },
    'error-empty': {
      eyebrow: 'Preview vazio',
      title: 'O app não apareceu no iframe',
      text: 'Tente recarregar. Se persistir, abra no navegador ou use GitHub Pages.',
      className: 'is-error'
    }
  };

  let previewMode = 'local';
  let mobilePreview = false;
  let mobileResizeObserver = null;
  let loadTimeout = null;
  let previewReady = false;
  let devToolOnline = false;
  let emptyPrimaryAction = null;
  let emptySecondaryAction = null;
  let emptyTertiaryAction = null;
  let lastIframeLiveUrl = '';
  let lastIframeDisplayPath = '';
  let siteRootPath = '';
  let iframeNavHooked = false;
  let childNavReport = { path: '', href: '', at: 0 };

  function getParseOpts() {
    return {
      projectRoot: siteRootPath || undefined,
      preferOnline: previewMode === 'online'
    };
  }

  function syncStaticRootLabel() {
    if (!els.urlRootLabel) return;
    const text = previewMode === 'online'
      ? PUD.formatOnlineRootLabel()
      : PUD.formatRootLabel(siteRootPath);
    els.urlRootLabel.textContent = text;
    els.urlRootLabel.title = previewMode === 'online'
      ? 'Root publicada (GitHub Pages)'
      : 'Pasta do site no disco (onde está index.html)';
  }

  async function loadSiteRoot() {
    try {
      const resp = await fetch('/api/config');
      if (resp.ok) {
        const data = await resp.json();
        siteRootPath = data.rootPath || '';
      }
    } catch { /* viewer fora do servidor DevTool */ }

    if (!siteRootPath) {
      try {
        const parent = new URL('../', window.location.href);
        if (parent.protocol === 'file:') {
          siteRootPath = decodeURIComponent(parent.pathname).replace(/\/$/, '');
        }
      } catch { /* noop */ }
    }

    syncStaticRootLabel();
    if (previewReady) syncIframeUrlLabel();
  }

  function canReadIframeLocation() {
    if (!els.frame) return false;
    try {
      const href = els.frame.contentWindow?.location?.href || '';
      return !!(href && href !== 'about:blank');
    } catch {
      return false;
    }
  }

  function getIframeLiveUrl(options = {}) {
    const { allowStaleSrc = false } = options;
    if (!els.frame) return '';

    try {
      const href = els.frame.contentWindow?.location?.href || '';
      if (href && href !== 'about:blank') return href;
    } catch {
      /* cross-origin — tenta document.URL */
    }

    try {
      const docUrl = els.frame.contentDocument?.URL || '';
      if (docUrl && docUrl !== 'about:blank') return docUrl;
    } catch {
      /* cross-origin */
    }

    if (allowStaleSrc) return els.frame.src || '';
    return '';
  }

  function formatIframeNavPath(parsed, liveUrl) {
    if (!parsed) return '—';
    if (parsed.path && parsed.path !== '—') return parsed.path;
    if (parsed.full) return parsed.full;
    return liveUrl || '—';
  }

  function applyIframeNavPath(path, href, title) {
    const display = path || '—';
    const live = href ? PUD.stripCacheBust(href) : '';
    lastIframeLiveUrl = live;
    lastIframeDisplayPath = display;

    if (els.urlIframeLabel) {
      els.urlIframeLabel.textContent = display;
      els.urlIframeLabel.title = title || href || display || 'Arquivo atual no preview';
    }
  }

  function syncIframeUrlLabel(options = {}) {
    const force = !!options.force;

    if (!force && !canReadIframeLocation()) {
      if (childNavReport.path) {
        applyIframeNavPath(
          childNavReport.path,
          childNavReport.href,
          childNavReport.href || childNavReport.path
        );
      }
      return;
    }

    const live = PUD.stripCacheBust(getIframeLiveUrl());
    if (!live) {
      if (childNavReport.path) {
        applyIframeNavPath(
          childNavReport.path,
          childNavReport.href,
          childNavReport.href || childNavReport.path
        );
      }
      return;
    }

    const parsed = PUD.parsePreviewUrl(live, getParseOpts());
    const display = formatIframeNavPath(parsed, live);
    const title = parsed.full || parsed.path || live || 'Arquivo atual no preview';
    applyIframeNavPath(display, live, title);
  }

  function handlePreviewNavMessage(event) {
    const data = event.data;
    if (!data || data.type !== PREVIEW_NAV_MSG || !data.path) return;

    childNavReport = {
      path: data.path,
      href: data.href || '',
      at: Date.now()
    };
    applyIframeNavPath(data.path, childNavReport.href, childNavReport.href || data.path);
  }

  function injectPathReporter() {
    try {
      const doc = els.frame.contentDocument;
      if (!doc || doc.getElementById('devtool-preview-reporter')) return;

      const script = doc.createElement('script');
      script.id = 'devtool-preview-reporter';
      script.textContent = `
        (function () {
          if (window.parent === window) return;
          var MSG = ${JSON.stringify(PREVIEW_NAV_MSG)};
          function sitePath() {
            var p = location.pathname || '/';
            if (p.indexOf('/app/') === 0) p = p.slice(4) || '/';
            else if (p === '/app') p = '/';
            var file = p.split('/').filter(Boolean).pop() || 'index.html';
            var suffix = (location.search || '') + (location.hash || '');
            if (file === 'index.html') return '/' + suffix;
            return '/' + file + suffix;
          }
          function report() {
            try {
              window.parent.postMessage({ type: MSG, path: sitePath(), href: location.href }, '*');
            } catch (e) {}
          }
          report();
          window.addEventListener('popstate', report);
          window.addEventListener('hashchange', report);
          window.addEventListener('pageshow', report);
          var ps = history.pushState, rs = history.replaceState;
          if (ps) history.pushState = function () { var r = ps.apply(this, arguments); report(); return r; };
          if (rs) history.replaceState = function () { var r = rs.apply(this, arguments); report(); return r; };
        })();
      `;
      (doc.head || doc.documentElement).appendChild(script);
    } catch {
      /* cross-origin */
    }
  }

  function bindIframeNavigationWatch() {
    if (!els.frame || iframeNavHooked) return;

    let win;
    let doc;
    try {
      win = els.frame.contentWindow;
      doc = els.frame.contentDocument;
    } catch {
      return;
    }
    if (!win || !doc) return;

    iframeNavHooked = true;
    const notify = () => {
      requestAnimationFrame(syncIframeUrlLabel);
    };

    win.addEventListener('popstate', notify);
    win.addEventListener('hashchange', notify);

    const { pushState, replaceState } = win.history;
    if (typeof pushState === 'function') {
      win.history.pushState = function (...args) {
        const result = pushState.apply(this, args);
        notify();
        return result;
      };
    }
    if (typeof replaceState === 'function') {
      win.history.replaceState = function (...args) {
        const result = replaceState.apply(this, args);
        notify();
        return result;
      };
    }

    doc.addEventListener('click', () => setTimeout(notify, 0), true);
    doc.addEventListener('submit', () => setTimeout(notify, 50), true);
    win.addEventListener('pageshow', notify);
    win.addEventListener('load', notify);
  }

  function resetIframeNavigationWatch() {
    iframeNavHooked = false;
  }

  function resolveLocalPreview() {
    const { protocol, hostname, port, origin } = window.location;
    if (protocol.startsWith('http') && hostname === '127.0.0.1' && port === '8790') {
      return `${origin}/app/index.html`;
    }
    // LOCAL BROWSER aberto via file:// ou outra porta: iframe no DevTool server (evita file:// + fetch quebrado)
    return DEVTOOL_PREVIEW;
  }

  const LOCAL_PREVIEW = resolveLocalPreview();

  function getPreviewUrl() {
    return previewMode === 'online' ? ONLINE_PREVIEW : LOCAL_PREVIEW;
  }

  function getDisplayUrl() {
    if (previewMode === 'online') return ONLINE_PREVIEW;
    try {
      return decodeURIComponent(LOCAL_PREVIEW.replace(/^file:\/\//, ''));
    } catch {
      return LOCAL_PREVIEW;
    }
  }

  function syncUrlLabel() {
    const parsed = PUD.parsePreviewUrl(getDisplayUrl(), getParseOpts());
    if (els.urlLabel) {
      els.urlLabel.textContent = parsed.path || '—';
      els.urlLabel.title = parsed.full || parsed.path || 'Path a partir da root do site';
    }
  }

  function syncMeta() {
    const sourceLabel = previewMode === 'online' ? 'GitHub Pages' : 'Arquivos locais';
    if (els.metaSource) els.metaSource.textContent = sourceLabel;
    if (els.modeBadge) {
      els.modeBadge.textContent = sourceLabel;
      els.modeBadge.classList.toggle('is-online', previewMode === 'online');
    }
    if (els.metaDevice) {
      els.metaDevice.textContent = mobilePreview
        ? `${MOBILE_DEVICE.name} · ${MOBILE_DEVICE.width} × ${MOBILE_DEVICE.height}`
        : 'Janela responsiva (desktop)';
    }
    els.meta?.classList.toggle('is-mobile-active', mobilePreview);
    els.meta?.classList.toggle(
      'is-preview-error',
      !!(els.empty && !els.empty.hidden && els.empty.classList.contains('is-error'))
    );
  }

  function clearLoadTimeout() {
    if (loadTimeout) {
      clearTimeout(loadTimeout);
      loadTimeout = null;
    }
  }

  function bindEmptyButton(button, handler) {
    if (!button) return;
    button.onclick = handler || null;
    button.hidden = !handler;
  }

  function configureEmptyActions(type) {
    emptyPrimaryAction = null;
    emptySecondaryAction = null;
    emptyTertiaryAction = null;

    if (type === 'loading') {
      bindEmptyButton(els.btnEmptyPrimary, null);
      bindEmptyButton(els.btnEmptySecondary, null);
      bindEmptyButton(els.btnEmptyTertiary, null);
      return;
    }

    if (type === 'error-empty' || type === 'error-timeout') {
      emptyPrimaryAction = refreshPreview;
      els.btnEmptyPrimary.textContent = 'Tentar novamente';
      emptySecondaryAction = openExternal;
      els.btnEmptySecondary.textContent = 'Abrir no navegador';
      emptyTertiaryAction = () => setPreviewTab('online');
      els.btnEmptyTertiary.textContent = 'Ver no GitHub Pages';
    } else if (type === 'error-network') {
      emptyPrimaryAction = refreshPreview;
      els.btnEmptyPrimary.textContent = 'Tentar novamente';
      emptySecondaryAction = () => setPreviewTab('online');
      els.btnEmptySecondary.textContent = previewMode === 'online'
        ? 'Recarregar GitHub Pages'
        : 'Ver no GitHub Pages';
      emptyTertiaryAction = tryOpenDevTool;
      els.btnEmptyTertiary.textContent = devToolOnline
        ? 'Abrir via DevTool'
        : 'Iniciar DevTool';
    }

    bindEmptyButton(els.btnEmptyPrimary, emptyPrimaryAction);
    bindEmptyButton(els.btnEmptySecondary, emptySecondaryAction);
    bindEmptyButton(els.btnEmptyTertiary, emptyTertiaryAction);
  }

  function showEmptyState(type) {
    const copy = EMPTY_COPY[type] || EMPTY_COPY['error-timeout'];
    previewReady = false;

    if (!els.empty) return;
    els.empty.hidden = false;
    els.empty.className = `viewer-empty ${copy.className || ''}`.trim();

    if (els.emptyEyebrow) els.emptyEyebrow.textContent = copy.eyebrow;
    if (els.emptyTitle) els.emptyTitle.textContent = copy.title;
    if (els.emptyText) els.emptyText.textContent = copy.text;

    if (els.emptyIcon) {
      els.emptyIcon.innerHTML = type === 'loading'
        ? '<span class="viewer-empty__spinner" aria-hidden="true"></span>'
        : `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/>
            <path d="M12 8v5M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>`;
    }

    configureEmptyActions(type);

    const hint = els.meta?.querySelector('.viewer-meta-hint');
    if (hint) {
      hint.textContent = type === 'loading'
        ? 'Validando preview…'
        : 'Preview indisponível — escolha uma alternativa abaixo';
    }

    syncMeta();
  }

  function hideEmptyState() {
    previewReady = true;
    if (els.empty) els.empty.hidden = true;

    const hint = els.meta?.querySelector('.viewer-meta-hint');
    if (hint) {
      hint.textContent = 'Preview isolado · alterações locais refletem ao recarregar';
    }

    syncMeta();
  }

  async function checkDevToolServer() {
    try {
      const resp = await fetch(`${DEVTOOL_URL}api/health`, {
        signal: AbortSignal.timeout(1800)
      });
      devToolOnline = resp.ok;
      return devToolOnline;
    } catch {
      devToolOnline = false;
      return false;
    }
  }

  async function tryOpenDevTool() {
    const online = await checkDevToolServer();
    if (online) {
      window.open(DEVTOOL_PREVIEW, '_blank', 'noopener,noreferrer');
      return;
    }

    try {
      await fetch(`${DEVTOOL_LAUNCHER}/api/server/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
        signal: AbortSignal.timeout(12000)
      });
      for (let i = 0; i < 12; i += 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (await checkDevToolServer()) {
          window.open(DEVTOOL_PREVIEW, '_blank', 'noopener,noreferrer');
          return;
        }
      }
    } catch {
      /* launcher offline */
    }

    window.open(DEVTOOL_URL, '_blank', 'noopener,noreferrer');
  }

  function verifyFrameLoaded() {
    if (!els.frame) return false;
    if (previewMode === 'online') return true;

    try {
      const href = els.frame.contentWindow?.location?.href || '';
      if (href === 'about:blank') return false;

      const doc = els.frame.contentDocument;
      if (!doc) return true;

      const body = doc.body;
      if (!body) return true;

      const hasMarkup = body.children.length > 0 || body.textContent.trim().length > 0;
      const title = (doc.title || '').trim();
      const looksLikeError = /^(access denied|error|blocked)/i.test(title) && !hasMarkup;

      return !looksLikeError;
    } catch {
      return true;
    }
  }

  function resolveEmptyFailureType() {
    return previewMode === 'online' ? 'error-network' : 'error-empty';
  }

  function scheduleLoadTimeout() {
    clearLoadTimeout();
    loadTimeout = setTimeout(() => {
      showEmptyState(previewMode === 'online' ? 'error-network' : 'error-timeout');
    }, 8000);
  }

  function syncMobileFrameInset() {
    if (!els.frame) return;
    try {
      const doc = els.frame.contentDocument;
      if (!doc?.documentElement) return;
      const root = doc.documentElement;
      const existing = doc.getElementById(MOBILE_SAFE_STYLE_ID);

      if (!mobilePreview) {
        root.classList.remove(MOBILE_PREVIEW_CLASS);
        existing?.remove();
        return;
      }

      root.classList.add(MOBILE_PREVIEW_CLASS);
      let style = existing;
      if (!style) {
        style = doc.createElement('style');
        style.id = MOBILE_SAFE_STYLE_ID;
        doc.head.appendChild(style);
      }
      style.textContent = `
        html.${MOBILE_PREVIEW_CLASS} body {
          padding-top: ${MOBILE_DEVICE.safeTop}px !important;
        }
      `;
    } catch {
      /* cross-origin (GitHub Pages) */
    }
  }

  function applyFrameSandbox() {
    if (!els.frame) return;
    els.frame.setAttribute(
      'sandbox',
      previewMode === 'online' ? SANDBOX_ONLINE : SANDBOX_LOCAL
    );
  }

  function onFrameLoad() {
    clearLoadTimeout();
    resetIframeNavigationWatch();

    requestAnimationFrame(() => {
      setTimeout(() => {
        injectPathReporter();
        bindIframeNavigationWatch();
        syncIframeUrlLabel();

        if (!verifyFrameLoaded()) {
          showEmptyState('error-empty');
          return;
        }

        hideEmptyState();
        syncMobileFrameInset();
      }, 80);
    });
  }

  function onFrameError() {
    clearLoadTimeout();
    showEmptyState(previewMode === 'online' ? 'error-network' : resolveEmptyFailureType());
  }

  function loadPreview() {
    if (!els.frame) return;

    resetIframeNavigationWatch();
    childNavReport = { path: '', href: '', at: 0 };
    showEmptyState('loading');
    applyFrameSandbox();
    const url = getPreviewUrl();
    const bust = url + (url.includes('?') ? '&' : '?') + '_viewer=' + Date.now();
    els.frame.src = bust;
    syncUrlLabel();
    const initial = PUD.parsePreviewUrl(url, getParseOpts());
    applyIframeNavPath(
      formatIframeNavPath(initial, url),
      url,
      initial.full || initial.path || url
    );
    syncMeta();
    scheduleLoadTimeout();
  }

  function refreshPreview() {
    loadPreview();
  }

  function openExternal() {
    const live = PUD.stripCacheBust(
      getIframeLiveUrl() || childNavReport.href || getIframeLiveUrl({ allowStaleSrc: true })
    );
    const url = (live && live !== 'about:blank') ? live : getPreviewUrl();
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function fitMobileDevice() {
    if (!mobilePreview || !els.previewViewport || !els.mobileChrome) return;
    const labelH = 28;
    const outerW = MOBILE_DEVICE.width + MOBILE_DEVICE.bezel * 2;
    const outerH = MOBILE_DEVICE.height + MOBILE_DEVICE.bezel * 2 + labelH;
    const pad = 20;
    const availW = Math.max(120, els.previewViewport.clientWidth - pad);
    const availH = Math.max(120, els.previewViewport.clientHeight - pad);
    const scale = Math.min(1, availW / outerW, availH / outerH);
    els.mobileChrome.style.transform = scale < 0.995 ? `scale(${scale})` : 'none';
  }

  function bindMobileResize() {
    if (!els.previewViewport || mobileResizeObserver) return;
    mobileResizeObserver = new ResizeObserver(() => fitMobileDevice());
    mobileResizeObserver.observe(els.previewViewport);
    window.addEventListener('resize', fitMobileDevice);
  }

  function setMobilePreview(enabled, options = {}) {
    const wasMobile = mobilePreview;
    mobilePreview = enabled;
    els.frameWrap?.classList.toggle('is-mobile', enabled);
    els.btnDesktop?.classList.toggle('is-active', !enabled);
    els.btnMobile?.classList.toggle('is-active', enabled);
    els.btnDesktop?.setAttribute('aria-pressed', enabled ? 'false' : 'true');
    els.btnMobile?.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    if (enabled) {
      bindMobileResize();
      requestAnimationFrame(fitMobileDevice);
    } else if (els.mobileChrome) {
      els.mobileChrome.style.transform = 'none';
    }
    syncMobileFrameInset();
    syncMeta();
    if (options.reload && enabled && !wasMobile && previewReady) {
      refreshPreview();
      requestAnimationFrame(fitMobileDevice);
    }
  }

  function updatePreviewChrome() {
    const isLocal = previewMode === 'local';
    els.tabLocal?.classList.toggle('is-active', isLocal);
    els.tabOnline?.classList.toggle('is-active', !isLocal);
    els.tabLocal?.setAttribute('aria-selected', isLocal ? 'true' : 'false');
    els.tabOnline?.setAttribute('aria-selected', isLocal ? 'false' : 'true');
    syncMeta();
    if (mobilePreview) requestAnimationFrame(fitMobileDevice);
  }

  function setPreviewTab(mode) {
    previewMode = mode;
    syncStaticRootLabel();
    updatePreviewChrome();
    loadPreview();
  }

  function updateMobileTime() {
    if (!els.mobileTime) return;
    const now = new Date();
    els.mobileTime.textContent = now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  window.addEventListener('message', handlePreviewNavMessage);

  els.frame?.addEventListener('load', onFrameLoad);
  els.frame?.addEventListener('error', onFrameError);

  els.tabLocal?.addEventListener('click', () => setPreviewTab('local'));
  els.tabOnline?.addEventListener('click', () => setPreviewTab('online'));
  els.btnDesktop?.addEventListener('click', () => setMobilePreview(false));
  els.btnMobile?.addEventListener('click', () => setMobilePreview(true, { reload: true }));
  els.btnRefresh?.addEventListener('click', refreshPreview);
  els.btnOpen?.addEventListener('click', openExternal);

  updateMobileTime();
  setInterval(updateMobileTime, 30000);
  setInterval(() => {
    if (!els.frame?.src) return;
    if (!canReadIframeLocation()) return;

    const live = PUD.stripCacheBust(getIframeLiveUrl());
    if (!live || live === 'about:blank') return;
    if (live !== lastIframeLiveUrl) {
      syncIframeUrlLabel();
      if (previewReady && !iframeNavHooked) bindIframeNavigationWatch();
      return;
    }
    const parsed = PUD.parsePreviewUrl(live, getParseOpts());
    const display = formatIframeNavPath(parsed, live);
    if (display !== lastIframeDisplayPath) syncIframeUrlLabel();
  }, 250);
  loadSiteRoot().finally(() => {
    checkDevToolServer().finally(() => {
      setMobilePreview(false);
      setPreviewTab('local');
    });
  });
})();