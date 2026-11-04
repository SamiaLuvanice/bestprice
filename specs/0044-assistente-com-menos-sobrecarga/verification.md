# Verificação — 0044

## Preparação do PR — 04/11/2026

Após continuidade solicitada pela responsável, `git fetch origin` confirmou
origin/develop em `9d3b482a924d14fa8ff9f33cfb1fdac4a5044acb`, sem avanço sobre a
base validada. Issue #231 confirmada OPEN e nenhum PR aberto correspondente.
Branch renomeada para `feature/0044-issue-231-assistente-simples` na mesma worktree.
Hooks pre-commit/commit-msg instalados. Nenhum código de aplicação ou teste mudou
desde os gates, revisão, QA e doc-sync finais registrados abaixo.

## Publicação da Issue — 03/11/2026

Após autorização explícita da responsável, criada a
[Issue #231](https://github.com/SamiaLuvanice/bestprice/issues/231) com o corpo
preparado em issue-body.md. `gh issue view 231 --repo SamiaLuvanice/bestprice
--json number,title,url,state` confirmou número, título e estado OPEN.
O bloqueio anterior da criação da Issue está resolvido. Publicação de código/PR,
commit, push, CI e integração continuam pendentes; nenhum código foi alterado
nesta atualização de rastreabilidade.

## Implementação da SPA — 03/11/2026

Implementação local entregue na worktree `.worktrees/codex-0044-assistente-simples`,
branch `codex/0044-assistente-simples`, base origin/develop
`9d3b482a924d14fa8ff9f33cfb1fdac4a5044acb`. Spec `pronta`; não integrada.
Os registros de design abaixo desta seção são históricos e não descrevem mais o
estado atual do código. A confirmação da responsável determina os mesmos cortes
editoriais do desktop atual em desktop e mobile.

Referência: figma-current/ (quatro exports de 03/11, 11:03–11:06), frames
132:27/133:169/132:361/132:468; conteúdo desktop prevalece sobre os controles
antigos ainda presentes no export mobile. MCP bloqueado pela cota; nenhum dado
remoto posterior a esses exports é declarado validado.

| Gate executado na worktree | Resultado observado |
|---|---|
| `npm run lint` em frontend/ | exit 0, inclusive após os ajustes de testes |
| `npm test -- --run --maxWorkers=2` | 34 arquivos, 381 testes passaram; exit 0; 146,39 s |
| `npm run build` | TypeScript e Vite passaram; exit 0; 2661 módulos |
| `PLAYWRIGHT_BASE_URL=http://127.0.0.1:5186 npx playwright test assistant.spec.ts --workers=2` | 32 passaram; repetição final com capturas dos estados corrigidas: 32 passaram, exit 0, 54,7 s |
| `impeccable.cmd detect <arquivo> --json`, para AssistantPage.tsx, RecentConversations.tsx e assistant.css | três resultados `[]`; não substitui QA visual/assistiva |
| `node --test .github/scripts/*.test.cjs` | 50 testes passaram, 0 falhas |
| `git diff --check` | exit 0, sem erro de whitespace |

Na primeira suíte Vitest sem limite de workers, 373 passaram e 8 falharam: seis
cenários excederam o tempo sob carga; o teste da primeira conversa tentava abrir
recentes antes da nova montagem, e o detector de conteúdo considerou o orçamento
ilustrativo um preço de oferta. A espera pelo heading carregado e a exceção exata
do orçamento, limitada ao literal e arquivo, corrigiram os dois casos. A repetição
com dois workers comprovou os 381 testes sem aumentar timeouts nem alterar outras
telas. Os ciclos Red/Green estão em implementation-evidence.md.

O Playwright verifica 320/390/768/1280 px, regiões recolhidas, Escape/foco,
rascunho sem POST, erro/vazio/carregamento/IA desativada, alvos de 44 px, axe,
proporção do robô e texto longo sem overflow. A captura adicional 390 × 844
comprovou aviso e envio acima da navegação fixa. Os testes usam API controlada;
não comprovam PostgreSQL, provedor real, teclado virtual físico ou leitor de tela.
Não houve atualização de baselines de outras telas.

Sem alteração em Python, persistência ou contrato REST; gates backend não são
atribuídos a esta mudança. Revisão independente aceita em
[implementation-review.md](implementation-review.md) e QA aceita em
[implementation-qa.md](implementation-qa.md), sem achados de produto P0–P2
pendentes. A lacuna das capturas dos estados foi corrigida e reinspecionada.
Doc-sync-onboarding executado como última etapa após código, gates e revisões;
ver [relatório final](doc-sync-report.md). `actionlint` não instalado; workflows intactos.
Issue/PR e CI externos pendentes: a
revisão automática rejeitou a criação da Issue; nenhum caminho alternativo usado.

Logs brutos conferidos e preservados somente em
`frontend/test-results/0044-unit-gate.log` e
`frontend/test-results/0044-visual-gate.log`, ignorados pelo Git. Capturas Playwright
também são artefatos locais ignorados. Não incluir esses arquivos em publicação.
Os resumos acima e os pareceres preservam a evidência versionável. Corpos de
[Issue](issue-body.md) e [PR](pr-body.md) preparados para revisão, sem publicação.

Onboarding: `docs/apps/frontend.md`, `docs/architecture.md`,
`docs/product-context.md` e `docs/PROGRESS.md` sincronizados com o código real.
`AGENTS.md` e `CLAUDE.md` conferidos sem edição: não há alteração de instruções,
fluxo do harness ou referências de entrada. O índice de docs e os guias de banco,
backend e infraestrutura permanecem adequados porque seus contratos não mudaram.
Não houve nova alteração de código após os gates/revisões. A spec permanece
`pronta`; implementação entregue, aguarda revisão/publicação e integração.

## Histórico — entrega de design no Figma

Data: 03/11/2026, America/Sao_Paulo.
Resultado: **design entregue para validação**, com revisão independente de escopo
e QA visual aceitas. A spec permanece `rascunho`; não houve implementação da aplicação.

## Alvos e entrega

Arquivo: [BestPrice IA](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=132-27).
Sessão MCP: `cfd66acc-db44-4f33-a7a3-0526a32af351`.

| Quadro | ID preservado / novo | Antes | Depois |
|---|---|---|---|
| Desktop inicial | `132:27`, preservado | 1440 × 960 | 1440 × 960 |
| Desktop conversa | `133:169`, preservado | 1440 × 960 | 1440 × 960 |
| Mobile inicial | `132:361`, preservado | 390 × 1190 | 390 × 844 |
| Mobile conversa | `132:468`, preservado | 390 × 1320 | 390 × 844 |
| Conteúdo sob demanda e estados | `184:200`, novo | — | 1440 × 1280 |

A prancha nova fica na página Mobile `6:521`, em X=0/Y=3000, separada das telas.
Os quatro quadros anteriores mantêm seus nomes, IDs e posições no canvas.
As capturas atuais estão em `before/` e `after/`. `export-manifest.json` registra
origem, dimensões e SHA-256 dos nove PNGs finais desta entrega.

## Resultado observado

- Pergunta inicial curta, uma orientação opcional e um único exemplo no campo.
- Três sugestões reunidas sob “Ver exemplos”, recolhido no estado inicial.
- “Conversas recentes” recolhido na conversa, em desktop e mobile; a mesma
  apresentação compacta também foi adotada na chegada para preservar o foco.
- Robô original menor: no mobile inicial, o campo passou de aproximadamente
  Y=450 para Y=286. Pergunta, campo, aviso essencial e envio cabem em 390 × 844.
- Google, possível uso do conteúdo gratuito e cuidado com dados pessoais
  permanecem visíveis no compositor, antes da ação de envio na leitura visual.
- Detalhes de retenção, backups, limites e contexto aparecem na prancha do acesso
  “Sobre a IA e seus dados”; não há repetição de 90 dias nos quadros principais.
- Respostas mantêm identificação de IA e dados de mercado não verificados.
- Navegação mobile recebeu rótulos Assistente, Histórico e Monitorar junto dos
  ícones originais. A ausência de rótulos já estava presente nas exportações antes;
  o ajuste evita depender da interpretação dos ícones na proposta revisada.
- Prancha representa exemplos, recentes e informações abertos, contador próximo
  do limite, envio, erro recuperável, cota atingida, indisponibilidade, vazio e carga.
- Ajuste da QA: “banco ativo/API em execução” foi substituído por “A remoção ocorre
  na limpeza automática, a cada hora, enquanto o serviço está ativo”, preservando
  bloqueio após 90 dias, não renovação ao editar e ressalvas sobre backups/Google.

## Preservação, editabilidade e ferramenta

O MCP inspecionou os quatro quadros e suas páginas. A leitura desktop identificou
Inter, ausência de estilos locais de pintura/texto e coleção BestPrice · Base com
30 variáveis. A cota Starter interrompeu a descoberta de bibliotecas/componentes
e impediu as capturas MCP e a edição programática subsequentes.

A edição continuou pela interface autenticada do Figma no Chrome. Não foram
criadas bridges, extensões, plugins ou servidores. SVGs com texto e vetores foram
colados pela interface e alinhados nos quadros existentes; não se inseriu uma
imagem rasterizada da página. Logo e robô permanecem os assets originais.

A interface confirmou camada nativa **Texto**, família **Inter**, tamanho 28 px
no título da prancha. A correção de retenção editou as camadas de texto existentes
`184:229` e `184:230`. Os grupos de conteúdo anteriores foram preservados ocultos;
novos grupos têm nomes de finalidade, como Campo-de-mensagem e Ver-exemplos-recolhido.
Elementos temporários de posicionamento foram removidos e o quadro final foi
reconferido. O quadro auxiliar foi deixado desbloqueado para edição posterior.

Não se afirma vínculo integral a componentes, auto-layout ou variáveis. A biblioteca
não pôde ser pesquisada após a cota. Valores e fonte seguem a referência existente;
a futura implementação deve mapear os controles aos componentes locais aprovados.

Histórico de versões conferido pela interface:

- **Antes da 0044 — Assistente com menos sobrecarga**, salvo antes da primeira
  alteração; duas entradas com o mesmo título resultaram das tentativas de
  confirmação, ambas preservadas.
- **0044 — Assistente com menos sobrecarga**, proposta inicial desta edição.
- **0044 — Revisão visual final**, após incorporar a QA editorial e os rótulos mobile.

O observador de download da primeira captura expirou, mas o PNG foi efetivamente
salvo pelo navegador. As demais exportações foram conferidas no diretório de
downloads e copiadas para a pasta da spec; nenhuma captura foi presumida existente.

## Cobertura dos critérios

| Critério | Evidência desta etapa | Limite |
|---|---|---|
| AC01 | Inventário editorial em review.md | Atendido no intake |
| AC02 | Inicial desktop/mobile com pergunta, ajuda e compositor | Representação visual |
| AC03 | Acesso recolhido e três exemplos na prancha | Preenchimento/rascunho não executados |
| AC04 | Três fatos essenciais visíveis nas quatro telas | Não houve envio real |
| AC05 | Política completa e ação Fechar informações na prancha | Teclado/foco não testados |
| AC06 | Retenção em um único ponto de detalhe; identificação nas respostas | Conferência visual |
| AC07 | Limite de entrada e contador ilustrados; cota atual preservada | Regra/contador não executados |
| AC08 | Estados de operação representados | Recuperação não executada |
| AC09 | Inicial em 390 × 844 sem rolagem para os essenciais | Sem teclado virtual ou zoom |
| AC10 | Acesso recolhido nas duas conversas | Abrir/fechar e retomada não executados |
| AC11 | Capturas sem cortes/overposição; rótulos mobile | 320/768/1280, contraste e teclado pendentes |
| AC11a | Prancha documenta descrição curta e detalhes separados | Leitor de tela pendente |
| AC12 | Quatro antes e cinco depois, origem e dimensões registradas | Aprovação visual da responsável pendente |

As caixas funcionais da spec continuam abertas. Não foram criadas conexões de
protótipo; a prancha é representação estática, sem alegação de cliques funcionais.

## Revisão independente e verificações

- Papel spec-reviewer: plano da etapa de design aceito sem bloqueio de produto.
- Papel arch-reviewer: escopo aceito, sem alteração de contrato, fonte de dados,
  política ou promessa de ofertas verificadas. Parecer registrado em plan.md.
- QA independente: cinco imagens finais e quatro antes inspecionadas; delta de
  rótulos mobile e redação de retenção aceito. Parecer e hashes em qa-review.md.
- Pillow verificou os nove PNGs; dimensões e hashes foram registrados em manifesto.
- `git diff --check -- specs/0044-assistente-com-menos-sobrecarga docs/PROGRESS.md`:
  conferência documental executada no fechamento, sem erros de whitespace.

AGENTS.md, CLAUDE.md e documentação pertinente foram conferidos. Não houve alteração
de código ou configuração da aplicação. Lint, testes, build e doc-sync-onboarding
não se aplicam a esta etapa somente de design e documentação.

## Rastreabilidade e pendências

A Issue continua sem publicação após a rejeição anterior da revisão automática,
que exigiu autorização explícita para enviar o rascunho ao GitHub. A autorização
atual para editar o Figma não foi interpretada como autorização de publicação.
Não houve PR, commit, push, merge, deploy ou sincronização de Project.

`refs/remotes/origin/develop` foi identificado localmente em
`9d3b482a924d14fa8ff9f33cfb1fdac4a5044acb`, sem fetch nesta etapa.
Não foi criada worktree de código porque a entrega é Figma e documentação.
Implementação futura exige Issue autorizada, fetch, worktree de origin/develop,
plano de aplicação, TDD, gates, revisão e doc-sync conforme as regras do projeto.

Próximo passo: validação visual da responsável, antes de planejar mudanças na aplicação.
