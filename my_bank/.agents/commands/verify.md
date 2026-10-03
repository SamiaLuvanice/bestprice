---
description: Verifica os critérios de aceite de uma spec e roda os portões
argument-hint: <numero-da-spec>
---

Verifique a spec **$ARGUMENTS**.

## 1. Critérios de aceite

Leia `specs/$ARGUMENTS-*/spec.md`. Para **cada** critério de aceite, demonstre que foi
cumprido — com a saída de um teste, uma chamada real à API (`curl -i`) ou os passos na tela.

Não basta afirmar que passou. Mostre a evidência.

## 2. Portões

```bash
cd backend && ./mvnw verify          # Gradle: ./gradlew build
cd frontend && ng build && ng test --watch=false
```

Reporte, por projeto: compilação, testes (e a contagem de testes executados).

## 3. Conformidade com as rules

- camadas respeitadas, entity fora da API (`architecture.md`)
- erros em `ProblemDetail` pelo handler global (`errors.md`)
- sem segredo no código, senha em log ou autorização só no frontend (`security.md`)
- nomes conforme `naming.md`; `BigDecimal` e `Instant` (`datetime-pipeline.md`)
- Angular: standalone, `HttpClient` só em service, quatro estados da tela (`frontend.md`)

## Relatório

Uma tabela: critério ou portão, situação, evidência.

Seja honesto. Critério não demonstrado é **não cumprido**, mesmo que o código pareça
certo. Portão vermelho é portão vermelho. Se algo ficou de fora, diga o que e por quê —
reduzir escopo é decisão de quem pediu, não sua.
