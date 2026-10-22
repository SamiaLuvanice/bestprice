# Tarefas — 0029

- [x] T01: Vincular a Issue #167 e revisar a spec com o papel `spec-reviewer`;
  incorporar critérios objetivos para tipografia e presença da logo.
- [x] T02: Confirmar `origin/develop` e criar branch/worktree da Issue, com base
  `2df3129`.
- [x] T03: Fixar escopo sem mudança REST, decisões visuais, riscos e evidências
  no `plan.md`.
- [ ] T04: Investigar e tentar reproduzir a divergência e a ausência móvel nas
  rotas, estados e larguras previstos; registrar ocorrências ou limites com
  capturas, Console/Network e estilos computados.
- [ ] T05: Escrever regressão para marca visível, nome acessível único e
  persistência nas transições móveis; demonstrar Red pelo comportamento incorreto.
- [ ] T06: Corrigir apresentação e renderização da marca conforme a causa
  comprovada, preservando a logo oficial, destinos dos links e layout responsivo;
  demonstrar Green.
- [ ] T07: Verificar AC01–AC05 em 320, 390, 768 e 1280 px, incluindo navegação,
  retorno, recarregamento, mudança de aba, carregamento e erro. Registrar evidência
  e limites em `verification.md`.
- [ ] T08: Acrescentar o projeto Playwright de 390 px, rodar lint, Vitest,
  build, Playwright visual e axe aplicáveis nas quatro larguras; revisar cada
  baseline alterada. Registrar comandos, contagens e resultados reais.
- [ ] T09: Fazer revisão independente do diff com `arch-reviewer` e aceite com
  `qa`; devolver achados ao implementador na mesma worktree.
- [ ] T10: Após a última mudança de código, executar `doc-sync-onboarding` como
  etapa final, conferir documentação de onboarding e atualizar `docs/PROGRESS.md`.
- [ ] T11: Preparar PR para `develop` com `Closes #167`, evidências e pendências;
  só concluir a spec após revisão, CI e integração.
