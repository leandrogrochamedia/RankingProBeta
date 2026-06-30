// =====================================================
// PROOFLY — Meu Perfil (cliente)
// =====================================================

(function() {
  'use strict';

  const PROF_STYLE_PICKS_FALLBACK = [
    'Hip Hop', 'Comunicativo', 'Moderno', 'Premium', 'Extrovertido',
    'Despojado', 'Experiente', 'MPB', 'Detalhista', 'Criativo', 'Casual', 'Noturno'
  ];
  const EST_STYLE_PICKS_FALLBACK = [
    'Descontraído', 'Premium', 'Família', 'Animado', 'Acolhedor', 'Wi-Fi', 'Moderno', 'Todos'
  ];

  function getProfStylePicks() {
    return (window.CLIENT_PROF_STYLE_PICKS && window.CLIENT_PROF_STYLE_PICKS.length)
      ? window.CLIENT_PROF_STYLE_PICKS
      : PROF_STYLE_PICKS_FALLBACK;
  }

  function getEstStylePicks() {
    return (window.CLIENT_EST_STYLE_PICKS && window.CLIENT_EST_STYLE_PICKS.length)
      ? window.CLIENT_EST_STYLE_PICKS
      : EST_STYLE_PICKS_FALLBACK;
  }

  let clientRecord = null;
  let isEditing = false;
  let avatarBase64 = null;
  let profStyleSelection = [];
  let estStyleSelection = [];
  let isSaving = false;
  let isLoadingProfile = false;
  let sessionUserId = null;

  const BUILD_TAG = '20260628-perfil-avatar-v6';
  const PROFILE_SAVE_SELECT = [
    'id', 'name', 'email', 'cpf', 'phone', 'whatsapp', 'birth_date', 'gender',
    'zip_code', 'street', 'number', 'complement', 'neighborhood', 'city', 'state',
    'prof_style_tags', 'est_style_tags', 'updated_at'
  ].join(',');
  const shell = document.getElementById('meuPerfilShell');
  const loadingOverlay = document.getElementById('meuPerfilLoadingOverlay');
  const loadingText = document.getElementById('meuPerfilLoadingText');

  function setPageLoading(active, text = 'Carregando perfil...') {
    if (loadingText) loadingText.textContent = text;
    if (loadingOverlay) loadingOverlay.classList.toggle('hidden', !active);
  }

  async function showPerfilGlassAlert(title, message, options = {}) {
    if (typeof showGlassAlert === 'function') {
      return showGlassAlert(title, message, options);
    }
    window.alert(`${title}\n\n${message}`);
    return true;
  }

  async function showPerfilGlassConfirm(options) {
    if (typeof showGlassConfirm === 'function') {
      return showGlassConfirm(options);
    }
    const msg = options?.message || 'Confirmar?';
    return window.confirm(msg);
  }
  const clientApi = () => (
    typeof window.CLIENT_PROFILES_API === 'string'
      ? window.CLIENT_PROFILES_API
      : '/rest/v1/client_profiles'
  );
  const apiFetch = (path, method, body, options) => {
    if (typeof window.fetchAPI !== 'function') {
      throw new Error('Sistema ainda carregando — aguarde e tente novamente.');
    }
    return window.fetchAPI(path, method, body, options);
  };
  const esc = typeof escapeHtml === 'function' ? escapeHtml : (s) => String(s || '');
  const fmtCep = typeof formatCepDisplay === 'function'
    ? formatCepDisplay
    : (z) => {
      const d = String(z || '').replace(/\D/g, '');
      if (d.length !== 8) return z || '—';
      return `${d.slice(0, 5)}-${d.slice(5)}`;
    };

  function formatCpfDisplay(cpf) {
    const d = String(cpf || '').replace(/\D/g, '');
    if (d.length !== 11) return cpf || '—';
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  }

  function formatPhoneDisplay(phone) {
    const d = String(phone || '').replace(/\D/g, '');
    if (d.length < 10) return phone || '—';
    if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
  }

  function formatDateBr(iso) {
    if (!iso) return '—';
    const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString('pt-BR');
  }

  function resolveChipTag(type, chipEl) {
    const idx = parseInt(chipEl.getAttribute('data-tag-idx'), 10);
    if (Number.isNaN(idx)) return chipEl.getAttribute('data-tag') || '';
    const picks = type === 'prof' ? getProfStylePicks() : getEstStylePicks();
    return picks[idx] || '';
  }

  function syncStyleSelectionsFromRecord() {
    profStyleSelection = [...(clientRecord?.prof_style_tags || [])];
    estStyleSelection = [...(clientRecord?.est_style_tags || [])];
  }

  function normalizeGenderValue(gender) {
    const g = String(gender || '').trim().toLowerCase();
    const map = {
      feminino: 'Feminino',
      masculino: 'Masculino',
      outro: 'Outro',
      'não-binário': 'Não-binário',
      'nao-binario': 'Não-binário',
      'prefiro não dizer': '',
      prefiro_nao_dizer: ''
    };
    return Object.prototype.hasOwnProperty.call(map, g) ? map[g] : (gender || '');
  }

  function renderStyleTag(tag) {
    return typeof renderTagWithEmoji === 'function' ? renderTagWithEmoji(tag) : esc(tag);
  }

  function normalizeAvatarUrl(url) {
    if (!url) return '';
    const s = String(url).trim();
    if (!s) return '';
    if (s.startsWith('data:image/') || s.startsWith('http://') || s.startsWith('https://') || s.startsWith('blob:')) {
      return s;
    }
    if (s.startsWith('/9j/')) return `data:image/jpeg;base64,${s}`;
    if (s.startsWith('iVBORw0KGgo')) return `data:image/png;base64,${s}`;
    return s;
  }

  function resolveAvatarDisplayUrl() {
    return normalizeAvatarUrl(avatarBase64 || clientRecord?.avatar_url || '');
  }

  function paintPerfilAvatar() {
    const c = clientRecord;
    if (!c) return;
    const img = document.getElementById('perfilAvatarImg');
    const fallback = document.getElementById('perfilAvatarFallback');
    const pending = document.getElementById('perfilAvatarPending');
    const ring = document.getElementById('perfilAvatarRing');
    const name = (isEditing ? document.getElementById('perfilName')?.value?.trim() : c.name) || c.name || '?';
    const url = resolveAvatarDisplayUrl();

    if (pending) pending.hidden = !avatarBase64;
    if (ring) {
      ring.classList.toggle('meu-perfil-avatar-ring--pending', !!avatarBase64);
      ring.classList.toggle('meu-perfil-avatar-ring--has-photo', !!url);
    }

    if (!img || !fallback) return;

    const initial = (name || '?').charAt(0).toUpperCase();
    fallback.textContent = initial;

    if (!url) {
      img.removeAttribute('src');
      img.style.display = 'none';
      fallback.style.display = 'flex';
      return;
    }

    function showAvatarLoaded() {
      img.style.display = 'block';
      fallback.style.display = 'none';
      if (ring) ring.classList.add('meu-perfil-avatar-ring--has-photo');
    }
    function showAvatarFallback() {
      img.style.display = 'none';
      fallback.style.display = 'flex';
      if (ring) ring.classList.remove('meu-perfil-avatar-ring--has-photo');
    }
    img.onload = function() {
      showAvatarLoaded();
    };
    img.onerror = function() {
      img.onerror = null;
      showAvatarFallback();
      console.warn('paintPerfilAvatar: falha ao carregar avatar');
    };
    img.alt = `Foto de ${name}`;
    img.src = url;
    if (img.complete && img.naturalWidth > 0) {
      showAvatarLoaded();
    }
  }

  function setAvatarUploadBusy(busy) {
    const btn = document.getElementById('perfilAvatarUploadBtn');
    const ring = document.getElementById('perfilAvatarRing');
    if (btn) {
      btn.classList.toggle('meu-perfil-upload-btn--busy', busy);
      btn.disabled = busy;
      btn.setAttribute('aria-busy', busy ? 'true' : 'false');
      btn.textContent = busy ? 'Processando foto…' : '📷 Alterar foto';
    }
    if (ring) ring.classList.toggle('meu-perfil-avatar-ring--loading', busy);
  }

  async function handleAvatarFileChange(file) {
    if (!file) return;
    if (!file.type?.startsWith('image/')) {
      await showPerfilGlassAlert('⚠️ Formato inválido', 'Escolha uma imagem (JPG, PNG ou WebP).', { tone: 'error' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      await showPerfilGlassAlert('⚠️ Arquivo grande', 'Use uma imagem de até 5 MB.', { tone: 'error' });
      return;
    }
    if (typeof resizeAndCompressImage !== 'function') {
      await showPerfilGlassAlert('⚠️ Aguarde', 'O sistema ainda está carregando. Tente novamente em instantes.', { tone: 'error' });
      return;
    }

    setAvatarUploadBusy(true);
    try {
      avatarBase64 = await resizeAndCompressImage(file, 400, 400, 0.75);
      paintPerfilAvatar();
      const saveBtn = document.getElementById('btnSavePerfil');
      if (saveBtn && !saveBtn.dataset.avatarHint) {
        saveBtn.dataset.avatarHint = '1';
        saveBtn.textContent = 'Salvar alterações (foto nova)';
      }
    } catch (err) {
      console.warn('handleAvatarFileChange:', err);
      await showPerfilGlassAlert('❌ Erro', 'Não foi possível processar a imagem. Tente outro arquivo.', { tone: 'error' });
    } finally {
      setAvatarUploadBusy(false);
    }
  }

  function openAvatarFilePicker() {
    document.getElementById('perfilAvatarInput')?.click();
  }

  function bindAvatarInput() {
    const input = document.getElementById('perfilAvatarInput');
    if (!input) return;

    if (input.dataset.bound !== '1') {
      input.dataset.bound = '1';
      input.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        await handleAvatarFileChange(file);
      });
    }
  }

  function editPillMarkup() {
    const label = isEditing ? '👁️ Ver' : '✏️ Editar';
    const aria = isEditing ? 'Ver perfil' : 'Editar perfil';
    return `<button type="button" class="meu-perfil-avatar-edit" id="btnToggleEdit" aria-label="${aria}">${label}</button>`;
  }

  function heroAvatarMarkup(c, { showEditPill = true } = {}) {
    return `
      <div class="meu-perfil-avatar-wrap">
        <div class="meu-perfil-avatar-ring${isEditing ? ' meu-perfil-avatar-ring--edit' : ''}" id="perfilAvatarRing">
          <img id="perfilAvatarImg" class="meu-perfil-avatar-img" alt="" />
          <span id="perfilAvatarFallback" class="meu-perfil-avatar-fallback">?</span>
          <span id="perfilAvatarPending" class="meu-perfil-avatar-pending" hidden>Foto alterada</span>
        </div>
        ${showEditPill ? editPillMarkup() : ''}
      </div>
    `;
  }

  function renderStyleTagsView(tags, emptyMsg) {
    if (!tags?.length) {
      return `<span class="text-glass-muted">${emptyMsg}</span>`;
    }
    return tags.map(t => `<span class="meu-perfil-tag">${renderStyleTag(t)}</span>`).join('');
  }

  function renderViewMode() {
    const c = clientRecord;
    if (!c) return;

    const address = [c.street, c.number].filter(Boolean).join(', ');
    const cityLine = [c.neighborhood, c.city, c.state].filter(Boolean).join(' · ');

    shell.innerHTML = `
      <article class="meu-perfil-card glass-surface">
        <div class="meu-perfil-hero">
          ${heroAvatarMarkup(c)}
          <h1 class="meu-perfil-name">${esc(c.name)}</h1>
          <p class="meu-perfil-sub">${esc(c.email || '—')}</p>
        </div>

        <section class="meu-perfil-section">
          <h2 class="meu-perfil-section-title">Dados pessoais</h2>
          <dl class="meu-perfil-dl">
            <div><dt>CPF</dt><dd>${esc(formatCpfDisplay(c.cpf))}</dd></div>
            <div><dt>Nascimento</dt><dd>${esc(formatDateBr(c.birth_date))}</dd></div>
            <div><dt>Gênero</dt><dd>${esc(c.gender || '—')}</dd></div>
          </dl>
        </section>

        <section class="meu-perfil-section">
          <h2 class="meu-perfil-section-title">Contato</h2>
          <dl class="meu-perfil-dl">
            <div><dt>Celular</dt><dd>${esc(formatPhoneDisplay(c.phone))}</dd></div>
            <div><dt>WhatsApp</dt><dd>${esc(formatPhoneDisplay(c.whatsapp))}</dd></div>
          </dl>
        </section>

        <section class="meu-perfil-section">
          <h2 class="meu-perfil-section-title">Endereço</h2>
          <dl class="meu-perfil-dl">
            <div><dt>CEP</dt><dd>${esc(fmtCep(c.zip_code))}</dd></div>
            <div><dt>Logradouro</dt><dd>${esc(address || '—')}</dd></div>
            <div><dt>Complemento</dt><dd>${esc(c.complement || '—')}</dd></div>
            <div><dt>Bairro / Cidade</dt><dd>${esc(cityLine || '—')}</dd></div>
          </dl>
        </section>

        <section class="meu-perfil-section">
          <h2 class="meu-perfil-section-title">Estilo de profissional</h2>
          <div class="meu-perfil-tags meu-perfil-tags--readonly">
            ${renderStyleTagsView(c.prof_style_tags, 'Nenhuma preferência de profissional')}
          </div>
        </section>

        <section class="meu-perfil-section">
          <h2 class="meu-perfil-section-title">Estilo de estabelecimento</h2>
          <div class="meu-perfil-tags meu-perfil-tags--readonly">
            ${renderStyleTagsView(c.est_style_tags, 'Nenhuma preferência de estabelecimento')}
          </div>
        </section>
      </article>

      <div id="meuPerfilHistory" class="meu-perfil-history-wrap">
        <div class="meu-perfil-history-loading">Carregando histórico...</div>
      </div>
    `;

    paintPerfilAvatar();
    loadClientHistory();
  }

  function renderStyleChips() {
    const profHtml = getProfStylePicks().map((tag, idx) => {
      const active = profStyleSelection.includes(tag) ? ' active' : '';
      return `<button type="button" class="meu-perfil-style-chip${active}" data-type="prof" data-tag-idx="${idx}" aria-pressed="${active ? 'true' : 'false'}">${renderStyleTag(tag)}</button>`;
    }).join('');
    const estHtml = getEstStylePicks().map((tag, idx) => {
      const active = estStyleSelection.includes(tag) ? ' active' : '';
      return `<button type="button" class="meu-perfil-style-chip${active}" data-type="est" data-tag-idx="${idx}" aria-pressed="${active ? 'true' : 'false'}">${renderStyleTag(tag)}</button>`;
    }).join('');
    return { profHtml, estHtml };
  }

  function renderEditMode() {
    const c = clientRecord;
    if (!c) return;
    const chips = renderStyleChips();

    shell.innerHTML = `
      <form class="meu-perfil-card glass-surface meu-perfil-card--edit" id="meuPerfilForm">
        <div class="meu-perfil-hero meu-perfil-hero--edit">
          ${heroAvatarMarkup(c)}
          <input type="file" id="perfilAvatarInput" accept="image/*" style="display:none;" />
          <button type="button" class="meu-perfil-upload-btn" id="perfilAvatarUploadBtn">📷 Alterar foto</button>
          <p class="meu-perfil-upload-hint" id="perfilAvatarHint">Toque na foto ou no botão para trocar a imagem</p>
        </div>

        <div class="meu-perfil-field">
          <label for="perfilName">Nome completo</label>
          <input type="text" id="perfilName" value="${esc(c.name)}" required />
        </div>
        <div class="meu-perfil-field">
          <label for="perfilEmail">E-mail</label>
          <input type="email" id="perfilEmail" value="${esc(c.email || '')}" />
        </div>
        <div class="meu-perfil-field">
          <label for="perfilCpf">CPF</label>
          <input type="text" id="perfilCpf" value="${esc(formatCpfDisplay(c.cpf))}" placeholder="000.000.000-00" maxlength="14" inputmode="numeric" />
        </div>
        <div class="meu-perfil-row">
          <div class="meu-perfil-field">
            <label for="perfilBirth">Nascimento</label>
            <input type="text" id="perfilBirth" value="${c.birth_date ? esc(formatDateBr(c.birth_date)) : ''}" placeholder="DD/MM/AAAA" />
          </div>
          <div class="meu-perfil-field">
            <label for="perfilGender">Gênero</label>
            <select id="perfilGender">
              <option value="">Prefiro não informar</option>
              <option value="Feminino" ${normalizeGenderValue(c.gender) === 'Feminino' ? 'selected' : ''}>Feminino</option>
              <option value="Masculino" ${normalizeGenderValue(c.gender) === 'Masculino' ? 'selected' : ''}>Masculino</option>
              <option value="Não-binário" ${normalizeGenderValue(c.gender) === 'Não-binário' ? 'selected' : ''}>Não-binário</option>
              <option value="Outro" ${normalizeGenderValue(c.gender) === 'Outro' ? 'selected' : ''}>Outro</option>
            </select>
          </div>
        </div>

        <div class="meu-perfil-row">
          <div class="meu-perfil-field">
            <label for="perfilPhone">Celular</label>
            <input type="tel" id="perfilPhone" value="${esc(formatPhoneDisplay(c.phone))}" />
          </div>
          <div class="meu-perfil-field">
            <label for="perfilWhatsapp">WhatsApp</label>
            <input type="tel" id="perfilWhatsapp" value="${esc(formatPhoneDisplay(c.whatsapp))}" />
          </div>
        </div>

        <div class="meu-perfil-field">
          <label for="perfilCep">CEP</label>
          <input type="text" id="perfilCep" value="${esc(fmtCep(c.zip_code) === '—' ? '' : fmtCep(c.zip_code))}" placeholder="00000-000" maxlength="9" inputmode="numeric" />
        </div>
        <div class="meu-perfil-row">
          <div class="meu-perfil-field meu-perfil-field--grow">
            <label for="perfilStreet">Rua</label>
            <input type="text" id="perfilStreet" value="${esc(c.street || '')}" />
          </div>
          <div class="meu-perfil-field meu-perfil-field--short">
            <label for="perfilNumber">Nº</label>
            <input type="text" id="perfilNumber" value="${esc(c.number || '')}" />
          </div>
        </div>
        <div class="meu-perfil-field">
          <label for="perfilComplement">Complemento</label>
          <input type="text" id="perfilComplement" value="${esc(c.complement || '')}" />
        </div>
        <div class="meu-perfil-row">
          <div class="meu-perfil-field">
            <label for="perfilNeighborhood">Bairro</label>
            <input type="text" id="perfilNeighborhood" value="${esc(c.neighborhood || '')}" />
          </div>
          <div class="meu-perfil-field">
            <label for="perfilCity">Cidade</label>
            <input type="text" id="perfilCity" value="${esc(c.city || '')}" />
          </div>
          <div class="meu-perfil-field meu-perfil-field--short">
            <label for="perfilState">UF</label>
            <input type="text" id="perfilState" value="${esc(c.state || '')}" maxlength="2" />
          </div>
        </div>

        <section class="meu-perfil-section">
          <h2 class="meu-perfil-section-title">Estilo de profissional</h2>
          <p class="meu-perfil-section-hint">Escolha até 5 preferências</p>
          <div class="meu-perfil-style-chips" id="perfilProfChips">${chips.profHtml}</div>
        </section>
        <section class="meu-perfil-section">
          <h2 class="meu-perfil-section-title">Estilo de estabelecimento</h2>
          <p class="meu-perfil-section-hint">Escolha até 3 preferências</p>
          <div class="meu-perfil-style-chips" id="perfilEstChips">${chips.estHtml}</div>
        </section>

        <div class="meu-perfil-actions">
          <button type="button" class="btn btn-outline" id="btnCancelEdit">Cancelar</button>
          <button type="button" class="btn btn-primary" id="btnSavePerfil">Salvar alterações</button>
        </div>
      </form>
    `;

    paintPerfilAvatar();
    bindEditEvents();
  }

  function resolveReviewEstablishmentName(review, estabNames) {
    const snap = review.prof_link_snapshot;
    if (snap?.establishment_id) {
      const name = estabNames[snap.establishment_id]
        || review.establishment?.name
        || 'Estabelecimento';
      return { id: snap.establishment_id, name, source: 'snapshot' };
    }
    if (review.establishment_id) {
      const name = review.establishment?.name || estabNames[review.establishment_id] || 'Estabelecimento';
      return { id: review.establishment_id, name, source: review.establishment?.name ? 'join' : 'id' };
    }
    return null;
  }

  function groupEstablishmentVisits(reviews) {
    const map = new Map();
    reviews.forEach(r => {
      const eid = r.establishment_id || r.establishment?.id;
      if (!eid) return;
      const created = r.created_at || '';
      const existing = map.get(eid);
      if (!existing) {
        map.set(eid, {
          id: eid,
          name: r.establishment?.name || 'Estabelecimento',
          lastVisit: created,
          lastRating: r.rating,
          count: 1
        });
        return;
      }
      existing.count += 1;
      if (created > existing.lastVisit) {
        existing.lastVisit = created;
        existing.lastRating = r.rating;
      }
    });
    return [...map.values()].sort((a, b) => (b.lastVisit || '').localeCompare(a.lastVisit || ''));
  }

  function groupProfessionalVisits(reviews, estabNames) {
    const map = new Map();
    reviews.forEach(r => {
      const pid = r.professional_id || r.professional?.id;
      if (!pid) return;
      let atVisit = resolveReviewEstablishmentName(r, estabNames);
      const currentEstab = r.professional?.current_establishment || null;
      if (!atVisit && currentEstab?.id) {
        atVisit = { id: currentEstab.id, name: currentEstab.name, source: 'current_fallback' };
      }
      const created = r.created_at || '';
      const existing = map.get(pid);
      if (!existing) {
        map.set(pid, {
          id: pid,
          name: r.professional?.name || 'Profissional',
          lastVisit: created,
          lastRating: r.rating,
          atVisit,
          currentEstab,
          count: 1
        });
        return;
      }
      existing.count += 1;
      if (created > existing.lastVisit) {
        existing.lastVisit = created;
        existing.lastRating = r.rating;
        existing.atVisit = atVisit;
        existing.currentEstab = currentEstab;
      }
    });
    return [...map.values()].sort((a, b) => (b.lastVisit || '').localeCompare(a.lastVisit || ''));
  }

  function renderHistoryHtml(estVisits, profVisits) {
    const estBlock = estVisits.length
      ? estVisits.map(e => {
        const date = e.lastVisit ? formatDateBr(e.lastVisit) : '';
        const stars = typeof renderStars === 'function' ? renderStars(e.lastRating) : `${e.lastRating || 0}★`;
        const href = typeof profilePageUrl === 'function'
          ? profilePageUrl('estabelecimento', e.id)
          : `./perfil-page.html?id=${e.id}&type=establishment&tipo=estabelecimento`;
        return `
          <li class="meu-perfil-history-item">
            <div class="meu-perfil-history-main">
              <a href="${esc(href)}" class="meu-perfil-history-name">${esc(e.name)}</a>
              <span class="meu-perfil-history-meta">${stars} · ${esc(date)}</span>
            </div>
            <a href="${esc(href)}" class="meu-perfil-history-link">Ver local</a>
          </li>
        `;
      }).join('')
      : '<p class="meu-perfil-history-empty">Você ainda não avaliou nenhum lugar. Suas visitas aparecerão aqui.</p>';

    const profBlock = profVisits.length
      ? profVisits.map(p => {
        const date = p.lastVisit ? formatDateBr(p.lastVisit) : '';
        const stars = typeof renderStars === 'function' ? renderStars(p.lastRating) : `${p.lastRating || 0}★`;
        const profHref = typeof profilePageUrl === 'function'
          ? profilePageUrl('profissional', p.id)
          : `./perfil-page.html?id=${p.id}&type=professional&tipo=profissional`;
        const atName = p.atVisit?.name;
        const curName = p.currentEstab?.name;
        const curId = p.currentEstab?.id;
        let contextLine = '';
        if (atName) {
          const legacy = p.atVisit?.source === 'current_fallback'
            ? ' <span class="meu-perfil-history-legacy">(vínculo atual)</span>'
            : '';
          contextLine = `<p class="meu-perfil-history-context">Você foi atendido(a) por <strong>${esc(p.name)}</strong> no <strong>${esc(atName)}</strong>${legacy}</p>`;
        } else {
          contextLine = `<p class="meu-perfil-history-context">Você foi atendido(a) por <strong>${esc(p.name)}</strong></p>`;
        }
        let todayLine = '';
        if (curName && atName && curId !== p.atVisit?.id) {
          todayLine = `<p class="meu-perfil-history-today">Hoje, <strong>${esc(p.name)}</strong> está no <strong>${esc(curName)}</strong></p>`;
        } else if (curName && !atName) {
          todayLine = `<p class="meu-perfil-history-today">Atualmente em <strong>${esc(curName)}</strong></p>`;
        }
        return `
          <li class="meu-perfil-history-item meu-perfil-history-item--prof">
            <div class="meu-perfil-history-main">
              <a href="${esc(profHref)}" class="meu-perfil-history-name">${esc(p.name)}</a>
              <span class="meu-perfil-history-meta">${stars} · ${esc(date)}</span>
              ${contextLine}
              ${todayLine}
              <button type="button" class="meu-perfil-history-traj" data-prof-id="${esc(p.id)}">Ver trajetória</button>
              <div class="meu-perfil-traj-panel" id="prof-traj-${esc(p.id)}" hidden></div>
            </div>
          </li>
        `;
      }).join('')
      : '<p class="meu-perfil-history-empty">Você ainda não avaliou nenhum profissional. Seus atendimentos aparecerão aqui.</p>';

    return `
      <article class="meu-perfil-card glass-surface meu-perfil-history-card">
        <section class="meu-perfil-section">
          <h2 class="meu-perfil-section-title">Lugares que você frequentou</h2>
          <ul class="meu-perfil-history-list">${estBlock}</ul>
        </section>
        <section class="meu-perfil-section">
          <h2 class="meu-perfil-section-title">Profissionais que te atenderam</h2>
          <ul class="meu-perfil-history-list">${profBlock}</ul>
        </section>
        <p class="meu-perfil-history-footer">
          <a href="./minhas-avaliacoes.html">Ver todas as minhas avaliações</a>
        </p>
      </article>
    `;
  }

  async function loadClientHistory() {
    const wrap = document.getElementById('meuPerfilHistory');
    if (!wrap || !sessionUserId) return;

    try {
      const select = [
        'id', 'rating', 'created_at', 'review_type',
        'professional_id', 'establishment_id', 'prof_link_snapshot',
        'professional:professionals!professional_id(id,name,previous_workplaces,current_establishment_id,current_establishment:establishments!professionals_current_establishment_id_fkey(id,name))',
        'establishment:establishments!establishment_id(id,name)'
      ].join(',');

      let data = await apiFetch(
        `/rest/v1/reviews?user_id=eq.${sessionUserId}&review_type=in.(client_to_professional,client_to_establishment)&select=${select}&order=created_at.desc&limit=100`
      );

      const estabNames = {};
      (data || []).forEach(r => {
        if (r.establishment?.id) estabNames[r.establishment.id] = r.establishment.name;
        const snap = r.prof_link_snapshot;
        if (snap?.establishment_id && r.establishment?.id === snap.establishment_id) {
          estabNames[snap.establishment_id] = r.establishment.name;
        }
      });

      const estReviews = (data || []).filter(r => r.review_type === 'client_to_establishment' || (r.establishment_id && !r.professional_id));
      const profReviews = (data || []).filter(r => r.review_type === 'client_to_professional' || r.professional_id);

      const missingEstabIds = new Set();
      profReviews.forEach(r => {
        const snapId = r.prof_link_snapshot?.establishment_id;
        if (snapId && !estabNames[snapId]) missingEstabIds.add(snapId);
      });
      if (missingEstabIds.size) {
        const extra = await apiFetch(
          `/rest/v1/establishments?id=in.(${[...missingEstabIds].join(',')})&select=id,name`
        );
        (extra || []).forEach(e => { estabNames[e.id] = e.name; });
      }

      const estVisits = groupEstablishmentVisits(estReviews);
      const profVisits = groupProfessionalVisits(profReviews, estabNames);
      wrap.innerHTML = renderHistoryHtml(estVisits, profVisits);
    } catch (e) {
      wrap.innerHTML = `<p class="meu-perfil-history-empty">Não foi possível carregar o histórico.</p>`;
      console.warn('loadClientHistory:', e.message);
    }
  }

  async function toggleProfTrajectory(profId, panel) {
    if (panel.dataset.loaded === '1') {
      panel.hidden = !panel.hidden;
      return;
    }
    panel.hidden = false;
    panel.innerHTML = '<span class="meu-perfil-history-loading">Carregando trajetória...</span>';
    try {
      const [vinculos, profRows] = await Promise.all([
        apiFetch(`/rest/v1/professional_establishment?professional_id=eq.${profId}&select=*,establishment:establishment_id(id,name)&order=started_at.desc`),
        apiFetch(`/rest/v1/professionals?id=eq.${profId}&select=previous_workplaces&limit=1`)
      ]);
      const prev = profRows?.[0]?.previous_workplaces;
      const entries = typeof buildWorkHistory === 'function'
        ? buildWorkHistory(vinculos, [], prev)
        : (vinculos || []).map(v => ({
          name: v.establishment?.name || 'Estabelecimento',
          isCurrent: !!v.is_current
        }));

      if (!entries.length) {
        panel.innerHTML = '<p class="meu-perfil-traj-empty">Trajetória ainda não registrada no Ranking Pro.</p>';
      } else {
        panel.innerHTML = `<ul class="meu-perfil-traj-list">${entries.map(entry => {
          const badge = entry.isCurrent ? '<span class="meu-perfil-traj-badge">Atual</span>' : '';
          return `<li>${esc(entry.name)} ${badge}</li>`;
        }).join('')}</ul>`;
      }
      panel.dataset.loaded = '1';
    } catch (e) {
      panel.innerHTML = '<p class="meu-perfil-traj-empty">Erro ao carregar trajetória.</p>';
    }
  }

  function toggleStyleChip(type, tag, el) {
    if (!tag || !el) return;
    const list = type === 'prof' ? profStyleSelection : estStyleSelection;
    const max = type === 'prof' ? 5 : 3;
    const idx = list.indexOf(tag);
    if (idx >= 0) {
      list.splice(idx, 1);
      el.classList.remove('active');
      el.setAttribute('aria-pressed', 'false');
    } else {
      if (list.length >= max) {
        showPerfilGlassAlert('⚠️ Limite', `Máximo de ${max} tags.`, { tone: 'error' });
        return;
      }
      list.push(tag);
      el.classList.add('active');
      el.setAttribute('aria-pressed', 'true');
    }
  }

  function bindEditEvents() {
    document.getElementById('perfilCpf')?.addEventListener('input', (e) => {
      if (typeof formatarCPF === 'function') formatarCPF(e.target);
    });
    document.getElementById('perfilPhone')?.addEventListener('input', (e) => {
      if (typeof formatarTelefone === 'function') formatarTelefone(e.target);
    });
    document.getElementById('perfilWhatsapp')?.addEventListener('input', (e) => {
      if (typeof formatarTelefone === 'function') formatarTelefone(e.target);
    });
    document.getElementById('perfilBirth')?.addEventListener('input', (e) => {
      if (typeof formatarDataNascimento === 'function') formatarDataNascimento(e.target);
    });
    document.getElementById('perfilCep')?.addEventListener('input', (e) => {
      if (typeof formatarCEP === 'function') formatarCEP(e.target);
    });

    const cepEl = document.getElementById('perfilCep');
    if (cepEl?.value && typeof formatarCEP === 'function') formatarCEP(cepEl);

    bindAvatarInput();

    if (typeof setupCepAutoFill === 'function') {
      try {
        setupCepAutoFill(document.getElementById('perfilCep'), {
          street: document.getElementById('perfilStreet'),
          neighborhood: document.getElementById('perfilNeighborhood'),
          city: document.getElementById('perfilCity'),
          state: document.getElementById('perfilState')
        });
      } catch (cepErr) {
        console.warn('setupCepAutoFill:', cepErr.message);
      }
    }

    document.getElementById('meuPerfilForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      saveProfile();
    });
  }

  function hasUnsavedChanges() {
    if (!isEditing || !clientRecord) return false;
    const c = clientRecord;
    const birthRaw = document.getElementById('perfilBirth')?.value.trim() || '';
    const birthIso = birthRaw && typeof parseDataBR === 'function' ? parseDataBR(birthRaw) : null;
    const tagsEqual = (a, b) => JSON.stringify(a || []) === JSON.stringify(b || []);
    return (
      (document.getElementById('perfilName')?.value.trim() || '') !== (c.name || '')
      || (document.getElementById('perfilEmail')?.value.trim().toLowerCase() || '') !== (c.email || '').toLowerCase()
      || (document.getElementById('perfilCpf')?.value || '').replace(/\D/g, '') !== String(c.cpf || '').replace(/\D/g, '')
      || (birthIso || null) !== (c.birth_date || null)
      || (document.getElementById('perfilGender')?.value || null) !== (normalizeGenderValue(c.gender) || null)
      || (document.getElementById('perfilPhone')?.value || '').replace(/\D/g, '') !== String(c.phone || '').replace(/\D/g, '')
      || (document.getElementById('perfilWhatsapp')?.value || '').replace(/\D/g, '') !== String(c.whatsapp || '').replace(/\D/g, '')
      || (document.getElementById('perfilCep')?.value || '').replace(/\D/g, '') !== String(c.zip_code || '').replace(/\D/g, '')
      || (document.getElementById('perfilStreet')?.value.trim() || '') !== (c.street || '')
      || (document.getElementById('perfilNumber')?.value.trim() || '') !== (c.number || '')
      || (document.getElementById('perfilComplement')?.value.trim() || '') !== (c.complement || '')
      || (document.getElementById('perfilNeighborhood')?.value.trim() || '') !== (c.neighborhood || '')
      || (document.getElementById('perfilCity')?.value.trim() || '') !== (c.city || '')
      || (document.getElementById('perfilState')?.value || '').trim().toUpperCase() !== (c.state || '')
      || !!avatarBase64
      || !tagsEqual(profStyleSelection, c.prof_style_tags)
      || !tagsEqual(estStyleSelection, c.est_style_tags)
    );
  }

  async function cancelEditMode() {
    if (hasUnsavedChanges()) {
      const discard = await showPerfilGlassConfirm({
        title: '⚠️ Descartar alterações?',
        message: 'Você tem mudanças não salvas. Deseja sair sem salvar?',
        confirmText: 'Descartar',
        cancelText: 'Continuar editando',
        danger: true
      });
      if (!discard) return;
    }
    setEditMode(false);
  }

  function setEditMode(editing) {
    isEditing = editing;
    if (editing) {
      syncStyleSelectionsFromRecord();
      avatarBase64 = null;
      renderEditMode();
    } else {
      renderViewMode();
    }
  }

  function normalizeSaveValue(field, value) {
    if (value === undefined || value === null || value === '') return null;
    if (field === 'cpf' || field === 'phone' || field === 'whatsapp' || field === 'zip_code') {
      const digits = String(value).replace(/\D/g, '');
      return digits || null;
    }
    if (field === 'email') return String(value).trim().toLowerCase() || null;
    if (field === 'state') return String(value).trim().toUpperCase() || null;
    if (field === 'prof_style_tags' || field === 'est_style_tags') {
      return JSON.stringify([...(value || [])].sort());
    }
    if (field === 'birth_date') {
      const raw = String(value || '').trim();
      if (!raw) return null;
      const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
      return m ? `${m[1]}-${m[2]}-${m[3]}` : raw;
    }
    if (typeof value === 'string') return value.trim() || null;
    return value;
  }

  function collectSaveMismatches(body, saved) {
    if (!body || !saved) return ['savedRecord ausente'];
    return Object.keys(body).filter((field) => {
      const sent = normalizeSaveValue(field, body[field]);
      const got = normalizeSaveValue(field, saved[field]);
      if (sent === got) return false;
      if (sent == null && (got == null || got === '')) return false;
      return true;
    });
  }

  function resolveBirthIsoForSave() {
    const birthRaw = document.getElementById('perfilBirth')?.value.trim() || '';
    const birthStoredDisplay = clientRecord?.birth_date ? formatDateBr(clientRecord.birth_date) : '';
    let birthIso = clientRecord?.birth_date || null;
    if (birthRaw && birthRaw !== birthStoredDisplay) {
      if (typeof parseDataBR !== 'function') {
        throw new Error('Validação de data indisponível — recarregue a página.');
      }
      const parsed = parseDataBR(birthRaw);
      if (!parsed) {
        throw new Error('Data de nascimento inválida. Use o formato DD/MM/AAAA.');
      }
      birthIso = parsed;
    } else if (!birthRaw) {
      birthIso = null;
    }
    return birthIso;
  }

  function buildProfileFormPayload() {
    return {
      name: document.getElementById('perfilName')?.value.trim(),
      email: document.getElementById('perfilEmail')?.value.trim().toLowerCase() || null,
      cpf: (document.getElementById('perfilCpf')?.value || '').replace(/\D/g, ''),
      phone: (document.getElementById('perfilPhone')?.value || '').replace(/\D/g, '') || null,
      whatsapp: (document.getElementById('perfilWhatsapp')?.value || '').replace(/\D/g, '') || null,
      birth_date: resolveBirthIsoForSave(),
      gender: document.getElementById('perfilGender')?.value || null,
      zip_code: (document.getElementById('perfilCep')?.value || '').replace(/\D/g, '') || null,
      street: document.getElementById('perfilStreet')?.value.trim() || null,
      number: document.getElementById('perfilNumber')?.value.trim() || null,
      complement: document.getElementById('perfilComplement')?.value.trim() || null,
      neighborhood: document.getElementById('perfilNeighborhood')?.value.trim() || null,
      city: document.getElementById('perfilCity')?.value.trim() || null,
      state: (document.getElementById('perfilState')?.value || '').trim().toUpperCase() || null,
      prof_style_tags: [...profStyleSelection],
      est_style_tags: [...estStyleSelection]
    };
  }

  function buildSaveDebugText(debug) {
    if (!debug) return '';
    const parts = [];
    if (debug.step) parts.push(`step: ${debug.step}`);
    if (debug.profileId) parts.push(`profileId: ${debug.profileId}`);
    if (debug.userId) parts.push(`userId: ${debug.userId}`);
    if (debug.endpoint) parts.push(`endpoint: ${debug.endpoint}`);
    if (debug.method) parts.push(`method: ${debug.method}`);
    if (debug.httpStatus) parts.push(`httpStatus: ${debug.httpStatus}`);
    if (debug.message) parts.push(`message: ${debug.message}`);
    if (debug.hint) parts.push(`hint: ${debug.hint}`);
    if (debug.requestBody) {
      parts.push(`requestBody:\n${JSON.stringify(debug.requestBody, null, 2)}`);
    }
    if (debug.patchResponse !== undefined) {
      parts.push(`patchResponse:\n${JSON.stringify(debug.patchResponse, null, 2)}`);
    }
    if (debug.mismatches?.length) {
      parts.push(`mismatches:\n${JSON.stringify(debug.mismatches, null, 2)}`);
    }
    if (debug.savedRecord) {
      parts.push(`savedRecord:\n${JSON.stringify(debug.savedRecord, null, 2)}`);
    }
    return parts.join('\n\n');
  }

  function showSaveResultModal(ok, { title, message, debug } = {}) {
    setPageLoading(false);
    const debugText = buildSaveDebugText(debug);
    return showPerfilGlassAlert(
      title || (ok ? '✅ Gravado' : '❌ Não gravou'),
      message || '',
      { tone: ok ? 'ok' : 'error', debug: debugText || null, confirmText: 'OK' }
    );
  }

  async function saveProfile() {
    if (isSaving) {
      await showSaveResultModal(false, {
        title: '⏳ Aguarde',
        message: 'O salvamento anterior ainda está em andamento.'
      });
      return;
    }
    if (!clientRecord) {
      await showSaveResultModal(false, {
        title: '❌ Perfil não carregado',
        message: 'Recarregue a página e tente novamente.',
        debug: { step: 'clientRecord ausente', hint: 'loadProfile() não concluiu antes do clique em Salvar.' }
      });
      return;
    }
    if (typeof window.fetchAPI !== 'function') {
      await showSaveResultModal(false, {
        title: '⚠️ Aguarde',
        message: 'O sistema ainda está carregando. Tente salvar novamente em instantes.'
      });
      return;
    }
    const name = document.getElementById('perfilName')?.value.trim();
    if (!name) {
      await showSaveResultModal(false, {
        title: '⚠️ Campo obrigatório',
        message: 'Informe seu nome antes de salvar.'
      });
      return;
    }

    const cpfDigits = (document.getElementById('perfilCpf')?.value || '').replace(/\D/g, '');
    if (!cpfDigits) {
      await showSaveResultModal(false, {
        title: '⚠️ Campo obrigatório',
        message: 'Informe o CPF antes de salvar.'
      });
      return;
    }

    isSaving = true;
    setPageLoading(true, 'Salvando perfil...');
    const saveBtn = document.getElementById('btnSavePerfil');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Salvando...';
    }

    const api = clientApi();
    const sess = typeof getSession === 'function' ? getSession() : null;
    let profileId = clientRecord.id;
    let body = null;
    let endpoint = '';

    try {
      if (sess?.userId && typeof fetchUserById === 'function') {
        const user = await fetchUserById(sess.userId);
        if (user?.client_id) profileId = user.client_id;
      }
      if (!profileId) {
        throw new Error('Perfil sem identificador — recarregue a página.');
      }

      if (!hasUnsavedChanges()) {
        await showSaveResultModal(false, {
          title: 'ℹ️ Sem alterações',
          message: 'Nenhum campo foi modificado desde a última vez que você abriu a edição.'
        });
        return;
      }

      body = buildProfileFormPayload();
      const savingAvatar = !!avatarBase64;
      if (savingAvatar) body.avatar_url = avatarBase64;

      endpoint = `${api}?id=eq.${encodeURIComponent(profileId)}&select=${PROFILE_SAVE_SELECT}`;

      if (window.DEBUG_MODE) console.log('💾 saveProfile PATCH', profileId, body);

      if (body.email) {
        const dupEmail = await apiFetch(
          `${api}?email=eq.${encodeURIComponent(body.email)}&id=neq.${encodeURIComponent(profileId)}&select=id&limit=1`
        );
        if (dupEmail?.length) {
          throw new Error('Este e-mail já está cadastrado em outro perfil.');
        }
      }
      if (body.cpf) {
        const dupCpf = await apiFetch(
          `${api}?cpf=eq.${encodeURIComponent(body.cpf)}&id=neq.${encodeURIComponent(profileId)}&select=id&limit=1`
        );
        if (dupCpf?.length) {
          throw new Error('Este CPF já está cadastrado em outro perfil.');
        }
      }

      let patchResponse;
      try {
        patchResponse = await apiFetch(endpoint, 'PATCH', body, { skipSanitize: true });
      } catch (patchErr) {
        const statusMatch = String(patchErr.message || '').match(/Erro (\d{3})/);
        await showSaveResultModal(false, {
          title: '❌ Não gravou',
          message: 'A API recusou o salvamento do perfil do cliente.',
          debug: {
            step: 'PATCH client_profiles',
            profileId,
            userId: sess?.userId || null,
            endpoint,
            method: 'PATCH',
            httpStatus: statusMatch ? statusMatch[1] : null,
            message: patchErr.message,
            requestBody: body,
            hint: 'Verifique Supabase: tabela client_profiles, RLS, colunas e constraints (CPF/e-mail únicos).'
          }
        });
        return;
      }

      if (!Array.isArray(patchResponse) || !patchResponse.length) {
        await showSaveResultModal(false, {
          title: '❌ Não gravou',
          message: 'Nenhum registro foi atualizado no banco. O id do perfil pode estar incorreto ou o PATCH foi bloqueado.',
          debug: {
            step: 'PATCH retornou vazio',
            profileId,
            userId: sess?.userId || null,
            endpoint,
            method: 'PATCH',
            patchResponse,
            requestBody: body,
            hint: 'PostgREST devolve [] quando zero linhas são afetadas. Confira users.client_id e client_profiles.id.'
          }
        });
        return;
      }

      let saved = patchResponse[0];
      const verifyKeys = Object.keys(body).filter((k) => k !== 'avatar_url');
      const mismatches = collectSaveMismatches(
        verifyKeys.reduce((acc, key) => { acc[key] = body[key]; return acc; }, {}),
        saved
      );
      if (mismatches.length) {
        const fresh = await apiFetch(
          `${api}?id=eq.${encodeURIComponent(profileId)}&select=${PROFILE_SAVE_SELECT}&limit=1`
        );
        const reloaded = fresh?.[0] || null;
        if (reloaded) saved = reloaded;
        if (window.DEBUG_MODE) {
          console.warn('saveProfile verificação:', mismatches, saved);
        }
      }

      let avatarPersisted = !savingAvatar;
      if (savingAvatar) {
        try {
          const avatarRows = await apiFetch(
            `${api}?id=eq.${encodeURIComponent(profileId)}&select=id,avatar_url&limit=1`,
            'GET',
            null,
            { skipSanitize: true }
          );
          const stored = avatarRows?.[0]?.avatar_url || '';
          avatarPersisted = stored.length > 100 && stored.startsWith('data:image/');
          if (!avatarPersisted && stored.length > 20) {
            avatarPersisted = stored.startsWith('http');
          }
        } catch (avatarVerifyErr) {
          console.warn('saveProfile avatar verify:', avatarVerifyErr.message);
          avatarPersisted = true;
        }
      }

      const avatarKeep = clientRecord?.avatar_url;
      clientRecord = { ...clientRecord, ...saved };
      if (savingAvatar && avatarPersisted) {
        clientRecord.avatar_url = body.avatar_url;
      } else if (!savingAvatar && avatarKeep) {
        clientRecord.avatar_url = avatarKeep;
      }
      avatarBase64 = null;

      try {
        const refreshed = await apiFetch(
          `${api}?id=eq.${encodeURIComponent(profileId)}&select=${PROFILE_SAVE_SELECT}&limit=1`
        );
        if (refreshed?.[0]) {
          const av = clientRecord.avatar_url;
          clientRecord = { ...clientRecord, ...refreshed[0] };
          if (av) clientRecord.avatar_url = av;
        }
      } catch (reloadErr) {
        console.warn('saveProfile reload:', reloadErr.message);
      }

      if (typeof syncClientPrefsFromRecord === 'function') {
        syncClientPrefsFromRecord(clientRecord);
      }

      if (sess?.userId) {
        if (typeof linkUserClientProfile === 'function') {
          try {
            await linkUserClientProfile(sess.userId, profileId);
          } catch (linkErr) {
            console.warn('saveProfile linkUserClientProfile:', linkErr.message);
          }
        }
        if (typeof updateUser === 'function') {
          try {
            await updateUser(sess.userId, { name: clientRecord.name });
          } catch (userErr) {
            console.warn('saveProfile updateUser:', userErr.message);
          }
        }
        if (typeof setSession === 'function') {
          setSession({
            ...sess,
            name: clientRecord.name,
            clientId: profileId,
            email: clientRecord.email || sess.email
          });
        }
      }

      const saveMsg = savingAvatar && !avatarPersisted
        ? 'Os demais campos foram salvos, mas a foto pode não ter sido gravada. Tente enviar uma imagem menor.'
        : (savingAvatar
          ? 'Suas alterações e a nova foto foram salvas com sucesso.'
          : 'Suas alterações foram salvas no banco de dados com sucesso.');
      await showSaveResultModal(savingAvatar ? avatarPersisted : true, {
        title: (savingAvatar && !avatarPersisted) ? '⚠️ Foto não confirmada' : '✅ Gravado',
        message: saveMsg
      });
      setEditMode(false);
    } catch (e) {
      await showSaveResultModal(false, {
        title: '❌ Não gravou',
        message: e.message || 'Não foi possível salvar o perfil.',
        debug: {
          step: 'validação local',
          profileId,
          userId: sess?.userId || null,
          endpoint,
          method: 'PATCH',
          message: e.message,
          requestBody: body,
          hint: 'Erro antes ou durante a montagem do payload de salvamento.'
        }
      });
    } finally {
      isSaving = false;
      setPageLoading(false);
      if (saveBtn) {
        saveBtn.disabled = false;
        delete saveBtn.dataset.avatarHint;
        saveBtn.textContent = 'Salvar alterações';
      }
    }
  }

  async function loadProfile() {
    if (isLoadingProfile) return;
    if (typeof window.fetchAPI !== 'function' || typeof getSession !== 'function') return;

    isLoadingProfile = true;
    setPageLoading(true, 'Carregando perfil...');
    try {
      const session = getSession();
      if (!session?.userId) {
        window.location.href = './login.html?returnTo=meu-perfil.html';
        return;
      }
      sessionUserId = session.userId;

      let clientId = null;
      if (typeof fetchUserById === 'function') {
        const user = await fetchUserById(session.userId);
        clientId = user?.client_id || null;
      }
      if (!clientId) {
        clientId = typeof getClientId === 'function' ? getClientId(session) : session.clientId;
      }
      if (!clientId) {
        window.location.href = './cadastro-cliente.html';
        return;
      }

      if (session.clientId !== clientId && typeof setSession === 'function') {
        setSession({ ...session, clientId });
      }

      let data = await apiFetch(`${clientApi()}?id=eq.${clientId}&limit=1`);
      if (!data?.length) {
        shell.innerHTML = '<p class="empty-msg">Perfil não encontrado. <a href="./cadastro-cliente.html">Cadastrar</a></p>';
        return;
      }

      clientRecord = data[0];
      if (!clientRecord.avatar_url) {
        try {
          const avatarOnly = await apiFetch(
            `${clientApi()}?id=eq.${clientId}&select=id,avatar_url&limit=1`,
            'GET',
            null,
            { skipSanitize: true }
          );
          if (avatarOnly?.[0]?.avatar_url) {
            clientRecord.avatar_url = avatarOnly[0].avatar_url;
          }
        } catch (avatarLoadErr) {
          console.warn('loadProfile avatar:', avatarLoadErr.message);
        }
      }
      shell?.setAttribute('data-build', BUILD_TAG);
      if (isEditing) {
        renderEditMode();
      } else {
        renderViewMode();
      }
    } catch (e) {
      shell.innerHTML = `<p class="empty-msg">Erro ao carregar perfil: ${esc(e.message)}</p>`;
      console.error('loadProfile:', e);
    } finally {
      isLoadingProfile = false;
      setPageLoading(false);
    }
  }

  function bootProfile() {
    loadProfile();
  }

  function init() {
    shell?.addEventListener('click', async (e) => {
      if (e.target.closest('#btnSavePerfil')) {
        e.preventDefault();
        saveProfile();
        return;
      }
      if (e.target.closest('#btnCancelEdit')) {
        e.preventDefault();
        await cancelEditMode();
        return;
      }

      const styleChip = e.target.closest('.meu-perfil-style-chip');
      if (styleChip && isEditing) {
        e.preventDefault();
        const type = styleChip.getAttribute('data-type');
        const tag = resolveChipTag(type, styleChip);
        toggleStyleChip(type, tag, styleChip);
        return;
      }

      if (e.target.closest('#perfilAvatarUploadBtn') || e.target.closest('#perfilAvatarRing')) {
        if (!isEditing) return;
        if (e.target.closest('#btnToggleEdit')) return;
        e.preventDefault();
        e.stopPropagation();
        openAvatarFilePicker();
        return;
      }

      if (e.target.closest('#btnToggleEdit')) {
        if (isEditing) {
          await cancelEditMode();
        } else {
          setEditMode(true);
        }
        return;
      }
      const trajBtn = e.target.closest('.meu-perfil-history-traj');
      if (trajBtn) {
        const profId = trajBtn.dataset.profId;
        const panel = document.getElementById(`prof-traj-${profId}`);
        if (profId && panel) toggleProfTrajectory(profId, panel);
      }
    });
  }

  function start() {
    init();
    if (typeof window.fetchAPI === 'function' && typeof getSession === 'function') {
      bootProfile();
    } else {
      document.addEventListener('scriptsLoaded', bootProfile, { once: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();