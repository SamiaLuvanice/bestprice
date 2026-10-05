# Verificação — spec 0002

Verificação local concluída em 2026-10-05. Backend, frontend e fluxo em Chrome
headless executados. Revisão independente: agente review_implementation_0002.

## Portões executados

| Portão | Comando e local | Resultado observado |
|---|---|---|
| Backend | `.\mvnw.cmd verify` em `backend/` | Exit 0, BUILD SUCCESS, JAR gerado; 23 testes, 0 falhas, 0 erros, 0 ignorados |
| Frontend build | `npm.cmd run build` em `frontend/` | Exit 0; bundle inicial 232,80 kB, dentro do orçamento |
| Frontend testes | `npm.cmd test -- --watch=false` em `frontend/` | Exit 0; 5 arquivos e 31 testes passando |
| Compose | `docker compose config --quiet`, credenciais sintéticas no ambiente do comando | Exit 0; configuração válida |
| Ponta a ponta | `node frontend/tmp/verify-auth-browser.mjs` | Exit 0; BROWSER VERIFICATION PASSED |
| Whitespace | `git diff --check` e inspeção dos arquivos novos | Sem erro; avisos de conversão LF/CRLF não alteram resultado |

Os relatórios XML de `backend/target/surefire-reports/` foram lidos e somados pelo
coordenador: 23 testes, sem falhas, erros ou ignorados. Builds/testes do Angular
precisaram de execução fora do sandbox, pois os subprocessos receberam `spawn EPERM`.
A execução final confirmou os resultados acima.

## Critérios de aceite

Os números seguem a ordem dos 18 critérios em `spec.md`.

| Nº | Critério | Situação | Evidência |
|---|---|---|---|
| 1 | Acesso anônimo redireciona ao login | Cumprido | Auth-guards.spec: raiz, dashboard e rota desconhecida; Chrome abriu dashboard e terminou no login |
| 2 | Login válido e página principal mínima | Cumprido | Integração real e Chrome: login, dashboard, e-mail e botão Sair; screenshot inspecionado |
| 3 | Credenciais inválidas sem revelar existência da conta | Cumprido | AuthSessionIntegrationTest compara corpos idênticos de usuário inexistente/senha errada; Chrome mostrou mensagem sem redirecionar |
| 4 | Autenticado não permanece no login | Cumprido | RouterTestingHarness e Chrome: acesso direto ao login terminou no dashboard |
| 5 | Logout invalida sessão no servidor | Cumprido | Integração e Chrome: logout confirmado, redirecionamento e requisição direta com cookie anterior retornou 401 |
| 6 | Falha de logout não anuncia sucesso | Cumprido | Dashboard/AuthService testes; Chrome bloqueou comunicação do logout, manteve dashboard com erro e permitiu repetir |
| 7 | Formulário inválido não envia login | Cumprido | Login.spec cobre campos vazios, e-mail malformado e limite UTF-8; Chrome confirmou mensagens e zero POSTs para formulário vazio |
| 8 | API valida entrada direta | Cumprido | AuthControllerTest: entrada ausente, nula, malformada e limite UTF-8; 400 com errors, sem sessão nova ou autenticação |
| 9 | Proteção na API e rotas públicas | Cumprido | MVC/integração: me e rota desconhecida sem sessão recebem 401; bootstrap/login públicos com CSRF quando aplicável; health público |
| 10 | Falha de rede no login e nova tentativa | Cumprido | AuthService/Login testes e Chrome: bloqueio de rede exibiu mensagem específica; nova tentativa com credenciais preenchidas autentica |
| 11 | Senha/hash/detalhes internos não expostos | Cumprido | Testes de redaction, configuração inválida, resposta de login e handler 500; logs da API real inspecionados; DTO retorna somente identificação pública |
| 12 | F5 mantém sessão válida | Cumprido | RouterTestingHarness verifica recuperação antes de exibir conteúdo; Chrome recarregou dashboard e recuperou o mesmo e-mail |
| 13 | Expiração no limite de 30 minutos | Cumprido | Clock prova rejeição em 30:00; servidor real descarta sessão; Chrome com timeout abreviado voltou ao login com mensagem de expiração |
| 14 | Requisição autenticada aceita renova prazo | Cumprido | Integração: me em 29:59.999 renova; health, bootstrap e rejeição 403 não renovam; política usa maior instante observado |
| 15 | Fechar navegador sem restauração exige login | Cumprido | Chrome fechou todo o processo e reabriu o mesmo perfil, sem restaurar sessão; dashboard redirecionou ao login |
| 16 | Conta disponível após reiniciar API | Cumprido | LocalAccountConfigTest recria contexto; processo real da API reiniciado com a mesma configuração autenticou novamente |
| 17 | Configuração ausente falha sem segredo | Cumprido | Runner testa cada variável e configuração inválida; processo real sem ambas falhou indicando BANK_AUTH_EMAIL/BANK_AUTH_PASSWORD |
| 18 | Testes independentes da conta local | Cumprido | Maven verify sem credenciais locais: fixture gera dados por execução, usa H2 e os 23 testes passam |

## Provas de regressão e revisão

- Expiração: trocar temporariamente `>=` por `>` fez
  `SessionActivityServiceTest#hasExpired_atIdleBoundary_rejectsExactlyThirtyMinutes`
  falhar (1 teste, 1 falha, exit 1).
- Logout: retirar temporariamente `SecurityContextLogoutHandler` fez
  `AuthSessionIntegrationTest#loginMeLogout_oldSessionCannotAuthenticateAgain`
  falhar (1 teste, 1 falha, exit 1).
- Ambas as alterações foram restauradas antes do Maven verify final verde.
- Revisão detectou rollback para checking durante logout com recuperação pendente.
  Correção preserva último estado estável e tem teste de me em voo, logout 503 e
  resposta 401 antiga. Revisão final de backend e frontend aprovada sem bloqueios.

## Método e limites

O verificador descartável em `frontend/tmp/` gerou credenciais somente em memória,
subiu o JAR em 8082 e Angular em 4302, dirigiu Chrome pelo protocolo de depuração
e encerrou somente os processos criados por ele. Screenshots locais de login e
dashboard ficaram em `frontend/tmp/auth-browser/` (ignorado) e foram inspecionados.
O roteiro precisou preencher novamente a senha após falha, pois o formulário a
limpa após tentativas; a execução final completou todos os casos.

O limite exato de 30 minutos usa Clock. No Chrome, timeout do container reduzido
temporariamente para um minuto; o padrão da aplicação permanece 30 minutos.
O teste real do Tomcat usa timeout de um segundo somente no contexto de teste,
pois a configuração do servidor é arredondada para minutos. Concorrência backend
é provada por interleaving determinístico, não por teste de carga. Restauração
automática do navegador permanece fora de escopo.

O fluxo ponta a ponta usou H2 local. Configuração Compose validada; a stack
Docker/PostgreSQL da spec 0001 não foi recriada. Não houve commit, push, PR, merge
ou deploy remoto. Não há lint configurado no frontend.
