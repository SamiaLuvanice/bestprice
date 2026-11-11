---
numero: 0055
titulo: Teste estável de detalhe com preço desconhecido
tipo: bug
prioridade: P2
status: pronta
toca: [frontend]
depende_de: []
---

# 0055 — Teste estável de detalhe com preço desconhecido

[Issue #247](https://github.com/SamiaLuvanice/bestprice/issues/247)

Quem valida mudanças no frontend pode receber falhas intermitentes no teste de preço desconhecido, com o detalhe ainda em carregamento. O teste deve continuar cobrindo a abertura direta do detalhe, a indicação de preço indisponível e o histórico vazio, sem exibir preço zero.

## Como reproduzir

1. Execute cinco vezes a suíte completa do frontend sob carga concorrente.
2. Consulte as falhas na busca pelo título do produto e o estado de carregamento no DOM.

## Critérios de aceite

- Demonstrar a causa da falha com uma reprodução controlada que falhe antes da correção e passe depois.
- Preservar as asserções de preço e histórico sem elevar o tempo de espera.
- Registrar cinco execuções completas consecutivas da suíte, lint e build verdes.

Mudanças no contrato da API e na experiência da pessoa usuária estão fora do escopo.
