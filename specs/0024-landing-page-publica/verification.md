# Verificação — 0024

## Escopo observado

`App.tsx` renderiza a landing em `/` para visitante, enquanto `GET /api/auth/me`
está pendente e quando essa consulta falha. Com sessão válida, `/` conserva o
painel. `LandingPage.tsx` apresenta hero, benefícios, etapas, categorias, banner
e rodapé. “Entrar” usa `/login`; “Criar conta gratuita” abre aviso na própria
página, pois não há cadastro público. `/login` e as rotas protegidas seguem o
fluxo existente. Não houve alteração de API, backend ou banco nesta spec.

## Red → Green e gates locais

| Comando ou verificação | Resultado observado |
|---|---|
| Teste inicial da landing | Red com 3 falhas específicas porque a landing ainda não existia; após a implementação, Green 3/3. Foram incluídos depois os casos de sessão válida e menu por teclado. |
| `npm ci` em `frontend/` | Concluído; 261 pacotes, 0 vulnerabilidades. |
| `npm run lint` em `frontend/` | Passou. |
| `npm test -- --run` em `frontend/` | Passou: 293/293 testes em 27 arquivos após a última edição do teste de menu por Enter. |
| Teste direcionado da landing após a última edição | Passou: 5/5 testes, incluindo abertura do menu por Enter. |
| `npm run build` em `frontend/` | Passou. |
| `node --test .github/scripts/*.test.cjs` | Passou: 50/50 testes. |
| `git diff --check` | Passou. |

## Inspeção no navegador

No navegador IAB, a landing foi conferida em 375, 430, 768, 1024 e 1440 px:
`scrollWidth <= viewport` em todas essas larguras. A inspeção visual completa
em desktop 1440 px e mobile 390 px confirmou as seções e o recorte do hero após
o ajuste de CSS. O QA independente revalidou 5/5 itens após as correções. Os
testes React cobrem entrada pública, acesso ao login, substituição da landing
pelo painel com sessão válida, consulta de sessão pendente/falha, aviso de
cadastro sem mudança de rota e abertura do menu por Enter, seguida de
fechamento ao seguir um link. O navegador não executou teste real de teclado
nem auditoria automatizada de acessibilidade nesta verificação.

## Revisão independente

A revisão apontou dois achados P2: contraste insuficiente do verde usado como
texto e âncora de funcionalidades coberta pelo cabeçalho fixo. Ambos foram
corrigidos e rechecados: `--landing-green-dark: #087c1e` tem contraste calculado
de 5,37:1 sobre branco e 5,11:1 no selo; `#funcionalidades` recebe
`scroll-margin-top: 94px`. O apontamento P3 sobre o título da aba foi descartado
após conferir os efeitos existentes de `App.tsx`/`LandingPage.tsx` e o teste que
verifica o título da landing, do login e do painel. O QA independente revalidou
5/5 itens. A PR e os checks remotos foram verificados depois, conforme abaixo.

## Critérios de aceite

| Critério | Evidência e limite |
|---|---|
| AC01 | Landing pública em `/`, título principal e âncoras das seções conferidos no componente, nos testes e na inspeção visual; `#funcionalidades` recebeu afastamento de 94 px para o cabeçalho. |
| AC02 | Logo oficial importada; nove WebP locais. O recorte CSS esconde o texto incorporado ao lado esquerdo do hero nas larguras inspecionadas. |
| AC03 | Sem rolagem horizontal nas cinco larguras medidas; teste do menu cobre abertura por Enter, `aria-expanded` e fechamento ao seguir link. Operação por teclado não foi medida separadamente no navegador. |
| AC04 | Testes confirmam navegação “Entrar” para `/login` e aviso local do cadastro sem troca de rota. |
| AC05 | Quatro benefícios, quatro etapas e sete categorias conferidos no componente e na inspeção visual; sem métricas de usuários ou resultados reais da API na página. |
| AC06 | Banner e rodapé inspecionados em desktop e mobile; ausência de overflow medida. |
| AC07 | Teste novo confirma a substituição da landing pelo painel com sessão válida e título próprio; o código guarda as rotas internas. Login real e API não foram executados nesta verificação. |
| AC08 | Um H1 e descrições de imagens conferidos no componente/teste; CSS define foco visível e `prefers-reduced-motion`. Verde de leitura com contraste calculado de 5,37:1 sobre branco e 5,11:1 no selo. Auditoria automatizada de acessibilidade não executada. |

## Handoff e checks remotos

A [Issue #111](https://github.com/SamiaLuvanice/bestprice/issues/111) foi criada
e a branch `feature/0024-issue-111-landing-page` foi rebaseada sem conflito
sobre `origin/develop` em `cbb61c3`, publicada no commit `a61f9ee`. A
[PR #115](https://github.com/SamiaLuvanice/bestprice/pull/115) foi aberta para
`develop` com `Closes #111`, sem conflitos e pronta para merge na consulta.
No GitHub, o run de CI [38974873433](https://github.com/SamiaLuvanice/bestprice/actions/runs/38974873433)
ficou verde, incluindo o check obrigatório `CI / CI`, `PR policy`, `Automation`,
`Backend` e `Frontend`. Na PR, `Project sync / resolve` e `sync` também ficaram
verdes; ao todo, dez checks bem-sucedidos. Cloudflare Pages registrou
`Deployed successfully` para o preview da PR; isso não é validação do
ambiente `stage`.

Merge, fechamento da Issue e validação em `stage` ainda não ocorreram nesta
verificação. Login com conta real, API, backend e PostgreSQL locais, teclado
real no navegador e auditoria axe não foram executados nesta verificação.
`actionlint` não está instalado localmente. Implementação entregue; aguarda
integração da PR conforme o fluxo GitHub.
