---
numero: 0021
titulo: Navegação por rotas e acesso direto às telas
tipo: melhoria
prioridade: P2
status: pronta
toca: [frontend]
depende_de: [0011, 0012, 0013, 0020]
---

# 0021 — Navegação por rotas e acesso direto às telas

Issue: https://github.com/SamiaLuvanice/bestprice/issues/93

## Problema

Quem usa o BestPrice acessa o login e a área autenticada pelo mesmo endereço. Na área
autenticada, Início, Produtos e Alertas movem o foco para seções da mesma página sem
atualizar a URL, e o detalhe do produto abre em uma janela de diálogo. Não há um
endereço próprio para retornar diretamente a uma seção ou ao detalhe de um monitoramento.

Isso limita o uso de favoritos, links e dos botões voltar e avançar do navegador.
Ao atualizar a página, o usuário perde o contexto da navegação. Uma notificação também
precisa oferecer um caminho direto para o produto ao qual se refere.

É uma melhoria de experiência para visitantes que precisam entrar e usuários que já
monitoram anúncios; não representa uma indisponibilidade de produção.

## Comportamento esperado

A aplicação continua oferecendo navegação fluida, com um endereço próprio para cada
tela. A URL determina a tela apresentada, inclusive na abertura direta, em nova aba
e após atualizar o navegador.

| Rota | Acesso | Conteúdo principal |
|---|---|---|
| `/login` | Público | Formulário de entrada na conta. |
| `/` | Autenticado | Início com resumo dos monitoramentos, oportunidades de queda de preço, atualizações recentes e entrada de link para monitorar. |
| `/produtos` | Autenticado | Lista dos produtos monitorados e entrada de link para adicionar um monitoramento. |
| `/produtos/:id` | Autenticado | Detalhe do monitoramento: dados do anúncio, preço, histórico, situação do acompanhamento e configuração do alerta de preço. |
| `/alertas` | Autenticado | Alertas de preço configurados e notificações recebidas, apresentados como grupos distintos. |

O identificador no endereço do detalhe corresponde ao monitoramento pertencente ao
usuário. Compartilhar ou salvar esse endereço não concede acesso a outra conta.
O detalhe passa a ser uma tela acessível por URL; links da lista, oportunidades,
atualizações recentes e notificações conduzem a essa tela.

A jornada principal é entrar, colar o link de um anúncio do Mercado Livre Brasil e
acompanhar o produto. Informar um preço desejado continua opcional. O usuário não
precisa preencher manualmente título, imagem, preço ou identificador do anúncio.
O formulário de monitoramento existe em Início e Produtos, com as mesmas regras e
mensagens. No sucesso, permanece na tela de origem, apresenta confirmação e oferece
a ação de abrir o produto; uma submissão não abre o detalhe automaticamente.

Quem tenta acessar uma rota protegida sem sessão é encaminhado ao login. Depois de
entrar, retorna ao endereço interno solicitado. Uma entrada direta pelo login, sem
destino pendente, leva ao Início. Uma pessoa já autenticada que abre `/login` vai ao
Início. O retorno aceita apenas as quatro rotas protegidas reconhecidas da aplicação;
`/login` não é um destino de retorno. Recarregar o login durante esse fluxo preserva
o destino solicitado, mas não exige preservar os campos digitados.

Sessão expirada durante o uso leva ao login, preservando o destino para depois da
autenticação. Uma falha temporária ao consultar a sessão apresenta erro recuperável
e opção de tentar novamente, sem tratá-la como encerramento da sessão. Sair da conta
leva ao login; voltar no navegador não permite visualizar dados da sessão encerrada.

Produtos inexistentes, identificadores inválidos ou monitoramentos de outra conta
mostram uma mensagem segura de produto não encontrado ou indisponível, sem expor
dados de terceiros, e uma ação para ir a Produtos. Uma rota desconhecida apresenta
página não encontrada, com acesso ao Início para quem tem sessão ou ao login para
visitantes. Falhas temporárias de carregamento oferecem nova tentativa na mesma URL.

O detalhe oferece uma ação explícita para ir a Produtos, inclusive quando aberto
diretamente em nova aba. Parar de monitorar continua exigindo confirmação; ao concluir
com sucesso no detalhe, o usuário vai a Produtos e recebe a confirmação da operação.
Cancelar ou ocorrer uma falha mantém o detalhe aberto na mesma URL. Ao acessar um
monitoramento já interrompido por favorito ou notificação antiga, a tela informa
"Monitoramento interrompido." e oferece ir a Produtos, sem ações de atualização ou
configuração de alerta. Cadastrar novamente o link segue o fluxo existente.

A lista de alertas configurados inclui alertas ativos e pausados de monitoramentos
em andamento, mostrando produto, preço-alvo e situação. Todos devem ser alcançáveis,
inclusive os de produtos além da primeira página da lista de monitoramentos. A
ordem é a dos monitoramentos mais recentes primeiro. Notificações continuam incluindo
o histórico recebido, mesmo quando o acompanhamento já foi interrompido. Cada grupo
tem carregamento, erro com nova tentativa e estado vazio próprios; uma falha não é
apresentada como ausência de alertas ou notificações.

As telas mantêm a identidade visual, as funcionalidades de monitoramento e os estados
de carregamento, vazio, erro e dados indisponíveis já existentes. A navegação indica
a seção ativa; o detalhe pertence à seção Produtos. Cada mudança de tela oferece
título identificável e foco adequado para navegação por teclado e leitor de tela.

## Relação com o comportamento anterior

Esta spec substitui a navegação por foco entre seções da área autenticada por telas
com URLs próprias e transforma o detalhe em destino de navegação. O login definido
na 0020 passa a ter o endereço `/login`, preservando sua apresentação e validação.
Exigências anteriores sobre composição de página única ou detalhe em diálogo deixam
de reger esses pontos; as regras de domínio e de autenticação continuam vigentes.

Na 0012, deixam de valer a exclusão de páginas próprias para Produtos e Alertas e as
partes de AC19, AC23 e AC27 que exigem diálogo de detalhe, foco entre seções ou ordem
de página única. A confirmação para interromper o acompanhamento continua obrigatória.
AC22 passa a reger o grupo de notificações de `/alertas`; o grupo de alertas configurados
é acrescentado por esta spec. O escopo e a apresentação do sino permanecem, acrescidos
do acesso direto ao produto. As regras de foco da 0012 relativas ao fechamento do
detalhe cedem às regras de navegação e confirmação desta spec.

## Escopo e dependências

O escopo funcional está na interface e na navegação do navegador. O planejamento deve
considerar a entrega de acessos diretos pelos ambientes local e stage, para que abrir
ou recarregar um endereço válido funcione também fora da navegação interna.

As consultas, autorizações, notificações e operações de monitoramento dependem dos
recursos existentes. Não há alteração de contrato de API proposta nesta spec.
O cadastro real de anúncios continua sujeito à disponibilidade e à autorização da
integração com o Mercado Livre; navegar pelas telas não remove essa dependência.

## Critérios de aceite

- [ ] **AC01** — Dada uma sessão válida, ao abrir diretamente `/`, `/produtos`, `/produtos/:id` com monitoramento próprio ou `/alertas`, a tela correspondente é apresentada e a URL identifica essa tela.
- [ ] **AC02** — Dado um visitante que abre qualquer uma das quatro rotas protegidas, ele é levado a `/login` sem visualizar dados autenticados; após login válido, retorna à rota solicitada, incluindo o identificador do detalhe quando aplicável.
- [ ] **AC03** — Dado acesso direto a `/login` sem destino pendente, o login válido leva a `/`; dado acesso a `/login` com sessão válida, a aplicação leva a `/` sem exigir novo login.
- [ ] **AC04** — Dado um destino de retorno externo ou um caminho não reconhecido, ao concluir o login o usuário é levado a `/`, sem redirecionamento para outro site.
- [ ] **AC05** — Dada a navegação Início → Produtos → detalhe de um produto → Alertas, voltar e avançar no navegador apresentam as telas correspondentes em ordem, com conteúdo e indicação de seção coerentes com a URL.
- [ ] **AC06** — Dada uma rota válida aberta diretamente, em nova aba ou após atualização do navegador, a tela correspondente carrega tanto em local quanto em stage, sem erro do servidor de hospedagem causado pelo caminho da página.
- [ ] **AC07** — Dada a tela Início, são apresentados o resumo dos monitoramentos, oportunidades e atualizações recentes disponíveis, além do formulário para monitorar por link; sem produtos, há orientação para iniciar o primeiro monitoramento.
- [ ] **AC08** — Dada a tela Produtos, a lista oferece as operações e o carregamento de mais itens já disponíveis; o formulário recebe somente o link do anúncio e aplica as mesmas regras e mensagens do formulário do Início.
- [ ] **AC09** — Dado o cadastro bem-sucedido em Início ou Produtos, o usuário permanece nessa rota, vê a confirmação e pode abrir o detalhe pela ação oferecida; erros e anúncios já monitorados mantêm o tratamento existente e não criam duplicatas.
- [ ] **AC10** — Dado um produto próprio, ao abrir seu detalhe por URL, lista, oportunidade ou atualização recente, a tela apresenta os dados, histórico, estados e ações já disponíveis para esse monitoramento, incluindo configurar o preço desejado e acessar o anúncio original.
- [ ] **AC11** — Dada a tela Alertas, alertas configurados e notificações recebidas aparecem em grupos identificados, com carregamento, erro recuperável e estado vazio próprios; os alertas ativos e pausados de monitoramentos em andamento mostram produto, preço-alvo e situação em ordem de monitoramento mais recente primeiro, e todos são alcançáveis mesmo quando pertencem a produtos além da primeira página; configurar ou editar um alerta é acessível pelo detalhe do produto correspondente, e as notificações conservam carregamento de mais itens e estado de leitura.
- [ ] **AC12** — Dada uma notificação no sino ou na tela Alertas, a ação de abrir o produto leva a `/produtos/:id` do monitoramento relacionado; marcar como lida continua disponível e abrir o produto não marca a notificação automaticamente como lida.
- [ ] **AC13** — Dado um identificador inválido, inexistente ou pertencente a outra conta, abrir o detalhe não mostra dados de terceiros e apresenta mensagem segura com ação para `/produtos`; falha temporária apresenta erro e nova tentativa na mesma URL.
- [ ] **AC14** — Dada uma sessão expirada durante a navegação, a aplicação encaminha ao login e retorna ao destino após autenticação; dada indisponibilidade temporária da consulta de sessão, oferece nova tentativa sem concluir que o usuário está desautenticado.
- [ ] **AC15** — Dado logout bem-sucedido, a aplicação mostra `/login`; ao usar voltar, avançar ou recarregar uma rota protegida, nenhum dado da conta encerrada é apresentado sem nova autenticação.
- [ ] **AC16** — Dado um caminho não reconhecido, a aplicação apresenta página não encontrada com ação para Início quando autenticado ou para login quando visitante, sem ciclo de redirecionamentos.
- [ ] **AC17** — Dada navegação por teclado, os links principais e de produto podem ser acionados e abertos em nova aba; cada tela tem título principal e título de aba identificáveis, a mudança de tela direciona o foco ao conteúdo principal e o menu indica a seção ativa, incluindo Produtos no detalhe.
- [ ] **AC18** — Dadas as telas de login, Início, Produtos, detalhe e Alertas em larguras de 320, 768 e 1280 px, a navegação e as ações principais permanecem acessíveis, sem rolagem horizontal da página nem conteúdo essencial cortado.
- [ ] **AC19** — Dado encaminhamento ao login a partir de um detalhe protegido, recarregar `/login` e depois entrar preserva o retorno ao detalhe; se o destino recebido for `/login`, o sucesso leva a `/` sem ciclo de redirecionamentos.
- [ ] **AC20** — Dado um detalhe aberto diretamente, há ação para ir a `/produtos`; ao solicitar parar o monitoramento, é exibida confirmação com o produto e o efeito no alerta ativo, quando houver; cancelar mantém URL e detalhe e devolve foco à ação de parar; confirmar com sucesso leva a `/produtos`, anuncia "Você parou de monitorar este produto." e foca o título da lista ou o campo de link se ela estiver vazia; falha mantém o detalhe com erro anunciado e foco na ação de parar.
- [ ] **AC21** — Dado um monitoramento próprio já interrompido, acessá-lo por URL, histórico do navegador ou notificação antiga apresenta "Monitoramento interrompido." e ação para `/produtos`, sem ações de atualização ou configuração de alerta.

## Fora de escopo

- Cadastro de contas, recuperação de senha, perfil e administração.
- Página pública de apresentação ou compartilhamento público de produtos.
- Novos canais de notificação, como e-mail, push ou WhatsApp.
- Novas métricas, filtros de histórico, regras de alerta ou regras de monitoramento.
- Alteração de marketplace, integração externa, contratos de API ou persistência.
- Redesign completo, troca de tema ou novo sistema visual.
- Persistência de formulários não enviados, filtros, posição de rolagem ou paginação após recarregar a página.
- Implantação de novos ambientes.

## Perguntas em aberto e suposições

- Não há dúvida de produto bloqueante para revisar esta proposta. As cinco rotas seguem o fluxo sugerido na conversa e solicitado para especificação.
- Assume-se que `:id` identifica o monitoramento do usuário, e que o detalhe conserva as informações e ações existentes, sem antecipar métricas futuras da visão do produto.
- Assume-se que o cadastro permanece na tela de origem com confirmação e ação para abrir o produto, preservando a possibilidade de cadastrar vários links.
- Assume-se que abrir uma notificação e marcá-la como lida são ações independentes, preservando o controle explícito de leitura.
- Favoritos antigos com fragmentos como `#alertas` não têm migração garantida nesta entrega; as URLs canônicas passam a ser as cinco rotas desta spec.
- A prioridade P2 reflete melhoria relevante sem bloqueio operacional reportado. A revisão documental está registrada em `review.md`; a spec está pronta para planejamento, com critérios de implementação ainda não verificados.
