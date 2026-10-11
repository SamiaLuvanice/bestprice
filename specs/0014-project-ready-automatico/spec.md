---
numero: 0014
titulo: Issues com spec pronta entram em Ready automaticamente no Project
tipo: melhoria
prioridade: P2
status: pronta
toca: [harness, github, docs]
depende_de: [0008]
---

# 0014 — Issues com spec pronta entram em Ready automaticamente no Project

Issue: https://github.com/SamiaLuvanice/bestprice/issues/39

## Problema

O campo Status do Project tem a opção `Ready`, mas a sincronização automática nunca a
usa: uma Issue aberta fica em `Backlog` até alguém ser atribuído e então salta para
`In progress`. A spec 0008 deixou `Ready` reservada para triagem manual, e qualquer
`Ready` aplicado à mão é sobrescrito no próximo evento sincronizado.

No fluxo do repositório, a spec é escrita e revisada na branch da feature e só chega a
`develop` junto da implementação, na PR que fecha a Issue. Entre a revisão da spec e o
início da implementação, a Issue continua em `Backlog`, indistinguível de demandas
ainda não refinadas. Quem escolhe a próxima tarefa no board não sabe o que já pode ser
implementado.

## Comportamento esperado

O status da spec na branch da feature passa a ser também o sinal do board. A ligação
entre spec, branch e Issue é a convenção de nome já obrigatória,
`feature/<spec>-issue-<numero>-<slug>`: a branch aponta a Issue pelo número e a spec
pelo número de quatro dígitos da pasta em `specs/`.

Quando a spec dessa branch, no estado mais recente publicado no GitHub, estiver com
status `pronta`, a Issue aberta e sem responsável aparece em `Ready`, sem intervenção
manual. A transição ocorre quando a branch recebe uma alteração de spec, quando a
Issue recebe qualquer evento já sincronizado hoje e na reconciliação manual. Em todos
os casos vale o estado atual da branch no GitHub, nunca o conteúdo de um commit
anterior.

Atribuir um responsável continua levando a Issue a `In progress`, com precedência
sobre `Ready`. Remover o último responsável devolve a Issue a `Ready` se a spec
continuar pronta. Se a spec deixar de estar `pronta` (qualquer outro status ou
ilegível), se a branch ainda não tiver a pasta da spec ou se não houver branch da
feature, a Issue aberta sem responsável fica em `Backlog`. Para aparecer em `Ready`,
a spec deve ficar `pronta` antes de alguém ser atribuído. Issue fechada segue as regras da 0008, sem considerar
a spec. PRs não mudam.

Uma branch cuja spec não possa ser lida — mais de uma pasta com o número da spec,
cabeçalho ausente ou status fora de `rascunho`, `pronta`, `implementada` e
`descartada` — conta como spec não pronta. A execução avisa no resumo, sem falhar, e segue com os demais
itens. Erros de credencial, de Project ou de campo continuam falhando visivelmente,
como na 0008.

Esta spec substitui, na 0008, o critério "Issue aberta sem responsável → `Backlog`"
(agora condicionado à spec) e a menção a `Ready` como opção apenas manual.

## Critérios de aceite

- [ ] Dada uma Issue aberta sem responsável e sua branch
  `feature/<spec>-issue-<n>-<slug>` publicada com a spec `<spec>` em `rascunho`,
  quando uma alteração que muda a spec para `pronta` é publicada nessa branch, então o
  Status da Issue passa a ser `Ready`.
- [ ] Dada a mesma situação com a spec já `pronta` na branch, quando a Issue é aberta,
  reaberta, perde o último responsável ou é reconciliada manualmente, então o Status é
  `Ready`.
- [ ] Dada uma Issue em `Ready`, quando alguém é atribuído, então o Status passa a ser
  `In progress`; quando o último responsável é removido e a spec continua `pronta`,
  então volta a `Ready`.
- [ ] Dada uma Issue aberta sem responsável em `Ready`, quando é publicada na branch
  uma alteração que muda a spec para `rascunho`, `implementada` ou `descartada`, então
  o Status volta a `Backlog`.
- [ ] Dada uma Issue aberta sem responsável sem branch da feature, ou cuja branch ainda
  não contém a pasta da spec, ou cuja spec está `rascunho`, quando sincronizada, então
  o Status é `Backlog`, sem aviso no resumo.
- [ ] Dada uma Issue com mais de uma branch da feature, quando sincronizada, então o
  Status é `Ready` se ao menos uma delas tiver a spec `pronta`.
- [ ] Dada uma Issue fechada, quando sincronizada, então o Status segue a 0008
  (`Develop` ou `Backlog`), independentemente da spec em qualquer branch.
- [ ] Dadas duas publicações sucessivas na mesma branch que mudam a spec, quando as
  sincronizações terminam fora de ordem, então o Status final reflete o estado atual
  da spec na branch.
- [ ] Dadas uma publicação na branch e um evento da Issue processados ao mesmo tempo,
  quando ambos terminam, então o Status reflete o estado atual da Issue e da spec.
- [ ] Dada uma branch da feature cuja spec é ilegível (mais de uma pasta com o número,
  cabeçalho ausente ou status inválido), quando sincronizada, então a Issue aberta sem
  responsável fica em `Backlog` (ou `In progress` se tiver responsável), o resumo
  identifica a branch e o motivo e a execução termina sem falha.
- [ ] Dada uma branch que segue o padrão mas aponta Issue inexistente ou uma PR, quando
  sincronizada, então nenhum item do Project é alterado e o resumo informa o motivo,
  sem falhar a execução.
- [ ] Dada uma publicação em branch fora do padrão `feature/<spec>-issue-<n>-<slug>`,
  ou que não altera a spec indicada no nome da branch (por exemplo, atualização com
  `develop` que só traz outras specs), quando ocorre, então nenhum item do Project é
  alterado por causa de specs.
- [ ] Dada a ausência de credencial de Project, quando qualquer gatilho ocorre, então o
  comportamento é o da 0008: aviso e resumo de item não sincronizado, sem falhar os
  gates.
- [ ] Dado qualquer evento de PR, quando processado, então o Status da PR segue a 0008.
- [ ] Dada a documentação do fluxo GitHub, quando consultada, então descreve a regra de
  `Ready`, o vínculo por nome de branch e deixa de afirmar que `Ready` é apenas manual.

## Fora de escopo

- Levar PRs para `Ready`.
- Levar a `Ready` Issues cujas branches não sigam exatamente
  `feature/<spec>-issue-<n>-<slug>` (incluindo `fix/`, `chore/`, `docs/` ou `feature/`
  sem número de spec), ou por label manual.
- Considerar o status da spec em `develop`, `stage` ou `main`.
- Criar, renomear ou remover opções do campo Status; alterar prioridade ou ordenação.
- Mudar a política de PR ou o padrão de nomes de branch.
- Corrigir o status de specs antigas.
- Sincronizar retroativamente todas as Issues abertas sem reconciliação explícita.

## Perguntas em aberto

- **Assumido:** `Ready` vale só para Issues com branch de feature e spec (questão em
  aberto da Issue #39). Uma label manual para Issues sem spec fica para uma demanda
  futura, se fizer falta.
- **Assumido:** o vínculo vem só do nome da branch; a linha `Issue:` da spec não é
  considerada, mesmo que divirja.
- **Assumido:** a remoção da branch não dispara sincronização; o Status é recalculado
  no próximo evento da Issue ou na reconciliação manual.
- **Assumido:** só colaboradores com permissão de escrita publicam branches de
  feature; a credencial do Project não é exposta a forks.
- **Assumido:** "publicada" significa enviada ao GitHub; alterações só locais na
  worktree não contam.
- **Assumido:** depois que a spec fica `pronta`, a implementação continua na mesma
  branch. A Issue fica em `Ready` até alguém ser atribuído, como hoje a passagem a
  `In progress` depende de responsável.
- **Assumido:** os critérios são demonstrados por testes automatizados da regra e por
  uma execução real registrada em `verification.md`. O repositório tem `PROJECT_TOKEN`,
  `PROJECT_OWNER` e `PROJECT_NUMBER` configurados (conferido em 11/10/2026), e a
  documentação que ainda os descreve como pendentes será atualizada; se a execução real não for possível, fica como pendência explícita.
