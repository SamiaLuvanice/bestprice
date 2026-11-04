# Doc-sync da spec 0047

Executado em 04/11/2026 por `.agents/agents/doc-sync-onboarding.md`, como etapa final após
código, gates, revisão e QA. Worktree `.worktrees/feature-0047-issue-245-chat-pesquisa-precos-web`,
branch `feature/0047-issue-245-chat-pesquisa-precos-web`, HEAD de código `194847a`, base
origin/develop `eb7d657`. Escopo apurado por `git diff origin/develop...HEAD` e leitura de
`backend/app/research/`, da migration `20261104_message_grounding.py`, de
`frontend/src/features/research/`, `docker-compose.yml`, `.env.example` e `frontend/nginx.conf`.
Nenhum código, teste, spec anterior ou status de spec foi alterado. Nenhum gate foi executado
neste doc-sync; os resultados citados vêm de `backend-evidence.md`, `frontend-evidence.md`,
`review.md` e `verification.md`.

**Segunda rodada (após `5675afa`).** Repetida depois de dois commits de código:
`6599759` (`frontend/nginx.conf`: `proxy_read_timeout` de chat/analyze de 35 s para 60 s) e
`95b2a2d` (dados simulados de teste do frontend de `gemini-3.5-flash-lite` para
`gemini-2.5-flash-lite`). Escopo conferido por `git diff 5675afa HEAD`. A evidência citada
dessas correções foi informada pela etapa de correção e não foi reexecutada aqui:
`nginx -t` em `nginx:1.27-alpine` válido; backend falso de 45 s com 504 aos 35 s na
configuração de origin/develop e 200 aos 45 s na nova; frontend com lint exit 0,
Vitest 35 arquivos/413 testes e build aprovados.

## Documentos alterados

| Documento | Motivo |
|---|---|
| `docs/product-context.md` | Afirmava `gemini-3.5-flash-lite` e "não há pesquisa web autônoma". Agora registra a troca de modelo de todo o Assistente, a nova subseção da 0047 (grounding opt-in só no chat, rótulo não verificado, fallback sem busca, aviso de 30 dias, preços web sem monitoramento) e as pendências de validação real. Cabeçalho cita a 0047. |
| `README.md` | Modelo fixo atualizado e `AI_WEB_SEARCH_ENABLED` mencionado; a frase "não há busca de ofertas" foi ajustada para não contradizer a pesquisa na web. |
| `docs/architecture.md` | Tabela de variáveis (modelo e nova `AI_WEB_SEARCH_ENABLED`), visão do cliente research (HTML isolado em iframe) e parágrafo do adapter, que dizia "nenhum retry ou ferramenta de busca"; na segunda rodada, leitura do Nginx em 60 s. |
| `docs/apps/backend.md` | Linhas de capabilities/chat no contrato, modelo, timeout com orçamento de 50 s e nova subseção da 0047: flag, prompt, regras de extração do grounding, fallback único, log seguro, carimbo `searched_at`, persistência e exemplo JSON. |
| `docs/apps/frontend.md` | Nova seção da 0047: validador do contrato, estados de `MessageGrounding`, links, iframe com sandbox e prefixo fixo, aviso `webSearchNotice`, testes e limites (72 px, HTML real, S3/S4). |
| `docs/apps/infraestrutura.md` | Compose repassa `AI_WEB_SEARCH_ENABLED`; nova revisão Alembic; leitura do proxy de chat/analyze em 60 s (antes 35 s), com o motivo e a evidência da correção. |
| `docs/database.md` | Coluna `research_messages.grounding` JSONB nullable, migration `20261104grounding`, SQL NULL sem busca e cascata. |
| `docs/PROGRESS.md` | Entrada da 0047: implementação entregue, aguarda revisão/PR; gates, revisão e pendências; na segunda rodada, correção do proxy e dos dados simulados. |

## Conferidos sem alteração

- `AGENTS.md` e `CLAUDE.md`: a mudança não altera instruções, referências de onboarding ou o
  fluxo do harness. Nenhuma edição.
- `docs/index.md`: nenhum documento novo ou removido.
- `docs/github-workflow.md`: sem mudança de CI ou processo.
- `docs/LEARNINGS.md`: nenhum aprendizado novo foi pedido; não editado.
- `specs/0047-.../verification.md`: não editado, porque este doc-sync não executou comandos.
  Ele reflete a QA em `c336a1d`; as correções posteriores (bug do `null` JSONB, N1, AC11
  doc-sync) estão registradas em `review.md` e `backend-evidence.md`.

## Observações para quem integra

1. **Proxy de chat/analyze — resolvido em `6599759`.** O primeiro doc-sync apontou que os
   35 s de `proxy_read_timeout` do `frontend/nginx.conf` ficavam abaixo do pior caso de 50 s do
   chat com busca. A correção elevou o valor para 60 s; arquitetura, infraestrutura e PROGRESS
   foram atualizados com o novo valor e a evidência informada. O proxy do Cloudflare Pages de
   stage não foi verificado.
2. Pendências mantidas: conta Gemini real com grounding no free tier, HTML real de
   `renderedContent` e altura de 72 px, qualidade em português, intermitência de
   `App.test.tsx` herdada de develop e riscos S3–S6 da revisão.
