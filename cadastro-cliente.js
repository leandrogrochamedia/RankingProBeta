// =====================================================
// PROOFLY - Cadastro de Cliente
// =====================================================

const PROF_STYLE_PICKS = window.CLIENT_PROF_STYLE_PICKS || [
  'Hip Hop', 'Comunicativo', 'Moderno', 'Premium', 'Extrovertido',
  'Despojado', 'Experiente', 'MPB', 'Detalhista', 'Criativo', 'Casual', 'Noturno'
];
const EST_STYLE_PICKS = window.CLIENT_EST_STYLE_PICKS || [
  'Descontraído', 'Premium', 'Família', 'Animado', 'Acolhedor', 'Wi-Fi', 'Moderno', 'Todos'
];

const STEP_NAMES = ['Identidade', 'Contato', 'Endereço', 'Seu estilo', 'Confirmar'];
let currentStepCli = 1;
const totalStepsCli = 5;
let avatarBase64 = null;
let profStyleSelection = [];
let estStyleSelection = [];
let isSubmitting = false;

const DOM = {
  progressFill: document.getElementById('progressFill'),
  stepNumber: document.getElementById('stepNumber'),
  stepName: document.getElementById('stepName'),
  name: document.getElementById('cliName'),
  email: document.getElementById('cliEmail'),
  cpf: document.getElementById('cliCpf'),
  birth: document.getElementById('cliBirth'),
  gender: document.getElementById('cliGender'),
  avatarInput: document.getElementById('cliAvatarInput'),
  avatarPreview: document.getElementById('cliAvatarPreview'),
  avatarPlaceholder: document.getElementById('cliAvatarPlaceholder'),
  phone: document.getElementById('cliPhone'),
  whatsapp: document.getElementById('cliWhatsapp'),
  cep: document.getElementById('cliCep'),
  street: document.getElementById('cliStreet'),
  number: document.getElementById('cliNumber'),
  complement: document.getElementById('cliComplement'),
  neighborhood: document.getElementById('cliNeighborhood'),
  city: document.getElementById('cliCity'),
  state: document.getElementById('cliState'),
  profChips: document.getElementById('cliProfStyleChips'),
  estChips: document.getElementById('cliEstStyleChips'),
  styleHint: document.getElementById('cliStyleHint'),
  summary: document.getElementById('cliSummary'),
  finalMessage: document.getElementById('finalMessage'),
  submitBtn: document.getElementById('btnSalvarCliente')
};

function showFieldError(input, show, msg) {
  if (!input) return;
  input.classList.toggle('error', show);
  const err = input.parentElement?.querySelector('.error-message');
  if (err) {
    if (msg) err.textContent = msg;
    err.classList.toggle('show', show);
  }
}

function updateProgressCli() {
  const pct = ((currentStepCli - 1) / (totalStepsCli - 1)) * 100;
  DOM.progressFill.style.width = pct + '%';
  DOM.stepNumber.textContent = currentStepCli;
  DOM.stepName.textContent = STEP_NAMES[currentStepCli - 1];
}

function validateStep1() {
  const name = DOM.name.value.trim();
  if (!name || name.split(/\s+/).length < 1) {
    showFieldError(DOM.name, true);
    if (typeof showAlert === 'function') showAlert('⚠️', 'Informe seu nome completo.');
    DOM.name.focus();
    return false;
  }
  showFieldError(DOM.name, false);

  if (!validarEmailInput(DOM.email)) {
    if (typeof showAlert === 'function') showAlert('⚠️', 'E-mail inválido.');
    DOM.email.focus();
    return false;
  }

  const cpfDigits = DOM.cpf.value.replace(/\D/g, '');
  if (!cpfDigits || cpfDigits.length < 11) {
    showFieldError(DOM.cpf, true);
    if (typeof showAlert === 'function') showAlert('⚠️', 'Informe um CPF com 11 dígitos.');
    DOM.cpf.focus();
    return false;
  }
  showFieldError(DOM.cpf, false);

  if (DOM.birth.value.trim() && !validarDataNascimento(DOM.birth)) {
    if (typeof showAlert === 'function') showAlert('⚠️', 'Data de nascimento inválida.');
    DOM.birth.focus();
    return false;
  }
  return true;
}

function validateStep2() {
  if (!formatarTelefone(DOM.phone)) {
    showFieldError(DOM.phone, true);
    if (typeof showAlert === 'function') showAlert('⚠️', 'Informe um celular válido.');
    DOM.phone.focus();
    return false;
  }
  showFieldError(DOM.phone, false);

  if (DOM.whatsapp.value.trim() && !formatarTelefone(DOM.whatsapp)) {
    showFieldError(DOM.whatsapp, true);
    if (typeof showAlert === 'function') showAlert('⚠️', 'WhatsApp inválido.');
    DOM.whatsapp.focus();
    return false;
  }
  showFieldError(DOM.whatsapp, false);
  return true;
}

function validateStep3() {
  const cep = DOM.cep.value.replace(/\D/g, '');
  if (cep.length !== 8) {
    showFieldError(DOM.cep, true, 'CEP inválido (8 dígitos)');
    if (typeof showAlert === 'function') showAlert('⚠️', 'Informe um CEP válido.');
    DOM.cep.focus();
    return false;
  }
  showFieldError(DOM.cep, false);

  if (!DOM.street.value.trim()) {
    showFieldError(DOM.street, true);
    DOM.street.focus();
    return false;
  }
  showFieldError(DOM.street, false);

  if (!DOM.number.value.trim()) {
    showFieldError(DOM.number, true);
    DOM.number.focus();
    return false;
  }
  showFieldError(DOM.number, false);

  if (!DOM.neighborhood.value.trim()) {
    showFieldError(DOM.neighborhood, true);
    DOM.neighborhood.focus();
    return false;
  }
  showFieldError(DOM.neighborhood, false);

  if (!DOM.city.value.trim()) {
    showFieldError(DOM.city, true);
    DOM.city.focus();
    return false;
  }
  showFieldError(DOM.city, false);

  if (DOM.state.value.trim().length !== 2) {
    showFieldError(DOM.state, true, 'UF com 2 letras');
    DOM.state.focus();
    return false;
  }
  showFieldError(DOM.state, false);
  return true;
}

function validateStep4() {
  if (!profStyleSelection.length) {
    if (typeof showAlert === 'function') showAlert('⚠️', 'Escolha pelo menos 1 preferência de profissional.');
    return false;
  }
  return true;
}

window.goToStepCli = function(step) {
  if (step > currentStepCli) {
    if (currentStepCli === 1 && !validateStep1()) return;
    if (currentStepCli === 2 && !validateStep2()) return;
    if (currentStepCli === 3 && !validateStep3()) return;
    if (currentStepCli === 4 && !validateStep4()) return;
  }
  if (step === 5) renderSummary();
  document.querySelectorAll('.step-container').forEach(el => el.classList.remove('active'));
  document.querySelector(`.step-container[data-step="${step}"]`)?.classList.add('active');
  currentStepCli = step;
  updateProgressCli();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

function renderStyleChips() {
  if (!DOM.profChips || !DOM.estChips) return;
  DOM.profChips.innerHTML = PROF_STYLE_PICKS.map(tag => {
    const active = profStyleSelection.includes(tag) ? ' active' : '';
    const label = typeof renderTagWithEmoji === 'function' ? renderTagWithEmoji(tag) : tag;
    return `<button type="button" class="style-onboarding-chip${active}" data-type="prof" data-tag="${escapeHtml(tag)}">${label}</button>`;
  }).join('');
  DOM.estChips.innerHTML = EST_STYLE_PICKS.map(tag => {
    const active = estStyleSelection.includes(tag) ? ' active' : '';
    const label = typeof renderTagWithEmoji === 'function' ? renderTagWithEmoji(tag) : tag;
    return `<button type="button" class="style-onboarding-chip${active}" data-type="est" data-tag="${escapeHtml(tag)}">${label}</button>`;
  }).join('');

  DOM.profChips.querySelectorAll('.style-onboarding-chip').forEach(btn => {
    btn.addEventListener('click', () => toggleStyleChip('prof', btn.dataset.tag, btn));
  });
  DOM.estChips.querySelectorAll('.style-onboarding-chip').forEach(btn => {
    btn.addEventListener('click', () => toggleStyleChip('est', btn.dataset.tag, btn));
  });
  updateStyleHint();
}

function toggleStyleChip(type, tag, el) {
  const list = type === 'prof' ? profStyleSelection : estStyleSelection;
  const max = type === 'prof' ? 5 : 3;
  const idx = list.indexOf(tag);
  if (idx >= 0) {
    list.splice(idx, 1);
    el.classList.remove('active');
  } else {
    if (list.length >= max) {
      if (typeof showAlert === 'function') showAlert('⚠️', `Máximo de ${max} tags.`);
      return;
    }
    list.push(tag);
    el.classList.add('active');
  }
  updateStyleHint();
}

function updateStyleHint() {
  if (DOM.styleHint) {
    DOM.styleHint.textContent = `${profStyleSelection.length} profissional · ${estStyleSelection.length} lugares`;
  }
}

function renderSummary() {
  const lines = [
    `<strong>${escapeHtml(DOM.name.value.trim())}</strong>`,
    `📧 ${escapeHtml(DOM.email.value.trim())}`,
    `📱 ${escapeHtml(DOM.phone.value.trim())}`,
    `📍 ${escapeHtml(DOM.street.value.trim())}, ${escapeHtml(DOM.number.value.trim())} — ${escapeHtml(DOM.neighborhood.value.trim())}`,
    `${escapeHtml(DOM.city.value.trim())}/${escapeHtml(DOM.state.value.trim())} · CEP ${escapeHtml(DOM.cep.value.trim())}`,
    `🎯 Estilo: ${profStyleSelection.map(t => escapeHtml(t)).join(', ') || '—'}`
  ];
  if (estStyleSelection.length) {
    lines.push(`🏢 Lugares: ${estStyleSelection.map(t => escapeHtml(t)).join(', ')}`);
  }
  DOM.summary.innerHTML = lines.join('<br>');
}

async function checkDuplicate(field, value) {
  const encoded = encodeURIComponent(value);
  const api = typeof CLIENT_PROFILES_API !== 'undefined' ? CLIENT_PROFILES_API : '/rest/v1/client_profiles';
  const data = await fetchAPI(`${api}?${field}=eq.${encoded}&select=id,name&limit=1`);
  return data?.length ? data[0] : null;
}

window.salvarCadastroCliente = async function() {
  if (isSubmitting) return;
  if (!validateStep1() || !validateStep2() || !validateStep3() || !validateStep4()) {
    if (!validateStep1()) goToStepCli(1);
    else if (!validateStep2()) goToStepCli(2);
    else if (!validateStep3()) goToStepCli(3);
    else goToStepCli(4);
    return;
  }

  isSubmitting = true;
  DOM.submitBtn.disabled = true;
  DOM.submitBtn.textContent = '⏳ Salvando...';
  DOM.finalMessage.innerHTML = '';

  try {
    const email = DOM.email.value.trim().toLowerCase();
    const cpf = DOM.cpf.value.replace(/\D/g, '');

    const dupEmail = await checkDuplicate('email', email);
    if (dupEmail) {
      await showAlert('⚠️', `E-mail já cadastrado (${dupEmail.name}).`);
      goToStepCli(1);
      return;
    }
    const dupCpf = await checkDuplicate('cpf', cpf);
    if (dupCpf) {
      await showAlert('⚠️', `CPF já cadastrado (${dupCpf.name}).`);
      goToStepCli(1);
      return;
    }

    const birthIso = DOM.birth.value.trim() ? validarDataNascimento(DOM.birth) : null;

    const formatted = typeof formatTextFields === 'function'
      ? formatTextFields({
          name: DOM.name.value.trim(),
          street: DOM.street.value.trim(),
          complement: DOM.complement.value.trim(),
          neighborhood: DOM.neighborhood.value.trim(),
          city: DOM.city.value.trim(),
          state: DOM.state.value.trim()
        }, {
          name: 'personName',
          street: 'address',
          complement: 'complement',
          neighborhood: 'neighborhood',
          city: 'city',
          state: 'state'
        })
      : {
          name: DOM.name.value.trim(),
          street: DOM.street.value.trim(),
          complement: DOM.complement.value.trim(),
          neighborhood: DOM.neighborhood.value.trim(),
          city: DOM.city.value.trim(),
          state: DOM.state.value.trim().toUpperCase()
        };

    const body = {
      name: formatted.name,
      email,
      cpf,
      phone: DOM.phone.value.replace(/\D/g, ''),
      whatsapp: DOM.whatsapp.value.trim() ? DOM.whatsapp.value.replace(/\D/g, '') : null,
      birth_date: birthIso || null,
      gender: DOM.gender.value || null,
      avatar_url: avatarBase64 || null,
      zip_code: DOM.cep.value.replace(/\D/g, ''),
      street: formatted.street,
      number: DOM.number.value.trim(),
      complement: formatted.complement || null,
      neighborhood: formatted.neighborhood,
      city: formatted.city,
      state: formatted.state,
      country: 'Brasil',
      prof_style_tags: profStyleSelection,
      est_style_tags: estStyleSelection
    };

    const api = typeof CLIENT_PROFILES_API !== 'undefined' ? CLIENT_PROFILES_API : '/rest/v1/client_profiles';
    const result = await fetchAPI(api, 'POST', body);
    const client = Array.isArray(result) ? result[0] : result;

    if (typeof syncClientPrefsFromRecord === 'function') {
      syncClientPrefsFromRecord(client);
    }

    let user = await fetchUserByEmail(email);
    if (!user) {
      user = await createUser({
        name: client.name,
        email,
        provider: 'cadastro',
        role: 'cliente',
        client_id: client.id
      });
    } else if (typeof linkUserClientProfile === 'function') {
      user = await linkUserClientProfile(user.id, client.id);
    } else {
      await updateUser(user.id, { client_id: client.id });
      user.client_id = client.id;
    }

    const sessionPayload = typeof buildSessionFromUser === 'function'
      ? buildSessionFromUser(user, { name: client.name })
      : {
          userId: user.id,
          clientId: client.id,
          name: client.name,
          email,
          role: 'cliente',
          professionalId: null,
          establishmentId: null,
          isAdmin: false
        };
    setSession(sessionPayload);

    if (typeof showUserMessage === 'function') {
      showUserMessage('✅ Cliente cadastrado! Redirecionando...');
    }

    setTimeout(() => {
      window.location.href = './cliente.html';
    }, 800);
  } catch (e) {
    console.error(e);
    DOM.finalMessage.innerHTML = `<p style="color:#ef4444;">Erro: ${escapeHtml(e.message)}</p>`;
    if (typeof showAlert === 'function') showAlert('❌ Erro', e.message);
  } finally {
    isSubmitting = false;
    DOM.submitBtn.disabled = false;
    DOM.submitBtn.textContent = '✨ Criar cliente';
  }
};

function initCadastroCliente() {
  renderStyleChips();
  updateProgressCli();

  if (typeof bindRegistrationFormatting === 'function') {
    bindRegistrationFormatting({
      name: DOM.name,
      street: DOM.street,
      complement: DOM.complement,
      neighborhood: DOM.neighborhood,
      city: DOM.city,
      state: DOM.state
    });
  }

  if (typeof setupCepAutoFill === 'function') {
    setupCepAutoFill(DOM.cep, {
      street: DOM.street,
      neighborhood: DOM.neighborhood,
      city: DOM.city,
      state: DOM.state
    });
  }

  DOM.avatarInput?.addEventListener('change', async function() {
    const file = this.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      if (typeof showAlert === 'function') showAlert('⚠️', 'Imagem muito grande (máx. 5 MB).');
      this.value = '';
      return;
    }
    try {
      avatarBase64 = typeof resizeAndCompressImage === 'function'
        ? await resizeAndCompressImage(file, 400, 400, 0.75)
        : null;
      if (avatarBase64) {
        DOM.avatarPreview.src = avatarBase64;
        DOM.avatarPreview.style.display = 'block';
        DOM.avatarPlaceholder.style.display = 'none';
      } else if (typeof previewAvatar === 'function') {
        previewAvatar(this, DOM.avatarPreview, DOM.avatarPlaceholder);
      }
    } catch (err) {
      console.warn(err);
      if (typeof showAlert === 'function') showAlert('❌', 'Não foi possível processar a imagem.');
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCadastroCliente);
} else {
  initCadastroCliente();
}