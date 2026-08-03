# LOG de implementação — Meu Perfil (Cliente)

**Data:** 2026-06-26  
**Executado por:** Supervisor/Agent (instância local do workspace)  
**Referência da spec:** `devtasks/devtask_2026-06-26_01-58_Meu-Perfil-Cliente-Refactor.txt`

---

## Resumo

Refatoração completa da tela **Meu Perfil** do cliente: layout mais limpo (sem topbar), edição no avatar, estilos view/edit corretos, CEP mascarado, save confiável e histórico de reputação derivado de avaliações reais.

---

## O que foi feito

### 1. Layout e edição (`meu-perfil.html`, `meu-perfil.js`, `proofly-glass.css`)

- Removido o `<header class="meu-perfil-topbar">` com link "← Voltar para busca" e botão editar no topo.
- Navegação de volta fica pelo menu lateral global (`menu.js`).
- Botão **Editar** reposicionado como pill/badge no **canto inferior direito do círculo da foto** (classe `.meu-perfil-avatar-edit`).
- Em modo edição o pill alterna para **"👁️ Ver"**; Salvar/Cancelar permanecem no rodapé do formulário.
- Novo wrapper `.meu-perfil-avatar-wrap` para posicionar avatar + pill.

### 2. Estilos de profissional e estabelecimento (`meu-perfil.js`)

- Duas seções com títulos explícitos:
  - **Estilo de profissional**
  - **Estilo de estabelecimento**
- **Modo visualizar:** exibe somente tags salvas (`prof_style_tags` / `est_style_tags`), pills read-only (`.meu-perfil-tags--readonly`).
- **Modo editar:** exibe todas as opções como chips toggle (máx. 5 prof / 3 est).
- Pills só alteráveis em modo edição.

### 3. Legibilidade das pills (`proofly-glass.css`)

- `.meu-perfil-tag` e `.meu-perfil-tag .style-chip` → texto **branco** (`#fff`).
- `.meu-perfil-style-chip` inativo → `#f8fafc`; ativo → `#fff` sobre gradiente roxo.

### 4. CEP sempre mascarado (`utils.js`, `meu-perfil.js`)

- Nova função global `formatCepDisplay(zip)` → formato `00000-000`.
- **View:** CEP no `<dd>` sempre mascarado.
- **Edit:** valor inicial do input mascarado + `formatarCEP` no evento `input` e ao bind após render.

### 5. Salvamento do perfil (`meu-perfil.js`)

- Merge do retorno do PATCH corrigido: `Array.isArray(updated) && updated[0]` antes de atualizar `clientRecord`.
- Mantidos: `syncClientPrefsFromRecord`, `updateUser`, `setSession`, `showUserMessage`, avatar base64, tags e endereço.

### 6. Histórico de reputação (`meu-perfil.js`, `proofly-glass.css`, `loader.js`)

- `loader.js`: página `meu-perfil` incluída em `needsReviews` para carregar `reviews-service.js`.
- Novas seções abaixo do card principal:
  - **Lugares que você frequentou** — agrupados por `establishment_id` a partir de reviews `client_to_establishment`.
  - **Profissionais que te atenderam** — agrupados por `professional_id` a partir de reviews `client_to_professional`.
- Linha de contexto: *"Você foi atendido(a) por FULANO no Estabelecimento X"*.
- Se vínculo mudou: *"Hoje, FULANO está no Estabelecimento Y"*.
- Fallback legado (sem snapshot): usa vínculo atual com rótulo *(vínculo atual)*.
- Botão **"Ver trajetória"** — expande painel com `buildWorkHistory` + fetch `professional_establishment`.
- Link rodapé: **"Ver todas as minhas avaliações"** → `minhas-avaliacoes.html`.
- Empty states quando não há dados.

### 7. Snapshot na avaliação cliente → profissional (`reviews-service.js`)

- `buildReviewPayload`: grava `prof_link_snapshot` também para `CLIENT_TO_PROF` (antes só para source `profissional`).
- `submitReview`: se cliente avalia profissional sem snapshot, busca `current_establishment_id` do prof e grava snapshot + `establishment_id` na review.
- Objetivo: histórico *"atendido no salão X"* confiável em avaliações novas.

### 8. DRY — constantes de estilo (`utils.js`, `cadastro-cliente.js`, `meu-perfil.js`)

- Extraídas para `utils.js`:
  - `CLIENT_PROF_STYLE_PICKS`
  - `CLIENT_EST_STYLE_PICKS`
- `cadastro-cliente.js` e `meu-perfil.js` passam a usar `window.CLIENT_*` com fallback local.

---

## Arquivos modificados

| Arquivo | Alteração |
|---------|-----------|
| `meu-perfil.html` | Removida topbar |
| `meu-perfil.js` | Reescrito: avatar edit pill, view/edit, CEP, histórico, trajetória |
| `proofly-glass.css` | Estilos avatar edit, pills brancas, seções de histórico |
| `loader.js` | `meu-perfil` em `needsReviews` |
| `utils.js` | `formatCepDisplay`, `CLIENT_PROF_STYLE_PICKS`, `CLIENT_EST_STYLE_PICKS` |
| `reviews-service.js` | Snapshot em avaliação cliente→prof |
| `cadastro-cliente.js` | Usa constantes compartilhadas de estilo |

---

## Arquivos de referência (não alterados nesta rodada)

- `devtasks/devtask_2026-06-26_01-58_Meu-Perfil-Cliente-Refactor.txt` — spec original do Supervisor
- `minhas-avaliacoes.html` — lista completa de avaliações (linkada do perfil)
- `menu.js` — navegação lateral (substitui topbar)

---

## Como testar

1. Abrir `meu-perfil.html` logado como cliente.
2. Confirmar: sem barra "Voltar para busca"; pill Editar no avatar.
3. Editar nome/CEP/tags → Salvar → dados refletem na view.
4. CEP em `00000-000` na view e no input.
5. Pills de estilo brancas e legíveis.
6. Rolagem até histórico (lugares + profissionais) se houver avaliações.
7. Clicar "Ver trajetória" em um profissional.
8. Nova avaliação de profissional no `cliente.html` deve gravar `prof_link_snapshot` (verificar no banco ou DevTool).

---

## Limitações conhecidas

- Avaliações **antigas** cliente→prof sem `prof_link_snapshot` usam fallback do vínculo **atual** do profissional (marcado como *vínculo atual*).
- Histórico depende de reviews com `user_id` do cliente logado.

---

## Contato / handoff

Para dúvidas sobre decisões de produto, ver spec em `devtasks/devtask_2026-06-26_01-58_Meu-Perfil-Cliente-Refactor.txt`.