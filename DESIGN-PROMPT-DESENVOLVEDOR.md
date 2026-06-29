# RANKING PRO (PROOFLY) — PROMPT DE DESIGN SYSTEM PARA DESENVOLVEDOR
**Versão:** 27/JUN/2026 | **Fonte:** MVP Hanking PRO | **Uso:** colar no início de qualquer tarefa de UI/refatoração

---

## INSTRUÇÃO PARA A IA / DESENVOLVEDOR

Você está implementando UI no **Ranking Pro** (código interno: **PROOFLY**).  
Sua missão não é inventar visual — é **replicar fielmente** o design system existente.

**North Star:** toda tela reforça **reputação verificável** — o produto vende confiança, não decoração.

**Paradigma:** Apple / iCloud Glass — dark premium, glassmorphism, safe-area iOS, SF Pro / system-ui.

**Stack:** HTML estático + JS vanilla + Supabase REST. Sem React/Vue/Tailwind novo.

**Regra de ouro:** 1 CTA principal por tela. Hierarquia → layout → componentes → código. Nunca inverter.

---

## 1. ARQUITETURA CSS — ORDEM OBRIGATÓRIA

```html
<link rel="stylesheet" href="./base.css" />           <!-- 1º — tokens globais -->
<link rel="stylesheet" href="./style.css" />          <!-- 2º — layout + componentes base -->
<!-- 3º — conforme contexto da página: -->
<link rel="stylesheet" href="./components/tinder-profile.css" />  <!-- discovery/perfil -->
<link rel="stylesheet" href="./profile-dashboard.css" />          <!-- dashboards -->
<link rel="stylesheet" href="./proofly-glass.css" />                <!-- SEMPRE POR ÚLTIMO em fluxos glass -->
```

| Arquivo | Quando usar |
|---------|-------------|
| `base.css` | Todas as páginas |
| `style.css` | Todas as páginas |
| `proofly-glass.css` | Cliente, favoritos, login, marketplace, perfil público — **por último** |
| `profile-dashboard.css` | `dashboard-profissional.html`, `dashboard-estabelecimento.html` |
| `components/tinder-profile.css` | Cards Tinder + drawer bottom-sheet |
| `widget.css` | Widget embed externo |
| `base-de-dados.css` | Painel admin DB (DM Sans + JetBrains Mono) |

### Meta tags obrigatórias (todas as páginas)

```html
<meta name="theme-color" content="#08080f" />
<meta name="color-scheme" content="dark" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

---

## 2. DOIS MUNDOS VISUAIS — NUNCA MISTURAR

| Contexto | Superfície | Fundo | Texto |
|----------|-----------|-------|-------|
| **Discovery / Cliente / Favoritos / Perfil público** | Glass (`--glass-bg`, blur 28px) | Gradiente vivo `#08080f` | `--text-glass-primary` (#eaeaea) |
| **Dashboards Prof / Estab / Onboarding / Login** | Cards **brancos sólidos** | Dark body ou neutro | `--text-primary` (#0f172a) |
| **Admin DB** | Sidebar + pills próprios | Próprio tema | DM Sans |

**PROIBIDO:** aplicar glass em dashboards de edição.  
**PROIBIDO:** cards brancos sólidos no meio do discovery glass (exceto conteúdo interno de modais brancos).

---

## 3. TOKENS — COPIAR, NÃO INVENTAR

### 3.1 Cores primárias (`base.css`)

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-primary` | `#6366f1` | CTAs, bordas ativas, links |
| `--color-secondary` | `#8b5cf6` | Gradientes secundários |
| `--gradient-primary` | `135deg #6366f1 → #8b5cf6` | Botões primários |
| `--gradient-green` | `135deg #10b981 → #059669` | Salvar / OK / sucesso |
| `--gradient-red` | `135deg #ef4444 → #dc2626` | Danger / excluir |
| `--bg-body` | `#0d0d1a` | Fundo app legado |
| `--star-color` | `#f59e0b` | Estrelas / match quente |

### 3.2 Glass (`proofly-glass.css`)

| Token | Valor |
|-------|-------|
| `--glass-bg` | `rgba(255,255,255,0.06)` |
| `--glass-bg-elevated` | `rgba(255,255,255,0.10)` |
| `--glass-blur` | `blur(28px) saturate(160%)` |
| `--glass-radius` | `22px` |
| `--glass-radius-lg` | `28px` |
| `--glass-shadow` | `0 12px 40px rgba(0,0,0,0.28)` |
| `--glass-stroke` | `rgba(255,255,255,0.08)` |
| `--glass-stroke-inner` | `rgba(255,255,255,0.05)` |
| `--text-glass-primary` | `#eaeaea` |
| `--text-glass-secondary` | `rgba(234,234,234,0.62)` |
| `--text-glass-muted` | `rgba(234,234,234,0.42)` |

### 3.3 Cores semânticas de match

| Tier | Cor | Classe |
|------|-----|--------|
| Hot (alto match) | `#f59e0b` âmbar | `.match-tier-hot` |
| Warm (médio) | `#6366f1` indigo | `.match-tier-warm` |
| Cool (baixo) | `#475569` slate | `.match-tier-cool` |
| Estabelecimento | `#0ea5e9` sky | `.tinder-card.est` |

### 3.4 Tags por categoria (`base.css`)

| Categoria | BG | Texto |
|-----------|-----|-------|
| Música | `#fce4ec` | `#b91c1c` |
| Visual | `#e0f2fe` | `#0369a1` |
| Amenity | `#d1fae5` | `#065f46` |
| Vibe | `#fef3c7` | `#92400e` |
| Default | `#e2e8f0` | `#1e293b` |

### 3.5 Tipografia

```css
font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif;
```

| Token | Tamanho | Uso |
|-------|---------|-----|
| `--font-size-xs` | 11px | Labels, meta |
| `--font-size-sm` | 12px | Chips pequenos |
| `--font-size-base` | 14px | Corpo padrão |
| `--font-size-md` | 16px | Inputs |
| `--font-size-lg` | 18px | Subtítulos |
| `--font-size-xl` | 20px | Títulos de seção |
| `--font-size-2xl` | 22px | — |
| `--font-size-3xl` | 24px | Nomes em overlay |
| `--font-size-4xl` | 28px | Hero |
| `--font-size-5xl` | 32px | — |
| `--font-size-7xl` | 48px | Splash logo |

**Peso:** 500 corpo glass | 600 labels | 700 títulos | 800 nomes em cards

### 3.6 Espaçamento & Radius

| Token | Valor |
|-------|-------|
| `--space-section` | 20px (glass) |
| `--space-card` | 24px (glass) |
| `--card-padding` | 25px (cards sólidos) |
| `--container-max` | 750px |
| `--radius-lg` | 12px |
| `--radius-2xl` | 20px |
| `--radius-full` / `999px` | Pills e botões arredondados |

### 3.7 Z-Index

| Token | Valor | Uso |
|-------|-------|-----|
| `--z-dropdown` | 50 | Dropdowns |
| `--z-menu` | 100 | Menu lateral |
| `--z-confirm` | 200 | Reservado |
| `--z-drawer-overlay` | 999 | Backdrop drawer |
| `--z-drawer` | 1000 | Drawer |
| `--z-floating-menu` | 999 | Dock inferior |
| Confirm modal | 99999 | `confirm-modal.js` |
| Loading / onboarding | 10000 | Overlays fullscreen |
| QR modal | 9000 | Scanner |

### 3.8 Animações

| Contexto | Curva | Duração |
|----------|-------|---------|
| Bottom sheets | `cubic-bezier(0.32, 0.72, 0, 1)` | 0.38–0.4s |
| Cards Tinder enter | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | 0.45s |
| Hover botões | `translateY(-1px)` ou `scale(1.02)` | 0.2s |
| Confirm modal | zoom 0.95→1 | 0.25s |
| Glass fade in | `translateY(6px)` | 0.35s |

**Obrigatório:** respeitar `prefers-reduced-motion` em `base.css`.

---

## 4. MODAIS, SHEETS E OVERLAYS — CATÁLOGO COMPLETO

### 4.1 Confirm Modal (GLOBAL — usar sempre)

**Arquivo:** `confirm-modal.js` (carregado via `loader.js`)

**Nunca usar** `window.confirm()` ou `window.alert()` nativos.

```javascript
// Confirmação com cancelar
const ok = await showConfirm({
  title: 'Excluir item?',
  message: 'Essa ação não pode ser desfeita.',
  confirmText: 'Excluir',
  cancelText: 'Cancelar',
  danger: true          // botão vermelho
});

// Apenas OK (alert)
await showAlert('Salvo!', 'Suas alterações foram aplicadas.');

// Apenas OK customizado
await showConfirm({ title: 'Atenção', message: '...', confirmOnly: true, confirmText: 'Entendi' });
```

**Anatomia visual:**

| Elemento | Spec |
|----------|------|
| `.confirm-overlay` | `fixed inset-0`, `rgba(0,0,0,0.5)`, blur 4px, z-index 99999 |
| `.confirm-box` | 360px max, radius 20px, fundo `#fff`, padding 32/28/24 |
| Título `h3` | 20px, weight 700, `#0f172a` |
| Mensagem | 15px, `#475569`, line-height 1.5 |
| `.btn-cancel` | `#f1f5f9`, radius **999px** (pill), min-width 100px |
| `.btn-confirm` | gradiente indigo→violet, pill |
| `.btn-confirm.danger` | gradiente vermelho |
| `.btn-ok` | gradiente verde, min-width 120px |
| ESC | cancela (exceto `confirmOnly`) |
| Click fora | cancela (exceto `confirmOnly`) |
| Enter | confirma |

### 4.2 Style Onboarding Sheet (bottom sheet branco)

**Arquivo:** `style.css` + `cliente.js`

| Classe | Spec |
|--------|------|
| `.style-onboarding-modal` | fixed inset-0, z-index 10000, align flex-end |
| `.style-onboarding-backdrop` | `rgba(15,23,42,0.55)`, blur 4px |
| `.style-onboarding-sheet` | max-width 520px, radius **24px top**, anim `sheetUp 0.38s` |
| `.style-onboarding-close` | 36×36px, circle, `#f1f5f9` |
| `.style-onboarding-chip` | pill 999px, border 2px `#e2e8f0`, padding 10×16 |
| `.style-onboarding-chip.active` | gradiente indigo, sombra roxa |
| Safe-area | `padding-bottom: calc(24px + env(safe-area-inset-bottom))` |

**Funções:** `abrirOnboardingEstilo()`, `fecharOnboardingEstilo()`, `salvarOnboardingEstilo()`, `toggleOnboardingChip()`

### 4.3 QR Scanner Modal

| Classe | Spec |
|--------|------|
| `.qr-modal` | z-index 9000, `.open` = flex center |
| `.qr-modal-backdrop` | `rgba(0,0,0,0.7)`, blur 6px |
| `.qr-modal-content` | max-width 420px, `--radius-2xl` |
| `.scanner-box` | fundo preto para `#qr-reader` |

### 4.4 Loading Overlay

| Classe | Spec |
|--------|------|
| `.loading-overlay` | fullscreen blur escuro, z-index 10000 |
| `.loading-box` | glass leve, logo pulse, progress bar |
| `.loading-overlay.hidden` | fade out + pointer-events none |

Usado em: `cliente-page-boot.js`, `estabelecimento-marketplace-boot.js`

### 4.5 Drawer Tinder (bottom sheet perfil)

| Classe | Spec |
|--------|------|
| `.drawer.drawer-tinder` | bottom 0, height 94vh, max 860px, radius **26px top** |
| Estado fechado | `translateY(100%)` |
| Estado aberto | `.open` → `translateY(0)` |
| `.drawer-drag-handle` | 44×5px pill, `rgba(255,255,255,0.28)` |
| `.drawer-close-floating` | 44×44 circle, blur backdrop |
| `.drawer-actions-sticky` | CTAs fixos no rodapé |
| Fundo drawer | `#0f172a` |
| Transição | `0.4s cubic-bezier(0.32, 0.72, 0, 1)` |

**Mobile ≤480px:** `.drawer-actions-row` vira coluna.

**Funções globais:** `openProfile(tipo, id)`, `fecharDrawer()`, `scrollDrawerToReviews()`

**Alternativa leve:** `perfil-page.html` + `profile-page-view.js` (sem drawer persistente — menos RAM mobile)

### 4.6 Drawer legado lateral

`.drawer:not(.drawer-tinder)` — slide da direita. Usar só em admin/legado.

---

## 5. PILLS — TODAS AS VARIANTES

### 5.1 Pills de filtro (discovery glass) — `proofly-glass.css`

```css
.pill {
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 500;
  border-radius: 999px;
  background: rgba(255,255,255,0.07);
  color: var(--text-glass-secondary);
  box-shadow: inset 0 1px 0 var(--glass-stroke-inner);
}
.pill.active, .pill.pill-selected {
  background: linear-gradient(135deg, rgba(99,102,241,0.55), rgba(139,92,246,0.45));
  color: #fff;
  box-shadow: 0 4px 16px rgba(99,102,241,0.28), inset 0 1px 0 rgba(255,255,255,0.15);
}
```

### 5.2 Pills de filtro (legado claro) — `style.css`

```css
.pill.active {
  background: linear-gradient(135deg, #fd267a, #ff6036);  /* Tinder pink-orange */
  color: #fff;
  box-shadow: 0 3px 10px rgba(253,38,122,0.3);
}
```

**Regra:** em páginas com `proofly-glass.css`, a variante glass (indigo) **sobrescreve** a Tinder.

### 5.3 Pills ativas removíveis (barra de filtros)

| Classe | Comportamento |
|--------|---------------|
| `.active-pills-bar` | hidden por padrão |
| `.active-pills-bar.has-pills` | flex visível |
| `.pill.pill-selected` | gradiente ativo + anim `pillIn` |
| `.pill-remove` | 14×14 circle, `rgba(255,255,255,0.28)` |

### 5.4 Pills iOS (ações hero / dashboard glass)

| Classe | Spec |
|--------|------|
| `.btn-ios-pill` | inline-flex, padding 10×16, radius 999px, font 14px weight 600 |
| `.btn-ios-pill-ghost` | `rgba(255,255,255,0.08)`, inset stroke |
| `.btn-ios-pill-primary` | gradiente indigo 0.9 opacity, sombra roxa |
| `.btn-ios-pill-success` | verde (dashboard prof) |
| `.btn-ios-pill-dev` | muted, só DEV |

### 5.5 Pills dashboard (tags edição)

| Classe | Spec |
|--------|------|
| `.tag-pill` / `.chip-edit` | radius 999px, border `#c7d2fe` |
| `.chip-edit.active` | fundo indigo claro, border primary |
| `.proofly-dash-badge` | 11px, padding 4×10, radius 999px |

### 5.6 Chips de estilo cliente

| Classe | Spec |
|--------|------|
| `.client-style-chip` | glass inset, sem border |
| `.style-chip` | usado em cards match banner |
| `.client-location-chip` | verde `rgba(16,185,129,0.18)`, texto `#6ee7b7` |

### 5.7 Onboarding chips (sheet branco)

`.style-onboarding-chip` — maior (14px, padding 10×16), border 2px, ativo = gradiente indigo.

---

## 6. BOTÕES — MATRIZ COMPLETA

### 6.1 Botões base (`style.css`)

| Classe | Visual | Uso |
|--------|--------|-----|
| `.btn` | gradiente primary, radius `--radius-lg` | CTA padrão |
| `.btn-outline` | border 2px primary, transparente | Secundário |
| `.btn-green` | gradiente verde | Sucesso |
| `.btn-red` / `.btn-danger` | gradiente vermelho | Destrutivo |
| `.btn-small` | padding reduzido, 12px | Compacto |
| `.btn-large` | radius `--radius-full` (50px), grande | Landing CTAs |
| `.btn-full` | width 100% | Drawer footer |

**Hover padrão:** `translateY(-2px)` + sombra `--shadow-xl`

### 6.2 Botões dashboard (`profile-dashboard.css`)

| Classe | Visual |
|--------|--------|
| `.btn-edit` | outline indigo 2px, pill 999px → hover preenche |
| `.btn-save` | gradiente verde, pill |
| `.btn-cancel` | outline slate, pill |
| `.btn-gallery-add` | `#f1f5f9`, border dashed slots |

### 6.3 Botões Tinder drawer (`tinder-profile.css`)

| Classe | Visual |
|--------|--------|
| `.btn-tinder-xl` | full-width, grande |
| `.btn-tinder-primary` | gradiente indigo |
| `.btn-tinder-action` | ação secundária |
| `.btn-tinder-secondary` | ghost escuro |
| `.btn-tinder-like` | verde/rosa like |
| `.btn-tinder-like.liked` | estado ativo |
| `.btn-tinder-fav.active` | favorito ativo |
| `.btn-tinder-close` | fechar drawer |

### 6.4 Botões discovery glass

| Classe | Visual |
|--------|--------|
| `.btn-search` | gradiente indigo, radius 12px, dentro do input wrap |
| `.btn-search-close` | 32×32 circle, hover vermelho |
| `.btn-style-edit` | ghost glass, radius 999px |
| `.empty-state-cta` | gradiente indigo pill, 15px weight 700 |
| `.btn-qr` | verde translúcido, border verde |

### 6.5 Botões splash (`index.html` inline)

| Classe | Spec |
|--------|------|
| `.home-splash-btn` | width 100%, padding 16×24, radius **16px**, font 17px weight 700 |
| `.home-splash-btn--primary` | gradiente `#6366f1 → #7c3aed`, sombra roxa |
| `.home-splash-btn--secondary` | `rgba(255,255,255,0.06)`, border `rgba(255,255,255,0.12)` |

### 6.6 Regra de hierarquia de botões

Por tela/contexto:
1. **Um** botão com gradiente sólido = ação principal
2. Ghost/outline = secundário
3. Text link (`.home-splash-link`, skip) = terciário
4. Nunca 2 gradientes competindo na mesma viewport

---

## 7. CARDS — TODOS OS TIPOS

### 7.1 Card base sólido (`style.css`)

```css
.card {
  background: var(--bg-card);       /* #ffffff */
  border-radius: var(--radius-2xl); /* 20px */
  padding: var(--card-padding);     /* 25px */
  box-shadow: var(--shadow-lg), var(--shadow-inset);
}
```

**Modo edição:** `.edit-mode .card` → border primary + ring `rgba(99,102,241,0.06)`

### 7.2 Glass discovery shell

```css
.glass-discovery-shell {
  padding: var(--space-card);
  border-radius: var(--glass-radius-lg);
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  box-shadow: var(--glass-shadow), inset 0 1px 0 var(--glass-stroke);
}
```

Contém: tabs segmentadas + zona de busca + pills + sort.

### 7.3 Card Tinder (resultado busca)

| Elemento | Spec |
|----------|------|
| `.tinder-card` | radius 22px (glass: 28px), overflow hidden |
| `.tinder-card-photo` | height **280px**, gradient fallback |
| `.tinder-card-gradient` | overlay preto 82% no bottom |
| `.tinder-card-overlay-info .name` | 24px weight 800 branco |
| `.tinder-card-match-orb-wrap` | 56×56 circle, blur backdrop |
| `.tinder-card.est` | border-top 3px `#0ea5e9` (legado) / sem border (glass) |
| `.card-high-match` | sombra âmbar `rgba(245,158,11,0.22)` |
| `.tinder-fav-btn` | 44×44 circle branco |
| Hover | `translateY(-6px a -8px)` + sombra indigo |

**Glass override:** fundo `rgba(255,255,255,0.05)`, sem border, sombra glass.

### 7.4 Card dashboard

```css
.dashboard-container .card {
  padding: 32px 40px;
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
  max-width: 820px;
}
```

### 7.5 Review cards

| Classe | Border-left |
|--------|-------------|
| `.glass-review-card.review-card-cliente` | 4px `#6366f1` |
| `.glass-review-card.review-card-estab` | 4px `#8b5cf6` |
| `.glass-review-card.review-card-prof` | 4px `#f59e0b` |

### 7.6 Widget embed (`.pw-widget`)

Card branco, barra gradiente top 3px, para sites externos.

### 7.7 Score blocks (dashboard)

| Bloco | Visual |
|-------|--------|
| `.profile-rating-block` | fundo âmbar claro, border `#fde68a` |
| `.proofly-score-block` | fundo indigo claro, ring SVG |
| Tiers IGV | elite=verde, strong=indigo, solid=âmbar, forming=slate |

---

## 8. TABS SEGMENTADAS

```html
<nav class="cliente-tabs glass-tabs" role="tablist">
  <button class="cliente-tab active" role="tab" aria-selected="true">...</button>
  <button class="cliente-tab" role="tab" aria-selected="false">...</button>
</nav>
```

**Glass (`proofly-glass.css`):**
- Container: `rgba(0,0,0,0.22)`, radius 16px, padding 5px, inset stroke
- Tab inativa: `--text-glass-secondary`, radius 12px
- Tab ativa: `rgba(255,255,255,0.92)`, texto `#1a1a2e`, weight 600, sombra

**Legado (`style.css`):** container `#1e3a5f`.

---

## 9. INPUTS & FORMULÁRIOS

### Glass discovery

```css
.glass-discovery-shell .search-input-wrap {
  background: rgba(0,0,0,0.18);
  border-radius: 16px;
  padding: 6px 6px 6px 16px;
  box-shadow: inset 0 1px 0 var(--glass-stroke-inner);
}
/* focus-within: ring indigo 4px */
```

### Formulários sólidos (`style.css`)

```css
input, select, textarea {
  padding: 12px 16px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  background: var(--bg-input);
}
/* focus: border #6366f1 + ring rgba(99,102,241,0.15) */
```

**Modo edição dashboard:** `.view-mode` / `.edit-mode-field` toggle via classe `.edit-mode` no container.

---

## 10. MENU FLUTUANTE (DOCK)

**Arquivo:** `menu.js` + `flow-registry.js`

| Spec | Valor |
|------|-------|
| Posição | `fixed bottom calc(20px + env(safe-area-inset-bottom))` |
| Centralizado | `left 50% transform translateX(-50%)` |
| z-index | `--z-floating-menu` (999) |
| Hubs sem Voltar | index, cliente, dashboards, marketplace |

Body padding-bottom: `calc(80px + env(safe-area-inset-bottom))` para não sobrepor conteúdo.

---

## 11. COMPONENTES JS — USAR, NÃO REIMPLEMENTAR

| Componente | Arquivo | Função |
|------------|---------|--------|
| Confirm modal | `confirm-modal.js` | `showConfirm()`, `showAlert()` |
| Profile card | `components/profile-card.js` | `renderTinderCard()`, `renderDrawer()` |
| Tags | `utils.js` | `TAG_MAP`, `renderTagWithEmoji()` |
| Stars | `utils.js` | `renderStars()` |
| Match | `utils.js` | `calcularMatchPercent()` |
| IGV | `talent-market.js` | `renderIGVRing()`, `calcularIGVScore()` |
| Reviews | `reviews-service.js` | `submitReview()`, `fetchReviewsForTarget()` |
| Hiring | `hiring-service.js` | propostas contratação |
| Loader | `loader.js` | ordem de scripts — **não quebrar** |

---

## 12. ÍCONES & ASSETS

- **Logo:** 🏆 Ranking Pro
- **Personas:** 👤 Cliente | 💼 Profissional | 🏢 Estabelecimento
- **Ações:** ❤️ 🤍 ⭐ 📷 🔐 ✕
- **Proibido:** icon fonts externos (Font Awesome, etc.)
- **Permitido:** emoji nativos + SVG inline mínimo
- **Avatares demo:** `seed-images.js` → randomuser.me / picsum
- **Fallback avatar:** inicial do nome em gradiente indigo

---

## 13. ACESSIBILIDADE MÍNIMA

- `role="tablist"` / `role="tab"` / `aria-selected` em tabs
- `role="button"` + `tabindex="0"` em elementos clicáveis não-button
- `aria-hidden="true"` em decorativos (emoji logo splash)
- Focus visível em modais (confirm foca botão em 50ms)
- `prefers-reduced-motion` já tratado — não adicionar animações pesadas

---

## 14. ANTI-PATTERNS — NUNCA FAZER

1. `window.confirm()` / `alert()` nativos
2. Cores hardcoded fora dos tokens (exceto rgba calculados de tokens)
3. Glass em dashboard de edição
4. Cards brancos no discovery sem contexto
5. Múltiplos CTAs gradiente na mesma tela
6. Formulários longos sem seções (`.section-block`)
7. Dashboard estilo LinkedIn / tabelas densas
8. Fetch direto sem `fetchAPI()` do `api.js`
9. Assumir role do banco como perfil ativo (usar `getSession()` + `activeProfile`)
10. Novo framework CSS (Tailwind, Bootstrap)
11. Drawer lateral em mobile para perfil (usar bottom sheet)
12. Ignorar safe-area iOS
13. Scripts globais fora do `loader.js`
14. Tags sem `TAG_MAP` / emoji inconsistente

---

## 15. CHECKLIST ANTES DE ENTREGAR UI

- [ ] CSS na ordem correta (glass por último)
- [ ] Contexto glass vs sólido respeitado
- [ ] 1 CTA principal identificável
- [ ] Modais usam `showConfirm` / padrão sheet existente
- [ ] Pills usam classes `.pill` / `.btn-ios-pill` — não inventar
- [ ] Botões usam classes existentes da matriz
- [ ] Cards Tinder com foto 280px + gradient overlay
- [ ] Safe-area no dock e bottom sheets
- [ ] Mobile 375px testado — drawer actions em coluna
- [ ] Tokens CSS — zero hex solto desnecessário
- [ ] `prefers-reduced-motion` intacto
- [ ] Script novo registrado em `loader.js` se global
- [ ] Dock atualizado em `flow-registry.js` se nova hub page

---

## 16. PROMPT CURTO (COLAR EM TAREFAS RÁPIDAS)

```
Implemente [TELA/FEATURE] no Ranking Pro (PROOFLY) seguindo o design system:
- Stack: HTML + JS vanilla + CSS existente (base.css → style.css → [tinder/dashboard] → proofly-glass.css por último)
- Discovery = glass dark (#08080f, blur 28px, radius 22-28px). Dashboard = cards brancos sólidos.
- Modais: showConfirm/showAlert (confirm-modal.js). Sheets: bottom com cubic-bezier(0.32,0.72,0,1).
- Pills: radius 999px. Glass = rgba(255,255,255,0.07) inativo, gradiente indigo ativo.
- Botões: 1 CTA gradiente por tela. Demais = ghost/outline pill.
- Cards Tinder: foto 280px, overlay gradient, match orb, hover translateY(-8px).
- Cores: primary #6366f1, match hot #f59e0b, estab #0ea5e9.
- Safe-area iOS, mobile-first 375px, prefers-reduced-motion.
- Não usar window.confirm, Tailwind, nem inventar componentes novos sem checar ASSETSPROMPT e DESIGN-PROMPT-DESENVOLVEDOR.md.
```

---

*Referências complementares: `ASSETSPROMPT` (JS + páginas), `apendice.html` (catálogo rotas), `proofly-glass.css` (glass), `components/tinder-profile.css` (cards/drawer).*