# Tarefas — Spec 0017

- [x] **T01** — Registrar spec, plano, tarefas e protótipo `designsystem/login.html` no Git (`15903bf`).
- [x] **T01b** — Revisar a spec com `spec-reviewer` (1ª rodada reprovada; 2ª aprovada com ressalvas menores R2–R7, aplicadas), aplicar as decisões de 13/10, marcar `pronta` e alinhar a Issue #56 aos ACs da spec.
- [ ] **T02** — Red: `frontend/src/LoginForm.test.tsx` (AC02–AC06) e integração em `frontend/src/App.test.tsx`. Falham pela ausência de `LoginForm`; registrar a saída.
- [ ] **T03** — Registrar as extensões em `designsystem/README.md` (decisão 6 do plano).
- [ ] **T04** — Green: `frontend/src/LoginForm.tsx` e estilos em `frontend/src/styles.css` (casca, brilhos com clip, duas colunas acima de 840 px, pílula, controle de senha de 44 px, reduced-motion).
- [ ] **T05** — Integrar em `frontend/src/App.tsx` (`login(email, password)`, sem estado `email`/`password`), mantendo o formulário de monitoramento. A suíte existente segue verde, conforme a seção "Impacto nos testes existentes".
- [ ] **T06** — Refactor: remover estilos órfãos do painel antigo.
- [ ] **T07** — Gates em `frontend/`: `npm run lint`, `npm test -- --run`, `npm run build`, com contagens reais.
- [ ] **T08** — QA no navegador com o agente `qa`: AC01 com e sem `backdrop-filter`; AC07 em 320, 768 e 1280 px; AC08 com contraste, teclado, reduced-motion e axe; AC06 com campos vazios, 401 e API parada.
- [ ] **T09** — Revisão independente com `arch-reviewer`. Achados voltam à worktree com teste de regressão.
- [ ] **T10** — Registrar as evidências por AC em `specs/0017-redesign-pagina-login/verification.md`.
- [ ] **T11** — `doc-sync-onboarding` por último: `docs/apps/frontend.md`, `docs/PROGRESS.md`, `AGENTS.md` e `CLAUDE.md` conferidos.
- [ ] **T12** — Commits, push de `feature/0017-issue-56-redesign-login` e PR para `develop` com `Closes #56`.
