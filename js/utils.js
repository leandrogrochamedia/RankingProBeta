// Ranking Pro — utilitários slim (auth / seletor)

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

let _ownerColCache = null;

async function probeOwnerColumn(force) {
  if (!force && _ownerColCache) return _ownerColCache;
  _ownerColCache = { exists: true };
  return _ownerColCache;
}

window.escapeHtml = escapeHtml;
window.probeOwnerColumn = probeOwnerColumn;