# Verificação da spec 0034

## Estado

Implementação local, QA e doc-sync concluídos; PR draft publicada para revisão.
Esta página separa preparação, testes simulados e verificações
reais. Nenhum critério está automaticamente comprovado por implementação ou por
aprovação do plano. Geração real requer chave/configuração e não foi executada.

## Preparação observada em 26/10/2026

- Issue195 aberta, branch/worktree correta e base `origin/develop` confirmadas.
  `git fetch origin` concluiu com permissão para gravar FETCH_HEAD; divergência
  `HEAD...origin/develop` era `0 0` antes de código.
- Spec e plano revisados independentemente; correções registradas em review-plan.md.
- `uv sync --locked --extra dev`: 37 dependências instaladas na worktree.
- `npm ci --no-audit --no-fund`: 395 pacotes instalados; tentativa inicial bloqueada
  por EPERM no sandbox, execução permitida concluiu. Aviso de depreciação do ESLint
  existente registrado; dependências não foram atualizadas nesta preparação.
- `node --test .github/scripts/*.test.cjs`: **50 passed, 0 failed, 0 skipped**.
- PostgreSQL17 exclusivo da worktree iniciado com o wrapper Compose; projeto
  `bestprice-feature-0034-issue-195-assistenc-3fae4d73`, porta local40720.
  `docker exec ... pg_isready -U bestprice -d bestprice_spec0034`: accepting connections.
  Nenhum container ou volume preexistente foi alterado.

## Backend e revisão independente em 27/10/2026

- [backend-evidence.md](backend-evidence.md): **46 testes focados passaram** no
  schema NUMERIC final, incluindo HTTP, transporte do provider simulado, RLS e
  PostgreSQL real. Suíte final: **239 passed, 2 skipped, 1 warning**, em 82,39 s;
  os skips POSIX no Windows não comprovam esses comportamentos.
- Ruff passou. Módulo novo: 64 blocos, média CC 2,34 (A), máximo B/10.
  A auditoria global encontrou dívida anterior fora do diff; a comparação com
  a base e o gate das mudanças estão discriminados no relatório do backend.
  Após incluir os arquivos novos no índice, a coordenação repetiu
  `complexity_report.py --changed origin/develop`: **136 blocos, média2,94(A),
  nenhum D+**, exit0. Esse recorte inclui testes: dois testes C (CC14 e11) e MI10,6
  no arquivo de testes HTTP. Código de produção novo mantém máximo B/10.
- [review-backend.md](review-backend.md): revisão aprovou RB01 e RB02 após
  corrigir concorrência do contexto e persistência dos preços em NUMERIC.
  A reprodução independente passou de contexto sem a mensagem concorrente para
  contexto incluindo o par concluído antes da reserva. O teste de regressão usa
  PostgreSQL e eventos, sem manter transação durante a geração externa.
- [review-frontend.md](review-frontend.md): primeira revisão encontrou privacidade
  de rascunho no histórico do browser, edição após falha de GET, formatação de preço
  e foco do menu. RF01–RF06 corrigidos e revalidados independentemente. Gates:
  **366/366** na suíte completa e **18/18** testes afetados após os últimos ajustes,
  lint/build finais aprovados (2658 módulos). Ver [frontend-evidence.md](frontend-evidence.md).

## Integração local observada em 27/10/2026

Ambiente: SPA Vite `127.0.0.1:33720`, FastAPI `127.0.0.1:26720`, PostgreSQL17
isolado na porta40720, banco sintético inicial `bestprice_ui0034` e rodada final
no novo `bestprice_ui0034_numeric`, migrado do zero até `20261026research`. Sessão/cookies,
cliente HTTP da SPA, endpoints, migrations e persistência são reais. Somente a
geração externa foi substituída na dependência `get_provider` do bootstrap de QA;
o adapter Google foi bloqueado para impedir rede externa. Isso não valida
disponibilidade, cotas ou qualidade do Gemini real. Nenhuma chave real foi usada.

Harness e artefatos locais (fora do Git):
`C:/Users/luvan/.codex/visualizations/2026/10/26/01a17919-9893-7493-81cb-696372adfa2d/`.

| Comando/caso | Resultado observado | Limite |
|---|---|---|
| `node qa-spec0034-journey.cjs` | **4/4 passaram**, repetidos no schema NUMERIC final: dois pares de conversa + recarga; comparação/análise/edição/invalidação/nova análise; cancelar e confirmar exclusão; troca de conta e acesso alheio negado | Resposta externa controlada; API e PostgreSQL reais |
| Limite durante a jornada | HTTP429 observado; `Retry-After: 51`; repetição explícita após espera concluiu a análise | Cota local, sem inferir cota Google |
| `node qa-spec0034-errors.cjs` | **6/6 passaram**, repetidos no schema NUMERIC final: categoria editável sem envio, espaços recusados; Tab/Escape no menu; falha de rede do histórico; falha de save preserva texto; falha de delete preserva registro; retry de chat reutiliza UUID | 503/rede injetados no browser; repetições usam API/banco reais |
| Preço parcial | Colagem `1.899,90` persistiu como `1899.90`; produto sem preço persistiu `null` | Não há consulta ao link nem preço de mercado |
| SQL direto no banco final | Coluna `price`: numeric, precisão18/escala2; `relrowsecurity=true` nas seis tabelas research | Consulta apenas de metadados do banco descartável |
| `curl.exe --include .../api/health`, parar/iniciar apenas o DB exclusivo | **200** `{status:ok,database:ok}` → **503** `{status:unavailable,database:unavailable}` → **200** após recuperação | Indisponibilidade real do DB local; outros projetos Docker preservados |

Primeira matriz visual encontrou contraste na landing e overflow de monitoramento
a768px; ambos corrigidos. Segunda matriz passou esses casos, mas encontrou alvo
de toque do link Entrar com40,86px (corrigido em seguida). Dois resultados desta
rodada eram problemas do harness: botão de dimensão zero durante HMR e título de
QA repetido com seletor estrito; o harness foi corrigido para ignorar elementos
sem caixa e criar título único. A matriz final passou **38/38**: 32 combinações
de oito destinos e quatro larguras, mais health/proxy, login/retorno, rascunho,
persistência/busca e ausência de erros JavaScript. Alvos visíveis de pelo menos
44×44px, sem overflow, sem violações axe nos grupos WCAG2A/AA,21A/AA e22AA.

A suíte visual ampla executou 132 cenários (snapshots novos de landing excluídos):
**129 passed, 3 failed**, em7,5min. Os três casos identificaram tracking herdado
da marca e ausência de espaço no texto visível em relação ao nome acessível.
Correções preservaram os tokens e nomes acessíveis; repetição dos **8 cenários
afetados passou 8/8** em53,9s. A matriz38/38 também foi repetida incluindo WCAG21A
depois dessas correções e passou. Não apresentar a primeira rodada132 como verde.
As oito imagens da landing, quatro larguras com emulação light/dark (produto de
tema claro fixo), foram inspecionadas e aprovadas explicitamente; atualização e
confirmação dos oito baselines concluíram. Comando `npm run test:visual --
public-pages.spec.ts -g 'landing pública' --workers=2`: **8/8 passed sem
--update-snapshots**, em3,9min, após a geração autorizada. Somente os oito PNGs da
landing mudaram; login/404 não foram regenerados. Parecer independente de QA leu
os resultados finais e aprovou a evidência local, mantendo os limites abaixo.

## Matriz de aceite

| Critérios | Evidência atual | Estado/limite |
|---|---|---|
| AC01–AC03 | Composição A, landing pública autenticada, login/retorno no browser; testes frontend | Revisão visual, gates e confirmação dos baselines aprovados |
| AC04–AC06 | Testes de sessão/rotas e aliases; login por deep link real | Suíte completa aprovada; destinos legados conferidos também no visual |
| AC07–AC09 | Rascunho sem URL, atalhos sem envio, validação de espaços, pesquisas persistidas e falha de listagem | Fluxos locais demonstrados; privacidade revalidada e aprovada |
| AC10–AC12 | Testes HTTP/PG de contexto, replay e concorrência; conversa de dois pares e recarga no browser | Contrato local demonstrado com provider controlado; modelo externo não validado |
| AC13–AC16 | Testes do adapter/limites/erros, retry com UUID, aviso de Google/free tier e90dias antes do envio, conteúdo como texto | Sem chamada real ao Google; qualidade factual do LLM não é garantida por esses testes |
| AC17–AC20 | Validação2–3produtos, NUMERIC/Decimal/null, versionamento e descarte de análise; jornada de edição/análise | Persistência NUMERIC aprovada no schema final; qualidade contextual/prós/contras do modelo real (AC19) pendente de avaliação operacional |
| AC21–AC23 | Busca/filtro/paginação no backend; busca/exclusão no browser; ownership todas operações HTTP/PG | Dados sintéticos; cancelar/falhar/repetir exclusão observado |
| AC24 | Troca de contas real nega conversa da outra; regressão nova para rascunho em entrada antiga do browser | Revisão independente aprovada; não exercitado em dispositivo físico |
| AC25 | Monitoramento e aliases, suíte anterior preservada, gate externo não ativado | Testes, UI e regressões dos destinos antigos passaram |
| AC26–AC27 | Axe, overflow e alvos44px nos4viewports; Tab/Escape real no Chrome | Matriz final38/38 passou após ajustes; sem leitor de tela/dispositivo físico |
| AC28–AC29 | Falhas de persistência/rede não viram sucesso; retries reais; ações futuras não simulam cadastro | Falhas específicas da UI injetadas; health503 com DB realmente parado |
| AC30 | Relatórios por papel, revisão, doc-sync, PR e limites acima | Handoff registrado; spec permanece `pronta` com AC10/15/19 abertos |

## Sincronização final de documentação

O agente doc-sync-onboarding concluiu a etapa final após código, gates e revisão,
sem alterar código. [Registro](doc-sync.md): README e guias afetados atualizados;
AGENTS.md e CLAUDE.md conferidos sem edição necessária, 131 destinos locais
verificados e cercas Markdown em pares. Não houve mudança de código posterior.
O hook de fim de arquivo removeu uma linha vazia de state.ts antes desta etapa;
a primeira rodada de hooks foi interrompida por essa correção de formato e
atualizações de relatórios simultâneas. A rodada final `pre-commit run` passou
com todos os papéis de edição encerrados: whitespace, EOF, YAML, conflitos,
arquivos grandes e chaves privadas. JSON não tinha arquivos aplicáveis.

## Publicação e handoff

Commit de implementação `5d84083`, com `Refs #195`, publicado sem bypass de hooks
e sem atribuição a ferramentas. [PR #196](https://github.com/SamiaLuvanice/bestprice/pull/196)
aberta em draft para develop, com `Closes #195`, spec, testes e limites.
Autoria humana existente preservada. A base foi reconferida antes da publicação:
`HEAD...origin/develop` era `0 0` antes do commit.

Os [checks remotos da PR](https://github.com/SamiaLuvanice/bestprice/pull/196/checks)
são a evidência autoritativa do CI para o head publicado. A primeira consulta
confirmou PR policy e Automation verdes, Backend/Frontend em execução; essa
observação não equivale ao resultado final do check obrigatório CI. Nenhuma
integração, aprovação própria, ativação externa ou release foi executada.

## Pendências operacionais

- CI obrigatório e revisão precedem eventual merge; worktree/branch preservadas
  para revisão. Não executar cleanup antes de integrar e resolver pendências.
- Validação operacional do modelo com configuração gratuita própria e avaliação
  da qualidade em português não foi executada. IA permanece desativada por padrão.
