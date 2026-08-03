// Rank-X API - fetch wrapper Supabase (baseado no seu api.js original)
async function rxFetch(path, method='GET', body=null){
  const headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": "Bearer " + SUPABASE_KEY,
    "Content-Type": "application/json"
  };
  if(['POST','PATCH','PUT'].includes(method.toUpperCase())) headers['Prefer']='return=representation';
  const opts={method, headers};
  if(body) opts.body=JSON.stringify(body);
  if(DEBUG_MODE) console.log(`📡 ${method} ${path}`, body||'');
  const res = await fetch(SUPABASE_URL + path, opts);
  const txt = await res.text();
  let data; try{ data=JSON.parse(txt);}catch{ data=txt; }
  if(DEBUG_MODE) console.log(`✅ ${res.status}`, data);
  if(!res.ok) throw new Error(`Erro ${res.status}: ${typeof data==='string'?data:JSON.stringify(data)}`);
  return data;
}
function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function renderStars(r){ r=Math.round(r||0); return '★'.repeat(r)+'☆'.repeat(5-r); }
window.rxFetch = rxFetch;
window.escapeHtml = escapeHtml;
window.renderStars = renderStars;
