---
numero: 0012
titulo: Área do usuário — painel de monitoramento Mercado Livre
tipo: feature
prioridade: P1
status: rascunho
toca: [frontend]
depende_de: [0011, 0013]
---

# 0012 — Área do usuário — painel de monitoramento Mercado Livre

Issue: https://github.com/SamiaLuvanice/bestprice/issues/33

> **Pré-requisito de implementação:** esta spec só pode seguir para `/plan` e `/implement`
> depois que o PR #35 (spec 0013) estiver integrado em `develop`. Ela é **somente de
> interface** e não cria, altera ou estende endpoints, regras de domínio ou dados.

## Problema

A spec 0013 entregou o domínio do monitoramento de anúncios do Mercado Livre Brasil
(cadastro por URL, compartilhamento, consultas periódicas, estados de falha, alertas,
notificações e métricas do painel) e uma interface funcional, mas organizada como uma
sequência de blocos simples. A referência visual
`designsystem/area-usuario-monitoramento.png` define a área do usuário esperada:
navegação, hero com o campo de link, indicadores, oportunidades em cards, tabela de
produtos e linha do tempo de atualizações. Hoje a pessoa não tem essa organização,
não recebe confirmação antes de parar um monitoramento, não vê o carregamento como
estrutura da página e não tem um contador de notificações não lidas.

Afeta toda pessoa autenticada que usa o BestPrice. Não há incidente; é a apresentação
do caminho crítico do produto.

## Relação com a spec 0013

Comportamentos de domínio pertencem à 0013 e **não são redefinidos aqui**: validação de
URL, deduplicação, compartilhamento entre pessoas, concorrência, consulta periódica,
estados `lookup_status` / `last_attempt_status` / disponibilidade, `stale`, cálculo de
preço anterior, mínimo, máximo e variação, regra de “Baixaram de preço” e “Boas
oportunidades”, regras de alerta e notificação, isolamento por usuário e códigos de erro.
Esta spec define **como esses dados aparecem e são operados na interface**, usando apenas
o contrato mínimo da seção “Contrato mínimo da API BestPrice” da 0013. Autenticação e
tela de entrada pertencem à 0011.

Esta spec não regride o que a interface da 0013 já entrega (inclusive o AC-007 da 0013:
preço atual e anterior, mínimo, máximo, variação e horários de consulta/alteração visíveis
por produto). Continuam acessíveis: detalhe do produto com histórico paginado e todos os
instantes de consulta, “Atualizar agora”, criação/edição/pausa/exclusão de alerta,
notificações com “Marcar como lida” e “Carregar mais”.

## Comportamento esperado

### Convenções de apresentação

- **Valores desconhecidos:** preço atual ausente é **Preço indisponível**; demais preços
  ausentes (anterior, mínimo, máximo) são **Desconhecido**; variação e datas ausentes são
  **Desconhecida**. Nunca zero, “0%” ou traço que pareça valor.
- **Dinheiro:** valores chegam como strings decimais e são exibidos em reais (“R$ 1.079,00”).
  Toda comparação entre valores monetários (ex.: decidir se um evento é queda ou alta) usa
  comparação decimal exata dos valores recebidos, sem conversão para ponto flutuante e sem
  comparação textual.
- **Tempo relativo** (fuso local do navegador), para um instante passado:
  menos de 1 minuto → **Agora**; menos de 60 minutos → **Há N min**; menos de 24 horas →
  **Há N h** (N em unidades inteiras, arredondado para baixo); caso contrário, se foi no dia civil anterior → **Ontem, HH:mm**; senão data e
  hora absolutas (**dd/mm/aaaa, HH:mm**). Instante no futuro (relógio adiantado) → **Agora**.
  O instante completo fica acessível ao foco e ao ponteiro. O texto é fixado quando a
  resposta da API que trouxe o dado chega e **não se atualiza sozinho** com a página aberta.
- **Prazo de nova tentativa** (`retry_after_seconds`), acrescentado após a mensagem da API:
  0 → “Tente novamente agora.”; 1 a 59 → “Tente novamente em N segundo(s).”; 60 ou mais →
  minutos arredondados para cima, “Tente novamente em N minuto(s).” (singular quando N = 1).
  Ex.: 90 → “Tente novamente em 2 minutos.”
- **Erros:** a mensagem do corpo de erro da API (0013) é a fonte de verdade. Resposta de
  erro sem corpo estável → **Não foi possível concluir a operação. Tente novamente.**
  Falha de rede → **Não foi possível conectar ao BestPrice. Tente novamente.** Somente 401
  encerra a sessão local e leva à entrada (0011).
- **Menus e painéis** (menu de ações da linha, painel do sino, menu da conta): Enter ou
  Espaço no botão abre; Tab e Shift+Tab percorrem os itens; Tab no último item ou
  Shift+Tab no primeiro sai e fecha; Esc fecha e devolve o foco ao botão que abriu. Não há
  navegação por setas.
- **Link externo:** o rótulo único é **Ver anúncio no Mercado Livre**, abre o endereço
  canônico em nova aba e indica que é link externo — no menu da linha e no detalhe.
- **Atualização das listas após uma ação:** indicadores e contador são recalculados pela
  API, mas itens e páginas já carregados de “Seus produtos” (inclusive páginas obtidas com
  “Carregar mais”) permanecem; só o item afetado é alterado ou removido.
- **Produto removido da lista** (parar de monitorar, ou 409/404 numa ação): a mensagem
  aparece numa região anunciada da seção “Seus produtos” e o foco vai ao título dessa
  seção; se a lista ficar vazia, o foco vai ao campo de link e a mensagem é anunciada numa
  região global da página.
- **Respostas concorrentes do painel:** quando mais de uma carga do painel estiver em
  andamento, prevalece a resposta da requisição mais recente; respostas de requisições
  anteriores que cheguem depois são descartadas.
- **Abrangência:** estas convenções valem para as superfícies novas desta spec (cabeçalho,
  sino, hero, indicadores, oportunidades, “Seus produtos”, linha do tempo, seção Alertas e
  diálogo de confirmação). O conteúdo do detalhe herdado da 0013 mantém seus textos atuais
  (ex.: “Ainda não consultado”), exceto o rótulo do link externo e o fluxo de confirmação
  definidos aqui.

### Cabeçalho e navegação

No topo, a pessoa autenticada vê a marca BestPrice, a navegação **Início**, **Produtos** e
**Alertas**, um sino de notificações e o menu da conta. Nesta entrega a área é uma página
única: Início leva ao topo, Produtos à seção “Seus produtos” e Alertas à seção Alertas.
Após ativar um item, ele passa a ser marcado como atual (para tecnologias assistivas e
visualmente) e os demais deixam de ser. O menu da conta identifica a pessoa pelo e-mail (o
contrato não fornece nome) e oferece **Sair**. Se sair falhar, a mensagem de erro aparece
no cabeçalho e a sessão local é mantida até o encerramento ter sucesso.

### Sino de notificações

O contador mostra a quantidade de notificações **não lidas**, derivada da listagem de não
lidas da API; sem não lidas, não há contador; acima de 99, **99+**. O contador é
recalculado a partir da API (não decrementado localmente) no carregamento da página e após
marcar notificação como lida, criar/editar/ativar alerta e “Atualizar agora”. Não há
atualização periódica com a página parada nesta entrega.

Abrir o sino mostra até 5 notificações não lidas mais recentes (produto, preço observado,
alvo e criação), cada uma com **Marcar como lida**, e o link **Ver todas as notificações**,
que leva à seção Alertas. Sem não lidas: **Nenhuma notificação não lida.** Se a consulta
falhar, o sino não exibe número, informa **Notificações indisponíveis** (também no nome
acessível) e o painel oferece **Tentar novamente**.

Após **Marcar como lida** (no painel do sino ou na seção Alertas), o foco vai ao próximo
item da mesma lista; se não restar item, ao título do painel ou da seção. Marcar em um
lugar reflete no outro: o item aparece como lido na seção Alertas e sai do painel do sino.

### Hero

Título **Acompanhe o preço.** / **Compre na hora certa.** (destaque na segunda linha),
descrição **Cole o link de um produto do Mercado Livre e deixe o BestPrice acompanhar as
mudanças de preço para você.**, campo com rótulo acessível “Link do anúncio do Mercado
Livre”, placeholder `https://www.mercadolivre.com.br/...`, botão **Monitorar preço** e a
dica **Copie o link do anúncio no Mercado Livre e cole aqui.** Permanece a nota de que os
preços vêm das consultas do BestPrice ao Mercado Livre e podem diferir do checkout.

O campo é apenas obrigatório: não aplica validação de formato de URL do navegador, para que
a orientação venha sempre da API (0013).

O card de produto e o gráfico “Histórico de preço” da referência **não são reproduzidos**:
mostrariam produto, preço, estrelas, selo e variação que não pertencem à pessoa. O lado
direito do hero pode conter apenas ilustração abstrata, sem texto, número, preço, data,
nome de produto ou logotipo, oculta de tecnologias assistivas.

Durante o envio, o botão fica indisponível e aparece **Localizando produto...**; o resto
da página continua utilizável. Resultado:

- Novo monitoramento (201): **Produto adicionado ao monitoramento.**, campo limpo e produto
  visível em “Seus produtos” sem recarregar.
- Vínculo interrompido retomado (200): **Você voltou a monitorar este produto.**, mesmo
  efeito na lista.
- Erro: a mensagem da API aparece junto ao campo, anunciada a tecnologias assistivas, com o
  prazo de nova tentativa quando houver, e o texto digitado é preservado. Para
  `already_tracked`, aparece também **Ver produto**, que abre o detalhe do monitoramento
  existente.

### Indicadores

Quatro indicadores com ícone e valor vindos do resumo do painel:

| Indicador | Valor | Texto complementar |
|---|---|---|
| Produtos monitorados | `tracked_count` | nenhum |
| Baixaram de preço | `price_drop_count` | “nas últimas 24h” (é a janela fixada pela 0013) |
| Alertas ativos | `active_alert_count` | nenhum |
| Preço-alvo atingido | `target_reached_count` | “no alvo agora” (a 0013 conta condições válidas no momento, não um período) |

Não há setas de tendência nem deltas (“↑ 2”, “+2 neste mês”, “3 com preço próximo”,
“nos últimos 7 dias”): o contrato não fornece esses dados.

### Boas oportunidades

Subtítulo **Produtos monitorados que tiveram redução de preço recentemente.** Cards com
imagem (ou marcador neutro sem imagem), título, preço anterior riscado, preço atual,
selo de queda com o percentual (com seta e texto, não só cor), **Menor preço** com a
indicação de que é desde o primeiro registro no BestPrice, e **Preço observado:** seguido
do tempo relativo da última observação de preço. A ordem é a recebida da API. Ativar um
card abre o detalhe. Sem oportunidades, mas com produtos, a seção mostra **Nenhuma
oportunidade de queda nas últimas 24 horas.** Não há “Ver todos” (a API devolve até 5 e não
há lista completa de oportunidades).

### Seus produtos

Subtítulo **Todos os produtos que você está monitorando.** Ordem “mais recentes primeiro”,
indicada em texto. **Carregar mais** acrescenta a página seguinte sem repetir itens.

Cada produto mostra:

- **Linha principal** (em telas largas, colunas de tabela): Produto (imagem e título),
  Preço atual, **Variação** (percentual com sinal e seta de queda/alta, seguido de
  “vs. preço anterior”, sem data), Menor preço, Disponibilidade, **Preço observado** (tempo
  relativo da última observação de preço) e Ações.
- **Informação secundária** (em telas largas, linha secundária ou colunas adicionais):
  preço anterior, maior preço, **Última consulta** (`last_attempt_at`) e **Última
  alteração** (`price_changed_at`), ambas em tempo relativo pela convenção, e, quando
  houver alerta ativo, o selo **Alerta em R$ X**.
  Mínimo e máximo são identificados como desde o primeiro registro no BestPrice.
- Em telas estreitas, tudo isso aparece empilhado por produto, sem rolagem horizontal.

Estados: disponibilidade **Disponível**, **Indisponível** ou **Não confirmada**; anúncio
com `lookup_status=not_found` mostra **Anúncio não localizado no Mercado Livre** e o preço
como último conhecido; preço `stale` é rotulado como desatualizado; se a última tentativa
não foi `ok`, aparece aviso com o rótulo do resultado (rótulos da 0013), mesmo com
observação recente.

Ações: **Ver detalhes** e um menu com **Atualizar agora**, **Ver anúncio no Mercado Livre**
e **Parar de monitorar**. Busca, filtro e ordenação da referência **não** fazem parte desta
entrega (ver Fora de escopo).

### Atualizar agora pela linha

Enquanto a consulta está pendente, somente a linha afetada fica ocupada (indicação visual e
anunciada; suas ações desabilitadas); as demais linhas e o resto da página continuam
utilizáveis. O resultado aparece numa região anunciada junto da própria linha. Ao terminar,
o foco volta ao botão do menu de ações dessa linha.

| Resposta | Efeito na linha |
|---|---|
| 200 com `last_attempt_status=ok` | Dados da linha atualizados; mensagem **Consulta concluída.** |
| 200 com outro resultado (inclusive `lookup_status=not_found`) | Dados atualizados com o estado correspondente; mensagem com o rótulo do resultado da 0013 (ex.: “Anúncio não localizado no Mercado Livre”) |
| 429 (`refresh_not_due` ou `integration_rate_limited`) | Mensagem da API + prazo de nova tentativa; dados mantidos |
| 409 `tracking_inactive` ou 404 | Somente esse produto sai da lista; mensagem da API e foco conforme a convenção de produto removido |
| 502/503 ou rede | Mensagem de erro; a linha é recarregada para exibir a tentativa registrada, mantendo a mensagem visível |

Indicadores e contador do sino são recalculados após a consulta, sem descartar os itens e
páginas já carregados. “Atualizar agora” continua
disponível no detalhe, com os mesmos resultados.

### Parar de monitorar

Sempre pede confirmação, com o título **Parar de monitorar “<título>”?**, o texto **O
histórico de preços é mantido. Você pode voltar a monitorar colando o link novamente.** e,
**somente se o produto tiver alerta ativo**, a frase adicional **O alerta deste produto
será pausado.** Botões **Cancelar** e **Parar de monitorar**. Confirmar remove somente esse
produto da lista (demais itens e páginas carregadas permanecem), recalcula os indicadores e
informa **Você parou de monitorar este produto.** seguindo a convenção de produto removido
(mensagem e foco). Falha mantém o produto e mostra o erro.

- **Pela linha:** abre diálogo de confirmação. Cancelar (botão, Esc ou clique fora) não
  envia requisição e devolve o foco ao botão do menu de ações da linha. Em falha, o diálogo
  fecha, o erro aparece na região da linha e o foco volta ao botão do menu de ações.
- **Pelo detalhe:** a confirmação substitui o conteúdo do próprio diálogo de detalhe (não
  abre um diálogo sobre outro) e recebe o foco. Cancelar, Esc ou clique fora cancelam a
  confirmação e voltam ao conteúdo do detalhe (o detalhe não fecha) com o foco em “Parar de
  monitorar”. Confirmar com sucesso fecha o detalhe. Em falha, volta ao conteúdo do detalhe
  com o erro anunciado e o foco em “Parar de monitorar”.

### Atualizações recentes

Linha do tempo, mais recentes primeiro, apenas com os eventos de `recent_updates`:

| Evento | Texto |
|---|---|
| `price_changed`, atual menor que anterior | “**<título>** caiu de R$ X para R$ Y.” — seta para baixo |
| `price_changed`, atual maior que anterior | “**<título>** aumentou de R$ X para R$ Y.” — seta para cima |
| `price_changed` com valores iguais ou algum valor não numérico (evento inválido) | “**<título>** teve o preço alterado.” — sem valores e sem seta; valor não numérico nunca é formatado como R$ |
| `availability_changed` para `available` | “**<título>** voltou a ficar disponível.” |
| `availability_changed` para `unavailable` | “**<título>** ficou indisponível.” |

Cada item mostra o tempo relativo de `observed_at`. Título e imagem vêm do produto
correspondente já carregado; se ele não estiver entre os carregados, o texto usa **Um
produto monitorado** e oferece **Ver produto**, que abre o detalhe. Sem eventos: **As
mudanças confirmadas de preço e disponibilidade aparecerão aqui.** Não há eventos
“preço-alvo atingido” nem “próximo do preço desejado” nesta linha do tempo: preço-alvo
atingido aparece nas notificações. Não há “Ver todas” (a API devolve os últimos 20 eventos,
sem paginação).

### Alertas (seção)

Sempre exibida, inclusive no estado vazio. Lista as notificações de preço-alvo atingido
com produto, preço observado, alvo, momento de criação (`created_at`, em tempo relativo) e
estado lida/não lida, com **Marcar como lida** e **Carregar mais**. Sem notificações:
**Nenhuma notificação por enquanto.** Criar, editar, pausar e excluir alerta continuam no detalhe do
produto.

### Estado vazio, carregamento e erro

- Sem produtos: o hero ganha prioridade e aparece **Você ainda não está acompanhando
  nenhum produto.** com **Encontre um produto no Mercado Livre, copie o link do anúncio e
  cole acima. O BestPrice acompanha as alterações para você.** Indicadores mostram os
  valores reais (zeros verdadeiros); “Boas oportunidades”, “Seus produtos” e
  “Atualizações recentes” ficam ocultas; o item de navegação Produtos leva o foco ao campo
  de link. A seção Alertas continua visível (com suas notificações ou com o texto de vazio).
- Carregamento inicial: esqueleto de indicadores, cards, linhas e linha do tempo,
  anunciado como carregando; nenhum número, zero ou texto de vazio antes da resposta.
- Falha ao carregar o painel ou as notificações: mensagem na própria região com **Tentar
  novamente**, sem bloquear o hero nem as demais regiões.

### Marca, dados e marketplace

Nenhuma referência à Amazon (texto, logotipo, “prime”, domínio). Não há estrelas,
avaliações, quantidade de avaliações nem selos que o contrato não fornece. O Mercado
Livre é citado por nome; seu logotipo não é usado sem autorização de uso de marca.
Nenhum produto, preço, nome de pessoa, contagem ou evento é fixo no código da interface:
tudo vem da API, e dados de exemplo só existem em testes.

### Responsividade e acessibilidade

Larguras de referência: 360, 768 e 1280 px. Em mobile, a ordem é hero/formulário,
indicadores, oportunidades, seus produtos, atualizações recentes e alertas; a navegação
continua acessível. Toda ação funciona por teclado, com foco visível, rótulos acessíveis,
mensagens dinâmicas anunciadas e informação que não depende só de cor.

## Critérios de aceite

Verificáveis por teste de interface com respostas simuladas do contrato da 0013 (relógio
controlado quando houver tempo relativo) e por inspeção em navegador contra a API local.

**Cabeçalho, navegação e sino**

- [ ] **AC01** — Com sessão válida, o cabeçalho mostra marca BestPrice, Início, Produtos, Alertas, sino e menu da conta com o e-mail da pessoa; ativar Produtos e Alertas leva o foco/rolagem às seções correspondentes; “Sair” com sucesso mostra a entrada da 0011; se sair falhar (500 ou rede), a mensagem aparece no cabeçalho e a área continua exibida com a sessão local.
- [ ] **AC02** — Após ativar Produtos, esse item fica marcado como atual (`aria-current`) e Início e Alertas não; o mesmo vale ao ativar Alertas e Início.
- [ ] **AC03** — No menu de ações da linha, no painel do sino e no menu da conta: Enter e Espaço no botão abrem; Tab e Shift+Tab percorrem os itens; Tab no último item ou Shift+Tab no primeiro sai e fecha; Esc fecha e devolve o foco ao botão; setas não movem o foco entre itens.
- [ ] **AC04** — Com 3 notificações não lidas, o sino exibe “3” e tem nome acessível equivalente a “Notificações, 3 não lidas”; com 0, não há contador; com mais de 99, “99+”. Após marcar como lida, criar/editar/ativar alerta e “Atualizar agora”, o contador reflete a nova resposta da API (teste: API passa a devolver 1 não lida após marcar uma de 3 → exibe “1”, não “2”).
- [ ] **AC05** — Abrir o sino com 7 não lidas mostra as 5 mais recentes e “Ver todas as notificações”, que leva à seção Alertas; sem não lidas, “Nenhuma notificação não lida.”; com falha na consulta, o sino não mostra número, informa “Notificações indisponíveis” e o painel oferece “Tentar novamente”. Marcar a 2ª de 3 como lida no painel move o foco para o item seguinte; marcar a última restante move o foco ao título do painel; o item marcado aparece como lido na seção Alertas sem recarregar a página.

**Hero e envio**

- [ ] **AC06** — O hero exibe exatamente título, descrição, placeholder, botão e dica definidos nesta spec; não há card de produto, preço, estrela, gráfico com valores, texto ou logotipo Amazon no hero.
- [ ] **AC07** — Ao enviar um link aceito (201), aparece “Localizando produto...” com apenas “Monitorar preço” desabilitado; depois “Produto adicionado ao monitoramento.”, campo limpo e produto em “Seus produtos” sem recarregar. Com 200 (retomada), “Você voltou a monitorar este produto.”.
- [ ] **AC08** — Enviar `produto.mercadolivre.com.br/MLB-1234567890-x-_JM` (sem `https://`) não é bloqueado pelo navegador; a requisição é feita e a mensagem do 400 da API aparece junto ao campo, anunciada, com o texto preservado. 404, 409, 502 e 503 exibem a mensagem da API; 409 `already_tracked` mostra “Ver produto”, que abre o detalhe do ID devolvido; 429 com `retry_after_seconds=90` exibe a mensagem seguida de “Tente novamente em 2 minutos.”; rede mostra “Não foi possível conectar ao BestPrice. Tente novamente.”; erro sem corpo estável mostra “Não foi possível concluir a operação. Tente novamente.”; nenhum caso leva à entrada.

**Indicadores e oportunidades**

- [ ] **AC09** — Os quatro indicadores mostram `tracked_count`, `price_drop_count`, `active_alert_count` e `target_reached_count` com “Produtos monitorados”, “Baixaram de preço” (“nas últimas 24h”), “Alertas ativos” e “Preço-alvo atingido” (“no alvo agora”); não há deltas, setas de tendência ou outros textos complementares.
- [ ] **AC10** — Cada card de oportunidade mostra imagem ou marcador neutro, título, preço anterior riscado, preço atual, selo de queda com seta e percentual, menor preço identificado como desde o primeiro registro no BestPrice e “Preço observado:” com tempo relativo; ordem da API; ativar abre o detalhe; não existe “Ver todos”.
- [ ] **AC11** — Com produtos e sem oportunidades, a seção mostra “Nenhuma oportunidade de queda nas últimas 24 horas.”.

**Seus produtos**

- [ ] **AC12** — Em 1280 px, cada produto mostra Produto, Preço atual, Variação (percentual com seta seguido de “vs. preço anterior”, sem data), Menor preço, Disponibilidade, “Preço observado” e Ações, além de preço anterior, maior preço, “Última consulta” (`last_attempt_at`) e “Última alteração” (`price_changed_at`), ambas em tempo relativo; com alerta ativo de alvo 99.90, aparece “Alerta em R$ 99,90” e sem alerta ativo não aparece. Em 360 px, os mesmos dados aparecem empilhados sem rolagem horizontal.
- [ ] **AC13** — Produto com `current_price` nulo mostra “Preço indisponível”; `previous_price`, `min_price` e `max_price` nulos mostram “Desconhecido”; `percentage_change`, `last_attempt_at` e `price_changed_at` nulos mostram “Desconhecida”; nunca “R$ 0,00” ou “0%”. Variação negativa e positiva têm sinal e seta distintos, não apenas cor.
- [ ] **AC14** — `available`, `unavailable` e `unknown` aparecem como “Disponível”, “Indisponível” e “Não confirmada”; `lookup_status=not_found` mostra “Anúncio não localizado no Mercado Livre” com o preço identificado como último conhecido; `stale=true` identifica o preço como desatualizado; `last_attempt_status` diferente de `ok` mostra aviso com o rótulo do resultado mesmo com observação recente.
- [ ] **AC15** — O menu de ações oferece “Atualizar agora”, “Ver anúncio no Mercado Livre” e “Parar de monitorar”; “Ver anúncio no Mercado Livre” abre o endereço canônico em nova aba, é identificado como externo e usa o mesmo rótulo no detalhe; “Ver detalhes” abre o detalhe da 0013 com histórico, instantes e alerta.
- [ ] **AC16** — “Atualizar agora” pela linha deixa ocupada somente essa linha (outra linha continua acionável durante a requisição) e mostra o resultado numa região anunciada junto da linha: 200 `ok` → “Consulta concluída.” e dados atualizados; 200 com `lookup_status=not_found` → linha e mensagem com “Anúncio não localizado no Mercado Livre”; 429 `refresh_not_due` com `retry_after_seconds=30` → mensagem da API + “Tente novamente em 30 segundos.”; 502/503 → mensagem e a linha é recarregada mostrando a tentativa registrada; nesses casos o foco termina no botão do menu de ações da linha. 409 `tracking_inactive` ou 404 → somente esse produto sai da lista, a mensagem aparece na região anunciada de “Seus produtos” e o foco vai ao título da seção; se era o único produto, o foco vai ao campo de link e a mensagem é anunciada globalmente. Com a página 2 carregada por “Carregar mais”, após qualquer desses resultados os itens das páginas 1 e 2 que não foram afetados continuam exibidos e indicadores e contador do sino são recalculados.
- [ ] **AC17** — Com `next_cursor`, “Carregar mais” acrescenta a página seguinte sem repetir IDs; sem `next_cursor`, o botão não aparece; a ordem “mais recentes primeiro” está indicada em texto.

**Parar de monitorar**

- [ ] **AC18** — Pela linha, “Parar de monitorar” abre confirmação com o título do produto; com alerta ativo o texto inclui “O alerta deste produto será pausado.” e sem alerta ativo não inclui. Cancelar, Esc ou clique fora não enviam requisição e devolvem o foco ao botão do menu da linha. Confirmar remove somente esse produto, recalcula os indicadores, mostra “Você parou de monitorar este produto.” na região anunciada de “Seus produtos” e leva o foco ao título da seção; com a página 2 carregada, os demais itens das páginas 1 e 2 permanecem; se era o único produto, o foco vai ao campo de link e a mensagem é anunciada globalmente. Falha mantém o produto, mostra o erro junto da linha e devolve o foco ao botão do menu.
- [ ] **AC19** — No detalhe, “Parar de monitorar” substitui o conteúdo do diálogo pela confirmação (há um único diálogo aberto) e move o foco para ela; Cancelar, Esc ou clique fora cancelam a confirmação e voltam ao conteúdo do detalhe, que continua aberto, com foco em “Parar de monitorar”; confirmar fecha o detalhe e segue o mesmo resultado de mensagem e foco do AC18 (título de “Seus produtos”, ou campo de link se a lista ficar vazia); falha volta ao detalhe com o erro anunciado e foco em “Parar de monitorar”.

**Atualizações recentes e alertas**

- [ ] **AC20** — Cada evento aparece com o texto da tabela correspondente e tempo relativo, mais recentes primeiro. A direção usa comparação decimal exata: `"99.90"` → `"100.00"` é alta; `"100.10"` → `"100.09"` é queda. Evento com valores iguais (`"1079.00"` → `"1079.0"`) ou não numéricos (`"abc"`) mostra “<título> teve o preço alterado.” sem valores, sem seta e sem nenhum “R$” formatado a partir do valor inválido. Evento cujo produto não está carregado usa “Um produto monitorado” e “Ver produto”; não há eventos de preço-alvo nem “Ver todas”.
- [ ] **AC21** — Sem eventos, a linha do tempo mostra “As mudanças confirmadas de preço e disponibilidade aparecerão aqui.” e nenhuma entrada fictícia.
- [ ] **AC22** — A seção Alertas lista as notificações com produto, preço observado, alvo, `created_at` em tempo relativo e estado de leitura; “Marcar como lida” move o foco ao item seguinte (ou ao título da seção se não restar item), o contador do sino é recalculado e o item deixa de aparecer no painel do sino; “Carregar mais” funciona. Sem notificações, a seção mostra “Nenhuma notificação por enquanto.”.

**Estados gerais e tempo**

- [ ] **AC23** — Com `tracked_count=0` e lista vazia, aparecem os dois textos de estado vazio, o hero fica em destaque e “Boas oportunidades”, “Seus produtos” e “Atualizações recentes” não são exibidas; ativar Produtos leva o foco ao campo de link; a seção Alertas é exibida com as notificações existentes ou, sem notificações, com “Nenhuma notificação por enquanto.”.
- [ ] **AC24** — Enquanto o painel carrega, indicadores, cards, linhas e linha do tempo aparecem como esqueletos anunciados como carregando, sem números, zeros ou textos de vazio; ao chegar a resposta, são substituídos pelos dados. Se duas cargas do painel forem disparadas e a resposta da primeira chegar depois da segunda, a tela mantém os dados da segunda.
- [ ] **AC25** — Falha (500 ou rede) ao carregar o painel ou as notificações mostra mensagem na região afetada com “Tentar novamente”; o hero continua utilizável e “Tentar novamente” recarrega apenas a região; 401 em qualquer chamada leva à entrada.
- [ ] **AC26** — Com relógio controlado e fuso fixo no teste, cada linha da tabela abaixo produz exatamente o texto indicado, calculado no momento em que a resposta da API chega; avançar o relógio depois disso, sem nova resposta, não altera o texto exibido.

  | Agora (local) | Instante (local) | Texto |
  |---|---|---|
  | 11/10/2026 15:00 | 11/10/2026 14:59:30 | Agora |
  | 11/10/2026 15:00 | 11/10/2026 14:15 | Há 45 min |
  | 11/10/2026 15:00 | 11/10/2026 03:00 | Há 12 h |
  | 11/10/2026 15:00 | 10/10/2026 20:15 | Há 18 h |
  | 11/10/2026 09:00 | 10/10/2026 08:15 | Ontem, 08:15 |
  | 11/10/2026 15:00 | 08/10/2026 09:05 | 08/10/2026, 09:05 |
  | 11/10/2026 15:00 | 11/10/2026 15:02 | Agora |

**Responsividade, acessibilidade e conteúdo**

- [ ] **AC27** — Em 360, 768 e 1280 px não há rolagem horizontal da página; em 360 px a ordem visual e de leitura é hero, indicadores, oportunidades, seus produtos, atualizações recentes e alertas.
- [ ] **AC28** — Todas as ações (navegação, sino, menu da conta, envio, cards, menu de ações, diálogos, carregar mais) são alcançáveis e acionáveis só por teclado com foco visível; inspeção automatizada de acessibilidade WCAG 2.1 AA em 360 e 1280 px não aponta violações (a ferramenta é escolhida no plano).
- [ ] **AC29** — Uma busca no código da interface e nos textos renderizados não encontra “Amazon”, “prime”, “amazon.com” nem avaliações/estrelas; não há produto, preço, nome de pessoa, contagem ou evento fixo fora dos testes; a página renderizada contra uma API com lista vazia não mostra nenhum produto.

## Fora de escopo

- **Busca, filtro e ordenação de “Seus produtos”** (campo “Buscar produto…”, “Todos”,
  “Mais recentes”): o contrato lista só vínculos ativos, paginados, em ordem fixa. Fazer
  no cliente sobre a página carregada daria resultado incompleto. Depende de spec futura
  que acrescente esses parâmetros à API.
- **Deltas e textos comparativos dos indicadores** (“↑ 2”, “+2 neste mês”, “3 com preço
  próximo”, “nos últimos 7 dias”): o resumo não fornece séries nem proximidade de alvo.
- **“Ver todos” das oportunidades e “Ver todas” das atualizações**: não há lista completa
  de oportunidades nem paginação de eventos.
- **Eventos de alerta na linha do tempo** (“atingiu seu preço desejado”, “está próximo do
  preço desejado”): preço-alvo atingido fica nas notificações; proximidade não existe no
  domínio.
- **Atualização periódica automática** do contador do sino, do painel e dos tempos
  relativos com a página aberta.
- **Card de produto e gráfico “Histórico de preço” no hero**; gráfico de histórico no
  detalhe também não entra (o detalhe mantém a lista de preços da 0013).
- **Nome e avatar da pessoa** no menu da conta: o contrato de sessão só fornece e-mail.
- Páginas separadas com endereço próprio para Produtos e Alertas; página de perfil.
- Logotipo do Mercado Livre, estrelas, avaliações, selos de entrega/vantagens.
- Qualquer endpoint, campo, regra de domínio, migração ou mudança de backend, inclusive
  mudanças na spec 0013.

## Lacunas de contrato registradas (para specs futuras)

1. Eventos de `recent_updates` não trazem título nem imagem do produto; a interface só os
   resolve para produtos já carregados.
2. Não há contagem de notificações não lidas; o contador é derivado da listagem de não
   lidas (limitado a “99+”).
3. Não há busca/filtro/ordenação na listagem de vínculos.
4. Não há variação dos indicadores no tempo nem conceito de “preço próximo do alvo”.
5. O usuário da sessão não tem nome de exibição.

## Suposições e dependências

- Depende da 0013 integrada em `develop` (PR #35): contrato, mensagens de erro, rótulos
  de resultado de consulta e detalhe/alertas já existentes. Até lá, a spec fica em
  rascunho e não deve ser planejada contra código fora de `develop`.
- Depende da 0011 para sessão e tela de entrada.
- O texto “nas últimas 24h” segue a janela da 0013; se ela mudar, o rótulo muda junto.
- A disponibilidade real de dados depende da autorização da integração (0013, AC-013/014);
  sem ela, a interface mostra as mensagens de indisponibilidade da API, nunca dados de
  exemplo.

## Perguntas em aberto

Nenhuma bloqueante. Decisões desta spec que a usuária pode reverter: hero sem
card/gráfico ilustrativo; busca/filtro/ordenação fora de escopo em vez de operar só sobre
a página carregada; contador do sino limitado a “99+”; sem atualização periódica do sino.
