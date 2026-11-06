# Plano técnico — 0031

Issue: [#180](https://github.com/SamiaLuvanice/bestprice/issues/180). Base:
`origin/develop` (`396f0ac`). Mudança restrita à resolução local da URL no
backend; contrato REST permanece igual.

## Contrato observável

- `POST /api/tracked-products` continua recebendo `{ "url": string }`.
- Um link de catálogo em `www.mercadolivre.com.br` ou
  `produto.mercadolivre.com.br`, com caminho de página `/p/MLB…` e filtro
  `pdp_filters=item_id:MLB…`, resolve o ID do anúncio para o fluxo existente.
- Componentes repetidos de `pdp_filters` só são aceitos quando cada componente
  contém o mesmo ID MLB válido. IDs distintos retornam `400 ambiguous_item_id`;
  filtro ausente ou malformado retorna `400 unsupported_url_format`.
- Host e protocolo continuam allowlist local. O backend não requisita a URL de
  entrada; consultas só usam o ID validado e os destinos fixos do cliente oficial.
- OAuth, falhas de integração e os status de cadastro existentes não mudam.

## Camadas e arquivos

- `backend/app/marketplace/url.py`: reconhecer estritamente página de catálogo e
  extrair somente o ID da publicação presente em `pdp_filters`.
- `backend/tests/test_url_error_codes.py`: regressão do formato fornecido, ID
  repetido, IDs conflitantes, filtro ausente/malformado e preservação dos casos
  já cobertos.
- `specs/0031-link-catalogo-publicacao/{spec,plan,tasks,verification}.md` e
  `docs/PROGRESS.md`: aceite e evidências.
- Documentação de onboarding só muda se a correção alterar instruções ou
  comportamento documentado além do contrato atual; `doc-sync-onboarding` fará
  a apuração final.

## Decisões e riscos

- **A publicação vem do filtro, não do ID `/p/MLB…` do caminho.** O caminho é
  um ID de catálogo, que não identifica necessariamente a publicação selecionada.
- **Repetições idênticas são deduplicadas; IDs distintos são ambíguos.** O link
  fornecido repete o mesmo `item_id`; recusar isso sem deduplicar impediria o
  fluxo legítimo, mas escolher entre anúncios diferentes seria arbitrário.
- **O parser continua sem HTTP e sem decodificar caminhos percent-encoded.** Isso
  mantém a barreira contra SSRF e evita interpretar formatos alternativos fora
  do escopo.
- **O gate de integração permanece independente.** Aceitar a URL não prova
  acesso real a anúncios de terceiros nem habilita consultas.

## Verificação

TDD na fronteira do parser e do erro HTTP: primeiro demonstrar a rejeição atual
para o formato do link, depois implementar a resolução; confirmar que IDs
ambíguos e URLs hostis continuam sem chamar a fonte. Gates de backend e diff
serão registrados em `verification.md`.
