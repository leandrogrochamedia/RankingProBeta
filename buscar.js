// =====================================================
// Ranking Pro Shark — Busca simples (especialidade + cidade)
// Só descoberta → perfil público. Avaliação = só QR.
// =====================================================

(function() {
  'use strict';

  const LIMIT = 30;

  function esc(s) {
    return typeof escapeHtml === 'function' ? escapeHtml(s) : String(s || '');
  }

  function profileUrl(id) {
    return './p/?id=' + encodeURIComponent(id);
  }

  function formatRating(avg, total) {
    const n = Number(avg) || 0;
    const c = Number(total) || 0;
    return n.toFixed(1) + ' · ' + (c === 1 ? '1 avaliação' : c + ' avaliações');
  }

  function renderCard(prof) {
    const city = prof.current_establishment?.city || '';
    const place = city ? esc(city) : 'Cidade não informada';
    const spec = esc(prof.specialty || prof.profile?.specialty || 'Profissional');
    const name = esc(prof.name || 'Profissional');
    const rating = formatRating(prof.avg_rating, prof.total_reviews);
    const href = profileUrl(prof.id);

    return (
      '<li class="shark-buscar-card glass-surface">' +
        '<a href="' + href + '" class="shark-buscar-card-link">' +
          '<div class="shark-buscar-card-head">' +
            '<span class="shark-buscar-card-name">' + name + '</span>' +
            '<span class="shark-buscar-card-rating">' + esc(rating) + '</span>' +
          '</div>' +
          '<p class="shark-buscar-card-meta">' + spec + ' · ' + place + '</p>' +
          '<span class="shark-buscar-card-cta">Ver reputação →</span>' +
        '</a>' +
      '</li>'
    );
  }

  async function searchProfessionals(especialidade, cidade) {
    const select = [
      'id', 'name', 'specialty', 'avg_rating', 'total_reviews',
      'profile:professional_profiles(specialty)',
      'current_establishment:establishments!professionals_current_establishment_id_fkey(city)'
    ].join(',');

    const params = new URLSearchParams();
    params.set('select', select);
    params.set('order', 'avg_rating.desc,total_reviews.desc');
    params.set('limit', String(LIMIT));

    const spec = (especialidade || '').trim();
    const city = (cidade || '').trim();

    if (spec) {
      params.set('or', '(specialty.ilike.*' + spec + '*,name.ilike.*' + spec + '*)');
    }

    let rows = await fetchAPI('/rest/v1/professionals?' + params.toString());
    if (city) {
      const needle = city.toLowerCase();
      rows = (rows || []).filter(function(p) {
        const c = (p.current_establishment?.city || '').toLowerCase();
        return c.includes(needle);
      });
    }
    return rows;
  }

  async function handleSearch(e) {
    e.preventDefault();
    const spec = document.getElementById('buscarEspecialidade')?.value || '';
    const city = document.getElementById('buscarCidade')?.value || '';
    const hint = document.getElementById('buscarHint');
    const wrap = document.getElementById('buscarResults');
    const list = document.getElementById('buscarList');
    const count = document.getElementById('buscarCount');
    const btn = document.getElementById('btnBuscar');

    if (!spec.trim() && !city.trim()) {
      if (hint) hint.textContent = 'Informe especialidade e/ou cidade.';
      if (wrap) wrap.hidden = true;
      return;
    }

    if (btn) btn.disabled = true;
    if (hint) hint.textContent = 'Buscando…';
    if (wrap) wrap.hidden = true;

    try {
      const rows = await searchProfessionals(spec, city);
      const items = rows || [];

      if (!items.length) {
        if (hint) hint.textContent = 'Nenhum profissional encontrado. Tente outros termos.';
        return;
      }

      if (hint) hint.textContent = '';
      if (count) {
        count.textContent = items.length === 1
          ? '1 profissional encontrado'
          : items.length + ' profissionais encontrados';
      }
      if (list) list.innerHTML = items.map(renderCard).join('');
      if (wrap) wrap.hidden = false;
    } catch (err) {
      console.error(err);
      if (hint) hint.textContent = 'Erro na busca. Tente novamente.';
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function init() {
    document.getElementById('buscarForm')?.addEventListener('submit', handleSearch);
    const params = new URLSearchParams(window.location.search);
    const specEl = document.getElementById('buscarEspecialidade');
    const cityEl = document.getElementById('buscarCidade');
    if (specEl && params.get('especialidade')) specEl.value = params.get('especialidade');
    if (cityEl && params.get('cidade')) cityEl.value = params.get('cidade');
    if (params.get('especialidade') || params.get('cidade')) {
      document.getElementById('buscarForm')?.requestSubmit();
    }
  }

  function boot() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }
  if (typeof window.fetchAPI === 'function') boot();
  else document.addEventListener('scriptsLoaded', boot, { once: true });
})();