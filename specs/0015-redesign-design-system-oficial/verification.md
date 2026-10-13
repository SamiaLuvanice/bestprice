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

## Sincronização do onboarding

Após a última alteração de código, o agente `doc-sync-onboarding` conferiu o diff e
os componentes alterados. `docs/apps/frontend.md` agora descreve a identidade,
os temas, o fallback do vidro, a logo e os limites da inspeção visual; `docs/PROGRESS.md`
registra implementação, revisão e QA locais. `AGENTS.md`, `CLAUDE.md` e `docs/index.md`
foram conferidos e não exigiram edição: o fluxo do harness e o catálogo de documentos
continuam corretos. As projeções de `.agents/` foram sincronizadas com
`.agents/sync.ps1`. Nenhum documento de backend, banco, infraestrutura ou contrato
precisou mudar, pois a alteração de código se restringiu à apresentação da SPA.

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
ausentes, conforme as specs dependentes. CI remoto e revisão humana serão
registrados após o PR.
