# Plano — 0005 Fluxo TDD no harness

## Contrato

Sem alteração na API da aplicação. A mudança define o procedimento test-first aplicado durante
implementações com mudança de comportamento.

## Arquivos e camadas

- `.agents/skills/tdd/SKILL.md` (novo): ciclo Red → Green → Refactor, critérios para testes
  observáveis e limites de quando exigir TDD.
- `.agents/skills/tdd/tests.md` e `mocking.md` (novos): exemplos complementares adaptados aos
  princípios do projeto e com remissão a `rules/testing.md` para ferramentas concretas.
- `.agents/commands/implement.md`: aplica TDD nas fatias de backend/frontend quando há mudança
  de comportamento.
- `.agents/skills/spec-driven/SKILL.md`: mostra TDD no fluxo de implementação.
- `.agents/AGENTS.md` e `.agents/modules.yaml`: registram a skill como processo ativo,
  preservando `angular-feature`, `java-datetime` e `task-cleanup`.
- `skills-lock.json`: mantém origem e hash da skill externa instalada.
- `AGENTS.md`: indica o ciclo TDD no fluxo resumido.
- `specs/0005-fluxo-tdd/`: spec, plano, tarefas e evidências.
- `docs/PROGRESS.md`: registra a mudança e os resultados.

## Decisões

| Decisão | Alternativa descartada | Motivo |
|---|---|---|
| Adaptar o guia externo às regras locais e ao Red-Green-Refactor padrão | Copiar instruções externas sem revisão | O guia original exige confirmação manual de cada fronteira e delega refatoração para fora do ciclo, o que conflita com autonomia e com o próprio ciclo TDD. |
| Exigir TDD para alteração de comportamento, não para toda edição | Forçar teste-first em docs/config | Nem toda alteração não comportamental tem um teste útil; TDD deve proteger regras e resultados observáveis. |
| Manter os guias gerais de teste como fonte das ferramentas do projeto | Duplicar setup de JUnit/Angular/Vitest na skill | Evita divergência com `rules/testing.md` e mudanças futuras de runner. |

## Riscos

- Um teste pode falhar por erro de ambiente e ser confundido com a falha esperada; a skill manda
  confirmar que a asserção relativa ao comportamento é a causa.
- Mock excessivo pode produzir testes frágeis; a orientação mantém mocks nas fronteiras externas
  e pede preferência pelos seams reais já estabelecidos pelo projeto.
- O `skills-lock.json` registra a versão de origem importada; a cópia ativa é adaptada às
  regras locais e suas diferenças permanecem revisáveis no Git.
