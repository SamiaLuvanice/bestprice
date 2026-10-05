---
name: java-datetime
description: Aplicar datas, instantes e fusos em features Java/Spring Boot, incluindo horários locais, agendamentos e testes determinísticos. Use quando um fluxo guardar, comparar, calcular ou exibir tempo.
---

# Datas e fusos em Java

Leia `.agents/rules/datetime-pipeline.md` primeiro. Esta skill aprofunda os casos em que
`Instant` e `LocalDate` não bastam.

## Escolha o tipo pelo significado

| Significado | Tipos Java | Exemplo |
|---|---|---|
| Ponto exato na linha do tempo | `Instant` | transferência criada às 14:03Z |
| Data civil, sem hora | `LocalDate` | vencimento em 30 de agosto |
| Horário de parede recorrente | `LocalTime` + `ZoneId` | agência abre às 09:00 em São Paulo |
| Ocorrência local única | `LocalDateTime` + `ZoneId` | consulta marcada para 30 de agosto às 09:00 em São Paulo |

`LocalDateTime` não identifica sozinho um instante. Para persistir um evento ocorrido, resolva
o horário com uma zona e armazene o `Instant`. Para uma regra recorrente que deve continuar
às 09:00 locais, guarde o horário local e o identificador regional, por exemplo
`America/Sao_Paulo`; um offset fixo como `-03:00` não representa as regras futuras da região.

## Transições de fuso

Ao converter `LocalDateTime` + `ZoneId`, defina a política de negócio para os dois casos:

- **Horário inexistente (gap):** o relógio local salta à frente. Rejeite a entrada ou ajuste-a
  de forma documentada; não deixe a política implícita.
- **Horário repetido (overlap):** o relógio local volta e duas ocorrências têm a mesma hora.
  Escolha explicitamente o offset anterior ou posterior, ou peça essa escolha ao usuário.

Use `ZoneRules`/`ZoneRules.getValidOffsets()` quando essa distinção afetar uma operação. Não
assuma que todos os fusos têm o mesmo calendário de horário de verão; as regras regionais
podem mudar.

## API e tela

- Para instantes, trafegue ISO 8601 com `Z` ou offset, por exemplo `2026-08-30T14:00:00Z`.
- Para datas civis, trafegue `YYYY-MM-DD` sem conversão para meia-noite.
- Se a intenção é horário local agendado, a API deve transportar data, hora e zona regional
  como valores distintos e documentar a política de gap/overlap.
- A UI converte instantes para exibição no fuso escolhido pelo usuário. Não transforme uma
  data civil em `Date`/instante para formatá-la.

## Testes

- Injete `Clock` no service; use `Clock.fixed(...)` para instante estável e
  `Clock.offset(...)` para avançar o tempo sem `sleep`.
- Teste pelo menos a regra de negócio de expiração ou limite nos dois lados do instante de corte.
- Se houver agendamento local, teste um horário normal e os casos de transição relevantes à
  zona aceita pelo produto (gap e overlap).
- Use `ZoneId.of("America/Sao_Paulo")` ou outra zona regional real nos testes; não use somente
  `ZoneOffset.UTC` para validar conversão de horário civil.
