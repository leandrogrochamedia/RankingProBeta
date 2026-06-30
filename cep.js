// ============================================================
// PROOFLY - CEP AUTO-FILL
// ============================================================
// Preenche automaticamente endereço a partir do CEP
// ============================================================

(function() {
  // ============================================================
  // CSS INJECT (loading e animação)
  // ============================================================
  const style = document.createElement('style');
  style.textContent = `
    .cep-loading {
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpath d='M12 2v4M12 22v-4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M22 12h-4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83'/%3E%3C/svg%3E");
      background-size: 20px 20px;
      background-position: right 14px center;
      background-repeat: no-repeat;
    }
    .cep-filled {
      animation: cepPulse 0.4s ease;
    }
    @keyframes cepPulse {
      0% { background-color: #e0e7ff; }
      100% { background-color: #fafbfc; }
    }
  `;
  document.head.appendChild(style);

  // ============================================================
  // FUNÇÃO PRINCIPAL
  // ============================================================
  async function fetchCEP(cep) {
    const clean = cep.replace(/\D/g, '');
    if (clean.length !== 8) return null;
    try {
      const response = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      if (!response.ok) throw new Error('Erro na API');
      const data = await response.json();
      if (data.erro) return null;
      return data;
    } catch (error) {
      console.warn('Erro ao buscar CEP:', error);
      return null;
    }
  }

  // ============================================================
  // AUTO-FILL EM CAMPO DE CEP
  // ============================================================
  function setupCepAutoFill(cepInput, fieldMap) {
    if (!cepInput) return;

    // fieldMap: { street, neighborhood, city, state, complement? }
    const fields = {
      street: fieldMap.street || null,
      neighborhood: fieldMap.neighborhood || null,
      city: fieldMap.city || null,
      state: fieldMap.state || null,
      complement: fieldMap.complement || null
    };

    let loading = false;

    cepInput.addEventListener('blur', async function() {
      const value = this.value.replace(/\D/g, '');
      if (value.length !== 8) return;
      if (loading) return;

      loading = true;
      this.classList.add('cep-loading');
      this.disabled = true;

      try {
        const data = await fetchCEP(value);
        if (data) {
          const fmtStreet = typeof formatAddressLine === 'function' ? formatAddressLine : (v) => v;
          const fmtNeighborhood = typeof formatNeighborhoodName === 'function' ? formatNeighborhoodName : (v) => v;
          const fmtCity = typeof formatCityName === 'function' ? formatCityName : (v) => v;
          const fmtState = typeof formatStateUf === 'function' ? formatStateUf : (v) => v;
          const fmtComplement = typeof formatComplement === 'function' ? formatComplement : (v) => v;

          if (fields.street && data.logradouro) {
            fields.street.value = fmtStreet(data.logradouro);
            fields.street.classList.add('cep-filled');
            setTimeout(() => fields.street.classList.remove('cep-filled'), 500);
          }
          if (fields.neighborhood && data.bairro) {
            fields.neighborhood.value = fmtNeighborhood(data.bairro);
            fields.neighborhood.classList.add('cep-filled');
            setTimeout(() => fields.neighborhood.classList.remove('cep-filled'), 500);
          }
          if (fields.city && data.localidade) {
            fields.city.value = fmtCity(data.localidade);
            fields.city.classList.add('cep-filled');
            setTimeout(() => fields.city.classList.remove('cep-filled'), 500);
          }
          if (fields.state && data.uf) {
            fields.state.value = fmtState(data.uf);
            fields.state.classList.add('cep-filled');
            setTimeout(() => fields.state.classList.remove('cep-filled'), 500);
          }
          if (fields.complement && data.complemento) {
            fields.complement.value = fmtComplement(data.complemento);
            fields.complement.classList.add('cep-filled');
            setTimeout(() => fields.complement.classList.remove('cep-filled'), 500);
          }
        } else {
          showUserMessage('CEP não encontrado. Verifique o número.', true);
        }
      } catch (e) {
        console.warn('Erro no preenchimento automático:', e);
      } finally {
        loading = false;
        this.classList.remove('cep-loading');
        this.disabled = false;
        this.focus();
      }
    });

    // Também aciona ao pressionar Enter
    cepInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.blur();
      }
    });
  }

  // ============================================================
  // EXPOR GLOBAL
  // ============================================================
  window.fetchCEP = fetchCEP;
  window.setupCepAutoFill = setupCepAutoFill;

})();