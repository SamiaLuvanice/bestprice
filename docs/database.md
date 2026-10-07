# Banco de dados

## Visão geral

Hoje, a API executa `SELECT 1` para verificar a conexão. Nenhum dado de produto é guardado pela aplicação. O container cria um banco PostgreSQL vazio e mantém seu diretório em um volume Docker.

O [modelo conceitual pretendido](product-context.md#modelo-conceitual-inicial) contempla usuários, produtos compartilhados, monitoramentos por usuário, históricos, alertas e notificações. SQLAlchemy e Alembic fazem parte da direção técnica, mas ainda não foram incorporados. A modelagem deverá definir identidade por ASIN e escopo de marketplace, unicidade dos vínculos, concorrência, dinheiro com moeda e instantes UTC antes de criar migrations. As seções abaixo descrevem somente o banco atual.

## Diagrama ER

Não há entidades persistidas nem relacionamentos definidos no código atual. O diagrama vazio abaixo é intencional: não existe modelo ER de domínio para representar ainda.

```mermaid
erDiagram
  %% Nenhuma entidade de aplicacao foi declarada no codigo atual.
```

## Tabelas, campos e índices

| Elemento | Estado no projeto |
|---|---|
| Tabelas da aplicação | Nenhuma declarada |
| Colunas/campos | Nenhum campo de domínio declarado |
| Índices/constraints | Nenhum índice ou constraint de domínio declarado |
| Relacionamentos e regras de exclusão | Nenhum relacionamento ou regra `ON DELETE` declarado |
| Migrações | Nenhum framework ou arquivo de migração presente |
| ORM | Não utilizado |

Logo, não há tipos de coluna, índices ou cascatas a listar. O banco ainda pode conter objetos preexistentes dentro de um volume local persistente; eles não são criados nem interpretados pelo código desta aplicação. Não apague o volume como forma de “migrar” para a base atual.

## Conexão da aplicação

`backend/app/config.py#L4-L17` monta os parâmetros do psycopg. Se `DATABASE_URL` estiver definida, ela é usada diretamente como `conninfo`. Caso contrário, o backend requer `DB_HOST`, `DB_NAME`, `DB_USER` e `DB_PASSWORD`; `DB_PORT` é opcional e assume `5432` quando ausente. A função só retorna a configuração quando todos os valores resultantes estão preenchidos.

`backend/app/health.py#L9-L31` abre uma conexão por chamada, com `connect_timeout=3` e `statement_timeout=3000`, executa `SELECT 1` e exige o resultado `(1,)`. Os context managers fecham cursor e conexão. Erros `psycopg.Error` e `OSError` resultam em `False`; o log inclui o tipo da exceção, evitando registrar a mensagem que poderia conter credenciais ou host.

## Banco local e Compose

| Campo Compose | Valor padrão | Uso |
|---|---|---|
| Imagem | `postgres:17-alpine` | Servidor de banco |
| Banco | `bestprice` | Configurado por `POSTGRES_DB` |
| Usuário | `bestprice` | Configurado por `POSTGRES_USER` |
| Senha | Obrigatória | `POSTGRES_PASSWORD`; Compose falha se ausente |
| Porta externa | `5433` | `DB_PORT`, publicada somente em `127.0.0.1` |
| Porta interna | `5432` | Porta PostgreSQL na rede Compose |
| Volume | `db-data` | Persistência em `/var/lib/postgresql/data` |

O healthcheck usa `pg_isready` a cada 5 segundos, timeout de 3 segundos e até 10 tentativas. O backend só inicia após o serviço DB ficar healthy. No Compose, o backend resolve o host `db`; executando a API fora do Compose, use `localhost` e a porta publicada.

## Desenvolvimento de esquema

Quando uma funcionalidade futura precisar persistir dados, será necessário definir tabelas, tipos, índices, chaves estrangeiras, nulabilidade, regras de exclusão e estratégia de migração antes de alterar o banco. Hoje, nenhum comando de migração ou criação de usuário admin existe. Não execute migrações antigas do histórico da aplicação removida sobre este banco.

## Pegadinhas

- O volume `db-data` sobrevive a `docker compose down`; volume antigo pode conter dados ou credenciais diferentes da configuração atual.
- O endpoint de health não inspeciona o schema; PostgreSQL acessível pode retornar health 200 mesmo sem tabela alguma.
- `TEST_DATABASE_URL` deve apontar para banco isolado. O teste de falha constrói uma conexão com nome de banco inexistente, preservando host e credenciais-base.
- A senha em `.env.example` é demonstrativa, não é segredo real nem senha adequada para ambiente compartilhado.
- Não há pool de conexões, pois o único uso atual é uma verificação curta por requisição.
