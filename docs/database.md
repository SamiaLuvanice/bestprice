# Banco de dados

## Esquema atual nesta branch

`20261014_enable_public_rls.py` (revisão `20261014rls`) habilita Row Level Security em `alembic_version`, `products`, `users`, `price_history`, `product_events`, `tracked_products`, `user_sessions`, `notifications`, `price_alerts` e `operator_credentials`, sem criar políticas de acesso direto para `anon` ou `authenticated`. A API FastAPI usa a conexão PostgreSQL do proprietário das tabelas. O downgrade exige procedimento manual de segurança, pois desabilitar RLS reabriria tabelas que já têm permissões concedidas no Supabase. A proteção foi aplicada diretamente no Supabase `bestprice-stage` em 14/10/2026 com aprovação do responsável e depois reproduzida no deploy #69: log Alembic `20261009safe -> 20261014rls`, head confirmado, 10/10 tabelas com RLS ativo, nenhuma política em `public` e health público 200.

As migrations em `backend/alembic/versions/` criam o esquema SQLAlchemy definido em `backend/app/products/models.py` e `backend/app/research/models.py`; `20261009_operator_credentials.py` e `20261009_oauth_refresh_safety.py` acrescentam as credenciais da conta operadora e o controle de renovação. A migration `20261026_research.py` acrescenta as pesquisas da spec 0034 após `20261014rls`; o head do código passa a `20261026research`. O head Stage citado na evidência anterior é `20261014rls`; a nova revisão não foi implantada nesta tarefa. Aplique em `backend/` com `uv run alembic upgrade head` após configurar `DATABASE_URL` ou `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` e, opcionalmente, `DB_PORT`. O Compose aplica as migrations antes de iniciar Uvicorn. O volume `db-data` persiste entre subidas; não remova volumes para aplicar migrations.

| Tabela | Conteúdo e relação principal |
|---|---|
| `users` | Conta com e-mail único e hash de senha |
| `user_sessions` | Sessões por usuário, hash de token único e expiração |
| `operator_credentials` | Registro único (`id = 1`) da conta operadora: tokens cifrados, expiração, bloqueio de refresh e prazo para nova tentativa após 429 |
| `products` | Publicação MLB compartilhada, `external_id` único, estado da consulta, preços e próximo horário de verificação |
| `tracked_products` | Vínculo usuário–publicação; combinação `user_id, product_id` única |
| `price_history` | Preços observados por publicação, moeda, contexto e instante |
| `product_events` | Alterações observadas por publicação |
| `price_alerts` | Um alerta por vínculo, alvo, estado, revisão e episódio |
| `notifications` | Ocorrência por usuário e alerta; combinação `alert_id, revision, episode` única |

A migration nova cria seis tabelas e habilita RLS em todas, sem políticas para
`anon`/`authenticated`; a API mantém autorização por proprietário e expiração.
O banco descartável migrado do zero confirmou `NUMERIC(18,2)` e seis flags RLS
ativas. Isso não demonstra aplicação dessa migration em Stage.

| Tabela research | Conteúdo e relação principal |
|---|---|
| `research_conversations` | Conversa privada por usuário; título, criação, atualização e expiração |
| `research_messages` | Mensagem textual user/assistant; FK com cascata e posição única por conversa |
| `research_comparisons` | Comparação privada, uso declarado, versão e análise JSON nullable |
| `research_comparison_products` | Dados originais ordenados; PK `(comparison_id, position)`, posições 0–2, FK com cascata; preço `NUMERIC(18,2)` nullable e positivo quando informado |
| `research_ai_requests` | Unicidade `(user_id, request_id)`, fingerprint, estado e snapshot/erro; target sem FK para conservar tombstone sem conteúdo após exclusão |
| `research_ai_usage` | Contadores persistidos independentes da pesquisa, por pessoa/aplicação e janela UTC, sem prompt ou resposta |

`ComparisonProduct.price` usa `Decimal` criado da string validada; o REST representa
o valor com duas casas ou null. Preço ausente não vira zero. A análise e snapshots
REST são JSON, sem substituir a coluna monetária original. Edição substitui os
filhos na mesma transação, incrementa versão e invalida a análise, preservando a
expiração. Os modelos não criam `Product`/`TrackedProduct` de monitoramento.

Conversas e comparações expiram após 90 dias desde a criação, sem renovação por
edição. Leituras sempre exigem `expires_at > now`; exclusão manual remove filhos e
conteúdo dos snapshots imediatamente do banco ativo. Tombstones de tentativas
persistem sem conteúdo para impedir ressurreição por replay; a janela de replay é
24 h. Limpeza horária remove pesquisas vencidas, tentativas com mais de 24 h e
contadores cuja janela venceu há pelo menos dois dias. Excluir uma pesquisa não
restitui cota. O CLI `uv run python -m app.research.cleanup`, em `backend/`, usa a
mesma limpeza; backups e registros Google não fazem parte dessa garantia.

Valores monetários persistem como `NUMERIC(18,2)`; o cliente Mercado Livre já entrega o preço arredondado a centavos (`ROUND_HALF_UP`), então o valor comparado é o mesmo persistido. Instantes usam colunas com fuso; `backend/app/db.py` executa `SET TIME ZONE 'UTC'` em cada nova conexão SQLAlchemy (em autocommit, para sobreviver a rollbacks), e a API serializa os instantes com `Z` independentemente do fuso padrão do servidor. Há índices para próxima consulta, vínculos ativos por usuário, histórico e eventos por publicação e notificações por usuário. Os detalhes de colunas e constraints estão nos modelos e na migration. Histórico e publicação são compartilhados; vínculo, alerta, sessão e notificação têm escopo individual.

Cadastro e atualização de uma mesma publicação são serializados por `pg_try_advisory_lock` (chave derivada do `external_id`), de nível de sessão e mantido em conexão dedicada em AUTOCOMMIT; a sessão de domínio confirma a leitura antes da chamada HTTP externa, para que nenhuma transação fique aberta durante a consulta. A API espera até 5 segundos pela trava e o worker não espera. A avaliação e a edição de um alerta usam trava de linha em `price_alerts` no PostgreSQL; a avaliação compartilhada trava os alertas da publicação em ordem de chave primária e as rotas travam apenas o alerta envolvido, o que evita deadlock entre alertas de usuários distintos. Depois de esperar outra transação, a sessão recarrega o estado do alerta antes de decidir a notificação ou a próxima revisão. Criação, edição e exclusão de alerta e interrupção do monitoramento também travam e recarregam `tracked_products` antes de decidir pelo estado `active`. A restrição única de `notifications` permanece como proteção adicional. Testes com duas sessões confirmaram uma notificação por episódio, revisões sequenciais, alerta desabilitado nas duas ordens de edição/interrupção e um alerta com uma notificação no cadastro simultâneo; a segunda tentativa retorna `alert_already_exists`.

A chave Fernet fica somente no ambiente (`MERCADOLIVRE_OAUTH_KEY`), não no banco. A trava de linha desse registro serializa refresh entre API e worker; uma resposta ambígua exige reprovisionamento para evitar reutilizar refresh token possivelmente consumido. A API ainda usa psycopg com conexão curta para o health check. As rotas de domínio usam sessões SQLAlchemy criadas a partir da mesma configuração de banco, sobre um engine que reaproveita conexões com `pool_pre_ping`, recicla as que passam de 300 s, reutiliza as mais recentes e limita a espera por conexão e a abertura de conexão nova por prazo (`backend/app/db.py`; ver [spec 0022](../specs/0022-conexao-resiliente-ao-banco/verification.md)). `DATABASE_URL` tem precedência sobre os campos `DB_*`. A aplicação não cria automaticamente usuários: veja o comando de provisionamento em [backend](apps/backend.md).

O teste de integração requer `TEST_DATABASE_URL` apontando a um banco isolado, com URL `postgresql://...` compatível também com o health check psycopg. A continuação da spec 0013 aplicou a migration em PostgreSQL 17 isolado, verificou unicidade e `Decimal`, testou duas sessões concorrentes para cadastro e atualização de uma publicação, falha de escrita após o flush sem linhas remanescentes nem trava advisory presa, e workers em processos distintos; os limites constam em [verification.md](../specs/0013-monitoramento-mercado-livre-brasil/verification.md).
