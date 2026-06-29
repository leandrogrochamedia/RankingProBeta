// ============================================================
// PROOFLY — Simulação de papéis (Control Center + menus DEV)
// ============================================================

(function() {
  let userServicePromise = null;

  function loadUserService() {
    if (typeof fetchUserByEmail === 'function') return Promise.resolve();
    if (userServicePromise) return userServicePromise;
    userServicePromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = './user-service.js';
      script.async = false;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Falha ao carregar user-service.js'));
      document.head.appendChild(script);
    });
    return userServicePromise;
  }

  async function ensureDevUser(role) {
    await loadUserService();
    const email = `dev.${role}@proofly.com`;
    let user = await fetchUserByEmail(email);
    if (!user) {
      user = await createUser({
        name: `Dev ${role}`,
        email,
        provider: 'dev-simulation',
        role: role === 'profissional' ? 'profissional' : role === 'estabelecimento' ? 'estabelecimento' : 'cliente'
      });
    }
    return user;
  }

  function buildDevSession(user, role) {
    const profileMap = {
      cliente: 'client',
      profissional: 'professional',
      estabelecimento: 'establishment'
    };
    const activeProfile = profileMap[role] || 'client';
    if (typeof buildSessionFromUser === 'function') {
      return buildSessionFromUser(user, {
        clientId: null,
        professionalId: null,
        establishmentId: null,
        activeProfile
      });
    }
    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      role,
      activeProfile,
      clientId: null,
      professionalId: null,
      establishmentId: null,
      isAdmin: false
    };
  }

  const REDIRECTS = {
    cliente: './selecionar-cliente.html?force=true',
    profissional: './selecionar-profissional.html?force=true',
    estabelecimento: './selecionar-estabelecimento.html?force=true'
  };

  async function simularPapel(role) {
    try {
      const user = await ensureDevUser(role);
      setSession(buildDevSession(user, role));
      window.location.href = REDIRECTS[role];
    } catch (e) {
      console.error('Erro ao simular papel:', role, e);
      alert('Não foi possível trocar o papel. Veja o console.');
    }
  }

  window.simularCliente = () => simularPapel('cliente');
  window.simularProfissional = () => simularPapel('profissional');
  window.simularEstabelecimento = () => simularPapel('estabelecimento');
})();