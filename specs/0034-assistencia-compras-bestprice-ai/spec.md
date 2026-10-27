---
numero: 0034
titulo: Assistência de compras BestPrice AI com conversa em primeiro plano
tipo: feature
prioridade: P1
status: pronta
toca: [backend, frontend, contrato]
depende_de: [0021, 0030]
issue: https://github.com/SamiaLuvanice/bestprice/issues/195
---

# 0034 — Assistência de compras BestPrice AI

## Problema e público

Pessoas que pesquisam uma compra precisam transformar necessidades, dúvidas e
informações dispersas em uma decisão compreensível. Hoje, o BestPrice organiza
monitoramentos de anúncios, mas não oferece orientação por conversa nem comparação
de produtos informados pela pessoa. A obtenção de preços reais depende de
autorização da fonte e não pode ser substituída por valores inventados.

A evolução atende visitantes que querem entender a proposta e pessoas
autenticadas que querem explorar uma compra, comparar opções e retomar uma
pesquisa. Pessoas que já monitoram anúncios devem conservar acesso aos seus dados
e às ações existentes. A prioridade P1 reflete o caminho crítico da evolução
solicitada; não há incidente de produção associado a esta demanda.

## Decisão de produto e referências

Em 26/10/2026, a pessoa responsável escolheu a direção **A — Conversa em primeiro
plano**, com a instrução “siga com o plano A”. A direção coloca a pergunta de
compra no centro do dashboard, seguida de atalhos por categoria e acesso a
conversas, comparações e monitoramento.

- Referência visual aprovada: [BestPriceIA no Paper](https://app.paper.design/file/01M5QGGQ263CSRSWKR4G7FSXDR/p-1-0), quadros A desktop e mobile.
- Identidade de referência: [BestPrice IA no Figma](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=0-1).
- O guia “BestPrice AI — Guia de arquitetura de páginas, rotas e componentes”,
  versão 1.0, fornecido pela pessoa responsável, orienta a evolução. Suas propostas
  não descrevem funcionalidades já entregues nem aprovam automaticamente novas
  integrações.

A aprovação abrange a direção visual A. As quatro telas centrais e seus estados
ainda serão consolidados nessa direção. As outras propostas não são dependência
desta entrega.

## Comportamento atual

O visitante encontra uma landing pública e uma entrada para contas existentes.
Uma pessoa autenticada encontra o painel de monitoramento na página inicial e
consegue navegar por produtos, detalhe e alertas. Há tratamento distinto para
verificação de sessão, credenciais inválidas e indisponibilidade temporária.

Ainda não há assistente, conversas salvas, comparações manuais nem histórico
dessas pesquisas. Também não há cadastro público ou recuperação de senha
operacionais. O material visual da direção A é uma proposta de experiência,
sem integração funcional com IA.

## Comportamento esperado

### Descoberta e entrada

A landing explica que o BestPrice AI ajuda a pensar uma compra por conversa e a
comparar informações fornecidas pela própria pessoa. Não promete encontrar
ofertas, verificar estoque ou consultar preços sem fonte autorizada. A ação
“Começar com IA” encaminha o visitante à entrada existente e, após autenticação,
ao assistente. Para quem já está autenticado, o mesmo destino é direto.

A página pública permanece acessível mesmo para quem já entrou. O espaço privado
possui navegação consistente entre dashboard, assistente, comparador, histórico
e monitoramento. Recursos ainda não entregues não aparecem como operacionais.

### Dashboard com conversa em primeiro plano

A pergunta “O que você deseja comprar hoje?” é a ação principal. A pessoa pode
descrever sua necessidade em texto livre, sem preencher um formulário obrigatório
de categoria, uso e orçamento. Os atalhos de categoria ajudam a iniciar o texto,
mas permitem edição antes do envio.

Conversas e comparações recentes mostram somente registros da própria pessoa.
Sem registros, o dashboard explica como iniciar uma pesquisa. O monitoramento
permanece acessível e identifica sua condição real, inclusive indisponibilidade
de novas consultas, sem produzir preços artificiais para preencher a tela.

### Assistente e continuidade da conversa

A pessoa autenticada inicia uma conversa, envia mensagens e retoma conversas
anteriores. O contexto inclui as mensagens anteriores da mesma conversa, sem
misturar pesquisas ou pessoas. O texto enviado pelo dashboard chega ao
assistente sem exigir nova digitação ou aparecer no endereço compartilhável.

A experiência distingue envio em andamento, resposta concluída, falha recuperável
e limite de uso. Uma tentativa de envio não pode gerar duas mensagens concluídas
ou duas análises pela repetição acidental da mesma ação. Falhas preservam o texto
para nova tentativa e não são apresentadas como respostas concluídas.

As respostas orientam a decisão a partir das necessidades declaradas e distinguem
dados fornecidos, interpretação e lacunas. Quando faltam preço, estoque ou uma
especificação, a resposta indica que a informação não foi verificada e não a
completa como fato. A pessoa é informada de que seu conteúdo será processado por
um serviço de IA antes do primeiro envio.

### Comparação de produtos

A pessoa informa dois ou três produtos, com nome e informações que quer comparar;
o terceiro produto é opcional. Dados como preço e especificações podem estar
ausentes. Valores informados permanecem identificados como fornecidos pela pessoa,
com moeda explícita quando aplicável. Um link é apenas uma referência nessa
experiência, sem consulta automática da página.

A comparação apresenta os dados lado a lado, as diferenças sustentadas pelas
informações disponíveis, prós, contras, lacunas e uma síntese relacionada ao uso
declarado. Quando não há base suficiente, informa que não é possível indicar uma
opção com segurança. Não é obrigatório eleger um vencedor.

A pessoa pode editar ou remover opções e salvar a pesquisa. Um resultado anterior
deixa de ser tratado como atual após alteração dos dados que o originaram; uma
nova análise usa a versão editada. Reabrir uma comparação recupera seus dados e
o resultado correspondente, sem misturar versões.

### Histórico e propriedade

Conversas e comparações são persistidas por pessoa. O histórico permite procurar
pelo título, filtrar por tipo, abrir, continuar e excluir uma pesquisa. A exclusão
exige confirmação e deixa claro o registro afetado. Cancelar preserva o registro;
uma falha de exclusão mantém a pesquisa acessível e permite nova tentativa.

Uma pessoa não pode listar, ler, continuar, analisar, alterar ou excluir pesquisas
alheias, mesmo usando um endereço ou identificador conhecido. Dados de uma sessão
anterior não aparecem para outra pessoa que entre no mesmo navegador.

### Monitoramento preservado

O acompanhamento existente conserva seus dados, histórico, alertas e comandos.
O acesso continua disponível pelas entradas antigas e pelo novo espaço privado.
Alertas existentes não são eliminados ou substituídos pela nova navegação.

Novas consultas continuam condicionadas à autorização da fonte. Quando o acesso
externo estiver indisponível, a pessoa pode distinguir dados já registrados de
informações atuais não consultadas. Esta evolução não ativa a integração.

## Navegação esperada

Os endereços representam destinos da experiência. Detalhes de transporte,
contratos e compatibilidade serão definidos no planejamento.

| Destino | Acesso e resultado esperado |
|---|---|
| `/` | Landing pública, com caminho para o espaço privado |
| `/login` | Entrada existente e retorno seguro ao destino solicitado |
| `/app` | Encaminha ao dashboard quando autenticado; solicita entrada caso contrário |
| `/app/dashboard` | Dashboard da direção A |
| `/app/assistant` | Iniciar uma conversa |
| `/app/assistant/:id` | Retomar uma conversa própria |
| `/app/compare` | Iniciar uma comparação |
| `/app/compare/:id` | Reabrir uma comparação própria |
| `/app/history` | Buscar e recuperar pesquisas próprias |
| `/app/monitoring` | Acessar produtos monitorados e os alertas existentes |
| `/app/monitoring/overview` | Painel completo de monitoramento já existente, com seus resumos e comandos |
| `/app/monitoring/:id` | Consultar o detalhe de um monitoramento próprio |
| `/app/monitoring/alerts` | Lista de alertas configurados, preservando o destino de `/alertas` |
| `/produtos`, `/produtos/:id`, `/alertas` | Preservar acesso ao destino equivalente, inclusive por links salvos |
| Endereço desconhecido | Página não encontrada com saída para uma área permitida |

Histórico de pesquisas com IA e histórico de preços são apresentados com nomes
distintos. Abrir ou recarregar um endereço privado diretamente conserva a proteção
de acesso e não depende de navegação anterior pelo dashboard.

## Escopo e entregas incrementais

Esta spec define o resultado do núcleo BestPrice AI. Não exige uma entrega única
de todas as capacidades. O planejamento deve separar fatias verificáveis, nesta
ordem de dependência:

1. Consolidar Landing, Dashboard, Assistente e Comparador na direção A, incluindo
   estados e navegação em desktop e mobile.
2. Preparar a entrada e o espaço privado preservando a sessão e o monitoramento.
3. Entregar uma conversa real, persistida e isolada por pessoa, com erros e limites.
4. Conectar o dashboard às conversas reais e entregar comparação persistida.
5. Completar busca, filtros, retomada e exclusão no histórico e verificar os fluxos
   de ponta a ponta.

Uma fatia pode mostrar indisponibilidade honesta para capacidades futuras, mas
não comprova os critérios funcionais dessas capacidades. O núcleo só está
implementado quando todos os critérios aplicáveis abaixo estiverem demonstrados.

## Critérios de aceite

As marcações abaixo correspondem à evidência local em verification.md, com SPA/API/PostgreSQL reais e geração externa controlada na fronteira de teste. Não atestam disponibilidade ou qualidade operacional do Gemini. AC10, AC15 e AC19 mantêm a avaliação do modelo real pendente; AC30 fecha com o handoff documental.

- [x] **AC01 — Direção visual:** existem composições revisáveis de Landing,
  Dashboard, Assistente e Comparador em desktop e mobile, com os estados vazio,
  carregando e erro aplicáveis, coerentes com a direção A, logo e identidade atuais.
- [x] **AC02 — Landing:** visitante e pessoa autenticada conseguem abrir `/`;
  a proposta não promete preços ou ofertas verificadas sem fonte autorizada.
- [x] **AC03 — Entrada para IA:** “Começar com IA” leva ao assistente diretamente
  para uma sessão válida ou após a entrada para uma pessoa visitante, sem exigir
  cadastro novo de quem já possui conta.
- [x] **AC04 — Proteção de acesso:** abrir diretamente qualquer destino privado
  sem sessão válida exige entrada; após autenticação, o destino permitido é
  restaurado e endereços externos não são aceitos como retorno.
- [x] **AC05 — Sessão indisponível:** durante verificação de sessão, os dados
  privados não aparecem; falha temporária oferece recuperação e não é confundida
  com credenciais inválidas ou saída voluntária da conta.
- [x] **AC06 — Links e histórico de navegação:** acesso direto, recarga, voltar e
  avançar funcionam nos novos destinos; links antigos para produtos, detalhe e
  alertas continuam abrindo os recursos correspondentes, sem eliminar alertas.
- [x] **AC07 — Dashboard:** a pergunta de compra é a ação principal; seu envio
  válido inicia o assistente com o texto preservado, sem incluir o conteúdo na URL;
  enviar somente espaços indica validação e não inicia consulta.
- [x] **AC08 — Atalhos:** escolher uma categoria prepara uma sugestão editável;
  a sugestão não envia mensagem sem ação explícita da pessoa.
- [x] **AC09 — Dados recentes:** conversas e comparações recentes pertencem à
  sessão atual e são recuperadas dos registros persistidos; sem registros, aparecem
  orientações para começar, sem dados demonstrativos apresentados como reais.
- [ ] **AC10 — Conversa:** uma pessoa autenticada cria uma conversa, recebe uma
  resposta concluída e envia outra mensagem considerando o contexto daquela
  conversa; conversas distintas mantêm contextos separados.
- [x] **AC11 — Persistência:** após recarregar a página ou sair e entrar novamente
  na mesma conta, a pessoa recupera as mensagens e comparações salvas, com sua
  ordem preservada.
- [x] **AC12 — Envio em andamento:** repetir a mesma ação durante um envio não
  cria mensagens concluídas ou análises duplicadas; o estado informa que há uma
  tentativa em andamento.
- [x] **AC13 — Falha e recuperação da IA:** timeout, indisponibilidade, resposta
  inválida ou limite atingido geram estados distinguíveis de sucesso, preservam o
  texto e permitem a recuperação prevista para cada caso, sem inventar resposta.
- [x] **AC14 — Limites de uso:** entradas acima dos limites publicados não são
  enviadas para análise; a pessoa recebe orientação sobre o limite atingido e sobre
  a possibilidade de tentar novamente, quando houver.
- [ ] **AC15 — Dados não verificados:** em cenários sem preço, estoque ou
  especificações fornecidos ou obtidos de fonte autorizada, a apresentação indica
  as lacunas e não exibe valores preenchidos pela IA como dados de mercado reais.
- [x] **AC16 — Processamento externo:** antes do primeiro envio há informação
  clara sobre processamento do conteúdo por um serviço de IA; credenciais do
  serviço não aparecem na interface, no endereço ou em mensagens de falha.
- [x] **AC17 — Quantidade de produtos:** é possível preparar comparação com dois
  ou três produtos, editar e remover opções; analisar com menos de dois ou incluir
  mais de três é recusado com orientação, inclusive fora da interface padrão.
- [x] **AC18 — Dados parciais:** a ausência de preço ou de uma especificação não
  é convertida em zero ou em uma característica suposta; a comparação identifica
  informação ausente e a procedência dos valores informados pela pessoa.
- [ ] **AC19 — Resultado contextual:** a análise relaciona diferenças ao uso
  declarado, apresenta prós, contras e lacunas, e explicita insuficiência de dados
  quando não há base para recomendar uma opção.
- [x] **AC20 — Versão analisada:** após editar dados de uma comparação, o resultado
  anterior deixa de aparecer como atual; uma nova análise e a reabertura da
  pesquisa mantêm a correspondência entre os dados e o resultado apresentado.
- [x] **AC21 — Histórico:** a pessoa encontra suas pesquisas pelo título, filtra
  conversas ou comparações e abre o registro correto; buscas sem resultado oferecem
  recuperação e a navegação permite alcançar registros além dos inicialmente exibidos.
- [x] **AC22 — Exclusão:** cancelar a confirmação mantém o registro; confirmar
  uma exclusão bem-sucedida remove-o das listas, e o endereço anterior deixa de
  exibir seu conteúdo; uma falha mantém o registro e permite nova tentativa.
- [x] **AC23 — Isolamento:** para duas contas distintas, uma não consegue listar,
  ler, continuar, analisar, alterar ou excluir pesquisas da outra usando seus
  identificadores; nenhum conteúdo alheio é revelado na resposta de negação.
- [x] **AC24 — Troca de sessão:** sair de uma conta e entrar em outra no mesmo
  navegador não mostra conteúdo privado da primeira, inclusive após voltar ou
  restaurar uma página do histórico do navegador.
- [x] **AC25 — Monitoramento:** produtos, histórico de preços, alertas e comandos
  existentes continuam acessíveis; a pessoa distingue dados registrados de consultas
  indisponíveis, e a nova experiência não ativa a fonte externa nem simula preço.
- [x] **AC26 — Responsividade:** não há rolagem horizontal da página em 320, 390,
  768 e 1280 px; controles interativos têm alvo mínimo de 44 × 44 px e textos e
  ações essenciais permanecem acessíveis.
- [x] **AC27 — Acessibilidade:** os fluxos principais são operáveis por teclado,
  com foco visível, rótulos e mensagens acessíveis, contraste de texto mínimo de
  4,5:1 ou 3:1 para texto grande; movimento não essencial respeita redução de movimento.
- [x] **AC28 — Falha de persistência:** uma falha ao salvar, recuperar ou excluir
  uma pesquisa não é apresentada como sucesso; a pessoa recebe orientação de
  recuperação e continua podendo acessar funcionalidades independentes disponíveis.
- [x] **AC29 — Recursos futuros:** cadastro, recuperação de senha, preferências
  e outras capacidades não entregues não oferecem ações que simulem operação
  concluída; os caminhos funcionais de entrada existentes continuam disponíveis.
- [ ] **AC30 — Evidência da entrega:** cada critério aplicável é demonstrado com
  evidência e seus limites; os cenários de sucesso, erro principal e acesso alheio
  são verificados sem apresentar estudos de design como implementação funcional.

## Fora de escopo

- Cadastro público, recuperação de senha e provimento de um canal de email.
- Configurações gerais da conta, troca de tema e novas preferências de notificação.
- Checkout, pagamento, planos comerciais, afiliados ou recomendações patrocinadas.
- Novas fontes de marketplace, scraping, busca automática de ofertas ou leitura
  automática de páginas referenciadas nas comparações.
- Ativação do acesso a anúncios de terceiros, alteração de permissões da integração
  existente ou conclusão da validação operacional do monitoramento.
- Reescrita integral do produto, substituição de autenticação e migração de
  infraestrutura como requisito desta demanda.
- Implantação em produção ou contratação de serviços e consumo pago sem decisão
  própria da pessoa responsável.
- Arquivos anexados às conversas, voz, pesquisa web autônoma e compartilhamento
  público de pesquisas; a entrada inicial é textual.

## Dependências e preservação

Autenticação, navegação por rotas e identidade atuais são a base de continuidade.
A validação externa de anúncios não bloqueia o núcleo de assistência textual:
monitoramento permanece sujeito às condições existentes. Dados manuais de uma
comparação não passam a ser produto monitorado nem dispensam a entrada por link
quando a pessoa utiliza o acompanhamento automático.

A evolução acrescenta assistência de compras à proposta atual; não apaga a
visão do monitoramento nem transforma informações manuais em fonte de preços.
O contexto de produto deve ser reconciliado durante o planejamento para refletir
essa decisão explícita, preservando a rastreabilidade das funcionalidades anteriores.

## Perguntas em aberto e suposições

1. **Fornecedor e consumo:** a pessoa pediu um modelo eficiente e gratuito e
   autorizou sugestão. A proposta técnica é Gemini Flash-Lite em cota gratuita,
   sem faturamento nem fallback pago, com limites locais publicados antes de uso.
   Sem chave/configuração a IA permanece indisponível. A escolha da versão,
   contrato e limites exatos ficam documentados no plano; nenhuma chamada real
   ou ativação externa é presumida por esta decisão.
2. **Retenção e exclusão:** a pessoa escolheu exclusão automática após **90 dias**
   em 26/10/2026. O prazo conta da criação da pesquisa e não é estendido por edição.
   No instante da expiração ela deixa de ser acessível; a limpeza física automática
   ocorre no máximo a cada hora enquanto o serviço está em execução. Exclusão
   manual remove a pesquisa e suas mensagens/resultados imediatamente do banco
   ativo. A política se refere ao BestPrice, sem prometer eliminação de backups
   ou de registros do fornecedor; a informação sobre processamento externo fica
   visível antes do envio.
3. **Disponibilidade inicial:** assume-se acesso por contas já existentes no
   primeiro núcleo. Cadastro público e recuperação serão demandas próprias; isso
   não impede desenhar seus destinos futuros sem oferecer operação falsa.
4. **Limite de lançamento:** a escolha aprova a direção A e autoriza o intake do
   núcleo. Não equivale à aprovação visual individual das quatro telas ainda por
   consolidar, nem à autorização de liberar recursos incompletos para usuários reais.
5. **Prioridade e recorte:** P1 e o recorte de núcleo são a interpretação registrada
   deste pedido. O histórico simples entra para comprovar continuidade; preferências
   e cadastro ficam para etapas posteriores. Ajustes de prioridade não renumeram a spec.

## Estado do refinamento

Spec pronta para o plano revisado, com direção A, gratuidade e retenção de 90 dias registradas.
Revisão independente inicial identificou lacunas de contrato e de destino dos
alertas, tratadas no plano e no destino explícito acima. Revisão independente final
do plano confirmou as correções sem bloqueios remanescentes em 26/10/2026.
Implementação local e QA demonstradas em verification.md; avaliação do modelo
real e handoff final continuam discriminados como pendências. A spec permanece
pronta e não está integrada.
