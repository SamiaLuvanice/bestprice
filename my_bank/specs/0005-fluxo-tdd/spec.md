---
numero: 0005
titulo: Fluxo TDD no harness
tipo: melhoria
prioridade: P2
status: pronta
toca: [harness, docs]
depende_de: []
---

# 0005 — Fluxo TDD no harness

## Problema

O fluxo de implementação do harness pede testes junto das camadas, mas não descreve um ciclo
test-first comum e verificável. Isso permite que o teste seja escrito depois da implementação,
ou que testes acoplados a detalhes internos passem sem proteger o comportamento esperado.

## Comportamento esperado

Durante mudanças de comportamento, quem implementa trabalha em pequenos ciclos: primeiro um
teste de comportamento que falha pela razão esperada, depois a menor alteração para fazê-lo
passar e então uma refatoração mantendo os testes verdes. As orientações valem para Spring Boot
e Angular e seguem as regras de teste existentes. Quando o critério ou a fronteira pública
estiver ambígua, a dúvida é esclarecida; casos claros da spec não exigem confirmação repetida.

## Critérios de aceite

- [ ] A skill de TDD define Red → Green → Refactor por fatia vertical e exige observar uma falha
      causada pela ausência do comportamento antes de implementar.
- [ ] As orientações privilegiam comportamento observável em fronteiras públicas e evitam testes
      tautológicos, privados ou acoplados a chamadas internas.
- [ ] As orientações para mocks são compatíveis com `rules/testing.md` e não substituem os
      runners, frameworks ou convenções do backend e frontend.
- [ ] A rotina não obriga pedir confirmação para cada teste quando a spec já define o
      comportamento; ambiguidades que mudam o contrato continuam seguindo o fluxo de spec.
- [ ] O comando `/implement`, o inventário de skills e o manifesto registram TDD como prática
      ativa do projeto sem remover skills técnicas existentes.
- [ ] Nenhum código de aplicação é alterado; a verificação se limita ao harness e aos documentos.

## Fora de escopo

- Alterar a pirâmide, os frameworks ou a infraestrutura de testes da aplicação.
- Exigir TDD para documentação, configuração ou refatoração sem mudança de comportamento quando
  não existir um teste significativo para o resultado.
- Alterar o comportamento de autenticação ou qualquer outra feature bancária.

## Perguntas em aberto

- Não há. A skill externa é adaptada às regras e aos runners já documentados neste repositório.
