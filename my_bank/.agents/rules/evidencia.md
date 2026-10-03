---
description: Evidência antes de hipótese — leia o que o sistema registrou antes de explicar uma falha.
alwaysApply: true
---

# Evidência antes de hipótese

Código certo sobre premissa errada é retrabalho caro. Quase todo diagnóstico errado vem de
**raciocinar sobre o sistema em vez de perguntar a ele**.

## 1. Leia o que já foi registrado

Antes de explicar uma falha, colha a evidência que existe:

| Falhou | Onde está a resposta |
|---|---|
| teste Java | `backend/target/surefire-reports/` (Maven) ou `backend/build/reports/tests/` (Gradle) — a stack trace completa |
| aplicação Spring não sobe | o log do `spring-boot:run` / `bootRun`: procure `APPLICATION FAILED TO START` e `Caused by:` (a causa raiz é a **última**) |
| requisição da API | log do Spring + `curl -i` reproduzindo (status, headers e corpo) |
| banco | console do H2 (`/h2-console`) ou `psql`, conforme o profile |
| Angular não compila | saída do `ng build` / `ng serve` — o primeiro erro, não o último |
| erro no navegador | aba Console e Network (status, payload e resposta reais) |

Custo de ler a evidência: um comando. Custo de não ler: uma tarde.

## 2. Verde só vale se executou

Um teste ou portão pode passar por não alcançar o que deveria medir (teste sem `assert`,
`@Disabled`, filtro que seleciona zero testes). Confirme que o teste **rodou** (contagem de
testes > 0) e, para teste novo, **quebre de propósito** o código que ele guarda e veja ficar vermelho.

## 3. Ao reportar

Separe **observado** (saída colada) de **inferido** (sua hipótese). Se não rodou, diga que
não rodou.
