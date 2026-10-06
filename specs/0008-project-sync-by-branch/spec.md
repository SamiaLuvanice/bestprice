numero: 0008
titulo: Status do Project alinhado ao ciclo das branches
tipo: bug
prioridade: P1
status: pronta
toca: [harness, github, docs]
depende_de: [0006]
---

# 0008 — Status do Project alinhado ao ciclo das branches

Issue: https://github.com/SamiaLuvanice/bestprice/issues/17

## Problema

O Project já usa as opções `Backlog`, `Ready`, `In progress`, `In review`, `Develop`,
`Stage` e `Main`, mas a sincronização espera opções diferentes. Além disso, o estágio
de uma PR precisa refletir a branch de destino: uma integração em `develop` não é uma
entrega em `main`. O cartão pode, portanto, avançar para a coluna errada ou deixar de
ser sincronizado.

Isso afeta quem acompanha as Issues e PRs no Project para saber se uma demanda está
aguardando, em desenvolvimento, em revisão ou já foi integrada em cada linha do
repositório.

## Comportamento esperado

Quando a sincronização do Project estiver configurada, eventos de Issue, eventos de
PR e reconciliação manual devem refletir o estado atual do GitHub usando somente
opções existentes no campo Status. A branch-base da PR determina o estágio de
integração: merge em `develop`, `stage` ou `main` move o cartão da PR para a coluna
homônima. Uma Issue encerrada automaticamente por `Closes #...` após merge na branch
padrão `develop` fica em `Develop`, e não em `Main`.

Uma PR fechada sem merge retorna a `Backlog`. Uma Issue encerrada como não planejada
também retorna a `Backlog`; como não existe a opção `Canceled`, essa limitação deve
ser informada sem bloquear as verificações do repositório.

## Como reproduzir

1. Configure a sincronização do Project e um campo Status com as opções `Backlog`,
   `Ready`, `In progress`, `In review`, `Develop`, `Stage` e `Main`.
2. Abra ou atribua uma Issue e abra uma PR vinculada com destino `develop`.
3. Faça merge da PR em `develop`, causando o fechamento da Issue vinculada.
4. Observe que a automação atual espera nomes de opções não existentes e não define o
   status da integração conforme a branch-base.

## Critérios de aceite

- [ ] Dado uma Issue aberta sem responsável, quando ela for sincronizada, então seu
  Status será `Backlog`.
- [ ] Dado uma Issue aberta com pelo menos um responsável, quando ela for sincronizada
  após abertura, atribuição ou reabertura, então seu Status será `In progress`.
- [ ] Dado uma Issue encerrada pela integração de uma PR em `develop`, quando a
  sincronização ocorrer, então seu Status será `Develop`.
- [ ] Dada uma PR aberta em modo draft, quando for sincronizada, então seu Status será
  `In progress`; quando estiver aberta e pronta para revisão, será `In review`.
- [ ] Dada uma PR integrada em `develop`, `stage` ou `main`, quando for sincronizada,
  então seu Status será respectivamente `Develop`, `Stage` ou `Main`, conforme a
  branch-base registrada na PR.
- [ ] Dada uma PR fechada sem merge, quando a sincronização ocorrer, então seu Status
  será `Backlog`.
- [ ] Dado o campo Status com as opções `Backlog`, `Ready`, `In progress`,
  `In review`, `Develop`, `Stage` e `Main`, quando qualquer estado coberto for
  sincronizado, então não exige opções `Todo`, `Done` ou `Canceled`; `Ready` continua
  disponível para triagem manual.
- [ ] Dada uma Issue fechada como não planejada, quando a sincronização ocorrer, então
  seu Status será `Backlog` e o resumo informará que o Project não tem opção
  `Canceled`, sem bloquear as verificações do repositório.
- [ ] Dada uma branch de destino fora de `develop`, `stage` e `main`, ou uma opção
  necessária ausente no campo Status, quando uma PR mergeada for sincronizada, então
  o job falha claramente antes de adicionar ou alterar o item no Project.
- [ ] Dado um evento antigo processado depois de uma transição mais recente, quando a
  sincronização ocorrer, então o Status corresponderá ao estado atual consultado no
  GitHub, sem regredir a coluna do Project.
- [ ] Dada a ausência de credencial de Project, quando qualquer evento for processado,
  então o workflow emite aviso e resumo dizendo que o item não foi sincronizado,
  sem declarar sincronização bem-sucedida nem falhar os gates da aplicação.

## Fora de escopo

- Alterar as opções, visões, prioridade ou ordenação do Project.
- Configurar ou conceder credenciais de Project; a automação só atua quando a
  configuração externa estiver disponível.
- Automatizar promoções entre `develop`, `stage` e `main`, aprovar PRs ou fazer merge.
- Sincronizar retroativamente todos os cartões históricos sem reconciliação explícita.

## Suposições e perguntas em aberto

- As opções existentes do Project são a fonte de verdade; não serão criadas colunas
  `Todo`, `Done` ou `Canceled` nesta tarefa.
- A branch-base da PR representa o estágio alcançado no ciclo `develop` → `stage` →
  `main`, independentemente de como a PR foi mesclada.
- Cancelamentos não têm coluna própria; uma Issue não planejada volta a `Backlog` e a
  execução informa que `Canceled` não está configurado. PR fechada sem merge também
  volta a `Backlog`.
- A Issue fechada por merge é vinculada nativamente à PR; para esta spec, o caso
  coberto é integração na branch padrão `develop`.
