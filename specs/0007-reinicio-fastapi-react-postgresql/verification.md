# Verificação — 0007

Estado: em andamento. Evidências abaixo pertencem à branch
`feature/0007-issue-15-reinicio-fastapi-react`; PR, CI remoto e aprovação
independente ainda não concluídos.

## Gates executados

| Área | Comando ou ação | Resultado observado |
|---|---|---|
| Backend | `uv run --locked --extra dev pytest -q -p no:cacheprovider` com `TEST_DATABASE_URL` para PostgreSQL isolado em localhost:15433 | 5 testes passaram, incluindo consulta `SELECT 1`, falha de conexão e senha com `@` |
| Backend | `uv run --locked --extra dev ruff check .`; `uv lock --check --offline` | Ambos passaram |
| Backend | `docker build -t bestprice-backend-spec0007 .`; import de `psycopg` e `app.main` na imagem | Build e import passaram; driver binário confirmado |
| Frontend | `npm test -- --run`; `npm run lint`; `npm run build` | 7 testes passaram após ajuste do timeout; lint e build passaram |
| Harness | `scripts/diagnose-harness.ps1`, `.agents/sync.ps1`, `docker compose config --quiet`, `pre-commit check-yaml`, `pre-commit check-json` | Passaram na verificação do responsável pela área |
| Automações | `node --test .github/scripts/*.test.cjs` | 11 testes passaram |
| Workflows | `actionlint` | Não executado localmente; ferramenta indisponível. CI executa o gate |

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
  worktree, evidência, revisão, QA e PR para `develop`; as orientações Java/Angular
  foram arquivadas. Revisão final de referências ativas em andamento.
- Interface: testes de componente cobrem carregamento, sucesso, 503, resposta
  inválida, falha de rede e timeout. Proxy de produção limita a espera a 2–5
  segundos. Resultado observado também em Chrome headless nos três cenários.
- CI: `quality.yml` usa Python 3.13/uv, PostgreSQL real, React e automações.
  O job agregado `CI` permanece. Resultado remoto da PR pendente.
- Entrega: Dockerfiles locais construídos; publicação GHCR e release não
  realizadas nesta etapa. O workflow de entrega permanece para promoção futura.
- Project/implantação externa: sem evidência de sincronização ou configuração;
  não declaradas concluídas.
- Revisão independente de arquitetura: concluída sem bloqueios remanescentes
  após corrigir porta local do banco, instalação do driver no host, senha do
  Compose e instrução antiga de implementação na skill `spec-driven`.

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
