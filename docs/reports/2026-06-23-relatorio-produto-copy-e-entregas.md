# Proofly — Copywriting + Relatório verbal do produto

**Data:** 23/06/2026  
**Uso:** pitch, supervisora, investidor, time interno  
**Formato:** copy primeiro → depois tudo que o sistema faz e entrega

---

# PARTE 1 — COPYWRITING

## Nome e posicionamento

**Proofly** — *A reputação que o mercado pode provar.*

Plataforma de reputação verificada para beleza, barbearia e serviços presenciais. Não é só “nota de 5 estrelas”. É histórico real, match por afinidade e métricas que o dono do negócio entende: quem traz cliente, quem retém, quem vale a contratação.

---

## Elevator pitch (30 segundos)

> O cliente encontra profissional e lugar que **combinam com o estilo dele** — não só os mais baratos.  
> O profissional constrói **reputação verificada** que não depende de auto-promoção.  
> O dono da barbearia **contrata com dados**: carteira real, IGV e perfil RH — não currículo inventado.  
> Tudo num ecossistema onde avaliação, vínculo e match conversam entre si.

---

## Taglines (escolher 1–2)

| # | Tagline |
|---|---------|
| A | **Reputação verificada. Match real. Contratação inteligente.** |
| B | **Não é quem diz que é bom. É quem o Proofly prova.** |
| C | **O cliente acha quem combina. O dono contrata quem gera caixa.** |
| D | **Mais que estrelas: carteira, histórico e afinidade.** |

---

## Hero (landing — sugestão)

**Título:** Encontre quem combina com você — e prove quem vale a pena.

**Subtítulo:** Avaliações autênticas, match por estilo e métricas de valor para quem contrata. Beleza e barbearia com reputação que dá para confiar.

**CTAs:**
- 👤 Buscar profissionais e lugares
- 💼 Sou profissional — construir minha reputação
- 🏢 Sou estabelecimento — contratar com dados

---

## Copy por persona

### 👤 Cliente final

**Dor:** “Não sei se esse barbeiro combina comigo — só vi foto bonita.”

**Promessa:** O Proofly personaliza busca pelo **seu estilo** (música, vibe, tipo de atendimento) e mostra **compatibilidade real** — não ranking genérico.

**O que entrega:**
- Busca por nome, especialidade e filtros de estilo
- % de match e tags em comum
- Perfil rico em drawer (fotos, avaliações, Proofly Score)
- Favoritos e recomendações “Top” personalizadas
- Avaliação pós-serviço (incl. QR verificado na demo)
- Scanner QR no app

**Frase de venda:** *“Pare de apostar no escuro. Veja quem combina com você antes de sentar na cadeira.”*

---

### 💼 Profissional

**Dor:** “Tenho talento, mas reputação online não reflete meu trabalho real.”

**Promessa:** Perfil profissional com **métricas calculadas pelo sistema** (carteira, IGV, avaliações) + bloco **“Informações para Contratantes”** que fala a língua do dono da barbearia.

**O que entrega:**
- Onboarding completo (identidade, bio, fotos, RH, vínculos)
- Dashboard: editar perfil, ver avaliações, métricas de mercado
- Seção contratantes: anos de profissão, carteira Proofly, permanência, idade, pretensão, estilo de trabalho, ritmo
- Proofly Score (reputação multi-fonte)
- Histórico de vínculos com estabelecimentos
- Disponibilidade e pretensão salarial visíveis a contratantes

**Frase de venda:** *“Sua reputação trabalha por você — com números que o dono do salão leva a sério.”*

---

### 🏢 Estabelecimento / contratante

**Dor:** “Contrato pelo feeling e me arrependo — ou perco talento que já provou resultado.”

**Promessa:** **Mercado de talentos** com filtro por IGV, estilo do estabelecimento e relatório PDF para decisão de RH.

**O que entrega:**
- Dashboard do estabelecimento (equipe, avaliações, config)
- Tela **Contratar**: busca, filtros, ranking de candidatos
- Relatório contratante (PDF/popup) com dados RH + métricas Proofly
- Widget de prova social para embed no site do salão
- Match estabelecimento ↔ profissional (tags de vibe, público, infra)

**Frase de venda:** *“Invista em quem já gera caixa — não em quem só fala bem de si.”*

---

## Diferenciais (bullets para pitch)

1. **Match por afinidade** — tags de estilo, não só geolocalização
2. **Métricas não auto-declaradas** — carteira e IGV calculados pelas avaliações
3. **Avaliação verificada** — conceito QR (cliente real no local)
4. **Bloco RH para contratantes** — linguagem do dono de barbearia, não do LinkedIn
5. **Proofly Score** — reputação consolidada (tier Elite / Forte / Sólido)
6. **Widget embed** — prova social no site do estabelecimento
7. **Visual premium** — interface glass/iOS na descoberta (demo polida)

---

## O que NÃO prometer (demo atual)

- Login Google real em produção
- App nativo iOS/Android
- Pagamento / agendamento integrado
- Multi-unidade enterprise
- Moderação humana de reviews em escala

*São roadmap — o produto hoje é **demo funcional** para validar narrativa e UX.*

---

# PARTE 2 — RELATÓRIO VERBAL: O QUE O SISTEMA FAZ E ENTREGA

## Visão em uma frase

O Proofly é um **ecossistema web demo** que conecta três atores — cliente, profissional e estabelecimento — através de **busca inteligente**, **reputação verificável** e **ferramentas de contratação**, com backend Supabase e frontend HTML/JS.

---

## O produto em camadas

### Camada 1 — Descoberta (cliente)

O cliente entra, define (ou herda) preferências de estilo e usa a **área de busca** como produto principal.

**Entregas concretas:**
- Carrosséis “Top profissionais” e “Top estabelecimentos” ranqueados por reputação + match
- Busca com abas (profissionais / estabelecimentos)
- Filtros estilo “pílulas” (Tinder-like)
- Cards visuais com foto, nota, distância, Proofly Score, % match
- Drawer lateral ao clicar — perfil completo sem sair da busca
- Barra “Baseado no seu estilo” quando onboarding de preferências foi feito
- Modal de onboarding de estilo (até 5 tags prof + 3 est)
- Favoritos persistidos localmente
- Link para minhas avaliações (reviews do usuário no Supabase)
- Scanner QR para fluxo de avaliação verificada

**Valor de produto:** o cliente **não navega catálogo morto** — vê quem combina e por quê.

---

### Camada 2 — Reputação (profissional + sistema)

Cada profissional acumula sinais que alimentam score e exibição pública.

**Entregas concretas:**
- **Proofly Score** — gauge visual com tier (Elite, Forte, Sólido, Em formação)
- **Avaliações** — clientes e estabelecimentos podem review; tipos distintos
- **IGV (Índice de Geração de Valor)** — métrica de mercado de talentos
- **Carteira** — “X clientes únicos atendidos no Proofly” (calculado)
- **Histórico de vínculos** — onde trabalhou, estabelecimento atual
- **Galeria de fotos**, tags (música, visual, personalidade, trabalho…)
- **Badges** de reputação no card e no drawer

**Valor de produto:** reputação **composta e explicável**, não uma nota solta.

---

### Camada 3 — Contratação (estabelecimento)

O estabelecimento não só “vê perfil” — tem fluxo de **decisão de RH**.

**Entregas concretas:**
- Dashboard estabelecimento (visão do local, equipe, avaliações)
- **estabelecimento-marketplace.html** — lista profissionais ativos com filtros
- Seleção múltipla + **relatório PDF** para comparar candidatos
- **Informações para Contratantes** no drawer/dashboard do prof:
  - Anos de profissão
  - Carteira Proofly (frase contextual)
  - Permanência média em empregos
  - Idade (de birth_date)
  - Pretensão salarial
  - Estilo de trabalho (chips)
  - Ritmo (~clientes/ano)
- Match visual glassmorphism — seção de venda para o dono da barbearia

**Valor de produto:** o contratante **compra segurança na contratação**, não só currículo.

---

### Camada 4 — Identidade e cadastro

**Cliente:** cadastro completo (dados, endereço, avatar, tags) → `client_profiles` + vínculo `users.client_id`.

**Profissional:** onboarding em passos (identidade → bio → visual → contato → **RH** → endereço → vínculo/disponibilidade → finalização).

**Estabelecimento:** onboarding de local (dados, endereço, tags de posicionamento).

**Login demo:** qualquer credencial funciona; intents redirecionam por papel.

**Valor de produto:** jornadas separadas por ator, dados ricos no banco para match e demo multi-persona.

---

### Camada 5 — Prova social externa (widget)

**widget.html** + embed script — o estabelecimento cola código no site e exibe avaliações / score.

**Valor de produto:** reputação **sai do app** e vira ativo de marketing do salão.

---

### Camada 6 — Operação demo / DEV (não é produto final)

- **Control Center** — debug sessão, match, preview banco, troca de papel
- **Menu lateral DEV** — atalhos internos
- **Admin** — contagens e gestão demo
- **Apêndice** — catálogo de rotas
- **Base de dados completa** — mapa ER

**Valor:** acelera demo e testes; **esconder em pitch externo** (`PROOFLY_DEV_MENU = false`).

---

## Jornadas completas (storytelling)

### Jornada A — “Cliente exigente”
1. Login como cliente → escolhe persona com tags (ex.: Hip Hop, Premium)
2. Abre busca → vê match 78% no card do barbeiro
3. Abre drawer → Proofly Score Forte, avaliações, tags em comum
4. Favorita → avalia depois do corte (ou via QR na demo)
5. Review alimenta carteira do profissional no sistema

### Jornada B — “Profissional em ascensão”
1. Onboarding → preenche RH (permanência, pretensão, estilo)
2. Dashboard → vê seção “Informações para Contratantes” como o dono vê
3. Métricas IGV e carteira sobem conforme seed/avaliações

### Jornada C — “Dono de barbearia”
1. Login estabelecimento → dashboard
2. Abre Contratar → filtra por disponibilidade e IGV
3. Seleciona 3 candidatos → gera PDF
4. Decide contratação com dados RH + carteira Proofly

---

## O que o usuário “leva na mão” ao final

| Ator | Entrega percebida |
|------|-------------------|
| Cliente | Lista curada, match explicado, perfil confiável, favoritos |
| Profissional | Perfil vendável, métricas automáticas, visibilidade a contratantes |
| Estabelecimento | Pipeline de contratação, relatório, widget para site |
| Marca Proofly | Narrativa: verificado + match + ROI na contratação |

---

## Maturidade como produto

| Dimensão | Nota (1–5) | Comentário |
|----------|------------|------------|
| Narrativa / copy | 5 | Clara e diferenciada |
| UX descoberta (cliente) | 4 | Glass, drawer, match — polido |
| UX contratante (RH) | 4 | Seção estrela do pitch |
| UX profissional | 4 | Dashboard + onboarding |
| Confiabilidade dados | 3 | Depende de migrations + seed |
| Pronto para produção | 2 | Demo; auth e escala pendentes |
| Pronto para **pitch / validação** | 4–5 | Sim, com walkthrough ensaiado |

---

## Mensagem final para a supervisora

O Proofly **já entrega um produto demonstrável** com três histórias coerentes:

1. **Cliente** — acha quem combina  
2. **Profissional** — prova valor com métricas reais  
3. **Estabelecimento** — contrata com dados, não achismo  

O copy vende **confiança verificável + match + ROI na contratação**.  
O sistema entrega isso em telas funcionais, banco estruturado e visual premium na descoberta.

**Próxima decisão estratégica não é “o que construir” — é “para quem mostrar primeiro” e “o que esconder da demo DEV” antes do pitch.**

---

## Anexo — páginas principais do produto

| Página | Papel no produto |
|--------|------------------|
| `index.html` | Landing / conversão |
| `cliente.html` | **Core** — descoberta |
| `dashboard-profissional.html` | Painel prof |
| `dashboard-estabelecimento.html` | Painel local |
| `estabelecimento-marketplace.html` | Mercado de talentos |
| `onboarding-profissional.html` | Aquisição prof |
| `cadastro-cliente.html` | Aquisição cliente |
| `favoritos.html` | Retenção cliente |
| `widget.html` | B2B embed |
| `relatorio-contratante.html` | Saída PDF RH |
| `perfil-page.html` | Perfil público standalone |

---

*Fim do relatório. Atualizar quando houver novo módulo ou mudança de posicionamento.*