# Módulo frontend

## Identidade visual atual — spec 0015

A entrada e a área autenticada usam a mesma logo oficial, copiada de
`designsystem/logo-bestprice.png` para `frontend/src/assets/logo-bestprice.png`.
O texto visual “BestPrice” ao lado da imagem fica oculto para leitores de tela;
a imagem fornece o nome acessível. `designsystem/index.html` orienta os tokens e
`designsystem/login.html`, a composição da entrada. As extensões aplicadas estão
registradas em [`designsystem/README.md`](../../designsystem/README.md).

`frontend/src/styles.css` define superfícies, texto, ações, estados semânticos e
foco nos temas claro e escuro. O tema acompanha `prefers-color-scheme` do sistema,
inclusive quando a preferência muda com a página aberta; a SPA não oferece seletor
nem grava uma preferência. A ação principal usa verde com texto preto; o rosa marca
links e destaques. Cabeçalho, menus e diálogos têm base sólida legível, com
`backdrop-filter` como melhoria progressiva. A tipografia usa fontes do sistema e
alternativas sans-serif, sem distribuir a fonte citada no protótipo. Os estados de
carga, erro, sucesso e foco seguem os mesmos fluxos funcionais descritos abaixo.
Em telas estreitas, a lista de produtos continua empilhada e sem rolagem horizontal.
O layout reduz movimento não essencial quando `prefers-reduced-motion` está ativo.

O catálogo contém dados demonstrativos; a SPA continua mostrando apenas dados da
API. A verificação visual da spec 0015 foi feita em Chromium nas larguras de 320,
768 e 1280 px, nos dois temas, com fixtures sintéticas e um smoke local com API e
PostgreSQL isolados. Os resultados e limites estão em
[`verification.md`](../../specs/0015-redesign-design-system-oficial/verification.md).

## Fluxo atual nesta branch

A SPA consome o contrato REST da spec 0013 sem alterá-lo; a área do usuário da spec 0012 é somente interface. `frontend/src/App.tsx` é o portão de sessão: consulta `GET /api/auth/me` ao abrir e decide entre a tela de entrada e a área autenticada (`AccountArea`). Somente 401 é tratado como ausência de sessão e apresenta o formulário de entrada; se `/auth/me` falhar por indisponibilidade da API ou da rede, a tela mostra a mensagem de erro e o botão “Tentar novamente”, sem enviar a pessoa ao login. Sem sessão, o hero com o campo de link continua visível e pede que a pessoa entre para monitorar. A conta precisa ser provisionada no backend antes do login. Não há cadastro público nem roteamento client-side.

Com sessão, a área é uma página única com cabeçalho (marca, navegação Início/Produtos/Alertas por âncora com foco no título da seção, sino de notificações e menu da conta com o e-mail e “Sair”) e, em ordem: hero com o campo de link, indicadores do resumo, “Boas oportunidades”, tabela “Seus produtos”, “Atualizações recentes” e a seção “Alertas”. Sem produtos monitorados, o hero ganha destaque com um estado vazio e as seções de produtos ficam ocultas. Cadastrar distingue 201 (“Produto adicionado ao monitoramento.”) de 200 (“Você voltou a monitorar este produto.”) e insere o produto no topo da lista. Cada linha de “Seus produtos” traz preço atual, variação, menor preço, disponibilidade e horário do preço observado; a linha secundária mostra anterior, maior, última consulta, última alteração, alerta ativo e avisos. O menu da linha oferece “Atualizar agora”, “Ver anúncio no Mercado Livre” (nova aba) e “Parar de monitorar”. O detalhe, aberto por “Ver detalhes”, por uma oportunidade ou por “Ver produto” num evento da linha do tempo cujo produto ainda não foi carregado, mantém histórico paginado, instantes, alerta (criar, editar, pausar, excluir) e “Atualizar agora”. Os botões “Carregar mais”, “Carregar mais preços” e “Carregar mais notificações” usam `next_cursor` e acrescentam itens sem repetir IDs; o foco vai ao primeiro item novo ou, sem item novo, ao título da seção.

| Arquivo | Responsabilidade |
|---|---|
| `frontend/src/App.tsx` | Portão de sessão: carregando, indisponível, entrada ou área autenticada; recebe o relógio injetável (`clock`) |
| `frontend/src/dashboard/AccountArea.tsx` | Orquestra estado e ações da área; os componentes de apresentação não chamam `fetch` |
| `frontend/src/dashboard/AppHeader.tsx`, `AccountMenu.tsx` | Cabeçalho, navegação de página única e menu da conta |
| `frontend/src/dashboard/NotificationBell.tsx`, `useNotifications.ts` | Sino com contador e painel das não lidas; páginas da seção Alertas; marcar como lida |
| `frontend/src/dashboard/HeroTrackForm.tsx` | Campo de link (sem validação nativa de URL; a orientação vem da API), sucesso, erro e “Ver produto” no 409 `already_tracked` |
| `frontend/src/dashboard/SummaryIndicators.tsx`, `OpportunityList.tsx` | Indicadores do resumo e cards de oportunidades na ordem da API |
| `frontend/src/dashboard/TrackedProductsTable.tsx`, `TrackedProductRow.tsx`, `RowActionsMenu.tsx` | Tabela “Seus produtos” (empilhada por CSS em telas estreitas), linha e menu de ações |
| `frontend/src/dashboard/ConfirmStopDialog.tsx`, `StopTrackingConfirm.tsx` | Confirmação de “Parar de monitorar” pela linha e conteúdo compartilhado com o detalhe |
| `frontend/src/dashboard/ProductDetailDialog.tsx` | Diálogo de detalhe, histórico, alerta e confirmação embutida |
| `frontend/src/dashboard/RecentUpdatesTimeline.tsx`, `AlertsSection.tsx` | Linha do tempo de `recent_updates` e seção Alertas com estado de leitura |
| `frontend/src/dashboard/trackedList.ts`, `useDashboard.ts` | Reducer da lista “Seus produtos” e carga do painel com descarte de respostas antigas |
| `frontend/src/dashboard/RelativeTime.tsx`, `Skeletons.tsx` | Tempo relativo e esqueletos do carregamento inicial |
| `frontend/src/dashboard/ExternalListingLink.tsx`, `ProductImage.tsx`, `labels.ts`, `Icons.tsx` | Link do anúncio, imagem ou marcador neutro, rótulos de estados da API e ícones |
| `frontend/src/lib/decimal.ts` | Validação e comparação de decimais como texto, sem converter para `number` |
| `frontend/src/lib/format.ts` | Dinheiro (BRL), percentual com direção, tempo relativo e instante absoluto via `Intl` |
| `frontend/src/lib/focus.ts` | `useModalFocus` (foco preso em diálogo) e `useDisclosure` (sino, conta e menu da linha) |
| `frontend/src/lib/url.ts` | `safeHttpsUrl`: só `https` vira `href`/`src` (bloqueia `javascript:`, `data:` e `http:`) |
| `frontend/src/api.ts` | Cliente HTTP relativo a `/api`, cookie da sessão, validação das respostas (dinheiro e percentuais como strings decimais) e erros `ApiFailure` com `status`, `code`, `trackedProductId` e `retryAfterSeconds` |
| `frontend/src/styles.css` | Tokens da identidade BestPrice, temas por preferência do sistema e apresentação responsiva |
| `frontend/src/assets/logo-bestprice.png` | Cópia da logo oficial usada na entrada e no cabeçalho autenticado |
| `frontend/src/health.ts` | Cliente legado de `/api/health`, preservado para testes de saúde |

O cliente consome `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`, `/api/dashboard`, `/api/tracked-products`, seus subrecursos `history`, `refresh` e `alert`, além de `/api/notifications` (todas e `unread_only`). Usa `credentials: 'same-origin'`; o proxy Vite ou Nginx encaminha `/api` ao FastAPI. Valores monetários chegam como strings decimais: `Intl.NumberFormat` os formata sem conversão para `number`, e a direção de um evento de preço vem de `compareDecimal`. Resposta fora do contrato vira “A API respondeu com dados inválidos.”; erro sem `code` e `message` vira a mensagem genérica, e falha de rede, “Não foi possível conectar ao BestPrice. Tente novamente.”.

## Notificações e contador

O contrato não tem contagem de não lidas. O sino faz uma única consulta `GET /api/notifications?unread_only=true&limit=100` e deriva o contador da página: até 99 mostra o número; mais de 99 itens ou `next_cursor` presente mostram “99+”; falha não mostra número e o nome acessível passa a “Notificações indisponíveis”. O painel lista as cinco não lidas mais recentes com “Marcar como lida” e “Ver todas as notificações”, que leva à seção Alertas. A seção Alertas pagina `GET /api/notifications` e mostra “Lida”/“Não lida”. O contador é sempre recalculado pela API depois de marcar como lida, de ações de alerta, de “Atualizar agora” e da saída de um produto da lista; nunca é decrementado localmente.

## Parar de monitorar

“Parar de monitorar” sempre pede confirmação. Pela linha, abre um `alertdialog` modal com foco em “Cancelar”; no detalhe, o mesmo conteúdo substitui o do diálogo aberto, sem empilhar outro. O texto diz que o histórico é mantido e, com alerta ativo, que o alerta será pausado. Cancelar, Esc ou clique fora não enviam requisição e devolvem o foco ao menu da linha ou a “Parar de monitorar” no detalhe. Confirmar envia `DELETE /api/tracked-products/{id}`; no sucesso, o produto segue a convenção de produto removido com a mensagem “Você parou de monitorar este produto.”. Outra falha mantém o produto e mostra a mensagem na própria linha (ou no detalhe).

## Produto removido

Um vínculo deixa de existir para a pessoa quando uma ação recebe 404, 409 `tracking_inactive` ou um detalhe recarregado com `active=false` (por exemplo, parado em outra aba). Nesses casos a linha sai da lista, o detalhe daquele produto fecha, indicadores e contador do sino são recalculados e a mensagem aparece na região de status de “Seus produtos”, com foco no título da seção. Se a lista ficar vazia, a mensagem vai para a região de status global e o foco vai ao campo de link. Exceção: 404 em `/alert` significa alerta não encontrado; o detalhe é recarregado e só fecha se o vínculo também tiver deixado de existir.

## Tempo relativo

`RelativeTime` mostra “Agora” (menos de 1 min), “Há N min”, “Há N h” (menos de 24 h), “Ontem, HH:mm” (dia civil anterior no fuso do navegador) ou “dd/mm/aaaa, HH:mm”. A referência é o instante em que a resposta que trouxe o dado chegou, obtido do relógio injetável; o texto não muda sozinho depois. O instante completo, com segundos, fica no `title` e em texto oculto para leitores de tela; o `<time>` não é parada de Tab. O detalhe mantém os instantes absolutos herdados da 0013.

## Estados e limites

Falhas de operação são mostradas em `role="alert"` com a mensagem específica devolvida pela API. Apenas 401 encerra a sessão local e volta ao login com a mensagem da API; 503 da integração, outros erros e falhas de rede mantêm a pessoa no painel. Quando a resposta traz `retry_after_seconds` (por exemplo, 429), a mensagem acrescenta o prazo em segundos ou minutos; na linha, 429 mantém os dados e outras falhas de “Atualizar agora” recarregam a linha para exibir a tentativa registrada pelo backend. No carregamento inicial, esqueletos ocultos de tecnologias assistivas ocupam as regiões e um único status anuncia “Carregando seu painel…”. Painel e notificações falham por região, com “Tentar novamente”; depois da primeira carga, uma falha de recarga mantém os dados exibidos. Recargas do painel atualizam só os itens já exibidos, sem descartar páginas carregadas, e respostas fora de ordem são descartadas.

Diálogos (detalhe e confirmação) prendem o foco com Tab e Shift+Tab, fecham com Esc ou clique no fundo e devolvem o foco a quem os abriu ou, se ele saiu da página, ao título “Seus produtos” (ou ao campo de link). Uma recarga atrasada não reabre nem fecha um detalhe que a pessoa já fechou ou trocou. Sino, conta e menu da linha seguem o padrão disclosure, sem navegação por setas: Esc fecha e devolve o foco ao botão; foco ou clique fora fecham.

O card e o detalhe mostram “Preço indisponível” sem preço atual e “Desconhecido”/“Desconhecida” para valores ainda sem dado, em vez de zero. A nota do hero informa que os preços vêm das consultas do BestPrice ao Mercado Livre e podem diferir do checkout; não afirma integração oficial autorizada. Imagens e links do anúncio só são usados com `https`.

Com a integração Mercado Livre desligada, o backend ainda valida a URL, informa duplicação e retoma vínculos interrompidos; uma publicação que exige consulta externa retorna indisponibilidade. A UI ainda não expõe filtros de data no histórico. Limites registrados na [evidência da spec 0012](../../specs/0012-area-usuario-monitoramento/verification.md): “Atualizar agora” com sucesso depende de credencial real; `formatMoney` usa `signDisplay: 'negative'`, que lança `RangeError` em navegadores antigos (Chrome < 106, Firefox < 116, Safari < 15.4).

## Testes e verificação

Em `frontend/`: `npm ci`, `npm run lint`, `npm test -- --run` e `npm run build`. Vitest roda em jsdom com `TZ=America/Sao_Paulo` fixo, `testTimeout` de 15 s e `asyncUtilTimeout` de 3 s (`vite.config.ts` e `src/test-setup.ts`); as interações usam `@testing-library/user-event`. Os testes ficam ao lado do código (`src/**/*.test.ts(x)`). `src/test/fakeApi.ts` substitui `fetch` por um roteador com fixtures no formato exato do contrato; rota não prevista é registrada e o `afterEach` global de `src/test-setup.ts` reprova o teste. `src/test/productsHarness.tsx` renderiza a `App` com relógio fixo e consulta linhas da tabela. `src/content.test.tsx` impede citações a Amazon, prime, estrelas/avaliações e preços fixos no código da interface; dados de exemplo existem apenas nos testes.

A inspeção em navegador (Playwright + axe, WCAG 2.1 AA, larguras de 320 a 1280 px, sobre Compose isolado com fixtures sintéticas) é manual e roda fora do repositório: não há scripts nem dependências dela no código, e ela não faz parte do CI. Só Chromium foi inspecionado, sem leitor de tela nem dispositivo real; método e resultados estão na [evidência da spec 0012](../../specs/0012-area-usuario-monitoramento/verification.md).
