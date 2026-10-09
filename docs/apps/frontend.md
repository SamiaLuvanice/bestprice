# Módulo frontend

## Fluxo atual nesta branch

A SPA em `frontend/src/App.tsx` consulta `GET /api/auth/me` ao abrir. Somente 401 é tratado como ausência de sessão e apresenta o formulário de entrada; se `/auth/me` falhar por indisponibilidade da API ou da rede, a tela mostra a mensagem de erro e o botão “Tentar novamente”, sem enviar a pessoa ao login. Com sessão, carrega o dashboard e as notificações. A conta precisa ser provisionada no backend antes do login. Não há cadastro público ou roteamento client-side.

Após entrar, a pessoa pode informar uma URL de anúncio MLB, ver os monitoramentos ativos, abrir o detalhe, solicitar atualização, interromper o vínculo e criar, editar, pausar ou excluir um alerta de preço. O detalhe apresenta o histórico de preços. A área de notificações permite marcar cada item como lido. Os botões “Carregar mais”, “Carregar mais preços” e “Carregar mais notificações” usam `next_cursor` das respectivas respostas e acrescentam itens sem repetir IDs. O dashboard mostra resumo, oportunidades e atualizações recentes. As oportunidades recebidas da API aparecem por maior queda percentual e, em empate, pela mudança mais recente. O detalhe mostra os extremos calculados sobre o histórico completo, mesmo quando a lista de histórico é carregada por páginas.

| Arquivo | Responsabilidade |
|---|---|
| `frontend/src/App.tsx` | Estado da sessão, formulários, dashboard, detalhe, alertas e paginação |
| `frontend/src/api.ts` | Cliente HTTP relativo a `/api`, envio do cookie da sessão, validação das respostas (inclusive cada item de `recent_updates`) e erros `ApiFailure` com `status`, `code`, `trackedProductId` e `retryAfterSeconds` |
| `frontend/src/styles.css` | Apresentação responsiva |
| `frontend/src/App.test.tsx` | Testes de interface com respostas HTTP simuladas, incluindo páginas seguintes de histórico e notificações |
| `frontend/src/health.ts` | Cliente legado de `/api/health`, preservado para testes de saúde |

O cliente consome `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`, `/api/dashboard`, `/api/tracked-products`, seus subrecursos `history`, `refresh` e `alert`, além de `/api/notifications`. Usa `credentials: 'same-origin'`; o proxy Vite ou Nginx encaminha `/api` ao FastAPI. Valores monetários chegam como strings e são formatados para apresentação; instantes são apresentados no fuso local do navegador.

## Estados e limites

Falhas de operação são mostradas em `role="alert"` com a mensagem específica devolvida pela API. Apenas 401 encerra a sessão local e volta ao login; 503 da integração, outros erros e falhas de rede mantêm a pessoa no painel. Quando a resposta traz `retry_after_seconds` (por exemplo, 429), a mensagem acrescenta o prazo em segundos ou minutos. No 409 `already_tracked`, aparece o botão “Ver produto”, que abre o monitoramento existente. Se “Atualizar agora” falhar, a SPA recarrega o detalhe e o dashboard para exibir a tentativa registrada pelo backend, mantendo o erro visível. Falha ao carregar notificações aparece na própria seção, sem a mensagem de lista vazia; os textos de vazio do painel só aparecem depois que o dashboard carrega.

O detalhe mostra “Preço indisponível” sem preço atual e “Desconhecido”/“Desconhecida” para anterior, diferença, variação, mínimo, máximo e instantes ainda sem valor, em vez de zero ou de “Ainda não consultado”. A nota do hero informa que os preços vêm das consultas do BestPrice ao Mercado Livre e podem diferir do checkout; não afirma integração oficial autorizada.

Com a integração Mercado Livre desligada, o backend ainda valida a URL, informa duplicação e retoma vínculos interrompidos; uma publicação que exige consulta externa retorna indisponibilidade com a mensagem de integração não autorizada. As páginas de histórico e notificações usam o cursor da API, mas a UI ainda não expõe filtros de data ou de notificações não lidas. Os testes de interface usam respostas simuladas; inspeção visual, acessibilidade e layout móvel em navegador ainda não foram verificados. Consulte a [evidência da spec 0013](../../specs/0013-monitoramento-mercado-livre-brasil/verification.md).
