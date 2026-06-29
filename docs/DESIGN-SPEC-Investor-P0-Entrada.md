# DESIGN SPEC — Investor Blueprint P0 · Porta de Entrada

**Versão:** 1.0 · **Data:** 27/06/2026  
**Autor:** Designer UX/UI (delegação Supervisor)  
**Para:** Magrão · **Canônico produto:** `OFFICIAL-BLUEPRINT-v1.md`  
**Design system:** `developer-design-system.txt` · `base.css` · `style.css` · `proofly-glass.css`

---

## 0. Princípios (não negociar)

| Regra | Aplicação P0 |
|-------|----------------|
| 1 CTA principal por tela | Hierarquia visual clara — secundários menores ou outline |
| DNA Apple | Menos ruído · grid 8/12/16/24/28/32 · peso tipográfico > tamanho sozinho |
| QR = confiança | Copy consistente “verificada” / “no atendimento” |
| Não inventar | Reusar classes existentes — sem logo redesign, sem carrossel vibes |
| Modais | `confirm-modal.js` — nunca `alert()` / `confirm()` nativo |

---

## 1. Tokens CSS (referência Magrão)

### Cores e gradientes (`base.css`)

| Token | Valor | Uso P0 |
|-------|-------|--------|
| `--color-primary` | `#6366f1` | Links, bordas ativas |
| `--gradient-primary` | `135deg #6366f1 → #8b5cf6` | CTA primário sólido |
| `--color-primary-dark` | `#4f46e5` | Hover primário |
| Fundo app dark | `#08080f` | `theme-color`, body glass pages |
| Texto glass secundário | `#94a3b8` | Tagline, links terciários |
| Texto glass primário | `#f8fafc` | Títulos em glass |
| Texto card branco | `#0f172a` | Títulos login |
| Texto muted card | `#64748b` | Subtítulos login |
| Erro inline | `#dc2626` ou `--color-danger` se existir | Abaixo do campo |

### Glass (`proofly-glass.css`)

| Classe / token | Uso P0 |
|----------------|--------|
| `.glass-surface` | Card central `selecionar-perfil` |
| `.profile-select-*` | Grid, cards, badges, hint |
| `.qr-modal` / `.open` | Scanner QR na index |
| `.qr-status` | Feedback scanner |

### Botões index (inline hoje — extrair ou manter)

| Classe | Estilo |
|--------|--------|
| `.home-splash-btn--primary` | `padding: 16px 24px` · `border-radius: 16px` · `font-size: 17px` · `font-weight: 700` · gradiente indigo |
| `.home-splash-btn--secondary` | `rgba(255,255,255,0.06)` + borda `rgba(255,255,255,0.12)` |

### Meta tags (todas as 4 telas)

```html
<meta name="theme-color" content="#08080f" />
<meta name="color-scheme" content="dark" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

### Ordem CSS

| Tela | Ordem |
|------|-------|
| `index.html` | `base.css` → `style.css` → `proofly-glass.css` |
| `login.html` | `base.css` → `style.css` (sem proofly-glass no body) |
| `selecionar-perfil.html` | `base.css` → `style.css` → `proofly-glass.css` |

---

## 2. Micro-copy oficial (QR e confiança)

Usar **exatamente** estes textos no P0:

| Contexto | Copy |
|----------|------|
| Tagline index | `Reputação verificada por QR — avaliações reais de quem foi atendido.` |
| Footnote index | `Sem conta? Escaneie o QR do profissional após o atendimento.` |
| Modal QR título | `Escanear QR Code` |
| Scanner ativo | `Aponte para o QR do atendimento` |
| Scanner loading | `Iniciando câmera...` |
| Scanner sucesso leitura | `QR lido. Redirecionando...` |
| Scanner erro câmera | `Não foi possível acessar a câmera. Verifique as permissões do navegador.` |
| Avaliação sucesso (pós-envio) | `Sua avaliação foi registrada` |
| Token inválido/expirado | `QR expirado ou já usado — peça um novo ao profissional` |
| Selo (futuro drawer) | `Avaliação verificada` + ícone ✓ |

**Tom:** direto, transparente, sem marketing vazio.

---

## 3. Tela 1 — `index.html` (landing visitante)

### Objetivo

Visitante entende em **3 segundos** e age em **1 toque**.

### Hierarquia (topo → base)

```
1. Logo emoji 🏆 (52px) — decorativo, aria-hidden
2. H1 "Ranking Pro" — clamp(30px, 6vw, 36px) · weight 800 · #f8fafc
3. Tagline — 16px · #94a3b8 · margin-bottom 28px
4. CTA PRIMÁRIO — Entrar
5. CTA SECUNDÁRIO — Escanear QR para avaliar
6. CTA TERCIÁRIO — Buscar profissionais (link texto, NÃO botão full-width)
7. Footnote — 14px · #64748b
8. Footer © — 12px · #475569
```

### CTAs — copy e comportamento

| Ordem | Label | Elemento | Classe | Destino |
|-------|-------|----------|--------|---------|
| **1** | `Entrar` | `<a>` ou `<button>` | `home-splash-btn--primary` | `./login.html` |
| **2** | `Escanear QR para avaliar` | `<button>` | `home-splash-btn--secondary` | abre `#qrScannerContainer` |
| **3** | `Buscar profissionais →` | `<a>` texto | `home-splash-link` | `./cliente.html` |

### Ajustes obrigatórios vs repo atual

| Item | Estado atual | Ação Magrão |
|------|--------------|-------------|
| Hierarquia CTA | Entrar primário ✓ · Buscar é **botão** secundário | **Mover Buscar** para link terciário (`home-splash-link`) — remover 3º botão full-width |
| Divider "ou continue sem conta" | Removido no shark | Manter removido — usar footnote |
| Dock visitante | Ausente ✓ | Manter ausente |
| `?token=` redirect | `index-qr.js` → `./qr/?token=` ✓ | Manter |

### Layout

| Propriedade | Valor |
|-------------|-------|
| Container | `max-width: 420px` · centralizado |
| Padding main | `48px 20px 32px` |
| Gap ações | `12px` |
| Fundo body | gradiente radial indigo + `#08080f` (manter inline ou tokenizar) |

### Modal QR — estados

| Estado | `#qrScannerStatus` | UI |
|--------|-------------------|-----|
| Loading | `Iniciando câmera...` | Modal aberto, reader vazio |
| Ativo | `Aponte para o QR do atendimento` | Viewfinder 250×250 |
| Lido | `QR lido. Redirecionando...` | Fechar modal → redirect |
| Erro permissão | Copy §2 erro câmera | Texto vermelho `#f87171` na `.qr-status` |
| Fechar | — | Backdrop click ou ✕ · restaurar `overflow` body |

**Não adicionar:** match %, carrossel vibes, dock.

### Audit `index.html`

| Critério | Status |
|----------|--------|
| 1 CTA principal claro (Entrar) | OK |
| Buscar não compete visualmente | **AJUSTAR** — virar link |
| Hierarquia tipográfica | OK |
| Espaçamento grid 8px | OK |
| Estados QR loading/erro | **AJUSTAR** copy scanner ativo |
| Mobile 375px | OK |
| theme-color #08080f | OK |
| Sem vibes/match P0 | OK |

---

## 4. Tela 2 — `login.html`

### Objetivo

Fricção mínima — demo óbvio, não parecer produto quebrado.

### Hierarquia

```
1. H1 — "Entrar no Ranking Pro"
2. Sub — "Use sua conta para acessar o painel"
3. CTA PRIMÁRIO — Google (fake MVP)
4. Divisor — "ou"
5. Email + senha + botão "Continuar"
6. Link — "← Voltar para o início"
7. Info-box demo
```

### CTAs

| Papel | Elemento | Estilo |
|-------|----------|--------|
| **Primário** | `btn-google` | pill `border-radius: 50px` · borda `#e2e8f0` · hover borda `#6366f1` |
| Secundário | submit email | `.btn` full width · pill · gradiente padrão `base.css` |

**Copy Google:** `Entrar com Google` (remover sufixo pessoal “Leandro Rocha” na UI pública — pode ficar só no demo interno se necessário)

**Copy info-box:**
```
Modo demonstração — use leandro@proofly.com ou qualquer email.
O sistema não valida senha nesta versão.
```

### Superfície

| Zona | Tratamento |
|------|------------|
| `body` | Fundo neutro escuro ou `#f1f5f9` leve — **card branco** é foco |
| `.card` | Branco sólido · `padding: 32px 28px` · `border-radius` do `style.css` |
| Inputs | `border: 2px solid #e2e8f0` · `border-radius: 10px` · `padding: 12px` |

### Estados

| Estado | Comportamento visual |
|--------|---------------------|
| Loading login | Botão Google + Continuar `opacity: 0.6` · `pointer-events: none` · texto "Entrando..." |
| Erro API | `#userMessage` ou inline abaixo email · cor `#dc2626` · 14px |
| Sessão existente | Redirect silencioso — sem flash de formulário |

### Ajustes vs repo atual

| Item | Atual | Ação |
|------|-------|------|
| Título | `🔐 Acessar` | → `Entrar no Ranking Pro` |
| Sub | `Entre para acessar sua conta` | → copy §4 |
| Info-box | genérico | → copy demo com email explícito |
| Erro | `#userMessage` hidden | Documentar uso em falha de rede |

### Audit `login.html`

| Critério | Status |
|----------|--------|
| 1 CTA dominante (Google) | OK |
| Cards brancos (não full glass) | OK |
| Erro inline | **FALTA** — implementar em falha API |
| Mobile 375px | OK |
| Link voltar index | OK |
| confirm-modal se necessário | N/A no login |

---

## 5. Tela 3 — `selecionar-perfil.html`

### Objetivo

Usuário multi-role escolhe persona sem confusão.

### Hierarquia

```
1. Eyebrow — "🏆 Ranking Pro" (.profile-select-eyebrow)
2. Título dinâmico — ver tabela abaixo
3. Sub dinâmico
4. Grid de cards — 1 col mobile / 3 col desktop (min-width 720px)
5. (Futuro) link "Sair" — fora P0
```

### Títulos dinâmicos (já no JS — manter)

| Condição | Título | Sub |
|----------|--------|-----|
| `forceProfileSelect` | Trocar de área | Olá, {nome} — escolha onde entrar |
| hint na URL | Entrar como {label} | Sugerimos a área que você escolheu... |
| multi vínculo | Onde você quer entrar? | Mais de uma área vinculada... |
| 1 vínculo | Bem-vindo de volta | Confirme como deseja entrar |
| 0 vínculo | Quem é você? | Ainda não identificamos seu perfil... |

### Cards — estrutura (`.profile-select-card-btn`)

```
[ ícone 40px ] [ strong título · small subtítulo · badge? ] [ chevron › ]
```

### Copy por tipo (genérico — sem vínculo)

| Tipo | Título | Subtítulo (spec) |
|------|--------|------------------|
| Cliente | Cliente | Buscar profissionais e avaliar com QR |
| Profissional | Profissional | Minha reputação e avaliações |
| Estabelecimento | Estabelecimento | Ver equipe e contratar por reputação |

> Atualizar `PROFILE_TYPES.*.subtitle` no JS para alinhar — Magrão.

### Estados visuais

| Estado | Classe | Visual |
|--------|--------|--------|
| Default | `.profile-select-card-btn` | Borda glass · fundo translúcido |
| Hover | `:hover` | `translateY(-2px)` · borda mais clara |
| Hint/sugerido | `.is-hint` | Borda `rgba(99,102,241,0.55)` + tag "Sugerido" |
| Linked | `.is-linked` | Badge role color |
| Owner estab | `.is-owner` | Badge owner |
| Selecionando | `.is-selecting` | Opacity 0.7 · spinner opcional |

### Layout grid

```css
.profile-select-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr;
}
@media (min-width: 720px) {
  .profile-select-grid { grid-template-columns: repeat(3, 1fr); }
}
```

### Superfície

- `body.profile-select-page` — fundo dark gradiente (`proofly-glass.css`)
- Card shell `.profile-select-card.glass-surface` — **elevated glass** (aceito P0; login permanece branco)

### Audit `selecionar-perfil.html`

| Critério | Status |
|----------|--------|
| 1 ação por card (clique único) | OK |
| Hint visual | OK |
| 3 personas | OK |
| Subtitles alinhados Investor | **AJUSTAR** copy §5 |
| Mobile 1 col | OK |
| Sem ilustrações novas | OK |

---

## 6. Pós-login — padrão modo ativo (spec only · Magrão fila §6)

Não implementar header complexo no P0. Documentar para dashboards e `cliente.html`:

### Pill modo (topo da home)

```html
<div class="mode-pill mode-pill--client" role="status">
  <span class="mode-pill__label">Modo Cliente</span>
  <a href="./selecionar-perfil.html?forceProfileSelect=1" class="mode-pill__switch">Trocar perfil</a>
</div>
```

### Cores pill (tokens existentes)

| Modo | Fundo pill | Texto |
|------|------------|-------|
| Cliente | `rgba(99,102,241,0.15)` | `#a5b4fc` |
| Profissional | `rgba(16,185,129,0.15)` | `#6ee7b7` |
| Estabelecimento | `rgba(14,165,233,0.15)` | `#7dd3fc` |

### CSS sugerido (novo mínimo — `style.css` ou `proofly-glass.css`)

```css
.mode-pill {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 16px;
}
.mode-pill__switch {
  font-size: 12px;
  font-weight: 500;
  opacity: 0.85;
  text-decoration: none;
}
```

---

## 7. Fluxo completo (wire ASCII)

```
VISITANTE
  index ──Entrar──► login ──► selecionar-perfil ──► home persona
    │                                              ├─ cliente.html
    ├──Escanear QR──► modal ──► /qr/ ──► /avaliar/  ├─ dashboard-profissional.html
    └──Buscar (link)──► cliente.html                 └─ dashboard-estabelecimento.html
```

---

## 8. Checklist handoff Magrão (implementação visual P0)

### index.html
- [ ] Buscar profissionais → link terciário (não botão)
- [ ] Copy tagline + footnote §2
- [ ] QR status copy §2 + cor erro
- [ ] Manter sem dock

### login.html
- [ ] Título/sub §4
- [ ] Info-box demo explícita
- [ ] Loading state nos botões
- [ ] Erro inline em falha API

### selecionar-perfil.html
- [ ] Atualizar subtitles `PROFILE_TYPES`
- [ ] Manter `.is-hint` para intent URL

### Global
- [ ] `theme-color` #08080f nas 3 telas
- [ ] Sem match % / vibes carrossel nas telas P0
- [ ] `confirm-modal.js` para erros bloqueantes pós-QR

---

## 9. Audit resumo P0

| Tela | 1 CTA | Hierarquia | Espaçamento | Estados | Mobile | WCAG glass | Sem vibes |
|------|-------|------------|-------------|---------|--------|------------|-----------|
| index | OK | OK | OK | AJUSTAR | OK | OK | OK |
| login | OK | AJUSTAR copy | OK | FALTA erro | OK | N/A | OK |
| selecionar | OK | OK | OK | OK | OK | OK | OK |
| pós-login spec | — | — | — | — | — | — | — |

---

## 10. Fora de escopo (confirmado)

v2/ do zero · carrossel vibes · match % · widget · redesign marca · drawer completo · onboarding longo · PWA

---

**Handoff:** Magrão implementa visual conforme este spec · lógica/rotas conforme `DELEGACAO-Investor-P0-Magrao-Entrada.txt`

— Designer UX/UI · 27/06/2026