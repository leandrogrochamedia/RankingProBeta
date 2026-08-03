// rankx-reviews.js - Motor de avaliação via QR (inglês code, PT-BR UI)
async function rxSubmitReview({ professionalId, rating, comment, qrToken }){
  const session = rxGetSession();
  if(!session?.userId) throw new Error('Faça login primeiro');
  const payload = {
    user_id: session.userId,
    professional_id: professionalId,
    rating: rating,
    comment: comment||null,
    source: 'cliente',
    review_type: 'client_to_professional',
    verified: !!qrToken,
    is_verified: !!qrToken,
    qr_token: qrToken||null
  };
  const data = await rxFetch('/rest/v1/reviews','POST', payload);
  // recalcular média
  try{
    const reviews = await rxFetch(`/rest/v1/reviews?professional_id=eq.${professionalId}&select=rating`);
    const avg = reviews.length ? (reviews.reduce((s,r)=>s+r.rating,0)/reviews.length).toFixed(2) : rating;
    await rxFetch(`/rest/v1/professionals?id=eq.${professionalId}`,'PATCH',{ avg_rating: parseFloat(avg), total_reviews: reviews.length });
  }catch(e){ console.warn('recalc skip', e.message); }
  return data?.[0];
}
window.rxSubmitReview = rxSubmitReview;
