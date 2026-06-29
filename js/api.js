// Ranking Pro — Supabase REST (Proofly) + compat MVP fetchAPI

(function (global) {
  'use strict';

  function getConfig() {
    const cfg = global.RANKING_PRO_CONFIG || {};
    const url = cfg.SUPABASE_URL || global.SUPABASE_URL;
    const key = cfg.SUPABASE_ANON_KEY || cfg.SUPABASE_KEY || global.SUPABASE_KEY;
    if (!url || !key) {
      throw new Error('Configure config.js com SUPABASE_URL e SUPABASE_ANON_KEY.');
    }
    return { SUPABASE_URL: url, SUPABASE_ANON_KEY: key };
  }

  function syncGlobals() {
    const cfg = getConfig();
    global.SUPABASE_URL = cfg.SUPABASE_URL;
    global.SUPABASE_KEY = cfg.SUPABASE_ANON_KEY;
    global.SUPABASE_ANON_KEY = cfg.SUPABASE_ANON_KEY;
  }

  function baseHeaders(extra) {
    const { SUPABASE_ANON_KEY } = getConfig();
    return {
      apikey: SUPABASE_ANON_KEY,
      Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      ...(extra || {})
    };
  }

  async function fetchRest(path, options) {
    options = options || {};
    const { SUPABASE_URL } = getConfig();
    const url = SUPABASE_URL.replace(/\/$/, '') + path;
    const headers = { ...baseHeaders(options.prefer ? { Prefer: options.prefer } : {}), ...(options.headers || {}) };
    const res = await fetch(url, {
      method: options.method || 'GET',
      headers: headers,
      body: options.body
    });

    const text = await res.text();
    let data = null;
    if (text) {
      try { data = JSON.parse(text); } catch { data = text; }
    }

    if (!res.ok) {
      const msg = data?.message || data?.error || data?.hint || data?.code || res.statusText || 'Erro na API';
      throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }

    return data;
  }

  async function fetchAPI(path, method, body) {
    if (typeof method === 'object' && method !== null) {
      body = method.body;
      method = method.method;
    }
    method = (method || 'GET').toUpperCase();
    const options = { method: method };
    if (body && ['POST', 'PATCH', 'PUT'].includes(method)) {
      options.prefer = 'return=representation';
      options.body = JSON.stringify(body);
    }
    return fetchRest(path, options);
  }

  async function rpc(fnName, params) {
    params = params || {};
    return fetchRest('/rest/v1/rpc/' + fnName, {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  async function select(table, query) {
    query = query || '';
    const q = query.startsWith('?') ? query : '?' + query;
    return fetchRest('/rest/v1/' + table + q);
  }

  async function insert(table, row) {
    const data = await fetchRest('/rest/v1/' + table, {
      method: 'POST',
      prefer: 'return=representation',
      body: JSON.stringify(row)
    });
    return Array.isArray(data) ? data[0] : data;
  }

  async function update(table, query, patch) {
    const q = query.startsWith('?') ? query : '?' + query;
    const data = await fetchRest('/rest/v1/' + table + q, {
      method: 'PATCH',
      prefer: 'return=representation',
      body: JSON.stringify(patch)
    });
    return Array.isArray(data) ? data[0] : data;
  }

  try { syncGlobals(); } catch (e) { /* config loads later via loader */ }

  global.fetchAPI = fetchAPI;
  global.RankingProAPI = {
    getConfig: getConfig,
    syncGlobals: syncGlobals,
    fetchRest: fetchRest,
    fetchAPI: fetchAPI,
    rpc: rpc,
    select: select,
    insert: insert,
    update: update
  };
})(window);