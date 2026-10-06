---
numero: 0007
titulo: Reinício com FastAPI, React e PostgreSQL preservando o harness
tipo: melhoria
prioridade: P1
status: pronta
toca: [backend, frontend, contrato, harness, ci, cd, docs]
depende_de: []
---

# 0007 — Reinício com FastAPI, React e PostgreSQL preservando o harness

Issue: https://github.com/SamiaLuvanice/bestprice/issues/15

## Problema

A pessoa mantenedora decidiu reiniciar a aplicação de estudos com FastAPI,
React e PostgreSQL, reaproveitando o repositório e o harness construído até aqui.
O código da stack anterior já aparece como removido no checkout local,
mas as instruções dos agentes, verificações, automações e documentação ainda
orientam o desenvolvimento pela stack anterior.

Isso impede iniciar a nova aplicação com um processo coerente e pode fazer
agentes recriarem a stack abandonada ou executarem verificações incompatíveis.
A mudança é de direção do projeto; não há relato de incidente em produção.

## Comportamento esperado

O mesmo repositório passa a orientar e validar uma aplicação nova em FastAPI,
React e PostgreSQL. O histórico Git, os registros de decisões e as specs
anteriores permanecem consultáveis, sem reiniciar a numeração ou tratar as
funcionalidades antigas como requisitos da aplicação nova.

O harness conserva seu processo de intake, especificação, planejamento,
implementação com TDD, evidências, revisão e limpeza após integração. Seus
papéis, regras e skills passam a usar a nova stack; conhecimentos específicos
da stack anterior permanecem apenas como referência histórica inativa.
As integrações existentes com GitHub e as proteções de branches são mantidas,
com verificações e entrega de artefatos adequadas à nova aplicação.

Nesta entrega, quem desenvolve consegue preparar o ambiente
seguindo a documentação, iniciar a API, a interface e o banco e demonstrar uma
comunicação mínima entre as três partes. A interface apresenta o resultado da
verificação de disponibilidade, inclusive quando a API ou o banco falha.
Essa base permite iniciar novas features sem reconstruir funcionalidades antigas.

## Critérios de aceite

- [ ] O projeto continua no mesmo repositório, com histórico Git e registros anteriores consultáveis, sem reescrita de histórico nem reutilização de números de specs.
- [ ] As instruções ativas de entrada, papéis, regras, skills e comandos orientam FastAPI, React e PostgreSQL, sem exigir ferramentas da stack anterior para desenvolver a aplicação nova.
- [ ] O processo preserva especificação antes da implementação, TDD para comportamento, evidências, worktrees, revisão e limpeza após integração; as orientações equivalentes continuam acessíveis às ferramentas já configuradas.
- [ ] Uma skill ativa de orquestração atribui papéis adequados a backend, frontend, revisão e QA, registra o andamento e só avança após evidência da etapa; opera com GitHub e `develop` sem depender de board ou deploy externo.
- [ ] As regras técnicas preservam configuração por ambiente sem segredos versionados, validação e erros de API, precisão monetária, distinção entre datas e instantes e testes determinísticos, adaptadas à nova stack.
- [ ] Seguindo a documentação a partir de um clone limpo e dos pré-requisitos declarados, é possível instalar as dependências e iniciar a API FastAPI, a interface React e o PostgreSQL sem ferramentas da stack anterior.
- [ ] Com os três serviços disponíveis, a interface consulta a API e apresenta sucesso somente após uma verificação real de conexão com o PostgreSQL.
- [ ] Uma consulta sem autenticação a `GET /api/health` devolve HTTP 200 e JSON `{ "status": "ok", "database": "ok" }` quando o banco responde; se o banco estiver inacessível, devolve HTTP 503 e JSON com `status` e `database` iguais a `unavailable`.
- [ ] Com a API indisponível ou o banco inacessível, a verificação apresenta falha compreensível na interface, sem indicar sucesso nem expor credenciais ou detalhes internos.
- [ ] A base inclui testes automatizados executáveis para o fluxo mínimo e seu caminho principal de falha; a documentação informa os comandos efetivamente usados.
- [ ] O CI executa as verificações da nova aplicação e das automações preservadas, mantém o check obrigatório compatível com as proteções existentes e falha quando uma verificação obrigatória falha.
- [ ] A configuração de entrega gera artefatos da nova aplicação após os gates, preservando identificação por versão/commit e o fluxo de promoção existente; a validação desta mudança não exige publicar uma release.
- [ ] A documentação distingue a base atual do legado e declara as dependências externas e permissões ainda pendentes, sem apresentar sincronização com Project ou implantação como realizadas sem evidência.
- [ ] As remoções locais da aplicação antiga são incorporadas de forma rastreável durante a implementação, sem restaurar o produto anterior nem apagar materiais de design, segredos locais ou dados persistentes existentes.

## Fora de escopo

- Reconstruir login, dashboard, regras bancárias ou outras funcionalidades do produto anterior.
- Migrar dados ou contratos da aplicação antiga, limpar bancos ou remover volumes persistentes.
- Recriar o repositório, apagar histórico, reiniciar a numeração de specs ou rebaixar proteções de branches.
- Implantar em nuvem, configurar um novo provedor ou publicar uma release nesta etapa de intake.
- Implementar um design completo a partir dos materiais locais de referência.

## Suposições e perguntas em aberto

- FastAPI, React e PostgreSQL são restrições expressas pela pessoa mantenedora.
- O pedido de reiniciar a aplicação e continuar a orquestração inclui nesta spec a adaptação do harness e uma base mínima executável, sem funcionalidades de negócio.
- A skill de orquestração arquivada é material de origem para uma versão ativa alinhada ao fluxo atual; instruções do projeto anterior não serão reativadas literalmente.
- P1 é a prioridade proposta porque a mudança prepara o caminho para todo o desenvolvimento seguinte.
- As specs anteriores são contexto histórico, não dependências de funcionalidades a reimplementar; seu estado registrado não será reescrito para simular uma nova conclusão.
- Versões, ferramentas, bibliotecas complementares, organização interna, contrato mínimo e estratégia de persistência serão definidos no planejamento.
- Dados existentes serão preservados; qualquer descarte posterior requer uma demanda específica.
- A implementação deverá conciliar as remoções já feitas no checkout principal com a worktree exigida pelo projeto, preservando outras alterações locais.
