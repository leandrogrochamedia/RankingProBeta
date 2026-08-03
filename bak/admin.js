// =====================================================
// PROOFLY - Página Admin
// =====================================================

// ========================================
// VERIFICAÇÃO DE AUTENTICAÇÃO
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  // Verifica se o usuário está logado e tem papel admin
  const user = checkAuth(true); // redireciona para login se não autenticado
  if (user && user.role !== 'admin') {
    // Se não for admin, redireciona para a página apropriada
    redirectByRole(user.role);
    return;
  }
  // Carregar dados
  carregarDashboardAdmin();
});

// ========================================
// CARREGAR DADOS DO ADMIN
// ========================================
async function carregarDashboardAdmin() {
  await Promise.all([
    carregarEstatisticas(),
    carregarProfissionais(),
    carregarEstabelecimentos(),
    carregarReviews(),
  ]);
}

// ---- Estatísticas ----
async function carregarEstatisticas() {
  try {
    const profs = await fetchAPI('/rest/v1/professionals?select=id');
    const ests = await fetchAPI('/rest/v1/establishments?select=id');
    const reviews = await fetchAPI('/rest/v1/reviews?select=id');
    const vinculos = await fetchAPI('/rest/v1/professional_establishment?select=id');

    document.getElementById('totalProfissionais').textContent = profs.length;
    document.getElementById('totalEstabelecimentos').textContent = ests.length;
    document.getElementById('totalReviews').textContent = reviews.length;
    document.getElementById('totalVinculos').textContent = vinculos.length;
  } catch (e) {
    console.error('Erro ao carregar estatísticas:', e);
  }
}

// ---- Profissionais (últimos 20) ----
async function carregarProfissionais() {
  const div = document.getElementById('adminProfissionaisList');
  try {
    const data = await fetchAPI('/rest/v1/professionals?select=id,name,specialty,avatar_url,avg_rating,total_reviews,client_portfolio_count,igv_score&order=igv_score.desc.nullslast&limit=20');
    if (!data.length) {
      div.innerHTML = '<p class="empty-msg">Nenhum profissional cadastrado.</p>';
      return;
    }
    let html = `<table>
      <thead><tr><th>Nome</th><th>Carteira</th><th>IGV</th><th>Média</th><th>Ações</th></tr></thead><tbody>`;
    data.forEach(p => {
      html += `
        <tr>
          <td>${escapeHtml(p.name)}</td>
          <td>${p.client_portfolio_count ?? 0}</td>
          <td>${p.igv_score != null ? Number(p.igv_score).toFixed(1) : '0'}</td>
          <td>${p.avg_rating ? p.avg_rating.toFixed(1) : '0.0'}</td>
          <td>
            <button class="btn btn-small btn-red" onclick="excluirProfissional('${p.id}')">🗑️</button>
          </td>
        </tr>
      `;
    });
    html += '</tbody></table>';
    div.innerHTML = html;
  } catch (e) {
    div.innerHTML = `<p style="color:red;">Erro: ${e.message}</p>`;
  }
}

// ---- Estabelecimentos (últimos 20) ----
async function carregarEstabelecimentos() {
  const div = document.getElementById('adminEstabelecimentosList');
  try {
    const data = await fetchAPI('/rest/v1/establishments?select=id,name,city,phone&order=created_at.desc&limit=20');
    if (!data.length) {
      div.innerHTML = '<p class="empty-msg">Nenhum estabelecimento cadastrado.</p>';
      return;
    }
    let html = `<table>
      <thead><tr><th>Nome</th><th>Cidade</th><th>Telefone</th><th>Ações</th></tr></thead><tbody>`;
    data.forEach(e => {
      html += `
        <tr>
          <td>${escapeHtml(e.name)}</td>
          <td>${escapeHtml(e.city || '-')}</td>
          <td>${escapeHtml(e.phone || '-')}</td>
          <td>
            <button class="btn btn-small btn-red" onclick="excluirEstabelecimento('${e.id}')">🗑️</button>
          </td>
        </tr>
      `;
    });
    html += '</tbody></table>';
    div.innerHTML = html;
  } catch (e) {
    div.innerHTML = `<p style="color:red;">Erro: ${e.message}</p>`;
  }
}

// ---- Avaliações (últimas 20) ----
async function carregarReviews() {
  const div = document.getElementById('adminReviewsList');
  try {
    const data = typeof fetchReviews === 'function'
      ? await fetchReviews('', { limit: 20 })
      : await fetchAPI('/rest/v1/reviews?select=id,rating,comment,created_at,verified,source&order=created_at.desc&limit=20');
    if (!data.length) {
      div.innerHTML = '<p class="empty-msg">Nenhuma avaliação ainda.</p>';
      return;
    }
    let html = `<table>
      <thead><tr><th>Nota</th><th>Autor</th><th>Tipo</th><th>Contexto</th><th>Comentário</th><th>Data</th><th>Ações</th></tr></thead><tbody>`;
    data.forEach(r => {
      const stars = renderStars(r.rating);
      const author = typeof getReviewAuthorName === 'function' ? getReviewAuthorName(r) : (r.user?.name || '—');
      const ctx = typeof getReviewContextText === 'function'
        ? getReviewContextText(r)
        : (typeof formatReviewContext === 'function' ? formatReviewContext(r) : (r.professional?.name || '—'));
      const badge = typeof getReviewSourceBadge === 'function' ? getReviewSourceBadge(r) : (r.source || '—');
      const verified = (r.is_verified ?? r.verified) ? ' ✅' : '';
      html += `
        <tr>
          <td>${stars}</td>
          <td>${escapeHtml(author)}${verified}</td>
          <td style="font-size:12px;">${escapeHtml(badge)}</td>
          <td style="font-size:12px;color:#64748b;">${escapeHtml(ctx)}</td>
          <td>${r.comment ? escapeHtml(r.comment.substring(0, 50)) : '-'}</td>
          <td>${tempoRelativo(r.created_at)}</td>
          <td>
            <button class="btn btn-small btn-red" onclick="excluirReview('${r.id}')">🗑️</button>
          </td>
        </tr>
      `;
    });
    html += '</tbody></table>';
    div.innerHTML = html;
  } catch (e) {
    div.innerHTML = `<p style="color:red;">Erro: ${e.message}</p>`;
  }
}

// ========================================
// AÇÕES DE EXCLUSÃO
// ========================================
window.excluirProfissional = async function(id) {
  if (!confirm('Tem certeza que deseja excluir este profissional? Todas as avaliações e vínculos serão removidos.')) return;
  try {
    await fetchAPI(`/rest/v1/professionals?id=eq.${id}`, 'DELETE');
    showUserMessage('✅ Profissional excluído.', false);
    carregarProfissionais(); // recarrega apenas a lista
    carregarEstatisticas();
  } catch (e) {
    showUserMessage('Erro ao excluir: ' + e.message, true);
  }
};

window.excluirEstabelecimento = async function(id) {
  if (!confirm('Tem certeza que deseja excluir este estabelecimento?')) return;
  try {
    await fetchAPI(`/rest/v1/establishments?id=eq.${id}`, 'DELETE');
    showUserMessage('✅ Estabelecimento excluído.', false);
    carregarEstabelecimentos();
    carregarEstatisticas();
  } catch (e) {
    showUserMessage('Erro ao excluir: ' + e.message, true);
  }
};

window.excluirReview = async function(id) {
  if (!confirm('Excluir esta avaliação?')) return;
  try {
    await fetchAPI(`/rest/v1/reviews?id=eq.${id}`, 'DELETE');
    showUserMessage('✅ Avaliação excluída.', false);
    carregarReviews();
    carregarEstatisticas();
  } catch (e) {
    showUserMessage('Erro ao excluir: ' + e.message, true);
  }
};