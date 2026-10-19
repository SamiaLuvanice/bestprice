# Verificação — 0026

Data de execução: 2026-10-19 (America/Sao_Paulo). A validação da API externa não
foi executada: nenhuma credencial OAuth operacional, chave Fernet operacional ou
ID de anúncio permitido foi usado nesta validação. Nenhuma chamada foi feita ao
Mercado Livre.

## Critérios

| Critério | Estado | Evidência e limite |
|---|---|---|
| AC01 OAuth e renovação reais | Pendente operacional | Implementado callback HTTPS com state assinado/expirável, troca pelo endpoint oficial e persistência cifrada; 6 testes simulados passaram. App ainda não foi criado/configurado no DevCenter, callback não foi implantado em Stage e nenhuma autorização/rotação real ocorreu. |
| AC02 anúncios de terceiros/preço/contexto | Pendente operacional | A sonda valida os três cenários usando o `MercadoLivreClient` oficial e relata preço, BRL, contexto e disponibilidade. Sem IDs autorizados, não foi executada. |
| AC03 cadastro, atualização, falha, rate limit e recuperação | Parcial | Testes backend existentes simulam as falhas e recuperação e a sonda cobre só leituras. Não foram exercitados cadastro/worker com a API real nem observado limite real. Não provocar 429. |
| AC04 evidências seguras e procedimento | Parcial | O JSON da sonda omite token, título e URL e contém horário UTC, IDs e campos normalizados. Procedimento/documentação adicionados; falta resultado operacional para registrar. |
| AC05 integração desativada | Demonstrado no código | `.env.example` mantém `MERCADOLIVRE_THIRD_PARTY_VALIDATED=false`; a sonda recusa execução se o flag estiver `true`, sem alterar configuração. `test_live_validation_refuses_to_run_after_integration_flag_is_enabled` passou. |
| AC06 testes sem rede/credenciais | Demonstrado | 12 testes da sonda e 6 testes do callback passaram sem rede/credenciais; cobrem confirmação, flag, cenários, sanitização, state inválido/expirado/adulterado, redirect incompatível, troca mockada, persistência Fernet e redação do access log. |

## Comandos e resultados

- Red: `uv run pytest -q tests/test_marketplace_live_validation.py -p no:cacheprovider --tb=short` antes de criar o módulo — falha na coleta com `ModuleNotFoundError: No module named 'app.marketplace.validate_live'` (falha esperada).
- Green direcionado: `backend/.venv/Scripts/pytest.exe -q tests/test_marketplace_live_validation.py -p no:cacheprovider --tb=short` (executado em `backend/`) — **12 passed**.
- Red OAuth: `pytest -q tests/test_marketplace_oauth_callback.py -p no:cacheprovider --tb=short` (em `backend/`, antes de criar `oauth_routes.py`) — falha esperada na importação do módulo ainda inexistente.
- Green OAuth: `backend/.venv/Scripts/pytest.exe -q tests/test_marketplace_oauth_callback.py -p no:cacheprovider --tb=short` — **6 passed**, um aviso de depreciação do `TestClient` Starlette/httpx. Exercita URL oficial/state, expiração e adulteração, redirect exato, POST simulado, persistência cifrada e sanitização de log.
- Backend: `backend/.venv/Scripts/ruff.exe check .` (executado em `backend/`) — **All checks passed!**.
- Backend final: `backend/.venv/Scripts/ruff.exe check .` e `backend/.venv/Scripts/pytest.exe -q --tb=short` (executados em `backend/`) — lint passou; **147 passed, 31 skipped, 1 warning**. Os skips incluem testes que exigem PostgreSQL externo (`TEST_DATABASE_URL` ausente). A suíte foi repetida fora do sandbox após bloqueio Windows de diretório temporário.
- Contexto de migration: a primeira tentativa de pytest a partir da raiz falhou porque Alembic não encontrou `script_location` em `alembic.ini`; repetir o mesmo gate em `backend/`, diretório esperado pelos testes, passou.
- Complexidade (reexecução final): `backend/.venv/Scripts/python.exe .agents/skills/cyclomatic-complexity/scripts/complexity_report.py backend/app/marketplace/validate_live.py` — **11 blocos**, média 4.82 (rank A), distribuição A 5/B 6, nenhum bloco rank C ou pior e nenhum arquivo abaixo do limite de manutenibilidade. `run` ficou em CC9 (rank B) após extrair a agregação de resultados. O relatório `--changed origin/develop` não inclui o módulo novo enquanto ele não for rastreado; o relatório direcionado acima o inclui.
- Automação: `node --test .github/scripts/*.test.cjs` — **50 passed**.
- Complexidade final: `backend/.venv/Scripts/python.exe .agents/skills/cyclomatic-complexity/scripts/complexity_report.py --baseline .complexity-baseline.json` (na raiz) — passou sem nova violação rank D+; `exchange_authorization_code` foi dividida após a primeira medição apontar CC22.
- Diff: `git diff --check` — passou, sem espaços ou marcadores inválidos.
- `actionlint --version` — não executado; binário não instalado.
- GitHub: PR [#134](https://github.com/SamiaLuvanice/bestprice/pull/134), em rascunho para `develop`; CI obrigatório, Backend, Frontend, Automation, PR policy e Project sync terminaram com sucesso no [run 39272176176](https://github.com/SamiaLuvanice/bestprice/actions/runs/39272176176). O preview do Cloudflare Pages também reportou sucesso. A Issue #127 permanece aberta.
- Frontend: não executado; sem alteração no frontend.
- Integração real: não executada; nenhum app foi criado no DevCenter, não houve configuração de credenciais no Stage, deploy do callback, consentimento OAuth nem consulta real. O endereço Stage está declarado no Render e o flag de integração permanece `false`.
- Revisão independente de arquitetura identificou e ajudou a corrigir a classificação de intervenção manual e a precedência de falha real em resultado misto; a CLI emite `requires_manual_action` com códigos específicos para IDs, seleção de cenário, credenciais e renovação não observada, preservando `failed` quando qualquer consulta falha. A re-revisão não encontrou bloqueadores adicionais. QA confirmou AC05–AC06 demonstrados, AC01–AC02 pendentes e AC03–AC04 parciais sem operação real; não cabe marcar a spec implementada.

## Limitações e próximo passo

Configure OAuth e três anúncios MLB permitidos no `.env` local, sem incluir
valores secretos em evidências. Execute a sonda quando o access token estiver a
até cinco minutos do vencimento para que ocorra uma rotação real. Depois, registre
o resultado sanitizado e complete o exercício isolado de cadastro/atualização e
recuperação segundo a cadência indicada oficialmente. O `MERCADOLIVRE_THIRD_PARTY_VALIDATED`
deve permanecer `false` durante todo esse trabalho. A spec permanece `rascunho`
até os critérios operacionais serem demonstrados.

Para começar a autorização em Stage, criar/configurar o app no DevCenter com o
redirect HTTPS definido no `render.yaml`, configurar `MERCADOLIVRE_CLIENT_ID`,
`MERCADOLIVRE_CLIENT_SECRET` e a mesma `MERCADOLIVRE_OAUTH_KEY` no Stage e no
ambiente que executará `app.marketplace.authorize_operator`, promover a branch
até Stage e então concluir o consentimento. Nenhum segredo deve ser registrado
nesta evidência. A redação foi verificada no logger `uvicorn.access`; logs da
borda/proxy Render não foram inspecionados.

## Revisão de permissões e compatibilidade OAuth

Revisão feita em 2026-10-19 após inspecionar os endpoints externos usados em
`backend/app/marketplace/` e comparar com a documentação oficial do Mercado
Livre. O sistema atualmente chama `GET /items/{id}` e
`GET /items/{id}/sale_price?context=channel_marketplace&quantity=1`, além de
`POST /oauth/token` para autorização e rotação. O restante do monitoramento,
alertas, histórico, usuários e notificações é processado pelo próprio BestPrice;
não há chamadas externas para pedidos, mensagens, pagamentos, anúncios graváveis
ou webhooks.

| Configuração DevCenter | Necessidade atual | Motivo |
|---|---|---|
| Unidade de negócio Mercado Livre | Obrigatória | O cliente usa domínios e recursos do marketplace MLB. Mercado Pago deve permanecer em aplicativo separado. |
| Autorização `Authorization Code` | Obrigatória | É o fluxo de servidor implementado pelo callback HTTPS. |
| Publicação e sincronização: somente leitura | Necessária para anúncios | Os recursos de itens e preços são consultados por GET; não habilitar escrita. |
| Acesso offline / `offline_access` (Refresh Token) | Obrigatório para operação contínua | O access token expira e o gestor troca o refresh token de uso único. |
| Usuários (default) | Pode permanecer no padrão obrigatório | A plataforma informa que vem ativa para todos os apps; o código atual não consulta nem modifica `/users`. |
| Client Credentials | Desnecessária | O sistema atua em nome da conta operadora via OAuth Authorization Code. |
| PKCE | Desligado nesta versão | O código implementa `state`, mas não gera `code_challenge` nem envia `code_verifier`; se habilitado, o fluxo atual falhará. |
| Escrita, comunicações, publicidade, vendas/envios, métricas, promoções, faturamento e Mercado Pago | Desnecessárias | Nenhum endpoint dessas áreas é chamado no código atual. |
| Callback de notificações/tópicos | Desnecessários no polling atual | O worker consulta periodicamente; não há webhook do Mercado Livre implementado. |

O modo somente leitura deve cobrir os GETs de itens e preços. Se a API responder
403 por política apesar desses scopes, registrar o recurso específico e
reavaliar a documentação/DevCenter antes de solicitar qualquer escrita. Para
futuros webhooks, tópicos de itens/preços e URL de notificações exigem mudança de
escopo separada.

A documentação OAuth oficial também retorna `token_type` como `bearer` minúsculo,
enquanto o código aceitava apenas `Bearer`. Testes parametrizados agora cobrem
ambas as grafias na troca de código e renovação. Red observado: os dois casos
`bearer` falharam com `integration_invalid_response`. Green: `backend/.venv/Scripts/python.exe
-m pytest tests/test_marketplace_oauth_callback.py tests/test_operator_oauth.py
tests/test_operator_oauth_integration.py -q` (em `backend/`) — 18 passaram,
1 skipped. Após extrair a validação reutilizável para manter a complexidade, os
gates finais foram executados novamente: `backend/.venv/Scripts/ruff.exe check
backend` — passou; `backend/.venv/Scripts/python.exe -m pytest -q --tb=short`
(em `backend/`, com permissão para criar os temporários exigidos) — 149 passed,
31 skipped, 1 warning de depreciação Starlette/httpx; `backend/.venv/Scripts/python.exe
.agents/skills/cyclomatic-complexity/scripts/complexity_report.py --baseline
.complexity-baseline.json` (na raiz) — sem nova violação rank D+; `git diff
--check` — passou. O teste de processo de worker ficou skipped por não haver
PostgreSQL de teste configurado.
