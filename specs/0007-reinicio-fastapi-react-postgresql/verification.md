# Verificação — 0007

Estado: implementação integrada em `develop`. As evidências abaixo pertencem
à branch `feature/0007-issue-15-reinicio-fastapi-react` e à
[PR #16](https://github.com/SamiaLuvanice/bestprice/pull/16), que foi aprovada
e integrada; os resultados abaixo descrevem a verificação da aplicação e não
alteram seu comportamento.

## Gates executados

| Área | Comando ou ação | Resultado observado |
|---|---|---|
| Backend | `uv run --locked --extra dev pytest -q -p no:cacheprovider` com `TEST_DATABASE_URL` para PostgreSQL isolado em localhost:15433 | 5 testes passaram, incluindo consulta `SELECT 1`, falha de conexão e senha com `@` |
| Backend | `uv run --locked --extra dev ruff check .`; `uv lock --check --offline` | Ambos passaram |
| Backend | `docker build -t bestprice-backend-spec0007 .`; import de `psycopg` e `app.main` na imagem | Build e import passaram; driver binário confirmado |
| Frontend | `npm test -- --run`; `npm run lint`; `npm run build` | 7 testes passaram após ajuste do timeout; lint e build passaram |
| Harness | `scripts/diagnose-harness.ps1`, `.agents/sync.ps1`, `docker compose config --quiet`, `pre-commit check-yaml`, `pre-commit check-json` | Passaram na verificação do responsável pela área |
| Automações | `node --test .github/scripts/*.test.cjs` | 15 testes passaram |
| Workflows | `actionlint` | Não executado localmente; ferramenta indisponível. O job remoto `quality / Automation`, que executa o gate, passou na PR #16 |
| CI remoto | Jobs `CI`, `quality / Backend`, `quality / Frontend`, `quality / Automation` e `PR policy` da PR #16 | Todos `SUCCESS` na execução consultada da PR #16 |
| Falha controlada do agregador | Bash com `QUALITY_RESULT=failure` executando a condição `test "$QUALITY_RESULT" = success` de `ci.yml` | Exit 1 esperado; a condição rejeitou o gate vermelho |

## Gates da PR #22

Os gates abaixo foram executados sobre o commit `8924a5f` e confirmados nos
checks remotos da PR #22:

| Verificação | Resultado observado |
|---|---|
| `uv sync --locked --extra dev`; `uv run ruff check .`; `uv run pytest -q` | Ruff passou; 3 testes passaram e 2 foram pulados porque não havia PostgreSQL local |
| `npm ci --no-audit --no-fund`; `npm run lint`; `npm test -- --run`; `npm run build` | Lint e build passaram; 7 testes passaram |
| `node --test .github/scripts/*.test.cjs` | 15 testes passaram |
| `git diff --check` e validação JSON de `skills-lock.json` | Passaram |
| Índice de onboarding | Todos os documentos listados apontam para arquivos presentes no checkout |
| `.agents/sync.ps1` | Projeções `.claude/` regeneradas a partir de `.agents/` |
| `actionlint` local | Não executado: ferramenta indisponível; job remoto `quality / Automation` passou |
| Checks remotos da PR #22 | `CI`, `PR policy`, backend, frontend, automações e `sync` passaram |
| Revisão independente pelo `arch-reviewer` | Sem bloqueio técnico; foi solicitada atualização documental, registrada nesta seção |

O índice `docs/index.md` lista os documentos atuais de onboarding e os guias dos módulos.

## Fluxo integrado observado

Compose isolado da worktree:
`bestprice-feature-0007-issue-15-reinicio-f-ce03719a`, API em
`127.0.0.1:25807`, interface em `127.0.0.1:32807`, volume próprio.
`docker compose config -q` passou; os três serviços iniciaram e o banco ficou
saudável. O banco antigo e o `designsystem/` local não foram alterados.

| Cenário | Chamada | Resultado observado |
|---|---|---|
| Banco disponível | `curl.exe -i http://127.0.0.1:25807/api/health` | HTTP 200, `{"status":"ok","database":"ok"}` |
| Proxy da interface | `curl.exe -i http://127.0.0.1:32807/api/health` | HTTP 200, mesmo JSON |
| HTML da interface | `curl.exe -I http://127.0.0.1:32807/` | HTTP 200 |
| Banco parado temporariamente | Mesmas rotas da API e do proxy | HTTP 503, `{"status":"unavailable","database":"unavailable"}` em ambas; banco religado |
| API parada temporariamente, após correção | Rota `/api/health` pelo proxy | HTTP 504 em cerca de 2 segundos; teste React cobre saída do carregamento para erro. API religada |

Chrome headless com `--dump-dom` em `http://127.0.0.1:32807/` confirmou
`Tudo conectado` com banco e API disponíveis. Após parar o banco isolado,
confirmou `Serviço indisponível` e `Indisponíveis`; repetiu os mesmos textos
com a API parada. Nenhum cenário de erro exibiu sucesso. Os serviços foram
religados ao término.

Após o ajuste de senha/configuração, a stack foi reconstruída: API e proxy
retornaram 200 `ok/ok` com banco ativo; ao parar o banco, o proxy retornou 503
`unavailable/unavailable`; ao parar a API, retornou 504 em cerca de 2 segundos.
Os serviços foram religados. O Compose usa `DB_PORT` publicado apenas em
localhost e passa a senha ao driver por campo separado, sem concatená-la numa URL.

## Critérios e pendências

- Histórico e remoções: branch e worktree partem de `origin/develop`; o patch local
  continha apenas deleções de `backend/` e `frontend/`, transportadas sem alterar
  o checkout principal. `designsystem/` continua não rastreado e preservado.
- Harness: a skill ativa `agent-orchestration` orienta Issue, spec, plano,
  worktree, evidência, revisão, QA e PR para `develop`; as instruções ativas
  correspondem ao perfil técnico do projeto.
- Interface: testes de componente cobrem carregamento, sucesso, 503, resposta
  inválida, falha de rede e timeout. Proxy de produção limita a espera a 2–5
  segundos. Resultado observado também em Chrome headless nos três cenários.
- CI: `quality.yml` usa Python 3.13/uv, PostgreSQL real, React e automações.
  O job agregado `CI` permanece. A execução remota da PR #16 passou em todos os
  checks obrigatórios.
- Entrega: Dockerfiles locais construídos; publicação GHCR e release não
  realizadas nesta etapa. O workflow de entrega permanece para promoção futura.
- Project/implantação externa: sem evidência de sincronização ou configuração;
  não declaradas concluídas.
- Revisão independente de arquitetura: concluída sem bloqueios técnicos na PR
  #22. A revisão solicitou evidência documental específica da limpeza; os gates
  e o estado da PR foram registrados nesta atualização.

## Checkout limpo

Uma worktree temporária destacada no commit `f87256d` instalou dependências
sem arquivos da área de desenvolvimento: `uv sync --locked --extra dev` instalou
27 pacotes e `npm ci` instalou 256 pacotes. Seu Compose isolado construiu as
duas imagens, iniciou API, interface e PostgreSQL com volume próprio e retornou
HTTP 200 `ok/ok` tanto em `:25808/api/health` quanto pelo proxy em
`:32808/api/health`; a raiz da SPA retornou HTTP 200. Os containers, volume e
worktree temporários foram removidos após a prova, sem tocar no volume antigo.

## Matriz dos critérios de aceite

| Nº | Situação | Evidência ou pendência |
|---|---|---|
| 1 | Demonstrado | A spec 0007 mantém numeração sequencial e os commits foram feitos em branch própria. |
| 2 | Demonstrado | Índices, papéis, regras, comandos e skills ativos migrados; instruções correspondem ao perfil técnico do projeto. |
| 3 | Demonstrado | Spec, plano, TDD Red/Green, worktree, revisão e limpeza documentados e exercidos até a etapa anterior ao merge. |
| 4 | Demonstrado | Skill ativa `agent-orchestration`, claims, percurso de mesa abaixo e evidência por transição. |
| 5 | Demonstrado | Regras de segurança, erros, datas, `Decimal`, testes e configuração por ambiente adaptadas. |
| 6 | Demonstrado | Checkout limpo instalou dependências por lock e iniciou três serviços via Compose. |
| 7 | Demonstrado | API/proxy 200 após `SELECT 1`; Chrome headless exibiu `Tudo conectado`. |
| 8 | Demonstrado | 200 `ok/ok` com banco e 503 `unavailable/unavailable` com banco parado. |
| 9 | Demonstrado | Chrome headless exibiu `Serviço indisponível` com banco ou API parados; testes de rede/timeout verdes. |
| 10 | Demonstrado | 5 testes backend, 7 frontend, 15 automações; comandos nesta página e no README. |
| 11 | Demonstrado | PR #16: `CI`, backend, frontend, automações e política de PR verdes; condição do agregador falhou com resultado obrigatório simulado como `failure`. |
| 12 | Demonstrado localmente | Duas imagens construídas pelo Compose; workflow de release preserva tags/digests, sem publicação nesta spec. |
| 13 | Demonstrado | README e docs de harness/GitHub descrevem a base atual e as pendências externas. |
| 14 | Demonstrado | Deleções antigas entraram nos commits da feature e na PR #16; `designsystem/`, `.env` principal e volume anterior foram preservados. A PR #16 foi aprovada e integrada em `develop`. |

## Percurso de orquestração

1. Intake e revisão: Issue #15 e spec 0007 com contrato e aceite; revisor de
   spec apontou ambiguidades, incorporadas antes do plano.
2. Planejamento: `plan.md` fixa `GET /api/health`; `tasks.md` define provas por
   etapa. Branch e worktree partem de `origin/develop`.
3. Desenvolvimento: backend, frontend e harness receberam áreas exclusivas na
   mesma worktree; `docs/agent-claims.md` registra os responsáveis. TDD Red e
   Green foram reportados pelos implementadores. Achados do fluxo integrado
   retornaram aos responsáveis e receberam testes e nova verificação.
4. Revisão: agente independente leu diff e regras; achados corrigidos na mesma
   branch. QA confere o aceite; `docs/PROGRESS.md` registra o estado.
5. Entrega: PR para `develop` com `Closes #15`, check `CI` e aprovação humana
   independente antes do merge. Limpeza da worktree somente após integração.
