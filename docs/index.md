# Documentação do BestPrice

## Ordem de leitura

1. [README](../README.md) — preparar e iniciar a aplicação.
2. [Contexto do produto](product-context.md) — proposta de valor, requisitos e direção de evolução.
3. [Arquitetura](architecture.md) — entender o caminho entre navegador, API e banco.
4. [Banco de dados](database.md) — conferir o estado real do esquema e a conexão.
5. Os guias de [backend](apps/backend.md), [frontend](apps/frontend.md) e [infraestrutura](apps/infraestrutura.md), conforme sua tarefa.
6. [Fluxo GitHub](github-workflow.md) — entender Issues, PRs, CI, publicação e pendências operacionais.

## Documentos gerais

| Documento | Conteúdo |
|---|---|
| [README](../README.md) | Setup rápido, execução local e Compose |
| [Contexto do produto](product-context.md) | Visão de produção, monitoramento por URL, requisitos e decisões pendentes |
| [Arquitetura](architecture.md) | Componentes, dependências, requisição, configuração e operação |
| [Banco de dados](database.md) | Conexão, migration e tabelas de domínio da branch 0013 |
| [Fluxo GitHub](github-workflow.md) | Processo de contribuição, CI, sincronização opcional e entrega |
| [Progresso](PROGRESS.md) | Registro de andamento do harness |
| [Aprendizados](LEARNINGS.md) | Aprendizados documentados do projeto |
| [Módulos do harness](harness-modules.md) | Módulos usados pelo harness de agentes |
| [Personalização do harness](harness-customization.md) | Configuração do harness |
| [Alterações do harness](HARNESS-CHANGES.md) | Histórico de alterações do harness |
| [Atualização do harness](harness-upgrade.md) | Processo de atualização |
| [Setup do harness](harness-setup.md) | Instalação e configuração do harness |
| [Reivindicações de agentes](agent-claims.md) | Registro operacional de agentes |

## Documentação por módulo/app

| Módulo | Documento | Responsabilidade |
|---|---|---|
| Backend | [apps/backend.md](apps/backend.md) | API FastAPI, sessão, monitoramento MLB e worker |
| Frontend | [apps/frontend.md](apps/frontend.md) | SPA React, dashboard, histórico, alertas e notificações |
| Infraestrutura | [apps/infraestrutura.md](apps/infraestrutura.md) | Compose com Alembic e worker, proxy e automações de entrega |

Não há painel administrativo no código atual; o provisionamento de conta é feito por comando no backend.

## Convenções

- O texto está em PT-BR e nomes de código permanecem como estão no repositório.
- Caminhos e nomes citados apontam para arquivos presentes no checkout atual.
- Documentos técnicos e seus diagramas descrevem o estado implementado; direções futuras são identificadas explicitamente e referenciam o contexto do produto.
- “Não existe” significa que não foi encontrado no código executável atual.
- O README serve como entrada rápida. Os documentos técnicos aprofundam detalhes e apontam pegadinhas observáveis.
