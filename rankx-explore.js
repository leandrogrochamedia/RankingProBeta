// rankx-explore.js - Motor do Explore - FIX city bug
async function rxLoadExplore(){
  const grid = document.getElementById('exploreGrid');
  if(grid){
    grid.innerHTML = '<div style="text-align:center; padding:40px; color:#94a3b8;">⏳ Carregando...</div>';
  }
  // queries corrigidas sem city em professionals
  const profSelect = 'id,name,specialty,avatar_url,avg_rating,total_reviews,igv_score,current_establishment_id';
  const estSelect = 'id,name,city,type,avg_rating,total_reviews,avatar_url';
  try{
    const [professionals, establishments] = await Promise.all([
      rxFetch(`/rest/v1/professionals?select=${profSelect}&is_active=eq.true&order=igv_score.desc&limit=50`),
      rxFetch(`/rest/v1/establishments?select=${estSelect}&order=avg_rating.desc&limit=30`)
    ]);
    return { professionals, establishments };
  }catch(e){ throw e; }
}
window.rxLoadExplore = rxLoadExplore;
