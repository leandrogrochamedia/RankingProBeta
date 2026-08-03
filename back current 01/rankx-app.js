// Rank-X App helpers - mock data
window.RX = {
  toast(msg){ const el=document.getElementById('rx-toast'); if(!el) return alert(msg); el.textContent=msg; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),3000); },
  openModal(id){ document.getElementById(id)?.classList.add('is-open'); },
  closeModal(id){ document.getElementById(id)?.classList.remove('is-open'); }
};
