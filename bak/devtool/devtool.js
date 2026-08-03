(function() {
  'use strict';

  const $ = (sel) => document.querySelector(sel);

  const AGENT_KEYS = ['supervisor', 'designer', 'developer'];
  const agents = {};
  let lastActiveAgent = 'supervisor';

  for (const key of AGENT_KEYS) {
    agents[key] = {
      key,
      sessionId: null,
      isStreaming: false,
      messages: $(`#chatMessages-${key}`),
      input: $(`#chatInput-${key}`),
      send: $(`#chatSend-${key}`)
    };
  }

  const PUD = window.PreviewUrlDisplay;

  const els = {
    statusDot: $('#statusDot'),
    statusLabel: $('#statusLabel'),
    frame: $('#previewFrame'),
    urlRootLabel: $('#previewUrlRoot'),
    urlLabel: $('#previewUrl'),
    urlIframeLabel: $('#previewIframeUrl'),
    tabLocal: $('#tabLocal'),
    tabOnline: $('#tabOnline'),
    tabFiles: $('#tabFiles'),
    btnRefresh: $('#btnRefresh'),
    btnUpdatePreview: $('#btnUpdatePreview'),
    btnMobileView: $('#btnMobileView'),
    btnStartServer: $('#btnStartServer'),
    btnGitPush: $('#btnGitPush'),
    frameWrap: $('#frameWrap'),
    previewViewport: $('#previewViewport'),
    mobileChrome: $('#mobileChrome'),
    mobileBezel: $('#mobileBezel'),
    previewStage: $('#previewStage'),
    fileExplorer: $('#fileExplorer'),
    explorerList: $('#explorerList'),
    explorerPath: $('#explorerPath'),
    explorerUp: $('#explorerUp')
  };


  let previewMode = 'local';
  let explorerPath = '';
  let lastFilePreview = '/app/cliente.html';
  let serverOnline = false;
  let healthPollTimer = null;
  let gitStatus = { isRepo: false, clean: true, count: 0, files: [] };
  let gitPushing = false;
  let mobilePreview = false;
  let mobileResizeObserver = null;
  let lastIframeLiveUrl = '';
  let iframeUrlPollTimer = null;

  const MOBILE_DEVICE = {
    name: 'iPhone 15 Pro Max',
    width: 430,
    height: 932,
    bezel: 12,
    safeTop: 67
  };

  const MOBILE_SAFE_STYLE_ID = 'devtool-mobile-safe-inset';
  const MOBILE_PREVIEW_CLASS = 'devtool-mobile-preview';

  let config = {
    localPreview: '/app/cliente.html',
    onlinePreview: 'https://leandrogrochamedia.github.io/RankingPro/',
    rootPath: '/Users/leandrogrocha/Documents/DEV/MVP Hanking PRO',
    localFilePath: '/Users/leandrogrocha/Documents/DEV/MVP Hanking PRO/cliente.html',
    startCommand: 'cd devtool && python3 launcher.py',
    launcherUrl: 'http://127.0.0.1:8789',
    serverUrl: 'http://127.0.0.1:8790'
  };

  function scrollMessages(agentKey) {
    const box = agents[agentKey]?.messages;
    if (box) box.scrollTop = box.scrollHeight;
  }

  function addMessage(agentKey, role, text, extraClass) {
    const box = agents[agentKey]?.messages;
    if (!box) return null;
    const div = document.createElement('div');
    div.className = `devtool-msg devtool-msg--${role}${extraClass ? ' ' + extraClass : ''}`;
    div.textContent = text;
    box.appendChild(div);
    scrollMessages(agentKey);
    return div;
  }

  function setAgentStreaming(agentKey, active) {
    const agent = agents[agentKey];
    if (!agent) return;
    agent.isStreaming = active;
    if (agent.send) agent.send.disabled = active;
    if (agent.input) agent.input.disabled = active;
  }

  function anyAgentStreaming() {
    return AGENT_KEYS.some(k => agents[k].isStreaming);
  }

  function addSystemMessage(text, agentKey = 'supervisor') {
    addMessage(agentKey, 'system', text);
  }

  function setStatus(online, label) {
    if (els.statusDot) els.statusDot.classList.toggle('is-online', online);
    if (els.statusLabel) els.statusLabel.textContent = label;
  }

  function getDisplayUrl() {
    if (previewMode === 'online') return config.onlinePreview;
    if (previewMode === 'local') return config.localFilePath || config.localPreview;
    if (previewMode === 'files') {
      const rel = lastFilePreview.replace(/^\/app\//, '');
      return (config.rootPath ? config.rootPath + '/' : '') + rel;
    }
    return config.localPreview;
  }

  function getParseOpts() {
    return {
      projectRoot: config.rootPath,
      preferOnline: previewMode === 'online'
    };
  }

  function syncStaticRootLabel() {
    if (!els.urlRootLabel) return;
    const text = previewMode === 'online'
      ? PUD.formatOnlineRootLabel()
      : PUD.formatRootLabel(config.rootPath);
    els.urlRootLabel.textContent = text;
    els.urlRootLabel.title = previewMode === 'online'
      ? 'Root publicada (GitHub Pages)'
      : 'Pasta do site no disco (onde está index.html)';
  }

  function syncUrlLabel() {
    const parsed = PUD.parsePreviewUrl(getDisplayUrl(), getParseOpts());
    if (els.urlLabel) {
      els.urlLabel.textContent = parsed.path || '—';
      els.urlLabel.title = parsed.full || parsed.path || 'Path a partir da root do site';
    }
  }

  function getIframeLiveUrl() {
    if (!els.frame) return '';
    try {
      const href = els.frame.contentWindow?.location?.href || '';
      if (href && href !== 'about:blank') return href;
    } catch {
      /* cross-origin */
    }
    return els.frame.src || '';
  }

  function syncIframeUrlLabel() {
    const live = PUD.stripCacheBust(getIframeLiveUrl());
    lastIframeLiveUrl = live;
    const parsed = PUD.parsePreviewUrl(live, getParseOpts());
    if (els.urlIframeLabel) {
      els.urlIframeLabel.textContent = parsed.path || '—';
      els.urlIframeLabel.title = parsed.full || parsed.path || 'Path atual no iframe';
    }
  }

  function startIframeUrlPolling() {
    if (iframeUrlPollTimer) return;
    iframeUrlPollTimer = setInterval(() => {
      if (!els.frame?.src) return;
      const live = PUD.stripCacheBust(getIframeLiveUrl());
      if (live !== lastIframeLiveUrl) syncIframeUrlLabel();
    }, 400);
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
      const safe = MOBILE_DEVICE.safeTop;
      style.textContent = `
        html.${MOBILE_PREVIEW_CLASS} body {
          padding-top: ${safe}px !important;
        }
      `;
    } catch {
      /* cross-origin (GitHub Pages) — apenas gradiente do DevTool */
    }
  }

  function bindMobileFrameLoad() {
    if (!els.frame || els.frame.dataset.mobileInsetBound) return;
    els.frame.dataset.mobileInsetBound = '1';
    els.frame.addEventListener('load', () => {
      syncMobileFrameInset();
      syncIframeUrlLabel();
    });
  }

  function setFrameUrl(url) {
    if (els.frame) els.frame.src = url;
    syncUrlLabel();
    syncIframeUrlLabel();
  }

  function refreshPreview() {
    const url = getPreviewUrl();
    if (!els.frame) return;
    try {
      if (els.frame.contentWindow?.location?.reload && url.startsWith('/app/')) {
        els.frame.contentWindow.location.reload();
      } else {
        const bust = url + (url.includes('?') ? '&' : '?') + '_t=' + Date.now();
        els.frame.src = bust;
      }
    } catch {
      els.frame.src = url + (url.includes('?') ? '&' : '?') + '_t=' + Date.now();
    }
    syncUrlLabel();
    syncIframeUrlLabel();
  }

  function showUpdatePreviewActions(agentKey) {
    if (els.btnUpdatePreview) {
      els.btnUpdatePreview.hidden = false;
      els.btnUpdatePreview.classList.add('is-pulse');
    }
    const box = agents[agentKey]?.messages;
    if (!box) return;
    const wrap = document.createElement('div');
    wrap.className = 'devtool-msg devtool-msg--system devtool-msg--actions';
    const label = document.createElement('span');
    label.textContent = 'Tarefa concluída — atualize o preview:';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'devtool-update-btn';
    btn.textContent = '↻ Atualizar preview';
    btn.addEventListener('click', () => {
      refreshPreview();
      if (previewMode === 'files') loadExplorer(explorerPath);
      btn.disabled = true;
      btn.textContent = '✓ Atualizado';
      if (els.btnUpdatePreview) els.btnUpdatePreview.classList.remove('is-pulse');
    });
    wrap.appendChild(label);
    wrap.appendChild(btn);
    box.appendChild(wrap);
    scrollMessages(agentKey);
  }

  function updateStartButton() {
    if (!els.btnStartServer) return;
    if (serverOnline) {
      els.btnStartServer.textContent = '● Servidor ativo';
      els.btnStartServer.classList.add('is-online');
      els.btnStartServer.title = 'Servidor conectado';
    } else {
      els.btnStartServer.textContent = '▶ Iniciar servidor';
      els.btnStartServer.classList.remove('is-online');
      els.btnStartServer.title = 'Iniciar ou reconectar servidor';
    }
  }

  function updateGitButton() {
    if (!els.btnGitPush) return;
    const btn = els.btnGitPush;
    btn.classList.remove('has-changes', 'is-pulse', 'is-pushing');

    if (gitPushing) {
      btn.textContent = '⏳ Sincronizando…';
      btn.disabled = true;
      btn.classList.add('is-pushing');
      btn.title = 'git add + commit -m push + push origin main';
      return;
    }

    if (!serverOnline) {
      btn.textContent = '↑ Git push';
      btn.disabled = true;
      btn.title = 'Servidor offline — conecte primeiro';
      return;
    }

    if (!gitStatus.isRepo) {
      btn.textContent = '↑ Git push';
      btn.disabled = true;
      btn.title = 'Pasta do projeto não é um repositório git';
      return;
    }

    if (gitStatus.clean || gitStatus.count === 0) {
      btn.textContent = '↑ Git push';
      btn.disabled = true;
      btn.title = 'Nenhuma alteração local para enviar';
      return;
    }

    btn.textContent = `↑ Git push (${gitStatus.count})`;
    btn.disabled = false;
    btn.classList.add('has-changes', 'is-pulse');
    btn.title = `Enviar ${gitStatus.count} arquivo(s): git add + commit -m push + push`;
  }

  async function loadGitStatus() {
    if (!serverOnline) {
      gitStatus = { isRepo: false, clean: true, count: 0, files: [] };
      updateGitButton();
      return gitStatus;
    }
    try {
      const resp = await fetch('/api/git/status');
      if (!resp.ok) throw new Error('Falha ao ler status git');
      gitStatus = await resp.json();
    } catch {
      gitStatus = { isRepo: false, clean: true, count: 0, files: [] };
    }
    updateGitButton();
    return gitStatus;
  }

  async function gitPush() {
    if (gitPushing || !serverOnline || !gitStatus.isRepo || gitStatus.clean) return;

    gitPushing = true;
    updateGitButton();
    addSystemMessage(`Sincronizando ${gitStatus.count} alteração(ões)… (git add → commit -m push → push)`);

    try {
      const resp = await fetch('/api/git/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'push' })
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.error || `HTTP ${resp.status}`);

      gitStatus = data.status || gitStatus;
      if (data.skipped) {
        addSystemMessage(data.message || 'Nada para sincronizar.');
      } else {
        const lines = [data.message || 'Alterações enviadas para origin/main'];
        if (data.commit) lines.push(data.commit);
        if (data.push) lines.push(data.push);
        addSystemMessage(lines.join('\n'));
      }
    } catch (err) {
      addMessage('supervisor', 'error', err.message || 'Falha no git push', 'devtool-msg--error');
    } finally {
      gitPushing = false;
      await loadGitStatus();
    }
  }

  function startHealthPolling() {
    if (healthPollTimer) return;
    if (els.btnStartServer) {
      els.btnStartServer.disabled = true;
      els.btnStartServer.textContent = '⏳ Aguardando…';
    }
    healthPollTimer = setInterval(async () => {
      const ok = await checkHealth(true);
      if (ok) {
        clearInterval(healthPollTimer);
        healthPollTimer = null;
        if (els.btnStartServer) els.btnStartServer.disabled = false;
        await loadConfig();
        addSystemMessage('Servidor conectado.');
      }
    }, 2000);
  }

  async function postServerStart(baseUrl) {
    const resp = await fetch(`${baseUrl}/api/server/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      signal: AbortSignal.timeout(15000)
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(data.error || `HTTP ${resp.status}`);
    return data;
  }

  async function startServer() {
    if (serverOnline) {
      await checkHealth();
      await loadConfig();
      addSystemMessage('Servidor reconectado.');
      return;
    }

    if (els.btnStartServer) {
      els.btnStartServer.disabled = true;
      els.btnStartServer.textContent = '⏳ Iniciando…';
    }
    addSystemMessage('Iniciando servidor DevTool…');

    const serverUrl = config.serverUrl || 'http://127.0.0.1:8790';
    const launcherUrl = config.launcherUrl || 'http://127.0.0.1:8789';

    try {
      const data = await postServerStart(serverUrl);
      addSystemMessage(data.message || 'Servidor ativo.');
      startHealthPolling();
      return;
    } catch { /* servidor principal offline */ }

    try {
      const data = await postServerStart(launcherUrl);
      addSystemMessage(data.message || 'Servidor iniciado via launcher.');
      startHealthPolling();
      return;
    } catch { /* launcher offline */ }

    addMessage(
      'supervisor',
      'error',
      `Não foi possível iniciar automaticamente.\nDê duplo clique em Iniciar DevTool.command\nOu rode: ${config.startCommand}`,
      'devtool-msg--error'
    );
    if (els.btnStartServer) els.btnStartServer.disabled = false;
    updateStartButton();
  }

  function getPreviewUrl() {
    if (previewMode === 'online') return config.onlinePreview;
    if (previewMode === 'files') return lastFilePreview;
    return config.localPreview;
  }

  function loadPreview() {
    setFrameUrl(getPreviewUrl());
  }

  function previewModeLabel() {
    if (previewMode === 'online') return 'GitHub Pages';
    if (previewMode === 'files') return 'Arquivos';
    return 'Local';
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

  function setMobilePreview(enabled) {
    mobilePreview = enabled;
    els.frameWrap?.classList.toggle('is-mobile', enabled);
    els.btnMobileView?.classList.toggle('is-active', enabled);
    els.btnMobileView?.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    if (enabled) {
      bindMobileResize();
      requestAnimationFrame(fitMobileDevice);
    } else if (els.mobileChrome) {
      els.mobileChrome.style.transform = 'none';
    }
    syncMobileFrameInset();
  }

  function toggleMobilePreview() {
    setMobilePreview(!mobilePreview);
    refreshPreview();
    const source = previewModeLabel();
    if (mobilePreview) {
      addSystemMessage(`Preview mobile — ${MOBILE_DEVICE.name} (${MOBILE_DEVICE.width}×${MOBILE_DEVICE.height}) · ${source}`);
      updateMobileTime();
    } else {
      addSystemMessage(`Preview desktop restaurado · ${source}`);
    }
    requestAnimationFrame(fitMobileDevice);
  }

  function updatePreviewChrome() {
    const isFiles = previewMode === 'files';
    els.previewStage?.classList.toggle('is-files-mode', isFiles);
    if (els.fileExplorer) els.fileExplorer.hidden = !isFiles;
    els.tabLocal?.classList.toggle('is-active', previewMode === 'local');
    els.tabOnline?.classList.toggle('is-active', previewMode === 'online');
    els.tabFiles?.classList.toggle('is-active', previewMode === 'files');
    els.tabLocal?.setAttribute('aria-selected', previewMode === 'local' ? 'true' : 'false');
    els.tabOnline?.setAttribute('aria-selected', previewMode === 'online' ? 'true' : 'false');
    els.tabFiles?.setAttribute('aria-selected', previewMode === 'files' ? 'true' : 'false');
    if (mobilePreview) requestAnimationFrame(fitMobileDevice);
  }

  function setPreviewTab(mode) {
    previewMode = mode;
    syncStaticRootLabel();
    updatePreviewChrome();
    if (mode === 'files') {
      loadExplorer(explorerPath);
      loadPreview();
    } else {
      loadPreview();
    }
  }

  function fileIcon(entry) {
    if (entry.type === 'dir') return '📁';
    if (entry.previewable) return '🌐';
    if (/\.(css|js|json)$/i.test(entry.name)) return '⚙️';
    if (/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(entry.name)) return '🖼️';
    return '📄';
  }

  function previewAppUrl(relPath) {
    return '/app/' + relPath.split('/').map(encodeURIComponent).join('/');
  }

  async function loadExplorer(path) {
    explorerPath = path || '';
    if (!els.explorerList) return;

    els.explorerList.innerHTML = '<p class="devtool-explorer-empty">Carregando…</p>';
    if (els.explorerPath) {
      els.explorerPath.textContent = config.rootPath
        ? config.rootPath + (explorerPath ? '/' + explorerPath : '')
        : (explorerPath || '/');
    }
    if (els.explorerUp) els.explorerUp.hidden = !explorerPath;

    try {
      const q = explorerPath ? `?path=${encodeURIComponent(explorerPath)}` : '';
      const resp = await fetch('/api/files' + q);
      if (!resp.ok) throw new Error('Falha ao listar arquivos');
      const data = await resp.json();
      renderExplorer(data);
    } catch (err) {
      els.explorerList.innerHTML = `<p class="devtool-explorer-empty">${err.message}</p>`;
    }
  }

  function renderExplorer(data) {
    if (!els.explorerList) return;
    const entries = data.entries || [];
    if (!entries.length) {
      els.explorerList.innerHTML = '<p class="devtool-explorer-empty">Pasta vazia</p>';
      return;
    }

    els.explorerList.innerHTML = '';
    for (const entry of entries) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'devtool-explorer-item' + (entry.type === 'dir' ? ' is-dir' : '');
      btn.setAttribute('role', 'listitem');
      btn.innerHTML = `
        <span class="devtool-explorer-icon">${fileIcon(entry)}</span>
        <span class="devtool-explorer-name">${entry.name}</span>
        ${entry.previewable ? '<span class="devtool-explorer-badge">HTML</span>' : ''}
      `;
      btn.addEventListener('click', () => {
        if (entry.type === 'dir') {
          loadExplorer(entry.path);
          return;
        }
        if (entry.previewable) {
          lastFilePreview = previewAppUrl(entry.path);
          document.querySelectorAll('.devtool-explorer-item.is-active').forEach(el => el.classList.remove('is-active'));
          btn.classList.add('is-active');
          refreshPreview();
        } else {
          addSystemMessage(`${entry.name} não é previewável no iframe.`);
        }
      });
      els.explorerList.appendChild(btn);
    }
  }

  function parseSSE(buffer) {
    const events = [];
    const parts = buffer.split('\n\n');
    const rest = parts.pop() || '';
    for (const part of parts) {
      if (!part.trim()) continue;
      let event = 'message';
      let data = '';
      for (const line of part.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        if (line.startsWith('data:')) data += line.slice(5).trim();
      }
      if (data) {
        try {
          events.push({ event, data: JSON.parse(data) });
        } catch {
          events.push({ event, data: { raw: data } });
        }
      }
    }
    return { events, rest };
  }

  async function sendMessage(agentKey, text) {
    const message = text.trim();
    const agent = agents[agentKey];
    if (!message || !agent || agent.isStreaming) return;

    lastActiveAgent = agentKey;
    addMessage(agentKey, 'user', message);
    agent.input.value = '';
    agent.input.style.height = 'auto';

    const typing = document.createElement('div');
    typing.className = 'devtool-msg devtool-msg--agent';
    typing.innerHTML = '<span class="devtool-typing"><span></span><span></span><span></span></span>';
    agent.messages.appendChild(typing);
    scrollMessages(agentKey);

    setAgentStreaming(agentKey, true);
    let agentBubble = null;
    let agentText = '';

    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          agent: agentKey,
          sessionId: agent.sessionId
        })
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${resp.status}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parsed = parseSSE(buffer);
        buffer = parsed.rest;

        for (const { event, data } of parsed.events) {
          if (event === 'session' && data.sessionId) agent.sessionId = data.sessionId;
          if (event === 'grok') {
            if (data.type === 'text') {
              if (!agentBubble) {
                typing.remove();
                agentBubble = addMessage(agentKey, 'agent', '');
              }
              agentText += data.data || '';
              agentBubble.textContent = agentText;
              scrollMessages(agentKey);
            }
            if (data.type === 'thought' && data.data) {
              addMessage(agentKey, 'thinking', data.data.slice(0, 200) + (data.data.length > 200 ? '…' : ''), 'devtool-msg--thinking');
            }
            if (data.type === 'error') {
              typing.remove();
              addMessage(agentKey, 'error', data.message || 'Erro no agente', 'devtool-msg--error');
            }
          }
          if (event === 'error') {
            typing.remove();
            addMessage(agentKey, 'error', data.message || 'Erro', 'devtool-msg--error');
          }
          if (event === 'done') {
            showUpdatePreviewActions(agentKey);
            loadGitStatus();
          }
        }
      }

      if (!agentBubble && typing.parentNode) {
        typing.remove();
        addMessage(agentKey, 'system', 'Sem resposta do agente.');
      }
    } catch (err) {
      typing.remove();
      addMessage(agentKey, 'error', err.message || 'Falha na conexão com o servidor', 'devtool-msg--error');
    } finally {
      setAgentStreaming(agentKey, false);
      scrollMessages(agentKey);
    }
  }

  function autoResizeInput(ta) {
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }

  function updateMobileTime() {
    const el = document.getElementById('mobileTime');
    if (!el) return;
    const now = new Date();
    const h = now.getHours();
    const m = String(now.getMinutes()).padStart(2, '0');
    el.textContent = `${h}:${m}`;
  }

  function initAgentPanels() {
    const welcomes = {
      supervisor: 'MASTER MEGA BLASTER ativa — North Star: reputação profissional confiável no mercado da beleza.',
      designer: 'Designer Premium ativo — UX/UI com DNA Apple. Descreva o ajuste visual desejado.',
      developer: 'Desenvolvedor ativo — implementação técnica HTML/CSS/JS do Ranking Pro.'
    };
    for (const key of AGENT_KEYS) {
      addMessage(key, 'system', welcomes[key]);
      const agent = agents[key];
      agent.send?.addEventListener('click', () => sendMessage(key, agent.input?.value || ''));
      agent.input?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage(key, agent.input.value);
        }
      });
      agent.input?.addEventListener('input', () => autoResizeInput(agent.input));
    }
    updateMobileTime();
    setInterval(updateMobileTime, 30000);
  }

  async function checkHealth(silent) {
    try {
      const resp = await fetch('/api/health');
      const data = await resp.json();
      serverOnline = !!data.ok;
      updateStartButton();
      if (data.ok && data.grok) setStatus(true, 'Grok CLI conectado');
      else if (data.ok) setStatus(false, 'Servidor OK · Grok ausente');
      if (data.ok) await loadGitStatus();
      return true;
    } catch {
      serverOnline = false;
      setStatus(false, 'Servidor offline');
      updateStartButton();
      updateGitButton();
      if (!silent) addSystemMessage('Servidor offline — use ▶ Iniciar servidor.');
      return false;
    }
  }

  async function loadConfig() {
    try {
      const resp = await fetch('/api/config');
      if (resp.ok) config = { ...config, ...(await resp.json()) };
    } catch { /* defaults */ }
    lastFilePreview = config.localPreview;
    syncStaticRootLabel();
    updatePreviewChrome();
    loadPreview();
  }

  els.tabLocal?.addEventListener('click', () => setPreviewTab('local'));
  els.tabOnline?.addEventListener('click', () => setPreviewTab('online'));
  els.tabFiles?.addEventListener('click', () => setPreviewTab('files'));
  els.btnMobileView?.addEventListener('click', () => toggleMobilePreview());
  els.btnRefresh?.addEventListener('click', () => {
    if (previewMode === 'files') loadExplorer(explorerPath);
    refreshPreview();
    addSystemMessage('Preview atualizado.');
  });
  els.btnUpdatePreview?.addEventListener('click', () => {
    refreshPreview();
    if (previewMode === 'files') loadExplorer(explorerPath);
    els.btnUpdatePreview.classList.remove('is-pulse');
    addSystemMessage('Preview atualizado.');
  });
  els.btnStartServer?.addEventListener('click', () => startServer());
  els.btnGitPush?.addEventListener('click', () => gitPush());
  els.explorerUp?.addEventListener('click', () => {
    const parts = explorerPath.split('/').filter(Boolean);
    parts.pop();
    loadExplorer(parts.join('/'));
  });

  initAgentPanels();
  bindMobileFrameLoad();
  startIframeUrlPolling();
  addSystemMessage('Ranking Pro DevTool — preview local: cliente.html · 3 agentes independentes');
  loadConfig().then(() => checkHealth());
})();