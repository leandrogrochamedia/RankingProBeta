// ============================================================
// PROOFLY — Utilitários do Widget (embed + preview)
// ============================================================

(function(global) {
  'use strict';

  function getAppBaseUrl() {
    if (global.PROOFLY_APP_BASE) return String(global.PROOFLY_APP_BASE).replace(/\/$/, '');
    const path = global.location?.pathname || '';
    const dir = path.replace(/\/[^/]*$/, '') || '';
    return (global.location?.origin || '') + dir;
  }

  function getWidgetScriptUrl() {
    return `${getAppBaseUrl()}/widget-embed.js`;
  }

  function getWidgetCssUrl() {
    return `${getAppBaseUrl()}/widget.css`;
  }

  function buildEmbedSnippet(establishmentId, mode) {
    const m = mode || 'medium';
    const id = String(establishmentId || '').trim();
    if (!id) return '';
    const script = getWidgetScriptUrl();
    return `<script src="${script}"><\/script>\n<div data-proofly-id="${id}" data-mode="${m}"><\/div>`;
  }

  function buildIframeSnippet(establishmentId, mode, height) {
    const m = mode || 'medium';
    const id = String(establishmentId || '').trim();
    if (!id) return '';
    const h = height || (m === 'compact' ? 120 : m === 'full' ? 520 : 360);
    const src = `${getAppBaseUrl()}/widget.html?embed=1&id=${encodeURIComponent(id)}&mode=${encodeURIComponent(m)}`;
    return `<iframe src="${src}" title="Ranking Pro — avaliações" style="width:100%;max-width:480px;border:0;border-radius:16px;min-height:${h}px;" loading="lazy"><\/iframe>`;
  }

  function configureWidgetRuntime() {
    if (typeof global.SUPABASE_URL !== 'undefined') {
      global.PROOFLY_API_BASE = `${global.SUPABASE_URL}/rest/v1`;
    }
    if (typeof global.SUPABASE_KEY !== 'undefined') {
      global.PROOFLY_API_KEY = global.SUPABASE_KEY;
    }
    global.PROOFLY_WIDGET_CSS = getWidgetCssUrl();
    global.PROOFLY_APP_BASE = getAppBaseUrl();
  }

  async function copyText(text) {
    if (!text) return false;
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  global.ProoflyWidgetUtils = {
    getAppBaseUrl,
    getWidgetScriptUrl,
    getWidgetCssUrl,
    buildEmbedSnippet,
    buildIframeSnippet,
    configureWidgetRuntime,
    copyText
  };
})(typeof window !== 'undefined' ? window : globalThis);