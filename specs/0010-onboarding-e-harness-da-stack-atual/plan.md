# Plano — Spec 0010

## Escopo técnico

A mudança é documental e de harness. O contrato HTTP, o código executável da API, a SPA, o esquema PostgreSQL e as imagens de produção permanecem com o comportamento da base 0007. A verificação do onboarding confrontará os guias com esses arquivos; não há novo endpoint, payload ou erro a especificar.

## Sequência e arquivos

1. Trabalhar em worktree baseada em `origin/develop`. Trazer para ela as alterações documentais e exclusões já preparadas no checkout principal sem incluir materiais locais alheios à spec.
2. Revisar `README.md`, `docs/index.md`, `docs/architecture.md`, `docs/database.md` e `docs/apps/` contra `backend/`, `frontend/`, Compose, scripts e workflows. Corrigir afirmações, links e instruções de setup; manter as ausências reais explícitas.
3. Remover os arquivos inativos da aplicação anterior, além de referências órfãs em documentos, specs atuais e scripts. Preservar somente material ativo da base atual.
4. Alinhar `.agents/AGENTS.md`, `.agents/modules.yaml`, `.agents/sources.md`, `AGENTS.md` e projeções geradas com a lista real de papéis, regras e skills ativos. O catálogo não deve encaminhar para destino inexistente. Ajustar o diagnóstico do harness para tolerar arquivos vazios presentes no projeto.
5. Não incluir a cópia local `vercel-react-best-practices` no conjunto versionado: falta o aviso de licença completo na árvore local e parte das orientações pressupõe Next.js. Usar a skill ativa `react-vite-performance` já integrada pela spec 0009. Manter o diretório de design local fora do pacote.
6. Registrar evidência em `verification.md` e `docs/PROGRESS.md`; fazer revisão independente do diff e QA documental. Vincular a Issue, usar branch própria e preparar PR para `develop`.

## Decisões e razões

| Decisão | Razão | Alternativa rejeitada |
|---|---|---|
| Descrever a base executável atual, inclusive ausências | Permite onboarding sem prometer funcionalidades inexistentes | Inventar modelos, admin ou integrações futuras |
| Excluir a cópia de skill de terceiro sem comprovação local | A spec 0009 já registrou a restrição de licença e a cópia contém regras incompatíveis com Vite | Publicar os 76 arquivos apenas com o campo `license: MIT` |
| Preservar o histórico Git enquanto se retiram arquivos do checkout | Mantém a ancestralidade exigida pelo fluxo de branches | Reescrever commits anteriores |
| Manter mudanças de onboarding e limpeza no mesmo pacote 0010 | Ambas corrigem a entrada de novos desenvolvedores na stack atual | Separar a limpeza do guia que ainda apontaria para ela |

## Riscos e verificação

- Links e cercas Markdown podem quebrar após exclusões: verificar todos os documentos ativos e destinos relativos.
- Um snapshot ou projeção pode conservar caminho antigo: pesquisar o repositório e conferir o catálogo ativo e a saída do sincronizador.
- Documentação pode divergir do comportamento: inspecionar código e configuração e executar os gates aplicáveis; registrar qualquer teste não executado.
- Falhas temporárias da API GitHub podem impedir Issue e PR. Confirmar cada operação por URL real e não declarar integração antes do merge.
