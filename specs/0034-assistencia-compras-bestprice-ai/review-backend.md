# Revisão independente do backend da spec 0034

Rodada de implementação na worktree da Issue #195. Papel: arch-reviewer.
Parecer após revalidação de RB01 e RB02: **aprovado na revisão independente do
código backend, sem bloqueio remanescente identificado.** O parecer não substitui os
gates completos, QA, evidências operacionais ou doc-sync-onboarding.

## RB01 P2 Contexto lido antes de obter a reserva da conversa

Arquivo: `backend/app/research/service.py`, linhas 143–150 da rodada inicial.

`send_chat` lê mensagens antes de `reserve_attempt` obter as travas que autorizam
o envio. A pode ler o histórico, B concluir outro envio e, só depois, A reservar
a conversa: como B já concluiu, não há tentativa pendente que recuse A. A geração
recebe o histórico antigo, apesar de persistir seu par depois do par de B.

Impacto: resposta sem o contexto concluído mais recente da mesma conversa,
contrariando AC10. A mesma janela de snapshot anterior à reserva deve ser
considerada ao validar versão/dados da comparação antes de consumir cota.

Correção sugerida: obter o snapshot de mensagens sob a mesma exclusão curta
que autoriza o envio, antes de liberar a transação; enviar somente dados locais
ao provider, sem manter transação aberta durante HTTP. Cobrir a ordenação com
duas sessões e sincronização determinística.

### Evidência independente

Foi executado um script efêmero por stdin com o Python da `.venv`, SQLite em
memória, dados sintéticos e provider local. O script intercala B imediatamente
antes da reserva efetiva de A, depois de A já ter capturado o histórico. Não edita
arquivos do projeto nem acessa rede/segredos.

Resultado observado, exit 0:

```text
{'A_context_includes_completed_B': False, 'history_messages_sent_to_A': 3}
```

Esse experimento comprova a janela lógica de snapshot, mas não substitui uma
regressão com PostgreSQL e as travas reais. A tentativa inicial via uv falhou por
cache fora da área gravável; a execução direta pelo Python da `.venv` concluiu.

## Escopo examinado

- Todos os arquivos novos em `backend/app/research/`, não apenas git diff.
- Contrato e rotas, ownership, schemas, serialização, reservas e idempotência.
- Migration `20261026_research.py`, inclusão no Alembic e alteração de main.
- Limpeza horária, filtragem de expiração, exclusão de snapshots e cotas
  independentes do conteúdo das pesquisas.
- Adapter HTTP com host fixo, configuração opt-in, resposta textual limitada e
  erros sanitizados; sem execução de URLs informadas pelo usuário.
- Novos testes research e ajuste da conferência de RLS.
- Mudanças de configuração em `.env.example` e `docker-compose.yml`.

Não foi identificado outro bloqueio concreto nesta leitura inicial. Há proteção
explícita contra propriedade alheia, commit posterior a exclusão/expiração,
análise de versão antiga e restituição da cota pela exclusão da pesquisa.

## Limites e próximo passo

O coordenador informou gates focados com PostgreSQL, Ruff e complexidade verdes;
esses resultados não foram reexecutados nesta rodada. A revisão não comprova
qualidade do modelo, chamada real ao fornecedor, deploy, CI ou disponibilidade
de cota gratuita. A suíte completa ainda estava em execução no início da revisão.

Não alterei código ou testes durante a revisão. QA independente e
doc-sync-onboarding continuam etapas separadas.

## Revalidação de RB01 e fechamento da rodada

**RB01 resolvido.** `reserve_attempt` agora obtém o histórico em
`generation_context` com a reserva e a trava do recurso ainda mantidas; esse
snapshot contém valores primitivos e é enviado ao provider somente depois do
commit que libera a transação. A comparação também revalida a versão e captura
os dados sob essa exclusão antes de reservar a cota.

O experimento independente descrito acima foi repetido sem alterar arquivos,
com a mesma intercalação. Resultado observado, exit 0:

```text
{'A_context_includes_completed_B': True, 'history_messages_sent_to_A': 5}
```

Foi inspecionado o novo teste PostgreSQL
`test_chat_captures_latest_context_after_waiting_to_reserve`: ele intercala
conexões usando eventos, confirma a sequência Inicial → B → A no contexto e
verifica ausência de transação durante a geração. Sua execução PostgreSQL é
responsabilidade da evidência do implementador/coordenador; não foi repetida
pelo revisor nesta rodada.

Também foram conferidos os ajustes de prompt para comparação contextual (uso,
prós, contras, lacunas e insuficiência de informação) e a recusa 422 antes de
cota/provider quando a serialização ultrapassa o limite de contexto. Os testes
novos verificam as instruções e a ausência de consumo/chamada nesse erro; não
comprovam a qualidade ou obediência de um modelo real.

Não foi identificado novo bloqueio concreto no backend/infra examinados após
essas alterações. A suíte completa e o relatório final de complexidade ainda
devem constar das evidências da tarefa, com seus limites reais.

## RB02 P2 Preço persistido somente dentro de JSON

A coordenação identificou que `Comparison.products` guarda preço como string
em JSON. A regra sempre ativa `.agents/rules/datetime-pipeline.md` exige:
“Persista como NUMERIC com escala definida pelo domínio.” O contrato HTTP usar
string decimal não dispensa o tipo monetário no armazenamento original.

**Resolvido e revalidado.** Produtos originais agora ficam na tabela filha
`research_comparison_products`, com `price Numeric(18, 2)` nullable e mapeamento
`Decimal`. A construção parte da string validada, sem conversão por float.
O limite de 16 dígitos inteiros e duas casas do schema corresponde à precisão
da coluna; ausência de preço continua null, sem zero artificial.

Foram conferidos modelo, migration inédita, repositório, service, serializer,
schemas e regressões. A PK (comparison_id, position) e o CHECK de posição 0..2
preservam ordem e capacidade. A substituição usa clear + flush antes de inserir
as novas posições na mesma transação, evitando colisão da PK; versionamento,
invalidação da análise e retenção original permanecem na operação protegida
pela trava do recurso. O snapshot para geração continua capturado sob lock e
serializado em valores primitivos antes de liberar a transação.

O DTO REST mantém products como array com price string decimal ou null, usando
format de Decimal com duas casas. Snapshots HTTP da idempotência permanecem JSON;
eles não substituem a persistência monetária original em NUMERIC.

A FK tem ON DELETE CASCADE e o relacionamento possui delete-orphan/passive_deletes;
exclusão e purge SQL também eliminam filhos explicitamente. A tabela filha recebe
RLS na migration e consta no conjunto esperado pelo teste de RLS, sem políticas
de acesso direto. Assim como nas demais tabelas da aplicação, o acesso direto
público fica negado e a API autorizada filtra propriedade no pai; não foi criado
endpoint que leia filhos por ID sem verificar ownership e expiração do pai.
Downgrade remove a filha antes da comparação.

As regressões PostgreSQL inspecionadas verificam tipo/precisão/escala reais,
ausência da coluna products JSON original, roundtrip de 1899.90/null,
substituição/reordenação de três para dois produtos, manutenção da expiração,
versão incrementada, purge dos filhos e cascata por delete SQL direto.
O coordenador/backend informou 27 casos focados aprovados antes das regressões
adicionais; a execução PostgreSQL final e suíte completa devem constar da
evidência do implementador, sem serem atribuídas a esta revisão.

Smoke independente por stdin, sem editar o projeto, executado com SQLite em
memória e dados sintéticos: criação com Decimal, reordenação/substituição,
serialização HTTP e purge dos filhos passaram, exit 0:

```text
{'reorder': True, 'version': 2, 'http_prices': [None, '1899.90'], 'purge_children': True}
```

Esse smoke verifica o caminho ORM/serializer, sem substituir Numeric/RLS/FK e
concorrência no PostgreSQL real. Não foi inferida exceção à regra monetária.

## Parecer final de consistência da evidência

Foram relidos `backend-evidence.md`, `frontend-evidence.md`, `verification.md`
e as marcações finais de `spec.md`. O relatório backend final registra **46
testes focados aprovados**, **239 passed, 2 skipped, 1 warning** na suíte completa
com PostgreSQL, Ruff aprovado e complexidade com baseline sem nova/piorada
violação. A análise explícita do módulo novo cobre arquivos não rastreados:
64 blocos, média 2,34/A e máximo B/10. Os dois skips POSIX no Windows e o warning
de depreciação são discriminados, sem alegação de cobertura desses skips.
Esses comandos são evidência do implementador/coordenador, não execução desta
revisão.

Os resultados e seus limites são consistentes entre os documentos: persistência,
API, sessão e QA local usam PostgreSQL real; geração e transporte do fornecedor
continuam controlados em testes. A spec mantém AC10, AC15 e AC19 abertos para
validação operacional do modelo e AC30 aberto para handoff; permanece `pronta`,
sem alegação de integração, CI, merge ou release. Doc-sync está em execução como
última etapa documental. Nenhuma divergência concreta bloqueante foi identificada
nessa conferência.

**Parecer final do backend aprovado para o handoff local**, com RB01/RB02
resolvidos e os limites acima. A revisão não altera os critérios abertos, não
autoriza ativação do provider e não substitui a etapa documental final.
