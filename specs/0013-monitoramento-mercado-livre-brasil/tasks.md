# Tarefas verificáveis — 0013

| ID | Tarefa | Prova de conclusão |
|---|---|---|
| T01 | Fixar contrato interno, contexto de preço e plano | `plan.md` e `tasks.md` alinhados à spec, sem presumir acesso externo |
| T02 | Parser MLB puro | Testes Red/Green da matriz de URLs, sem requisição à entrada |
| T03 | Cliente oficial com credenciais no backend | Testes HTTPX para item/preço, 401/403, 404, 429, timeout e preço ausente; nenhuma chamada arbitrária |
| T04 | Autenticação BestPrice necessária ao isolamento | Testes HTTP de sessão e acesso por pessoa; sem identidade implícita |
| T05 | Migration e entidades | Upgrade em PostgreSQL isolado e inspeção de constraints, dinheiro e timestamps |
| T06 | Cadastro e reuso transacional | Testes HTTP e PostgreSQL para novo, duplicado, retomada, dois usuários e concorrência |
| T07 | Histórico, estados e métricas | Testes com relógio fixo para primeiro preço, preço igual, mudança, ausência, not_found e recuperação |
| T08 | Alertas e notificações | Testes de alvo, disparo, deduplicação, pausa, retomada, exclusão, leitura e autorização |
| T09 | Worker periódico | Testes de vencimento, trava compartilhada, 429, backoff e recuperação após reinício |
| T10 | Dashboard e detalhe React | Testes da UI para formulário, lista, histórico, estados e alertas; API tipada validada |
| T11 | Infraestrutura e configuração | Compose e `.env.example` coerentes com o fluxo implementado; sem segredos reais |
| T12 | Validar integração real autorizada | Evidência separada com credenciais da aplicação, anúncio de terceiro, contexto e limites, sem registrar token; ou bloquear operação conforme AC-014 |
| T13 | Gates e fluxo ponta a ponta | Ruff, pytest positivo, frontend lint/test/build, migration e UI/API/PostgreSQL reais registrados |
| T14 | Revisão e documentação final | Revisão independente/diff, doc-sync-onboarding após código, docs sincronizados e PR quando GitHub permitir |

Marcar tarefas completas somente após evidência em `verification.md`. A ausência de credenciais ou Issue não impede T01–T03, T05 e demais partes independentes; impede T12 e liberação do fluxo real.

## Estado em 08/10/2026

- T01 e T02 concluídas documentalmente e por testes do parser.
- T03 iniciada: cliente e erros básicos cobertos por respostas simuladas; OAuth
  durável e validação real ainda pendentes.
- T04–T10 parcialmente iniciadas conforme `verification.md`; nenhum desses itens
  está concluído em toda a extensão exigida pela spec.
- T11–T14 pendentes. `T12` depende de credenciais e permissão reais da aplicação.

## Continuação em 08/10/2026

- T08 avançou com teste HTTP de alertas/notificações e indicadores do dashboard;
  falta cobrir concorrência real PostgreSQL e todos os estados da spec.
- T09 avançou com worker em processo separado e teste de vencimento/429/reuso;
  falta exercitar workers simultâneos e operação Compose ponta a ponta.
- T10 avançou com dashboard React, detalhe, histórico, alerta e notificações
  conectados ao backend; três testes de interface, lint e build passaram. Ainda
  faltam fluxos de paginação de histórico/notificações, mais estados de erro e
  verificação visual ponta a ponta.
- T11 avançou com worker, migrations na imagem e variáveis de ambiente; falta
  validar build/execução completa e OAuth durável. T12–T14 seguem pendentes.

## Continuação em 09/10/2026

- T09: teste de duas sessões PostgreSQL concorrentes passou e confirmou uma
  única atualização; ainda faltam cadência/concorrência configuráveis, jitter
  e prova com processos worker distintos.
- T11: imagem e stack Compose isolada construídas e iniciadas; migration,
  health, proxy e worker bloqueado sem autorização foram conferidos.
- T13: gates locais completos passaram com PostgreSQL real (34 testes backend,
  4 frontend), e o fluxo HTTP pelo proxy confirmou login, dashboard e bloqueio
  seguro do cadastro. Inspeção visual e integração real seguem pendentes.

## Continuação OAuth em 09/10/2026

- T03: tokens da conta operadora agora têm armazenamento cifrado, refresh
  serializado em PostgreSQL, respeito a 429 e bloqueio após resposta ambígua.
  Testes com dublê HTTP e duas sessões PostgreSQL passaram. A autorização
  inicial, a validação externa e a operação com tokens reais permanecem abertas.
- T11: Compose recebe Client ID, Client Secret e chave de cifragem apenas pelo
  ambiente; duas migrations OAuth foram aplicadas na stack isolada.

## Ordem local antes da fonte — 09/10/2026

- T06 e T07: cadastro e refresh agora concluem validação, duplicação,
  retomada e cooldown antes de obter credenciais da fonte. Testes HTTP e
  verificação pelo proxy passaram com a integração desligada. Tarefas
  permanecem abertas até cobrir os demais estados e critérios da spec.
- T09: teste concorrente foi ajustado para selecionar apenas seu anúncio em
  banco de verificação reutilizado; a suíte PostgreSQL voltou a passar.

## Cadência e concorrência configuráveis — 09/10/2026

- T09: `MONITOR_CHECK_INTERVAL_SECONDS`, `MONITOR_FRESHNESS_SECONDS`,
  `MONITOR_BATCH_LIMIT`, `MONITOR_MAX_CONCURRENCY` e
  `MONITOR_POLL_INTERVAL_SECONDS` agora têm limites validados e são repassados
  pelo Compose. O worker processa anúncios independentes em sessões separadas,
  até o limite de concorrência; falhas transitórias usam backoff com jitter.
  Testes de cadência, stale, relógio controlado e duas consultas simultâneas
  no PostgreSQL passaram. Ainda falta prova com processos worker distintos,
  integração externa autorizada e escolha operacional de limites reais.

## Alerta e janela de atualidade — 09/10/2026

- T08: alerta passou a usar a mesma janela configurável de `stale` para
  decidir condição e disparo. Teste HTTP reproduziu notificação indevida com
  preço de 11 minutos e janela de 10 minutos, e confirmou disparo após nova
  observação válida. Outros cenários de AC-010 e AC-021 ainda exigem auditoria.

## Métricas e desempate — 09/10/2026

- T07: o dashboard agora ordena oportunidades por maior queda percentual,
  mudança mais recente e ID estável. Teste com relógio fixo começou vermelho
  quando a ordem dos vínculos contrariava a ordem dos eventos. Outro teste
  confirmou `100.00 → 80.00 → 90.00` e extremos globais com histórico paginado.
  Restam os demais estados e filtros pessoais de AC-020.

## Estados persistidos e fronteira OAuth — 09/10/2026

- T07/T09: teste com relógio fixo cobre preço inicialmente ausente, primeira
  observação, preço igual, mudança, ausência posterior, falha, `not_found` e
  recuperação. `integration_unavailable` persiste como `temporary_error`;
  enquanto `lookup_status=not_found`, uma falha posterior mantém pelo menos
  24 horas até a próxima tentativa. A revisão integral de AC-017 a AC-019
  e o comportamento com a fonte real continuam pendentes.
- T03/T07: falha ao obter credenciais da conta operadora no cliente diferido
  agora passa pela regra de tentativa, preservando o último preço; teste HTTP
  cobre `auth_required` e 429 com `Retry-After`.

## Disparo e edição concorrentes de alerta — 09/10/2026

- T08: avaliação do mesmo alerta por duas sessões PostgreSQL agora trava e
  recarrega a linha antes de decidir notificação; duas edições simultâneas
  obtêm revisões sequenciais. Testes começaram vermelhos por violação de
  unicidade e perda de revisão, respectivamente, e passaram duas vezes após
  o ajuste. Ainda faltam as demais corridas de AC-021 e processos distintos.

## Interrupção concorrente com edição de alerta — 09/10/2026

- T08: teste PostgreSQL começou vermelho com vínculo inativo e alerta ainda
  habilitado após interrupção concorrente com a edição. Criação, edição,
  exclusão e interrupção agora travam o vínculo antes da decisão local.
  As três regressões de concorrência passaram duas vezes; resta conferir
  outras ordens de corrida e processos distintos.

## Ordens inversas e cadastro simultâneo — 09/10/2026

- T08: o teste PostgreSQL agora cobre também a interrupção que obtém a trava
  antes da edição: a tentativa de habilitar recebe `tracking_inactive`.
  Cadastro simultâneo do mesmo alerta produz um registro/notificação e
  `alert_already_exists` para a segunda tentativa. As quatro regressões
  concorrentes passaram duas vezes. Ainda faltam outras transições de AC-021,
  fluxo HTTP concorrente e processos distintos.

## Estados de consulta na interface — 09/10/2026

- T10: o contrato tipado React passou a validar os campos de contexto,
  disponibilidade confirmada, diferença absoluta e instantes de sucesso e
  mudança já retornados pela API. O cartão distingue preço nunca observado de
  último preço conhecido desatualizado; cartão e detalhe expõem falha da última
  tentativa. O detalhe mostra tentativa, leitura válida, observação e mudança
  separadas, além de preço anterior, diferença e variação. O teste novo começou
  vermelho no estado stale e passou após a correção; 5 testes de UI, lint e
  build passaram. T10 segue aberta para os demais estados e inspeção visual.
