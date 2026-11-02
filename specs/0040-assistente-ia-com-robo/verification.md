# 0040 — Evidências de design e implementação

Situação em 31/10/2026: **implementação entregue para revisão na Issue #225**.
Os registros de 29/10 abaixo preservam a etapa anterior de design. A implementação
e seus limites estão na seção final, sem declaração de merge ou deploy.

Data: 29/10/2026. Situação: **correções aplicadas nos quatro quadros; aguarda validação visual; aplicação não implementada**.

## Quadros entregues no Figma

Arquivo existente: BestPrice IA (`LZVtUEAycEzfbwL0H5YL3r`).

| Quadro | Página | Dimensões | Link |
|---|---|---|---|
| Inicial desktop | 01 · BestPrice IA — Desktop | 1440 × 960 | [132:27](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=132-27) |
| Conversa desktop | 01 · BestPrice IA — Desktop | 1440 × 960 | [133:169](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=133-169) |
| Inicial mobile | 02 · BestPrice IA — Mobile | 390 × 1190 | [132:361](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=132-361) |
| Conversa mobile | 02 · BestPrice IA — Mobile | 390 × 1320 | [132:468](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=132-468) |
| Estados e recuperação | 00 · BestPrice IA — Design system | 1440 × 780 | [137:43](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=137-43) |

Os quadros da 0040 foram adicionados com nomes próprios, preservando as telas
anteriores para comparação. A posição dos quadros no canvas pode ser ajustada
durante a validação; os IDs acima identificam as apresentações.

## Conferência realizada

- Conferência visual dos cinco quadros na interface do Figma, usando enquadramento da seleção. A conversa mobile foi conferida integralmente em 390 × 1320, incluindo a navegação inferior.
- Robô original com transparência preservada, em destaque nas boas-vindas e como avatar discreto na conversa; sem imagem achatada da interface completa.
- Logo oficial copiada do asset já existente no arquivo, sem redesenho. Textos, superfícies e ícones foram importados como elementos editáveis, organizados em grupos de propósito.
- Uma importação de teste demonstrou que o texto permanece como camada de texto e expõe tipografia no painel de propriedades; o teste foi removido. A importação utiliza a fonte Inter disponibilizada pelo editor como substituição da família Arial declarada no SVG; a equivalência tipográfica com a SPA permanece para o planejamento.
- As telas iniciais apresentam quatro pesquisas ilustrativas, identificadas como exemplos. A conversa ilustrativa preserva o espaço de leitura, a escrita e a identificação de resposta de IA não verificada.
- O quadro auxiliar apresenta lista carregando, lista vazia, erro de listagem, envio em andamento, erro de envio com texto preservado e IA indisponível com acesso às pesquisas salvas.
- A hierarquia dos novos quadros foi conferida pela lista de camadas do editor; os quadros principais são independentes no nível da página. Cópias temporárias de posicionamento foram removidas.

## Prévias locais exportadas do Figma

As quatro prévias de telas foram atualizadas após a rodada de correções abaixo.
O quadro auxiliar de estados permanece como referência da entrega anterior.

- [Inicial desktop](design/desktop-initial.png), 1440 × 960.
- [Conversa desktop](design/desktop-conversation.png), 1440 × 960.
- [Inicial mobile](design/mobile-initial.png), 390 × 1190.
- [Conversa mobile](design/mobile-conversation.png), 390 × 1320.
- [Estados e recuperação](design/states.png), 1440 × 780.

As dimensões foram verificadas localmente com Pillow; a exportação inicial desktop
também foi aberta para conferência visual. O observador de download do navegador
retornou timeout, mas os arquivos acima foram encontrados na pasta de downloads e
copiados para esta spec. Não se usa o timeout como evidência de falha da gravação.
A conversa mobile também foi exportada e conferida nesta retomada. As cinco
imagens locais têm suas dimensões verificadas; a prévia desktop inicial revisada
foi aberta novamente para conferir marca, sidebar e posição da nova ação.

## Acesso e limites

O MCP oficial permitiu identificar o arquivo e suas três páginas, mas recusou as
chamadas seguintes por cota do plano Starter. A pessoa responsável autorizou a
alternativa pela interface do Figma e solicitou novas tentativas após as
interrupções do controle nativo. A edição foi concluída pelo navegador usando a
interface pública e importação vetorial; nenhuma bridge ou API privada foi criada.

O robô foi importado do arquivo fornecido. A extensão inicialmente recusou o envio
local; a pessoa responsável informou habilitar acesso a URLs de arquivo. A logo
foi reutilizada do próprio Figma. A importação vetorial não estabelece vinculação
completa aos componentes e às variáveis da biblioteca; essa adaptação, a tipografia
da aplicação, os alvos de toque e o contraste calculado devem ser consolidados no
planejamento e na implementação após aprovação visual.

Esta etapa não verifica chat real, banco, isolamento de contas, retenção, teclado
virtual, responsividade executável, limites da IA ou acessibilidade por tecnologia
assistiva. Não houve alteração de código da aplicação nem execução de lint,
testes ou build. Os critérios funcionais da spec permanecem desmarcados. O AC17
aguarda aprovação da pessoa responsável.

A Issue permanece pendente conforme o registro na spec: a revisão automática
recusou sua publicação externa. Não houve publicação de branch, PR, sincronização
com Project, merge ou deploy nesta etapa.

## Rodada de correções solicitada pela pessoa responsável

Pedido: elevar e reduzir o “IA” como expoente, retirar Início da sidebar e colocar
Nova conversa perto de Conversas recentes.

### Aplicado no Figma

- As marcas dos dois quadros desktop receberam “IA”, tamanho 14, posição local X=198/Y=24. Os textos correspondem aos nós `132:32` e `133:174`. O painel de propriedades foi utilizado para alterar fonte e posição; a captura da tela inicial confirmou o expoente.
- Início foi removido das duas sidebars desktop. A busca por `Navegacao-Início` identificou somente as duas entradas da proposta 0040; elas foram removidas sem alterar as telas anteriores.
- Os destinos restantes foram realinhados nos dois quadros. A conferência do painel retornou Y=126 para Assistente IA, Y=208 para Comparador, Y=272 para Histórico e Y=336 para Monitoramento. Assistente IA é o primeiro destino visível.

### Retomada concluída após restabelecimento do acesso

- A pessoa responsável informou “O acesso já foi restabelecido”. A mesma sessão autorizada do Figma voltou a aceitar edições; não foi utilizado outro navegador, API privada ou mecanismo indireto.
- Os dois cabeçalhos mobile apresentam IA em tamanho 12 e elevado, com separação do nome BestPrice. O símbolo oficial foi preservado como asset independente.
- Nos dois desktops, Nova conversa deixou o cabeçalho e passou para um botão de 312 × 44 junto ao título Conversas recentes. Ver todas continua no título da seção e os quatro registros permanecem visíveis abaixo da ação.
- Nos dois mobiles, Nova conversa aparece ao lado de Conversas recentes em um botão de 140 × 44. Ver todas as conversas permanece abaixo da lista. O botão antigo foi removido da área de título da conversa mobile.
- A navegação inferior mobile foi alinhada aos quatro destinos atuais: Assistente, Comparar, Histórico e Monitorar, sem Início.
- Os cabeçalhos e seções alterados continuam compostos de camadas editáveis. A área de mensagem, as respostas, o robô e os dados ilustrativos foram preservados.
- Os quatro quadros foram enquadrados e inspecionados visualmente, incluindo as versões mobile completas. As quatro exportações PNG foram comprovadas na pasta de downloads e copiadas para a spec; as dimensões conferidas são 1440 × 960, 1440 × 960, 390 × 1190 e 390 × 1320.

O bloqueio anterior da revisão automática por limite de uso foi resolvido para
esta retomada. A rodada de correções está entregue para validação da pessoa
responsável. Não houve alteração de código da aplicação, execução de gates,
publicação de Issue/PR ou implantação.

## Segunda rodada de correções — 29/10/2026

Pedido: retirar os emojis das entradas de conversas recentes, aproximar IA de
BestPrice e padronizar header/sidebar das demais páginas pelo Assistente.

- Nos quatro quadros do Assistente, os pictogramas e seus blocos de fundo foram
  removidos das quatro entradas. Títulos e datas foram realinhados à esquerda;
  Nova conversa, Ver todas e os indicadores de abertura continuam disponíveis.
- A sigla IA dos dois desktops passou de X=198 para X=190, preservando tamanho 14
  e altura. Nos headers mobile, passou de X=254 para X=244, com tamanho 12 e
  posição elevada.
- Comparador, Histórico e Monitoramento receberam o padrão de navegação do
  Assistente: sidebar branca de 240 px, marca com IA elevada, quatro destinos,
  ícones vetoriais, destaque rosa na página atual e assinatura inferior.
  Os headers desktop têm 80 px, título da página e acesso à conta.
- As três versões mobile receberam header de 390 × 80, com menu, marca oficial
  e avatar; navegação inferior de 390 × 64, com Assistente, Comparar, Histórico
  e Monitorar. O destino atual tem destaque rosa.
- A logo foi copiada do asset existente no próprio arquivo, sem redesenho.
  As novas seções são compostas de texto e vetores editáveis. O conteúdo das
  páginas internas e os quadros públicos de landing/entrada foram preservados.
- As sidebars desktop foram conferidas e alinhadas às mesmas linhas do
  Assistente. As dez prévias foram exportadas novamente; dimensões verificadas:
  Assistente desktop 1440 × 960, páginas internas desktop 1440 × 1040,
  Assistente mobile 390 × 1190 / 390 × 1320 e páginas internas mobile 390 × 844.

### Outros quadros atualizados

| Página | Desktop | Mobile | Prévias locais |
| --- | --- | --- | --- |
| Comparador | [59:153](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=59-153) | [59:681](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=59-681) | [desktop](design/desktop-comparator.png), [mobile](design/mobile-comparator.png) |
| Histórico | [59:204](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=59-204) | [59:716](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=59-716) | [desktop](design/desktop-history.png), [mobile](design/mobile-history.png) |
| Monitoramento | [59:254](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=59-254) | [59:752](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=59-752) | [desktop](design/desktop-monitoring.png), [mobile](design/mobile-monitoring.png) |

O MCP aceitou uma leitura de páginas nesta rodada e voltou a recusar chamadas por
cota Starter. As alterações foram concluídas pela interface pública autorizada.
Uma interrupção de conexão da aba exigiu reabrir o mesmo arquivo no Chrome; não
houve uso de API privada. Uma camada de texto solta criada durante a seleção foi
removida, preservando os sete quadros desktop existentes.

A entrega permanece exclusivamente de design e documentação, aguardando validação.
Não houve alteração de código da aplicação nem execução de testes/build/lint.

## Implementação — 31/10/2026

Issue: [#225](https://github.com/SamiaLuvanice/bestprice/issues/225).
Branch/worktree: `feature/0040-issue-225-assistente-ia`, em
`.worktrees/feature-0040-issue-225-assistente-ia`, base `origin/develop` `a9e76e3`.
O pedido de implementar autoriza a continuidade do design aprovado; a pessoa
responsável também autorizou explicitamente as exportações locais e a interface
do Figma após `get_design_context` retornar limite do plano Starter.

Foi conferido na interface o quadro 132:27, 1440 × 960, com três destinos, e usada
a exportação atual da 0043 (`design/desktop-current.png`), junto às versões de
conversa/mobile da 0040. Os elementos são HTML/React; nenhuma captura de página
é usada como asset. O robô original permanece em PNG com transparência: SHA256
`7D00C666C9292A79433CD751D61A1A4CA2E6324579A172537EE5D8A3BF3DFC33`, idêntico
na referência e em `frontend/src/assets/research/assistant-robot.png`. Os testes
conferem imagem carregada e razão de aspecto com diferença menor que 0,01.

### Ciclos e gates executados

| Comando/rodada | Resultado observado |
| --- | --- |
| `npm ci` | Instalou 395 pacotes do lockfile; nenhuma dependência adicionada. O audit reportou 12 vulnerabilidades moderadas preexistentes; sem atualização de dependências nesta tarefa. |
| `pre-commit install --hook-type pre-commit --hook-type commit-msg` | Hooks instalados. |
| `npm test -- --run src/assistant.test.tsx` antes da lista | Red: 1 teste falhou pela ausência da região Conversas recentes. |
| Mesmo comando após implementar a lista | Green: 1/1. |
| `npm test -- --run --maxWorkers=2` | 34 arquivos, **375 testes aprovados**, antes das correções finais da revisão. |
| `npm test -- --run src/assistant.test.tsx src/research.test.tsx src/dashboard/header.test.tsx src/navigation/routes.test.tsx --maxWorkers=2` | **47/47 aprovados** após as correções e os dois novos testes de primeiro envio e resposta tardia da sessão anterior. |
| `npm run test:visual -- assistant.spec.ts --workers=2`, base local 5184 | **32/32 aprovados**: quatro viewports × inicial, conversa, vazio, erro, IA desativada, carga da lista, texto sem espaços e shell/navegação. |
| `npm run test:visual -- assistant.spec.ts --grep 'shell:' --workers=2` | **4/4 aprovados** após o último ajuste de `aria-current`. |
| `node --test .github/scripts/*.test.cjs` | **50/50 aprovados**. |
| `npm run lint` e `npm run build`, após o último ajuste de código | Aprovados; **2.661 módulos** e asset local de **1.100,76 kB**. |
| Impeccable detect nos quatro arquivos de interface alterados | Um aviso: `border-top:22px solid` no pseudo-elemento da cauda do balão. Conferido: é o triângulo branco da referência, não uma borda de destaque em card; mantido. |
| `git diff --check` | Sem erro após normalizar o EOF do teste editado. |

Lint e build finais passaram após o último ajuste de código.
O início dos testes completos/visuais em sandbox não concluiu; as rodadas completas
e os navegadores foram executados com acesso ao ambiente local. Execução sem
resultado não foi contabilizada como aprovação. Não houve alteração no backend,
contrato, banco, dependências, workflow ou configuração operacional da IA.

### Aceite por comportamento

| Critérios | Evidência e limites |
| --- | --- |
| AC01–AC02 | Capturas inicial desktop/mobile, robô original idêntico, geometria preservada e marca oficial com IA elevada. |
| AC03–AC04 | Sugestões preenchem e focam o texto sem envio; vazio recebe validação; nova conversa limpa o rascunho; retomada prioriza mensagens e avatar pequeno. |
| AC05–AC07 | A UI solicita `kind=conversation`, offset 0 e limit 4 pelo contrato existente; quatro resumos reais da resposta, título/data/link; primeiro envio inclui a conversa e novo envio muda a ordem sem duplicatas. A demonstração usa respostas controladas, sem banco real. Autorização, expiração e ordenação permanecem no servidor existente (`backend/app/research/repository.py`). |
| AC08–AC10 | Estados distintos de carga, vazio, erro/retry, envio e IA indisponível; falha da lista preserva rascunho e envio; chat mantém erro, idempotência e texto para tentar novamente. Conversas salvas abrem com IA desativada. |
| AC11 | Avisos de Google, retenção, conteúdo não verificado e cotas mantidos, ligados ao campo por aria-describedby. Teste de logout/login resolve a lista antiga depois da nova sessão e comprova que o conteúdo anterior não aparece. |
| AC12 | 320/390/768/1280 sem overflow; em 1280 recentes à direita, mobile abaixo do formulário; título e mensagem longos sem espaços cobertos. |
| AC13 | Texto e envio alcançáveis por rolagem; medição confirma envio acima da barra móvel em 320/390/768. **Teclado virtual real iOS/Android não foi validado.** |
| AC14 | Axe sem violações em inicial/conversa nos quatro tamanhos; geometria mínima 44 × 44 dos controles conferida; Tab desktop, menu móvel e foco de sugestão cobertos. Não houve sessão manual com leitor de tela. |
| AC15 | Sem voz/anexos, fake data no produto, ativação de IA ou remoção de dados/rotas do comparador. Testes de rotas, histórico, conta e monitoramento mantidos. |
| AC16 | Capturas executáveis dos estados inicial/conversa/vazio/erro estão em evidence/. Retomada e atualização comprovadas contra a fronteira HTTP controlada; demonstração com dados persistidos reais continua pendente. |
| AC17–AC19 | Design anterior preservado no Figma; pedido atual autoriza implementar. IA elevada, Nova conversa junto de recentes, entradas sem pictogramas. |
| AC20 | Header/sidebar com três destinos da 0043, menu/conta únicos, mobile com três atalhos; monitoramento conserva subnavegação no fluxo e rotas internas. Rotas legadas permanecem. |

### Revisão independente

O papel `.agents/agents/arch-reviewer.md` encontrou dois P2: Tab desktop tentava
focar o botão móvel oculto; a subnavegação de Monitoramento sobrepunha a nova barra
móvel. Os dois foram reproduzidos em Red no Playwright, corrigidos e confirmados
na matriz final. A revisão posterior aceitou as correções, sem outros bloqueadores
no diff. Não houve Python alterado; complexidade backend não se aplica.

### Capturas executáveis

- [Inicial desktop](evidence/assistant-initial-1280.png) e [mobile](evidence/assistant-initial-390.png).
- [Conversa desktop](evidence/assistant-conversation-1280.png) e [mobile](evidence/assistant-conversation-390.png).
- [Vazio desktop](evidence/assistant-empty-1280.png) e [mobile](evidence/assistant-empty-390.png).
- [Erro desktop](evidence/assistant-error-1280.png) e [mobile](evidence/assistant-error-390.png).

Também foram preservadas as capturas de 320 e 768 px. São dados demonstrativos
exclusivos dos testes, não conteúdo introduzido na conta ou no código do produto.

### Pendências explícitas

Teclado virtual em aparelho real e fluxo com backend/banco/dados persistidos reais
não foram executados. A disponibilidade externa da IA continua conforme os limites
da 0034. A spec permanece `pronta`, sem marcação `implementada` antes de integração.
CI remoto, merge, deploy e sincronização com GitHub Project não são inferidos.

### Sincronização final de onboarding — concluída em 02/11/2026

A etapa começou em 31/10/2026 e foi retomada em 02/11/2026 após interrupção por
limite de uso, sem nova alteração de código. As datas históricas dos testes acima
foram preservadas. As edições documentais foram reconferidas após o stash
temporário dos hooks; o resumo de arquitetura foi reaplicado antes da conclusão.

O papel `.agents/agents/doc-sync-onboarding.md` conferiu o código e o diff final,
depois dos gates e da revisão independente, sem alterar código. Foram sincronizados
`docs/apps/frontend.md` (Assistente, recentes, shell e limites),
`docs/architecture.md` (composição e reuso do contrato), `docs/product-context.md`
(recorte local sem retirar o comparador do produto), `docs/PROGRESS.md` (andamento)
e `docs/LEARNINGS.md` (foco e subnavegação incorporada). As tarefas e esta evidência
também foram atualizadas.

`AGENTS.md` e `CLAUDE.md` foram conferidos e não exigiram edição: instruções,
referências do harness e fluxo de onboarding permanecem válidos. README, catálogo
de docs e guias de backend/banco/infraestrutura/GitHub não exigem mudança porque
setup, contratos, esquema, dependências, configuração e entrega não foram alterados.
A documentação de design já registra a variante rosa e o asset original.
PR e verificações remotas seguem como próximos passos; não houve merge ou deploy.
Na retomada documental, sete documentos e 117 links locais foram conferidos sem
destinos ausentes ou cercas Markdown abertas; `git diff --check` passou.

### Publicação para revisão — 02/11/2026

Implementação publicada no commit `fb46498`, com hooks de pre-commit e commit-msg
aprovados, sem bypass. [PR #226](https://github.com/SamiaLuvanice/bestprice/pull/226)
aberto em rascunho, da branch da feature para `develop`, com `Closes #225`.
A consulta ao PR comprovou CI iniciado e checks ainda em execução; não foi feito
merge. A spec continua `pronta` e a worktree fica preservada para revisão.
