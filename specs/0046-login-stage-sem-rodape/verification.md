# Evidências da spec — 0046

Data: 04/11/2026, America/Sao_Paulo.

## Observado

- Acesso público a `https://bestprice-stage.pages.dev/login` no navegador, sem autenticação. Conferidos formulário, marca, textos, ação Entrar verde, Mostrar senha, retorno ao início e rodapé “BestPrice · Acompanhe com clareza”. Conferidas apresentações larga e estreita; isto não constitui QA de implementação.
- Recursos publicados observados no documento: `/assets/index-BAE8c1Ke.js` e `/assets/index-fLKsQPfE.css`. O estilo da coluna visual larga referencia `/assets/login-left-ByvqY1EO.webp`; a fotografia não ficou visível na captura consultada. Sua renderização deve ser conferida antes de validar fidelidade no Figma; não se assume que a área branca capturada seja uma decisão de remoção da imagem.
- `gh api repos/SamiaLuvanice/bestprice/contents/specs?ref=develop --jq '.[].name'`: última spec remota 0045; a listagem local também termina em 0045. Próximo número: 0046.
- `gh api repos/SamiaLuvanice/bestprice/commits/stage --jq '.sha'`: `05b09deca19d7d44c8c30ece776a2e9bf2b55341`. É a ponta da branch consultada, sem comprovação de correspondência com o deploy observado.
- `gh issue create --repo SamiaLuvanice/bestprice --title '[0046] Preservar login de stage, sincronizar Figma e retirar rodapé' --label enhancement --body-file specs/0046-login-stage-sem-rodape/spec.md`: criada a [Issue #239](https://github.com/SamiaLuvanice/bestprice/issues/239). Consultas GitHub funcionaram com acesso de rede fora do sandbox; a falha inicial do diagnóstico de autenticação dentro dele não demonstrou credencial inválida.
- Referência Figma já registrada: `LZVtUEAycEzfbwL0H5YL3r`. Na consulta inicial, os quadros históricos de login eram desktop `59:44` (1440 × 1040) e mobile `59:602` (390 × 844), conforme evidências anteriores das specs 0042/0043. Essa primeira tentativa pelo MCP não confirmou o conteúdo remoto; a edição posterior pelo Chrome está registrada abaixo.

## Bloqueio inicial do MCP

A sessão foi criada, mas a primeira consulta `use_figma`, somente de leitura,
retornou: “You've reached the Figma MCP tool call limit on the Starter plan.”
Na etapa inicial, nenhuma escrita no arquivo havia sido realizada. Depois disso,
a responsável pediu expressamente: “faça as alterações no figma pelo chrome”.
A edição normal pela interface web foi autorizada e executada; não foi criada
bridge nem feita chamada MCP adicional para contornar sua cota.

## Atualização pelo Chrome — 04/11/2026

Concluída às 11:20, America/Sao_Paulo, no arquivo BestPrice IA existente.

| Quadro atualizado | Dimensões | Evidência exportada pelo Figma |
|---|---|---|
| [02 · Entrar · Desktop, 59:44](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=59-44) | 1440 × 1040 | [figma-desktop.png](evidence/figma-desktop.png) |
| [02 · Entrar · Mobile, 59:602](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=59-602) | 390 × 844 | [figma-mobile.png](evidence/figma-mobile.png) |

- A referência de stage foi aberta no Chrome. A fotografia carregou corretamente nessa consulta: coluna esquerda e formulário à direita no desktop. Isso resolve a limitação da captura inicial em que a foto não aparecia.
- Preservados os IDs dos quadros originais e as páginas Desktop/Mobile. Substituídas somente as composições internas antigas do login; nenhuma outra tela foi editada.
- Desktop: fotografia original preservada à esquerda, em coluna de 720 px, com formulário na coluna direita. Mobile: formulário sem fotografia lateral.
- Marca oficial preservada como imagem independente, quadrada de 48 × 48 px, sem recorte arredondado nem alteração da imagem.
- Conteúdo atualizado para “Entrar na sua conta”, subtítulo de stage, E-mail/Senha vazios, controle visual Mostrar senha, botão Entrar verde `39FF14`, orientação sobre o Mercado Livre e “Voltar para o início”. Retirados textos antigos de criação de conta e o sufixo IA da marca do login.
- Não há rodapé, divisória inferior ou faixa reservada ao bloco “BestPrice · Acompanhe com clareza” nos dois quadros exportados. A composição ocupa a altura completa sem descontar o rodapé.
- Texto, campos, botão e ícone são camadas editáveis. Conferido o painel de tipografia dos títulos: texto nativo, 38 px desktop e 30 px mobile. Nenhuma captura de tela foi usada como camada do desenho.
- Grupos novos identificados como `0046 · Formulário stage · Desktop` (`206:2`) e `0046 · Formulário stage · Mobile` (`207:22`). As composições internas antigas foram removidas após a criação das novas; não ficaram versões concorrentes no canvas.
- Os quadros foram conferidos visualmente no editor e as duas exportações PNG nativas foram abertas localmente para inspeção. Sem corte de títulos, orientação ou ação de retorno nos quadros entregues.
- A fonte Arial não apareceu na busca do Figma web. Aplicada Arimo, disponível no editor, como equivalente próximo; estilos ausentes da importação foram substituídos pela família disponível. Títulos usam tracking de −2,5%, marca −1,1%. Essa equivalência é uma limitação explícita, sem promessa de paridade tipográfica pixel a pixel. A fonte da aplicação não foi alterada.
- Exportação mobile concluída pelo botão da interface, embora a espera programática pelo evento de download tenha expirado. O PNG efetivamente salvo em Downloads foi localizado pelo nome da exportação e copiado para evidence/. Não se inferiu sucesso apenas do clique.

AC04 demonstrado para os quadros estáticos acima, com a equivalência de fonte
registrada. Na etapa de design, os demais critérios ainda aguardavam a
implementação da aplicação, verificada na seção seguinte.

## Implementação local — 04/11/2026

Worktree `.worktrees/feature-0046-issue-239-login-stage-sem-rodape`, branch
`feature/0046-issue-239-login-stage-sem-rodape`, base origin/develop `72689fe`.
Issue #239 confirmada aberta e branch vinculada via gh issue develop.

Produção: o rodapé usa o mesmo matcher /login do React Router, incluindo barra
final e maiúsculas; a condição também vale durante carga/erro da sessão. A
superfície de login tem altura mínima 100svh, sem desconto de 72px, sem altura
fixa e sem ocultar rolagem. LoginForm, Brand, fontes, assets, tokens, API, backend,
banco e dependências permanecem iguais à base.

| Verificação | Resultado real |
|---|---|
| Red de rodapé: App.test com filtro mostra login sem rodapé | 2 falhas esperadas por footer presente; Green 2/2 após correção |
| Red da altura: Playwright login-footer.spec.ts, projeto viewport-1280 com CSS antigo | Falhou por 968 px em viewport de 1040 px, exatamente a reserva de 72 px; restaurado 100svh |
| Red do achado de revisão /login/ e /LOGIN | 2 falhas nessas variantes, 2 entradas nominais passaram; correção com matchPath |
| Green final direcionado App/LoginForm/rotas | 66/66, 3 arquivos |
| npm run lint | Aprovado após o último ajuste de produção/testes |
| npm test -- --run --maxWorkers=2 | 397/397, 35 arquivos, exit 0, 199,87 s |
| npm run build | TypeScript/Vite aprovados; 2662 módulos |
| node --test .github/scripts/*.test.cjs | 50/50 |
| Impeccable detect frontend/src/App.tsx --json | [] (sem ocorrências) |
| Relatório de complexidade --changed origin/develop | Nenhum .py alterado, confirmado pelo reviewer |
| Playwright public-pages.spec.ts --grep login$ --workers=2 --update-snapshots | 8/8; somente as oito baselines login 320/390/768/1280, light/dark |
| Playwright login-footer.spec.ts interaction.spec.ts brand.spec.ts redesign.spec.ts review-corrections.spec.ts public-pages.spec.ts --grep 'login\|senha' --workers=2 | 28/28 finais, 42,7 s; inclui altura completa, identidade, teclado/movimento reduzido, axe/responsividade e snapshots |
| QA independente, script temporário de sessão | 6/6 cenários, exit 0; carga/503/rede/recuperação, variantes e outros rodapés |
| git diff --check | Aprovado |

Os comandos npm/Playwright foram executados em frontend/ da worktree; servidor
isolado em 5186. Nenhuma execução dependeu de conta real. Relatórios de origem:
[frontend](frontend-report.md), [revisão](review-report.md) e [QA](qa-report.md).
Todos os cenários de aceite estão demonstrados localmente nos limites da QA.

A revisão independente apontou e revalidou um P2: igualdade literal de pathname
divergia das URLs aceitas pelo React Router. Regressão Red/Green e matchPath
resolvem esse achado. O reviewer aprovou expressamente as oito baselines; nenhuma
captura de outra tela foi alterada. Pares light/dark finais são byte-idênticos
também em 768 (SHA-256 D26F81E7505707754EB8F21BE2DC403F1D612D192EABA35CD6A1905C5025B552)
e 1280 (B45DCF660F2CDB1F59764DB1D5B952F82A892603357BD4D14D38484A2F661D9C).

## Suíte visual global e comparação com a base

`npm run test:visual -- --workers=2 --max-failures=12`: 196 previstos,
67 passaram, 12 falharam e 117 não rodaram após o limite, em 3,1 min.
Quatro falhas eram snapshots de login intencionalmente antigos, agora renovados
e revalidados na execução pertinente de 28/28. As outras oito eram landing/marca:
logo 34px contra expectativa de 40px, e 801 pixels diferentes nas baselines
de landing, light/dark em 320 e 390. A suíte global não é declarada verde.

Para separar a mudança dessa dívida anterior, criado checkout detached temporário
`check-0046-base` em origin/develop 72689fe. `npm ci --offline --no-audit`
instalou 395 pacotes. Executado em porta 5187:
`npm run test:visual -- brand.spec.ts public-pages.spec.ts --project=viewport-390 --project=viewport-320 --grep 'marca (landing|inicio):|landing pública' --workers=2`.
Os oito casos reproduziram as mesmas falhas na base. As quatro capturas atuais
de landing foram comparadas entre base e feature e são byte-idênticas:
320/light/dark SHA-256 91ABF4E3ABA250858A63A66F59082A9BB5FD0DE99B9854DB567D5F41645D4801;
390/light/dark SHA-256 197BBA00579537DB2536B3629FE322D0C6DAA8B910D08BF0032AF8C799C9236B.
O checkout temporário foi removido após confirmar caminho absoluto dentro
de .worktrees e ausência de alterações rastreadas; a worktree da feature permanece.

## Limites da entrega

Esta entrega inclui implementação local, testes, revisão e QA. O login publicado
em stage não foi alterado por esta tarefa. Não houve teste local de autenticação
contra backend/PostgreSQL reais, nem dispositivos assistivos/teclado virtual reais.
Backend, infraestrutura e ação de release não foram alterados; os checks remotos
devem ser conferidos no SHA atual da PR antes da integração. A spec não é
implementada antes da integração; a PR #240 foi integrada conforme registro abaixo.

As alterações preexistentes no checkout principal foram preservadas. A implementação
seguiu plano, worktree baseada em origin/develop, TDD, gates e doc-sync final.

## Doc-sync final — 04/11/2026

Executado como último agente, após a última alteração de código, gates pertinentes,
revisão independente e QA. Conferidos código/diff, teste novo de altura, testes de
rotas, spec/plano/tarefas e os relatórios frontend/review/QA, sem alterar produção,
testes ou baselines nesta etapa.

`docs/apps/frontend.md` deixa de descrever o rodapé como parte do login e registra
altura mínima 100svh, matcher da rota, estados de sessão, conteúdo preservado e
origem/limites Figma. `docs/PROGRESS.md` consolida os resultados locais e mantém
PR, CI remoto e integração pendentes. `docs/LEARNINGS.md` registra o aprendizado
revelado na revisão sobre igualdade literal de pathname e matcher do roteador.

`AGENTS.md` e `CLAUDE.md` conferidos sem edição: a mudança não afeta instruções,
onboarding de ferramentas ou harness. `README.md`, `docs/index.md`,
`docs/architecture.md`, `docs/product-context.md`, `docs/database.md`, guias de
backend/infraestrutura e `designsystem/README.md` não exigem mudança: setup,
catálogo, arquitetura, direção do produto, contratos, dados, assets e tokens
permanecem iguais. Não foi criado documento de módulo novo nem alterada regra
do harness para um aprendizado ainda localizado.

A suíte visual global permanece explicitamente não verde pelas falhas anteriores
comprovadas na base; não se atribui êxito aos 117 casos que não executaram.
Não foram repetidos testes de aplicação por não haver nova alteração de código.
Sem commit, publicação, integração ou deploy nesta etapa.

Validação documental executada: `git diff --check` aprovado; script Python local
confirmou cercas Markdown equilibradas e links relativos da 0046 existentes nos
cinco documentos tocados nesta sincronização.

## Integração e limpeza — 04/11/2026

- PR #240 confirmada MERGED para develop em 04/11/2026 às 14:55:41
  (America/Sao_Paulo), commit b3315883b51b3a3550e67fc40969c2983339f4b3.
- Issue #239 confirmada CLOSED. O [CI 41880936096](https://github.com/SamiaLuvanice/bestprice/actions/runs/41880936096)
  foi aprovado no head 441c1776f0ad78eb71a05c510421b4b483b569af; checks de
  frontend/backend/automações/política/CI e Cloudflare Pages aprovados.
- Após git fetch origin, a ancestralidade de 441c177 em origin/develop foi
  confirmada. A worktree da feature estava limpa, com somente dist, node_modules,
  resultados de testes/PR e tsbuildinfo ignorados e regeneráveis. Sem .env,
  dados desconhecidos, Compose ou volumes criados pela tarefa.
- Caminho absoluto da worktree conferido sob .worktrees antes da remoção.
  git worktree remove sem força, git branch -d e exclusão somente da branch
  remota feature/0046-issue-239-login-stage-sem-rodape concluídos.
- Checkout principal atualizado por fast-forward, mantendo as alterações
  preexistentes do usuário. O rascunho inicial não rastreado da 0046 foi movido,
  sem descarte, para a pasta de artefatos 0046-intake-local-preservado.
- Conclusão documental registrada na Issue #241, sem alteração de código,
  testes ou snapshots; sem necessidade de repetir gates locais de aplicação.
  Promoção para stage solicitada separadamente; não se afirma deploy antes da validação.

## Handoff da implementação (registro anterior)

Implementação entregue; aguarda revisão na [PR #240](https://github.com/SamiaLuvanice/bestprice/pull/240)
para develop, com Closes #239. Commit de código `9f49eab89262a18535963310bc10938c5216fd79`
publicado; pre-commit/commit-msg aprovados, sem bypass e sem atribuição de agente
nos commits. Worktree limpa após o commit de código, sem alteração de dependências.

A consulta inicial de 04/11/2026 observou Cloudflare Pages em andamento e o
workflow CI enfileirado; não se declarou aprovação de CI ou sincronização de
Project a partir disso. O resultado deve ser conferido nos checks do SHA atual.
O registro dos links de entrega ocorre após o doc-sync, sem nova alteração
de código, testes ou snapshots. PR aberta; sem merge, promoção ou release.
