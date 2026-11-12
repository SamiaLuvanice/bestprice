---
numero: 0056
titulo: Monitoramento com textos enxutos
tipo: melhoria
prioridade: P2
status: pronta
toca: [frontend]
depende_de: [0041]
---

# 0056 — Monitoramento com textos enxutos

Issue [#311](https://github.com/SamiaLuvanice/bestprice/issues/311).

## Problema

Quem acessa o monitoramento encontra quatro frases de apoio no formulário e na lista. A remoção reduz o texto que compete com o cadastro e a consulta de produtos.

## Critérios de aceite

- O formulário de monitoramento omite “Os preços exibidos vêm das consultas do BestPrice ao Mercado Livre e podem diferir do valor no checkout.” e “Cole a URL do anúncio do Mercado Livre para acompanhar automaticamente.”.
- A lista omite “Todos os produtos que você está monitorando.” e “Ordem: mais recentes primeiro”.
- O campo de URL, a ação de monitorar e a ordenação atual continuam disponíveis em desktop e mobile.
- Os quadros correspondentes no Figma omitem as quatro frases.
