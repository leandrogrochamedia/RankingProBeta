// ============================================================
// Ranking Pro — Fluxo QR / Avaliação (canônico)
// Deep link → cliente.html drawer · thin redirects em qr/ e avaliar/
// ============================================================

(function (global) {
  'use strict';

  function siteUrl(path) {
    if (global.RankingProPaths?.siteUrl) return global.RankingProPaths.siteUrl(path);
    return './' + String(path || '').replace(/^\.\//, '');
  }

  function parseQrEntryFromUrl(search) {
    const params = new URLSearchParams(search || global.location.search);
    return {
      token: params.get('token') || params.get('qr_token') || null,
      professionalId: params.get('professionalId') || params.get('professional_id') || null,
      establishmentId: params.get('establishmentId') || params.get('establishment_id') || null,
      qr: params.get('qr') === '1',
      verified: params.get('verified') === 'qr',
      avaliar: params.get('avaliar') === '1'
    };
  }

  function buildClienteAvaliacaoQuery(params) {
    const p = params || {};
    const qs = new URLSearchParams();
    if (p.professionalId) qs.set('professionalId', p.professionalId);
    if (p.establishmentId) qs.set('establishmentId', p.establishmentId);
    if (p.token) qs.set('token', p.token);
    if (p.qr) qs.set('qr', '1');
    if (p.verified) qs.set('verified', 'qr');
    if (p.avaliar) qs.set('avaliar', '1');
    const str = qs.toString();
    return str ? '?' + str : '';
  }

  function redirectToClienteAvaliacao(params, replace) {
    const dest = siteUrl('cliente.html') + buildClienteAvaliacaoQuery(params);
    if (replace !== false) global.location.replace(dest);
    else global.location.href = dest;
    return dest;
  }

  async function resolveQrTokenEntry(token) {
    if (!token) return { ok: false, error: 'invalid', message: 'Token ausente' };
    if (!global.RankingProQR?.validateToken) {
      return { ok: false, error: 'invalid', message: 'Serviço QR indisponível' };
    }
    const result = await global.RankingProQR.validateToken(token);
    if (result.status === 'valid') {
      return { ok: true, professionalId: result.professional_id, token, validated: result };
    }
    return { ok: false, error: result.status, result };
  }

  function persistQrSession(params) {
    if (params?.token) {
      try {
        global.sessionStorage.setItem('ranking_pro_qr_token', params.token);
        global.sessionStorage.removeItem('proofly_qr_token');
      } catch { /* noop */ }
    }
    if (typeof markQrReviewSession === 'function') markQrReviewSession(true);
  }

  function buildPerfilAvaliarUrl(profId, opts) {
    const qs = new URLSearchParams();
    qs.set('tipo', 'profissional');
    qs.set('id', profId);
    qs.set('avaliar', '1');
    if (opts?.token) qs.set('token', opts.token);
    if (opts?.qr) qs.set('qr', '1');
    if (opts?.verified) qs.set('verified', 'qr');
    return siteUrl('perfil-page.html') + '?' + qs.toString();
  }

  function openAvaliacaoDrawer(profId, opts) {
    const id = profId || opts?.professionalId;
    if (!id) return false;

    const dest = buildPerfilAvaliarUrl(id, {
      token: opts?.token,
      qr: true,
      verified: true
    });

    if (typeof global.navigateWithTransition === 'function') {
      global.navigateWithTransition(dest);
      return true;
    }
    global.location.href = dest;
    return true;
  }

  function cleanDeepLinkFromHistory() {
    if (!global.history?.replaceState) return;
    let newSearch = global.location.search
      .replace(/[?&]professionalId=[^&]*/, '')
      .replace(/[?&]establishmentId=[^&]*/, '')
      .replace(/[?&]token=[^&]*/, '')
      .replace(/[?&]qr_token=[^&]*/, '')
      .replace(/[?&]qr=[^&]*/, '')
      .replace(/[?&]verified=[^&]*/, '')
      .replace(/[?&]avaliar=[^&]*/, '');
    newSearch = newSearch.replace(/^&/, '?');
    if (newSearch === '?') newSearch = '';
    global.history.replaceState({}, global.document.title, global.location.pathname + newSearch);
  }

  function handleIndexEntry() {
    const params = parseQrEntryFromUrl();
    if (params.token && !params.professionalId && !params.establishmentId) {
      global.location.replace(siteUrl('qr/') + '?token=' + encodeURIComponent(params.token));
      return true;
    }
    if (params.professionalId || params.establishmentId) {
      const dest = { ...params };
      if (params.qr || params.verified || params.token) {
        dest.qr = dest.qr || params.qr || !!params.token;
        dest.verified = dest.verified || params.verified || !!params.token;
      }
      redirectToClienteAvaliacao(dest);
      return true;
    }
    return false;
  }

  function handleClienteDeepLink() {
    const params = parseQrEntryFromUrl();
    if (!params.professionalId && !params.establishmentId) return false;

    if (params.token) persistQrSession(params);
    else if (typeof initQrReviewFromUrl === 'function') initQrReviewFromUrl();

    const qrFlow = !!(params.token || params.qr || params.verified ||
      (typeof isQrReviewSession === 'function' && isQrReviewSession()));

    setTimeout(() => {
      if (params.professionalId) {
        if (qrFlow) {
          openAvaliacaoDrawer(params.professionalId, { token: params.token });
        } else if (typeof global.openProfile === 'function') {
          global.openProfile('profissional', params.professionalId);
        } else if (typeof global.RankingProRouter?.openProfile === 'function') {
          global.RankingProRouter.openProfile('profissional', params.professionalId, { forcePage: true });
        }
      } else if (params.establishmentId) {
        if (typeof global.openProfile === 'function') {
          global.openProfile('estabelecimento', params.establishmentId);
        } else if (typeof global.RankingProRouter?.openProfile === 'function') {
          global.RankingProRouter.openProfile('estabelecimento', params.establishmentId, { forcePage: true });
        }
      }
      cleanDeepLinkFromHistory();
    }, 400);

    return true;
  }

  async function handleQrIndexPage(ui) {
    const token = parseQrEntryFromUrl().token;
    if (!token) {
      return { error: 'invalid', message: 'Este link não contém um código válido.' };
    }
    try {
      const resolved = await resolveQrTokenEntry(token);
      if (!resolved.ok) {
        return { error: resolved.error, message: errorMessageForStatus(resolved.error), result: resolved.result };
      }
      redirectToClienteAvaliacao({
        professionalId: resolved.professionalId,
        token,
        qr: true,
        verified: true
      });
      return { ok: true };
    } catch (err) {
      console.error(err);
      return { error: 'network', message: 'Não foi possível validar o QR. Tente novamente.' };
    }
  }

  async function handleAvaliarIndexRedirect() {
    const params = parseQrEntryFromUrl();
    if (!params.token) {
      redirectToClienteAvaliacao(params);
      return;
    }
    try {
      const resolved = await resolveQrTokenEntry(params.token);
      redirectToClienteAvaliacao({
        professionalId: resolved.ok ? resolved.professionalId : null,
        token: params.token,
        qr: true,
        verified: true
      });
    } catch {
      redirectToClienteAvaliacao({ token: params.token, qr: true, verified: true });
    }
  }

  function errorMessageForStatus(status) {
    if (status === 'expired') return 'Este QR expirou. Peça um novo ao profissional.';
    if (status === 'used') return 'Esta avaliação já foi registrada.';
    return 'Este link não é válido ou já expirou.';
  }

  global.RankingProQrFlow = {
    parseQrEntryFromUrl,
    buildClienteAvaliacaoQuery,
    redirectToClienteAvaliacao,
    resolveQrTokenEntry,
    persistQrSession,
    openAvaliacaoDrawer,
    handleIndexEntry,
    handleClienteDeepLink,
    handleQrIndexPage,
    handleAvaliarIndexRedirect,
    errorMessageForStatus
  };
})(window);