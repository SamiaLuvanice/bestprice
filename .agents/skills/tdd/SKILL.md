---
name: tdd
description: Aplicar test-driven development ao implementar ou corrigir comportamento — ciclo Red → Green → Refactor em fatias pequenas.
---

# Test-driven development

Use TDD quando a tarefa altera ou corrige comportamento que pode ser observado por quem usa
uma API, tela ou serviço. Siga `.agents/rules/testing.md` para escolher o nível de teste e os
frameworks já usados no projeto.

## Ciclo por fatia vertical

1. **Red:** escolha um comportamento descrito na spec e escreva o menor teste que o demonstra
   pela fronteira pública adequada. Execute-o e confirme que falha especificamente porque o
   comportamento ainda não existe. Falha de compilação, fixture ou ambiente não é Red válido.
2. **Green:** implemente apenas o necessário para esse teste passar; execute o teste de novo e
   confirme o resultado.
3. **Refactor:** melhore nomes, estrutura e duplicação sem mudar o comportamento; rode novamente
   os testes relevantes e mantenha-os verdes.

Repita um comportamento por vez. Não escreva uma bateria inteira de testes antes de entender os
resultados dos primeiros ciclos; evite implementar funcionalidades especulativas para testes
que ainda não existem.

## Qualidade dos testes

- Teste o comportamento observável por API pública ou interface de usuário, não método privado,
  ordem de chamadas internas ou estrutura de implementação.
- Use resultados esperados independentes da implementação: valor conhecido da spec, exemplo
  calculado manualmente ou resultado de referência. Evite assertivas tautológicas.
- Cubra o caminho feliz e o erro principal de cada regra, sem testar getters triviais,
  comportamento interno de frameworks ou código criado só para elevar cobertura.
- Use mocks nas fronteiras externas quando necessário; não mocke a própria classe ou cada
  colaborador interno. Para decisão concreta de unitário/fatia/integração, siga
  `.agents/rules/testing.md`.

## Ambiguidade e exceções

Não peça aprovação para cada fronteira de teste. Derive o comportamento e a fronteira pública
da spec e das regras existentes. Se a spec não definir uma decisão observável e escolhas
diferentes mudarem o contrato ou critério de aceite, pare e esclareça pelo fluxo spec-driven.

TDD não é requisito para documentação, formatação ou alteração de configuração sem efeito
comportamental quando não houver teste significativo. Ainda assim, execute os portões
pertinentes antes do handoff conforme a skill `quality-gates`.

## Apoio

- `tests.md`: exemplos de testes focados em comportamento e sinais de acoplamento.
- `mocking.md`: quando usar dublês e quando preferir dependências reais de teste.
