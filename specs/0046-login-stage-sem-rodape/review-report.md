# Revisão independente — 0046

Papel: `.agents/agents/arch-reviewer.md`. Base `origin/develop` em `72689fe`.
Revisão de 04/11/2026, na worktree da Issue #239. Este relatório não altera
produção, testes ou baselines e não substitui a QA independente.

## Achado corrigido

**P2 — A identificação do login deve seguir o match da rota**

Em `frontend/src/App.tsx:110`, a comparação exata `location.pathname === '/login'`
não cobre `/login/` e `/LOGIN`, embora o React Router renderize a mesma tela de
login nessas URLs. Nessas entradas, o rodapé permanece visível, contrariando o
resultado solicitado. A reprodução da diferença foi confirmada com o pacote
instalado: `matchPath('/login', path)` retorna verdadeiro para os três caminhos,
mas a comparação exata retorna falso nos dois últimos. Recomenda-se reutilizar
`matchPath` e estender o teste parametrizado da tela, preservando o rodapé nas
demais rotas.

Rechecagem do diff: o implementador importou `matchPath` do pacote de roteamento
já existente e o utiliza na composição do rodapé. O teste parametrizado agora
inclui `/login/` e `/LOGIN`. Correção aprovada. O relatório frontend registra
Red de duas falhas específicas dessas variantes, com duas entradas nominais
passando, seguido de Green **66/66** em três arquivos após a correção. O
orquestrador consolidará a evidência executada no relatório de verificação.

## Inspeção do restante do diff

- A condição do rodapé está na composição da rota e também governa o retorno
  antecipado de carga/erro de sessão. Não existe ocultação global de `footer`.
- A mudança de `min-height: calc(100svh - 72px)` para `100svh` remove a reserva
  do rodapé sem fixar a altura nem cortar a rolagem quando conteúdo/erros crescem.
- `LoginForm`, `Brand`, assets, fontes e tokens da aplicação permanecem iguais à
  base. Não foi importada a equivalência Arimo usada apenas no desenho Figma.
- API, contratos, backend, banco, dependências e lógica de autenticação/returnTo
  não foram alterados.
- Os novos testes exercitam conteúdo visível, ausência de `contentinfo`, estados
  de sessão, validação, envio, erro e controle positivo de rodapé em outras telas.
  O teste Playwright de viewport alto é relevante para detectar a reserva de 72px
  que telas com conteúdo maior que o viewport poderiam mascarar.
- Não há outro achado de produção na inspeção atual.

## Evidências conferidas nesta revisão

- `node --input-type=module -e "import {matchPath} from 'react-router-dom'; ..."`
  executado em frontend: `/login true true`; `/login/ true false`;
  `/LOGIN true false` (match da rota, comparação exata).
- `python .agents/skills/cyclomatic-complexity/scripts/complexity_report.py --changed origin/develop`:
  aprovado, nenhum arquivo `.py` alterado; não foi medida complexidade de Python
  não tocado para atribuí-la a esta mudança.
- `git diff --quiet origin/develop -- backend frontend/src/LoginForm.tsx frontend/src/components/Brand.tsx frontend/src/assets frontend/package.json frontend/package-lock.json`:
  sem diferenças nesses caminhos.
- `git diff --check`: aprovado na inspeção.

## Revisão das diferenças visuais

Inspecionados `login-light-expected.png` e `login-light-actual.png` dos projetos
viewport-390 e viewport-320, mais a exportação `evidence/figma-mobile.png`. A imagem anterior em 390
tem 390×703 e inclui rodapé/divisória; a atual tem 390×640, conserva a marca,
formulário, ação verde, orientação e retorno, com ausência do rodapé e ajuste
vertical compatível com o espaço liberado. A referência Figma tem 390×844 e
equivalência de fonte documentada; não se exige importar sua fonte na SPA.

A renovação dos snapshots de login 320/390 é aprovada quanto à diferença intencional.
As imagens claras e escuras atuais são idênticas byte a byte em cada largura,
conforme `Get-FileHash`: 390, `3E82F4AE75CA039A7FC802A1EFCEB246C4581C149D3B8FAAC79CB3EACC8164E0`;
320, `7B1C4DA68993BB0CFA86179762747B8484D9C6BEA8A3D54EFE3C6D61FF4EA78E`.
Assim, a aprovação inclui quatro imagens, light/dark em 320 e 390.
Também inspecionadas as capturas QA `login-768x640.png` e `login-1280x640.png`,
em `frontend/test-results/qa-0046/`, contra as baselines light versionadas de
768 e 1280. Em 768, a composição central continua igual, sem o rodapé inferior;
em 1280, a foto à esquerda e o formulário à direita conservam a composição,
sem o bloco final do rodapé. Não há corte ou substituição de conteúdo.

**Aprovação explícita para renovar as oito baselines de login:** light/dark,
320/390/768/1280, limitadas ao resultado inspecionado de retirada do rodapé e
ajuste da altura. Foram inspecionados quatro resultados claros, um por largura;
320/390 claro/escuro foram ainda comparados por hash. A aplicação fixa a paleta
clara; não se autoriza uma variação visual adicional nos pares escuros de
768/1280. A execução final após a renovação deve confirmar estabilidade. Nenhum
snapshot de outra tela está autorizado a mudar por esta aprovação.

## Estado do parecer

O orquestrador executou os cenários de landing/marca na base isolada `72689fe` e
informou a reprodução das falhas de alvo da marca (34 px contra exigência de
40 px) e das baselines de landing. Comparou ainda os quatro PNGs atuais de
landing entre base e feature por SHA-256, com igualdade byte a byte. Essa
evidência distingue falhas preexistentes de regressões desta spec; não justifica
alterar landing ou seus snapshots. A suíte visual global continua explicitamente
não verde, e os comandos completos/contagens pertencem à verificação consolidada.

**Código aprovado, sem achados P0–P2 remanescentes no escopo.** O P2 identificado
foi corrigido com teste de regressão. A renovação das oito baselines de login
está aprovada conforme os limites acima.

Conferido o relatório do frontend: suíte direcionada final **66/66**, lint e
build aprovados após a correção. Vitest completo final, execução visual após
renovar snapshots, diagnóstico dos testes de outras telas e CI são registrados
pelo orquestrador/QA; este parecer não os declara verdes sem seus resultados.
Não foi executado backend/PostgreSQL real nesta revisão, pois não há mudança
nessas camadas; o relatório de complexidade changed comprovou ausência de diff
Python. A aprovação de código não substitui QA, doc-sync final ou gates de entrega.
