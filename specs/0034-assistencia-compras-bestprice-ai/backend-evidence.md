# Evidência backend da spec 0034

Atualizado em 27/10/2026. Worktree `feature/0034-issue-195-assistencia-compras-ai`,
Issue #195. Este registro cobre somente backend e testes; não substitui QA de
interface, integração operacional com Gemini ou revisão independente.

## Implementação

- `backend/app/research/`: DTOs validados, persistência por proprietário,
  conversas/mensagens, comparações versionadas, histórico pesquisável/paginado,
  configuração opt-in, adapter Gemini e limpeza de expiração.
- Router incluído em `backend/app/main.py`, preservando autenticação e os
  endpoints existentes. A limpeza funciona em tarefa cancelável, com SQL em
  thread, a cada hora; não há consulta bloqueante no startup. Também existe CLI
  `python -m app.research.cleanup` para operação.
- Migration `20261026research`, após `20261014rls`, cria seis tabelas com RLS
  habilitada, sem políticas para acesso direto. Metadados seguem compatíveis com
  os testes rápidos SQLite; migração, travas e concorrência foram exercitadas em
  PostgreSQL real.
- Produtos de comparação são filhos ordenados em `research_comparison_products`;
  o preço original usa `Decimal` criado de string e coluna `NUMERIC(18,2)` nullable.
  O contrato HTTP e os snapshots de resposta continuam com strings decimais/null.
  A substituição remove e faz flush dos filhos antigos antes de inserir posições
  novas; FK ON DELETE CASCADE, exclusão explícita e purge removem os filhos.
- Reservas de geração são persistidas antes do HTTP; cotas usam ledger sem
  conteúdo separado das pesquisas. Exclusão não devolve consumo. Primeiro envio
  cria conversa e par de mensagens apenas no sucesso atômico.
- Replay valida propriedade/existência/expiração antes do snapshot. Exclusão
  apaga conteúdo dos snapshots e mantém tombstone de idempotência sem conteúdo
  por até 24 horas. Geração não persiste resultado se a pesquisa sumiu, expirou
  ou mudou de versão.
- A captura de contexto e dos dados da comparação ocorre sob a reserva curta,
  copiando valores antes do commit. O HTTP não mantém a transação aberta.
- Gemini fica desativado por padrão e depende de `AI_ENABLED=true` e chave no
  backend. Sem ferramentas de busca, sem fallback pago, sem requisição das URLs
  dos produtos e sem logging de prompts, respostas ou credenciais.

## Red → Green observado

1. POST de comparação válida sem IA configurada: **Red 404 em vez de 201**
   antes da implementação do CRUD; depois **Green 2/2** com capabilities.
   O teste inicial de capabilities passou, mas seu Red não foi observado devido
   à execução presa em imports no sandbox; não é contado como evidência de Red.
2. Revisão identificou perda de contexto concorrente: A lê antes da reserva,
   B conclui, A gera sem o par de B. Teste determinístico PostgreSQL confirmou
   **Red 1/1**, mostrando somente a primeira pergunta e a pergunta A. Após mover
   captura para a reserva protegida, **Green 39/39** focados, incluindo o caso.
3. Instrução de comparação incompleta e serialização agregada acima de 16 mil
   caracteres: **Red 2/2**. Após a correção, o prompt pede diferenças, prós,
   contras, lacunas, adequação ao uso e insuficiência de dados sem vencedor;
   contexto acima do limite retorna 422 antes de quota/provider. **Green 41/41**
   para o conjunto focado final, em 6,87 s.
4. Regra monetária sempre ativa: um novo teste PostgreSQL confirmou **Red 1/1**
   porque faltava a tabela de produtos com coluna NUMERIC. A migration inédita
   foi ajustada e somente o schema research do banco descartável desta tarefa foi
   recriado, com guardas explícitas de host/porta/nome; nenhum banco QA da
   coordenação ou dado real foi alterado. **Green 27/27** inicial comprovou
   roundtrip1899.90/null e compatibilidade HTTP. A rodada final ampliada ficou
   **46/46**, incluindo provider, RLS, reordenação/substituição, purge e cascata.
   Um teste novo de purge precisou corrigir a fixture para guardar o UUID antes
   da exclusão; a falha era acesso a objeto ORM já excluído, sem defeito do purge.

## Testes e comandos

Os testes usaram somente o PostgreSQL descartável da tarefa, no container
`bestprice-feature-0034-issue-195-assistenc-3fae4d73-db-1`, porta local 40720,
banco `bestprice_spec0034`. Nenhum volume pessoal ou banco externo foi usado.

O formato de `TEST_DATABASE_URL` para a suíte completa é `postgresql://...`:
health usa psycopg diretamente; os testes SQLAlchemy convertem o prefixo apenas
na criação do engine. Não registrar credenciais no documento.

| Execução | Resultado observado |
|---|---|
| `.venv/Scripts/ruff.exe check .` | Passou após os ajustes finais |
| `.venv/Scripts/python.exe -m alembic upgrade head` com DATABASE_URL isolada | Migrou até `20261026research` no PostgreSQL da spec |
| `pytest -q tests/test_research_http.py tests/test_research_provider.py tests/test_research_integration.py` antes da adequação NUMERIC | **41 passed**, 1 warning, 6,87 s após correções de contexto/prompt |
| Mesmo conjunto + `tests/test_rls_migration_integration.py` no schema NUMERIC final | **46 passed**, 1 warning, **26,57 s** |
| Suíte completa com DSN incorreta `postgresql+psycopg://...` | 227 passed, 2 failed, 2 skipped; as duas falhas vieram do parser psycopg de health, que não aceita o prefixo SQLAlchemy |
| Suíte completa com DSN correta, antes da correção de contexto concorrente | **233 passed, 2 skipped**, 1 warning, 73,99 s |
| Suíte completa após correções de contexto/prompt, antes de NUMERIC | **236 passed, 2 skipped**, 1 warning, **77,08 s**, PostgreSQL real; Ruff passou na mesma rodada |
| Suíte completa final com NUMERIC | **239 passed, 2 skipped**, 1 warning, **82,39 s**, PostgreSQL real; skips do script POSIX no Windows |
| Complexidade explícita `complexity_report.py backend/app/research --min-rank B`, após NUMERIC | **64 blocos**, média **2,34 rank A**, máximo **B/10**; nenhum bloco D ou arquivo abaixo do MI mínimo |
| Complexidade `--changed origin/develop` | 6 blocos rastreados alterados, todos rank A; sem violações. Os arquivos novos ainda não rastreados foram cobertos pela análise explícita do módulo acima |
| Complexidade global sem baseline | Detectou dívida anterior: `get_dashboard` CC24, `parse_product_url` CC21 e MI19,5 em products/routes.py; esses arquivos não foram alterados |
| Complexidade global com `.complexity-baseline.json` já versionado, após NUMERIC | **184 blocos**, média4,05; baseline aplicado sem nova/piorada violação. O baseline não foi criado nem regenerado nesta tarefa |

O warning é a depreciação já existente de `fastapi.testclient`/Starlette em
relação ao HTTPX. Não foi introduzida dependência nova para escondê-lo.

As duas funções D foram comparadas diretamente com `git show origin/develop` e
reanalisadas com radon: `get_dashboard` tem CC24 na base e na worktree;
`parse_product_url`, CC21 em ambas. Os dois arquivos são idênticos à base.
A regra do projeto bloqueia violações novas/pioradas; a dívida anterior continua
explicitamente registrada e não foi escondida por alteração de baseline.

## Cobertura concreta

- Configuração desativada não chama provider nem cria pesquisa, tentativa ou quota.
- Autenticação por cookie exercitada em PostgreSQL; negação de acesso sem sessão.
- Todas as operações de recursos alheios retornam 404 sem conteúdo privado.
- Histórico filtra título sem diferenciar caixa, separa tipo e percorre páginas.
- Dois/três produtos aceitos; quantidades fora do limite, mensagem vazia/longa,
  URL com esquema impróprio e formatos monetários inválidos recusados.
- Preço ausente permanece null; análise anterior é invalidada na edição e
  versão obsoleta é recusada.
- PostgreSQL inspecionado comprova coluna `NUMERIC(18,2)` para preço, sem coluna
  JSON de produtos no registro da comparação. Roundtrip de `1899.90` usa Decimal;
  serialização e snapshot de análise preservam `"1899.90"`/null. A geração de
  análise com filhos lazy também comprova ausência de transação durante o HTTP.
- Mesmo request ID não gera novamente; payload diferente é conflito; tentativa
  em andamento não gera em paralelo; tentativa antiga fica recuperável sem retry
  automático. Snapshot salvo pode ser reconsultado mesmo com provider desativado.
- Provider com transporte HTTPX simulado comprova host fixo, header da chave,
  ausência de cookies/ferramentas, resposta STOP, texto sem pensamentos internos,
  limite de saída, timeout e erros sanitizados.
- Falha de geração inicial não deixa conversa vazia. Falha de gravação não
  informa sucesso e não revela SQL/detalhes internos.
- Retenção de 90 dias é fixa desde criação; edição não a renova; pesquisa expirada
  fica inacessível mesmo antes da limpeza física.
- Limpeza apaga mensagens/pesquisas expiradas e snapshots, sem zerar cota atual.
- PostgreSQL com threads demonstra apenas uma reserva para a mesma tentativa,
  cota global sem ultrapassar o limite, descarte após exclusão durante geração
  e contexto atualizado quando uma requisição espera outra concluir.
- Asserções PostgreSQL de `session.in_transaction() is False` durante o provider
  cobrem tanto primeira conversa quanto continuidade com contexto existente.

## Limites e pendências operacionais

- Nenhuma geração real foi enviada ao Google. Modelo, quotas reais, qualidade em
  português e termos operacionais exigem validação própria após configuração
  autorizada da chave. Testes simulados não provam correção factual de um LLM.
- O aplicativo limita chamadas e não faz fallback pago, mas não consegue auditar
  o estado de faturamento da conta da chave fornecida pela operação.
- Exclusão/expiração se referem ao banco ativo do BestPrice; não prometem apagar
  backups ou dados nos sistemas do fornecedor.
- Execuções Python no sandbox ficaram presas em imports e UV não conseguiu gravar
  cache. As sessões presas foram encerradas e os resultados acima vieram do Python
  da própria worktree executado fora do sandbox, sem substituir ambiente ou pular
  testes. Houve interrupção posterior por limite do mecanismo de aprovação; o
  comando afetado não executou, e a retomada confirmou os arquivos e o banco antes
  de prosseguir.
- Sem commit, push ou modificação de arquivos de frontend/documentação fora desta
  evidência pelo implementador backend. Revisão independente, QA e doc-sync final
  pertencem à coordenação.
