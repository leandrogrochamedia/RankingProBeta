// Rank-X Auth - login fake Google + conexão Supabase
// Bebe da fonte do seu user-service.js original

async function rxFetchUserByEmail(email){
  if(!email) return null;
  try{
    const data = await rxFetch(`/rest/v1/users?email=eq.${encodeURIComponent(email)}&select=*`);
    return data?.[0] || null;
  }catch(e){ console.warn('fetchUserByEmail fail', e); return null; }
}

async function rxCreateUser(payload){
  const data = await rxFetch('/rest/v1/users','POST', payload);
  return data?.[0] || payload;
}

async function rxUpdateUser(id, patch){
  const data = await rxFetch(`/rest/v1/users?id=eq.${id}`,'PATCH', patch);
  return data?.[0] || patch;
}

function rxBuildSession(user){
  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role || 'cliente',
    clientId: user.client_id || null,
    professionalId: user.professional_id || null,
    establishmentId: user.establishment_id || null,
    isAdmin: user.is_admin || false,
    createdAt: new Date().toISOString()
  };
}

// Tenta DEFAULT_USER_EMAIL primeiro, depois FALLBACK
async function rxLoginFakeGoogle(){
  const btn = document.getElementById('btnGoogleFake');
  if(btn){ btn.disabled=true; btn.textContent='🔄 Conectando...'; }
  
  // Mostra log visual
  const logEl = document.getElementById('rxLog');
  function log(msg){ if(logEl){ logEl.style.display='block'; logEl.innerHTML += msg+'<br>'; } console.log(msg); }

  try{
    log('📡 Conectando Supabase...');
    let user = await rxFetchUserByEmail(DEFAULT_USER_EMAIL);
    if(!user){
      log(`⚠️ ${DEFAULT_USER_EMAIL} não encontrado, tentando ${FALLBACK_EMAIL}...`);
      user = await rxFetchUserByEmail(FALLBACK_EMAIL);
    }
    if(!user){
      log('🆕 Criando usuário demo Leandro Rocha...');
      user = await rxCreateUser({
        name: 'Leandro Rocha',
        email: DEFAULT_USER_EMAIL,
        provider: 'google',
        role: 'cliente',
        is_admin: true
      });
    }
    log(`👤 Usuário: ${user.name} (${user.email})`);

    // Garante client_profiles link se não existir (opcional)
    if(!user.client_id){
      try{
        const cp = await rxFetch('/rest/v1/client_profiles','POST',{ name: user.name, email: user.email, city: 'Piraquara' });
        if(cp?.[0]?.id){
          await rxUpdateUser(user.id, { client_id: cp[0].id });
          user.client_id = cp[0].id;
          log('🔗 client_profile criado e vinculado');
        }
      }catch(e){ console.warn('client_profile link skip', e.message); }
    }

    const session = rxBuildSession(user);
    rxSetSession(session);
    log('✅ Sessão salva, redirecionando...');
    if(window.RX?.toast) RX.toast('Bem-vindo, '+user.name);
    setTimeout(()=> location.href='./choose-role.html', 800);
  }catch(e){
    log('❌ Erro: '+e.message);
    if(btn){ btn.disabled=false; btn.textContent='Tentar novamente'; }
    alert('Erro login: '+e.message);
  }
}

window.rxLoginFakeGoogle = rxLoginFakeGoogle;
window.rxFetchUserByEmail = rxFetchUserByEmail;
