# Verificação — 0035

Data: 27/10/2026. Issue [#201](https://github.com/SamiaLuvanice/bestprice/issues/201).
Worktree: `.worktrees/feature-0035-issue-201-paper-bridge-local`.
Base: `origin/develop`, SHA `b0e674e`.

## Resultado

Primeira versão funcional entregue no documento autorizado, com CLI, biblioteca,
tokens reais, exclusão mútua, screenshots e verificação observável. A spec permanece
`pronta`: ainda não houve integração em develop. A composição entregue é frame
mais textos; geração integral de telas e outras capacidades permanecem pendentes.

## Gates executados

| Comando / verificação | Resultado real |
| --- | --- |
| `npm test` em tools/paper-bridge | 11 testes passaram, 0 falhas, 0 skips; última execução após o ajuste de timeout CDP |
| `npm run check` | Sintaxe de src/, tests/ e scripts/ verificada |
| `node --test .github/scripts/*.test.cjs` na raiz | 50 testes passaram, 0 falhas |
| `pre-commit run` | Whitespace, EOF, JSON, conflitos, arquivos grandes e chaves privadas passaram; nenhuma alteração de código |
| `npm run test:live` | Uma execução completa passou com 11 operações verificadas, 19:49:40–19:50:18 UTC |
| Revisão independente arch-reviewer | Aprovada após corrigir 4 achados; revisão estática, sem operação concorrente no canvas |
| Backend / frontend / PostgreSQL / radon | Não executados: nenhum arquivo dessas camadas foi alterado |
| actionlint | Não encontrado; nenhum workflow foi alterado |

O runner Node foi inicialmente impedido de criar subprocessos pelo sandbox
(`spawn EPERM`); testes e check foram executados fora dele com autorização.
Hooks pre-commit e commit-msg instalados na worktree.

### TDD e regressões

- Política: 2 testes falharam por ausência das rejeições esperadas; passaram após
  restringir origem CDP e nome exato do documento.
- Tokens: teste falhou por `background` ausente; passou após extrair a identidade
  real. Corrigido também o caminho relativo inicial do adaptador.
- Validação/coordenadas: 2 testes falharam por aceitar número parcial e NaN;
  passaram após rejeitar observações inválidas.
- Revisão: testes adicionais cobrem finalização com falhas, preservação de etapas
  parciais e validação integral da composição antes de desenhar.
- A suíte live detectou falha ao substituir um texto por outro mais curto. A
  edição passou a emitir eventos reais de teclado e confirmar via Move; a mesma
  camada foi ampliada e reduzida com ID preservado na execução completa verde.

## Aceite observado

| AC | Evidência e limite |
| --- | --- |
| AC01 | CDP local retornou Chromium 152 / protocolo 1.3. Documento `BestPrice Bridge Test · Paper` identificado pelo título e botão. Testes recusam outro documento, origem externa, credenciais e caminhos no endpoint. |
| AC02 | Frame original `2-0` renomeado para `BestPrice IA - Dashboard`; painel e DOM relidos com 1440 × 900, X=0/Y=0, Fill FFFFFF e background RGB 255/255/255. |
| AC03 | Gesto de frame criou novas camadas reais (`5-0` e `7-0`), depois configuradas e verificadas. Repetir atualização preservou `7-0`. Seleção de frame recém-criado agora usa ID observado, incluindo correção revisada para nomes padrão iguais. O caso adicional de criação com outro Frame padrão não pôde ser repetido na última sessão; não é apresentado como teste verde. |
| AC04 | Texto principal `4-0`: BestPrice IA, X=80/Y=64 locais, 48px, peso 700, cor RGB 199/0/94, Arial fallback oficial e parent `2-0` comprovado por ancestral DOM. ID preservado em duas execuções consecutivas. |
| AC05 | CLI e API executadas: status, create-frame, add-text, create-screen, validate e screenshot. Inspeção e adaptador disponíveis; argumentos/erros com resultado JSON e exit 1 testados. |
| AC06 | Screenshots antes/depois e JSON/JSONL registrados; teste de lock demonstra rejeição concorrente e liberação. Sem retry cego, rollback ou remoção de camadas. |
| AC07 | Adaptador lê CSS real, aliases, cores, tipografia, espaços, raios, sombras, componentes, layout, rotas e media queries. Cor primária difere da cor de ação. Fontes proprietárias não distribuídas. |
| AC08 | Composição repetível de frame `5-0` em X=1600 e texto `9-0` em X=40/Y=32 locais verificada; edição preservou ID. Componentes completos não mapeados são rejeitados antes de desenhar. |
| AC09 | Experimentos copiados sem alteração de conteúdo; README, exemplos, testes offline/live e plano de evolução entregues. Relatórios brutos e imagens ignorados pelo Git. Sincronização final de onboarding registrada abaixo. |

## Evidências locais

Arquivos em `tools/paper-bridge/reports/`, não versionados:

- `2026-10-27T19-26-29-616Z-f421573f-create-frame.json`: frame original atualizado,
  propriedades relidas e screenshots antes/depois.
- `2026-10-27T19-30-22-835Z-a23e98ca-add-text.json`: texto principal com tamanho,
  peso, cor e parentesco. Screenshot `*-after.png` mostra o resultado no canvas.
- `live-success-2026-10-27.json`: extração de 11 registros originais de
  `operations.jsonl`, de 19:49:40.790Z a 19:50:18.659Z; todos success/verified true.
- `2026-10-27T19-50-18-331Z-eafcf268-screenshot-after.png`: captura da execução
  completa verde. Imagens são evidência complementar, sem diff automático de pixels.
- `live-smoke.log` e `fresh-frame.log`: tentativas posteriores que falharam na
  reconexão; não substituem nem são contadas como execução verde.

## Descobertas de UI e correções

- Nome: duplo clique na camada abre `input.tree-item-input`.
- Dimensões: comboboxes Width e Height. X/Y: inputs junto a `.field-icon` X e Y.
- Fill: `.panel-root` com cabeçalho Fill e `input[data-color-input]`.
  Escopo obrigatório: Selection colors acrescenta outros inputs de cor ao painel.
- Opacidade: combobox Opacity; Color opacity dentro de Fill. Radius: painel Radius
  com slider e combobox sem nome. Border: cabeçalho com botão de adicionar. Setters
  de opacidade, radius e border ficam pendentes, sem alegação de funcionamento.
- Um gesto sobre frame pode criar irmão ou frame aninhado. O parentesco é
  estabelecido no painel de camadas e comprovado no DOM renderizado.
- Drop necessita aguardar frames de renderização antes de soltar o mouse.
- Coordenadas usam limites CSS do frame renderizado, incluindo zoom e pan.
  A escala interna/DPR 2 não é utilizada como zoom.
- Paper minimizado suspendeu screenshots e atualizações. Restaurar a janela
  recuperou o funcionamento, sem reiniciar aplicativo ou alterar configurações.

## Última sessão e pendências

A execução completa verde antecedeu pequenos ajustes finais: timeout CDP passou de
10 para 30 segundos, esperas de renderização ganharam limite de 3 segundos e o
check de sintaxe passou a tratar caminhos com espaços. Gates offline passaram
depois desses ajustes; a última repetição live não foi concluída.

Nas reconexões finais, o endpoint `/json/version` respondeu, e uma conexão de
diagnóstico levou 13,3 segundos. A listagem retornou Paper, Recents e BestPriceIA,
sem uma aba identificável pelo título do documento de teste; a CLI retornou erro
seguro para abrir exatamente uma aba autorizada. O documento de teste apareceu
nos recentes. A tentativa de abri-lo pela UI não concluiu (timeout de
visibilidade/estabilidade); também houve indicação de interação humana na janela.
Nenhuma alteração foi direcionada a BestPriceIA.

Para repetir: abrir `BestPrice Bridge Test`, restaurar a janela, expandir a árvore
e rodar `npm run test:live`. Se o CDP não estiver habilitado:

```powershell
& "$env:LOCALAPPDATA\Programs\Paper\Paper.exe" --remote-debugging-port=9222 --remote-debugging-address=127.0.0.1
```

Pendentes: novos documentos, retângulos próprios, setters de opacidade/cantos/borda,
HTML via fluxo público (documentado pelo fornecedor, não testado), composição fiel
de componentes React e regras responsivas. A unicidade comprovada limita-se ao
documento pequeno com toda a árvore expandida/visível; DOM virtualizado pode omitir
simultaneamente elementos da árvore e do canvas.

Não houve publicação/deploy, merge em develop ou comprovação de sincronização do
Project. O PR e CI são parte do handoff, não substituem o teste local do Paper.

## Doc-sync-onboarding

Executado após a última alteração de código, gates finais e revisão independente.
Conferidos os módulos, testes, exemplo, scripts, spec, plano e evidências descritas
neste relatório. Atualizados README raiz (entrada de execução), arquitetura
(ferramenta independente e limites), infraestrutura (CDP loopback, lock e comandos),
índice (guia da bridge), PROGRESS (andamento e resultados) e LEARNINGS (eventos de
teclado, confirmação da edição e espera do drop). Tarefas distinguem sincronização
concluída do handoff/PR ainda pendente.

`AGENTS.md` e `CLAUDE.md` conferidos sem edição: as instruções do harness não
mudaram. Banco, backend, frontend, contexto do produto e fluxo GitHub não exigiram
edição, pois a bridge é tooling local e não altera essas camadas ou o processo
publicado. Nenhum código ou configuração gerada foi alterado nesta sincronização.
Não foi executado novo teste live, nem inferido PR, CI, merge ou deploy.
`git diff --check` passou na revisão documental; os links locais adicionados
apontam para os arquivos presentes na mesma worktree.
