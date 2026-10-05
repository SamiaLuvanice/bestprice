---
name: quality-gates
description: Rodar e interpretar os portões de qualidade do projeto — compilação, testes e lint do backend Spring Boot e do frontend Angular. Use antes de commitar, quando o build ficar vermelho, ou ao decidir se uma mudança está pronta.
---

# Portões de qualidade

Mantidos **simples**: o que já vem nas ferramentas oficiais. Não adicione verificadores sem motivo.

## Os comandos

```bash
# backend (dentro de backend/)
./mvnw verify            # compila, roda testes (Gradle: ./gradlew build)

# frontend (dentro de frontend/)
ng build                 # compila e checa tipos dos templates
ng test --watch=false    # testes unitários
ng lint                  # só se o projeto adicionou ESLint (angular-eslint)
```

Se o repositório tiver um `Makefile` ou scripts em `harness.yaml → quality`, prefira-os.

## O que cada portão protege

| Portão | Impede |
|---|---|
| compilação (`javac` / `ng build`) | erro de sintaxe e de tipos |
| testes | regressão de comportamento |
| lint (opcional) | bug conhecido, estilo inconsistente |
| formatação | diff poluído por estilo |

## Interpretando falhas

- **Teste vermelho:** leia a causa na stack trace (`Caused by:` mais profundo) antes de mexer. Regra `evidencia.md`.
- **Falha só no `verify` e não no IDE:** ambiente/JDK diferente ou teste dependente de ordem. Rode `./mvnw -q clean verify`.
- **`ng build` com erro de template:** o erro aponta o arquivo e a linha do HTML; corrija o tipo, não use `any`/`$any`.
- **Aviso de depreciação:** leia; se for do seu código, atualize para a API nova.
- **Cobertura:** use como pista de caminhos sem teste, nunca como meta numérica.

## Antes de commitar

Rode os portões da parte que você tocou. Se está pensando em `--no-verify`, o portão está certo e a pressa é sua.

## Ordem para consertar

```
compilação → testes → lint/formatação → refinos
```
