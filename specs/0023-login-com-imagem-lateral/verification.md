# Verificação — 0023 Login com imagem lateral

Data: 16/10/2026. Worktree `feature/0023-issue-106-login-com-imagem-lateral`.

## Evidência executada nesta verificação

| Comando/ação | Resultado observado | Limite |
|---|---|---|
| `npm test -- --run src/LoginForm.test.tsx src/App.test.tsx`, em `frontend/`, com `TEMP` e `TMP` em `frontend/node_modules/.qa-temp` | 2 arquivos e **42 testes passaram**. | Vitest/jsdom valida DOM e comportamento, não recorte, foco visual, rolagem ou requisições reais do navegador. |
| Mesmo comando sem redirecionar `TEMP`/`TMP` | 26 testes passaram em `LoginForm`; a suíte `App` falhou antes de coletar testes por `ENOENT` em diretório temporário do sandbox. O comando acima resolveu a falha ambiental. | A primeira execução não é gate verde. |
| Leitura de `LoginForm.tsx`, `styles.css`, `LoginForm.test.tsx`, `App.test.tsx` e `test_health_integration.py` | A arte está associada à classe `.login-visual` apenas em `@media (min-width: 841px)`; a coluna não tem conteúdo ou logo sobreposto. Os testes cobrem os estados listados abaixo. | Inspeção de código permite inferir a intenção, não comprova pintura nem Network. |
| Vite local em `127.0.0.1:5173` e Uvicorn local em `127.0.0.1:8000` | Ambos iniciaram sem erro imediato; o navegador IAB recebeu `ERR_CONNECTION_TIMED_OUT` ao abrir `/login`, e `Invoke-WebRequest` local recebeu bloqueio de socket do sandbox. | Não houve navegação útil nem consulta HTTP ponta a ponta nesta subtask. |

## Complemento executado pelo coordenador

Após o QA da subtask, o coordenador iniciou Vite na porta 5174, Uvicorn na 8000 e
PostgreSQL 17 descartável na 55434, e abriu `/login` no navegador integrado.
O timeout anterior era da porta 5173 usada pela subtask; `Invoke-WebRequest`
retornou 200 para Vite na 5174. Nenhuma conta real foi usada.

| Comando/ação | Resultado observado | Limite |
|---|---|---|
| `npm run lint`, `npm test -- --run`, `npm run build` em `frontend/`, após o último ajuste de código | Lint verde, **288/288 testes em 26 arquivos**, build verde; arte de 1.665.039 bytes gerada como ativo CSS. | O Vitest no sandbox falhou por `ENOENT` antes da coleta; o gate completo passou fora do sandbox. |
| `uv run ruff check .` e `.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider -rs` com `TEST_DATABASE_URL=postgresql://…@127.0.0.1:55434/bestprice_test` | Ruff verde; **158 passed, 2 skipped**, 1 aviso de depreciação. Os skips são testes do script POSIX. | A primeira tentativa com `postgresql+psycopg://` falhou em 2 testes de health por formato de URL incompatível com `psycopg`; a repetição com URL correta passou. |
| `node --test .github/scripts/*.test.cjs` | **50/50 passaram**. | `actionlint` não está instalado neste host. |
| `Invoke-WebRequest http://127.0.0.1:8000/api/health` com API e PostgreSQL descartável | HTTP **200**, `{"status":"ok","database":"ok"}`. | 503 foi demonstrado pelos testes de integração, não por interrupção manual deste servidor. |
| Navegador integrado em 320, 768 e 1280 × 640 px | `scrollWidth` de 305, 753 e 1265 px, todos abaixo das respectivas larguras. Botão termina em 516, 499 e 468 px; os dois campos também terminam antes de 640 px. Em 1280 px, arte à esquerda e formulário à direita; marca e mensagem principal visíveis. Em 320/768 px, arte oculta, marca compacta visível. | A página tem `scrollHeight` de 642 px pelo rodapé, mas os controles ficam inteiros na primeira dobra, como a 0020/AC03 permite. |
| Navegador integrado, carregamento inicial fresco em 320/768/1280 px | Em 320/768 px, `display:none` e `background-image:none` na lateral; inventário de ativos não mostrou `imagem-lateral.png`. Em 1280 px, `background-image` aponta para a arte e a captura mostra a imagem pintada. | O inventário de ativos do navegador não listou a imagem no desktop apesar da pintura visível; portanto a ausência de transferência mobile é apoiada por CSS computado e inventário, sem contagem de bytes de Network. |
| Navegador integrado em 320 px, envio vazio, depois credenciais fictícias inválidas | Mensagens de e-mail/senha junto aos campos, foco no e-mail, sem rolagem horizontal. Login real retornou "E-mail ou senha inválidos.", preservou os campos e focou a senha. Tab levou ao controle de senha e depois ao botão com anel visível. | Sucesso com usuário real não foi exercitado; testes automatizados cobrem esse fluxo sem credenciais externas. |
| Cores computadas em 320 px e cálculo WCAG | Subtítulo/branco **6,07:1**; erro/superfície **6,79:1**; botão preto/verde **15,49:1**; borda do campo/branco **3,62:1**; anel rosa/branco **5,85:1**. Botão com 50 px de altura e controle de senha com 44 px. | Valores medidos para os elementos alterados e estados observados; não é auditoria automatizada de toda a página. |

## PR e CI remoto

A [PR #107](https://github.com/SamiaLuvanice/bestprice/pull/107) está aberta para
`develop`, com fechamento da Issue #106 previsto após integração. A revisão
independente do código foi concluída antes da abertura da PR. No SHA `380b8b7`,
os checks obrigatórios do GitHub **CI / CI**, **Frontend**, **Backend**,
**Automation** e **PR policy** passaram. O check do Cloudflare Pages ainda estava
em andamento na consulta; o comentário de deploy informava sucesso, mas isso
não equivale à conclusão do check. A PR não foi integrada neste registro.

## Critérios de aceite

| Critério | Situação | Evidência e pendência |
|---|---|---|
| AC01 | **Aceito** | Captura e retângulos do navegador em 1280 × 640 px mostram imagem à esquerda, formulário à direita e ação principal visível. |
| AC02 | **Aceito** | Captura 1280 × 640 px mostra a arte proporcional, com marca e mensagem principal legíveis; não há DOM de sobreposição. O rodapé da arte é recortado como permitido. |
| AC03 | **Aceito** | Produtos e valores aparecem apenas nos pixels da arte estática; descrição acessível fala de proposta/benefícios sem ler valores como dados da conta. |
| AC04 | **Aceito** | Medidas e capturas em 320/768/1280 × 640 px sem rolagem horizontal, controles na primeira dobra e marca compacta em telas estreitas; erro em 320 px manteve primeira mensagem visível. |
| AC05 | **Aceito** | Teste DOM e inspeção no navegador confirmam apenas os controles atuais. |
| AC06 | **Aceito com limite** | 288 testes cobrem estados simulados; fluxo local real com API/PostgreSQL confirmou validação e 401, erro legível e foco devolvido à senha. Sucesso com usuário real não foi repetido no navegador. |
| AC07 | **Aceito** | Navegação Tab do campo Senha ao controle de visibilidade e ao botão; anel de foco visto na captura. Nomes/erros acessíveis no navegador, contrastes medidos e controles de 44–50 px. Uma marca com nome acessível por largura, conforme CSS e árvore de acessibilidade. |
| AC08 | **Aceito com limite** | Diff não altera API nem área autenticada; testes de `App` e backend passaram, health real 200. Área autenticada e estado indisponível não foram comparados visualmente nesta sessão. |

## Limites remanescentes

Não houve login de sucesso com uma conta de teste real nem comparação visual da área
autenticada. Esses comportamentos não foram modificados e continuam cobertos por
testes automatizados. O inventário de ativos do navegador não forneceu medição
direta de bytes transferidos no desktop; o arquivo foi observado na pintura.
