# Aprendizados

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
