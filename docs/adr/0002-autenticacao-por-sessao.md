# 0002 — Autenticação por sessão no servidor

## Contexto

A spec 0002 pede login por e-mail, manutenção da autenticação no F5, expiração
por inatividade e invalidação efetiva no logout. O projeto tem Angular e API
Spring Boot publicados pela mesma origem via proxy local.

## Decisão

Usar Spring Security com sessão no servidor e cookie de sessão HttpOnly,
SameSite=Lax e não persistente. Proteger mutações com CSRF; o cookie XSRF
legível pelo Angular não é uma credencial de autenticação.

A única conta de estudo vem de variáveis de ambiente e fica em memória com
senha codificada por BCrypt. Não criar entidade, tabela nem migração: cadastro
e administração de usuários estão fora desta entrega.

A API é a autoridade de acesso. Login, bootstrap CSRF e consulta de saúde são
públicos. Os demais recursos de domínio exigem sessão válida. Uma requisição
sem sessão recebe 401 antes da validação de CSRF; uma sessão válida com CSRF
inválido recebe 403. MVC e filtros compartilham o formato ProblemDetail.

O prazo de 30 minutos mede requisições autenticadas aceitas. A política usa
Instant e Clock injetável para testar exatamente o limite; o container também
descarta sessões abandonadas. O service de regra temporal não conhece servlet.

## Alternativas e consequências

JWT exigiria mais mecanismos para revogar imediatamente a sessão no logout.
Persistência de usuários no banco acrescentaria schema e seed sem necessidade
para uma conta local. Ambas podem ser consideradas numa futura spec.

Sessões se perdem ao reiniciar a API; a conta é reconstruída pela configuração.
Múltiplas instâncias exigirão revisar o armazenamento das sessões. Fechar o
navegador sem restauração elimina o cookie; restauração automática permanece
fora do escopo. HTTP é exclusivo do ambiente local; HTTPS exige cookie Secure.

O comportamento histórico de `/api/nada` na spec 0001 muda: sem autenticação,
retorna 401; autenticado, continua retornando 404 da API. Isso é uma evolução
intencional de controle de acesso, não uma mudança do proxy.

## Referência

[Plano e contrato da spec 0002](../../specs/0002-login-e-redirecionamento/plan.md).
