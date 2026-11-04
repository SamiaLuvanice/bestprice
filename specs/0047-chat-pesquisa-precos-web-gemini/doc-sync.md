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

## Documentos alterados

| Documento | Motivo |
|---|---|
| `docs/product-context.md` | Afirmava `gemini-3.5-flash-lite` e "não há pesquisa web autônoma". Agora registra a troca de modelo de todo o Assistente, a nova subseção da 0047 (grounding opt-in só no chat, rótulo não verificado, fallback sem busca, aviso de 30 dias, preços web sem monitoramento) e as pendências de validação real. Cabeçalho cita a 0047. |
| `README.md` | Modelo fixo atualizado e `AI_WEB_SEARCH_ENABLED` mencionado; a frase "não há busca de ofertas" foi ajustada para não contradizer a pesquisa na web. |
| `docs/architecture.md` | Tabela de variáveis (modelo e nova `AI_WEB_SEARCH_ENABLED`), visão do cliente research (HTML isolado em iframe) e parágrafo do adapter, que dizia "nenhum retry ou ferramenta de busca". |
| `docs/apps/backend.md` | Linhas de capabilities/chat no contrato, modelo, timeout com orçamento de 50 s e nova subseção da 0047: flag, prompt, regras de extração do grounding, fallback único, log seguro, carimbo `searched_at`, persistência e exemplo JSON. |
| `docs/apps/frontend.md` | Nova seção da 0047: validador do contrato, estados de `MessageGrounding`, links, iframe com sandbox e prefixo fixo, aviso `webSearchNotice`, testes e limites (72 px, HTML real, S3/S4). |
| `docs/apps/infraestrutura.md` | Compose repassa `AI_WEB_SEARCH_ENABLED`; nova revisão Alembic; observação sobre o proxy de 35 s. |
| `docs/database.md` | Coluna `research_messages.grounding` JSONB nullable, migration `20261104grounding`, SQL NULL sem busca e cascata. |
| `docs/PROGRESS.md` | Entrada da 0047: implementação entregue, aguarda revisão/PR; gates, revisão e pendências. |

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

1. **Proxy de 35 s (inferência, não exercitada).** `frontend/nginx.conf` mantém
   `proxy_read_timeout 35s` para `/api/ai/chat`. Com `AI_WEB_SEARCH_ENABLED=true`, o chat pode
   levar até 50 s no backend (chamada com busca até 25 s + fallback até 25 s, limitado pelo
   orçamento). Nesse pior caso o Nginx encerraria a leitura antes da resposta. A QA usou o proxy
   Vite. Registrado em arquitetura, infraestrutura e PROGRESS; nenhum código foi mudado.
2. Fixtures de teste do frontend (`assistant.test.tsx`, `research.test.tsx`, `fakeApi.ts`,
   `api.test.ts`, `tests/visual/assistant.spec.ts`) ainda usam
   `model: 'gemini-3.5-flash-lite'` em capabilities simuladas. Não afeta o comportamento (o
   validador não confere o modelo), mas diverge do backend.
3. Pendências mantidas: conta Gemini real com grounding no free tier, HTML real de
   `renderedContent` e altura de 72 px, qualidade em português, intermitência de
   `App.test.tsx` herdada de develop e riscos S3–S6 da revisão.
