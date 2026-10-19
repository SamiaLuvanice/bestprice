# Verificação — 0026

Data de execução: 2026-10-19 (America/Sao_Paulo). A validação da API externa não
foi executada: nenhuma credencial OAuth, chave Fernet, ID de anúncio de teste ou
`.env` está disponível nesta worktree. Nenhuma chamada foi feita ao Mercado Livre.

## Critérios

| Critério | Estado | Evidência e limite |
|---|---|---|
| AC01 OAuth e renovação reais | Pendente operacional | O fluxo usa `OperatorTokenManager` e compara a expiração antes/depois, mas não havia credenciais. Tests usam transporte simulado; não comprovam autorização nem rotação oficial. |
| AC02 anúncios de terceiros/preço/contexto | Pendente operacional | A sonda valida os três cenários usando o `MercadoLivreClient` oficial e relata preço, BRL, contexto e disponibilidade. Sem IDs autorizados, não foi executada. |
| AC03 cadastro, atualização, falha, rate limit e recuperação | Parcial | Testes backend existentes simulam as falhas e recuperação e a sonda cobre só leituras. Não foram exercitados cadastro/worker com a API real nem observado limite real. Não provocar 429. |
| AC04 evidências seguras e procedimento | Parcial | O JSON da sonda omite token, título e URL e contém horário UTC, IDs e campos normalizados. Procedimento/documentação adicionados; falta resultado operacional para registrar. |
| AC05 integração desativada | Demonstrado no código | `.env.example` mantém `MERCADOLIVRE_THIRD_PARTY_VALIDATED=false`; a sonda recusa execução se o flag estiver `true`, sem alterar configuração. `test_live_validation_refuses_to_run_after_integration_flag_is_enabled` passou. |
| AC06 testes sem rede/credenciais | Demonstrado | 12 testes da sonda passaram com cliente simulado; cobrem confirmação explícita, flag, IDs, três cenários, sanitização de exceções em setup e consulta, falha, credenciais ausentes, renovação não observada, classificação de intervenção manual e precedência de falha real em resultado misto. |

## Comandos e resultados

- Red: `uv run pytest -q tests/test_marketplace_live_validation.py -p no:cacheprovider --tb=short` antes de criar o módulo — falha na coleta com `ModuleNotFoundError: No module named 'app.marketplace.validate_live'` (falha esperada).
- Green direcionado: `backend/.venv/Scripts/pytest.exe -q tests/test_marketplace_live_validation.py -p no:cacheprovider --tb=short` (executado em `backend/`) — **12 passed**.
- Backend: `backend/.venv/Scripts/ruff.exe check .` (executado em `backend/`) — **All checks passed!**.
- Backend: `backend/.venv/Scripts/pytest.exe -q --tb=short` (executado em `backend/`) — **141 passed, 31 skipped, 1 warning**; os skips incluem os testes que exigem PostgreSQL externo (`TEST_DATABASE_URL` ausente). O `TestClient` pôde usar loopback nesta execução.
- Contexto de migration: a primeira tentativa de pytest a partir da raiz falhou porque Alembic não encontrou `script_location` em `alembic.ini`; repetir o mesmo gate em `backend/`, diretório esperado pelos testes, passou.
- Complexidade (reexecução final): `backend/.venv/Scripts/python.exe .agents/skills/cyclomatic-complexity/scripts/complexity_report.py backend/app/marketplace/validate_live.py` — **11 blocos**, média 4.82 (rank A), distribuição A 5/B 6, nenhum bloco rank C ou pior e nenhum arquivo abaixo do limite de manutenibilidade. `run` ficou em CC9 (rank B) após extrair a agregação de resultados. O relatório `--changed origin/develop` não inclui o módulo novo enquanto ele não for rastreado; o relatório direcionado acima o inclui.
- Automação: `node --test .github/scripts/*.test.cjs` — **50 passed**.
- Diff: `git diff --check` — passou, sem espaços ou marcadores inválidos.
- `actionlint --version` — não executado; binário não instalado.
- GitHub: PR [#134](https://github.com/SamiaLuvanice/bestprice/pull/134), em rascunho para `develop`; CI obrigatório, Backend, Frontend, Automation, PR policy e Project sync terminaram com sucesso no [run 39272176176](https://github.com/SamiaLuvanice/bestprice/actions/runs/39272176176). O preview do Cloudflare Pages também reportou sucesso. A Issue #127 permanece aberta.
- Frontend: não executado; sem alteração no frontend.
- Integração real: não executada; ver dependências operacionais no início deste arquivo.
- Revisão independente de arquitetura identificou e ajudou a corrigir a classificação de intervenção manual e a precedência de falha real em resultado misto; a CLI emite `requires_manual_action` com códigos específicos para IDs, seleção de cenário, credenciais e renovação não observada, preservando `failed` quando qualquer consulta falha. A re-revisão não encontrou bloqueadores adicionais. QA confirmou AC05–AC06 demonstrados, AC01–AC02 pendentes e AC03–AC04 parciais sem operação real; não cabe marcar a spec implementada.

## Limitações e próximo passo

Configure OAuth e três anúncios MLB permitidos no `.env` local, sem incluir
valores secretos em evidências. Execute a sonda quando o access token estiver a
até cinco minutos do vencimento para que ocorra uma rotação real. Depois, registre
o resultado sanitizado e complete o exercício isolado de cadastro/atualização e
recuperação segundo a cadência indicada oficialmente. O `MERCADOLIVRE_THIRD_PARTY_VALIDATED`
deve permanecer `false` durante todo esse trabalho. A spec permanece `rascunho`
até os critérios operacionais serem demonstrados.
