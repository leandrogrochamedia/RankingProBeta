# Sessão Supervisor — Log vivo

> **Última atualização:** 24/06/2026
> Supervisora: leia este arquivo primeiro, depois os reports datados em `docs/reports/`.

---

## Status geral do projeto (Ranking Pro 🏆)

| Área | Status |
|------|--------|
| Modelo cliente (`client_profiles` + `users.client_id`) | ✅ Código + migrations; rodar `020_RODE_NO_SUPABASE` no Supabase |
| Campos RH contratantes (`work_style_tags`) | ✅ Código; rodar `019_RODE_NO_SUPABASE` no Supabase |
| Navegação iOS + Control Center DEV | ✅ Commit `5d827c2` — menu lateral **restaurado completo** a pedido do Leandro |
| Reports para supervisora | ✅ Convenção ativa (este arquivo) |

---

## Decisões recentes

1. **Menu lateral** → só DEV (7 itens). Navegação produto = header + menu flutuante.
2. **dev-simulation.html** → Control Center (sessão, match, DB leve, troca de papel).
3. **Reports** → agente salva em `docs/reports/` + link no chat para Leandro repassar à supervisora.
4. **Rebrand** → produto renomeado para **Ranking Pro** 🏆 (`config.js`: `APP_NAME`, `APP_ICON`, `APP_SCORE_LABEL`). Nomes técnicos internos (`proofly-glass.css`, `ProoflyWidget`, etc.) mantidos.

---

## Pendências manuais (Leandro)

- [ ] Rodar `migrations/019_RODE_NO_SUPABASE.sql` no Supabase (se erro `work_style_tags`)
- [ ] Rodar `migrations/020_RODE_NO_SUPABASE.sql` (se ainda não rodou)
- [ ] Hard refresh no browser após migrations
- [ ] Revisar tela a tela: cliente, drawer contratantes, onboarding passo 5/7

---

## Reports por tema (links locais)

- **[2026-06-23-relatorio-produto-copy-e-entregas.md](./2026-06-23-relatorio-produto-copy-e-entregas.md)** ← copy + o que o produto entrega
- [2026-06-23-relatorio-superficial-sistema.md](./2026-06-23-relatorio-superficial-sistema.md) ← visão técnica para decisões
- [2026-06-23-delegacao-ios-status.md](./2026-06-23-delegacao-ios-status.md)
- [2026-06-23-navegacao-ios-control-center.md](./2026-06-23-navegacao-ios-control-center.md)
- [CONVENCAO-SUPERVISOR.md](./CONVENCAO-SUPERVISOR.md)

---

## Última mensagem / acordo (23/06/2026)

**Leandro:** Quer que tudo que o agente responde seja salvo em `docs/reports/` porque usa outra IA como supervisora.

**Agente:** Confirmado. Respostas substantivas → arquivo em `docs/reports/` + link no chat. Log acumulado em `sessao-supervisor.md`. Respostas triviais (ok/sim) só no chat.

---

## Q&A — Múltiplas personalidades (23/06/2026)

**Leandro:** Dá para definir Supervisor, Dev, Art Final e fazer conversarem entre si?

**Agente:** Sim, com ressalvas. Não existe “sala de chat” nativa com 3 IAs debatendo em tempo real no mesmo fio. O que funciona bem:

1. **Pipeline assíncrono (recomendado):** Art → escreve brief em `docs/reports/` → Dev implementa → Supervisor revisa o report/commit. É o que já estamos montando.
2. **Skills / regras por papel:** arquivos tipo `skills/supervisor/SKILL.md`, `skills/dev/SKILL.md` — você invoca o papel em chats separados ou com @skill.
3. **Subagentes (Cursor):** um agente orquestra; “reviewer” e “implementer” rodam em paralelo e devolvem texto — não conversam direto entre si, você ou o orquestrador junta.

**O que pode ferrar:** duas IAs editando os mesmos arquivos sem ordem; instruções conflitantes; três “chefes” sem hierarquia (Supervisor > Dev > Art em conflito de prioridade).

**Hierarquia sugerida:** Supervisor aprova escopo → Art define visual/UX → Dev executa → Supervisor valida via reports/git.

---

## Histórico resumido da sessão (antes do acordo reports)

1. Simplificação modelo cliente + seção contratantes — feito (`309ab7b`)
2. Seeds alinhados a `client_profiles` (`01c2be0`)
3. Fix migrations 019/020 com scripts `*_RODE_NO_SUPABASE.sql`
4. Erro `client_profiles` / `work_style_tags` — orientado rodar migrations
5. Explicação fluxo menu DEV → enxugamento aprovado
6. Delegação Master: iOS nav + Control Center + PROOFLY_DEBUG (`5d827c2`)
7. Convenção copy → reports em arquivo (`26e3870`)