---
numero: 0006
titulo: Integração entre Issues, Projects, PRs e CI/CD
tipo: melhoria
prioridade: P2
status: pronta
toca: [harness, github, ci, cd, docs]
depende_de: [0001]
---

# 0006 — Integração entre Issues, Projects, PRs e CI/CD

Issue: https://github.com/SamiaLuvanice/bestprice/issues/12

## Problema

O desenvolvimento possui specs, branches e revisão, mas o acompanhamento das
tarefas, as verificações e a entrega dependem de operações manuais desconectadas.
Quem desenvolve precisa rastrear cada mudança da demanda até uma entrega verificável.

## Comportamento esperado

Uma demanda começa em uma Issue com critérios de aceite e é priorizada no Project.
A branch é associada à Issue, commits mantêm a referência e a PR declara a tarefa
que resolve. Verificações automáticas e revisão independente condicionam o merge.
A Issue é encerrada quando as regras de integração permitirem e o Project acompanha
o estado das Issues e PRs. A entrega publica artefatos identificáveis após validação.
Permissões ausentes, decisões de priorização e implantação externa ficam explícitas.

## Critérios de aceite

- [ ] Há um formulário de tarefa e um modelo de PR com aceite, spec, Issue e validação.
- [ ] Branches e commits podem ser rastreados até uma Issue; PR sem vínculo válido é rejeitada.
- [ ] Backend e frontend são compilados e testados automaticamente em PRs e branches integradoras.
- [ ] Falha de teste, de build ou de validação do fluxo impede o check agregador de passar.
- [ ] As três branches integradoras exigem checks, resolução de conversas e revisão independente.
- [ ] O fechamento automático de Issues respeita a branch padrão e não usa texto arbitrário como código.
- [ ] O Project recebe Issues/PRs e reflete seu estado quando credenciais e campos estão configurados.
- [ ] Ausência de credenciais de Project é visível e não bloqueia o CI da aplicação.
- [ ] Entregas publicam as duas imagens e uma release identificadas pelo commit após os mesmos gates.
- [ ] Nenhum segredo de publicação é entregue a código de PR; automações privilegiadas usam código confiável.
- [ ] Configuração externa, ativação inicial, recuperação de falhas e passos manuais são documentados.

## Fora de escopo

- Provisionar nuvem, domínio, banco persistente ou implantar sem destino definido.
- Aprovar ou integrar PRs automaticamente; inferir prioridade a partir do texto de tarefas.
- Migrar registros históricos das specs para Issues ou mudar funcionalidades bancárias.

## Suposições e dependências

- Na ausência de um destino, a entrega consiste em imagens no GHCR e release; implantação é manual.
- Proposta: develop como branch padrão de integração, stage para candidata e main para release.
- O token atual tem acesso administrativo ao repositório, mas não possui escopo project.
- A implementação é autorizada pelo pedido; integração desta spec aguarda revisão independente.
