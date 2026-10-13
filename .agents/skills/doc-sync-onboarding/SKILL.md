---
name: doc-sync-onboarding
description: Sincronizar obrigatoriamente a documentação de onboarding após qualquer alteração de código no BestPrice.
---

# Sincronização da documentação de onboarding

Execute como última etapa de toda tarefa que altere código, mesmo quando a mudança parecer pequena, ou quando houver pedido explícito de sincronização. Inclua modelos, campos, migrations, rotas, processamento assíncrono, middlewares, integrações, variáveis de ambiente e scripts de infraestrutura. Trabalhe na mesma branch e worktree da mudança que motivou a atualização, quando houver uma. Se o código mudar depois, execute a sincronização novamente. Documentação de comportamento planejado deve ser identificada como tal; `docs/product-context.md` descreve a direção do produto, enquanto código, testes e configuração confirmam o que já funciona.

## Apurar a mudança

1. Delimite a mudança pelo pedido, pela spec e pelo diff relevante. Consulte `git status`, diffs staged/unstaged e, quando necessário, o commit ou a base da branch. Inclua arquivos novos ainda não rastreados. Não atribua ao pedido mudanças preexistentes sem evidência.
2. Leia os arquivos alterados e os relacionados antes de escrever: `backend/app/`, `backend/tests/`, `frontend/src/`, `docker-compose.yml`, `frontend/nginx.conf`, `.github/`, scripts, dependências e `.env.example`, conforme o caso. Confirme rotas, respostas, persistência, estados da UI, configuração e execução pelos testes e pelo código real.
3. Relacione cada fato confirmado aos documentos afetados. Se o histórico não bastar, use o estado atual e a descrição da tarefa; peça contexto apenas quando ainda não for possível delimitar o que deve ser documentado.

## Onde atualizar

| Mudança | Documento principal |
|---|---|
| Setup, comandos e execução local | `README.md` |
| Componentes, dependências, fluxo entre SPA/API/banco e integrações | `docs/architecture.md` |
| Esquema persistido, migrations, relações e índices | `docs/database.md` |
| Rotas FastAPI, configuração e operação do backend | `docs/apps/backend.md` |
| Fluxos React, estados visíveis e comunicação HTTP | `docs/apps/frontend.md` |
| Compose, proxy, scripts, CI e entrega | `docs/apps/infraestrutura.md` e, para processo GitHub, `docs/github-workflow.md` |
| Documento novo ou removido | `docs/index.md` |
| Andamento ou evidência de uma spec | `docs/PROGRESS.md` e `specs/<id>/verification.md`, conforme `/verify` |

Consulte `docs/index.md` para o catálogo e a ordem de leitura. Crie um guia em `docs/apps/` apenas quando surgir uma área real que não caiba nos guias existentes. Confira `AGENTS.md` e `CLAUDE.md` em toda execução e atualize-os quando a mudança alterar instruções, referências de onboarding ou o fluxo do harness. A fonte das instruções é `.agents/`; sincronize suas projeções conforme `.agents/AGENTS.md`. `CLAUDE.md` importa `AGENTS.md` e regras compartilhadas, portanto não duplique nele resumos de arquitetura ou tabelas de variáveis. Se algum dos dois não precisar de edição, informe isso no handoff.

## Escrever e conferir

- Escreva em PT-BR, preservando nomes de código e o formato dos documentos. Comece pelo propósito e pelo fluxo observável; acrescente os detalhes técnicos necessários para reproduzir ou manter o comportamento. Use tabelas e diagramas quando tornarem campos, relações ou fluxos mais claros.
- Separe explicitamente implementação atual, direção do produto e decisões pendentes. Não apresente funcionalidades previstas em `docs/product-context.md` como entregues, nem infira deploy externo a partir de CI ou publicação de imagens.
- Atualize apenas trechos afetados e mantenha links, caminhos, comandos e variáveis coerentes com o checkout. Registre limitações relevantes comprovadas; não invente dívidas ou detalhes para preencher seções.
- Revise o diff dos documentos, links locais e cercas Markdown/Mermaid. Quando a mudança estiver vinculada a uma spec, registre em `verification.md` apenas comandos e resultados realmente executados. No handoff, diga quais documentos mudaram, que alteração os motivou e o que não pôde ser verificado.
