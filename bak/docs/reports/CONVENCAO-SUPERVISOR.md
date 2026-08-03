# Convenção — Reports para IA Supervisora

**Acordado em:** 23/06/2026  
**Responsável:** Agente Grok (Cursor)  
**Leitor:** IA Supervisora (externa)

---

## Regra

Toda resposta **substantiva** do agente ao Leandro é salva em `docs/reports/` e o link é postado no chat (Cmd+click no VS Code).

A supervisora pode ler esta pasta para acompanhar decisões, delegações, status e pendências **sem depender do histórico do chat**.

---

## O que entra no report

| Sim | Não (só chat) |
|-----|----------------|
| Delegações concluídas / em andamento | "ok", "sim", "feito" isolado |
| Decisões de arquitetura | Confirmações de 1 linha |
| Migrations SQL | |
| Checklists de revisão | |
| Erros + causa + fix | |
| Resumos de commit / git | |
| Mudanças de fluxo / menu / UX | |
| Perguntas respondidas com contexto técnico | |

---

## Arquivos

| Arquivo | Uso |
|---------|-----|
| `sessao-supervisor.md` | **Log vivo** — atualizado a cada resposta substantiva (supervisora começa por aqui) |
| `YYYY-MM-DD-assunto.md` | Reports por tema/data (arquivo permanente) |
| `CONVENCAO-SUPERVISOR.md` | Este arquivo |

---

## Commits

Reports relevantes são commitados no `main` quando houver mudança de produto ou decisão importante.