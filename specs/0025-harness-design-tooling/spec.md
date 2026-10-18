---
numero: 0025
titulo: Design tooling integrado (UI/UX Pro Max, Huashu Design, Impeccable) e regressão visual
tipo: melhoria
prioridade: P2
status: pronta
toca: [harness, frontend, docs]
depende_de: [0015]
---

# 0025 — Design tooling integrado e regressão visual

Issue: https://github.com/SamiaLuvanice/bestprice/issues/121

## Problema

Quem desenvolve interfaces no BestPrice depende de julgamento manual para consistência
visual, acessibilidade e qualidade de design. Não há catálogo pesquisável de estilos,
paletas e diretrizes de UX, nem protocolo formal que alimente ferramentas de design
conversacional com a identidade oficial da marca, nem regressão visual automatizada —
diferenças de layout e contraste só são percebidas em revisão humana tardia. Isso afeta
todas as superfícies da SPA e o custo de manter a identidade definida na spec 0015.

## Comportamento esperado

As instruções do projeto guiam qualquer agente de código a, antes de criar ou alterar
HTML/CSS, consultar diretrizes de design pesquisáveis (estilos, paletas, tipografia e
regras de UX com contraste acessível) e as regras automatizáveis de Web Design do
próprio repositório — área de toque mínima, HTML semântico e contraste AA/AAA — que
reforçam os critérios da spec 0015 sem substituí-los. A identidade oficial continua
sendo a referência visual do repositório; as ferramentas novas complementam, não
prevalecem sobre ela.

Ferramentas de geração de artefatos visuais de alta fidelidade (protótipos e decks)
recebem os assets reais da marca BestPrice e têm pasta definida no projeto para seus
saídas, de modo que nada gerado se misture ao código da SPA sem revisão.

A revisão de qualidade de design ganha uma etapa determinística de checagem de
anti-padrões, e a SPA ganha snapshots visuais automáticos em múltiplos viewports e
temas, de modo que qualquer mudança de apresentação indesejada falhe em execução de
teste antes de chegar ao usuário.

## Critérios de aceite

- [ ] **AC01** — Dado o repositório clonado, quando um agente executa uma tarefa de
      interface, então as skills de design integradas estão disponíveis no catálogo de
      skills versionado, com scripts e referências íntegros, e suas projeções estão
      sincronizadas para os assistentes configurados.
- [ ] **AC02** — Dado um pedido de busca de diretriz de design (estilo, paleta,
      tipografia ou regra de UX), quando a ferramenta de busca local é executada, então
      ela retorna resultado do catálogo oficial (por exemplo, diretrizes de UX, estilos
      como Bento Grid e Minimalismo, contraste WCAG) sem rede.
- [ ] **AC03** — Dado o protocolo de assets da marca no design system, quando uma
      ferramenta de geração visual de alta fidelidade é usada, então ela lê logo
      oficial, tokens e paleta do repositório e grava seus artefatos na pasta de
      protótipos definida, sem tocar no código da SPA.
- [ ] **AC04** — Dado o arquivo de diretrizes de agentes do design system, quando um
      agente vai criar HTML/CSS novo, então as regras automatizáveis obrigatórias estão
      registradas e referenciadas pelas instruções ativas: área de toque mínima de
      44 × 44 pixels, tags HTML semânticas e paletas com contraste mínimo AA/AAA,
      cada uma vinculada à regra ou critério de aceite correspondente já existente.
- [ ] **AC05** — Dado o Playwright configurado no frontend, quando a suíte de regressão
      visual executa, então captura snapshots da SPA nos viewports 320, 768 e 1280
      pixels, com emulação de preferência de esquema clara e escura, e falha quando a
      apresentação difere do baseline aprovado. Hoje o produto usa tema claro fixo
      (spec 0016); a emulação escura existe para detectar quebras visuais caso o tema
      automático volte, e seus baselines podem coincidir com os claros.
- [ ] **AC06** — Dado o gates de qualidade do projeto, quando a entrega é verificada,
      então lint, testes unitários e build do frontend permanecem verdes e a etapa de
      sincronização documental é executada por último.

## Fora de escopo

- Mudança de comportamento de produto, API, banco ou contratos REST.
- Substituir a identidade oficial de `designsystem/` ou a skill `frontend-design` por
  preferências visuais de ferramentas de terceiros.
- Duplicar o conteúdo integral das diretrizes das ferramentas no repositório; as
  diretrizes ficam na ferramenta e o repositório registra apenas as regras
  automatizáveis próprias e os vínculos.
- Integração contínua remota de snapshots visuais (a execução inicial é local; o
  pipeline de CI pode ser coberto por tarefa futura).
- Configuração de monitoramento em nuvem de serviços de terceiros.

## Perguntas em aberto

- As ferramentas integradas são skills comunitárias MIT com scripts locais; a decisão
  assumida é instalá-las versionadas no repositório pelo mesmo mecanismo já usado para
  as skills curadas, revendo os scripts antes de executá-los. Qualquer dependência
  externa de rede em tempo de execução (fontes, imagens) deve ser evitada nas suítes.
- O snapshot visual inicial é gerado e aprovado nesta entrega; baselines posteriores
  só mudam por revisão explícita.
- O intake original previa evidência "nos temas claro e escuro" como se o produto
  tivesse tema automático; a spec 0016 fixou o tema claro. O AC05 foi ajustado para
  descrever emulação de esquema do navegador, não tema de produto inexistente.
