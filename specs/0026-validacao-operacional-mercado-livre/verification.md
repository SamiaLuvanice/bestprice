# Verificação — 0026

Data de execução: 2026-10-19 (America/Sao_Paulo). A sonda de anúncios da API
externa ainda não foi executada; IDs permitidos não foram fornecidos. As tentativas
reais de autorização OAuth e seus resultados estão registrados ao final deste arquivo.

## Critérios

| Critério | Estado | Evidência e limite |
|---|---|---|
| AC01 OAuth e renovação reais | Pendente operacional | Callback HTTPS implantado; duas tentativas reais chegaram a `status=failed` e o banco Stage segue sem credencial operadora. Troca, persistência e rotação reais ainda não foram demonstradas. |
| AC02 anúncios de terceiros/preço/contexto | Pendente operacional | A sonda valida os três cenários usando o `MercadoLivreClient` oficial e relata preço, BRL, contexto e disponibilidade. Sem IDs autorizados, não foi executada. |
| AC03 cadastro, atualização, falha, rate limit e recuperação | Parcial | Testes backend existentes simulam as falhas e recuperação e a sonda cobre só leituras. Não foram exercitados cadastro/worker com a API real nem observado limite real. Não provocar 429. |
| AC04 evidências seguras e procedimento | Parcial | O JSON da sonda omite token, título e URL e contém horário UTC, IDs e campos normalizados. Tentativas OAuth e ausência de persistência foram registradas sem segredos; falta resultado operacional da sonda. |
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
- Integração real no primeiro checkpoint: não executada. A rota callback respondeu 404 antes da promoção para Stage. O deploy posterior e as duas tentativas OAuth estão registrados abaixo. Nenhuma consulta de anúncio foi executada e o flag permanece `false`.
- Revisão independente de arquitetura identificou e ajudou a corrigir a classificação de intervenção manual e a precedência de falha real em resultado misto; a CLI emite `requires_manual_action` com códigos específicos para IDs, seleção de cenário, credenciais e renovação não observada, preservando `failed` quando qualquer consulta falha. A re-revisão não encontrou bloqueadores adicionais. QA confirmou AC05–AC06 demonstrados, AC01–AC02 pendentes e AC03–AC04 parciais sem operação real; não cabe marcar a spec implementada.

## Limitações e próximo passo

Configure OAuth e três anúncios MLB permitidos no `.env` local, sem incluir
valores secretos em evidências. Execute a sonda quando o access token estiver a
até cinco minutos do vencimento para que ocorra uma rotação real. Depois, registre
o resultado sanitizado e complete o exercício isolado de cadastro/atualização e
recuperação segundo a cadência indicada oficialmente. O `MERCADOLIVRE_THIRD_PARTY_VALIDATED`
deve permanecer `false` durante todo esse trabalho. A spec permanece `rascunho`
até os critérios operacionais serem demonstrados.

Para começar a autorização em Stage, configurar `MERCADOLIVRE_CLIENT_ID`,
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

### Matriz das ações de quem usa o BestPrice

Conferência adicional em 2026-10-19 do cliente React, das rotas FastAPI, do
serviço de produtos, do worker e do formulário salvo no DevCenter:

| Ação no BestPrice | Chamada ao Mercado Livre | Permissão necessária |
|---|---|---|
| Entrar/sair e consultar a própria sessão | Nenhuma; autenticação local | Nenhuma adicional |
| Colar link para monitorar anúncio novo ou desatualizado | `GET /items/{id}` e `GET /items/{id}/sale_price` | Publicação e sincronização: Leitura |
| Retomar monitoramento com produto recente em cache | Nenhuma nessa solicitação; uma consulta posterior pode ocorrer | Mesma leitura para a consulta posterior |
| Atualizar agora e monitoramento automático | Os mesmos dois GETs, sujeitos a cadência e backoff | Mesma leitura |
| Ver painel, lista, detalhe, histórico, métricas e abrir link do anúncio | Dados locais; o link abre o site do Mercado Livre no navegador | Nenhuma adicional |
| Criar/alterar/excluir alerta, interromper monitoramento e ler notificações | Operações no banco BestPrice | Nenhuma adicional |
| Renovar a autorização da conta operadora | `POST /oauth/token` | Authorization Code e Refresh Token/acesso offline; não é uma ação de cada usuário BestPrice |

O formulário do aplicativo salvo no DevCenter mostra `Authorization Code` e `Refresh Token`
marcados, `Publicação e sincronização: Leitura`, Mercado Livre marcado,
`Client Credentials`/PKCE/VIS desmarcados, demais permissões sem acesso e
nenhum tópico de notificação selecionado. `Usuários` aparece forçadamente como
`Leitura e escrita`; o código não usa esse recurso. A opção `Leitura` governa
os dois GETs mesmo que a descrição genérica da categoria cite criação e edição
de anúncios. As notificações `items` do Mercado Livre descrevem mudanças em
anúncios publicados pela conta autorizada; não substituem o polling de anúncios
de terceiros monitorados pelo BestPrice.

**Conclusão do contrato, não da operação real:** nenhuma ação implementada de
usuário requer escrita, mensagens, vendas, pagamentos ou outros scopes. A
concessão efetiva de `offline_access` e o acesso com token da conta operadora
ao preço de anúncios de outros vendedores continuam sem prova externa. A
documentação do preço informa que, para anúncio de outro vendedor, os metadados
promocionais não são retornados; o cliente BestPrice não depende deles. Ainda é
necessário autorizar a conta, conferir o grant/refresh token e
consultar IDs permitidos. `MERCADOLIVRE_THIRD_PARTY_VALIDATED=false` continua
bloqueando as consultas normais até a validação.

Após a verificação da conta operadora, a página de edição confirmou a URI exata
`https://bestprice-stage-api.onrender.com/api/marketplace/oauth/callback`,
`Authorization Code` e `Refresh Token` ativos, `Client Credentials` e PKCE
desligados, Mercado Livre ativo, VIS desligado, `Publicação e sincronização`
em `Leitura`, demais categorias opcionais em `Sem acesso` e nenhum tópico de
notificação selecionado. `Usuários` permanece no padrão obrigatório de
`Leitura e escrita`. A concessão efetiva dos scopes no token e o acesso aos
anúncios de terceiros ainda exigem autorização e consultas reais. Nenhum
código de verificação nem segredo foi registrado nesta evidência.

Fontes oficiais consultadas: [permissões funcionais](https://developers.mercadolivre.com.br/pt_br/permissoes-funcionais/),
[preços de produtos](https://developers.mercadolivre.com.br/devcenter/api-de-precos),
[notificações](https://developers.mercadolivre.com.br/pt_br/produto-consulta-de-usuarios/produto-receba-notificacoes)
e [guia de OAuth e acesso offline](https://developers.mercadolivre.com.br/devcenter/desenvolvimento-in-house).

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

## Tentativas operacionais em Stage — 2026-10-19

O Render `bestprice-stage-api` recebeu `MERCADOLIVRE_CLIENT_ID`,
`MERCADOLIVRE_REDIRECT_URI`, `MERCADOLIVRE_CLIENT_SECRET` e
`MERCADOLIVRE_OAUTH_KEY`; o deploy de alteração de ambiente terminou `Live`
e os health checks internos retornaram 200. A chave Fernet salva no Render
foi comparada à chave local por SHA-256, sem registrar seu valor, e coincidiu.
O Client Secret estava preenchido, mas seu valor não pôde ser comparado
independentemente ao DevCenter. O flag `MERCADOLIVRE_THIRD_PARTY_VALIDATED`
permaneceu `false`.

A URL oficial foi gerada duas vezes por `python -m app.marketplace.authorize_operator`
com `state` de dez minutos e redirect Stage. Na primeira, a operadora concluiu
o consentimento no navegador; o Render acordou durante o callback. A segunda
foi iniciada com `/api/health` respondendo `{"status":"ok","database":"ok"}`
antes da abertura da URL. Ambas chegaram a
`/api/marketplace/oauth/complete?status=failed`. Nos logs da segunda implantação,
`GET /api/marketplace/oauth/callback` retornou 303, sem query sensível no access
log. A consulta somente de contagem
`SELECT COUNT(*) ... FROM public.operator_credentials WHERE id = 1` no banco
Stage retornou **0** após cada tentativa; nenhum token foi persistido. O callback
então implantado suprimia a causa interna e por isso não permitia distinguir falha de troca
OAuth de falha de persistência. Após as tentativas, o serviço permaneceu Live e
`/api/health` retornou 200; o flag continuou `false`. AC01 permanece pendente;
nenhuma consulta de anúncio foi executada, AC02 permanece pendente e AC03–AC04
seguem parciais conforme a matriz acima. Não registrar códigos,
tokens, segredo, chave ou a URL com `state` nesta evidência.

Para diagnosticar a falha sem expor o callback, `oauth_routes.py` passou a emitir
somente categorias fixas de falha para configuração, `state`, resposta de autorização,
erros conhecidos de integração e exceção inesperada. A resposta pública permanece
genérica. TDD: Red inicial do teste de log na troca OAuth — **2 failed, 7 deselected**;
Green — **2 passed, 7 deselected**. Red dos retornos antecipados — **4 failed,
9 deselected**; Green final do callback — **13 passed**. Comandos executados em
`backend/`: `.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider
tests/test_marketplace_oauth_callback.py`, `.venv/Scripts/ruff.exe check
app/marketplace/oauth_routes.py tests/test_marketplace_oauth_callback.py` —
**All checks passed**; `.venv/Scripts/python.exe -m pytest -q -p
no:cacheprovider` — **155 passed, 31 skipped, 1 warning** (fora do sandbox
Windows após bloqueio de acesso ao diretório temporário). `TEST_DATABASE_URL`
estava ausente, de modo que o gate não executou a integração PostgreSQL.
`python .agents/skills/cyclomatic-complexity/scripts/complexity_report.py
backend/app --changed origin/develop` — 22 blocos, média CC 4, rank A, sem
blocos C+; `git diff --check` passou. Revisão independente do diff: sem
bloqueador; observou apenas lacunas menores de cobertura de redirect ausente
e parâmetros duplicados/longos. Nenhuma nova tentativa real foi feita após
essa mudança, que ainda requer deploy Stage.
