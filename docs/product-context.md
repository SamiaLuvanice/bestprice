# BestPrice — contexto e direção do produto

Este documento registra a visão fornecida pelo responsável pelo produto em 07/10/2026. É a referência de produto para futuras specs; descreve requisitos pretendidos, não funcionalidades já entregues. O estado executável está em [arquitetura](architecture.md) e nos guias dos módulos.

## Proposta de valor

**O usuário cola o link de um produto da Amazon uma única vez e o BestPrice passa a acompanhar automaticamente seu preço e suas alterações.**

BestPrice é uma aplicação web destinada a usuários reais e a operação em produção. Simplicidade, segurança, confiabilidade e manutenção orientam sua evolução. O usuário não precisa preencher nome, imagem, preço, ASIN ou outros dados que a integração deve obter automaticamente.

## Experiência principal

1. O usuário copia o link na Amazon, cola no BestPrice e clica em **Monitorar produto**.
2. O backend valida e normaliza a URL, identifica o produto e extrai seu ASIN.
3. O `AmazonProvider` obtém título, imagem, preço, moeda, disponibilidade e URL canônica, retornando dados normalizados.
4. A aplicação localiza ou cadastra o produto, cria o vínculo de monitoramento do usuário e registra o estado inicial e o primeiro preço conhecido, quando disponível.
5. Consultas periódicas atualizam o estado compartilhado, registram alterações relevantes e avaliam alertas.
6. O usuário acompanha produtos, histórico e notificações pelo BestPrice.

URLs inválidas, produto inexistente e fonte indisponível devem gerar estados compreensíveis e recuperáveis. Preço ausente não significa preço zero. A política para iniciar um monitoramento sem preço ou durante falha temporária será definida na spec correspondente, preservando o fluxo de entrada apenas por URL.

## Identidade e integração

A URL é uma entrada; o ASIN é o identificador externo preferencial. URLs equivalentes do mesmo produto não devem criar duplicatas. O escopo de marketplace precisa ser definido antes da constraint de unicidade: se houver múltiplas regiões, não presumir que ASIN sozinho identifica a mesma oferta, moeda e preço.

Toda obtenção de dados da Amazon passa pela abstração conceitual `AmazonProvider`, responsável por localizar o produto, consultá-lo por ASIN e retornar `ProductData` normalizado. O domínio não depende de HTTP, HTML ou do mecanismo concreto da fonte. O mecanismo de integração ainda precisa ser escolhido e validado quanto a acesso, custo, limites e políticas de uso; este documento não escolhe API nem scraping.

A resolução de URLs e redirecionamentos precisa validar destinos permitidos e impedir acesso a redes internas (SSRF). Credenciais da integração permanecem no backend. Timeouts, rate limits, respostas inválidas, indisponibilidade e remoção de produtos devem ter tratamento explícito, sem transformar falhas de consulta em mudanças de preço ou disponibilidade.

## Monitoramento automático

Um agendador seleciona produtos pendentes, consulta o provider, compara o estado recebido, persiste alterações e avalia alertas. A frequência será configurável e compatível com os limites da fonte. O processamento precisa controlar concorrência, repetição de tarefas e falhas parciais.

O produto é compartilhado: quando vários usuários acompanham o mesmo produto, uma consulta deve alimentar todos os respectivos monitoramentos. Evitar consultas externas concorrentes ou duplicadas e duplicação de vínculos por requisições repetidas. A estratégia de coordenação, retentativas e recuperação será especificada antes da implementação; não se pressupõe uma tecnologia de fila ou scheduler.

## Histórico e métricas

Registrar o primeiro preço conhecido e mudanças relevantes, evitando amostras históricas redundantes quando o estado não mudar. Manter histórico de disponibilidade quando houver transições relevantes.

- `last_checked_at`: instante da última consulta; a spec deve explicitar se representa tentativa ou sucesso e como registrar o outro caso.
- `price_changed_at`: instante da última mudança de preço conhecida; uma consulta sem mudança não o altera.
- Apresentar preço atual, anterior, mínimo, máximo, médio, diferença absoluta, variação percentual, última alteração e última consulta.
- Usar `Decimal`/`NUMERIC` para dinheiro, com moeda explícita, e instantes UTC; formatar na interface no fuso do usuário.

Antes de implementar métricas, definir janela e base de comparação, comportamento sem histórico ou preço anterior válido e cálculo de média. Um histórico por alterações não equivale a amostras periódicas: média dos registros e média ponderada pelo tempo respondem a perguntas diferentes. Evitar comparação entre moedas ou ofertas de escopos diferentes.

## Alertas e notificações

O usuário poderá definir um preço desejado. Quando houver preço válido e comparável e `current_price <= target_price`, o sistema deverá gerar uma notificação. Queda significativa de preço e retorno à disponibilidade também são possibilidades de evolução.

As specs deverão definir canais, significado de queda significativa, reativação do alerta, frequência e prevenção de notificações repetidas enquanto a condição permanecer verdadeira. Monitoramentos, alertas e notificações pertencem ao usuário e exigem autorização em toda operação.

## Dashboard e página do produto

O dashboard deverá permitir leitura rápida dos produtos acompanhados. Indicadores possíveis: total monitorado, reduções de preço, alertas ativos, alvos atingidos, maior queda recente e atualizações recentes. Cada produto poderá mostrar imagem, nome, preço atual e anterior, variação percentual, mínimo registrado, disponibilidade e última atualização.

A página do produto deverá apresentar imagem, nome, preço atual e anterior, mínimo, máximo, média, disponibilidade, última atualização e link para a Amazon. Deverá incluir gráfico de histórico com filtros de 7 dias, 30 dias, 3 meses, 6 meses, 1 ano e todo o período. Diferenciar última consulta e última alteração, incluindo estados sem dados, dados desatualizados, carregamento e erro. Responsividade e acessibilidade fazem parte dos critérios de aceite.

## Modelo conceitual inicial

| Entidade | Responsabilidade pretendida |
|---|---|
| `User` | Identidade e acesso |
| `Product` | Identidade externa e estado compartilhado do produto |
| `TrackedProduct` | Vínculo entre usuário e produto monitorado |
| `PriceHistory` | Primeiro preço conhecido e alterações de preço |
| `AvailabilityHistory` | Alterações relevantes de disponibilidade |
| `PriceAlert` | Condição de preço desejado do usuário |
| `Notification` | Registro da comunicação de um evento ao usuário |

Este é um modelo conceitual, não um esquema aprovado. Relacionamentos, chaves, constraints, índices, retenção, exclusão e transações serão definidos nas specs e migrations. Consulte o [estado atual do banco](database.md).

## Arquitetura e stack pretendidas

Começar como monólito modular. Fluxo conceitual: React/Vite → API REST FastAPI → serviços de aplicação e domínio → repositórios → PostgreSQL. Serviços de aplicação utilizam `AmazonProvider` para dados externos. Rotas validam entrada e traduzem respostas HTTP; regras de negócio permanecem testáveis fora delas. Criar módulos conforme necessidades reais, sem camadas vazias ou microserviços prematuros.

| Área | Direção | Situação no checkout revisado |
|---|---|---|
| Frontend | React, Vite, TypeScript, React Router; componentes e gráficos a definir | React/Vite/TypeScript presentes; sem router ou bibliotecas de componentes/gráficos |
| Backend | Python 3.13, FastAPI, Pydantic, SQLAlchemy, Alembic, HTTPX e autenticação JWT | FastAPI/Pydantic e psycopg no health; HTTPX como dependência de desenvolvimento; sem ORM, migrations ou autenticação |
| Banco | PostgreSQL | Conexão de saúde, sem tabelas de domínio |
| Infraestrutura | Docker, Compose, Git, GitHub, Actions e CI/CD | Stack local, CI e workflow de publicação de imagens/release; sem deploy externo configurado |

Não instalar dependências apenas para antecipar essa lista. Introduzi-las nas specs que justificarem seu uso, mantendo os padrões existentes e contratos compatíveis entre frontend e backend.

## Ambientes e entrega

O destino é operar com **LOCAL, DEV, STAGE e PROD**, com configurações independentes para banco, secrets, URLs, credenciais, chaves e monitoramento. Nenhuma credencial deve ser versionada ou exposta na SPA, nos logs ou nas mensagens de erro.

O fluxo desejado inclui PR, lint, testes, análise, build, imagem Docker, deploy DEV, validação em STAGE e promoção segura para PROD, com rollback. Hoje as branches `develop`, `stage` e `main` organizam integração e promoção de código; sua existência não comprova ambientes implantados. O [fluxo GitHub](github-workflow.md) descreve as automações existentes. Destino de hospedagem, HTTPS, backups/restauração, execução de migrations, observabilidade e rollback operacional ainda precisam de configuração e validação.

Priorizar tecnologias e serviços gratuitos ou com free tier na fase inicial, avaliando limites, custo futuro e confiabilidade antes da adoção. Não há fornecedor de hospedagem escolhido por este documento.

## Qualidade e atuação técnica

Toda funcionalidade deve considerar validação, autenticação e autorização, senhas protegidas, tratamento seguro de erros, testes automatizados, migrations, logs estruturados, observabilidade, performance, acessibilidade e resiliência. Verificar também timeout, rate limit, resposta inválida, produto removido, preço ausente, duplicidade, concorrência e falhas de banco. Funcionar apenas no cenário ideal não basta para concluir uma entrega.

O agente atua como engenheiro responsável pela evolução de um produto real: analisa a arquitetura e dependências antes de codificar, explica decisões relevantes, propõe mudanças incrementais e preserva partes funcionais. Prioriza simplicidade, custo, confiabilidade, segurança e manutenção, sem abstrações sem necessidade ou soluções temporárias apresentadas como definitivas.

Mudanças de comportamento seguem `/spec` → `/plan` → `/implement` com TDD → `/verify`. Este contexto orienta o backlog; não aprova antecipadamente contratos, modelagem detalhada ou implementações.

## Próximas decisões a detalhar em specs

1. Marketplace inicial, formatos de links aceitos, variantes/ofertas e fonte de dados viável.
2. Identidade do produto e do usuário, autenticação JWT, isolamento de dados e modelo persistido.
3. Primeiro fluxo completo de monitoramento por URL, incluindo erros e repetição de requisições.
4. Agendamento compartilhado, frequência, concorrência, histórico e semântica das métricas.
5. Dashboard, detalhe do produto, alertas e canais de notificação.
6. Operação DEV/STAGE/PROD, observabilidade, recuperação e critérios de liberação para usuários reais.
