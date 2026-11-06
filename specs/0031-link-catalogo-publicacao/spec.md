---
numero: 0031
titulo: Resolver link de catálogo para a publicação selecionada
tipo: bug
prioridade: P1
status: pronta
toca: [backend]
depende_de: [0013]
---

# 0031 — Resolver link de catálogo para a publicação selecionada

Issue: https://github.com/SamiaLuvanice/bestprice/issues/180

## Problema

Links de produto do Mercado Livre podem apontar para uma página de catálogo no
formato `/p/MLB…` e carregar o ID do anúncio escolhido em `pdp_filters`. O
BestPrice rejeita esse formato mesmo quando o filtro identifica uma única
publicação, impedindo que a pessoa monitore o anúncio que abriu.

## Como reproduzir

1. Abra uma página de catálogo do Mercado Livre com o anúncio selecionado no
   parâmetro `pdp_filters=item_id:MLB…`.
2. Cole o endereço completo em **Monitorar preço**.
3. Observe que o BestPrice informa que o formato não identifica um anúncio,
   embora o endereço contenha o ID da publicação selecionada.

## Comportamento esperado

Links HTTPS de catálogo em domínios permitidos são aceitos quando o caminho
identifica uma página `/p/MLB…` e o filtro contém um único ID MLB de publicação.
O ID do catálogo no caminho não é confundido com o ID do anúncio. Repetições do
mesmo ID de publicação no filtro representam uma única seleção; IDs distintos
ou dados inválidos continuam sendo recusados localmente. O cadastro e a consulta
de dados continuam seguindo o fluxo oficial existente.

## Critérios de aceite

- [ ] **AC01** — Dado um link HTTPS permitido de catálogo `/p/MLB…` cujo filtro
  contém um único ID de publicação válido, quando a URL é processada, então o
  ID da publicação é resolvido, sem usar o ID do catálogo.
- [ ] **AC02** — Dado um filtro que repete o mesmo ID de publicação, então o
  link é aceito como uma seleção única.
- [ ] **AC03** — Dado um filtro ausente, malformado ou com IDs de publicação
  distintos, então a URL é recusada com erro seguro e nenhuma chamada externa é
  feita para a URL recebida.
- [ ] **AC04** — URLs com host, protocolo, porta ou formato não permitido
  continuam recusadas, e links diretos de anúncio existentes continuam
  resolvendo o mesmo ID.
- [ ] **AC05** — O cadastro continua consultando somente o cliente oficial do
  Mercado Livre e respeitando o gate de ativação existente.

## Fora de escopo

- Alterar OAuth, permissões do DevCenter, autorização para anúncios de terceiros
  ou `MERCADOLIVRE_THIRD_PARTY_VALIDATED`.
- Scraping, requisitar a URL recebida ou aceitar identificadores de catálogo como
  se fossem anúncios.
- Ativar o monitoramento em Stage ou validar anúncios reais pela API.

## Perguntas em aberto

- Suposição: `pdp_filters` contém entradas separadas por `|` no formato
  `item_id:MLB…`; entradas repetidas são aceitas somente quando todos os IDs
  apontam para a mesma publicação.
