# Verificação — Spec 0015

## Implementação local — 13/10/2026

Base `origin/develop` em `ab7ff8e07eb7cfd0aa935790b11e74ae74c22781`.
A SPA usa a logo oficial copiada para `frontend/src/assets/logo-bestprice.png`,
tokens de `designsystem/index.html`, tema por `prefers-color-scheme` e fundos sólidos
com desfoque progressivo. Entrada e área autenticada compartilham a identidade.
Foram preservados cliente HTTP, contratos, dados, mensagens e ações das specs
0011–0013. A spec ainda não foi integrada em `develop`.

## Gates executados

| Gate | Resultado observado |
|---|---|
| Logo | SHA-256 da cópia e de `designsystem/logo-bestprice.png` igual a `E91BEA395901B59BCA16AB9C5615C945FE92E9AEFFD4BB1D1B34DE1D08E4556F` |
| TDD da marca | Dois testes novos falharam por ausência da imagem antes da implementação e passaram após a cópia e uso nos cabeçalhos; os dois arquivos afetados tiveram 36 testes aprovados |
| `npm run lint` | Exit 0 após última alteração de código |
| `npm test -- --run --maxWorkers=2` | 22 arquivos, **242 testes aprovados**, exit 0 após última alteração de código. A primeira execução simultânea a build/Compose teve cinco timeouts; os dois arquivos afetados passaram isolados e as duas execuções completas com dois workers passaram |
| `npm run build` | Exit 0, 47 módulos, logo 491,53 kB, CSS 28,22 kB e JS 280,55 kB após última alteração de código |
| `git diff --check` | Exit 0 na revisão independente após a última alteração de código |

Os gates do backend e das automações GitHub não foram repetidos: nenhum código,
contrato, schema, script ou workflow dessas partes mudou. Vitest/build precisaram
rodar fora do sandbox por `spawn EPERM`; isso não representa falha de aplicação.

## Navegador e integração

O QA usou Chromium com Playwright e axe sobre a SPA Vite e fixtures HTTP sintéticas,
sem incluir fixtures no produto. Artefatos temporários em
`%TEMP%\bestprice-0015-qa\`: `matrix.cjs`, `results.json`, `actions.json`,
`actions-entrar.json`, `supplement.json` e `captures\`. A matriz tem 54 combinações
base (nove superfícies × dois temas × 320/768/1280 px), 36 estados adicionais de
sessão/painel/notificações em ambos os temas a 320/1280 px e 80 capturas de dez
ações nos estados ocupado/erro em ambos os temas a 320/1280 px: **170 capturas de
casos**. Há ainda quatro capturas de fallback sem blur/movimento reduzido e três do
primeiro smoke real. Trocar o tema com a página aberta preservou o e-mail digitado.
Não foi encontrado overflow horizontal do documento nos casos. As respostas 401/503
dos cenários de erro são intencionais e ficaram registradas no console do navegador.

O QA identificou que o botão do título de oportunidade media 22 px de altura.
Foi ajustado para mínimo de 44 px; a rechecagem claro/escuro × 320/1280 px não
encontrou alvo inferior a 44 × 44 px entre 13 controles visíveis amostrados.
Escape e retorno de foco passaram em cinco superfícies; Tab/Shift+Tab permaneceram
no diálogo de detalhe, com foco visível. Movimento reduzido deixou animações em
0,00001 s. Capturas específicas do fallback sem blur estão em
`captures\fallback-no-blur-*.png`. O axe encontrou zero violações em 13 amostras;
em duas amostras do menu de linha a 320 px, dez nós de texto sob a sobreposição
ficaram inconclusivos para contraste. Razões calculadas dos tokens: texto secundário
5,57:1 claro e 7,28:1 escuro; rosa 5,37:1 claro e 5,20:1 escuro; texto preto no
verde 15,49:1; borda de controle 3,62:1 claro e 6,29:1 escuro. O pixel composto
do vidro não foi medido em todas as superfícies. O cálculo conservador da camada
escura `rgba(29,29,31,.96)` sobre branco produz `#262628`: o rosa `#ff3ea5`
atinge **4,66:1**. O QA revalidou menu e diálogo escuros em 320/1280 px, com
capturas `postfix-dark-dialog-*.png`; o reviewer aprovou o delta. A margem de
contraste depende de manter base e opacidade do vidro coerentes.

Menus de conta/linha não consultam dados ao abrir; detalhe não tem esqueleto próprio
na abertura (erro aparece na área autenticada); confirmação não consulta dados
ao abrir. Esses estados são N/A justificados, não lacunas ocultas da matriz.

Com Compose isolado e PostgreSQL local, `GET /api/health` respondeu 200 com
`database: ok`. Uma conta de teste local foi provisionada. No navegador da SPA
servida por Nginx, `GET /auth/me` retornou 401 esperado antes da entrada; login
200, dashboard 200, notificações 200 e logout 204. O painel mostrou o estado
vazio de zero produtos, sem overflow ou erro JavaScript. Em seguida foi inserido
diretamente no banco isolado um produto **sintético** com dois preços e vínculo com
a conta local. Um segundo smoke em Chromium abriu o painel e o detalhe/histórico,
exibiu confirmação de parada, confirmou `DELETE /api/tracked-products/{id}` (204),
viu a linha desaparecer e encerrou a sessão (204). Respostas do detalhe e histórico
foram 200; nenhum erro JavaScript. Evidência em `real-product.json` e capturas
`real-product-*.png`. Não houve chamada à integração externa do Mercado Livre.

## Revisão independente

O `arch-reviewer` confrontou spec, plano e diff: nenhum achado bloqueante.
Confirmou logo idêntica à origem, nomes acessíveis, tema sem persistência,
fallback sólido, cores semânticas e contratos intactos. Um ícone de marca e classes
sem uso foram removidos; a correção de alvo de toque foi revisada e aprovada.
O parecer é estático, complementado pelo QA de navegador acima. O QA aceitou
AC01–AC05 e AC08 sem defeito visual remanescente; os limites de contraste
inconclusivo sob o menu, navegador único e integração externa permanecem registrados.

### Revalidação orquestração — 13/10/2026

`arch-reviewer` e `qa` reexecutados na worktree após o PR #49 (CI remoto verde no
SHA `31a3fa8`). Pareceres: **aprovado com ressalvas** / **aceito com ressalvas**.

Achado importante tratado nesta passagem: `.brand-logo` tinha `border-radius: 12px`,
em tensão com AC02 (sem recorte). O raio foi removido; a superfície de apoio da
logo e `object-fit: contain` permanecem. CSS órfão `.brand-icon` também removido.
Ressalvas remanescentes conscientes: contraste do vidro escuro com margem fina
(~4,66:1 no pior fundo calculado); classe residual `tone-blue` (cor rosa via token);
matriz visual e artefatos só em `%TEMP%\bestprice-0015-qa\` (não no Git).

Gates reconfirmados nesta revalidação (worktree `frontend/`): lint exit 0;
`npm test -- --run --maxWorkers=2` — 22 arquivos, **242 passed**; build exit 0;
SHA-256 da logo ainda `E91BEA39…556F`. Smoke Compose: `GET /api/health` 200
`database: ok` e SPA Nginx 200; fluxo login→produto não foi reexecutado. A matriz
de 170 capturas **não** foi re-rodada após o ajuste do `border-radius` da logo.

### Revisão do ajuste AC02 (logo) — 13/10/2026

Revisão do commit do ajuste da logo (reescrito sem trailer de IA; conteúdo idêntico ao
`c37bd6e`, hoje `d0ac44e`).

- `arch-reviewer`: **aprovado com ressalvas**, sem achado bloqueante. Parecer estático:
  AC02 atendido por leitura do CSS, sem referência órfã a `.brand-icon`, tamanhos
  inalterados (AC04). Apontou o trailer de IA na mensagem do commit (corrigido) e a
  ausência de capturas pós-ajuste.
- `qa`: **aceito com ressalva estética não bloqueante**. Chrome headless, API simulada
  por fixtures, script em `%TEMP%\bestprice-0015-qa-logo\`. Entrada e painel × claro e
  escuro × 320/768/1280 px (12 cenários): logo 1254×1254 inteira, caixa quadrada,
  `border-radius` 0, `object-fit: contain`, sem overflow horizontal. SHA-256 idêntico
  (`e91bea39…556f`) no ativo oficial, no `src`, no `dist` e no PNG servido. Lint, 242
  testes e build verdes.
- Ressalva: no tema escuro a logo é um quadrado branco de cantos retos sobre o
  cabeçalho escuro, consequência do fundo opaco do PNG oficial; aceita sem alteração.
- Limites: navegador único, sem leitor de tela nem dispositivo físico, axe e matriz
  completa de superfícies não refeitos nesta passada, sem serviços reais.

## Sincronização do onboarding

Após o ajuste AC02 (remoção de `border-radius` em `.brand-logo` e CSS órfão
`.brand-icon`), o agente `doc-sync-onboarding` reexecutou na worktree.
`docs/apps/frontend.md` passa a registrar que a logo é exibida inteira, sem
recorte/`border-radius`, com `object-fit: contain` e superfície
`--color-logo-surface`. `docs/PROGRESS.md` e este `verification.md` já
traziam a revalidação arch/QA e os gates reconfirmados (lint, 242 testes, build).
`AGENTS.md`, `CLAUDE.md` e `docs/index.md` foram conferidos e não exigiram
edição. Regras em `.agents/` não mudaram — `.agents/sync.ps1` não foi necessário.
Nenhum documento de backend, banco, infraestrutura ou contrato precisou mudar.

## Critérios e limites

| Critério | Evidência |
|---|---|
| AC01–AC02 | Capturas da matriz, tokens comuns, logo oficial idêntica em entrada e cabeçalho |
| AC03 | Temas claro e escuro, troca ao vivo sem perda de estado, verificações de contraste e fallback de vidro no QA |
| AC04 | 320/768/1280 px sem overflow do documento; tabela mobile empilhada |
| AC05 | Testes de foco/diálogo existentes, inspeção de teclado/axe, alvo de toque corrigido e movimento reduzido |
| AC06 | 242 testes, smoke com API/banco, nenhum contrato ou lógica de dados alterado |
| AC07 | `.agents/rules/frontend.md`, `workspace.md` e registro de extensões em `designsystem/README.md` |
| AC08 | `results.json`, `actions.json`, `actions-entrar.json` e 170 capturas de casos em `captures\`, com origem fixture ou API real indicada |

Os artefatos de navegador estão em pasta temporária local e não integram o Git nem
o CI. Não houve validação com leitor de tela, outros navegadores ou dispositivo
físico. A integração externa Mercado Livre continua limitada pelas credenciais
ausentes, conforme as specs dependentes.

## Handoff por PR

PR [#49](https://github.com/SamiaLuvanice/bestprice/pull/49) aberto da branch
`feature/0015-issue-48-design-system-oficial` para `develop`, com `Closes #48`.
No SHA `31a3fa8a68e1b0cecb56808c1e5457308febf9e8`, o workflow
[#38399404769](https://github.com/SamiaLuvanice/bestprice/actions/runs/38399404769)
aprovou `quality / Frontend`, `quality / Backend`, `quality / Automation`,
`PR policy` e `CI`; os jobs `resolve` e `sync` do Project também passaram.
O ajuste AC02 da logo foi publicado no SHA `9cb135e` (o commit do ajuste foi
reescrito para remover um trailer de autoria de agente, sem mudar o conteúdo). Nesse
SHA, os workflows [#38406514936](https://github.com/SamiaLuvanice/bestprice/actions/runs/38406514936)
e [#38406511104](https://github.com/SamiaLuvanice/bestprice/actions/runs/38406511104)
aprovaram `quality / Frontend`, `quality / Backend`, `quality / Automation`,
`PR policy`, `CI`, `resolve` e `sync`.

## Integração

O PR #49 recebeu aprovação independente no GitHub e foi integrado em `develop` em
13/10/2026 (13:41 UTC), no commit de merge `0600cb3`; a Issue #48 foi fechada pelo
`Closes #48`. A integração e este registro seguem em #50. Status da spec:
`implementada`. Permanecem os limites já declarados: matriz completa de capturas, axe e
fluxo com serviços reais não foram refeitos após o ajuste da logo, e a integração
externa do Mercado Livre segue sem credenciais.
