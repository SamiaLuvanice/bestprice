# Tarefas — 0047

- [x] Spec pronta, Issue #245, worktree a partir de origin/develop, plano com contrato.
- [ ] B1 — Conferir formato de grounding na doc oficial; registrar em backend-evidence.md.
- [ ] B2 — Red/Green: parsing de grounding (fontes https, limites, html obrigatório, ausência → null).
- [ ] B3 — Red/Green: provider envia tools só no chat com flag; fallback 429/5xx sem tools → unavailable.
- [ ] B4 — Migration grounding JSONB; persistência, serialização, replay idempotente, capabilities.web_search.
- [ ] B5 — Modelo gemini-2.5-flash-lite; comparação sem tools; prompt atualizado.
- [ ] B6 — Ruff + pytest completo verdes com contagem.
- [ ] F1 — Red/Green: validador de grounding no api.ts (aceita null/searched/unavailable, rejeita url não https).
- [ ] F2 — Red/Green: MessageGrounding (rótulo, data Intl, links rel, iframe sandbox sem scripts, aviso unavailable).
- [ ] F3 — Aviso de privacidade condicionado a web_search; a11y e viewports 320–1440.
- [ ] F4 — Lint, Vitest, build verdes com contagem.
- [ ] Integração local ponta a ponta com Gemini simulado na fronteira.
- [ ] Revisão independente (arch-reviewer) e QA.
- [ ] verification.md e docs/PROGRESS.md.
- [ ] doc-sync-onboarding por último.
- [ ] PR para develop com Closes #245; CI.
