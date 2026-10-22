---
numero: 0029
titulo: Identidade BestPrice consistente em todas as telas
tipo: bug
prioridade: P2
status: pronta
toca: [frontend]
depende_de: [0027]
---

# 0029 — Identidade BestPrice consistente em todas as telas

Issue: https://github.com/SamiaLuvanice/bestprice/issues/167

## Problema

Pessoas que navegam entre as áreas do BestPrice veem o nome da marca com fontes,
tamanhos e formatos diferentes. Em algumas visitas pelo celular, a logo deixa de
aparecer. Isso enfraquece a continuidade visual e dificulta reconhecer a aplicação,
especialmente em telas estreitas.

## Comportamento esperado

A marca usa a identidade oficial do BestPrice em todas as telas da aplicação. Nome e
logo mantêm aparência coerente ao navegar entre áreas, e a logo permanece visível nas
versões móveis em que a marca é apresentada. O cabeçalho se adapta ao espaço
disponível sem ocultar, cortar ou sobrepor a marca.

## Como reproduzir

1. Abrir a página pública em um navegador e observar a apresentação da marca.
2. Entrar na aplicação e comparar a marca no login, em Início, Produtos e Alertas;
   acessar também uma rota inexistente.
3. Repetir a navegação em largura móvel, inclusive após recarregar a página e mudar
   de aba. Comparar o nome e verificar a presença da logo em cada tela.

O desaparecimento móvel foi relatado como intermitente; a rota, o dispositivo e a
sequência exata que o provocam ainda precisam ser registrados durante o diagnóstico.

## Critérios de aceite

- [ ] AC01: Na página pública, no login, nas áreas autenticadas e na página não encontrada, o nome “BestPrice” mantém a mesma grafia, família tipográfica, peso e espaçamento entre letras da identidade oficial; o tamanho pode se adaptar à largura da tela.
- [ ] AC02: Em larguras de 320 e 390 px, a logo oficial aparece na página pública, no login, nas áreas autenticadas e na página não encontrada, inclusive após navegação, retorno, recarregamento e mudança de aba; não fica cortada, encoberta ou reduzida a ponto de perder legibilidade.
- [ ] AC03: Em 320, 390, 768 e 1280 px, a marca mantém proporção e espaçamento coerentes, sem colidir com menu, título ou ações do cabeçalho.
- [ ] AC04: A marca tem nome acessível “BestPrice” uma única vez por apresentação; a imagem e o texto visuais não geram anúncio duplicado para leitores de tela.
- [ ] AC05: O diagnóstico registra em quais telas, estados e larguras havia divergência ou ausência da logo, e a verificação final demonstra a correção nesses cenários.

## Fora de escopo

Redesenhar a logo oficial, alterar fluxos de navegação, criar telas ou modificar
contratos da API.

## Perguntas em aberto

- Qual dispositivo, navegador e sequência de navegação provocam o desaparecimento
  intermitente relatado? A investigação deve cobrir os cenários acima e registrar a
  causa encontrada.
