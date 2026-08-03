# Proofly — Navegação iOS + Control Center DEV

**Data:** 23/06/2026  
**Commit:** `5d827c2`  
**Repo:** https://github.com/leandrogrochamedia/Proofly

---

## Resumo

Migração do paradigma de navegação: menu lateral deixa de ser navegação principal e vira **ferramenta DEV**. Navegação do produto fica no **header + menu flutuante** (estilo iOS/glass).

---

## Menu lateral DEV (enxuto)

| Ícone | Destino |
|-------|---------|
| 🏠 | `index.html` |
| 🔎 | `cliente.html` |
| ❤️ | `favoritos.html` |
| 🧪 | `dev-simulation.html` (Control Center) |
| 🔀 | `selecionar-profissional.html?force=true` |
| 🔄 | Reset Session |

**Removidos do menu** (arquivos mantidos): Área Cliente, Cadastro, Perfil-page, Modo Cliente, Apêndice, Admin, landings, Widget.

**Desligar menu lateral:** `config.js` → `PROOFLY_DEV_MENU = false`

---

## Navegação principal (cliente)

- **Header glass:** Favoritos, QR, ⚙️ Control Center (se `DEBUG_MODE`)
- **Menu flutuante:** Buscar · Favoritos · Meu perfil

Profissional / Estabelecimento: login → dashboard (sem atalhos globais).

---

## Control Center (`dev-simulation.html`)

Seções:
1. **Sessão live** — userId, role, clientId, professionalId, establishmentId
2. **Match debug** — tags do cliente + amostra do banco
3. **Trocar papel** — cliente / prof / est
4. **Nav rápida** — dashboards, contratar, admin, apêndice, widget, BD
5. **Banco leve** — schema + preview 5 linhas/tabela

Arquivos: `dev-simulation.html`, `dev-control-center.js`, `proofly-debug.js`

---

## PROOFLY_DEBUG (console)

```javascript
PROOFLY_DEBUG.getSession()
PROOFLY_DEBUG.logSession()
PROOFLY_DEBUG.clearSession()
PROOFLY_DEBUG.toggleMatchDebug()  // overlay nos cards
PROOFLY_DEBUG.logMatch(item, 'prof', tags)
```

**Match debug ON:** Control Center → botão → buscar em `cliente.html` → cards mostram breakdown.

---

## Migrations Supabase (se ainda não rodou)

1. `migrations/019_RODE_NO_SUPABASE.sql` — `work_style_tags`, etc.
2. `migrations/020_RODE_NO_SUPABASE.sql` — `client_profiles`, `users.client_id`

Conferência:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('client_profiles', 'professionals');
```

---

## Teste rápido (5 min)

1. Hard refresh em `cliente.html`
2. Navegar só por header + menu flutuante
3. Control Center → Match debug ON → buscar profissionais
4. Reset Session → trocar papel → validar cliente / prof / est

---

## Arquivos alterados (principal)

| Área | Arquivos |
|------|----------|
| DEV | `menu-lateral.js`, `proofly-debug.js`, `dev-control-center.js`, `dev-simulation.html` |
| Cliente | `cliente.html`, `cliente.js`, `menu.js`, `proofly-glass.css` |
| Match | `utils.js` (`buildMatchBreakdown`), `components/profile-card.js` |
| Config | `config.js`, `loader.js` |