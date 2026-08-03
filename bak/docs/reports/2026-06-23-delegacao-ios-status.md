# Delegação Master — Menu iOS + Control Center + Debug

**Status:** ✅ CONCLUÍDA (código)  
**Commit principal:** `5d827c2`  
**Report detalhado:** [2026-06-23-navegacao-ios-control-center.md](./2026-06-23-navegacao-ios-control-center.md)

---

## Checklist por tarefa

| # | Tarefa | Status | Evidência |
|---|--------|--------|-----------|
| 1 | Paradigma iOS — menu lateral não é nav principal | ✅ | `menu.js` cliente: Buscar, Favoritos, Meu perfil; `cliente.html` header pills |
| 1 | Header simples + botões na tela | ✅ | `cliente.html` — `ios-app-header`, Favoritos, QR, ⚙️ |
| 1 | Favoritos fora do menu lateral | ✅ | Header + `menu.js` |
| 1 | Prof/Est via login → dashboard | ✅ | Sem atalhos landings no menu lateral |
| 1 | Menu lateral mantido como DEV only | ✅ | `menu-lateral.js` — classe `menu-lateral--dev` |
| 2 | Menu enxuto (Início, Cliente, Favoritos, DEV…) | ✅ | 7 itens em `menu-lateral.js` |
| 2 | Removidos itens poluídos | ✅ | Área Cliente, Cadastro, Perfil-page, Modo Cliente, Apêndice, Admin, landings |
| 2 | Trocar Profissional (opcional) | ✅ | Mantido com `?force=true` |
| 3 | Validar dev-simulation como Control Center | ✅ | Decisão: **evoluir** (não criar página nova) |
| 4 | Sessão LIVE | ✅ | `dev-control-center.js` — `#ccSessionLive` |
| 4 | Match Debug (tags + amostra) | ✅ | `#ccMatchDebug` + toggle |
| 4 | Navegação rápida | ✅ | Links dashboards, contratar, admin, etc. |
| 4 | Banco leve (schema + 5 rows) | ✅ | `PREVIEW_TABLES` em `dev-control-center.js` |
| 5 | Match debug em cliente.html | ✅ | Overlay nos cards via `profile-card.js` + console em `cliente.js` |
| 6 | `window.PROOFLY_DEBUG` | ✅ | `proofly-debug.js` — getSession, logSession, clearSession, toggleMatchDebug |
| 6 | Exibir no Control Center | ✅ | Botões log/limpar/toggle match |
| 7 | Visual iOS/glass em cliente.html | ✅ | `proofly-glass.css` — `ios-app-header`, pills |
| 7 | Cards de busca | ✅ | Já em `proofly-glass.css` (glass-discovery-shell, tinder cards) |
| 7 | Drawer de perfil | ⚠️ Parcial | Drawer já tinha glass/tinder; **sem pass extra dedicado** nesta delegação |

---

## Arquivos criados/alterados

| Arquivo | Papel |
|---------|--------|
| `proofly-debug.js` | API global DEBUG |
| `dev-control-center.js` | Lógica Control Center |
| `dev-simulation.html` | UI Control Center |
| `menu-lateral.js` | Menu DEV enxuto |
| `menu.js` | Nav flutuante cliente |
| `cliente.html` | Header iOS |
| `cliente.js` | Log match no console |
| `components/profile-card.js` | Overlay match debug |
| `utils.js` | `buildMatchBreakdown()` |
| `proofly-glass.css` | Estilos iOS + Control Center + match debug |
| `config.js` | `PROOFLY_DEV_MENU` |
| `loader.js` | Carrega `proofly-debug.js` |

---

## Critérios de sucesso

| Critério | OK? |
|----------|-----|
| Menu lateral não poluído | ✅ |
| Navegação mais limpa | ✅ |
| dev-simulation = Control Center | ✅ |
| Debug match + sessão | ✅ |
| Visual mais premium (cliente) | ✅ |
| Fluxos não quebrados (código) | ✅ — **teste manual** recomendado nos 3 papéis |

---

## Pendências / follow-up opcional

1. **Teste E2E manual** — cliente, prof, estabelecimento após hard refresh
2. **Drawer** — polimento visual extra (se Art quiser refinamento)
3. **`PROOFLY_DEV_MENU = false`** — quando for demo externa sem menu DEV

---

## Como testar (2 min)

1. `cliente.html` — usar só header + menu flutuante
2. `dev-simulation.html` — Control Center → Match debug ON
3. Buscar profissionais — ver overlay nos cards
4. Menu lateral DEV — só 7 ícones