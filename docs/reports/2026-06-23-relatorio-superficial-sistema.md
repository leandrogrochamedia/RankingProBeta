# Proofly — Relatório superficial do sistema

**Para:** Supervisora / decisão estratégica  
**Data:** 23/06/2026  
**Autor:** Agente Dev (via Leandro)  
**Repo:** https://github.com/leandrogrochamedia/Proofly  
**Branch:** `main`

---

## 1. O que é o Proofly (hoje)

Demo funcional de **reputação verificada** no segmento beleza/barbearia:

- **Cliente** busca profissionais e estabelecimentos com match por estilo/afinidade
- **Profissional** mantém perfil, reputação, métricas para contratantes (IGV, carteira)
- **Estabelecimento** contrata talento, vê relatórios RH, widget de prova social
- **Avaliações** ligadas a usuário real (demo + seed no Supabase)

Não é app store nem auth Google real — é **protótipo demo** com login simulado e dados seed.

---

## 2. Stack (resumo)

| Camada | Tecnologia |
|--------|------------|
| Frontend | HTML + CSS + JS vanilla (~32 páginas) |
| Backend | Supabase (Postgres + REST API + RLS) |
| Sessão | `sessionStorage` + espelho de FKs em `users` |
| Deploy | Estático (GitHub) + Supabase cloud |

Sem React/Vue, sem CI automatizado documentado, sem testes E2E automatizados.

---

## 3. Papéis e fluxos principais

```
Cliente:     login → selecionar persona (demo) → cliente.html (busca, drawer, favoritos, QR)
Profissional: login → selecionar prof → dashboard-profissional (perfil RH, avaliações)
Estabelecimento: login → selecionar local → dashboard-estabelecimento + estabelecimento-marketplace.html
DEV:         Control Center (dev-simulation.html) — troca papel, debug sessão/match
```

**Navegação produto:** header + menu flutuante (iOS/glass).  
**Menu lateral:** só ferramentas DEV (7 itens).

---

## 4. Modelo de dados (estado atual)

| Conceito | Implementação |
|----------|----------------|
| Login | `users` (email, role, provider) |
| Perfil cliente rico | `client_profiles` (1:1 via `users.client_id`) |
| Profissional | `professionals` + `professional_profiles` + dados privados |
| Estabelecimento | `establishments` |
| Avaliações | `reviews` (user_id, source, tipos) |
| Multi-perfil futuro | `user_profiles` — **DEPRECATED**, não usar |

**Decisão já aprovada:** simplificação cliente (`client_profiles` + `users.client_id`).

---

## 5. Features por maturidade

| Feature | Maturidade | Nota |
|---------|------------|------|
| Busca + match por tags | 🟢 Alta | Core do produto |
| Drawer perfil + Proofly Score | 🟢 Alta | Visual premium (glass) |
| Seção “Informações para Contratantes” | 🟢 Alta | Argumento de venda RH |
| Onboarding profissional (RH passo 5/7) | 🟢 Alta | Reorganizado recentemente |
| Mercado de talentos / IGV / carteira | 🟢 Alta | Calculado + exibido |
| Contratar + relatório PDF | 🟡 Média | Funciona; revisar layout pontual |
| Widget embed | 🟡 Média | Demo pronta |
| Admin | 🟡 Média | Painel demo, não produção |
| Auth real (Google/OAuth) | 🔴 Baixa | Login simulado |
| Multi-persona produção | 🔴 Baixa | Ainda lista todos (modo DEV) |
| Testes automatizados | 🔴 Baixa | Só manual |
| App mobile nativo | 🔴 Não existe | Web only |

---

## 6. Entregas recentes (últimas semanas)

1. Campos RH no perfil profissional (contratantes)
2. Simplificação modelo cliente (`client_profiles`)
3. Correções admin + relatório contratante
4. Navegação iOS + Control Center DEV + `PROOFLY_DEBUG`
5. Pasta `docs/reports/` para supervisão assíncrona

**Commits recentes:** `309ab7b` … `5d827c2` … `2dec131`

---

## 7. Pendências operacionais (Leandro / infra)

- [ ] Rodar no Supabase: `019_RODE_NO_SUPABASE.sql` (colunas RH)
- [ ] Rodar no Supabase: `020_RODE_NO_SUPABASE.sql` (`client_profiles`)
- [ ] Validar demo pós-migration (login, busca, drawer, 3 papéis)
- [ ] Hard refresh após deploy

Sem isso, erros tipo `client_profiles does not exist` ou `work_style_tags does not exist` aparecem na busca.

---

## 8. Dívidas técnicas (para decisão)

| Item | Impacto | Sugestão supervisora |
|------|---------|----------------------|
| Demo lista **todos** profs/ests na seleção | Confunde demo “real” | Filtrar por `users.*_id` quando sair do modo DEV |
| Arquivos legado (`cliente-bak`, `---*.html`) | Ruído no repo | Arquivar ou remover em sprint de limpeza |
| Seeds antigas referem `clients` | Quebra se rodar fora de ordem | Já parcialmente corrigido; padronizar só `client_profiles` |
| `user_profiles` no schema | Confusão arquitetural | Manter deprecated ou remover em migration futura |
| Sem CI/testes | Risco em refactors | Avaliar Playwright mínimo ou checklist manual fixo |
| Múltiplas IAs (supervisor/dev/art) | Processo | Pipeline via `docs/reports/` (já iniciado) |

---

## 9. Decisões sugeridas para a supervisora

### Prioridade alta
1. **Confirmar demo estável** — migrations rodadas + walkthrough dos 3 papéis antes de mostrar a investidor/cliente?
2. **Escopo próximo sprint** — polimento drawer? auth real? ou foco só em pitch (contratantes + match)?
3. **Menu DEV em demo externa** — `PROOFLY_DEV_MENU = false` para esconder menu lateral?

### Prioridade média
4. **Limpeza de legado** — apagar variantes `bak/exp` e HTML com `---`?
5. **Personas IA** — formalizar pipeline Art → Dev → Supervisor via reports?
6. **Multi-perfil** — manter só demo ou investir em `users` 1:1 definitivo (já em curso no cliente)?

### Prioridade baixa / futuro
7. Testes E2E, PWA, domínio produção, monetização

---

## 10. Pontos fortes para pitch

- Match por afinidade (tags) — diferencial claro
- **Informações para Contratantes** — RH + carteira Proofly + glass UI
- IGV e métricas automáticas (não auto-declaradas)
- QR / avaliação verificada (conceito)
- Widget prova social para site do estabelecimento

---

## 11. Riscos

| Risco | Mitigação |
|-------|-----------|
| Banco desatualizado vs código | Scripts `*_RODE_NO_SUPABASE.sql` + checklist |
| Demo parece “ferramenta de dev” | Esconder menu DEV + Control Center só com flag |
| Supervisor sem contexto | Esta pasta `docs/reports/` |

---

## 12. Onde aprofundar

| Tema | Arquivo |
|------|---------|
| Log vivo | [sessao-supervisor.md](./sessao-supervisor.md) |
| Delegação iOS | [2026-06-23-delegacao-ios-status.md](./2026-06-23-delegacao-ios-status.md) |
| Modelo cliente | commit `309ab7b`, `migrations/020_*` |
| Catálogo de páginas | `apendice.html` no projeto |
| Schema | `schema.sql`, `base-de-dados-completa.html` |

---

**Conclusão em uma linha:** Proofly está **demo avançada e apresentável**, com core de match + contratantes sólido; falta **alinhar banco (migrations)**, **validação manual** e **decisão de escopo** (pitch vs produto vs limpeza técnica) para o próximo ciclo.