# Relatório UX — Ranking Pro (Home QR)

**Data:** 24/06/2026  
**Escopo:** Entrada pública (`index.html`), fluxo de avaliação verificada por QR  
**Referência visual:** `ver bug/comparativo-home-antes.png` vs `ver bug/comparativo-home-depois.png`

---

## Fluxo principal está claro?

### Antes
**Não.** A home antiga era uma landing genérica de produto: hero longo (“plataforma de reputação”), seção “Como funciona” com 4 cards, “Por que Ranking Pro?” com 4 highlights e CTA duplicado de login. O visitante que escaneava um QR ou chegava pelo link do profissional **não tinha orientação imediata** — o QR apontava direto para `cliente.html`, uma tela de discovery com onboarding de estilo, tabs e filtros.

### Depois
**Sim.** A nova home comunica em uma tela:

1. **Escaneie** o QR do profissional  
2. **Avalie** no perfil  
3. Receba selo **Verificado**

CTA principal único: **“Escanear QR Code”**. Links secundários ficam abaixo (buscar profissionais / área profissional).

```
QR físico → index.html?professionalId&token
         → redirect automático → cliente.html (perfil + formulário de avaliação)
         → login (se necessário) → avaliação com qr_token → selo verificado
```

---

## Onde trava o usuário?

| Ponto de atrito | Antes | Depois | Status |
|-----------------|-------|--------|--------|
| **Primeira impressão** | Muita leitura antes de qualquer ação | Uma frase + botão de scan | ✅ Resolvido |
| **QR → avaliação** | Caía no discovery; usuário tinha que achar o botão “Avaliar” no drawer | Redirect + abertura automática do formulário de avaliação (sessão QR) | ✅ Resolvido |
| **Login obrigatório** | `returnTo` perdia o `token` — risco de avaliação não verificada | `returnTo` preserva `token` | ✅ Resolvido |
| **Dock no mobile** | Menu flutuante com Buscar/Favoritos/Entrar na home deslogada | Dock oculto na home para visitantes | ✅ Resolvido |
| **Onboarding de estilo** | Podia abrir modal de preferências mesmo vindo do QR | QR com `professionalId` pula onboarding (`hasDrawer`) | ✅ Já existia |
| **Câmera negada** | Erro genérico no scanner | Mensagem explícita no modal | 🟡 Parcial |
| **Conta Google** | Avaliar exige login — barreira para cliente casual pós-atendimento | Ainda exige login; fluxo mais curto, mas não elimina o passo | 🟡 Monitorar |

---

## Elementos desnecessários

### Removidos da home
- Seção **“Como funciona”** (4 cards: Busque, Analise, Avalie, Contrate)
- Seção **“Por que Ranking Pro?”** (4 highlights: IGV, match, histórico, etc.)
- **CTA duplicado** “Pronto para transformar sua reputação?”
- **Animações fade-in** em cascata (7 delays)
- **Dock flutuante** para visitantes não autenticados

### Mantidos (propositalmente)
- Link **“Buscar profissionais e lugares”** → `cliente.html` (discovery para quem não veio por QR)
- Link **“Sou profissional ou estabelecimento”** → `login.html`
- Footer mínimo com copyright

### Ainda presentes em outras telas (fora do escopo desta entrega)
- Onboarding de estilo no `cliente.html` (sem QR)
- Dashboard profissional longo (edição + QR na mesma página)

---

## Melhorias aplicadas

| # | Melhoria | Arquivo(s) |
|---|----------|------------|
| M1 | Home minimalista focada em QR com 3 passos visuais | `index.html` |
| M2 | Redirect automático `index` → `cliente` com params (`professionalId`, `token`) | `index-qr.js` |
| M3 | Scanner QR na home (html5-qrcode) + normalização de URL | `index-qr.js` |
| M4 | QR gerado pelo profissional aponta para `index.html` (entrada unificada) | `dashboard-profissional.html` |
| M5 | Sessão QR: formulário de avaliação abre automaticamente no drawer | `cliente.js` |
| M6 | `returnTo` do login preserva `token` para avaliação verificada | `cliente.js` |
| M7 | Dock oculto na home para visitantes (layout limpo) | `menu.js` |

---

## Antes vs Depois

### Home pública (`index.html`)

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Objetivo** | Apresentar o produto | Conduzir avaliação por QR |
| **Hierarquia** | Título + 2 seções + CTA box | Badge verificado + título + 1 CTA |
| **Scroll** | ~3 telas de conteúdo | 1 tela, sem scroll em mobile |
| **CTA primário** | “Entrar” (login) | “Escanear QR Code” |
| **CTA secundário** | — | Buscar / Entrar profissional |
| **Menu flutuante** | Visível (Início, Buscar, Favoritos, Entrar) | Oculto para visitantes |

### Fluxo QR (profissional → cliente)

| Etapa | Antes | Depois |
|-------|-------|--------|
| URL no QR | `cliente.html?professionalId&token` | `index.html?professionalId&token` |
| Entrada | Discovery completo | Redirect → perfil + avaliação |
| Formulário | Manual (“Avaliar” no drawer) | Auto-abre em sessão QR |
| Pós-login | Token podia se perder | Token no `returnTo` |
| Selo verificado | Depende de `proofly_qr_review` + token | Mesma lógica, caminho mais confiável |

### Prints comparativos

| | Arquivo |
|---|---------|
| **Antes** | `ver bug/comparativo-home-antes.png` (cópia de `ver bug/mobile/mobile-index.png`) |
| **Depois** | `ver bug/comparativo-home-depois.png` |

---

## Recomendações futuras

1. **Avaliação sem conta** — OTP por SMS/e-mail no fluxo QR para reduzir abandono pós-atendimento  
2. **Página intermediária** — “Você está avaliando [Nome]” antes do login, com preview do profissional  
3. **Deep link universal** — `ranking.pro/avaliar/:id` em vez de query string longa  
4. **Feedback pós-envio** — tela de confirmação com selo “Avaliação verificada enviada”

---

## Conclusão

A home deixou de ser vitrine genérica e passou a ser **porta de entrada do fluxo mais importante do produto**: avaliação verificada via QR. O caminho crítico ficou **escaneie → perfil → avalie → verificado**, com menos ruído visual e menos decisões antes da ação principal.