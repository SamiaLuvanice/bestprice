---
description: Datas, horas e dinheiro — Instant/UTC no backend, BigDecimal para valores, conversão só na tela.
alwaysApply: true
---

# Datas e dinheiro

Casos com horário local, agendamento e transições de fuso: skill
`.agents/skills/java-datetime/SKILL.md`.

## Datas e horas

1. **Instantes** (quando algo aconteceu) usam `java.time.Instant` e são gravados em UTC
   (`TIMESTAMP`/`timestamptz`). Configure `spring.jackson.time-zone: UTC`.
2. **Datas sem hora** (vencimento, aniversário) usam `LocalDate`. Nunca converta para instante "meia-noite".
3. **Nunca** `java.util.Date`/`Calendar`; nunca `LocalDateTime` para guardar um instante (não tem fuso).
4. A API trafega **ISO 8601**: `2026-08-30T14:00:00Z` e `2026-08-30`.
5. O **Angular** converte para o fuso/idioma do usuário **só ao exibir** (`DatePipe`/`Intl`).
   Lógica de negócio com datas fica no backend.
6. Relógio injetável: o service recebe um `java.time.Clock` (bean) em vez de chamar `Instant.now()`
   direto, para o teste controlar o tempo.

## Dinheiro

1. **`BigDecimal`**, nunca `double`/`float`. Persistido como `NUMERIC(19,2)` (`@Column(precision = 19, scale = 2)`).
2. Crie `BigDecimal` a partir de `String` (`new BigDecimal("10.50")` / `BigDecimal.valueOf`), nunca de `double`.
3. Arredonde **uma vez**, explícito: `setScale(2, RoundingMode.HALF_EVEN)`. Comparação com `compareTo`, não `equals`.
4. Na API, valor como número JSON decimal (ou string) e **sempre com a moeda** quando houver mais de uma (`BRL`).
5. No Angular, não faça aritmética monetária com `number` para decidir regra: exiba com `CurrencyPipe`
   e deixe o cálculo para o backend.
