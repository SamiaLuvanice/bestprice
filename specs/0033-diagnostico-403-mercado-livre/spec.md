---
numero: 0033
titulo: Identificar o recurso negado pela API do Mercado Livre
tipo: bug
prioridade: P2
status: pronta
toca: [backend]
depende_de: [0026, 0032]
---

# 0033 — Identificar o recurso negado pela API do Mercado Livre

Issue: https://github.com/SamiaLuvanice/bestprice/issues/184

## Problema

A validação Stage confirmou a renovação OAuth, mas as consultas dos anúncios
receberam HTTP 403. O cliente converte qualquer 403 no mesmo erro sanitizado e
a sonda não informa se a negação ocorreu ao ler o anúncio ou seu preço. Sem essa
distinção, a pessoa operadora não consegue direcionar a investigação no
DevCenter. O gate de integração permanece desligado e a API pública continua
respondendo 503 enquanto falta comprovação de acesso.

## Comportamento esperado

Quando uma leitura do Mercado Livre recebe HTTP 403, a sonda identifica no
relatório sanitizado apenas o tipo de recurso negado: `item` ou `sale_price`.
Esse diagnóstico preserva o código público `integration_access_denied`, sem
expor caminho com identificador, resposta upstream, credenciais ou dados do
anúncio. Falhas de outros tipos mantêm o relatório atual. Nenhuma permissão OAuth
é ampliada e o gate não muda automaticamente.

## Como reproduzir

1. Disparar o workflow manual de validação do Stage com IDs MLB distintos.
2. Permitir que a renovação OAuth conclua, mas fazer uma das leituras retornar
   HTTP 403.
3. Observar o relatório atual: aparece `integration_access_denied`, sem indicar
   qual recurso recebeu a negação.

## Critérios de aceite

- [ ] **AC01** — Um HTTP 403 em `/items/{id}` gera erro público
  `integration_access_denied` e a sonda informa `blocked_resource: item`.
- [ ] **AC02** — Um HTTP 403 em `/items/{id}/sale_price` gera erro público
  `integration_access_denied` e a sonda informa
  `blocked_resource: sale_price`.
- [ ] **AC03** — A saída não contém caminho completo, corpo upstream, token,
  header de autorização, título, permalink ou outro conteúdo do anúncio.
- [ ] **AC04** — Erros diferentes de 403 e falhas 403 simuladas sem metadado de
  recurso mantêm saída segura e não inventam a origem da negação.
- [ ] **AC05** — A execução permanece somente de leitura para anúncios; nenhum
  escopo OAuth é ampliado e o gate continua sob decisão operacional explícita.

## Fora de escopo

- Alterar escopos, configuração ou certificação do app no DevCenter.
- Registrar ou exibir corpo bruto, códigos arbitrários da resposta ou dados do anúncio.
- Ativar `MERCADOLIVRE_THIRD_PARTY_VALIDATED` ou mudar o comportamento 503 do gate.
- Repetir chamadas reais ao Mercado Livre antes de aplicar o diagnóstico.

## Perguntas em aberto

- A suposição é que identificar apenas `item` ou `sale_price` é suficiente para
  direcionar a próxima investigação sem ampliar a superfície de dados do log.
