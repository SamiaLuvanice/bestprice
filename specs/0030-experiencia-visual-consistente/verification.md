# Verificação — spec 0030 / Issue #174

## Correções solicitadas na revisão do PR #175

O usuário apontou banner final cortando o telefone, rodapé público claro e marca
do login com fundo branco sobre a fotografia à esquerda. A inspeção confirmou
`object-fit: cover` com altura fixa na coluna estreita e fundo CSS branco no
ícone. O PNG original tem canal alpha; nenhum ativo precisou ser editado.

- Red: `npm run test:visual -- review-corrections.spec.ts --project=viewport-1280 --workers=2`: **3 falharam** pelos sintomas exatos. Proporção do banner 1,38 em vez de 2,92; rodapé transparente com texto cinza; marca no formulário oculta no desktop.
- Green: `npm run test:visual -- review-corrections.spec.ts --workers=2`: **12 passaram**, quatro larguras.
- `npm run test:visual -- --grep "redesign (landing|login)|marca login" --workers=2`: **12 passaram**, incluindo axe, overflow, toque e marca. Capturas desktop/mobile inspecionadas.
- `npm run lint`: passou. Build identificou uma opção `exact` indevida na assertiva Testing Library nova; corrigida a tipagem do teste, sem alteração funcional. `npm run build` repetido: passou, 2.653 módulos.
- `npm test -- --run --maxWorkers=2`: **350 testes, 31 arquivos passaram**.
- Detector impeccable sobre os quatro arquivos de UI afetados: `[]`.
- Referências visuais de landing/login revisadas: `public-pages.spec.ts --grep "landing pública|login" --update-snapshots`: **16 passaram**. Nem todos os PNGs precisaram mudar.
- Confirmação após a correção: `npm run test:visual -- --grep 'landing pública|login|redesign landing|banner final|rodapé da' --workers=2 --output=playwright-report/spec-0030/review-final`: **40 passaram**, sem atualização de baselines. Cobre as superfícies afetadas; não representa reexecução da suíte inteira.
- Revisão independente dos ajustes conforme `arch-reviewer`: sem achados no diff e nas capturas de 1280 e 320 px. O implementador também inspecionou 1280 e 390 px. Complexidade sem Python alterado; detector `[]` e `git diff --check` sem erros.

O banner conserva todo o arquivo original de 1600 × 548 px, sem recorte adicional.
O limite inferior já existente no ativo fornecido permanece parte da arte. O
rodapé é preto em toda a largura, com texto branco e link verde. A única marca
acessível do login fica acima do formulário, na coluna direita do desktop; a
fotografia passa a ser decorativa. A galeria local teve oito capturas de
landing/login substituídas pelas versões corrigidas.

Doc-sync-onboarding repetido após o código final e a revisão independente, como
última etapa, seguindo `.agents/agents/doc-sync-onboarding.md` e as skills
`doc-sync-onboarding` e `learnings`. Conferidos diff contra `d5645c1`, AC11,
plano, tokens e testes. Atualizados `docs/apps/frontend.md`, `docs/PROGRESS.md`,
`docs/LEARNINGS.md`, `designsystem/README.md`, auditoria, tarefas e este registro
para distinguir o estado atual e as execuções anteriores. Nenhum código, teste
ou snapshot alterado nesta sincronização. `AGENTS.md` e `CLAUDE.md` conferidos
sem mudança: instruções e imports continuam válidos. `docs/index.md`, README e
arquitetura continuam adequados, sem novo documento, setup, dependência ou fluxo
HTTP; demais guias não são afetados. PR #175 aberta, sem merge; CI anterior verde,
checks desta correção aguardam push. Sem validação de deploy ou API real.
`git diff --check` passou após as edições documentais; houve apenas avisos de
conversão futura LF/CRLF do Git, sem erros de whitespace.

Ambiente: Windows, worktree `feature/0030-issue-174-experiencia-visual`, base `e484cd3`, Node/npm locais e Chrome instalado em `C:/Program Files/Google/Chrome/Application/chrome.exe`. API simulada nos testes de UI; sem alteração ou validação de backend/banco nesta tarefa.

## Preparação e evidência inicial

- `git fetch origin` e `git show-ref --verify refs/remotes/origin/develop`: referência confirmada; worktree isolada criada.
- `npm ci --offline --no-audit --no-fund`: 395 pacotes instalados. Aviso de depreciação do ESLint existente, sem alteração de dependências.
- `pre-commit install --hook-type pre-commit --hook-type commit-msg`: hooks instalados após repetir fora do sandbox, que bloqueou escrita no cache.
- Playwright inicial: bloqueio de processo `EPERM`; execução autorizada fora do sandbox revelou ausência de Chromium empacotado. Usado o parâmetro já suportado `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`, apontando para o Chrome instalado; nenhuma configuração de código alterada.
- Auditoria anterior: `npm run test:visual -- --project=viewport-1280 --grep redesign --workers=2 --output=test-results-before`: **15 passaram**, incluindo títulos longos móveis, linha compacta e vazio de alertas.
- Figma conector: autenticação não resolveu `UNAUTHORIZED`; arquivo acessível no Chrome, com páginas desktop/mobile e composição ampliada do painel observadas. Referências locais complementaram a comparação. Spartan observado no navegador e consultado por web.

## TDD do menu

`npm test -- --run src/landing/LandingPage.test.tsx`:

- Red: **5 passaram, 2 falharam**; Escape não fechava, e mover foco ao conteúdo não recolhia o menu.
- Green após correção: **7 passaram**.
- Teste de navegador adicional para senha inicialmente procurava o nome inexistente “Ocultar senha”; o controle existente usa nome estável “Mostrar senha” com `aria-pressed`. A assertiva foi corrigida para esse contrato, sem alterar o produto. Essa falha de teste não é evidência Red de comportamento.

## Gates da implementação anterior à correção de revisão

| Comando | Resultado observado |
|---|---|
| `npm run lint` | Passou; repetido após adicionar os testes Playwright |
| `npm test -- --run` | **31 arquivos, 350 testes passaram** |
| `npm run build` | TypeScript e Vite passaram; 2.654 módulos, chunk do gráfico separado (340,93 kB / 101,43 kB gzip) |
| `npm run test:visual -- --grep redesign --workers=2` | **60 passaram**, 320/390/768/1280 px |
| `npm run test:visual -- --workers=2 --output=test-results-comparison` | **96 passaram; 24 divergências de snapshot esperadas** em landing/login/404, nos quatro viewports e emulação light/dark; revisão antes de regenerar |
| Detector impeccable sobre seis fontes de UI alteradas, `detect … --json` | Retornou `[]`, sem achados determinísticos |
| `git diff --check` | Sem erros após remover linha vazia excedente na documentação |

- `npm run test:visual -- public-pages.spec.ts interaction.spec.ts --workers=2 --update-snapshots`: **32 passaram**, 24 baselines públicas regeneradas após revisar diffs.
- Confirmação final, sem atualizar imagens: `npm run test:visual -- --workers=4 --output=playwright-report/spec-0030/final-run`: **128 passaram (4,2 min)**. Inclui identidade, sessão, telas/estados, axe, overflow, alvos de toque, teclado, senha e movimento reduzido nas quatro larguras.
- Automações da raiz: `node --test (Get-ChildItem .github/scripts -Filter '*.test.cjs').FullName`: passou, código 0, testes positivos. A primeira execução ficou bloqueada por `spawn EPERM`; a repetição autorizada fora do sandbox executou os testes.
- Revisão independente conforme `.agents/agents/arch-reviewer.md`: sem achados concretos de regressão ou bloqueios. Conferiu diff, teste novo e amostras de capturas; `git diff --check` passou. Complexidade `--changed origin/develop`: código 0, nenhum Python alterado. A revisão não repetiu suites amplas nem validou API real/dispositivos físicos.

## Sincronização documental da implementação anterior

Em 22/10/2026, executado o papel `.agents/agents/doc-sync-onboarding.md` com as
skills `doc-sync-onboarding` e `learnings`, após os gates e a revisão independente.
Conferidos o diff real, os componentes e testes alterados, os tokens e os documentos
da spec. Nenhum código, teste ou baseline foi alterado nesta etapa.

- `docs/apps/frontend.md`: composição e tokens atuais, fechamento do menu por
  Escape/saída de foco, referências e limites da validação com API simulada.
- `docs/PROGRESS.md`: andamento e evidências da spec pronta, com revisão/merge
  pendentes; não declara CI ou implantação verificados.
- `docs/LEARNINGS.md`: aprendizado de foco recuperável e preservação de nomes
  estáveis com `aria-pressed`, sem criar regra ou alterar o harness.
- `audit.md`, `tasks.md` e este registro: sincronização final, documentos afetados
  e remoção de seção vazia; revisão independente já executada distinguida do merge.

Conferidos sem alteração: `AGENTS.md` e `CLAUDE.md` (instruções e imports continuam
válidos), `docs/index.md` (nenhum documento criado/removido), `README.md` (setup e
comandos preservados) e `docs/architecture.md` (componentes, dependências e fluxos
HTTP preservados). Backend, banco, infraestrutura, contexto de produto e fluxo
GitHub não requerem atualização: a mudança se limita à apresentação frontend e
ao fechamento acessível do menu. `designsystem/README.md` já registra os tokens
confirmados no código. O diff documental e seus caminhos locais foram conferidos;
`git diff --check` passou sem saída após as edições. Corpo do PR conferido contra
auditoria, gates e limites; branch pronta para abertura do PR em `develop`, sem
declarar link, checks remotos ou integração ainda não observados.

## Revisão documentada do diff

Conferidos os componentes alterados contra `architecture.md`, `frontend.md`, `security.md` e regras de datas/dinheiro. Alterações limitadas à apresentação, duas divisões estruturais do hero e fechamento acessível do menu. Não há mudança em API, DTO, hooks de dados, autenticação, regras monetárias, rotas ou dependências. Nome, logo, fonte e artes permanecem os ativos originais.

As capturas foram observadas em desktop e amostras de mobile/tablet, incluindo todas as rotas em desktop, início em 390 px, produtos em 768 px e alertas em 320 px. Diffs representativos de landing mobile, login tablet e 404 mobile foram examinados; as diferenças correspondem à escala, espaçamento e superfícies documentados. As baselines públicas foram regeneradas explicitamente após essa revisão, preservando os diffs anteriores para consulta. A revisão independente subsequente confirmou o diff e amostras das capturas; isso não representa aprovação visual humana.

## Critérios e cobertura

| Aceite | Evidência |
|---|---|
| AC01 | `audit.md` contém inventário real e P0–P3; sem páginas fictícias |
| AC02–03 | Capturas antes/depois; tokens e estilos comuns; testes de identidade e tokens; gráfico/tabela exatos preservados |
| AC04 | Playwright mede overflow e alvos em quatro larguras, inclusive títulos longos e menu de ações |
| AC05–06 | TDD do menu; testes de teclado/movimento reduzido; axe WCAG A/AA; foco explícito e scroll-padding |
| AC07 | 350 testes de API cliente/UI cobrem navegação, login, monitoramento, atualização, alertas, paginação e interrupção sem alterar contratos |
| AC08 | Estados de dashboard e sessão, erros, vazios e carregamentos na suíte visual; sucesso e falhas na suíte Vitest |
| AC09 | 128 casos na rodada anterior; após AC11, 40 casos afetados confirmados sem atualizar baselines, lint/build e 350 Vitest repetidos |
| AC10 | Auditoria, plano, documentação do design system e galeria local de comparação |
| AC11 | Red de três sintomas em 1280 px; Green de 12 casos em quatro larguras; confirmação final afetada de 40 casos, revisão de capturas e marca única acessível |

## Artefatos locais

Galeria: `frontend/playwright-report/spec-0030/comparison.html`. Inclui antes/depois desktop de dez rotas/estados, capturas finais de 320/390/768 px e 24 mapas de diferenças das referências públicas. Verificação com `HTMLParser` encontrou 74 imagens referenciadas e nenhuma ausente. Capturas e traces de execução ficam ignorados pelo Git; as baselines públicas são versionadas. Dados de produto nesses testes são ilustrativos.

## Limites e handoff

Não executados nesta correção: integração com backend/banco/Mercado Livre real, dispositivo físico, leitor de tela manual, Firefox/Safari, auditoria completa das propriedades Figma por API, suíte visual inteira após AC11, deploy e integração em develop. CI da rodada anterior verde; checks da correção aguardam push. A operação Mercado Livre permanece na Issue #127. A spec fica `pronta`; revisão independente executada sem achados concretos. Implementação entregue na [PR #175](https://github.com/SamiaLuvanice/bestprice/pull/175); aguarda revisão da entrega e merge. A worktree permanece disponível durante a revisão.
