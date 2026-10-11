# Aprendizados

As decisões ativas ficam em `.agents/`, no [contexto do produto](product-context.md), `README.md` e nas specs em `specs/`.

## 2026-10-09 — Serializar a decisão antes da notificação

**Contexto:** duas sessões PostgreSQL avaliavam o mesmo alerta como ainda não
notificado. A restrição única impedia a segunda linha, mas uma transação
terminava com `IntegrityError`. Edições concorrentes de alvos diferentes
também perdiam uma revisão. Interromper um vínculo ao mesmo tempo que o alerta
era habilitado podia deixar o vínculo inativo com o alerta habilitado.

**Princípio:** bloqueie a linha que guarda o estado da decisão antes de lê-lo
ou alterá-lo, e recarregue valores após esperar a trava. Mantenha a restrição
única como proteção final, não como fluxo normal de concorrência. Quando a
decisão depende da atividade do vínculo, trave e releia esse vínculo antes de
editar ou interromper o alerta.

**Anti-pattern:** depender apenas da unicidade da notificação, travar o alerta
somente depois de calcular uma nova revisão ou consultar o vínculo sem trava
antes de uma alteração que depende de `active`.

**Referências:** `backend/app/products/alerts.py`,
`backend/app/products/routes.py`,
`backend/tests/test_alert_concurrency_integration.py` e AC-021.

## 2026-10-09 — Levar falhas anteriores ao HTTP pela regra de tentativa

**Contexto:** a obtenção do token da conta operadora podia falhar antes da
requisição ao anúncio. A rota devolvia o erro, mas não atualizava a última
tentativa da publicação. Após `not_found`, uma falha transitória também
reduzia a próxima janela para cerca de uma hora.

**Princípio:** erros da fronteira de integração devem atravessar a mesma regra
transacional de estado, inclusive quando ocorrem ao preparar credenciais.
Regras de intervalo ligadas ao estado persistido precisam sobreviver a falhas
posteriores que não confirmam mudança desse estado.

**Anti-pattern:** converter erro da integração em erro HTTP antes do serviço de
domínio registrar a tentativa; calcular backoff isolado sem considerar o
estado `not_found` ainda vigente.

**Referências:** `backend/app/products/routes.py`,
`backend/app/products/service.py`, `backend/tests/test_product_lifecycle.py`
e `backend/tests/test_refresh_http.py`.

## 2026-10-09 — Testar a ordem de desempate com entradas invertidas

**Contexto:** oportunidades de mesma queda percentual herdavam a ordem dos
vínculos, embora a spec exigisse priorizar a mudança mais recente.

**Princípio:** para verificar ordenação, construa um caso em que a ordem de
entrada e a ordem esperada divergem. Normalize instantes UTC antes de comparar
e use um identificador estável como último desempate.

**Anti-pattern:** testar só a chave principal de ordenação ou aceitar a ordem
incidental da consulta anterior.

**Referências:** `backend/app/products/routes.py`,
`backend/tests/test_dashboard_metrics.py` e AC-020 da spec 0013.

## 2026-10-09 — Compartilhar a janela de atualidade entre leitura e decisão

**Contexto:** na spec 0013, cartões usavam `MONITOR_FRESHNESS_SECONDS`, mas
alertas ainda tinham uma hora fixa. Um preço de 11 minutos era mostrado como
`stale` com janela de 10 minutos e mesmo assim gerava notificação.

**Princípio:** todas as decisões que dependem de preço atual devem usar a mesma
janela operacional. Teste o limite pela resposta HTTP e pelo efeito persistido.

**Anti-pattern:** atualizar apenas a exibição de `stale` ao tornar o frescor
configurável, deixando alertas ou indicadores com uma constante antiga.

**Referências:** `backend/app/products/service.py`,
`backend/app/products/alerts.py`, `backend/tests/test_alert_http.py` e AC-010.

## 2026-10-09 — Resolver estados locais antes de inicializar a integração

**Contexto:** na spec 0013, a dependência FastAPI obtinha um token externo antes
de validar a URL ou procurar um vínculo existente. Com a integração desligada,
o cadastro retornava 503 até para URL inválida, duplicação ou retomada.

**Princípio:** em operações com fonte externa, conclua as decisões locais que
independem dela antes de inicializar credenciais ou fazer HTTP. Teste o
contrato também com a integração indisponível.

**Anti-pattern:** usar uma dependência com efeito externo antecipado quando a
rota ainda pode responder por validação ou estado persistido.

**Referências:** `specs/0013-monitoramento-mercado-livre-brasil/spec.md`
(AC-022), `backend/app/products/routes.py` e `backend/tests/test_tracking_http.py`.

## 2026-10-07 — Distinguir visão de produto de funcionalidades entregues

**Contexto:** o responsável definiu o BestPrice como produto real de monitoramento automático da Amazon por URL; o checkout ainda contém apenas a base de comunicação entre frontend, API e banco.

**Princípio:** preservar o fluxo de entrada apenas por URL nas futuras specs e registrar a visão de produção em uma referência de produto. Documentação técnica deve distinguir explicitamente capacidades existentes, requisitos futuros e decisões pendentes.

**Anti-pattern:** tratar a base atual como produto pronto, exigir cadastro manual de dados obtidos pela integração ou documentar ORM, autenticação e deploy como existentes antes de implementá-los.

**Referências:** [contexto do produto](product-context.md), [arquitetura](architecture.md) e [regra de workspace](../.agents/rules/workspace.md).

## 2026-10-07 — Manter o índice alinhado aos documentos ativos

**Contexto:** uma revisão encontrou links de onboarding para documentos que não
fazem parte da documentação atual do projeto.

**Princípio:** confira se cada destino existe no checkout e atualize o índice na
mesma mudança que remove ou substitui um documento.

**Anti-pattern:** deixar links para materiais retirados ou fora do escopo atual.

**Referências:** `docs/index.md` e a revisão da documentação de onboarding.

## 2026-10-06 — Separar CI de automações com permissão de escrita

CI de PR usa permissões de leitura e nenhum secret. A sincronização do Project
usa somente metadados atuais e código da branch padrão; publicação ocorre na
`main` após os gates. Project e deploy só devem ser considerados ativos quando
há evidência de execução real.

## 2026-10-06 — Validar a base depois da migração de stack

Ao trocar a stack, a configuração ativa precisa apontar para FastAPI, React e
PostgreSQL em todos os pontos: regras, skills, gates, documentação, Compose e
workflows. As instruções e os links publicados devem corresponder aos arquivos
e ferramentas que fazem parte do projeto naquele momento.
