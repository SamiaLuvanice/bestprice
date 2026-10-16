---
numero: 0024
titulo: Landing page pública BestPrice
tipo: feature
prioridade: P2
status: pronta
toca: [frontend, docs]
depende_de: [0011, 0015, 0021, 0023]
---

# 0024 — Landing page pública BestPrice

Issue: [#111](https://github.com/SamiaLuvanice/bestprice/issues/111).

## Problema

O endereço inicial hoje exige autenticação. Visitantes não conseguem conhecer a proposta do BestPrice antes de entrar. As referências fornecidas mostram uma apresentação pública das funções e do fluxo de acompanhamento de anúncios do Mercado Livre Brasil.

## Comportamento esperado

Ao acessar `/`, a pessoa vê uma página pública com marca, apresentação, benefícios, etapas, categorias ilustrativas e convite para entrar. A composição segue as artes fornecidas, mas navegação, textos e controles são elementos da interface. O acesso à conta existente continua por `/login`; páginas de produtos e alertas permanecem protegidas. Como o produto ainda não possui cadastro público, a ação de cadastro informa sua indisponibilidade na própria página.

## Critérios de aceite

- [ ] AC01 — Visitante acessa `/` sem autenticação e encontra um título principal, proposta de valor e navegação para as seções.
- [ ] AC02 — A identidade usa logo oficial e artes fornecidas sem repetir texto incorporado às imagens.
- [ ] AC03 — Cabeçalho e seções funcionam em desktop, tablet e celular sem rolagem horizontal; menu móvel é operável por teclado.
- [ ] AC04 — Ações Entrar levam ao login existente. Ação de cadastro mostra aviso na página, sem rota ou promessa de cadastro fictício.
- [ ] AC05 — Benefícios, quatro etapas e sete categorias são apresentados, sem métricas inventadas nem resultados de produto fictícios fora das peças ilustrativas.
- [ ] AC06 — Banner final e rodapé preservam leitura e vínculos válidos em telas estreitas.
- [ ] AC07 — Sessão autenticada pode acessar seu painel; páginas de produtos e alertas continuam protegidas para visitantes.
- [ ] AC08 — Página tem um H1, descrição de busca, imagens descritas, foco visível e movimento reduzido quando solicitado.

## Fora de escopo

- Cadastro público, recuperação de senha e mudanças de autenticação.
- Novos endpoints, consultas públicas de produtos e filtros de categoria.
- Estatísticas de usuários ou preços de produtos reais na landing page.

## Referências e decisão

O pedido e as dez imagens anexadas em 16/10/2026 orientam o visual. O responsável escolheu aviso na própria landing page para as ações de cadastro enquanto o fluxo público não existir.
