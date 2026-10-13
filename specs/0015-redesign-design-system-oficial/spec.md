---
numero: 0015
titulo: Redesign com design system e logo oficiais BestPrice
tipo: melhoria
prioridade: P2
status: pronta
toca: [frontend, docs, harness]
depende_de: [0011, 0012, 0013]
---

# 0015 — Redesign com design system e logo oficiais BestPrice

Issue: https://github.com/SamiaLuvanice/bestprice/issues/48

## Problema

As superfícies atuais do BestPrice ainda apresentam paleta azul e marcas provisórias,
sem refletir a identidade visual fornecida pelo produto. Isso afeta pessoas que entram
na aplicação e usam o painel de monitoramento, produtos, detalhe e histórico, alertas,
notificações, menus e diálogos. A marca e a linguagem visual também precisam permanecer
consistentes nas próximas telas e alterações.

## Comportamento esperado

As superfícies da entrada e da área autenticada inventariadas no plano usam a logo
oficial fornecida sem alterá-la e seguem uma identidade BestPrice
comum, baseada na referência visual `designsystem/`, com acentos verde neon e rosa,
superfícies claras e escuras, cápsulas e efeitos de vidro apenas onde mantiverem texto e
controles legíveis. O tema acompanha a preferência do sistema operacional; não há
seletor nem preferência persistida nesta entrega. A apresentação se adapta a telas
estreitas e largas e oferece estados claros de foco, carregamento, erro e sucesso.

Entrada, painel, listagem e detalhe/histórico de produtos, alertas, notificações, menus e
diálogos mantêm os comportamentos definidos nas specs 0011, 0012 e 0013. O redesign altera
a apresentação e a interação visual necessária para acessibilidade, sem introduzir dados
de exemplo ou transformar recursos demonstrativos em funcionalidades.

Toda nova tela ou alteração visual futura consulta a referência oficial do design system,
a logo original e a skill `frontend-design`. A equipe registra extensões necessárias à
identidade antes de adotá-las, para que continuem coerentes nas demais superfícies.

## Critérios de aceite

- [x] **AC01** — Cada superfície inventariada na entrada e na área autenticada — login, painel,
      produtos, detalhe/histórico, alertas, notificações, menus e diálogos — usa a mesma
      identidade de cor, tipografia, espaçamento e forma da referência oficial, com
      adaptações documentadas quando necessárias à legibilidade e ao conteúdo real.
- [x] **AC02** — A logo oficial aparece sem redesenho, substituição, recorte ou
      distorção nas superfícies de marca.
- [x] **AC03** — O tema claro é aplicado quando o sistema prefere claro ou não informa preferência;
      o tema escuro é aplicado quando prefere escuro. Em ambos, texto, controles e estados
      continuam legíveis e compreensíveis. Mudar a preferência com a página aberta muda
      o tema sem perder campos ou sessão. Texto tem contraste mínimo 4,5:1; limites de
      controles e indicação de foco, 3:1 contra o fundo adjacente. Avaliar também vidro
      sobre conteúdo e a superfície sólida usada sem efeito de desfoque.
- [x] **AC04** — Em viewports de 320, 768 e 1280 pixels, nenhuma superfície causa rolagem
      horizontal da página; controles e conteúdo se reorganizam para telas estreitas.
      A lista de produtos permanece empilhada e sem rolagem horizontal interna, conforme
      a spec 0012. Não há exceção de rolagem horizontal nas superfícies inventariadas.
- [x] **AC05** — Fluxos de teclado, foco visível, nomes acessíveis e anúncios de erro/carregamento
      continuam utilizáveis com tecnologias assistivas. Menus e diálogos preservam fechamento
      e retorno de foco; controles mantêm área de interação mínima de 44 × 44 pixels e
      animações não essenciais são suprimidas quando o sistema prefere movimento reduzido.
- [x] **AC06** — Os fluxos e contratos executáveis das specs 0011, 0012 e 0013 permanecem funcionais;
      nenhuma informação fictícia ou demonstração passa a ser apresentada como dado real.
- [x] **AC07** — As instruções ativas do projeto determinam que novas telas e alterações visuais
      consultem o design system, preservem a logo oficial e sigam a skill `frontend-design`;
      extensões ao sistema são documentadas.
- [x] **AC08** — A revisão visual registra, para cada superfície inventariada, evidência nos temas claro
      e escuro e em 320, 768 e 1280 pixels. Para cada superfície com carregamento ou erro
      existente, a evidência inclui esses estados em viewport estreito e largo e nos dois
      temas; superfícies sem tais estados são identificadas como não aplicáveis.

## Fora de escopo

- Novos endpoints, mudanças nos contratos REST ou regras de domínio.
- Novas lojas/marketplaces, métricas, recuperação de senha ou canais de notificação.
- Mudança nos dados, textos funcionais ou comportamentos de monitoramento definidos pelas
  specs 0011, 0012 e 0013, exceto o necessário para apresentação acessível.
- Transformar o protótipo visual ou seus dados ilustrativos em uma funcionalidade de
  demonstração no produto.

## Referências e decisões do intake

A logo oficial é `designsystem/logo-bestprice.png`; `designsystem/index.html` governa
a identidade, e `designsystem/login.html` é referência secundária de composição.
O inventário está fixado no plano pela revisão base da branch, não pelo conteúdo que
eventualmente existir depois de implementar. Ausências ou mudanças exigem atualização
explícita do plano; não reduzem os critérios silenciosamente.

Tema automático sem seletor é a decisão adotada no intake para oferecer os dois temas
sem promover o controle de demonstração a funcionalidade. Não foi uma preferência
explicitamente solicitada pelo usuário. Reavaliá-la exige registrar a decisão na spec.

## Limites e dependências

- A referência visual existente usa tokens e tipografia associados a terceiros; o plano
  deve validar o que pode ser reutilizado e preferir alternativas compatíveis quando a
  licença ou disponibilidade da fonte não estiver comprovada.
- A lista de viewports de revisão é fixada em 320, 768 e 1280 pixels para fornecer pontos
  estreito, intermediário e largo; outros tamanhos podem ser acrescentados pela revisão.
- Os critérios ainda pendentes de 0011–0013 não passam a estar demonstrados por este redesign.
  O plano identifica ausências do código executável para evitar expandir o escopo.
