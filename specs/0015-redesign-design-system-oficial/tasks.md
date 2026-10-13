# Tarefas — Spec 0015

`[x]` indica implementação ou verificação local demonstrada em `verification.md`, sem
presumir integração em `develop`. AC01–AC08 referem-se aos critérios de `spec.md`.

## Preparação documental

- [x] **T01 / AC07** — Registrar identidade, logo, frontend-design, precedência das
  referências e destino das extensões nas instruções ativas. Evidência: diff de
  `.agents/rules/frontend.md`, `workspace.md` e `designsystem/README.md`.
- [x] **T02 / AC01, AC06, AC08** — Fixar revisão base, inventário de arquivos/superfícies,
  estados existentes, contrato preservado e matriz de evidência no plano. Evidência:
  inspeção do código na base `ab7ff8e`; tabela em `plan.md`.

## Implementação frontend

- [x] **T03 / AC01–AC06** — Revisar proposta visual com frontend-design e registrar ajustes
  em relação à referência. Para qualquer mudança de comportamento, obter Red pelo motivo
  esperado antes de implementar; para CSS, preparar cenários visuais e usar a suíte existente.
- [x] **T04 / AC01–AC03, AC05** — Aplicar tokens comuns, fonte local/fallback, tema automático,
  vidro com fallback sólido e logo oficial; conferir igualdade dos bytes do ativo copiado,
  proporção, nome acessível e mudança de tema sem perda de estado.
- [x] **T05 / AC01–AC06** — Atualizar entrada, sessão e hero visitante; demonstrar carga de
  sessão, indisponibilidade, login ocupado/erro e preservação dos campos e mensagens.
- [x] **T06 / AC01–AC06** — Atualizar todas as superfícies autenticadas do inventário;
  demonstrar estados de dados, erro e ação ocupada sem alterar cálculos, contrato, foco,
  paginação ou confirmação. Manter a tabela mobile empilhada sem scroll horizontal.

## Verificação, revisão e entrega

- [x] **T07 / AC06** — Concluir Green das regressões comportamentais e executar lint,
  testes com contagem positiva e build do frontend. Registrar comandos, resultados e limites.
- [x] **T08 / AC01–AC05, AC08** — QA visual da matriz do plano: cada superfície em ambos os
  temas e 320/768/1280 px; carga/erro/ocupado existentes em ambos os temas e 320/1280 px.
  Incluir teclado, contraste, área de toque, movimento reduzido e fallback sem blur;
  registrar captura, cenário e N/A justificado por ausência real de estado.
- [x] **T09 / AC06** — Conferir fluxo local sessão/painel/detalhe/ação com API e banco;
  separar evidências reais de fixtures e declarar limitações externas do Mercado Livre.
- [x] **T10 / todos** — Encaminhar diff ao arch-reviewer e aceite ao QA; resolver achados
  na mesma worktree e atualizar apenas as evidências afetadas. Revisão de código e QA
  da aplicação foram concluídos após a revisão documental do intake.
- [x] **T11 / AC07** — Após a última mudança de código e revisão, executar o agente
  doc-sync-onboarding; conferir AGENTS.md, CLAUDE.md e docs/, sincronizar projeções e
  registrar resultado em verification.md e docs/PROGRESS.md.
- [ ] **T12 / entrega** — Preparar PR para develop, conferir CI e revisão independente.
  Manter o status `pronta` até o PR ser integrado em `develop`.
