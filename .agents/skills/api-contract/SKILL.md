---
name: api-contract
description: Definir e evoluir o contrato REST entre o backend Spring Boot e o frontend Angular — rotas, DTOs, códigos de status e formato de erro. Use ao adicionar ou alterar endpoint, campo ou erro; quando o Angular deixar de compilar ou de funcionar após mudança na API; ou ao avaliar se uma alteração quebra compatibilidade.
---

# O contrato da API

Backend e frontend se encontram num ponto só: a API REST. Combine o contrato **antes** de codar
os dois lados — assim um não é moldado por acidente do outro.

## Onde o contrato mora (escolha simples)

Comece **sem arquivo de contrato separado**: o contrato é a seção "Contrato da API" do
`plan.md` da spec (rota, método, DTO de entrada e saída, status, erros). Os DTOs `record` do
backend e as interfaces `*.model.ts` do Angular são as duas pontas.

Quando quiser evoluir (opcional, bom para aprender): adicione `springdoc-openapi-starter-webmvc-ui`
ao backend — ele gera o OpenAPI e a Swagger UI (`/swagger-ui.html`) a partir dos controllers,
e dá para gerar os tipos do Angular a partir dele. Só adote se for um objetivo de estudo.

## A ordem

```
1. contrato no plan.md (rotas + DTOs + erros)
2. backend: DTOs → service → controller → teste (@WebMvcTest)
3. frontend: model.ts → service (HttpClient) → componente → teste
4. conferir ponta a ponta (curl e tela)
```

## Mudança compatível ou quebra?

| Compatível | Quebra |
|---|---|
| rota nova | remover ou renomear rota |
| campo **opcional** novo na resposta | remover ou renomear campo |
| campo opcional novo na requisição | tornar obrigatório um campo opcional |
| relaxar validação | apertar validação |

Quebra exige atualizar backend e frontend juntos (ou versionar `/api/v2`) e uma nota em `docs/adr/`.

## Regras do contrato

- Nomes de campo iguais nos dois lados (`camelCase` no JSON). O que o `record` Java expõe é o que a `interface` TS espera.
- Listas paginadas devolvem um objeto (`content`, `totalElements`, `page`, `size`), nunca um array cru na raiz
  (o `Page<T>` do Spring Data já serve; documente o formato).
- Erros seguem `errors.md` (`ProblemDetail`).
- Valor monetário com `BigDecimal` no Java e número/string decimal no JSON; data em ISO 8601 (ver `datetime-pipeline.md`).
- Entrada desconhecida: configure `spring.jackson.deserialization.fail-on-unknown-properties: true`
  para um `passwrod` digitado errado virar erro, e não ser ignorado em silêncio.

## O Angular quebrou depois de mexer na API

Ótimo sinal: o TypeScript apontou o ponto que mudou. Ajuste o `*.model.ts` e o consumo; não use `any` para silenciar.
