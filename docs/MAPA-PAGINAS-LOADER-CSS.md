# Mapa de páginas — Loader, CSS e status

**Repo:** ranking-pro-shark · **Arquitetura:** Opção A (raiz MVP)  
**Loader canônico:** `./loader.js` (raiz)  
**CSS fonte:** `base.css`, `style.css`, `proofly-glass.css` na raiz · `nucleus.css` só rotas QR

---

## Fase 2 — fluxo principal

| Página | Loader | CSS | Scripts page-specific | Status |
|--------|--------|-----|----------------------|--------|
| `index.html` | `./loader.js` | base → style → proofly-glass | `index-qr.js` (antes do loader) | OK |
| `login.html` | `./loader.js` | base → style (cards brancos) | inline login | OK |
| `selecionar-perfil.html` | `./loader.js` | base → style → proofly-glass | inline affiliations | OK |
| `cliente.html` | `./loader.js` | base → style → proofly-glass → nucleus | stub Fase 3 | OK (stub) |
| `dashboard-profissional.html` | `./loader.js` | base → style (cards brancos) | guard sessão | OK (stub) |
| `dashboard-estabelecimento.html` | `./loader.js` | base → style (cards brancos) | guard sessão | OK (stub) |
| `selecionar-cliente.html` | `./loader.js` | base → style | stub onboarding | OK (stub) |
| `selecionar-profissional.html` | `./loader.js` | base → style | stub | OK (stub) |
| `selecionar-estabelecimento.html` | `./loader.js` | base → style | stub | OK (stub) |

## Núcleo QR (subpastas — scripts `../` diretos)

| Página | Loader | CSS | Scripts | Status |
|--------|--------|-----|---------|--------|
| `qr/index.html` | — | `../base.css` … `../nucleus.css` | config, api, qr-service | OK |
| `avaliar/index.html` | — | idem | + qr-reviews-service | OK |
| `p/index.html` | — | + `../components/tinder-profile.css` | profile-service | OK |
| `dev/gerar-qr.html` | — | idem | qr-service, QRCode CDN | OK |

## MVP legado (raiz — loader completo quando necessário)

| Página | Loader | CSS | Status |
|--------|--------|-----|--------|
| `perfil-page.html` | `./loader.js` | base → style → glass | LEGADO |
| `meu-perfil.html` | `./loader.js` | base → style | LEGADO |
| `minhas-avaliacoes.html` | `./loader.js` | base → style | LEGADO |
| `favoritos.html` | `./loader.js` | base → style → glass | LEGADO |
| `cadastro-cliente.html` | `./loader.js` | base → style | LEGADO |
| `onboarding-*.html` | `./loader.js` | base → style | LEGADO |
| `estabelecimento-marketplace.html` | `./loader.js` | glass | LEGADO · Shark redirect |
| `contratar.html` | — | — | LEGADO · Shark redirect |
| `relatorio-contratante.html` | `./loader.js` | — | LEGADO · Shark redirect |
| `admin.html` | `./loader.js` | — | DEV only |

## Deprecado / removido

| Item | Ação |
|------|------|
| `js/loader.js` | Redirect → `../loader.js` |
| `css/base.css`, `css/style.css`, … | Removidos — raiz é fonte |
| `js/api.js`, `js/session.js`, … | Duplicata — usar raiz |

## Ordem CSS (design system)

1. `base.css`
2. `style.css`
3. `tinder-profile.css` / `profile-dashboard.css` (se perfil)
4. `proofly-glass.css` (último em fluxos glass)
5. `nucleus.css` (só QR/núcleo)