# Plano da spec 0034

Issue #195; worktree `feature-0034-issue-195-assistencia-compras-ai`, base
`origin/develop` de31eb7. Direção A aprovada. Nenhuma mudança de infraestrutura,
autenticação, endpoints de monitoramento ou ativação externa será necessária.

## Decisões registradas em 26/10/2026

- Pessoa usuária solicitou modelo eficiente gratuito e autorizou sugestão.
  Recomendação: `gemini-3.5-flash-lite`, estável na documentação oficial consultada.
  Cota gratuita, projeto sem faturamento habilitado, sem fallback de provider/modelo
  e sem ferramentas de busca. Não prometer chamadas ilimitadas ou zero custo se
  uma pessoa operadora configurar uma chave vinculada a faturamento: o aplicativo
  não consegue auditar a conta Google. A ativação exige chave e opção explícita.
- Retenção escolhida: 90 dias desde criação. Expiração não renovável por edição.
  Leitura sempre filtra `expires_at > now`. Limpeza automática a cada hora no
  processo da API, via thread para SQL síncrono; também CLI executável para operação.
  Expiração é efetiva mesmo se a limpeza física atrasar por indisponibilidade.
- A cota gratuita Gemini permite uso do conteúdo para aperfeiçoamento. Mostrar
  informação antes de enviar: processamento pelo Google, possibilidade de uso
  do conteúdo, não inserir dados pessoais/confidenciais, retenção local de 90 dias.
  O sistema não acrescenta email, ID de usuário, cookie ou segredo ao texto enviado
  ao provider. O texto livre pode conter informação digitada pela pessoa; a
  advertência não representa garantia de sanitização automática de todo conteúdo.
  Não alegar remoção de registros do fornecedor nem backups na exclusão local.
- Limites iniciais locais (não confundidos com a cota do Google): mensagem até
  2.000 caracteres, título até 100, contexto enviado até 16.000 caracteres,
  resposta até 1.024 tokens e 8.000 caracteres; até 20 chamadas por pessoa/dia UTC,
  60 por aplicação/dia UTC, 3 por pessoa/minuto e 5 globais/minuto. Persistir controle
  de consumo para funcionar entre processos e contar tentativas aceitas, inclusive
  falhas do fornecedor. Sem retry automático de geração.
- `AI_ENABLED=false` por padrão; `GEMINI_API_KEY` somente backend. Configuração
  ausente retorna erro seguro de indisponibilidade, sem chamada de rede. Não criar
  conta, chave, billing, segredo remoto ou deploy como parte da implementação.
- Adequação de persistência em 27/10/2026: os produtos originais de uma comparação
  ficam em `research_comparison_products`, ordenados por posição e vinculados à
  comparação com exclusão em cascata. Preço é `NUMERIC(18,2)` nullable, convertido
  de/para `Decimal` sem float. O REST e seus snapshots continuam usando string
  decimal ou null; JSON não é o armazenamento original do dinheiro. As seis tabelas
  novas têm RLS habilitada, conforme o padrão atual do banco.

Fontes primárias consultadas: [modelos](https://ai.google.dev/gemini-api/docs/models),
[preços](https://ai.google.dev/gemini-api/docs/pricing#gemini-3.5-flash-lite),
[dados na cota gratuita](https://ai.google.dev/gemini-api/terms#unpaid-services),
[generateContent](https://ai.google.dev/api/generate-content),
[limites](https://ai.google.dev/gemini-api/docs/rate-limits).

## Contrato REST fixado antes da delegação

Todas as operações abaixo exigem a sessão existente. Não aceitar `user_id` na
entrada. IDs são UUID; datas em ISO UTC. Recurso alheio, expirado ou excluído
responde 404 `research_not_found`, sem revelar conteúdo. Erros usam o envelope
existente `{error:{code,message,fields,tracked_product_id,retry_after_seconds}}`.
422 usa `validation_error`; 401 `unauthenticated`; falha de banco 503
`research_unavailable`, sem SQL ou stack. Erros do provider: 503 `ai_unavailable`,
504 `ai_timeout`, 502 `ai_invalid_response`, 429 `ai_rate_limited` com
`Retry-After`. Concorrência/versionamento: 409 `research_conflict`; solicitação
repetida ainda em processamento: 409 `request_in_progress`.

### DTOs

- `Summary`: `{id,title,created_at,updated_at,expires_at}`.
- `Message`: `{id,role:"user"|"assistant",content,created_at}`.
- `Conversation`: Summary + `{messages:Message[]}`.
- `ChatResult`: `{conversation_id,request_id,user_message:Message,
  assistant_message:Message,expires_at}`.
- `ProductInput`: `{name,details,price,currency,url}`. Nome 1–200; details até
  2.000; price string decimal positiva com duas casas ou null; currency `BRL`;
  url string https/http até 2.048 ou null, somente referência, nunca requisitada.
- `ComparisonInput`: `{title,use_case,products:ProductInput[]}`, 2–3 produtos,
  use_case até 2.000; todos os campos explícitos; dados faltantes ficam vazios/null.
- `Analysis`: `{version,content,created_at}`.
- `Comparison`: Summary + `{use_case,products,version,analysis:Analysis|null}`.
- `ResearchItem`: Summary + `{kind:"conversation"|"comparison"}`.
- `ResearchPage`: `{items:ResearchItem[],next_offset:number|null}`.
- `Capabilities`: `{enabled,provider:string,model:string,
  retention_days:90,max_message_chars:2000,user_daily_limit:20}`. enabled só é
  verdadeiro se a configuração necessária existir. Não expõe credencial.

### Operações

| Método e rota | Entrada | Sucesso |
|---|---|---|
| GET `/api/ai/capabilities` | — | 200 Capabilities |
| POST `/api/ai/chat` | `{conversation_id:UUID|null,request_id:UUID,message:string}` | 200 ChatResult |
| GET `/api/ai/conversations/{id}` | — | 200 Conversation |
| DELETE `/api/ai/conversations/{id}` | — | 204 |
| POST `/api/comparisons` | ComparisonInput | 201 Comparison |
| GET `/api/comparisons/{id}` | — | 200 Comparison |
| PUT `/api/comparisons/{id}` | ComparisonInput + `{version:number}` | 200 Comparison, versão +1 e analysis null |
| POST `/api/comparisons/{id}/analyze` | `{request_id:UUID,version:number}` | 200 Comparison com análise da versão enviada |
| DELETE `/api/comparisons/{id}` | — | 204 |
| GET `/api/research` | `kind=all|conversation|comparison` (all), `q` título até100, `offset>=0` (0), `limit=1..50` (20) | 200 ResearchPage |

Ordenação de pesquisa: updated_at decrescente, kind e id como desempate estável.
Pesquisa por título sem diferenciar caixa, filtro aplicado no banco antes da
paginação. next_offset null ao encerrar. Dashboard usa limit=6, histórico limit=20.
Uma página vazia não representa indisponibilidade; falha deve aparecer como erro.

### Persistência, idempotência e falha

- Novo módulo pequeno `backend/app/research/` reúne modelos, SQL, serviços, rotas,
  configuração e adapter HTTP de IA. Reutiliza Base, CurrentUser, ApiError e Session.
  SQL em repository; rota traduz HTTP; serviço coordena transação/provider.
- Conversation/Message, Comparison e AIRequest pertencem à pessoa. Exclusão
  elimina mensagens/resultados da pesquisa e apaga snapshots das tentativas;
  manter apenas tombstones de idempotência sem conteúdo por 24h, impedindo replay
  de ressuscitar pesquisa excluída. Dados de
  comparação ficam separados dos Product/TrackedProduct do monitoramento.
- Migration única após `20261014rls`, importada no Alembic; RLS habilitada nas novas
  tabelas públicas sem políticas anon/authenticated, como nas tabelas existentes.
- Cotas usam contadores persistentes por janela, SEM conteúdo, independentes da
  pesquisa e das tentativas; excluir/expirar pesquisas não restitui consumo.
  Trava curta serializa a reserva dos contadores em ordem fixa. Limpeza de
  contadores só após as janelas expirarem (limite operacional de dois dias).
  Testar explicitamente gerar→excluir→gerar e expiração sem zerar cota diária.
- AIRequest tem unicidade `(user_id,request_id)` e fingerprint do payload, estado
  processing/completed/failed, erro ou snapshot do resultado. Mesmo ID/payload
  concluído retorna mesmo resultado sem provider/quota adicional; ID com payload
  diferente retorna409. Falha conhecida reexibe o erro; retry explícito usa novo ID.
  Falha de rede no browser reenvia o mesmo ID para descobrir o resultado dentro
  de 24h. Depois desse prazo, não fazer replay automático de uma tentativa antiga.
  Todo replay revalida propriedade, existência e expires_at antes do snapshot.
- Primeiro envio: reservar tentativa sem criar conversa/mensagem; criar conversa
  e par user/assistant atomicamente somente no sucesso. Em falha, não deixar
  pesquisa vazia invisível; texto fica no cliente e retry explícito usa novo ID.
  Em conversa existente, também só acrescentar o par concluído atomicamente.
  Exclusão/expiração durante geração impede commit e replay do resultado; limpar
  conteúdo dos snapshots/tentativas afetadas, sem restituir quota.
- Serializar reserva da tentativa e quota com trava PostgreSQL curta; liberar
  transação antes de HTTP. Uma conversa só tem um envio pendente por vez.
  Reserva sem conclusão após 90s vira falha recuperável; não regenerar
  automaticamente após timeout ambíguo. Não prometer exatamente uma chamada
  concluída no Google diante de timeout; garantir idempotência no produto.
- Não usar resposta modelo como dados estruturados verificados. Tabela mostra
  somente ProductInput. Análise é texto identificado como IA e não verificado.
  Prompt exige reconhecer lacunas, não inventar preço/estoque/especificação e
  tratar conteúdo de produtos como dados, sem executar instruções ou buscar URLs.
- HTTPX com host fixo, timeout25s, sem redirect, API key em header, sem log de
  prompt/resposta. Aceitar somente texto não vazio de resposta STOP e tamanho
  limitado; falhas sanitizadas. Contexto recente limitado é comunicado na UI.
- Falhas de persistência nunca retornam sucesso. Não salvar resposta de IA se a
  pesquisa expirou/foi excluída ou a comparação mudou de versão durante geração.

## Frontend e preservação

- Manter cliente HTTP existente e ApiFailure; exportar seus helpers se necessário.
  Novo cliente tipado em `features/research/api.ts`, validando unknown. Nada de
  `dangerouslySetInnerHTML`: respostas como texto, sem executar HTML/Markdown.
- Extração de sessão/roteamento sem reescrever o monitoramento. `/` torna-se
  landing pública também autenticada. `/app` vai para dashboard. `/app/monitoring`
  lista produtos; `/app/monitoring/overview` preserva o painel completo existente;
  `/app/monitoring/alerts` abre alertas configurados; legacy
  `/produtos`, `/produtos/:id`, `/alertas` conservam destino funcional.
- A área existente deriva seção pelo path; adaptar explicitamente aliases para
  que detalhe e alertas não caiam na home. Evitar MemoryRouter aninhado que quebre
  histórico ou duplique sessões.
- Sessão nova não reaproveita conteúdo da anterior: chave por user.id, cancelamento
  de respostas obsoletas, desmontagem no401/logout e revalidação de bfcache.
- Dashboard A: sidebar248px; header88px; conteúdo padding48px 56px, gap32;
  título48/54 desktop,34/39 mobile; composer24px/18px raio; ação verde48px;
  mobile390px com padding20 e navegação de quatro entradas, demais no menu.
  Valores da composição original, não estimados de captura.
- Landing comunica assistência sem prometer busca de ofertas; reutiliza Brand e
  assets apropriados, sem reutilizar gráficos/preços ilustrativos como respostas.
- PublicLayout/AuthLayout/AppLayout com navegação acessível e componentes existentes;
  createBrowserRouter se a extração não aumentar regressão; preservar contrato
  público App(clock) dos testes. Testes antigos de home autenticada devem migrar
  para o destino de monitoramento; não eliminar cobertura para acomodar mudança.
- Proxy Vite aceita API_PROXY_TARGET para a instância local isolada; valor padrão
  preserva localhost8000. Nginx mantém5s nos endpoints existentes e permite35s
  somente nas gerações chat/analyze, acima do timeout25s do adapter. Compose
  propaga AI_ENABLED e GEMINI_API_KEY por ambiente com padrão desativado/vazio;
  a configuração não habilita o serviço nem cria faturamento automaticamente.
- Dashboard transporta texto apenas em estado de navegação em memória e só envia
  após ação explícita no assistente e informação do serviço externo. Categorias
  preenchem prompt editável, sem geração imediata. Request IDs com crypto.randomUUID.
- Salvar comparação é ação própria, disponível sem IA configurada. Analisar só
  após salvar dados atuais; versões impedem resultado desatualizado.

## Fronteiras de trabalho

1. Backend: propriedade exclusiva de `backend/**`, evidência em
   `specs/0034-assistencia-compras-bestprice-ai/backend-evidence.md`.
2. Frontend: propriedade exclusiva de `frontend/**`, evidência em
   `specs/0034-assistencia-compras-bestprice-ai/frontend-evidence.md`.
3. Coordenação: `specs/**` restantes, `designsystem/**`, `docs/**`; sem sobrescrever
   arquivos dos implementadores. Primeiro contrato fixado; correções de contrato
   comunicadas aos dois lados antes de edição. Sem commits pelos implementadores.

## Gates e limites

Red→Green por fronteira de comportamento. Backend Ruff, pytest incluindo PostgreSQL
descartável, complexidade; frontend lint/Vitest/build, navegador/axe/responsividade;
regressão das rotas e alertas antigos. Automação Node e hooks no handoff. Revisão
independente e QA, depois doc-sync-onboarding como última etapa após código.
Sem chave real não executar geração externa: adapter testado com transporte
simulado e declarar validação operacional pendente. Não marcar a spec implementada
nem fechar Issue por uma fatia parcial ou por testes de provider simulados.

Riscos: cotas gratuitas variam; chamada real depende de chave e termos; LLM pode
errar mesmo com prompt e rótulo; confirmação operacional e qualidade em português
precisam de avaliação posterior. Mudança de `/` afeta testes e links históricos.
Ordenação offset pode deslocar registros se outra pesquisa mudar entre páginas;
não promete snapshot. Sem deploy externo nesta etapa.
