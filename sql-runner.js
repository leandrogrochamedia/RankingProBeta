// ============================================================
// PROOFLY — SQL Runner (DEV) — migrations via RPC ou sequência
// v4 — copiar SQL sem abrir Supabase automaticamente
// ============================================================

const SQL_RUNNER_VERSION = '4';
const SQL_LOG_STORAGE_KEY = 'proofly_sql_log_v1';

const SQL_MIGRATIONS = [
  {
    id: '028_proofly_sql_runner_rpc',
    title: '028 — Instalar RPC (SQL Log)',
    description: 'Cria proofly_run_migration no Supabase. Necessário para rodar migrations pelo botão sem colar SQL.',
    sqlFile: 'migrations/028_proofly_sql_runner_rpc.sql',
    rodeFile: 'migrations/028_RODE_NO_SUPABASE.sql',
    manualOnly: true,
    setup: true,
    step: 1
  },
  {
    id: '027_establishment_owners',
    title: '027 — Owners em todos os estabelecimentos',
    description: 'Adiciona owner_user_id, vincula Leandro ao Batel e cria usuário owner para cada estabelecimento.',
    sqlFile: 'migrations/027_establishment_owners.sql',
    rodeFile: 'migrations/027_RODE_NO_SUPABASE.sql',
    rpcKey: '027_establishment_owners',
    page: './sql-run/027-establishment-owners.html',
    checkStatus: checkMigration027Status,
    requiresOwnerColumn: true,
    step: 2
  }
];

/** Sequências ordenadas — cada passo tem botão na página */
const SQL_SEQUENCES = [
  {
    id: 'owners_pipeline',
    title: '🏢 Owners — sequência completa',
    description: 'Passo 1 instala a RPC (ou use o SQL único abaixo). Passo 2 cria owners em todos os estabelecimentos.',
    steps: ['028_proofly_sql_runner_rpc', '027_establishment_owners'],
    oneShotRode: 'migrations/027_RODE_NO_SUPABASE.sql',
    oneShotLabel: 'SQL único (DDL + owners, sem RPC)'
  }
];

function getSqlLog() {
  try {
    return JSON.parse(localStorage.getItem(SQL_LOG_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function appendSqlLog(entry) {
  const log = getSqlLog();
  log.unshift({ at: new Date().toISOString(), ...entry });
  localStorage.setItem(SQL_LOG_STORAGE_KEY, JSON.stringify(log.slice(0, 120)));
  window.dispatchEvent?.(new CustomEvent('proofly-sql-log-updated'));
  return log;
}

function clearSqlLog() {
  localStorage.removeItem(SQL_LOG_STORAGE_KEY);
  window.dispatchEvent?.(new CustomEvent('proofly-sql-log-updated'));
}

function escSqlMsg(text) {
  if (typeof escapeHtml === 'function') return escapeHtml(String(text ?? ''));
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const SUPABASE_SQL_EDITOR_URL = 'https://supabase.com/dashboard/project/pyywdhjstvhmarvzijji/sql/new';
const OWNER_COLUMN_MISSING_MSG =
  'A coluna owner_user_id ainda não existe no Supabase.\n\n' +
  '1. No SQL Log, clique「SQL único (copiar)」\n' +
  '2. Abra o SQL Editor do Supabase e cole o script\n' +
  '3. Clique Run\n' +
  '4. Volte e clique「Verificar passo 2」\n\n' +
  `SQL Editor: ${SUPABASE_SQL_EDITOR_URL}`;

function isOwnerColumnMissingError(msg) {
  const s = String(msg || '');
  return (
    s.includes('owner_user_id')
    || s.includes('PGRST204')
    || s.includes('42703')
    || s.includes('schema cache')
  );
}

function friendlySqlError(msg) {
  if (isOwnerColumnMissingError(msg)) return OWNER_COLUMN_MISSING_MSG;
  return String(msg || 'Erro desconhecido');
}

let _ownerColumnCache = { at: 0, exists: null };
const OWNER_COLUMN_CACHE_MS = 15000;

async function probeOwnerColumn(force) {
  const now = Date.now();
  if (!force && _ownerColumnCache.exists !== null && now - _ownerColumnCache.at < OWNER_COLUMN_CACHE_MS) {
    return { exists: _ownerColumnCache.exists, cached: true };
  }
  try {
    await fetchAPI('/rest/v1/establishments?select=owner_user_id&limit=1');
    _ownerColumnCache = { at: now, exists: true };
    return { exists: true };
  } catch (e) {
    const msg = String(e?.message || e);
    if (isOwnerColumnMissingError(msg)) {
      _ownerColumnCache = { at: now, exists: false };
      return { exists: false, friendly: OWNER_COLUMN_MISSING_MSG };
    }
    return { exists: null, error: msg };
  }
}

function invalidateOwnerColumnCache() {
  _ownerColumnCache = { at: 0, exists: null };
}

async function showSqlError(title, detail) {
  injectSqlErrorStyles();
  const msg = escSqlMsg(detail || 'Erro desconhecido');
  if (typeof showConfirm === 'function') {
    return showConfirm({
      title: title || '❌ Erro SQL',
      message: `<pre class="sql-error-pre">${msg}</pre>`,
      confirmOnly: true,
      confirmText: 'OK'
    });
  }
  alert((title || 'Erro SQL') + '\n\n' + (detail || ''));
}

async function showSqlSuccess(title, detail) {
  injectSqlErrorStyles();
  const msg = escSqlMsg(detail || 'Concluído');
  if (typeof showConfirm === 'function') {
    return showConfirm({
      title: title || '✅ Sucesso',
      message: `<pre class="sql-success-pre">${msg}</pre>`,
      confirmOnly: true,
      confirmText: 'OK'
    });
  }
  alert((title || 'Sucesso') + '\n\n' + (detail || ''));
}

function injectSqlErrorStyles() {
  if (document.getElementById('sql-runner-error-styles')) return;
  const style = document.createElement('style');
  style.id = 'sql-runner-error-styles';
  style.textContent = `
    .confirm-box .sql-error-pre,
    .confirm-box .sql-success-pre {
      text-align: left;
      font-family: ui-monospace, 'JetBrains Mono', monospace;
      font-size: 12px;
      line-height: 1.45;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 280px;
      overflow: auto;
      margin: 0 0 20px;
      padding: 12px 14px;
      border-radius: 12px;
      background: #0f172a;
      color: #e2e8f0;
    }
    .confirm-box .sql-success-pre { background: #052e16; color: #bbf7d0; }
    .confirm-box .sql-error-pre { background: #450a0a; color: #fecaca; }
  `;
  document.head.appendChild(style);
}

async function probeSqlRpc() {
  try {
    const data = await fetchAPI('/rest/v1/rpc/proofly_run_migration', 'POST', { p_key: '__probe__' });
    return { available: true, sample: data };
  } catch (e) {
    const msg = String(e?.message || e);
    if (msg.includes('404') || msg.includes('Could not find') || msg.includes('proofly_run_migration')) {
      return { available: false, error: msg };
    }
    if (msg.includes('Migration desconhecida') || msg.includes('desconhecida')) {
      return { available: true };
    }
    return { available: false, error: msg };
  }
}

function getSqlText(path) {
  const key = path.replace(/^\.\//, '');
  if (typeof window.SQL_EMBEDDED !== 'undefined' && window.SQL_EMBEDDED[key]) {
    return window.SQL_EMBEDDED[key];
  }
  if (typeof window.SQL_EMBEDDED !== 'undefined' && window.SQL_EMBEDDED[path]) {
    return window.SQL_EMBEDDED[path];
  }
  return null;
}

async function fetchSqlFileText(path) {
  const embedded = getSqlText(path);
  if (embedded) return embedded;
  const resp = await fetch('./' + path.replace(/^\.\//, ''));
  if (!resp.ok) throw new Error(`Não foi possível carregar ${path} (${resp.status})`);
  return resp.text();
}

/** Copia SQL — NUNCA chama a API do Supabase */
async function copySqlFile(path) {
  const text = await fetchSqlFileText(path);
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return { ok: true, chars: text.length, text };
  }
  throw new Error('Clipboard não disponível — selecione o texto na caixa SQL da página e copie (Ctrl+C).');
}

function openSupabaseSqlEditor() {
  window.open(SUPABASE_SQL_EDITOR_URL, '_blank', 'noopener');
}

/** Copia SQL para clipboard — zero chamadas REST; Supabase só abre se pedir */
async function copySqlForPage(path, label, options = {}) {
  const { openEditor = false, silent = false } = options;
  injectSqlErrorStyles();
  const text = await fetchSqlFileText(path);
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
  }
  if (openEditor) openSupabaseSqlEditor();
  appendSqlLog({
    migrationId: 'copy_sql',
    status: 'ok',
    title: label || 'SQL copiado',
    result: path + ' → área de transferência' + (openEditor ? ' + SQL Editor' : '')
  });
  const ta = document.getElementById('sqlEmbeddedText');
  if (ta) {
    ta.value = text;
    ta.style.display = 'block';
  }
  if (!silent) {
    const editorNote = openEditor
      ? '\n✓ SQL Editor aberto em nova aba'
      : '\n✓ Use o link「Abrir SQL Editor」se precisar';
    await showSqlSuccess(
      '📋 SQL copiado',
      (label || path) + '\n\n✓ Texto na área de transferência' + editorNote + '\n\nCole no Supabase (Ctrl+V) → Run\nDepois clique「Já rodei — verificar」'
    );
  }
  return { ok: true, copied: true, text };
}

/** @deprecated use copySqlForPage */
async function copySqlAndOpenEditor(path, label) {
  return copySqlForPage(path, label, { openEditor: false });
}

function getMigrationById(id) {
  return SQL_MIGRATIONS.find((m) => m.id === id);
}

function buildMissingColumnHelp(mig) {
  const rode = mig?.rodeFile || 'migrations/027_RODE_NO_SUPABASE.sql';
  return [
    'A coluna owner_user_id ainda NÃO existe no Supabase.',
    '',
    'Escolha UMA opção:',
    '',
    'A) SQL único (recomendado agora):',
    `   1. Abra ou copie: ${rode}`,
    '   2. Cole no Supabase → SQL Editor → Run',
    '   3. Volte aqui e clique em "Verificar passo 2"',
    '',
    'B) Sequência com RPC:',
    '   1. Passo 1 — copie migrations/028_RODE_NO_SUPABASE.sql e rode no Supabase',
    '   2. Passo 2 — clique Executar (usa RPC, cria coluna + owners)',
    '',
    'O botão não pode criar colunas via API REST — só a RPC ou o SQL Editor fazem isso.'
  ].join('\n');
}

async function runMigrationRpc(rpcKey) {
  const data = await fetchAPI('/rest/v1/rpc/proofly_run_migration', 'POST', { p_key: rpcKey });
  if (data && data.ok === false) {
    const err = [data.error, data.sqlstate, data.hint].filter(Boolean).join('\n');
    throw new Error(err || JSON.stringify(data));
  }
  return data;
}

async function checkMigration027Status() {
  const col = await probeOwnerColumn();
  if (col.exists === false) {
    return {
      ok: false,
      pending: true,
      needsSql: true,
      label: 'Aguardando SQL no Supabase',
      friendly: col.friendly || OWNER_COLUMN_MISSING_MSG
    };
  }
  if (col.exists === null) {
    return { ok: false, label: 'Erro ao verificar coluna', error: col.error };
  }

  try {
    const all = await fetchAPI('/rest/v1/establishments?select=id,owner_user_id');
    const total = all?.length || 0;
    const withOwner = (all || []).filter((e) => e.owner_user_id).length;
    const missing = total - withOwner;
    return {
      ok: missing === 0 && total > 0,
      total,
      withOwner,
      missing,
      label: total ? `${withOwner}/${total} com owner` : 'Sem dados'
    };
  } catch (e) {
    const msg = friendlySqlError(e?.message || e);
    return { ok: false, label: 'Erro ao ler establishments', friendly: msg };
  }
}

function estHexSuffix(estId) {
  return String(estId).replace(/-/g, '').slice(-12).toLowerCase();
}

function ownerIdForEst(estId) {
  return `40000000-0000-4000-8000-${estHexSuffix(estId)}`;
}

/** Só grava owners via REST — NUNCA cria coluna (DDL só no SQL Editor ou RPC). */
async function runMigration027RestSeed() {
  const col = await probeOwnerColumn(true);
  if (col.exists !== true) {
    throw new Error(col.friendly || OWNER_COLUMN_MISSING_MSG);
  }

  const BATEL_ID = '10000000-0000-4000-8000-000000000001';
  const LEANDRO_EMAIL = 'leandro@proofly.com';
  let created = 0;
  let linked = 0;

  const users = await fetchAPI(
    `/rest/v1/users?email=eq.${encodeURIComponent(LEANDRO_EMAIL)}&select=id,establishment_id`
  );
  if (users?.[0]) {
    const leandroId = users[0].id;
    await fetchAPI(`/rest/v1/establishments?id=eq.${BATEL_ID}`, 'PATCH', { owner_user_id: leandroId });
    if (users[0].establishment_id !== BATEL_ID) {
      await fetchAPI(`/rest/v1/users?id=eq.${leandroId}`, 'PATCH', {
        establishment_id: BATEL_ID,
        role: 'estabelecimento'
      });
    }
  }

  const ests = await fetchAPI('/rest/v1/establishments?select=id,name,owner_user_id&order=name');
  for (const est of ests || []) {
    if (est.id === BATEL_ID || est.owner_user_id) {
      if (est.owner_user_id) linked += 1;
      continue;
    }
    const oid = ownerIdForEst(est.id);
    const email = `owner.${estHexSuffix(est.id)}@proofly.demo`;
    const name = `${est.name} — Owner`;

    let ownerId = oid;
    try {
      const inserted = await fetchAPI('/rest/v1/users', 'POST', {
        id: oid,
        name,
        email,
        provider: 'seed',
        role: 'estabelecimento',
        establishment_id: est.id
      });
      if (inserted?.[0]?.id) ownerId = inserted[0].id;
      created += 1;
    } catch (postErr) {
      const existing = await fetchAPI(`/rest/v1/users?email=eq.${encodeURIComponent(email)}&select=id`);
      if (!existing?.[0]) throw postErr;
      ownerId = existing[0].id;
    }

    await fetchAPI(`/rest/v1/establishments?id=eq.${est.id}`, 'PATCH', { owner_user_id: ownerId });
    linked += 1;
  }

  const status = await checkMigration027Status();
  return {
    ok: true,
    mode: 'rest',
    created,
    linked,
    message: status.label,
    ...status
  };
}

async function runSqlMigration(migrationId, options = {}) {
  injectSqlErrorStyles();
  const mig = getMigrationById(migrationId);
  if (!mig) {
    await showSqlError('❌ Migration não encontrada', migrationId);
    return { ok: false, error: 'not_found' };
  }

  if (mig.manualOnly) {
    const rode = mig.rodeFile || mig.sqlFile;
    return copySqlForPage(rode, `Passo ${mig.step || '?'} — ${mig.title}`);
  }

  const col = await probeOwnerColumn(true);
  if (col.exists !== true) {
    if (!options.silent) {
      return copySqlForPage(
        mig.rodeFile || 'migrations/027_RODE_NO_SUPABASE.sql',
        mig.title
      );
    }
    return { ok: false, needsCopy: true, needsSql: true };
  }

  appendSqlLog({ migrationId, status: 'running', title: mig.title });

  try {
    let result;
    const rpc = await probeSqlRpc();

    if (mig.rpcKey && rpc.available) {
      result = await runMigrationRpc(mig.rpcKey);
      result.mode = 'rpc';
    } else if (mig.id === '027_establishment_owners') {
      result = await runMigration027RestSeed();
    } else {
      throw new Error(
        rpc.error
          || 'RPC proofly_run_migration indisponível. Rode migrations/028_RODE_NO_SUPABASE.sql no Supabase.'
      );
    }

    invalidateOwnerColumnCache();

    const summary = result?.message || JSON.stringify(result, null, 2);
    appendSqlLog({ migrationId, status: 'ok', title: mig.title, result: summary, mode: result.mode });
    if (!options.silent) await showSqlSuccess('✅ Migration OK', `${mig.title}\n\n${summary}`);
    return { ok: true, result };
  } catch (e) {
    const detail = friendlySqlError(e?.message || e);
    appendSqlLog({ migrationId, status: 'error', title: mig.title, error: detail });
    if (!options.silent) await showSqlError(`❌ Erro — ${mig.title}`, detail);
    return { ok: false, error: detail };
  }
}

async function verifyMigrationStep(migrationId) {
  const mig = getMigrationById(migrationId);
  if (!mig) return { ok: false, label: 'Não encontrada' };

  if (mig.id === '028_proofly_sql_runner_rpc') {
    const rpc = await probeSqlRpc();
    return {
      ok: rpc.available,
      label: rpc.available ? 'RPC instalada ✓' : 'RPC ainda ausente',
      error: rpc.error
    };
  }

  if (typeof mig.checkStatus === 'function') {
    return mig.checkStatus();
  }
  return { ok: false, label: 'Sem verificação' };
}

async function runSqlSequence(sequenceId) {
  const seq = SQL_SEQUENCES.find((s) => s.id === sequenceId);
  if (!seq) {
    await showSqlError('❌ Sequência não encontrada', sequenceId);
    return { ok: false };
  }

  injectSqlErrorStyles();

  const col = await probeOwnerColumn(true);
  if (col.exists !== true) {
    return copySqlForPage(
      seq.oneShotRode || 'migrations/027_RODE_NO_SUPABASE.sql',
      seq.oneShotLabel || seq.title
    );
  }

  appendSqlLog({ migrationId: sequenceId, status: 'running', title: seq.title });

  const rpc = await probeSqlRpc();

  if (rpc.available) {
    for (const stepId of seq.steps) {
      const mig = getMigrationById(stepId);
      if (mig?.manualOnly) continue;
      const res = await runSqlMigration(stepId, { silent: true });
      if (!res.ok) {
        appendSqlLog({ migrationId: sequenceId, status: 'error', title: seq.title, error: res.error });
        await showSqlError(`❌ Sequência parou no passo ${mig?.step || stepId}`, res.error);
        return res;
      }
    }
    const st = await checkMigration027Status();
    const summary = st.label || 'Sequência concluída';
    appendSqlLog({ migrationId: sequenceId, status: 'ok', title: seq.title, result: summary, mode: 'rpc' });
    await showSqlSuccess('✅ Sequência OK', `${seq.title}\n\n${summary}`);
    return { ok: true };
  }

  if (col.exists) {
    await showSqlError(
      '⚠️ Coluna existe, RPC ausente',
      'A coluna owner_user_id já existe, mas a RPC não.\n\nRode o passo 1 (028) para habilitar botões automáticos,\nou use Verificar para ver quantos owners faltam.'
    );
    return { ok: false };
  }

  await showSqlError(
    '📋 Rode o SQL primeiro',
    [
      `Sequência: ${seq.title}`,
      '',
      'A RPC ainda não está instalada. Use o botão:',
      `「${seq.oneShotLabel}」`,
      '',
      `Arquivo: ${seq.oneShotRode}`,
      '',
      '1. Copiar SQL → Supabase SQL Editor → Run',
      '2. Volte e clique "Verificar passo 2" ou "Rodar sequência" de novo'
    ].join('\n')
  );
  return { ok: false, needsManualSql: true };
}

async function runOneShotSql(sequenceId) {
  const seq = SQL_SEQUENCES.find((s) => s.id === sequenceId);
  if (!seq?.oneShotRode) {
    await showSqlError('❌ SQL único não configurado', sequenceId);
    return { ok: false };
  }
  try {
    return await copySqlForPage(seq.oneShotRode, seq.oneShotLabel || 'SQL único');
  } catch (e) {
    await showSqlError('❌ Erro ao copiar', String(e?.message || e));
    return { ok: false, error: String(e?.message || e) };
  }
}

async function promptMissingOwnerColumnIfNeeded() {
  const col = await probeOwnerColumn(true);
  if (col.exists !== false) return;
  const key = 'proofly_sql_027_prompted';
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, '1');
  await showSqlError('⚠️ Ação necessária no Supabase', OWNER_COLUMN_MISSING_MSG);
}

function getRunnableMigrations() {
  return SQL_MIGRATIONS.filter((m) => !m.setup);
}

window.SQL_MIGRATIONS = SQL_MIGRATIONS;
window.SQL_SEQUENCES = SQL_SEQUENCES;
window.SQL_LOG_STORAGE_KEY = SQL_LOG_STORAGE_KEY;
window.getSqlLog = getSqlLog;
window.appendSqlLog = appendSqlLog;
window.clearSqlLog = clearSqlLog;
window.probeSqlRpc = probeSqlRpc;
window.probeOwnerColumn = probeOwnerColumn;
window.invalidateOwnerColumnCache = invalidateOwnerColumnCache;
window.friendlySqlError = friendlySqlError;
window.SUPABASE_SQL_EDITOR_URL = SUPABASE_SQL_EDITOR_URL;
window.OWNER_COLUMN_MISSING_MSG = OWNER_COLUMN_MISSING_MSG;
window.promptMissingOwnerColumnIfNeeded = promptMissingOwnerColumnIfNeeded;
window.copySqlFile = copySqlFile;
window.copySqlForPage = copySqlForPage;
window.copySqlAndOpenEditor = copySqlAndOpenEditor;
window.openSupabaseSqlEditor = openSupabaseSqlEditor;
window.getSqlText = getSqlText;
window.runSqlMigration = runSqlMigration;
window.runSqlSequence = runSqlSequence;
window.runOneShotSql = runOneShotSql;
window.verifyMigrationStep = verifyMigrationStep;
window.checkMigration027Status = checkMigration027Status;
window.getRunnableMigrations = getRunnableMigrations;
window.getMigrationById = getMigrationById;
window.showSqlError = showSqlError;
window.showSqlSuccess = showSqlSuccess;
window.SQL_RUNNER_VERSION = SQL_RUNNER_VERSION;

async function getMigrationRunMode(mig) {
  if (!mig || mig.manualOnly) return 'copy';
  const col = await probeOwnerColumn();
  if (col.exists !== true) return 'copy';
  const rpc = await probeSqlRpc();
  if (mig.rpcKey && rpc.available) return 'rpc';
  if (mig.id === '027_establishment_owners') return 'rest';
  return 'copy';
}

window.getMigrationRunMode = getMigrationRunMode;