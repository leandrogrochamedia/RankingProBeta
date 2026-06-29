# DEV-TELAS-DASHBOARD-v1

**Para:** Magrão / Developer  
**Regra:** 1 frase — **Prof = Top Places · Est = Top Employees**  
**Sem reunião.** Executar checklist.

Repo: `/Users/leandrogrocha/Documents/DEV/ranking-pro-shark`

---

## Ordem obrigatória nas duas telas

```
HERO (nota + identidade)
    ↓
🔥 TOP BLOCK (rh-reco-grid)  ← mais visível, logo abaixo do hero
    ↓
resto (QR, reputação, avaliações, editar…) — pode ficar abaixo da dobra
```

---

## Dashboard profissional (`dashboard-profissional.html`)

| Prioridade | Bloco | DOM |
|------------|-------|-----|
| 1 | Hero | seção hero existente |
| 2 | **🔥 Top Places** | `#profEstabRecoGrid` · classe `rh-reco-grid` |
| 3+ | Stats propostas/candidaturas | `#profCareerStats` · `#profHiringInbox` · `#profApplicationsList` — **abaixo** do grid ou colapsado |
| depois | QR, link público, avaliações, histórico, editar | como já está |

**DEV faz:**
- Mover seção/markup do `#profEstabRecoGrid` (título `🔥 Top Places`) para **imediatamente após o hero**
- `#careerHubSection` visível — **sem** `shark-frozen-ui`
- `renderCareerHub()` roda — **sem** `return` por `isSharkMode()`
- `initSharkProfDashboard()` **não** esconde career hub / top places
- `loader.js` carrega `talent-market.js` + `hiring-service.js`
- Grid popula: match% DESC → nota DESC · botão **Pedir emprego** (`HiringFlow`)

---

## Dashboard estabelecimento (`dashboard-estabelecimento.html`)

| Prioridade | Bloco | DOM |
|------------|-------|-----|
| 1 | Hero | seção hero existente |
| 2 | **🔥 Top Employees** | `#rhRecoGrid` · classe `rh-reco-grid` |
| 3+ | Equipe atual, candidaturas, propostas | `#rhTeamGrid` · `#rhApplicationsList` · `#rhProposalsList` — **abaixo** do grid |
| depois | QR, widget, avaliações, editar | como já está |

**DEV faz:**
- Extrair `#rhRecoGrid` + título `🔥 Top Employees` de dentro do form/edit — colocar **logo após o hero** (seção própria `glass-surface prof-dash-panel`)
- `#rhHubSection` visível — **sem** `shark-frozen-ui` no top block
- Funções RH rodam — **sem** `return` por `isSharkMode()` no load do grid
- `loader.js` carrega `talent-market.js` + `hiring-service.js`
- Grid popula: match% DESC → IGV DESC → nota · botão **Contratar / Propor** (`HiringFlow`)

---

## Cards (não inventar — já em `hiring-service.js`)

- Prof: `HiringFlow.renderEstabOpportunityCard(est, prof)`
- Est: cards do `rhRecoGrid` via hiring-service / marketplace boot existente

Grid CSS existente: `.rh-reco-grid` em `hiring-service.js`

---

## Checklist P0

- [ ] Prof: Top Places visível abaixo do hero em mobile 375px
- [ ] Est: Top Employees visível abaixo do hero em mobile 375px
- [ ] Ambos grids com dados ou empty state (texto no doc abaixo)
- [ ] Shark não esconde os dois top blocks
- [ ] Zero página nova · zero CSS redesign · só reorder DOM + descongelar JS

---

## Empty states

**Prof:**  
"Nenhum estabelecimento recomendado. Complete o perfil e marque disponível para contratação."

**Est:**  
"Nenhum profissional recomendado. Autônomos com boa reputação aparecem aqui."

---

## Arquivos (só estes)

```
dashboard-profissional.html
dashboard-estabelecimento.html
loader.js
hiring-service.js          (usar render existente)
talent-market.js           (usar enrich existente)
profile-dashboard.css      (só se shark-mode ainda esconde — exceção .talent-top-block)
```

---

## Relatório

```bash
cd ~/Desktop/RANKING\ PRO\ LOG
./enviar-relatorio-supervisor.sh "DEV-TELAS-DASHBOARD-v1 — prof top places / est top employees OK"
```