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

A pessoa mantenedora decidiu estruturar a aplicação de estudos com FastAPI,
React e PostgreSQL, reaproveitando o repositório e o harness construído até aqui.
As instruções dos agentes, verificações, automações e documentação precisavam
ser alinhadas ao perfil técnico definido para o projeto.

Isso impede iniciar a nova aplicação com um processo coerente e pode fazer
agentes recriarem a stack abandonada ou executarem verificações incompatíveis.
A mudança é de direção do projeto; não há relato de incidente em produção.

## Comportamento esperado

O mesmo repositório passa a orientar e validar uma aplicação em FastAPI,
React e PostgreSQL, com specs numeradas em sequência e requisitos alinhados ao
perfil técnico definido para o projeto.

O harness conserva seu processo de intake, especificação, planejamento,
implementação com TDD, evidências, revisão e limpeza após integração. Seus
papéis, regras e skills passam a usar o perfil técnico definido para o projeto.
As integrações existentes com GitHub e as proteções de branches são mantidas,
com verificações e entrega de artefatos adequadas à nova aplicação.

Nesta entrega, quem desenvolve consegue preparar o ambiente
seguindo a documentação, iniciar a API, a interface e o banco e demonstrar uma
comunicação mínima entre as três partes. A interface apresenta o resultado da
verificação de disponibilidade, inclusive quando a API ou o banco falha.
Essa base permite iniciar novas features sem reconstruir funcionalidades antigas.

## Critérios de aceite

- [ ] O projeto continua no mesmo repositório, mantém o histórico Git e não reutiliza números de specs.
- [ ] As instruções ativas de entrada, papéis, regras, skills e comandos orientam FastAPI, React e PostgreSQL, sem exigir ferramentas fora do perfil técnico do projeto.
- [ ] O processo preserva especificação antes da implementação, TDD para comportamento, evidências, worktrees, revisão e limpeza após integração; as orientações equivalentes continuam acessíveis às ferramentas já configuradas.
- [ ] Uma skill ativa de orquestração atribui papéis adequados a backend, frontend, revisão e QA, registra o andamento e só avança após evidência da etapa; opera com GitHub e `develop` sem depender de board ou deploy externo.
- [ ] As regras técnicas preservam configuração por ambiente sem segredos versionados, validação e erros de API, precisão monetária, distinção entre datas e instantes e testes determinísticos, adaptadas à nova stack.
- [ ] Seguindo a documentação a partir de um clone limpo e dos pré-requisitos declarados, é possível instalar as dependências e iniciar a API FastAPI, a interface React e o PostgreSQL.
- [ ] Com os três serviços disponíveis, a interface consulta a API e apresenta sucesso somente após uma verificação real de conexão com o PostgreSQL.
- [ ] Uma consulta sem autenticação a `GET /api/health` devolve HTTP 200 e JSON `{ "status": "ok", "database": "ok" }` quando o banco responde; se o banco estiver inacessível, devolve HTTP 503 e JSON com `status` e `database` iguais a `unavailable`.
- [ ] Com a API indisponível ou o banco inacessível, a verificação apresenta falha compreensível na interface, sem indicar sucesso nem expor credenciais ou detalhes internos.
- [ ] A base inclui testes automatizados executáveis para o fluxo mínimo e seu caminho principal de falha; a documentação informa os comandos efetivamente usados.
- [ ] O CI executa as verificações da nova aplicação e das automações preservadas, mantém o check obrigatório compatível com as proteções existentes e falha quando uma verificação obrigatória falha.
- [ ] A configuração de entrega gera artefatos da nova aplicação após os gates, preservando identificação por versão/commit e o fluxo de promoção existente; a validação desta mudança não exige publicar uma release.
- [ ] A documentação descreve a base atual e declara as dependências externas e permissões ainda pendentes, sem apresentar sincronização com Project ou implantação como realizadas sem evidência.
- [ ] As mudanças de base preservam materiais de design, segredos locais e dados persistentes existentes.

## Fora de escopo

- Reconstruir funcionalidades de negócio fora do escopo desta base mínima.
- Migrar dados ou contratos de outra aplicação, limpar bancos ou remover volumes persistentes.
- Recriar o repositório, apagar histórico, reiniciar a numeração de specs ou rebaixar proteções de branches.
- Implantar em nuvem, configurar um novo provedor ou publicar uma release nesta etapa de intake.
- Implementar um design completo a partir dos materiais locais de referência.

## Suposições e perguntas em aberto

- FastAPI, React e PostgreSQL são restrições expressas pela pessoa mantenedora.
- O pedido de reiniciar a aplicação e continuar a orquestração inclui nesta spec a adaptação do harness e uma base mínima executável, sem funcionalidades de negócio.
- P1 é a prioridade proposta porque a mudança prepara o caminho para todo o desenvolvimento seguinte.
- Versões, ferramentas, bibliotecas complementares, organização interna, contrato mínimo e estratégia de persistência serão definidos no planejamento.
- Dados existentes serão preservados; qualquer descarte posterior requer uma demanda específica.
- A implementação deverá conciliar as remoções já feitas no checkout principal com a worktree exigida pelo projeto, preservando outras alterações locais.
