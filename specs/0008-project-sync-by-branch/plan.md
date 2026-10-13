# Plano — 0008

## Produto e contrato de estados

O Project já configurado permanece inalterado. A automação deve reconhecer as opções
exatas `Backlog`, `Ready`, `In progress`, `In review`, `Develop`, `Stage` e `Main`.
Mapeamento esperado:

| Entidade e estado atual no GitHub | Status do Project |
|---|---|
| Issue aberta sem responsável | `Backlog` |
| Issue aberta com responsável | `In progress` |
| Issue fechada pelo fechamento padrão após merge em `develop` | `Develop` |
| PR draft aberta | `In progress` |
| PR aberta pronta para revisão | `In review` |
| PR integrada em `develop` | `Develop` |
| PR integrada em `stage` | `Stage` |
| PR integrada em `main` | `Main` |
| Issue fechada como não planejada | `Backlog`; informar que o Project não tem opção `Canceled` |
| PR fechada sem merge | `Backlog` |

Issue fechada pelo mecanismo padrão após merge em `develop` vai para `Develop`; Issue
fechada como não planejada volta para `Backlog` e o resumo comunica que não há opção
`Canceled`. PR fechada sem merge também volta para `Backlog`. Um evento antigo deve
continuar consultando o estado atual antes de alterar o Project.

## Implementação

- Atualizar a regra de estado para usar os rótulos reais do campo e aceitar o destino
  (`base.ref`) da PR integrada como parte da determinação do Status.
- Atualizar a reconciliação da Issue para distinguir fechamento padrão após merge em
  `develop` de Issue fechada como não planejada.
- Para Issue não planejada, usar `Backlog` e informar a ausência da opção `Canceled`;
  PR fechada sem merge também retorna a `Backlog`.
- Ajustar os testes unitários e de integração simulada para abertura, atribuição,
  reabertura, draft, revisão, merges nas três bases, cancelamentos, opções do Project
  e processamento de evento obsoleto.
- Atualizar `docs/github-workflow.md` para refletir o mapeamento e a limitação de
  cancelamentos, removendo a tabela de status incompatível.
- Manter ausências de credencial como aviso e não executar código da cabeça de uma PR
  com o token privilegiado do Project.

## Arquivos previstos

- `.github/scripts/project-state.cjs` e `.github/scripts/project-state.test.cjs` —
  regra de mapeamento e cobertura de estados.
- `.github/scripts/sync-project.cjs` e `.github/scripts/sync-project.test.cjs` —
  leitura confiável do estado atual, fechamento de Issue e resumo de cancelamento.
- `.github/workflows/project.yml` — eventos/campos necessários para reconciliar os
  estados cobertos sem expor credencial a código não confiável.
- `docs/github-workflow.md` — contrato operacional e limitações.
- `specs/0008-project-sync-by-branch/verification.md` — evidências de aceite.

## Decisões e riscos

- Usar os rótulos existentes evita exigir mudança manual no Project ou manter duas
  taxonomias concorrentes.
- Derivar integração a partir da branch-base registrada na PR preserva o fluxo de
  promoção, sem inferir estágio pelo texto do título ou pela branch de origem.
- O Project não tem coluna de cancelamento. Issue não planejada retorna a `Backlog`,
  com aviso explícito da limitação; criar uma coluna dedicada fica para outra tarefa.
- O fechamento padrão da Issue acontece após merge em `develop`; não inferir `Main` do
  mero fechamento da Issue.
- A API do Project pode não permitir leitura de Status se o item ainda não foi
  adicionado. Confirmar comportamento idempotente e evitar perder o item ao lidar com
  cancelamento; a execução deve indicar claramente qualquer impossibilidade.
