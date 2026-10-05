# Plano — 0002 Login e redirecionamento

Plano revisado por agente independente e autorizado para implementação pelo usuário. Implementação e verificação concluídas; evidências registradas em `verification.md`. Este plano descreve o desenho, não substitui a evidência funcional.

## Base observada

- `backend/pom.xml`: Spring Boot 4.1.1, Java 25, Maven, Web MVC, Validation, JPA, H2/PostgreSQL; ainda sem Spring Security. Pacote real: `com.mybank`.
- Backend contém apenas a aplicação, configuração e um teste de contexto. A spec 0001 está `implementada`.
- `frontend/package.json` e `angular.json`: Angular 21.2, componentes standalone, SCSS, Vitest; rotas vazias, título My Bank e outlet existentes.
- Proxy de desenvolvimento e nginx já encaminham `/api` para a API na mesma origem. Docker é ambiente local de estudo; não existe implantação de produção neste escopo.

## Contrato da API

Respostas com corpo usam JSON; erros usam `application/problem+json`. Autenticação fica em sessão do servidor, identificada por cookie, sem token de acesso no JSON. Respostas de autenticação e de bootstrap CSRF usam `Cache-Control: no-store`.

| Método e rota | Acesso e entrada | Sucesso | Erros previstos |
|---|---|---|---|
| `GET /api/auth/csrf` | Público; sem corpo | 204; disponibiliza cookie `XSRF-TOKEN`, sem criar sessão autenticada | 500 |
| `POST /api/auth/login` | Público, com CSRF; `LoginRequest` | 200; `UserResponse` e cookie de sessão | 400, 401, 403, 415, 500 |
| `GET /api/auth/me` | Sessão válida; sem corpo | 200; `UserResponse` | 401, 500 |
| `POST /api/auth/logout` | Sessão válida e CSRF; sem corpo | 204; invalida sessão e remove cookies | 401, 403, 500 |
| `GET /actuator/health` | Público; sem corpo | Mantém contrato Actuator da 0001 | Mantém status de saúde do Actuator |

`LoginRequest` = `{ "email": string, "password": string }`. Ambos obrigatórios, não nulos e não vazios; e-mail com formato válido e até 254 caracteres. Normalizar e-mail com trim e minúsculas tanto na configuração como no login; não modificar a senha. Limitar senha a 72 bytes UTF-8, limite compatível com BCrypt; rejeitar somente espaços e entradas acima do limite com 400 e `errors.password`. Aplicar o mesmo limite à configuração local e ao formulário; não adicionar regras de complexidade nesta feature. Campo desconhecido, JSON inválido e corpo ausente retornam 400. Configurar Jackson para rejeitar propriedades desconhecidas, confirmando a propriedade efetiva no Boot 4/Jackson 3 por teste.

`UserResponse` = `{ "email": string }`. Não retorna id, senha, hash ou detalhes de sessão. Os DTOs Java são records; `LoginRequest.toString()` deve omitir a senha, pois o comportamento gerado de records a exporia.

Erros têm `type: "about:blank"`, `title`, `status`, `detail`, `instance` igual ao caminho sem query e extensão estável `code`. Não acrescentar timestamp, identificador aleatório, valor rejeitado ou informação da conta ao corpo. Bean Validation acrescenta `errors: [{ "field": "email" | "password", "message": string }]`; erros de sintaxe/campo desconhecido têm mensagem genérica sem ecoar o JSON recebido.

| Situação | Status / code | detail |
|---|---|---|
| Entrada inválida | 400 / `VALIDATION_FAILED` | `Dados inválidos.` |
| JSON inválido ou campo desconhecido | 400 / `INVALID_REQUEST` | `Requisição inválida.` |
| E-mail inexistente ou senha incorreta | 401 / `INVALID_CREDENTIALS` | `E-mail ou senha inválidos` |
| Sem sessão | 401 / `UNAUTHENTICATED` | `Autenticação necessária.` |
| Sessão expirada ou identificador de sessão já inválido | 401 / `SESSION_EXPIRED` | `Sua sessão expirou. Entre novamente` |
| CSRF ausente/inválido | 403 / `INVALID_CSRF_TOKEN` | `Não foi possível validar a solicitação. Tente novamente.` |
| Sem permissão | 403 / `ACCESS_DENIED` | `Acesso não permitido.` |
| Recurso inexistente, para cliente autenticado | 404 / `NOT_FOUND` | `Recurso não encontrado.` |
| Tipo de conteúdo não aceito | 415 / `UNSUPPORTED_MEDIA_TYPE` | `Tipo de conteúdo não suportado.` |
| Falha inesperada | 500 / `INTERNAL_ERROR` | `Não foi possível concluir a solicitação.` |

Usar títulos estáveis em português por categoria: `Dados inválidos`, `Requisição inválida`, `Não autenticado`, `Acesso negado`, `Recurso não encontrado`, `Tipo de conteúdo não suportado`, `Erro interno`. Os dois casos de credencial incorreta produzem corpo e status idênticos, inclusive `instance`, pois usam a mesma rota. O provider padrão também evita revelar usuário inexistente pela exceção; não implementar comparação manual de senha.

Precedência: em recursos protegidos, ausência/expiração de sessão resulta em 401 antes de processar corpo ou CSRF; com sessão válida, POST sem CSRF retorna 403. Login é público, mas POST exige CSRF: seus testes de 400/401 devem enviar CSRF válido. `GET /api/auth/csrf` permite preparar qualquer cliente, inclusive curl. A regra de logout sem sessão continua sendo 401 mesmo sem CSRF; não depender da ordem padrão dos filtros para isso.

Permitir publicamente apenas as rotas e métodos acima indicados; proteger demais `/api/**`, negar os demais recursos administrativos. Desabilitar login HTML, HTTP Basic, remember-me e request cache que criaria sessão anônima. Tratar dispatch de erro sem transformar falhas MVC em redirecionamentos. `/api/nada` passa de 404 público para 401 sem sessão; autenticado continua 404, nunca HTML. Registrar essa evolução de acesso em `docs/adr/0002-autenticacao-por-sessao.md` e na documentação da execução, preservando o registro histórico da 0001.

## Sessão, CSRF e relógio

Sessão `HttpSession` em memória, gerenciada por Spring Security. Cookie `JSESSIONID`: `HttpOnly`, `SameSite=Lax`, `Path=/`, host-only, sem `Max-Age`/`Expires` persistente, transporte somente por cookie (sem reescrita de URL). `Secure=false` exclusivamente nos modos HTTP locais existentes; documentar `Secure=true` como requisito quando houver HTTPS. Reiniciar API invalida sessões; a conta configurada continua disponível.

O controller autentica por um service que usa `AuthenticationManager`; um adaptador web dedicado aplica `SessionAuthenticationStrategy` (proteção contra fixação e rotação CSRF), cria/salva explicitamente o `SecurityContext` em `SecurityContextRepository` e inicializa o instante de atividade. O service não recebe request/response nem conhece status HTTP. Não basta preencher `SecurityContextHolder`: a próxima requisição precisa recuperar a autenticação persistida. Delegar logout aos handlers de Spring Security através do adaptador, invalidando sessão, contexto e cookies; desabilitar o endpoint padrão para evitar duas implementações.

CSRF ativo inclusive no login. Usar `CookieCsrfTokenRepository` e suporte SPA compatível com a versão gerenciada: `XSRF-TOKEN` legível pelo Angular, `X-XSRF-TOKEN` enviado pelo HttpClient, cookie host-only e `Path=/`. Este cookie não autentica; somente `JSESSIONID` é HttpOnly. Bootstrap GET materializa o token sem criar HttpSession. Após login e logout, renovar o token via bootstrap antes da próxima mutação. Falha nesse bootstrap posterior não desfaz login/logout já confirmado; bloquear apenas a próxima mutação até nova tentativa. Resposta 403 não causa repetição automática de POST: renovar token e permitir ação explícita da pessoa. Compatibilizar token de cookie em texto com proteção BREACH/deferred tokens conforme suporte SPA oficial.

O requisito mede **requisições autenticadas aceitas**, não clique ou acesso a health. Manter `lastAuthenticatedRequestAt: Instant` na sessão; `SessionActivityService`, com `Clock` e duração de 30 minutos, decide expiração em `agora >= últimaAtividade + duração`. Um filtro web verifica antes de permitir recursos protegidos e invalida antes do controller se expirou. Só renovar atividade quando a requisição protegida foi autenticada/autorizada e aceita (nesta feature, resposta 2xx de `/me`); health, bootstrap CSRF, login inválido e rejeição 403 não renovam. Login bem-sucedido inicia o prazo; logout destrói a sessão.

Configurar também timeout servlet de 30 minutos como limpeza de sessões abandonadas. O instante explícito garante a semântica mesmo se uma requisição pública tocar incidentalmente a sessão do container. Integrar filtro após carregar contexto e antes de CSRF para atender à precedência 401; registro somente na cadeia de segurança, evitando execução dupla como filtro servlet. Atualização concorrente usa o maior instante observado e não recria sessão invalidada; requisição em andamento não pode ressuscitar autenticação após logout. Não criar agendador próprio, Redis ou repositório de sessões.

Se o container já eliminou a sessão, um identificador recebido e inválido produz `SESSION_EXPIRED`; isso também pode representar reinício/logout em outra aba. Sem cookie, responder `UNAUTHENTICATED`. Não é possível provar a causa histórica de um cookie inválido sem armazenamento adicional, desnecessário aqui. O texto da spec será mostrado nesses casos de sessão anteriormente existente; jamais registrar o identificador.

Testar a política com `Clock` controlável em 29:59.999, 30:00 e além, renovação e não renovação por rotas públicas/rejeitadas. MockMvc prova integração com a política, mas não o temporizador real do container. Um teste com servidor em porta aleatória, duração curta apenas no teste e espera limitada prova descarte nativo e reuso do cookie antigo sem aguardar 30 minutos. Navegador real prova atributos de cookie, F5, fechar/reabrir sem restauração e voltar pelo histórico; restauração automática de sessão permanece fora de escopo.

## Conta local e backend por camada

**Entity e repository:** não criar. A spec pede uma única conta reconstruída a partir do ambiente em cada inicialização, sem cadastro ou alteração em execução. `InMemoryUserDetailsManager` e BCrypt atendem inclusive após reiniciar, sem tabela, seed idempotente ou migração. O banco da 0001 permanece como está. Não inventar service transacional onde não há escrita no banco.

Adicionar starters de segurança e testes compatíveis com o BOM Boot 4.1.1, sem atualizar Java/Angular. Validar artefatos e imports pela versão efetivamente resolvida; exemplos Boot 3 não são autoridade para nomes no Boot 4.

Configurar `BANK_AUTH_EMAIL` e `BANK_AUTH_PASSWORD`, obrigatórios tanto na execução local direta como no profile `docker`. Classe de propriedades com acesso explícito e `toString()` redigido; validar presença/formato/limites emitindo somente nomes das propriedades ausentes/inválidas. Evitar validação que imprima rejected value da senha no relatório de binding. Codificar com BCrypt uma vez no início e não manter senha no objeto do usuário autenticado. No teste, usar credenciais sintéticas geradas em configuração de teste, sem valor literal versionado e sem ler variáveis locais.

Arquivos novos sob `backend/src/main/java/com/mybank/`:

| Caminho | Responsabilidade |
|---|---|
| `auth/dto/LoginRequest.java`, `auth/dto/UserResponse.java` | Entrada validada/redigida e identificação pública |
| `auth/InvalidCredentialsException.java` | Falha uniforme da autenticação |
| `auth/AuthService.java` | Delegação ao provider e tradução para exceção de domínio; sem servlet |
| `auth/SessionActivityService.java` | Regra temporal pura com Clock, sem servlet |
| `auth/AuthController.java` | Login, me, logout e bootstrap CSRF; HTTP e DTOs |
| `auth/SessionAuthentication.java` | Adaptador web de persistência da autenticação e logout |
| `auth/SessionActivityFilter.java` | Expiração, precedência 401 e atualização segura de atividade |
| `auth/LocalAccountProperties.java`, `auth/LocalAccountConfig.java` | Configuração obrigatória e provider de conta local BCrypt |
| `auth/SecurityConfig.java` | Cadeia, cookies, CSRF, Clock, handlers e allowlist |
| `shared/error/ApiProblems.java` | Construção única de ProblemDetail, reutilizada por MVC e filtros |
| `shared/error/GlobalExceptionHandler.java` | Validação, erro de domínio e falha MVC sem dados internos |

Foi acrescentado o validador de senha UTF-8 `auth/PasswordInputValidator.java`, acompanhado de `auth/ValidPassword.java`: Bean Validation exige a anotação de constraint separada de seu validador. A mesma validação atende DTO e configuração, com cobertura de limite UTF-8 nos testes. Handlers pequenos de segurança são beans em `SecurityConfig`, utilizando `ApiProblems`, sem gerar uma classe por lambda.

Alterar `backend/pom.xml` e `backend/src/main/resources/application.yml` (propriedades, cookies, timeout, erros e Jackson). O profile `application-docker.yml` não precisa de novas credenciais: herda propriedades comuns. Alterar `docker-compose.yml`, `.env.example` e `README.md` para passar/documentar as duas variáveis obrigatórias, sem valores reais. O arquivo `.env` não é lido automaticamente ao executar Maven fora do Compose; documentar variáveis da sessão PowerShell ou configuração local ignorada.

Testes sob `backend/src/test/java/com/mybank/`:

- `auth/AuthServiceTest.java`: sucesso, ambos os erros de credencial, não exposição de senha.
- `auth/SessionActivityServiceTest.java`: limites temporais e renovação com Clock fixo/mutável.
- `auth/LocalAccountConfigTest.java`: ambiente ausente/parcial, configuração inválida, BCrypt, reinício com mesma configuração e diagnóstico sem segredo; usar contexto isolado.
- `auth/AuthControllerTest.java`: fatia MVC com segurança habilitada; contrato JSON, validação, unknown fields, erros e CSRF; entrada inválida não cria sessão autenticada nem HttpSession.
- `auth/AuthSessionIntegrationTest.java`: fluxo real login → me → logout → cookie antigo, fixação, expiração via Clock, atividade pública/403, health e ausência de redirecionamentos HTML.
- `auth/SessionTimeoutIntegrationTest.java`: servidor real com timeout curto, cookie jar e espera limitada; não substituir pelo mock de sessão.
- `support/AuthTestConfig.java`: dados sintéticos gerados por execução, relógio controlado quando necessário; `src/test/resources/application-test.yml` para H2 e isolamento de profile.
- Alterar `MyBankApplicationTests.java` para ativar profile e configuração sintética de teste, sem exigir variáveis locais. Testes da configuração ausente não importam essa fixture, para não mascarar a falha esperada.

## Frontend: models → service → componentes → rotas

Angular 21: Reactive Forms tipados/nonNullable; não usar Signal Forms estáveis de versões posteriores. Manter standalone, OnPush, signals de leitura e SCSS. Gerar componentes pelo CLI instalado, sem recriar o projeto. Sufixo `.service.ts` segue a regra local explícita; componentes mantêm nomes modernos sem `.component`.

Novos arquivos em `frontend/src/app/`:

| Caminho | Responsabilidade e verificação |
|---|---|
| `core/auth/auth.model.ts` | LoginRequest, UserResponse, estado e falha discriminados |
| `core/http/api-problem.model.ts` | ProblemDetail e erros de campos, sem `any` |
| `core/auth/auth.service.ts` e `auth.service.spec.ts` | Único acesso HTTP; sessão em memória, CSRF, login/me/logout, mapeamento central de erros; HttpTestingController |
| `core/auth/auth-guard.ts`, `guest-guard.ts`, `auth-guards.spec.ts` | Guards funcionais aguardam `/me`; RouterTestingHarness com rotas reais; nomes gerados pelo CLI instalado |
| `features/auth/login/login.ts`, `.html`, `.scss`, `.spec.ts` | Campos, validação, pendência, erros acessíveis e tentativa novamente |
| `features/dashboard/dashboard.ts`, `.html`, `.scss`, `.spec.ts` | Confirmação de acesso, e-mail e logout; falha sem confirmação falsa |

Alterar `frontend/src/app/app.config.ts` para configurar HttpClient/XSRF; `app.routes.ts` para lazy `/login` e `/dashboard`, raiz e wildcard encaminhando ao dashboard protegido. Preservar título/outlet em `app.ts`/`app.html` e testes existentes; ajustar `app.spec.ts` somente se novos providers exigirem. `app.scss` estiliza o cabeçalho e `src/styles.scss` contém as variáveis e estilos comuns das páginas. Base relativa `/api/auth` centralizada no service, preservando proxy/nginx; não ativar CORS nem espalhar URL absoluta.

Estado explícito: `unknown`, `checking`, `authenticated`, `anonymous`, `unavailable`. Em carregamento, não renderizar identificação protegida. Em F5 consultar `/me` antes de liberar dashboard; guest guard também consulta para redirecionar usuário autenticado. Revalidar ao navegar para rotas protegidas e no retorno da página por `pageshow` restaurado, sem polling que manteria a sessão viva. Evento de foco/visibilidade pode disparar uma única revalidação ao retornar após inatividade; documentar que essa consulta é atividade autenticada.

Sem sessão, redirecionar ao login; 401 de `/me` remove identificação e mostra mensagem de expiração quando `code` indicar sessão expirada ou quando havia estado autenticado. 401 do login vira apenas erro de credenciais. Falha de rede/5xx ao recuperar sessão leva ao login em estado de indisponibilidade com botão para tentar consultar novamente, sem loop entre guards e sem afirmar que a sessão expirou. Nesse estado, não enviar novo login até a tentativa de recuperação resolver ou a pessoa escolher explicitamente entrar de novo. Timeout finito para chamadas impede loading infinito.

Login inválido não faz HTTP; erros `errors[]` aparecem nos respectivos campos. Login em andamento bloqueia envio duplicado; falhas de rede/5xx usam exatamente `Não foi possível entrar. Tente novamente`. Formulário com labels, `autocomplete=username/current-password`, foco visível, mensagens associadas por `aria-describedby` e aviso geral anunciado por `role=alert`; senha não é persistida em storage.

Logout limpa estado e navega somente após 204 ou 401 (sessão já ausente); rede/5xx mantém erro e permite repetir sem afirmar sucesso. Mesmo se a resposta de logout se perder depois de invalidar no servidor, a repetição receberá 401 e encerrará o estado local. Ao receber 403 renovar CSRF e permitir nova tentativa explícita.

Service compartilha consulta `/me` em andamento; serializa mutações e usa geração de estado para ignorar respostas antigas (por exemplo `/me` iniciado antes de logout ou 401 anterior a novo login). Não permitir que cancelamento de uma inscrição trate POST como desfeito no servidor. Incrementar geração ao iniciar mudança de sessão e preservar snapshot em falha de logout; consultas concorrentes não restauram estado anterior. Usar cancelamento no ciclo de vida dos componentes. Não introduzir interceptor global para três endpoints: mapeamento central fica no service e distingue operação/código.

## Decisões e riscos

| Escolha | Alternativa | Motivo / custo |
|---|---|---|
| Sessão no servidor + cookie HttpOnly | JWT no navegador | Logout invalida imediatamente; menos mecanismos. Migrar para múltiplas instâncias exigirá reavaliar armazenamento de sessão |
| Conta configurada em memória | Usuário JPA com seed | Atende à única conta local sem schema; cadastro real exigirá nova spec e persistência |
| Política pequena com Clock | Somente timeout servlet | Testa limite exato e não renova por health/CSRF/403; exige revisar posição do filtro e concorrência |
| Proxy de mesma origem | CORS com credenciais | Reaproveita 0001 e permite XSRF padrão do Angular |
| Reactive Forms | Signal Forms | Compatível com Angular 21 instalado |

A decisão mais cara de reverter é **sessão no servidor com cookie**, pois atravessa contrato, segurança, CSRF, estado da interface e futuros requisitos de escalabilidade. Não há necessidade de JWT, Redis, banco de usuários ou nova biblioteca visual para esta entrega.

Riscos principais: APIs de Boot 4 diferentes dos exemplos antigos; senha exposta por record/binding/log; reativação de sessão por resposta concorrente; cookie não enviado por atributos incorretos; 403 mascarando logout expirado; sessão restaurada pelo navegador; teste mock que não exercita timeout do container. As verificações acima e em `tasks.md` cobrem cada risco. Não prometer invalidação ao fechar navegador com restauração habilitada.

## Referências técnicas

- [Spring Security — persistência e gerenciamento de sessão](https://docs.spring.io/spring-security/reference/servlet/authentication/session-management.html): estratégia de autenticação e persistência explícita do contexto.
- [Spring Security — CSRF para SPA](https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html): cookie/header, tokens adiados e renovação após login/logout.
- [Angular — segurança HTTP/XSRF](https://angular.dev/best-practices/security): integração de cookie e header na mesma origem.

Consultar a documentação da versão efetivamente resolvida na implementação; estas referências sustentam o desenho, não substituem os testes.
