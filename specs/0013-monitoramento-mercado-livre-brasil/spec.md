---
numero: 0013
titulo: BestPrice — Integração Oficial com Mercado Livre
tipo: feature
prioridade: P1
status: rascunho
toca: [backend, frontend, contrato, banco, infraestrutura]
depende_de: [0011]
---

# 0013 — BestPrice — Integração Oficial com Mercado Livre

Issue GitHub: [#34](https://github.com/SamiaLuvanice/bestprice/issues/34), criada em 09/10/2026 após a autenticação do `gh` voltar a funcionar.

## Visão geral e problema

O BestPrice mantém seu nome, marca, arquitetura monolítica e proposta de acompanhar preços a partir de uma URL. O marketplace desta fase passa a ser exclusivamente o Mercado Livre Brasil. A Amazon consta apenas em requisitos planejados; não há integração Amazon executável ou dados de domínio no checkout analisado em 08/10/2026. A migração é, portanto, principalmente de requisitos e contratos, sem presumir que dados de produção inexistam em outros ambientes.

Pessoas que querem acompanhar um anúncio do Mercado Livre devem informar apenas o link. O BestPrice identifica a publicação, obtém dados por acesso oficial autorizado, compartilha uma consulta entre pessoas que acompanham o mesmo anúncio e mantém histórico, alertas e apresentação coerentes. A identidade externa é a da **publicação**, não de um produto universal.

Esta spec substitui a premissa Amazon da spec 0012 para novas implementações. Os critérios de interface e domínio de 0012 que não dependem da fonte podem ser reaproveitados após revisão; a implementação não deve partir do plano Amazon de 0012 sem atualizá-lo.

## Diagnóstico do checkout

| Componente observado | Estado | Classificação e consequência |
|---|---|---|
| `backend/app/main.py`, `health.py`, `config.py` | API de saúde e conexão PostgreSQL | Reutilizável com adaptação para novos módulos; health permanece |
| `frontend/src/App.tsx`, `health.ts`, `styles.css` | Tela de estado da stack, marca BestPrice | Reutilizável com adaptação; ainda não há dashboard de produtos |
| Docker Compose, Dockerfiles, CI e configuração de ambiente | Base de execução da stack | Reutilizável com adaptação para credenciais e migrações, após decisão de autenticação |
| `docs/product-context.md`, `docs/architecture.md`, `docs/database.md`, README e spec 0012 | Referências Amazon e ASIN, ainda prospectivas | Obsoletas para fluxo ativo; atualizar preservando rastreabilidade histórica |
| `AmazonProvider`, parser/extração de ASIN, entidades, repositories, services, schemas, rotas de produto, Alembic, scheduler e alertas | Não encontrados no código | Novos componentes necessários, não remoções de código existente |
| Mudanças locais em `docs/PROGRESS.md` e `specs/0012/` | Já presentes antes desta spec | Preservar; não sobrescrever trabalho alheio |

## Objetivos

1. Identificar anúncios MLB por URL e ID, consultar título, imagem, preço, moeda, disponibilidade e endereço canônico quando o acesso oficial autorizar.
2. Persistir publicações, vínculos de pessoas e preços; registrar apenas o primeiro preço conhecido e mudanças reais.
3. Atualizar anúncios elegíveis automaticamente, compartilhar resultados e limitar consultas externas.
4. Preservar histórico, alertas e dashboard com dados persistidos, sem simulação em produção.
5. Expor falhas e limites da fonte com clareza, sem inventar disponibilidade ou preço.

## Requisitos funcionais

- **RF-001** Validar protocolo e domínio da URL, reconhecer somente formatos comprovados de anúncio MLB e rejeitar buscas, categorias, destinos ambíguos e links curtos não resolvidos com segurança.
- **RF-002** Extrair e normalizar o ID da publicação, como `MLB123456789`; links equivalentes devem representar a mesma publicação.
- **RF-003** Consultar dados e preço pela API oficial somente com autorização suficiente e finalidade permitida; ausência de permissão bloqueia o cadastro operacional.
- **RF-004** Registrar os dados obtidos da publicação, sem exigir nome, imagem, preço, ID ou disponibilidade manualmente.
- **RF-005** Evitar duplicação de publicação por ID MLB.
- **RF-006** Permitir que pessoas diferentes acompanhem a mesma publicação por vínculos independentes e autorizados.
- **RF-007** Registrar o primeiro preço válido; preço ausente permanece desconhecido, nunca zero presumido.
- **RF-008** Consultar periodicamente publicações com acompanhamento ativo dentro dos limites autorizados.
- **RF-009** Registrar uma mudança somente quando preço válido e comparável mudar; manter preço, moeda e instante da captura.
- **RF-010** Incluir nesta entrega criação, edição, pausa e exclusão de alerta de preço alvo, com notificações dentro do BestPrice, leitura individual e prevenção de disparos repetidos conforme as regras abaixo.
- **RF-011** Exibir dashboard e detalhe com dados reais, último preço conhecido, histórico, disponibilidade e estados de consulta.
- **RF-012** Permitir parar e retomar o acompanhamento sem apagar a publicação nem seu histórico compartilhado.
- **RF-013** Diferenciar anúncio confirmado inexistente, indisponibilidade, resposta incompleta, autenticação negada, limite de requisições e falha temporária.
- **RF-014** Reutilizar estado recente quando outra pessoa passa a acompanhar o mesmo anúncio, respeitando uma política de atualização configurável.

## Requisitos não funcionais

- **Segurança:** credenciais apenas no backend, autorização por usuário, validação rigorosa de URL e destinos HTTP fixos para impedir SSRF; logs sem tokens ou segredos.
- **Integridade:** dinheiro em Decimal/NUMERIC, moeda explícita, instantes UTC, transações e constraints que resistam a cadastros simultâneos; sem exclusão automática de históricos.
- **Escalabilidade e desempenho:** consultas compartilhadas por publicação, limite de concorrência, cadência configurável e ausência de consultas redundantes no mesmo ciclo.
- **Resiliência e rate limits:** timeout, retry limitado com backoff e jitter para falhas transitórias, tratamento de 429 e respeito ao período indicado pela fonte; falha não apaga último estado válido.
- **Observabilidade:** registrar resultado e duração de consultas, IDs correlacionáveis sem dados sensíveis, última tentativa e último sucesso separadamente; medir erros e 429.
- **Manutenibilidade e testabilidade:** isolar a fronteira HTTP e regras de domínio, testar com respostas simuladas somente em testes; não confundir testes locais com validação externa real.
- **Compatibilidade:** manter a stack e ambientes existentes, migrações reversíveis quando viável e configuração por ambiente.

## Comportamento esperado

Na página principal, a pessoa vê o título **Acompanhe o preço. Compre na hora certa.**, a descrição **Cole o link de um produto do Mercado Livre e deixe o BestPrice acompanhar as mudanças de preço para você.**, o placeholder `https://www.mercadolivre.com.br/...` e o botão **Monitorar preço**. A estrutura inclui header, hero, indicadores, boas oportunidades, produtos monitorados e atualizações recentes. Toda informação operacional vem da API do BestPrice; áreas ainda não entregues mostram indisponibilidade honesta.

Ao informar uma URL válida, a publicação é identificada e consultada. Se a fonte permitir acesso e devolver dados confiáveis, o monitoramento aparece imediatamente e após recarregar. Enviar o mesmo anúncio novamente não cria outro vínculo. Outra pessoa pode acompanhá-lo sem duplicar a publicação. Falhas externas mostram orientação para tentar novamente; não geram sucesso fictício. Parar de acompanhar afeta só o vínculo da pessoa.

### Contexto compartilhado de preço e autorização

O contexto de produto desta entrega é uma publicação do site MLB, moeda BRL, canal marketplace, preço de venda de uma unidade, sem frete, parcelamento, cupom individual, benefício de comprador ou preço personalizado. O preço não promete reproduzir o total do checkout de cada pessoa. Variações que impeçam obter um único preço nesse contexto são `unsupported_price_context`; não escolher arbitrariamente uma variante nem usar o menor preço de um intervalo. O preço zero só é válido quando explicitamente confirmado pela fonte nesse contexto; ausência nunca vira zero.

Adota-se como premissa a autorização OAuth de uma **conta operadora do BestPrice**, mantida pelo responsável pela operação no backend. Usuários do BestPrice autenticam-se na aplicação conforme 0011; não precisam autorizar conta de vendedor para colar um link. Essa premissa depende da validação oficial de acesso e finalidade: autorizar uma conta não comprova acesso a anúncios de terceiros. Se a fonte retornar apenas preços personalizados para a conta/token ou não permitir esse contexto compartilhado, o fluxo fica bloqueado; preços dependentes de OAuth de uma pessoa nunca são compartilhados com outra. Mudar para autorização individual exigirá revisão desta spec e de sua modelagem, não fallback automático.

Só amostras do mesmo contexto são comparáveis e reutilizáveis. Na primeira entrega existe um único contexto; não se cria abstração para múltiplos marketplaces. O plano deve demonstrar como os recursos oficiais representam esse contexto antes de ligar a consulta real. Operação escolhe cadência e prazo de atualidade em conjunto com os limites comprovados; reuso exige última tentativa bem-sucedida com preço válido, anúncio localizado e idade do último sucesso com preço dentro desse prazo.

### URLs aceitas na primeira entrega

Os exemplos abaixo são **sintéticos**, destinados ao contrato do parser; não comprovam existência nem acesso a anúncios. O parser extrai identidade localmente, sem requisitar a URL recebida. Aceitar somente HTTPS na porta padrão (ausente ou 443), sem credenciais, com hosts exatos `produto.mercadolivre.com.br` e `www.mercadolivre.com.br` (comparação sem distinção de caixa). Nunca aceitar subdomínios por sufixo livre, IP, host com ponto final, ID codificado ou separadores codificados. O ID contém `MLB` e dígitos, normalizado em maiúsculas e sem hífen; não é inferido do título nem de query string.

| Entrada sintética | Resultado |
|---|---|
| `https://produto.mercadolivre.com.br/MLB-1234567890-titulo-do-anuncio-_JM` | Aceitar; `MLB1234567890` |
| `https://www.mercadolivre.com.br/MLB-1234567890-titulo-do-anuncio-_JM` | Aceitar a mesma forma de caminho de publicação; mesmo ID |
| `https://produto.mercadolivre.com.br/MLB-1234567890-titulo-do-anuncio-_JM?tracking_id=exemplo#position=1` | Aceitar; query/fragmento não alteram a identidade |
| `https://www.mercadolivre.com.br/produto/p/MLB1234567890` | Rejeitar `unsupported_url_format`: página de catálogo, cujo ID não identifica necessariamente publicação |
| `https://www.mercadolivre.com.br/produto/p/MLB1234567890?wid=MLB9999999999` | Rejeitar; não resolver catálogo/seleção de oferta via query nesta entrega |
| `https://lista.mercadolivre.com.br/celular`, `https://www.mercadolivre.com.br/ofertas` | Rejeitar busca, categoria ou página sem publicação identificável |
| `https://meli.la/exemplo`, `https://www.mercadolivre.com.br/sec/exemplo` | Rejeitar link curto; orientar abrir o anúncio e copiar seu endereço completo |
| `http://produto.mercadolivre.com.br/MLB-1234567890-titulo-_JM`, `https://produto.mercadolivre.com.br:8443/MLB-1234567890-titulo-_JM` | Rejeitar protocolo/porta |
| `https://mercadolivre.com.br.evil.example/MLB-1234567890-titulo-_JM`, `https://usuario@produto.mercadolivre.com.br/MLB-1234567890-titulo-_JM` | Rejeitar domínio ou credenciais |
| `https://produto.mercadolivre.com.br/MLB-1234567890-titulo-MLB-9999999999-_JM` | Rejeitar identidade ambígua |

O caminho aceito é exclusivamente `/MLB-<dígitos>-<slug>-_JM`, admitindo uma barra final; prefixo e sufixo são normalizados sem distinção de caixa e o slug não pode conter outro identificador MLB. Qualquer outro formato recebe orientação de formato não suportado, sem resolução de redirect. O ID extraído ainda precisa ser confirmado como publicação MLB pela API autorizada. Endereços canônicos e imagens devolvidos pela fonte também precisam de validação para uso na interface; o backend nunca acessa destinos arbitrários fornecidos pela pessoa.

### Estados persistidos e recuperação

Separar `lookup_status` (`located`, `not_found`), `last_attempt_status` (`ok`, `missing_price`, `unsupported_price_context`, `auth_required`, `access_denied`, `rate_limited`, `temporary_error`, `invalid_response`, `not_found`) e disponibilidade observada (`available`, `unavailable`, `unknown`). `not_found` significa confirmação inequívoca da fonte de que a publicação não foi localizada; 401, 403, timeout e resposta ambígua nunca a comprovam. `unavailable` exige observação explícita, não ausência de preço. Falhas posteriores não apagam `lookup_status=not_found`.

| Resultado | Primeiro cadastro | Publicação já acompanhada |
|---|---|---|
| Item válido, preço válido comparável | Persistir item, vínculo e primeiro preço atomicamente | Atualizar dados e registrar preço apenas se mudou |
| Item válido sem preço, contexto não contradito | Criar com preço `null`, estado `missing_price` e sem histórico/alerta; mostrar “Preço indisponível” | Preservar último preço e seu horário, registrar `missing_price`; suspender oportunidades e avaliação de alerta |
| Contexto explicitamente incompatível/ambíguo | Recusar com `unsupported_price_context`, sem cadastro parcial | Preservar últimos dados comparáveis, sinalizar incompatibilidade; suspender comparação e alertas |
| Item confirmado não localizado | Recusar com `product_not_found`, sem vínculo | Manter vínculo, total monitorado e histórico; mostrar “Anúncio não localizado no Mercado Livre” e últimos dados conhecidos; retirar de oportunidades/quedas |
| Falha de autenticação, permissão, 429, timeout ou resposta inválida | Recusar sem cadastro parcial | Persistir resultado da tentativa, preservar últimos dados e histórico; exibir aviso mesmo com dados recentes |

`last_attempt_at` registra toda tentativa; `last_success_at` registra leitura válida do item, inclusive sem preço; `last_price_observed_at` só avança com preço válido e comparável, mesmo se igual; `price_changed_at` fica nulo no primeiro preço e avança apenas em mudança real. Erros não avançam sucesso nem observação de preço. Disponibilidade omitida numa resposta válida torna a observação atual `unknown`, preservando separadamente a última disponibilidade confirmada e seu instante; falhas preservam a observação anterior como último dado conhecido. Transições envolvendo `unknown` não geram evento de estoque.

Enquanto houver vínculo ativo, `not_found` terá nova tentativa automática com intervalo mínimo de 24 horas, aumentado se o orçamento da API exigir. Atualização manual não contorna essa janela, backoff ou limites compartilhados. Sucesso posterior com item válido remove `not_found` e avisos de falha; se ainda sem preço, mantém `missing_price`. Na recuperação, comparar somente ao último preço válido do mesmo contexto; preço igual não duplica histórico, preço diferente registra uma mudança no instante da nova observação (não inferir quando ocorreu durante a lacuna). Disponibilidade confirmada é comparada à última confirmação, sem fabricar evento pela lacuna.

### Histórico, métricas e eventos pessoais

No dashboard e resumo do detalhe, mínimo/máximo usam todo o histórico válido compartilhado dessa publicação/contexto; isso é rotulado “desde o primeiro registro no BestPrice”, mesmo se anterior ao vínculo pessoal. Preço atual é o último válido conhecido; anterior é o registro imediatamente anterior de valor diferente. Diferença absoluta é `atual - anterior`; variação percentual é `(atual - anterior) / anterior * 100`, calculada no backend e arredondada a duas casas com metade para cima. Sem anterior ou com anterior zero, percentual é `null`; sem histórico, todos os preços/métricas são `null`. Não há conversão de moeda nem média de eventos nesta entrega.

Histórico pode ser consultado por intervalo UTC `[from, to)`, sem intervalo retorna todo o período; registros são observações, sem interpolar preço em lacunas. O resumo global não muda conforme paginação do histórico. Na interface, distinguir última tentativa, resultado, última leitura válida de item e última observação de preço; dado antigo permanece rotulado como último conhecido. `stale` usa a idade de `last_price_observed_at` e o prazo de atualidade configurado; ausência desse instante é sempre stale.

Cada vínculo possui `active_since`, renovado ao retomar. Atualizações recentes e indicadores pessoais usam apenas eventos ocorridos a partir desse instante e enquanto o vínculo estava ativo, sem retroatividade. “Baixaram de preço” e “Boas oportunidades” consideram a última mudança, que deve ser queda com anterior maior que zero, observada nas últimas 24 horas e desde `active_since`, com publicação localizada, disponível, preço atual não stale e última tentativa `ok`. Oportunidades ordenam maior queda percentual, desempate por evento mais recente e ID estável. Produtos sem esses requisitos não são oportunidades. O feed mostra mudanças confirmadas de preço/disponibilidade do período ativo atual, mais recentes primeiro; o primeiro preço é baseline, não queda. Total monitorado conta todos os vínculos ativos, inclusive sem preço/não localizados; alertas ativos contam alertas habilitados em vínculos ativos; alvos atingidos contam estes alertas cuja condição foi satisfeita e continua válida conforme as regras abaixo.

### Alertas e notificações incluídos

Há no máximo um alerta por vínculo, alvo BRL estritamente positivo com duas casas decimais. A pessoa pode criar, editar alvo, habilitar, pausar e excluir; o canal é exclusivamente notificação persistida dentro do BestPrice. Só avaliar `current_price <= target_price` com vínculo/alerta ativos, item localizado e disponível, última tentativa `ok` e preço não stale. Sem esses requisitos, condição é desconhecida, não atingida nem rearmada.

Criar alerta ou mudar o alvo abre uma nova revisão: se já houver observação válida abaixo/igual ao alvo, gerar uma única notificação imediatamente usando aquela observação; se não houver, aguardar próxima consulta válida. Repetir edição com valores idênticos é no-op. Após disparo, novas observações ainda abaixo/iguais não repetem notificação. Uma observação válida acima do alvo rearma para um novo cruzamento. Pausar/habilitar sem mudar alvo preserva o estado de disparo; ao habilitar, avaliar o preço atual válido, mas não notificar de novo um episódio já disparado. Alterar alvo é uma nova intenção e pode gerar nova notificação, explicitada na interface.

Parar acompanhamento pausa o alerta atomicamente, preservando alvo, estado de disparo e notificações; retomar vínculo não habilita o alerta automaticamente. Excluir alerta preserva notificações já emitidas; recriar é nova intenção. Notificação guarda vínculo, revisão do alerta, preço observado, alvo e instante UTC; leitura individual é idempotente. A notificação e a marca de disparo são gravadas na mesma transação, com unicidade por alerta/revisão/episódio para resistir a consultas/ações concorrentes e retries. Não excluir notificações ao remover alerta ou interromper vínculo; elas continuam privadas e acessíveis ao titular.

## Critérios de aceite

- [ ] **AC-001** URL de anúncio MLB em formato suportado é aceita e identifica o mesmo ID em links equivalentes; URL de busca, categoria, domínio semelhante, protocolo inseguro e link curto desconhecido são rejeitados sem requisição ao destino fornecido.
- [ ] **AC-002** Pessoa autenticada cola apenas a URL e, com autorização externa válida, vê título, imagem quando disponível, preço quando confiável, moeda, disponibilidade e link para o anúncio persistidos e visíveis após recarga.
- [ ] **AC-003** Anúncio inexistente, acesso negado, token vencido, API indisponível, 429 e resposta sem preço produzem estados distintos e seguros; nenhuma falha substitui preço anterior por zero.
- [ ] **AC-004** Repetir o cadastro pela mesma pessoa retorna resultado de já monitorado; duas pessoas compartilham um registro de publicação com vínculos distintos.
- [ ] **AC-005** Pedidos concorrentes não duplicam publicação, vínculo nem preço inicial; falha transacional não deixa dados parciais.
- [ ] **AC-006** Primeiro preço válido gera um registro histórico; consultas com preço igual não criam evento de mudança; mudança gera exatamente um novo registro com moeda e instante UTC.
- [ ] **AC-007** Dashboard exibe dados persistidos, preço atual e anterior, mínimo, máximo, variação percentual e horários de consulta/alteração quando calculáveis; dados ausentes são identificados como desconhecidos.
- [ ] **AC-008** O agendador consulta uma publicação no máximo uma vez por ciclo, respeita cadência e concorrência configuradas e continua sem a página aberta.
- [ ] **AC-009** Falhas temporárias e 429 preservam preço/histórico, registram a tentativa e reprogramam a consulta sem execução duplicada.
- [ ] **AC-010** Criar alerta com alvo igual/acima do preço elegível gera uma notificação imediata; preço igual/abaixo nas consultas seguintes não repete. Preço acima rearma e novo cruzamento gera uma notificação. Edição idêntica não dispara; novo alvo abre nova revisão; preço ausente/stale ou item indisponível não dispara nem rearma.
- [ ] **AC-011** Interromper acompanhamento retira o item das listas e do agendamento quando não houver outro vínculo ativo; histórico compartilhado permanece; reativação não duplica vínculo.
- [ ] **AC-012** Textos ativos referem-se ao Mercado Livre, mantendo marca BestPrice e acessibilidade em desktop e mobile; produção não usa catálogo ou dados simulados.
- [ ] **AC-013** Uma validação com credenciais reais autorizadas demonstra leitura de um anúncio de terceiro, inclusive preço de venda pertinente ao canal marketplace, disponibilidade e repetição periódica permitida; resultado, limites e data são registrados sem expor tokens.
- [ ] **AC-014** Se AC-013 não for demonstrável, o cadastro que depende da fonte permanece indisponível com mensagem clara e a integração não é apresentada como concluída.
- [ ] **AC-015** Cada entrada da matriz de URLs tem resultado testável; catálogo com `wid`, link curto, ID ambíguo, IP, userinfo e separadores codificados são rejeitados sem HTTP para o destino recebido. ID de catálogo nunca vira publicação por coincidência de prefixo.
- [ ] **AC-016** Preço de outra moeda/canal, variante ambígua ou benefício pessoal é recusado como contexto incompatível e não altera histórico compartilhado; a autorização usada pertence à operação, sem exigir OAuth de vendedor de cada usuário BestPrice.
- [ ] **AC-017** Item válido inicialmente sem preço cria vínculo com preço `null` e zero registros de histórico; primeira observação válida posterior gera exatamente um registro inicial, sem queda. Erro externo inicial não cria item/vínculo parcial. Ausência de disponibilidade é `unknown`, nunca sem estoque presumido.
- [ ] **AC-018** Não localização posterior persiste após recarregar e após timeout subsequente, preservando total monitorado, preço e histórico; uma nova tentativa automática respeita pelo menos 24 horas. Recuperação com preço igual não cria registro; com preço diferente cria um registro na observação, sem datar a mudança na lacuna.
- [ ] **AC-019** Com relógio controlado, erro avança apenas tentativa; item válido sem preço avança sucesso de item, mas não observação de preço; preço igual avança observação, mas não última alteração. Interface distingue cada instante, stale e aviso de última tentativa.
- [ ] **AC-020** Histórico `100.00 → 80.00 → 90.00` produz atual `90.00`, anterior `80.00`, mínimo `80.00`, máximo `100.00`, diferença `10.00` e variação `12.50`; anterior zero produz percentual `null`. Paginar não altera extremos globais. Uma queda anterior ao `active_since`, stale ou mais antiga que 24 horas não entra em oportunidades/indicador pessoal.
- [ ] **AC-021** Parar vínculo pausa alerta; retomar renova `active_since`, não repete eventos anteriores nem habilita alerta. Pausar/habilitar sem novo alvo não repete episódio já disparado; excluir alerta preserva notificação; marcar leitura duas vezes preserva o primeiro instante. Disparos concorrentes produzem uma notificação por episódio/revisão.
- [ ] **AC-022** Contratos retornam 201 para novo vínculo, 409 `already_tracked` com ID próprio para duplicação e 200 ao retomar vínculo inativo. Recursos alheios retornam 404; somente sessão BestPrice inválida produz 401. Token da fonte recusado retorna 503 com código da integração e mantém a sessão da interface.

## Arquitetura e fluxo de dados propostos

React/Vite chama a API FastAPI por `/api`; a rota autentica, valida entrada e entrega resposta. Um serviço de aplicação identifica a publicação, coordena reuso e transação no PostgreSQL e solicita dados a um cliente Mercado Livre isolado. O cliente usa HTTPX com host fixo, token gerido no backend, timeout e tratamento de status. Uma interface de provider só será mantida se facilitar testes ou substituição efetiva. O processamento periódico usa a mesma regra de normalização e atualização do cadastro, sem HTTP nas rotas ou na interface.

O fluxo de cadastro é: validar URL → extrair ID → procurar publicação → consultar quando necessária e autorizada → validar/normalizar dados → persistir publicação, primeiro preço e vínculo em transação → responder à pessoa. O fluxo periódico é: selecionar publicações elegíveis → impedir trabalho simultâneo sobre o mesmo ID → consultar dentro do orçamento da API → atualizar estado e histórico → avaliar alertas → programar próxima tentativa. A política de frequência e retenção será fixada no plano após confirmação dos limites da aplicação.

## Modelagem e migração previstas

Entidades afetadas: User, Product, TrackedProduct, PriceHistory, PriceAlert e Notification. `Product.external_id` identifica a **publicação** MLB e é único no escopo atual; não agrupar anúncios diferentes por nome ou modelo. Se um campo `marketplace` já existir em ambiente com dados reais, usar unicidade composta `(marketplace, external_id)` e preservar Amazon como origem histórica. `Product` mantém título, URL canônica, imagem, preço atual nullable, moeda, contexto fixo, disponibilidade atual/última confirmada, estado de localização, resultado e horário da tentativa, último sucesso de item, última observação de preço, última alteração e timestamps. `PriceHistory` guarda preço Decimal/NUMERIC e moeda/contexto com captura UTC. Vínculo por `(user, product)` é único e guarda ativo/`active_since`. Alertas guardam alvo, habilitação, revisão e episódio/estado de disparo; notificações preservam os valores do disparo e `read_at` nullable. Ambos pertencem à pessoa. Mudanças confirmadas de disponibilidade precisam de registro durável para compor o feed sem reconstrução a partir do estado atual; o plano define sua representação. Constraints e transações devem garantir as unicidades descritas e privacidade, inclusive quando vínculo/alerta forem desativados.

O checkout analisado não possui migrations Alembic nem tabelas de domínio. O plano de implementação deve criar migrações iniciais. Antes de executá-las em qualquer ambiente persistente, verificar schema e dados reais. Se houver registros Amazon fora deste checkout, conservar IDs e históricos com origem explícita; não renomear ASIN para ID MLB nem atribuir IDs MLB artificialmente. Qualquer transformação de dados existentes exige inventário, backup e plano de reversão.

## Contrato mínimo da API BestPrice

Este é um contrato **interno proposto**, não payload da API Mercado Livre nem evidência de acesso externo. O plano o consolida em schemas/tipos antes da implementação. Todos os endpoints abaixo exigem sessão BestPrice. IDs são strings opacas; valores monetários/percentuais são strings decimais (ex.: `"99.90"`, `"-10.00"`) ou `null` quando desconhecidos; instantes usam ISO 8601 UTC com `Z`. Não enviar tokens ou identidade da conta operadora. Listas usam `limit` (padrão 20, máximo 100) e cursor opaco opcional, retornando `{ "items": [...], "next_cursor": null }`; cursor inválido é 422.

DTOs mínimos:

- `TrackedProduct`: `id`, `active`, `active_since`, `product` e `alert` (nullable). `Product`: `id`, `external_id`, `title`, `image_url` nullable, `canonical_url`, `currency="BRL"`, `price_context="mlb_marketplace_unit"`, `current_price`, `previous_price`, `min_price`, `max_price`, `absolute_change`, `percentage_change`, `lookup_status`, `availability`, `last_confirmed_availability` nullable, `last_confirmed_availability_at` nullable, `last_attempt_status`, `last_attempt_at`, `last_success_at`, `last_price_observed_at`, `price_changed_at` nullable e `stale`. Instantes ainda sem observação são null.
- `PriceHistoryEntry`: `id`, `price`, `currency`, `price_context`, `captured_at`. Apenas valores conhecidos; ordenação `captured_at` e ID crescentes.
- `PriceAlert`: `id`, `tracked_product_id`, `target_price`, `currency`, `enabled`, `revision`, `condition` (`unknown`, `above_target`, `target_reached`), `last_notified_at` nullable. A condição pública reflete validade atual; estado interno de disparo pode continuar preservado quando ela é desconhecida.
- `Notification`: `id`, `tracked_product_id`, `type="target_price_reached"`, `product_title`, `observed_price`, `target_price`, `currency`, `observed_at`, `created_at`, `read_at` nullable; ordenação por criação e ID decrescentes.
- `Dashboard`: `summary` com `tracked_count`, `price_drop_count`, `active_alert_count`, `target_reached_count`; `opportunities` (até 5 TrackedProduct pela ordenação definida), `tracked_products` (primeiros 20 ativos, `next_cursor` para a listagem), `recent_updates` (últimos 20 eventos pessoais, sem paginação nesta entrega). Evento contém `id`, `tracked_product_id`, `type` (`price_changed`, `availability_changed`), `previous_value`, `current_value`, `currency` (null para disponibilidade) e `observed_at`.

| Operação | Entrada | Sucesso | Erros principais |
|---|---|---|---|
| `POST /api/tracked-products` | `{ "url": "https://produto.mercadolivre.com.br/MLB-1234567890-titulo-_JM" }` (sintético) | 201 TrackedProduct novo; 200 mesmo vínculo inativo reativado, observando política de reuso/consulta | 400 URL; 409 ativo; 404 anúncio; 429/502/503 fonte |
| `GET /api/tracked-products` | paginação; somente vínculos ativos próprios, por `active_since` e ID decrescentes | 200 lista de TrackedProduct | 401/422 |
| `GET /api/tracked-products/{id}` | ID próprio, inclusive inativo | 200 TrackedProduct | 401/404 |
| `DELETE /api/tracked-products/{id}` | confirmar interrupção na interface | 204, idempotente para vínculo próprio já inativo; pausa alerta | 401/404 |
| `POST /api/tracked-products/{id}/refresh` | sem corpo; vínculo ativo | 200 TrackedProduct atualizado | 401/404/409 inativo; 429/502/503 fonte |
| `GET /api/tracked-products/{id}/history` | paginação e `from`/`to` opcionais UTC, com `from < to` | 200 lista de PriceHistoryEntry, inclusive histórico anterior ao vínculo pessoal | 401/404/422 |
| `POST /api/tracked-products/{id}/alert` | `{ "target_price": "99.90" }`; vínculo ativo | 201 PriceAlert habilitado | 401/404/409 já existe ou vínculo inativo/422 |
| `GET /api/tracked-products/{id}/alert` | ID próprio | 200 PriceAlert | 401/404 |
| `PATCH /api/tracked-products/{id}/alert` | `target_price` e/ou `enabled`; pelo menos um campo | 200 PriceAlert; no-op idêntico preserva revisão | 401/404/409 habilitação em vínculo inativo/422 |
| `DELETE /api/tracked-products/{id}/alert` | ID próprio | 204; idempotente se alerta já ausente e vínculo próprio existe | 401/404 |
| `GET /api/notifications` | paginação própria, `unread_only` booleano opcional (padrão false) | 200 lista de Notification | 401/422 |
| `PATCH /api/notifications/{id}` | `{ "read": true }` | 200 Notification; preservar primeiro `read_at` em repetição | 401/404/422 |
| `GET /api/dashboard` | sessão | 200 Dashboard | 401 |

Formato de erro estável: `{ "error": { "code": "invalid_url", "message": "Insira um link válido de anúncio do Mercado Livre.", "fields": [], "tracked_product_id": null, "retry_after_seconds": null } }`. `fields` contém `{ "field": "target_price", "code": "positive_decimal_required", "message": "Informe um valor positivo com duas casas decimais." }` quando aplicável. Valores auxiliares são null quando não aplicáveis; nunca contêm dados do upstream ou recurso alheio.

| Status | Códigos e semântica |
|---|---|
| 400 | `invalid_url`, `unsupported_url_format`, `ambiguous_item_id`; erro do conteúdo URL |
| 401 | `unauthenticated`: exclusivamente sessão BestPrice ausente/inválida; único erro acima que encaminha ao login |
| 404 | `resource_not_found` para vínculo/alerta/notificação inexistente **ou alheio**; `product_not_found` para cadastro de item confirmado inexistente |
| 409 | `already_tracked` com `tracked_product_id` próprio para “Ver produto”; `alert_already_exists`; `tracking_inactive` |
| 422 | `validation_error`: corpo/tipo/campo obrigatório/query inválido, campo desconhecido ou alvo não positivo/precisão inválida; `fields` aponta cada campo seguro |
| 429 | `integration_rate_limited` ou `refresh_not_due`; incluir `retry_after_seconds` e header `Retry-After` conforme janela efetiva; não tentar automaticamente fora dela |
| 502 | `integration_invalid_response`, `unsupported_price_context` |
| 503 | `integration_unavailable`, `integration_auth_required`, `integration_access_denied`, `integration_not_configured`; nunca propagar 401/403 da fonte como falha de sessão BestPrice |

Falha em refresh preserva estado consultável por GET e persiste a tentativa. Se item já existente for confirmado não localizado, refresh retorna 200 com `lookup_status=not_found` (a consulta terminou com estado de domínio conhecido); erro externo retorna o erro acima e a UI recarrega o estado do vínculo. Resposta válida sem preço é sucesso HTTP com `last_attempt_status=missing_price`. Repetir POST de vínculo ativo retorna 409 antes de consultar a fonte; a mesma regra vale ao perdedor de corrida concorrente. Consultas compartilhadas respeitam somente o contexto definido; nunca expõem IDs de vínculos ou alertas de outras pessoas.

## Validação da API oficial em 08/10/2026

| Tema | Evidência oficial | Consequência |
|---|---|---|
| Aplicação e OAuth | [Criar aplicação](https://developers.mercadolivre.com.br/pt_br/realizacao-de-testes/crie-uma-aplicacao-no-mercado-livre), [autenticação](https://developers.mercadolivre.com.br/autenticacao-e-autorizacao) e [tokens](https://developers.mercadolivre.com.br/pt_br/publicacao-de-produtos/gestao-de-identidades-e-acessos-oauth-e-tokens) descrevem Client ID/Secret, redirect URI HTTPS, autorização de conta e tokens vinculados ao usuário | Credenciais e autorização precisam existir; não presumir que Client ID/Secret isolados dão acesso aos anúncios |
| Item e preço | [Busca de itens](https://developers.mercadolivre.com.br/pt_br/itens-e-buscas) documenta consulta de itens; [API de preços](https://developers.mercadolivre.com.br/pt_br/autenticacao-e-autorizacao/api-de-precos) documenta `GET /items/{id}/prices` e `GET /items/{id}/sale_price` com Bearer | Não depender de `price`, `base_price` ou `original_price` em `/items`; escolher preço e contexto aplicáveis somente após teste real |
| Descontinuação | [Busca de itens](https://developers.mercadolivre.com.br/pt_br/itens-e-buscas) anuncia substituição de `/items?ids=` por `/items/bulk?ids=` até 25/10/2026 | Evitar o endpoint múltiplo antigo em solução nova |
| Limites | [Rate limit / 429](https://developers.mercadolivre.com.br/pt_br/usuarios-e-aplicativos/rate-limit-erro-429) orienta backoff, jitter e redução de concorrência; limite varia por Client ID e endpoint | Não fixar taxa ilimitada nem número universal de RPM |
| Segurança | [Recomendações de token](https://developers.mercadolivre.com.br/pt_br/desenvolvimento-seguro) orientam Bearer em chamadas públicas e privadas e proteção dos tokens | Backend centraliza token e nunca o envia ao navegador |

**Bloqueio de validação:** as páginas consultadas documentam endpoints e autenticação, mas não comprovam que a aplicação BestPrice tem permissão para consultar preço e disponibilidade de **qualquer anúncio de terceiro** para monitoramento contínuo. Não há credenciais, autorização de conta nem respostas reais fornecidas nesta tarefa. É necessário confirmar permissões e finalidade no DevCenter/suporte oficial e testar com uma publicação de terceiro e token da aplicação antes de habilitar o fluxo de cadastro. Não usar scraping ou mocks em produção como substituto.

## Riscos e dependências

- O preço de venda pode variar por canal, comprador, quantidade, promoção e região; o contexto de produto foi fixado nesta spec, mas a capacidade da API de fornecê-lo ainda precisa ser comprovada. Preço que dependa de contexto pessoal/regional incompatível não pode alimentar o estado compartilhado.
- A documentação de preços indica descontinuação de campos em `/items`; respostas, disponibilidade e contexto precisam ser validados em amostras reais autorizadas.
- Acesso a anúncios de terceiros, frequência permitida e possíveis restrições de uso para monitoramento são pendências externas. Um token de vendedor não prova acesso irrestrito.
- A spec 0011 ainda está em rascunho e o código não possui autenticação de usuários. Isolamento por pessoa, alertas e notificações dependem dela ou de revisão explícita do escopo.
- A spec 0012 contém plano Amazon e mudanças locais não commitadas; revisar sua relação com 0013 antes da implementação para evitar contratos conflitantes.

## Plano de migração e fases

1. Confirmar inventário de todos os ambientes, dados e contratos Amazon; preservar documentos históricos e atualizar somente a direção ativa.
2. Revisar esta spec e elaborar plano e tarefas consolidando seu contrato REST, contexto de preço e autorização operadora, com cadência e estratégia de migração. Credenciais pendentes não impedem planejar e construir partes independentes; impedem afirmar acesso externo ou habilitar fluxo dependente sem autorização.
3. Validar a aplicação real do Mercado Livre e autorização para anúncios de terceiros. Se negada, implementar apenas partes independentes, manter cadastro externo bloqueado e documentar ações necessárias.
4. Implementar backend e migrations com testes Red → Green → Refactor, depois frontend, monitoramento, testes de integração e documentação.
5. Verificar API, UI e PostgreSQL localmente; registrar resultado da chamada externa real separadamente dos testes com dublês; submeter revisão e PR para `develop` conforme o fluxo do projeto.

## Fora de escopo

- Suporte simultâneo a outros marketplaces, comparação entre publicações, agrupamento por catálogo e recriação da aplicação.
- Scraping, contorno de CAPTCHA, obtenção de dados por endpoints não documentados e credenciais no frontend.
- Prometer alertas por e-mail/push ou ambientes externos sem infraestrutura e contrato verificados.

## Perguntas em aberto

1. A aplicação BestPrice terá autorização expressa para consultar continuamente item, preço de venda e disponibilidade de publicações de terceiros? Quais limites e condições se aplicam?
2. Qual conta operadora será cadastrada e quem responderá pela autorização/rotação operacional? O modelo de conta operadora está definido, mas sua identidade e credenciais não foram fornecidas.
3. A API autorizada consegue fornecer o contexto MLB/BRL de uma unidade no marketplace sem benefícios pessoais, com disponibilidade confiável? Qual cadência e prazo de atualidade cabem nos limites reais? Se não, registrar bloqueio e revisar o produto antes de qualquer fallback.
4. Há dados Amazon em algum banco fora do checkout analisado?

## Registro dos ajustes desta revisão

Foram definidos contexto compartilhado, autorização operadora condicionada à prova externa, alertas in-app incluídos, estados/recuperação, matriz de URLs, métricas e contrato mínimo para resolver os seis achados da revisão. As decisões de produto acima prevalecem sobre as premissas Amazon e o adiamento de alertas de 0012. Mantém-se `status: rascunho`: este ajuste documental não implementa endpoints/migrations, não demonstra os critérios de aceite da aplicação e não adiciona validação externa à evidência registrada anteriormente. A autenticação persistida de 0011 e a autorização da integração continuam dependências reais.
