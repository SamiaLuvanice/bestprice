# 0063 — Verificação

Data: 27/11/2026. Branch `feature/0063-issue-349-monitoramento-pagina-unica`, Issue
[#349](https://github.com/SamiaLuvanice/bestprice/issues/349). Escopo: somente `frontend/`.

## Origem da decisão

Comparação no Chrome (27/11/2026) entre o Stage (`/app/monitoring`, `/overview`, `/alerts`;
conta sem produtos) e os quadros Figma 0041 (nó 151-11) e 06 (nó 59-254). A captura de
tela do Stage parou de funcionar depois da primeira imagem (timeout da extensão); Início e
Produtos foram lidos pelo texto da página. Escolha registrada na spec: estrutura do Figma
preenchida só com dados da API atual.

## TDD

| Etapa | Comando (em `frontend/`) | Resultado |
|---|---|---|
| Red | `npx vitest run src/dashboard/monitoring.test.tsx` | 12 falharam pelo motivo esperado (h1 "Seus produtos", sem região de resumo, colunas antigas, links `/produtos/<id>`); 3 já passavam (AC06, AC11, AC13), que ficam como proteção de regressão |
| Green | mesmo comando | 15/15 |
| Red da revisão (foco após parar no detalhe embutido) | `npx vitest run src/dashboard/monitoring.test.tsx -t "pelo detalhe"` sem a correção | 2 falharam: "Expected element with focus" (foco ficava no h1) |
| Green da revisão | mesmo comando com a correção | 2/2; arquivo completo 21/21 |
| Regressão do campo com painel em falha | `states.test.tsx` (2 casos 500/rede) | vermelhos antes da correção (`expected null not to be null`), verdes depois |

## Portões e suítes

| Verificação | Comando | Resultado |
|---|---|---|
| Lint | `npm run lint` | sem erros nem avisos |
| Tipos | `npx tsc -b --noEmit` | sem erros |
| Vitest completo | `npx vitest run` | 932/934 na rodada com Playwright da QA em paralelo; as 2 falhas (`dev/catalogRoute.test.tsx`, `navigation/routes.test.tsx` › destino protegido) passaram 20/20 isoladas: tempo sob carga, não regressão. Rodada anterior sem carga: 928/928 em 66 arquivos |
| Build | `npm run build:check` | ok (aviso de chunk > 500 kB preexistente) |
| Playwright afetados | `PLAYWRIGHT_BASE_URL=http://127.0.0.1:5191 npx playwright test tests/visual/{monitoring-single-page,monitoring-overflow,assistant,brand,redesign}.spec.ts` | 146 passaram; únicas falhas: `brand.spec.ts › marca sessao-erro` nos 4 viewports |
| Pré-existente | mesmo teste `sessao-erro` no checkout `develop` (porta 5192) | também falha em `develop`; fora do escopo |
| Página única após correção de 320 px | `npx playwright test tests/visual/monitoring-single-page.spec.ts tests/visual/redesign.spec.ts` | 73/73 |
| `gates.mjs --scope frontend` | `node .agents/scripts/gates.mjs --scope frontend` | **não concluído**: o passo `npm ci` falhou com EPERM porque um Vite (Playwright) desta worktree estava ativo, e apagou o `node_modules`; reinstalado com `npm ci` limpo. Lint, testes e build foram rodados individualmente acima |

## Critérios de aceite

| AC | Evidência |
|---|---|
| AC01 | `monitoring.test.tsx` › "mostra um título, sem navegação interna, e o sino uma vez"; `assistant.spec.ts` › shell (sem navegação "Principal", um banner) |
| AC02 | `monitoring.test.tsx` › endereço antigo; `routes.test.tsx` (replace no histórico) |
| AC03 | `monitoring.test.tsx` › cartões; `overview.test.tsx` › indicadores; `states.test.tsx` (vazio sem indicadores) |
| AC04 | `monitoring.test.tsx` › colunas, "(6)" e campo único; `pendingLink.test.tsx` (link da landing pré-preenchido e focado) |
| AC05 | `monitoring.test.tsx` › situação (6 rótulos) e disponibilidade na linha secundária; `products.test.tsx` |
| AC06 | `monitoring.test.tsx` › preço desconhecido e alerta; "Carregar mais" na página única |
| AC07 | `monitoring.test.tsx` › detalhe, atualizações recentes, sino, alertas, "Ver produto" após 201, produto inexistente, parar de acompanhar (lista restante e vazia); `hero.test.tsx` › duplicado |
| AC08 | `monitoring.test.tsx` › "Ver alertas", "Voltar ao monitoramento", "Ver todas as notificações" |
| AC09 | `monitoring.test.tsx` › atualizações abaixo da lista, sem "Boas oportunidades" |
| AC10 | `monitoring.test.tsx` e `states.test.tsx` › cartão vazio sem indicadores nem cabeçalho de tabela |
| AC11 | `monitoring.test.tsx` e `states.test.tsx` › erro, "Tentar novamente", falha de recarga preservando dados, campo disponível |
| AC12 | `monitoring-single-page.spec.ts`: sem rolagem em 320/390/768/1024/1280/1440 px; item empilhado em 390 px com título, preço, variação, situação e data; alvos ≥ 44 px; axe WCAG 2.2 AA sem violações (com produtos, vazia, erro × 390/1280) |
| AC13 | `monitoring.test.tsx` › rotas legadas; `header.test.tsx`, `routes.test.tsx`, `stop-tracking.test.tsx` em `/produtos`; nenhuma mudança em `backend/` |

## Validação visual

Capturas da implementação (Playwright, API simulada, dados ilustrativos):
[desktop 1440](design/desktop.png), [mobile 390](design/mobile.png), [vazio 1440](design/empty-desktop.png).

Comparação com o quadro 0041 (151-11): fiel na estrutura (título, quatro cartões com ícone,
"Produtos monitorados (N)", "Adicionar anúncio", tabela com situação em rótulo), **exceto os
itens fora de escopo**: anel "Visão dos produtos", gráfico agregado com períodos, busca,
filtros com contagem, coluna Loja, indicador "Sem estoque" e aviso com o robô. Diferenças
intencionais: indicadores fiéis ao resumo (24h e preço-alvo), coluna Menor preço mantida,
"Ver alertas" e sino no cabeçalho, atualizações recentes abaixo da lista. Estado vazio segue
o quadro 06 (59-254) com o campo de link em vez de só "Ir ao assistente".

Durante a validação, as capturas revelaram e levaram a corrigir: grade de duas colunas
herdada da antiga Início; tabela vazando do cartão; texto vertical no item móvel; preço
partido no meio; cartões em duas colunas a 390 px; "Indisponível" quebrando por letra;
"Sem variação conhecida" estourando 320 px.

## Revisões

- Spec: `spec-reviewer` — 3 bloqueantes e 9 sugestões incorporados antes do plano.
- Código: `arch-reviewer` — aprovado com ressalvas (P2: foco pós-parada, cobertura de links,
  registro de verificação; P3: código/CSS morto, título da aba, rótulo longo em 320 px),
  tratados em `b0d88f4`.

## Pendências

- Atualizar os quadros Figma 0041/06 para o híbrido (MCP do Figma indisponível nesta sessão).
- `brand.spec.ts › marca sessao-erro` falha também em `develop`; precisa de tarefa própria.
- `gates.mjs` não rodou até o fim (ver tabela); CI da PR é a confirmação integrada.
