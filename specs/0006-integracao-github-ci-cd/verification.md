# Verificação — 0006

Data: 2026-10-06. Branch: `feature/0006-issue-12-github-workflow`.
Issue: https://github.com/SamiaLuvanice/bestprice/issues/12.

## Evidências locais

| Verificação | Resultado |
|---|---|
| `backend/.\mvnw.cmd --batch-mode --no-transfer-progress verify` | BUILD SUCCESS; 23 testes, zero falhas/erros/skips |
| `frontend/npm ci` | 469 pacotes instalados; lockfile preservado |
| `frontend/npm run build` | Build de produção concluído |
| `frontend/npm test -- --watch=false` | 31 testes, cinco arquivos, todos passaram |
| `node --test .github/scripts/*.test.cjs` | 9 testes passaram; política, transições e fronteira API com dublê |
| `actionlint` 1.7.12 | Quatro workflows válidos; binário oficial com SHA256 conferido |

TDD: três testes de política falharam contra a implementação vazia (retorno
incorreto/ausência de rejeição) e passaram após implementação. Dois testes de
status falharam contra o retorno constante Todo e passaram com as transições.
A primeira tentativa Node foi bloqueada por EPERM do sandbox; essa falha de
ambiente não foi considerada evidência Red.

## Limites e pendências

- Project: token atual sem escopo project. Criação, campos/visões, credencial
  PROJECT_TOKEN e execução real de sincronização exigem configuração do responsável.
- CD: lint validado; publicação real só após revisão e promoção para main.
  Nenhuma imagem/release foi publicada como teste; implantação externa não existe.
- `npm ci` relatou três vulnerabilidades preexistentes (uma alta e duas críticas).
  Correção de dependências não faz parte desta spec; não foi executado audit fix.
- Nenhum comportamento REST/Angular foi alterado; não repetido E2E de login.
- Spec permanece pronta, aguardando revisão independente, merge e comprovação
  dos critérios dependentes de configuração externa. CI verde não equivale a CD
  ou sincronização Project demonstrados.
