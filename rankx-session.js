// Rank-X Session - espelho do seu session.js mas com namespace rankx
function rxGetSession(){
  try{ const raw=sessionStorage.getItem('rankx_session'); return raw?JSON.parse(raw):null; }catch{ return null; }
}
function rxSetSession(data){
  sessionStorage.setItem('rankx_session', JSON.stringify(data));
  console.log('✅ [Rank-X] Sessão salva', data);
}
function rxClearSession(){
  sessionStorage.removeItem('rankx_session');
  ['selectedProfessionalId','selectedEstablishmentId'].forEach(k=>{ try{localStorage.removeItem(k)}catch{} });
}
function rxResetAndHome(){ rxClearSession(); location.replace('./index.html'); }
window.rxGetSession=rxGetSession; window.rxSetSession=rxSetSession; window.rxClearSession=rxClearSession; window.rxResetAndHome=rxResetAndHome;
