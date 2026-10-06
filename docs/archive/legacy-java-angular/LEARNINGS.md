# Aprendizados

As entradas anteriores à spec 0007 documentam a aplicação Java/Angular e permanecem como histórico. Para a stack ativa, consulte .agents/ e README.md.

## 2026-10-06 — Separar CI de automações com permissão de escrita

**Contexto:** integração GitHub da spec 0006. O token padrão não acessa Projects,
e o fechamento nativo de Issues depende da branch padrão. Eventos de PR podem
trazer código e texto de contribuidores externos.

**Princípio:** CI de PR usa permissões de leitura e nenhum secret. Sincronização
de Project usa apenas metadados atuais e código da branch padrão; publicação
ocorre na main após gates. Testar regras de rastreabilidade e transições e
documentar a ativação/permissão pendente separadamente de YAML válido.

**Anti-pattern:** executar checkout da cabeça de PR em pull_request_target com
token de escrita, ou considerar Project/deploy ativos só porque há um workflow.

**Referências:** `docs/github-workflow.md`; `.github/workflows/`.

## 2026-10-06 — Revisar projeções e configurações ao mover a raiz

**Contexto:** após mover `my_bank/` para a raiz, as projeções de `.claude/`
usavam links do WSL inacessíveis pelo PowerShell. O harness também mantinha a
base `main`, embora o fluxo atual use `develop`, e o contexto Docker incluía
temporários de navegador ignorados pelo Git.

**Princípio:** ao reorganizar pastas, conferir os links pela ferramenta que os
consome, alinhar configurações com as regras atuais e revisar o `.dockerignore`
independentemente do `.gitignore`. No Windows, usar junctions nativas.

**Anti-pattern:** considerar um link válido apenas porque o alvo relativo está
correto, ou presumir que arquivos ignorados pelo Git ficam fora do build Docker.

**Referências:** `.agents/sync.ps1`, `harness.yaml`, `frontend/.dockerignore`.

## 2026-10-05 — Testar CSRF pelo fluxo que o navegador usa

**Contexto:** na spec 0002, quatro testes de fatia com o postprocessor genérico
de CSRF receberam 403, enquanto o fluxo real de integração passou. A aplicação
usa Spring Security 7.1.1 e configuração SPA com cookie e header XSRF.

**Princípio:** nos testes do contrato de autenticação, obter o token pelo
bootstrap público e enviar o cookie XSRF-TOKEN com o header X-XSRF-TOKEN. Isso
exercita a mesma proteção que o Angular e mantém os filtros habilitados.

**Anti-pattern:** desabilitar CSRF para fazer testes de validação passarem, ou
presumir que um helper produz a mesma requisição que a configuração SPA aceita.

**Referências:** spec 0002, tarefas T04–T05;
`backend/src/test/java/com/mybank/auth/AuthControllerTest.java` e
`backend/src/test/java/com/mybank/auth/AuthSessionIntegrationTest.java`.

## 2026-10-05 — Preservar estado estável ao cancelar uma transição

**Contexto:** a revisão do Angular encontrou logout durante recuperação de sessão.
Em caso de falha, restaurar o snapshot checking deixava a tela sem usuário e sem
consulta ativa, pois a resposta anterior havia sido invalidada por geração.

**Princípio:** a recuperação de uma mutação que falhou deve restaurar o último
estado estável, distinguindo dados confirmados de estados transitórios. Respostas
antigas não podem apagar um login novo nem ressuscitar uma sessão encerrada.

**Anti-pattern:** usar indiscriminadamente o estado transitório atual como ponto
de rollback de uma operação concorrente.

**Referências:** spec 0002, T06; `frontend/src/app/core/auth/auth.service.ts` e
teste de logout com recuperação pendente em `auth.service.spec.ts`.
