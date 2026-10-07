# Documentação do BestPrice

## Ordem de leitura

1. [README](../README.md) — preparar e iniciar a aplicação.
2. [Arquitetura](architecture.md) — entender o caminho entre navegador, API e banco.
3. [Banco de dados](database.md) — conferir o estado real do esquema e a conexão.
4. Os guias de [backend](apps/backend.md), [frontend](apps/frontend.md) e [infraestrutura](apps/infraestrutura.md), conforme sua tarefa.
5. [Fluxo GitHub](github-workflow.md) — entender Issues, PRs, CI, publicação e pendências operacionais.

## Documentos gerais

| Documento | Conteúdo |
|---|---|
| [README](../README.md) | Setup rápido, execução local e Compose |
| [Arquitetura](architecture.md) | Componentes, dependências, requisição, configuração e operação |
| [Banco de dados](database.md) | Conexão, tabelas, modelo ER e ausência de esquema de domínio |
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
| Backend | [apps/backend.md](apps/backend.md) | API FastAPI, configuração do PostgreSQL e verificação de saúde |
| Frontend | [apps/frontend.md](apps/frontend.md) | SPA React, consulta HTTP e apresentação dos estados |
| Infraestrutura | [apps/infraestrutura.md](apps/infraestrutura.md) | Compose, imagens, proxy, scripts e automações de entrega |

Não há painel administrativo no código atual; portanto não existe `docs/admin.md` nem tarefas operacionais de administração da aplicação para descrever.

## Convenções

- O texto está em PT-BR e nomes de código permanecem como estão no repositório.
- Caminhos e nomes citados apontam para arquivos presentes no checkout atual.
- Diagramas descrevem apenas fluxos configurados ou implementados.
- “Não existe” significa que não foi encontrado no código executável atual.
- O README serve como entrada rápida. Os documentos técnicos aprofundam detalhes e apontam pegadinhas observáveis.
