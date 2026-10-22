# Plano — 0029

Issue: #167. Base: `origin/develop` em `2df3129`. Branch:
`feature/0029-issue-167-identidade-bestprice-consistente`, na worktree de mesmo slug.

## Contrato

Nenhuma alteração REST, de persistência ou de conteúdo retornado pela API. A mudança
fica na apresentação da marca no frontend. As rotas e os estados de sessão continuam
com o comportamento atual.

## Diagnóstico antes da correção

1. Capturar a apresentação atual da marca na landing, login, Início, Produtos,
   detalhe, Alertas, página não encontrada e verificação de sessão, em 320, 390,
   768 e 1280 px. Comparar a identidade com `designsystem/index.html` e
   `designsystem/logo-bestprice.png`.
2. Nas larguras móveis, repetir navegação, volta, recarregamento e mudança de aba.
   Registrar DOM visível, estilos computados, dimensões, `img.complete` e
   `naturalWidth`, requisição da imagem, Console e Network quando a logo sumir.
   Separar o que foi observado da hipótese de causa. Se a intermitência não for
   reproduzida, registrar tentativas e limites sem presumir a origem.
3. Verificar estados de carregamento, erro e ausência de sessão. A cobertura visual
   atual inclui landing, login e rota inexistente em 320/768/1280 px; o cenário de
   390 px e transições de rota precisam de evidência própria.

## Decisões de implementação

- Usar uma apresentação reutilizável para logo oficial e nome, com uma regra
  tipográfica da marca aplicada nas superfícies públicas e autenticadas. A
  referência de `designsystem/index.html` usa `var(--font-display)`, peso `600`
  e espaçamento `-0.011em` para o nome; preservar esses valores e variar apenas
  tamanho e composição quando a largura exigir. A pilha de fontes do sistema
  deve seguir a referência, sem distribuir fonte nova. Não redesenhar nem
  substituir o asset. Esta escolha reduz as divergências entre `.brand`,
  `.landing-brand` e `.login-brand` sem obrigar as páginas a compartilhar todo o
  cabeçalho.
- Examinar os pontos atuais em `frontend/src/App.tsx`, `LoginForm.tsx`,
  `NotFoundPage.tsx`, `landing/LandingPage.tsx`, `dashboard/AppHeader.tsx`,
  `styles.css` e `landing/LandingPage.css`. Um componente de marca sob
  `frontend/src/components/` é a direção inicial; escolher a menor API que
  preserve o nome acessível uma vez por apresentação. O diagnóstico decide se
  também será preciso corrigir carregamento do asset ou layout do cabeçalho.
- Manter a marca no estado de verificação de sessão, que hoje apresenta apenas a
  imagem. Ajustar esse estado ao mesmo padrão visual sem mostrar formulário antes
  de a sessão ser conhecida.
- Para a arte do login, respeitar a composição existente: marca visual desktop e
  marca compacta móvel. Apenas a apresentação efetivamente visível participa da
  árvore de acessibilidade. Links que usam a marca mantêm seu destino e área de
  toque de 44 × 44 px.
- Alternativas descartadas: copiar ajustes tipográficos em cada página, pois
  mantém fontes de divergência; gerar outra logo, pois o asset oficial é obrigatório;
  forçar a mesma dimensão em todos os viewports, pois pode causar colisão no móvel.

## Testes e evidências previstos

- Antes da correção, acrescentar regressão de comportamento para marca visível,
  nome acessível único e preservação após transição/recarregamento em mobile;
  registrar falha Red pelo sintoma esperado. Cobrir também o estado de carregamento
  e a página não encontrada. Testes de componente devem focar o resultado visível,
  sem reproduzir classes ou estrutura interna.
- Após a correção, conferir Green, `npm run lint`, `npm test -- --run`,
  `npm run build`, `npm run test:visual` e auditoria axe existente. Acrescentar
  projeto de 390 px à configuração Playwright, que hoje cobre apenas 320, 768 e
  1280 px, e revisar screenshots nas quatro larguras. Atualizar baselines apenas quando a
  diferença visual for aprovada. Conferir que não há rolagem horizontal nem
  colisão com ações do cabeçalho. O frontend roda na worktree.
- Registrar comandos, resultados e limites em `verification.md`; relacionar cada
  AC à evidência. Para a falha intermitente, registrar dispositivo/navegador,
  sequência e causa confirmada ou a impossibilidade de reprodução.

## Handoff e riscos

- Implementação: papel `.agents/agents/frontend.md`, restrito à SPA e testes de
  frontend. Revisão independente: `.agents/agents/arch-reviewer.md`. Aceite:
  `.agents/agents/qa.md`. Após a última mudança de código, executar por último
  `.agents/agents/doc-sync-onboarding.md` e conferir `AGENTS.md`, `CLAUDE.md`,
  `docs/` e o registro da identidade em `designsystem/README.md` se houver extensão.
- A falha móvel foi relatada como intermitente e ainda não tem sequência exata.
  Não atribuir causa ao CSS ou ao carregamento da imagem antes da observação no
  navegador. A mudança de marca compartilhada pode afetar screenshots de várias
  rotas; revisar o diff visual de cada uma.
- Depois dos gates e da revisão, preparar PR para `develop` com `Closes #167`.
  A implementação foi autorizada após a revisão do planejamento.

## Decisões confirmadas na implementação

- `Brand` centraliza o asset otimizado já usado pela SPA, com ícone quadrado sem
  encolhimento, nome horizontal e `--font-display` igual à pilha da referência,
  peso `600` e tracking `-.011em`. O tamanho continua adaptável (22–26 px;
  ícone de 44–52 px conforme a superfície). Nenhum asset foi substituído.
- O login compacto usava `display:block`, que empilhava ícone e nome; passou a
  herdar `inline-flex` da marca. Landing, conta e login tinham pesos/trackings
  diferentes. O estado de sessão apresentava apenas o ícone. Esses defeitos foram
  observados e corrigidos; o desaparecimento intermitente original não se
  reproduziu nas tentativas e não tem causa atribuída.
- Marcas em links são decorativas, pois o link já anuncia “BestPrice — Início”.
  Nas demais superfícies há uma apresentação `img` chamada “BestPrice”. No login
  desktop, o contêiner da arte fornece esse nome e uma descrição separada; a
  versão compacta só entra na árvore acessível quando visível pelo breakpoint.
