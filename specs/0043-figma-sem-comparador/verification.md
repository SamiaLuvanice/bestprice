# Verificação visual — 0043

Data: 31/10/2026. Design entregue para validação no
[BestPrice IA](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=132-27).
Issue: [#223](https://github.com/SamiaLuvanice/bestprice/issues/223).
Aplicação, API, banco, integrações e deploy não foram alterados.

## Resultado

- Quadros do Comparador desktop `59:153` e mobile `59:681` removidos.
- Cinco telas internas desktop e cinco mobile exibem três destinos. Sidebars foram
  compactadas; os destinos mobile foram distribuídos em três posições equivalentes.
- Histórico `59:204` e `59:716`: busca, três exemplos de conversas e ações Continuar;
  sem filtro de tipo, selo de comparação ou ação Abrir comparação.
- Conteúdo do histórico importado como SVG com texto e vetores nativos; o shell dos
  quadros originais foi preservado. As fontes dos SVGs estão em `design/`.
- Landing: chamada pública Monitoramento e prévia interna com três destinos. Login
  e textos de apresentação foram alinhados à conversa e escolha do produto.
- Mestre Navegação/Mobile `6:931` preservado com três destinos. A amostra da
  biblioteca `6:805` foi reposta como instância vinculada, filha do quadro da
  biblioteca, em X=80/Y=1480. A identificação "Deste arquivo" e a árvore de camadas
  foram conferidas na interface.
- Marca, robô, fotos, rosa das ações, exemplos de preços e avisos de fonte/IA foram
  preservados. Prazo de 90 dias não foi alterado.

## Cobertura das exportações finais

Exportações PNG reais pela interface do Figma, em `after/desktop/`, `after/mobile/`
e `after/system/`. Existem 18 quadros únicos; biblioteca e estados do assistente
também têm exportação adicional em 2x. Capturas `*-ui.png` mostram contexto do editor.

| Quadro | Desktop | Mobile | Resultado |
|---|---|---|---|
| Landing | 16:2 · 1440×2880 | 12:2 · 390×2270 | Textos e prévia sem comparador |
| Entrar | 59:44 · 1440×1040 | 59:602 · 390×844 | Apresentação coerente; formulário preservado |
| Assistente inicial | 132:27 · 1440×960 | 132:361 · 390×1190 | Três destinos; robô e recentes preservados |
| Assistente conversa | 133:169 · 1440×960 | 132:468 · 390×1320 | Três destinos; conversa e compositor preservados |
| Histórico | 59:204 · 1440×1040 | 59:716 · 390×844 | Somente conversas, sem filtro de tipo |
| Monitoramento vazio | 59:254 · 1440×1040 | 59:752 · 390×844 | Três destinos; indisponibilidade preservada |
| Monitoramento com dados | 151:11 · 1440×1040 | 152:312 · 390×1920 | Três destinos; dados ilustrativos preservados |

Referências: Fundamentos `6:11` (1440×1890), Biblioteca `6:805` (1440×1710),
estados do assistente `137:43` (1440×780) e monitoramento `152:535` (1440×900).

## Evidências e critérios

| Critério | Resultado | Evidência / limite |
|---|---|---|
| AC01 — Inventário anterior | Parcial | Referência de 20 quadros da 0042 e buscas iniciais por página; não houve lista completa de cada camada com ID nem versão nomeada antes da primeira alteração |
| AC02 — Retirada | Atendido visualmente | Quadros ausentes da árvore; busca global por `Compar` terminou em **Nenhum resultado neste arquivo**, sem distinção de caixa nem palavras completas |
| AC03 — Navegação | Atendido visualmente | Dez telas internas, prévia da landing, mestre e biblioteca com três destinos; exportações e inspeção da árvore |
| AC04 — Histórico | Atendido visualmente | Duas exportações; títulos encontrados como **Texto Suas conversas** na busca do Figma, registrados em `editable-history.txt` |
| AC05 — Landing | Atendido visualmente | Exportações desktop/mobile; prévia desktop compactada e textos revistos |
| AC06 — Consistência | Conferência visual | Exportações mantêm dimensões; controles e textos alterados sem corte ou sobreposição observados; não equivale a auditoria completa de a11y |
| AC07 — Antes/depois | Parcial | 18 exportações finais e referência anterior de 20 quadros da 0042; não existe captura imediatamente anterior de todos os quadros nesta sessão |
| AC08 — Escopo | Atendido | Alterações locais restritas à pasta da spec; sem código da aplicação |

`search-final.txt` registra a busca; `text-changes.json` registra substituições
efetuadas pela interface (a lista de matches visíveis pode omitir resultados de
páginas recolhidas, embora Substitua tudo opere sobre todas as páginas).
`evidence-manifest.json` registra dimensões e SHA-256 dos PNGs entregues.

## Versão e ferramentas

Foi enviada pela interface a versão nomeada **0043 — Assistente, conversas e
monitoramento**, com descrição do resultado; o diálogo Salvar foi concluído.
Essa ação ocorreu depois da edição e não substitui o marco anterior pedido no AC01.
A conferência dos 18 quadros exportados identificou uma sobreposição introduzida
pelo título "Converse e escolha." na landing mobile. O título foi encurtado para
"Escolha com IA.", a tela foi exportada novamente e a ausência de sobreposição
foi conferida. `review/mobile-landing-before-fix.png` registra o estado intermediário.
Foi salva também a versão **0043 — Revisão visual sem comparador** após a correção.

O MCP oficial confirmou as três páginas, mas `use_figma` retornou limite do plano
Starter nas três tentativas de inspeção. A edição ocorreu pela interface autenticada
do Figma no Chrome. O download desktop gerou `BestPrice IA.zip` apesar de o observador
de download ter expirado; o ZIP foi conferido e extraído. As exportações seguintes
geraram `BestPrice IA (1).zip` (mobile) e `BestPrice IA (2).zip` (referências).

## Revisão e limites

Revisão documentada do escopo conforme architecture.md: não altera camadas da
aplicação, fornecedor de IA, autorização, contratos, dinheiro, retenção ou persistência.
AGENTS.md e CLAUDE.md foram conferidos. `docs/product-context.md` continua descrevendo
a aplicação atual, conforme o fora de escopo aprovado. Não houve alteração de código;
lint, testes, build e agente doc-sync-onboarding não se aplicam a esta entrega visual.

O arquivo continua sendo uma proposta estática: não comprova cliques, teclado,
leitor de tela, responsividade entre larguras, consultas ao Mercado Livre ou IA real.
PNG não comprova vínculo de todos os objetos aos tokens nem contagem programática
completa das camadas. Não há alegação de auditoria WCAG completa ou revisão independente.

A spec permanece **rascunho**. O design aguarda validação da responsável; as lacunas
de evidência inicial acima impedem declarar todos os critérios integralmente cumpridos.

Verificações locais: `git diff --check` sem erros; leitura/verificação de 50 PNGs
com Pillow, todos válidos; 18 quadros finais únicos, com dimensões e hashes no
manifesto. Exportações adicionais em 2x e cópias de apresentação não são contadas
como quadros novos.

Na primeira tentativa de commit, o hook `end-of-file-fixer` normalizou o fim de
cinco arquivos de texto/SVG e interrompeu o commit como previsto. Os arquivos
normalizados foram preparados novamente; nenhum PNG ou quadro foi alterado por ele.
