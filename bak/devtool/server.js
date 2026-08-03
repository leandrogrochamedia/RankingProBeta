#!/usr/bin/env node
/**
 * Ranking Pro — DevTool Server
 * Serve o preview do app + UI de chat integrada ao Grok CLI (headless).
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);
const { URL } = require('url');

const DEVTOOL_DIR = __dirname;
const ROOT_DIR = path.join(DEVTOOL_DIR, '..');
const PORT = Number(process.env.DEVTOOL_PORT || 8790);
const LAUNCHER_PORT = Number(process.env.DEVTOOL_LAUNCHER_PORT || 8789);
const GROK_BIN = process.env.GROK_BIN || path.join(process.env.HOME || '', '.grok/bin/grok');
const ONLINE_PREVIEW = process.env.DEVTOOL_ONLINE_URL
  || 'https://leandrogrochamedia.github.io/RankingPro/';
const SKIP_DIRS = new Set(['.git', 'node_modules', '__pycache__', '.cursor', 'terminals']);
const PREVIEW_EXTS = new Set(['.html', '.htm']);

const AGENT_PROMPTS = {
  supervisor: `Você é a MASTER MEGA BLASTER — PROOFLY, Supervisor Estratégico Máximo do Ranking Pro, com forte habilidade de UX/UI Designer Premium com DNA Apple (minimalista, sofisticado, elegante, clean, espaçamento perfeito, sensação de qualidade premium).

North Star fixo: Ser a infraestrutura de reputação profissional mais confiável do mercado da beleza.

Quando o usuário te chamar de Máquina Mortífera, Master ou Mega Blaster, entre no modo completo.

Foco: estratégia de produto, reputação, confiança, priorização. Respostas acionáveis, sem scope creep.`,
  designer: `Você é o Designer Premium do Ranking Pro — UX/UI com DNA Apple: minimalista, sofisticado, elegante, clean, espaçamento perfeito, sensação premium.

North Star: infraestrutura de reputação profissional mais confiável do mercado da beleza.

Foco exclusivo em hierarquia visual, tipografia, cores, espaçamento, componentes, microinterações.`,
  developer: `Você é o Desenvolvedor técnico do Ranking Pro — HTML, CSS, JavaScript vanilla.

North Star: infraestrutura de reputação profissional mais confiável do mercado da beleza.

Foco: implementação limpa, mínima e funcional. Reutilize padrões do projeto.`
};

function wrapAgentMessage(agent, userMessage) {
  const prompt = AGENT_PROMPTS[agent];
  if (!prompt) return userMessage;
  return `[AGENTE: ${agent}]\n${prompt}\n\n[MENSAGEM DO USUÁRIO]\n${userMessage}`;
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json'
};

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function safePath(base, requestPath) {
  const decoded = decodeURIComponent(requestPath.split('?')[0]);
  const rel = decoded.replace(/^\/+/, '');
  const abs = path.normalize(path.join(base, rel));
  if (!abs.startsWith(base)) return null;
  return abs;
}

function serveFile(res, filePath) {
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
}

function listProjectFiles(relPath = '') {
  const base = safePath(ROOT_DIR, relPath || '');
  if (!base || !fs.existsSync(base) || !fs.statSync(base).isDirectory()) {
    throw new Error('Pasta inválida');
  }

  const relNorm = String(relPath || '').replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  const parent = relNorm.includes('/') ? relNorm.split('/').slice(0, -1).join('/') : '';

  const names = fs.readdirSync(base);
  const entries = names
    .filter(name => {
      if (name.startsWith('.') && name !== '.nojekyll') return false;
      if (SKIP_DIRS.has(name)) return false;
      return true;
    })
    .map(name => {
      const full = path.join(base, name);
      const stat = fs.statSync(full);
      const rel = path.relative(ROOT_DIR, full).replace(/\\/g, '/');
      if (stat.isDirectory()) {
        return { name, type: 'dir', path: rel, previewable: false };
      }
      const ext = path.extname(name).toLowerCase();
      return { name, type: 'file', path: rel, previewable: PREVIEW_EXTS.has(ext) };
    })
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
    });

  return { path: relNorm, parent, root: ROOT_DIR, entries };
}

function gitEnv() {
  return {
    ...process.env,
    GIT_TERMINAL_PROMPT: '0',
    GCM_INTERACTIVE: 'Never'
  };
}

async function runGit(args, timeout = 120000) {
  const { stdout, stderr } = await execFileAsync('git', args, {
    cwd: ROOT_DIR,
    timeout,
    maxBuffer: 10 * 1024 * 1024,
    env: gitEnv()
  });
  return { stdout: stdout || '', stderr: stderr || '', code: 0 };
}

async function gitWorktreeStatus() {
  if (!fs.existsSync(path.join(ROOT_DIR, '.git'))) {
    return { isRepo: false, clean: true, count: 0, files: [] };
  }
  try {
    const { stdout } = await runGit(['status', '--porcelain']);
    const lines = stdout.split('\n').filter(ln => ln.trim());
    return {
      isRepo: true,
      clean: lines.length === 0,
      count: lines.length,
      files: lines.slice(0, 40)
    };
  } catch (err) {
    const msg = (err.stderr || err.message || '').trim();
    throw new Error(msg || 'git status falhou');
  }
}

async function gitSyncPush(message = 'push') {
  const status = await gitWorktreeStatus();
  if (!status.isRepo) throw new Error('Pasta não é um repositório git');
  if (status.clean) {
    return {
      ok: true,
      skipped: true,
      message: 'Nada para sincronizar — working tree limpo',
      status
    };
  }

  try {
    await runGit(['add', '-A']);
  } catch (err) {
    throw new Error((err.stderr || err.message || '').trim() || 'git add falhou');
  }

  let commitOut = '';
  try {
    const { stdout } = await runGit(['commit', '-m', message]);
    commitOut = stdout.trim();
  } catch (err) {
    const out = ((err.stdout || '') + (err.stderr || err.message || '')).trim();
    if (/nothing to commit/i.test(out)) {
      return {
        ok: true,
        skipped: true,
        message: 'Nada para commitar',
        status: await gitWorktreeStatus()
      };
    }
    throw new Error(out || 'git commit falhou');
  }

  let pushOut = '';
  try {
    const { stdout, stderr } = await runGit(['push', 'origin', 'main'], 180000);
    pushOut = (stdout || stderr || '').trim();
  } catch (err) {
    throw new Error((err.stderr || err.stdout || err.message || '').trim() || 'git push falhou');
  }

  return {
    ok: true,
    skipped: false,
    message: 'Alterações enviadas para origin/main',
    commit: commitOut,
    push: pushOut,
    status: await gitWorktreeStatus()
  };
}

function runGrokChat({ message, sessionId }) {
  const args = [
    '-p', message,
    '--output-format', 'streaming-json',
    '--cwd', ROOT_DIR,
    '--always-approve'
  ];
  if (sessionId) {
    args.push('--resume', sessionId);
  }
  return spawn(GROK_BIN, args, {
    cwd: ROOT_DIR,
    env: { ...process.env },
    stdio: ['ignore', 'pipe', 'pipe']
  });
}

function handleChat(req, res) {
  let raw = '';
  req.on('data', chunk => { raw += chunk; });
  req.on('end', () => {
    let payload;
    try {
      payload = JSON.parse(raw || '{}');
    } catch {
      sendJson(res, 400, { error: 'JSON inválido' });
      return;
    }

    let message = String(payload.message || '').trim();
    if (!message) {
      sendJson(res, 400, { error: 'Mensagem vazia' });
      return;
    }

    const agent = String(payload.agent || 'supervisor').trim();
    message = wrapAgentMessage(agent, message);

    if (!fs.existsSync(GROK_BIN)) {
      sendJson(res, 500, {
        error: 'Grok CLI não encontrado',
        hint: `Defina GROK_BIN ou instale em ${GROK_BIN}`
      });
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    const child = runGrokChat({
      message,
      sessionId: payload.sessionId || null
    });

    let buffer = '';
    const emit = (event, data) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    emit('status', { state: 'running' });

    child.stdout.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const evt = JSON.parse(trimmed);
          emit('grok', evt);
          if (evt.type === 'end' && evt.sessionId) {
            emit('session', { sessionId: evt.sessionId });
          }
          if (evt.type === 'error') {
            emit('error', { message: evt.message || 'Erro no Grok' });
          }
        } catch {
          emit('log', { line: trimmed });
        }
      }
    });

    child.stderr.on('data', (chunk) => {
      emit('stderr', { line: chunk.toString() });
    });

    child.on('close', (code) => {
      emit('done', { code });
      res.end();
    });

    child.on('error', (err) => {
      emit('error', { message: err.message });
      res.end();
    });

    req.on('close', () => {
      if (!child.killed) child.kill('SIGTERM');
    });
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const pathname = url.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (pathname === '/api/health' && req.method === 'GET') {
    sendJson(res, 200, {
      ok: true,
      grok: fs.existsSync(GROK_BIN),
      grokBin: GROK_BIN,
      root: ROOT_DIR,
      onlinePreview: ONLINE_PREVIEW,
      port: PORT,
      launcherPort: LAUNCHER_PORT
    });
    return;
  }

  if (pathname === '/api/server/status' && req.method === 'GET') {
    sendJson(res, 200, {
      ok: true,
      serverOnline: true,
      url: `http://127.0.0.1:${PORT}`
    });
    return;
  }

  if (pathname === '/api/server/start' && req.method === 'POST') {
    sendJson(res, 200, {
      ok: true,
      started: false,
      alreadyRunning: true,
      message: 'Servidor já está ativo',
      url: `http://127.0.0.1:${PORT}`,
      port: PORT
    });
    return;
  }

  if (pathname === '/api/chat' && req.method === 'POST') {
    handleChat(req, res);
    return;
  }

  if (pathname === '/api/config' && req.method === 'GET') {
    sendJson(res, 200, {
      localPreview: '/app/cliente.html',
      onlinePreview: ONLINE_PREVIEW,
      rootPath: ROOT_DIR,
      localFilePath: path.join(ROOT_DIR, 'cliente.html'),
      startCommand: `cd "${DEVTOOL_DIR}" && python3 launcher.py`,
      launcherUrl: `http://127.0.0.1:${LAUNCHER_PORT}`,
      serverUrl: `http://127.0.0.1:${PORT}`
    });
    return;
  }

  if (pathname === '/api/files' && req.method === 'GET') {
    try {
      sendJson(res, 200, listProjectFiles(url.searchParams.get('path') || ''));
    } catch (err) {
      sendJson(res, 400, { error: err.message || 'Erro ao listar' });
    }
    return;
  }

  if (pathname === '/api/git/status' && req.method === 'GET') {
    gitWorktreeStatus()
      .then(data => sendJson(res, 200, data))
      .catch(err => sendJson(res, 500, { error: err.message || 'Erro git status' }));
    return;
  }

  if (pathname === '/api/git/push' && req.method === 'POST') {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => {
      let payload = {};
      try {
        payload = JSON.parse(raw || '{}');
      } catch { /* defaults */ }
      const message = String(payload.message || 'push').trim() || 'push';
      gitSyncPush(message)
        .then(data => sendJson(res, 200, data))
        .catch(err => sendJson(res, 500, { error: err.message || 'Erro git push' }));
    });
    return;
  }

  if (pathname.startsWith('/app/')) {
    const filePath = safePath(ROOT_DIR, pathname.slice('/app/'.length));
    if (!filePath) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    if (pathname.endsWith('/')) {
      serveFile(res, path.join(filePath, 'index.html'));
      return;
    }
    serveFile(res, filePath);
    return;
  }

  let devPath = pathname;
  if (devPath === '/' || devPath === '') devPath = '/index.html';
  const filePath = safePath(DEVTOOL_DIR, devPath);
  if (!filePath) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  serveFile(res, filePath);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('');
  console.log('  🏆 Ranking Pro DevTool');
  console.log(`  → http://127.0.0.1:${PORT}`);
  console.log(`  → Preview local: http://127.0.0.1:${PORT}/app/index.html`);
  console.log(`  → Grok CLI: ${GROK_BIN}`);
  console.log('');
});