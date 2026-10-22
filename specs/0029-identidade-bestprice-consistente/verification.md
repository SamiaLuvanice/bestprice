# Verificação — 0029

## Estado do planejamento

- Issue #167 aberta e vinculada à spec.
- Revisão de spec pelo papel `spec-reviewer`: nenhum bloqueio; AC01 e AC02
  ajustados para definir o padrão da marca e as superfícies móveis obrigatórias.
- Revisão pré-código pelo papel `arch-reviewer`: sem bloqueio; plano ajustado para
  explicitar tipografia oficial e cobertura Playwright em 390 px.
- `origin/develop` confirmado em `2df3129`; branch/worktree da Issue criada a
  partir desse commit.
- Contrato REST: nenhuma alteração prevista.

## Diagnóstico observado em 22/10/2026

Ambiente: Windows, Chromium local em
`C:\Users\luvan\AppData\Local\ms-playwright\chromium-1234\chrome-win64\chrome.exe`,
SPA/Vite na worktree, APIs interceptadas pelo Playwright. Os testes não usam
credenciais nem dados de produção. Viewports: 320, 390, 768 e 1280 px; altura de 640 px.

| Superfície antes | Evidência observada |
|---|---|
| Landing | Peso 750, família `SF Pro Text`, tracking `-.03em` |
| Início/Produtos/Alertas/detalhe | Peso 800, família `SF Pro Text`, tracking `-.03em` |
| Login compacto | Peso 750, tracking normal; `display:block` empilha ícone e nome (em 390 px: 119,97 × 86,22 px) |
| Não encontrada | Herda marca da conta, com peso 800 |
| Verificação/erro de sessão | Só imagem; não há nome visual `BestPrice` |

Capturas anteriores das rotas/estados estão em
`frontend/test-results/0029-before/brand-marca-<cenário>-identidade-e-logo-persistem-viewport-<largura>/`.
O diagnóstico inicial completou 34 cenários e teve 2 timeouts de ambiente nos estados
de sessão desktop; a execução Green posterior demonstrou esses estados. Os
registros completos de estilos, geometria, Console e respostas da imagem em 390 px
estão em `frontend/test-results/0029-red/.../observations.json`.

Nas tentativas móveis, a imagem permaneceu carregada: HTTP 200,
`complete: true`, `naturalWidth: 128` e 44/48 px quadrados. Não houve exceção JS.
O Console registrou 401 esperado da sessão de visitante; não foi observado erro
na requisição da logo. Foram repetidos navegação, volta, recarregamento, abertura
do menu público e ida/volta entre abas do navegador.

**Limite:** o desaparecimento intermitente relatado não foi reproduzido. Nenhuma
causa específica de carregamento, cache ou dispositivo foi confirmada. A correção
padroniza a identidade e o layout comprovadamente divergentes; a verificação de
persistência cobre o Chromium desktop com viewport móvel, sem equivaler a um
teste em aparelho físico/Safari móvel. Não há evidência para afirmar a causa ou
a resolução de uma falha exclusiva desses dispositivos.

## Red → Green

- `npm test -- --run src/App.test.tsx -t 'mantém a marca'`: **1 falha esperada**,
  pois o cabeçalho da sessão não continha texto `BestPrice`.
- `npx playwright test brand.spec.ts --project=viewport-390 --workers=2
  --output=brand-red --grep 'marca (landing|login|inicio|sessao-carregando)'`:
  **4 falhas esperadas**: peso 750/800 em vez de 600 e nome visual vazio no estado
  de sessão. Artefatos movidos para `frontend/test-results/0029-red/`.
- Após correção: `npx playwright test brand.spec.ts --workers=2
  --output=test-results/0029-green`: **36/36 passaram**, incluindo axe em cada
  cenário. Capturas e `observations.json` estão no diretório informado.
- Após esse Green, o teste passou também a guardar observação imediatamente após
  recarregar e retornar de rota, com identificação de cada passo. O bypass
  temporário usado para o diagnóstico anterior à correção foi removido do teste
  definitivo. A QA independente confirmou o delta: **18/18 passaram** nos projetos
  320/390, com **76 observações válidas** e axe sem violações. Executou na porta
  5175 com artefatos em `frontend/test-results/0029-qa/`, evitando disputa com o
  Vite da matriz pública na porta 5173.

Para executar Playwright neste ambiente, definir
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` para o executável acima. A versão padrão
headless_shell 1248 pedida pelo pacote não está instalada. As tentativas iniciais
na sandbox falharam `spawn EPERM`; foram repetidas com permissão de processo,
e essas falhas de infraestrutura não contam como Red.

## Gates do frontend

Todos os comandos da aplicação foram executados em `frontend/` da worktree.

| Comando | Resultado observado |
|---|---|
| `npm ci` | 395 pacotes; 0 vulnerabilidades |
| `npm run lint` | Passou, incluindo confirmação após o delta do teste |
| `npm test -- --run` | 31 arquivos e 348 testes passaram |
| `npm run build` | Passou; 2654 módulos processados |
| `npx playwright test brand.spec.ts --workers=2 --output=test-results/0029-green` | 36 passaram; axe sem violações |
| `npx playwright test public-pages.spec.ts --workers=4 --update-snapshots --output=test-results/0029-baselines` | 24 passaram; 18 baselines anteriores atualizadas e 6 novas em 390 px |
| `npm run test:visual -- public-pages.spec.ts redesign.spec.ts --workers=4 --output=test-results/0029-final` | 84 passaram (2,3 min), sem atualizar snapshots; comparação das 24 baselines e axe existente sem violações |
| `impeccable.cmd detect <seis arquivos JSX alterados> --json` | Exit 0, retorno `[]` |

O primeiro Vitest completo apontou 347/348: o teste legado do cabeçalho procurava
`src` no elemento `img` semântico, que agora agrupa ícone e nome. Foi ajustado para
conferir o asset dentro da apresentação acessível. O primeiro build apontou a
opção `exact` indevida no matcher da Testing Library; removida antes dos gates
verdes acima. Não houve alteração adicional de comportamento por esses ajustes.

## Critérios de aceite e revisão visual

| AC | Evidência |
|---|---|
| AC01 | 36 cenários da marca: família oficial, peso 600, tracking `-.011em` e grafia conferidos por estilos computados; componente `Brand` compartilhado |
| AC02 | Matriz móvel 320/390: imagem carregada, quadrada, visível, descoberta por hit test após navegação/reload/retorno/troca de aba; QA independente do teste final: 18/18 casos e 76 observações válidas |
| AC03 | 36 cenários sem scroll horizontal/colisão da marca com navegação/ações; matrizes responsivas existentes também executadas |
| AC04 | Uma apresentação acessível por superfície: `img` chamada BestPrice ou link BestPrice — Início com conteúdo decorativo; axe sem violações nos 36 casos |
| AC05 | Tabela anterior, capturas before/Green e JSON de observações; intermitência não reproduzida explicitamente documentada |

Capturas depois: `frontend/test-results/0029-green/brand-marca-<cenário>-identidade-e-logo-persistem-viewport-<largura>/<cenário>.png`.
O coordenador conferiu e aprovou visualmente o login em 390 px antes/depois.
Também foram inspecionados login em 1280 px e rota 404 em 320 px; ícone preservado,
conjunto horizontal e nome legível. A QA independente aceitou as 12 baselines
públicas em 320/390 px; o coordenador inspecionou as 6 imagens claras em 768/1280 px
e confirmou igualdade binária de cada par claro/escuro, aprovando as 12 maiores.
As 24 baselines estão revisadas.
A revisão independente de arquitetura aprovou o código final após retirar o
bypass temporário do diagnóstico; não deixou achados pendentes.

## Documentação e pendências

T04–T09 concluídas: gates, QA móvel, revisão das 24 baselines e revisão independente
do código aprovados. T10 concluída pelo papel `doc-sync-onboarding`, após a última
alteração de código: README, guia frontend, progresso, documentação do design
system e aprendizado geral sincronizados. AGENTS.md, CLAUDE.md, índice e arquitetura
foram conferidos e não exigiram mudança: instruções, catálogo e topologia permanecem
compatíveis com o escopo da SPA. Esta etapa documental não executou testes nem
alterou código.

Os caminhos `frontend/test-results/0029-*` citados acima são artefatos ignorados
pelo Git e apenas locais; não estarão disponíveis no checkout de outra pessoa.
As baselines em `frontend/tests/visual/__screenshots__/` são versionadas. Backend,
API e banco não foram alterados; Ruff, pytest e integração PostgreSQL locais não
foram executados por esta spec restrita à SPA. Não houve validação com conta real,
aparelho real, Safari móvel ou implantação externa.

O [PR #168](https://github.com/SamiaLuvanice/bestprice/pull/168) foi aberto para
`develop`. T11 está parcialmente concluída: PR preparado; CI remoto e integração
pendentes no momento deste registro. Os checks atuais ficam no PR. O status da
spec permanece `pronta` até a integração; a revisão independente local já foi
concluída.
