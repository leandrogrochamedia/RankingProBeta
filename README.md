# Ranking Pro — Repo híbrido unificado (Opção A)

Infraestrutura de reputação verificada via QR. **MVP na raiz** + núcleo Shark em subpastas (`qr/`, `avaliar/`, `p/`).

> Repo em transição: raiz = fonte de verdade para HTML, JS core e CSS. Pasta `css/` duplicada foi removida.

## Stack

- HTML + JS vanilla
- Supabase Proofly (`pyywdhjstvhmarvzijji`)
- Sessão: `sessionStorage.proofly_session`
- Loader canônico: **`./loader.js`** (raiz)

## Setup local

```bash
cp config.example.js config.js   # credenciais MVP
cd ranking-pro-shark
python3 -m http.server 8765
```

Abra `http://localhost:8765/index.html`

## Fluxo Fase 2

```
index.html → login.html → selecionar-perfil.html → home (cliente / dashboard)
```

| Persona | Destino |
|---------|---------|
| Cliente | `cliente.html` (stub Fase 3) |
| Profissional | `dashboard-profissional.html` (stub Fase 4) |
| Estabelecimento | `dashboard-estabelecimento.html` (stub Fase 4) |

## Fluxo QR (núcleo)

```
/qr/?token= → /avaliar/?token= → /p/?id=UUID
```

Legado: `index.html?token=` redireciona para `/qr/?token=`.

## Estrutura

```
ranking-pro-shark/
├── loader.js          ← CANÔNICO (Fase 2 slim + opcional por página)
├── session.js, api.js, flow-registry.js, profile-selector.js
├── qr-service.js, qr-reviews-service.js, profile-service.js
├── base.css, style.css, proofly-glass.css, nucleus.css
├── qr/  avaliar/  p/  dev/
├── docs/MAPA-PAGINAS-LOADER-CSS.md
├── docs/BLUEPRINT-Navegacao-v2.md
└── sql/002_proofly_bridge.sql
```

## SQL Proofly

Rodar `sql/002_proofly_bridge.sql` no SQL Editor (RPCs QR). Sem isso, REST fallback continua funcionando.

## Shark Mode

`SHARK_MODE=true` em `config.js` — marketplace/contratar/relatório redirecionam para dashboard estabelecimento (sem `DEBUG_MODE`).

## Docs

- Mapa páginas: `docs/MAPA-PAGINAS-LOADER-CSS.md`
- Blueprint: `docs/BLUEPRINT-Navegacao-v2.md`
- Design system: `docs/DESIGN-SYSTEM-DESENVOLVEDOR.txt`