---
description: Datas, instantes, fusos e dinheiro em Python, PostgreSQL e TypeScript.
alwaysApply: true
---

# Datas e dinheiro

Instantes de eventos usam datetime com timezone UTC no Python e timestamptz no PostgreSQL. Nunca persista datetime ingênuo como instante. Datas civis usam date e DATE; não as converta à meia-noite. JSON usa ISO 8601 com Z para UTC e YYYY-MM-DD para data. A interface usa Intl apenas para apresentação no fuso do usuário. Injete uma fonte de tempo nas regras que dependem do relógio para testar de forma determinística.

Dinheiro usa decimal.Decimal criado de string; nunca float para cálculo. Persista como NUMERIC com escala definida pelo domínio. Arredonde uma vez, explicitamente, na fronteira exigida pela regra. O cliente não decide regras monetárias usando number; mostre moeda e unidade de forma explícita.
