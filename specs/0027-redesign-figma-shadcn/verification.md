# Verificação — spec 0027

Issue: https://github.com/SamiaLuvanice/bestprice/issues/153
Branch: `feature/0027-issue-153-redesign-figma-shadcn`.
Base: `origin/develop` em `4855704`, após fetch em 21/10/2026.
Worktree: `.worktrees/feature-0027-issue-153-redesign-figma-shadcn`.
Estado: implementação entregue; aguarda revisão no [PR #154](https://github.com/SamiaLuvanice/bestprice/pull/154), aberto como rascunho para `develop`.

## Referência e limites

Conector Figma devolveu autenticação repetida nas duas consultas de metadados e no
`whoami`. A implementação usou os SVGs editáveis locais associados ao arquivo
LZVtUEAycEzfbwL0H5YL3r, sem confirmar eventuais alterações posteriores no serviço.
O checkout principal em stage e as alterações não commitadas do estudo foram preservados.

A identidade e composição seguem os quadros. Mantiveram-se os quatro indicadores
já publicados pela API, o formulário acessível em Produtos e o contexto de frescor
que o contrato existente exige. Os CTAs públicos levam ao login, pois cadastro público
não existe. Gráficos representam somente os registros carregados, sem filtros
fictícios, regras monetárias no cliente ou extrapolação de histórico.

## Evidências executadas

- `npm install ...` e geração via `npx shadcn@latest add ...`: componentes oficiais
  locais; Recharts solicitado explicitamente pelo usuário. Auditoria npm: zero vulnerabilidades.
- Gráfico: 3 testes Red por ausência do comportamento; depois 3/3 Green. Cobrem
  vazio, dados inválidos/moeda diferente, ordem cronológica e cobertura parcial.
- Recuperação de rota: 3 testes Red por ausência do comportamento; depois 46/46
  em NotFoundPage/LoginForm/navigation. Visitante entra, sessão ativa vai ao início,
  ação voltar retorna à página anterior.
- Suíte completa intermediária: 294/296; dois testes antigos ainda exigiam lista
  no histórico e texto antigo de vazio. Atualizados para a tabela expansível real.
  Próxima suíte: 296/296 em 28 arquivos.
- `npm run lint`: passou sem avisos após remover exports de variants não utilizados.
  Uma execução concorrente encontrou `ENOENT` em test-results removido pelo Playwright;
  arquivos gerados foram incluídos nos ignores do ESLint, e o lint foi repetido.
- `npm run build`: TypeScript e Vite passaram; Chart/Recharts em chunk lazy próprio
  (~341 kB, ~102 kB gzip), carregado apenas no detalhe. Prévia SVG do card reduzida
  de 735 kB para 1,5 kB e painel ilustrativo para 280 kB ao excluir elementos fora do recorte.
- Detector `impeccable ... detect src --json`: `[]`.
- `pre-commit run`: primeira execução normalizou EOF dos SVGs; segunda passou.
- Matriz Playwright inicial: 23/27; corrigidos alvos pequenos. Matriz com axe:
  24/27; corrigida cor de links CTA sobre verde. Reteste landing: 3/3.
- Matriz completa antes do ajuste final de fidelidade: 48/48, sem atualizar snapshots.
  São 18 snapshots públicos (3 páginas × 2 esquemas do sistema × 3 viewports) e
  30 cenários de rotas/estados com axe WCAG A/AA, overflow, alvos de 44px e menu aberto.
- Tema claro mantido com variante Tailwind `.dark` explícita; esquema do sistema
  não ativa modo escuro na aplicação.

Uma tentativa inicial da suíte no sandbox falhou antes da coleta por arquivos
temporários inacessíveis (`ENOENT`, zero testes): não é contada como teste válido.
Gates com workers e navegador foram repetidos no ambiente local permitido.
Chromium instalado usado via `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` e servidor Vite
na porta 5178; não foi necessário instalar ou alterar o navegador do usuário.

## Revisão independente

Primeira revisão identificou recorte do menu pela Table, e-mail oculto da árvore
acessível e links abaixo de 44px; corrigidos e revalidados por inspeção e navegador.
Segunda revisão do código aprovada. Comparação visual aprovou landing e pediu
marca/pílula do login e composição própria de rota inexistente; ajustes implementados.
A aprovação final dos baselines e os últimos gates estão registrados abaixo.

## Matriz de aceite

| AC | Evidência | Limite |
|---|---|---|
| AC01 | Landing desktop/mobile, CTAs reais, arte e ilustração identificada | Figma remoto indisponível; comparação com SVGs locais |
| AC02 | Suíte LoginForm/navigation e capturas nos 3 tamanhos | Sem autenticação real contra servidor nesta tarefa |
| AC03 | Início com dados de fixture do contrato, quatro indicadores existentes | Fixtures somente na camada de teste |
| AC04 | Produtos, preços, ações e paginação em Vitest; menu aberto em navegador | Sem alteração de contrato ou banco |
| AC05 | Recharts/Chart, série em degraus, tooltip exato, tabela e paginação | Histórico parcial explicitamente identificado |
| AC06 | Alertas, leitura e recuperação de rota testados | Notificações seguem somente eventos já publicados |
| AC07 | 320/768/1280, overflow, toque mínimo, axe, menu e nome da conta | Auditoria automatizada complementa inspeção; não equivale a teste com leitor de tela |
| AC08 | Conta vazia sem produtos/preços fictícios; ilustrações públicas identificadas | Artes fornecidas incluem interface ilustrativa |
| AC09 | Lint, testes e build; backend não alterado | CI remoto e integração em develop ainda pendentes |

## Handoff

Sem merge nem implantação nesta tarefa. Backend, banco e automações não foram
alterados; gates locais desses subsistemas não foram repetidos. Revisão e CI
remotos continuam necessários para integrar o PR. O doc-sync-onboarding foi
executado após os últimos gates e a revisão, como etapa final de documentação.


## Gates finais — 21/10/2026

- `npm test -- --run --maxWorkers=4`: **299 passed**, 29 arquivos, 111,98 s.
- `npm run lint`: passou sem erros nem avisos.
- `npm run build`: TypeScript/Vite passaram, 2,62 s; Recharts continua em chunk lazy.
- `npm run test:visual -- --workers=2`: **48 passed**, 1,9 min, sem atualizar snapshots.
  Os 30 cenários de rotas/estados passaram em axe, overflow e alvos de toque;
  conta preserva nome acessível e menu de produto permanece atingível fora da linha.
- `impeccable ... detect src --json`: `[]`.
- `pre-commit run`: passou; check-yaml sem arquivos aplicáveis.
- `git diff --check`: passou.

A revisão independente aprovou o código e, explicitamente, a atualização dos 18
baselines. Comparou amostras de landing/login/rota inexistente em 320 e 1280 com os
SVGs e não encontrou diferenças inadequadas após os ajustes. Os baselines anteriores
foram preservados localmente em `frontend/playwright-report/review/previous/` para
comparação; o Git também conserva a versão anterior.

As variáveis locais de execução visual foram:
`PLAYWRIGHT_BASE_URL=http://127.0.0.1:5178` e
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` apontando ao Chromium já instalado. A configuração
padrão continua na porta 5173 e usa o navegador padrão do Playwright.


## Sincronização final da documentação — 21/10/2026

O papel `doc-sync-onboarding` conferiu o diff staged/unstaged, código e configuração
reais, seguindo as skills `doc-sync-onboarding` e `learnings`. Não alterou código,
não executou novos testes e não inferiu integração ou implantação a partir dos gates.

Documentos sincronizados:

- `README.md`: visão do redesign, componentes/gráfico e comandos de QA atuais.
- `docs/architecture.md`: dependências visuais locais e carregamento lazy do gráfico,
  preservando o contrato e a topologia existentes.
- `docs/apps/frontend.md`: composição atual de landing/login/recuperação, biblioteca,
  histórico real, tabela textual, estados e a matriz Playwright com axe.
- `docs/index.md`: descrição do guia frontend ampliada.
- `docs/product-context.md`: nota que distingue a tabela histórica da 0013 das
  bibliotecas já adotadas, sem apresentar filtros/métricas planejados como entregues.
- `docs/PROGRESS.md`: implementação local, revisão e resultados finais da 0027;
  PR/CI remoto e integração ainda pendentes.
- `docs/LEARNINGS.md`: cascata CSS/Tailwind, overflow de menus, texto acessível e
  exclusão dos diretórios de QA da varredura do ESLint.
- `designsystem/prototypes/2026-10-21-bestprice-figma/README.md`: estudo original
  separado da implementação da 0027 e limite da consulta ao Figma remoto.
- `specs/0027-redesign-figma-shadcn/tasks.md` e este registro: etapa documental
  concluída, preservando a pendência de entrega do PR.

`AGENTS.md` e `CLAUDE.md` foram conferidos e não exigiram edição: a stack, as
referências do harness, os papéis e o fluxo continuam válidos. Também foram
conferidos `docs/database.md`, `docs/apps/backend.md`, `docs/apps/infraestrutura.md`
e `docs/github-workflow.md`; esta mudança não altera esquema, HTTP, worker,
proxy, CI ou implantação. `designsystem/README.md` já registra as extensões da 0027
e foi conferido sem nova alteração nesta etapa.

A spec permanece `pronta` até revisão e integração em `develop`. Se houver nova
alteração de código, esta sincronização deve ser repetida após a nova verificação.


Conferência documental final: os links locais nos dez documentos alterados foram
resolvidos sem destino ausente; `git diff --check` passou. Nenhum teste de aplicação
foi repetido durante esta etapa documental.


## Entrega do PR — 21/10/2026

[PR #154](https://github.com/SamiaLuvanice/bestprice/pull/154) aberto como rascunho para `develop`, com `Closes #153`.
Implementação e sincronização documental publicadas inicialmente em `2711886`.
Esta atualização altera somente o registro da entrega, sem mudança de código.
CI remoto em acompanhamento; sem merge ou implantação. Branch e worktree mantidas
para revisão. A spec permanece `pronta` até integração em `develop`.
