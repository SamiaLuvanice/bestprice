---
numero: 0003
titulo: Aproveitamento seletivo do archive
tipo: melhoria
prioridade: P2
status: pronta
toca: [harness, docs]
depende_de: []
---

# 0003 — Aproveitamento seletivo do archive

## Problema

O arquivo guarda orientações e ferramentas de outra stack e de outro fluxo, mas também
contém algumas ideias que servem a este monorepo. Sem adaptação explícita, quem desenvolve
pode tanto perder boas práticas úteis quanto reativar instruções que contradizem a
arquitetura Java + Spring Boot + Angular, as branches atuais ou o Docker Compose real.

## Comportamento esperado

As orientações que continuam úteis aparecem na configuração ativa na forma adequada a este
projeto. Datas e horários distinguem instantes de horários civis e deixam explícita a
decisão sobre transições de fuso. A orientação Angular acompanha a estrutura e os serviços
usados aqui. Cada worktree pode subir sua própria stack Docker sem substituir containers
ou disputar as portas do checkout principal. O fluxo continua protegendo branches
integradoras e mantendo arquivado o material que depende de outras stacks ou serviços.

## Critérios de aceite

- [ ] As orientações ativas para datas e horas cobrem `Instant`, data civil, horário local
      com `ZoneId`, lacunas/sobreposições de horário e testes com relógio controlado em Java.
- [ ] As orientações Angular descrevem a estrutura por feature deste projeto, o service como
      fronteira HTTP e o tratamento dos quatro estados de tela sem exigir arquitetura de outro SPA.
- [ ] Na worktree, o helper envia ao Compose um nome de projeto e portas estáveis derivados do
      caminho; valores de override chegam ao Compose, e os defaults do checkout principal seguem 8080/4200.
- [ ] O fluxo de commit recusa commits diretos em `develop`, `stage` e `main`, com instrução
      para usar branch de feature e PR.
- [ ] O índice do archive explica quais ideias foram adaptadas e deixa claro que scripts e
      integrações incompatíveis continuam fora do fluxo ativo.

## Fora de escopo

- Habilitar Playwright, QA visual, Schemathesis ou contrato OpenAPI sem infraestrutura atual.
- Restaurar orquestração de agentes, ClickUp, Drive, Railway, FastAPI, React ou Vue.
- Alterar regras de domínio da aplicação bancária.

## Perguntas em aberto

- Não há. O suporte a worktrees Docker será um comando auxiliar; `docker compose up --build`
  segue sendo o caminho simples no checkout principal.
