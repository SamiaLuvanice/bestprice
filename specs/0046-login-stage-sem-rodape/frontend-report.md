# Frontend — spec 0046

Data: 04/11/2026. Worktree `feature-0046-issue-239-login-stage-sem-rodape`,
branch `feature/0046-issue-239-login-stage-sem-rodape`.

## Mudança implementada

- `frontend/src/App.tsx`: o rodapé compartilhado não é composto quando a rota
  atual corresponde a `/login` pelo mesmo `matchPath` do React Router. Inclui
  `/login/` e `/LOGIN`, aceitos pela rota existente. A condição também cobre
  sessão pendente, falha HTTP/rede e recuperação, antes da montagem do formulário.
  Query `returnTo` não muda a regra.
- `frontend/src/styles.css`: altura mínima da superfície de login passa de
  `calc(100svh - 72px)` para `100svh`, sem altura fixa ou corte de overflow.
- `frontend/src/App.test.tsx`: teste do login direto e com retorno verifica ausência
  do landmark de rodapé e preservação da orientação/link de início. Regressões
  adicionais cobrem carga, HTTP 503, rede e recuperação da sessão; verificações
  positivas preservam os rodapés da landing, página inexistente, sessão em outra
  rota e área autenticada. Testes existentes de envio/401/validação/rede passam
  a conferir ausência do rodapé durante esses estados.

Formulário, fontes da aplicação, tokens, assets, autenticação, API, backend e
dependências não foram alterados. Arimo continua apenas como equivalência no Figma.

## Instalação e TDD executados

Diretório dos comandos: `frontend/` desta worktree.

| Etapa | Comando | Resultado real |
|---|---|---|
| Dependências | `npm ci` | Concluído, 395 pacotes instalados e 396 auditados. Informou 12 vulnerabilidades moderadas; nenhuma atualização de dependência ou lock foi feita nesta tarefa. |
| Red, antes da mudança de produção | `npm test -- --run src/App.test.tsx -t 'mostra login sem rodapé' --maxWorkers=2` | 2 falhas esperadas, 15 testes não selecionados, 1 arquivo. Ambas encontraram `<footer>BestPrice · Acompanhe com clareza</footer>` quando o teste exigia ausência, em login direto e com `returnTo`. Exit 1; motivo funcional confirmado, não erro de ambiente. |
| Green, depois das duas linhas de produção | `npm test -- --run src/App.test.tsx -t 'mostra login sem rodapé' --maxWorkers=2` | 2 testes passaram; 15 não selecionados, 1 arquivo. Exit 0. |
| Regressão de fluxo após os complementos de teste | `npm test -- --run src/App.test.tsx src/LoginForm.test.tsx src/navigation/routes.test.tsx --maxWorkers=2` | **64/64 testes passaram em 3 arquivos**, 13,45 s. Exit 0. |
| Red da correção apontada pela revisão independente | `npm test -- --run src/App.test.tsx -t 'mostra login sem rodapé' --maxWorkers=2` | 2 falhas esperadas para `/login/` e `/LOGIN`, 2 testes passaram para `/login` e `returnTo`, 19 não selecionados. O rodapé reaparecia nas duas variantes aceitas pelo roteador. Exit 1, 29,66 s. |
| Green final, após usar `matchPath` | `npm test -- --run src/App.test.tsx src/LoginForm.test.tsx src/navigation/routes.test.tsx --maxWorkers=2` | **66/66 testes passaram em 3 arquivos**, 14,14 s. Exit 0; execução escalada para permitir subprocessos. |
| Lint final após a correção revisada | `npm run lint` | ESLint concluído, exit 0. |
| Build final após a correção revisada | `npm run build` | TypeScript e Vite concluídos, exit 0; 2662 módulos transformados, etapa Vite em 1,54 s. |
| Vitest completo final | `npm test -- --run --maxWorkers=2` | **397/397 testes passaram em 35 arquivos**, 199,87 s, exit 0. Execução escalada, pool padrão. |

Os testes de fluxo existentes também demonstram validação de credenciais,
controle Mostrar senha, erro preservando os campos e retorno permitido após
autenticação. A alteração não criou requisições ou respostas novas.

## Limites e handoff

O Vitest completo final ficou sem emitir o resumo por alguns minutos. Quando
foi solicitado o encerramento da sessão, o processo já havia concluído com
exit 0 e resumo positivo de 397 testes em 35 arquivos. Nenhuma execução alternativa
foi iniciada e não se atribui uma causa não demonstrada ao silêncio da saída.
Playwright, baselines e revisão visual estão sob responsabilidade do orquestrador
e da QA independente. O frontend não atualizou baselines nem realizou commit,
push, merge ou deploy.

Instalação, execuções Red/Green, suítes direcionadas, Vitest completo, lint e build
terminaram. Nenhum servidor ou processo de teste ficou ativo sob responsabilidade
deste papel.
