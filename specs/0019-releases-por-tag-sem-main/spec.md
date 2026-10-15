---
numero: 0019
titulo: Releases por tags sem branch main
tipo: melhoria
prioridade: P1
status: implementada
toca: [infraestrutura, docs]
depende_de: [0018]
---

# 0019 — Releases por tags sem branch main

Issue: https://github.com/SamiaLuvanice/bestprice/issues/77

## Problema

O repositório mantém `develop`, `stage` e `main`, mas somente `stage` tem um destino
de implantação configurado. `main` existe para publicar imagens no GHCR e criar
releases. Essa linha permanente duplica a função de identificar uma versão estável,
que pode ser representada por uma tag, e exige manter regras e automações próprias.

## Comportamento esperado

`develop` continua sendo a linha de integração e `stage` continua recebendo as
candidatas para validação. Uma release usa uma tag `vMAJOR.MINOR.PATCH`, sem
identificador de pré-release ou metadados de build SemVer, apontando para o mesmo
SHA que foi implantado e validado em `stage`. A publicação valida esse SHA,
disponibiliza as imagens de backend e frontend no GHCR e cria a release com as
referências imutáveis dos artefatos publicados. Tags técnicas `build-*` continuam
sendo identificadores de imagens e não iniciam nem representam releases.

Antes de remover `main`, o repositório passa a usar o fluxo de release por tags, aplica
as proteções necessárias a `develop`, `stage` e às tags de release, e define `develop`
como branch padrão. CI, entrega e sincronização do Project deixam de depender de
`main`. No Project, o status `Main` é substituído por `Released`; todas as Issues e
PRs que estavam em `Main` são reconciliadas para `Released`, preservando os itens,
suas associações e registros históricos. As sincronizações futuras de Issues e PRs
nunca atribuem o status `Main`. A existência da tag e da release não configura nem
implica implantação em PROD; esse ambiente ainda não está configurado.

## Critérios de aceite

- [x] Dada a configuração de branches após a mudança, quando as branches permanentes
  forem consultadas, então `develop` e `stage` existem, `main` não existe e `develop`
  é a branch padrão do repositório.
- [x] Antes da remoção de `main`, quando a migração for verificada, então o fluxo de
  release por tags está ativo, as proteções de `develop`, `stage` e tags estão
  aplicadas, a branch padrão é `develop` e CI, entrega e sincronização do Project não
  exigem `main`.
- [x] Dada uma pull request para `develop` ou `stage`, quando a integração contínua
  executar, então os checks obrigatórios continuam aplicados sem exigir que `main`
  exista.
- [x] Dado um commit implantado em `stage` com CI e validação de saúde aprovados,
  quando uma tag `vMAJOR.MINOR.PATCH` for publicada após confirmação operacional de que a revisão de `stage` está implantada e saudável, então seu SHA é igual à ponta atual de `stage` e a entrega executa os gates para esse mesmo SHA.
- [x] Dada uma tag `vMAJOR.MINOR.PATCH`, quando o formato da versão for validado,
  então versões com sufixo de pré-release ou metadados de build SemVer são rejeitadas;
  tags técnicas `build-*` não iniciam publicação de release.
- [x] Dado um SHA de release elegível, quando a entrega for concluída, então as imagens
  de backend e frontend publicadas correspondem ao mesmo SHA.
- [x] Dada uma falha nos gates ou na publicação de qualquer uma das duas imagens,
  quando a entrega terminar, então nenhuma release da versão é apresentada como
  concluída.
- [x] Dada uma entrega bem-sucedida, quando a release for consultada, então ela
  identifica a versão SemVer, o SHA validado e os digests das duas imagens publicadas.
- [x] Dada uma tag SemVer já usada para uma release, quando alguém tentar movê-la ou
  removê-la, então a proteção do repositório rejeita a operação.
- [x] Dado o Project após a migração, quando opções e itens forem consultados, então
  `Main` não é mais um status ativo, `Released` existe, todas as Issues e PRs antes em
  `Main` estão em `Released`, e os itens, associações e registros históricos continuam
  acessíveis.
- [x] Dada uma sincronização futura de Issue ou PR com o Project, quando seu status for
  calculado, então a sincronização nunca grava `Main`.
- [x] Dada uma release por tag, quando seu resultado for consultado, então nenhuma
  implantação em PROD é iniciada ou declarada como concluída.

## Fora de escopo

- Configurar ou implantar um ambiente PROD.
- Alterar a implantação de `stage` ou criar um ambiente DEV.
- Publicar versões SemVer de pré-release.
- Alterar o conteúdo funcional das imagens ou o produto BestPrice.
- Apagar releases ou tags existentes; qualquer migração de histórico precisa preservar
  as referências já publicadas.

## Decisões de verificação

O health público confirma disponibilidade da API e do banco, mas não expõe o SHA servido. Antes de criar a tag, a pessoa responsável confirma no painel do Render que o deploy Live corresponde à ponta atual de `stage` e valida também o proxy Pages. O workflow falha se a ponta de `stage` avançar ou se qualquer health check falhar. A reconciliação do Project renomeia a opção existente `Main` para `Released`, preservando itens e associações; a configuração será verificada antes da remoção da branch.
