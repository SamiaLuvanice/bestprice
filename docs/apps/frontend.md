# Módulo frontend

## Fluxo atual nesta branch

A SPA em `frontend/src/App.tsx` consulta `GET /api/auth/me` ao abrir. Sem sessão, apresenta o formulário de entrada; com sessão, carrega o dashboard e as notificações. A conta precisa ser provisionada no backend antes do login. Não há cadastro público ou roteamento client-side.

Após entrar, a pessoa pode informar uma URL de anúncio MLB, ver os monitoramentos ativos, abrir o detalhe, solicitar atualização, interromper o vínculo e criar, editar, pausar ou excluir um alerta de preço. O detalhe apresenta o histórico de preços. A área de notificações permite marcar cada item como lido. Os botões “Carregar mais”, “Carregar mais preços” e “Carregar mais notificações” usam `next_cursor` das respectivas respostas e acrescentam itens sem repetir IDs. O dashboard mostra resumo, oportunidades e atualizações recentes. As oportunidades recebidas da API aparecem por maior queda percentual e, em empate, pela mudança mais recente. O detalhe mostra os extremos calculados sobre o histórico completo, mesmo quando a lista de histórico é carregada por páginas.

| Arquivo | Responsabilidade |
|---|---|
| `frontend/src/App.tsx` | Estado da sessão, formulários, dashboard, detalhe, alertas e paginação |
| `frontend/src/api.ts` | Cliente HTTP relativo a `/api`, envio do cookie da sessão, validação básica das respostas e erros `ApiFailure` |
| `frontend/src/styles.css` | Apresentação responsiva |
| `frontend/src/App.test.tsx` | Testes de interface com respostas HTTP simuladas, incluindo páginas seguintes de histórico e notificações |
| `frontend/src/health.ts` | Cliente legado de `/api/health`, preservado para testes de saúde |

O cliente consome `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`, `/api/dashboard`, `/api/tracked-products`, seus subrecursos `history`, `refresh` e `alert`, além de `/api/notifications`. Usa `credentials: 'same-origin'`; o proxy Vite ou Nginx encaminha `/api` ao FastAPI. Valores monetários chegam como strings e são formatados para apresentação; instantes são apresentados no fuso local do navegador.

## Estados e limites

Falhas de operação são mostradas em `role="alert"`. Com a integração Mercado Livre desligada, o backend ainda valida a URL, informa duplicação e retoma vínculos interrompidos; uma publicação que exige consulta externa retorna indisponibilidade. As páginas de histórico e notificações usam o cursor da API, mas a UI ainda não expõe filtros de data ou de notificações não lidas. Os testes de interface usam respostas simuladas; a paginação visual e a integração ponta a ponta com PostgreSQL ainda não foram verificadas nesta continuação. Consulte a [evidência da spec 0013](../../specs/0013-monitoramento-mercado-livre-brasil/verification.md).
