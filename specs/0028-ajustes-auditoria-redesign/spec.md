---
numero: 0028
titulo: Ajustes da auditoria pós-redesign 0027
tipo: melhoria
prioridade: P1
status: implementada
toca: [frontend]
depende_de: [0027]
---

# 0028 — Ajustes da auditoria pós-redesign 0027

Issue: https://github.com/SamiaLuvanice/bestprice/issues/157

## Problema

A auditoria das telas após o redesign da 0027 (`develop` em `fb71646`) encontrou
imagem achatada no detalhe móvel, preço-alvo que recusa vírgula, imagens pesadas na
entrada, tokens com nomes ambíguos (`--primary` verde × `--color-primary` rosa),
hierarquia excessiva em Produtos, detalhe, alertas e Início, eixo do gráfico impreciso,
margens desalinhadas, arquivos/regras órfãos e formulário de link exibido no
carregamento da sessão. A lista completa está na Issue #157.

## Comportamento esperado

As telas seguem os quadros aprovados em `designsystem/prototypes/2026-10-21-bestprice-figma`,
sem regressão de acessibilidade, com tokens inequívocos e imagens otimizadas. A pessoa
pode digitar o preço-alvo no formato brasileiro.

## Critérios de aceite

- [x] AC01: Com título longo, a imagem do produto no detalhe mantém proporção e tamanho definidos em 320 e 390 px.
- [x] AC02: Preço-alvo `99,90` ou `99.90` cria/atualiza o alerta com o mesmo valor; o exemplo do campo segue o formato pt-BR.
- [x] AC03: Hero, login e banner usam WebP/AVIF com dimensões adequadas; nenhuma imagem acima da dobra passa de 300 KB.
- [x] AC04: Tokens legados e shadcn não compartilham nomes com significados diferentes; `bg-primary`, `text-primary` e `text-muted` produzem as cores documentadas em `designsystem/README.md`.
- [x] AC05: Produtos abre com a lista; adicionar anúncio é uma ação compacta; a lista móvel segue o quadro 11.
- [x] AC06: No detalhe, a ação destrutiva tem estilo distinto, cada controle de alerta tem uma única função e os metadados ficam agrupados ou recolhidos, sem duplicar "sem frete".
- [x] AC07: O eixo do gráfico mostra valores em reais legíveis (com R$), sem arredondamento enganoso.
- [x] AC08: Alertas configurados ficam legíveis em 390 px, com título, alvo, estado e ação alinhados.
- [x] AC09: O estado vazio do Início não exibe indicadores zerados.
- [x] AC10: O selo de variação cabe em uma linha e "vs. preço anterior" fica fora da pílula.
- [x] AC11: A foto do hero da landing aparece de forma reconhecível em 1280 px.
- [x] AC12: Cabeçalho e conteúdo compartilham a mesma margem lateral.
- [x] AC13: Arquivos órfãos (`assets/landing/*.webp`, `assets/imagem-lateral.png`) e regras CSS sem uso (`.detail-backdrop`, `.close-button`, `.hero-illustration` e redeclarações mortas) são removidos.
- [x] AC14: A tela de carregamento da sessão não oferece o formulário de link.
- [x] AC15: axe-core sem violações WCAG 2.2 AA em 320, 768 e 1280 px; lint, testes, build e regressão visual passam.

## Fora de escopo

Novo redesign, cadastro público, novos tipos de notificação e mudança de contrato REST.
O valor enviado à API continua decimal com ponto (`"99.90"`); a vírgula é normalizada no
cliente antes do envio, sem alterar o backend.

## Perguntas em aberto

Nenhuma bloqueante. A Issue sugeria possível spec de backend para a vírgula; a decisão
foi normalizar no cliente, mantendo o contrato `target_price` inalterado.
