# Relatório de Auditoria — Ranking Pro

**Data:** 24/06/2026  
**Escopo:** Fluxo estabelecimento, profissional, marketplace, naming e UX

---

## Mapa de rotas (atualizado)

| Papel | Home após login | Ação principal | Destino |
|-------|-----------------|----------------|---------|
| 🏢 Estabelecimento | `dashboard-estabelecimento.html` | Encontrar profissionais | `estabelecimento-marketplace.html` |
| 💼 Profissional | `dashboard-profissional.html` | Editar / oportunidades | próprio dashboard |
| 👤 Cliente | `cliente.html` | Buscar e avaliar | discovery |

**Renomeado:** `contratar.html` → `estabelecimento-marketplace.html` (papel + função)

**Perfil unificado:** `perfil-page.html?id=XXX&type=professional|establishment` (+ `tipo` legado)

---

## Bugs (corrigidos nesta entrega)

| # | Bug | Correção |
|---|-----|----------|
| B1 | Estabelecimento caía direto no marketplace | `getProfileHomeUrl` → dashboard primeiro |
| B2 | Nome `contratar.html` confundia o papel | Renomeado para `estabelecimento-marketplace.html` |
| B3 | "Trocar perfil" com papel único | Só aparece com `countLinkedProfileRoles > 1` → "Alternar perfil" |
| B4 | Editar perfil rolava para o meio | `scrollIntoView` em `#formInicio` |
| B5 | "Ver local" sem navegação | `profilePageUrl('estabelecimento', id)` padronizado |
| B6 | Menu dock muito opaco/sólido | Fundo `rgba(22,22,34,0.6)` conforme spec |

---

## Bugs (pendentes / monitorar)

| # | Item | Severidade |
|---|------|------------|
| P1 | `profissional.html` / `estabelecimento.html` ainda existem como rotas legadas | Média |
| P2 | Dashboard estabelecimento ainda mistura edição + RH (muito longo) | Média |
| P3 | Cards modo grade/cards no marketplace ainda densos | Baixa |
| P4 | Accordion em reputação/experiência no perfil — não implementado | Baixa |

---

## UX Issues

| # | Problema | Status |
|---|----------|--------|
| U1 | Hero marketplace genérico | ✅ Novo copy focado em resultado |
| U2 | Filtros técnicos (minIGV60) | ✅ Labels humanas |
| U3 | Match secundário no card | ✅ Match protagonista com cor progressiva |
| U4 | Dashboard estabelecimento fraco | ✅ Bloco "Seu negócio hoje" + CTA |
| U5 | Papéis misturados na UI | 🟡 Parcial — naming e rotas; falta polish visual por papel |
| U6 | Páginas soltas sem sensação de app | 🟡 Header + dock consistentes; transições ainda mínimas |

---

## Melhorias sugeridas

1. Renomear `dashboard-profissional.html` → `profissional-dashboard.html` (consistência)
2. Separar edição do estabelecimento em aba/modal — dashboard só decisão
3. CTA contextual no `perfil-page`: "Propor contratação" vs "Editar perfil"
4. Accordion em blocos longos (reputação, experiência)
5. Redirect 301 de `contratar.html` se houver deploy antigo em cache

---

## Pontos fortes

- Marketplace com match, IGV e carteira para decisão de contratação
- Multi-perfil com seletor pós-login
- Dock iOS compacto e menu DEV lateral separado
- Fluxo estabelecimento agora: **dashboard → marketplace** (lógica de produto)

---

## Observações gerais

O produto passa a comunicar melhor **quem contrata** (estabelecimento) vs **quem busca** (cliente) vs **quem se vende** (profissional). A decisão de contratação é o eixo do marketplace; o dashboard do estabelecimento volta a ser o ponto de contexto antes da busca.

**Sem prints nesta entrega** (solicitação anterior de parar capturas automáticas).