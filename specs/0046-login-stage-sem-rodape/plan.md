# Plano — 0046

Issue [#239](https://github.com/SamiaLuvanice/bestprice/issues/239).
Base origin/develop `72689fe54579ab90af7e74ce108aaa88a509841d`.
Branch `feature/0046-issue-239-login-stage-sem-rodape`, na worktree homônima.

## Contrato e escopo

Não há mudança REST, backend, banco, dependências ou autenticação. Permanecem
GET /api/auth/me e POST /api/auth/login, seus DTOs, cookies, status e erros.
O fluxo de returnTo continua validado pela aplicação. Estados de sessão pendente,
503/rede, visitante, validação e envio conservam o comportamento, exceto pela
ausência do rodapé quando a rota atual é /login.

O código de develop já corresponde ao login aprovado em stage: foto à esquerda,
marca única, formulário e botão verde. Não reimplementar o formulário nem importar
Arimo: a equivalência de fonte é restrita ao Figma. Referências exportadas em
04/11/2026: desktop 59:44, 1440×1040; mobile 59:602, 390×844, em evidence/.

## Implementação

- App.tsx: retirar o rodapé no login inclusive durante a verificação de sessão
  e falha recuperável dessa verificação; conservá-lo nas demais rotas. Usar
  matchPath com o mesmo padrão /login do React Router, incluindo /login/ e /LOGIN.
- styles.css: a superfície do login ocupa no mínimo 100svh; remover o desconto
  fixo de 72px que reservava a altura do rodapé. Permitir crescimento vertical
  quando erros, zoom ou telas baixas exigirem. Não fixar altura nem ocultar overflow.
- App.test.tsx: regressão orientada ao conteúdo visível para /login e returnTo,
  estados de sessão, validação, envio e erro, com controle positivo de rodapé em
  outras rotas. Reusar os testes de credenciais/retorno/senha existentes.
- Suíte Playwright de login: demonstrar ausência de rodapé, conteúdo preservado,
  viewport completo, overflow, teclado e estados relevantes em 320/390/768/1280/1440.
  Reusar a interceptação de API existente; não acessar contas reais.

## Decisões

A condição pertence à composição da rota, não ao CSS global de footer: evita
esconder conteúdo compartilhado em outras páginas. A altura mínima, em vez de
altura fixa, permite rolagem em telas baixas. Não alterar tokens, componentes
shadcn, assets ou a implementação de LoginForm sem evidência de necessidade.
Não há decisão cara de reverter nem migração.

Revisão independente identificou que igualdade literal de pathname diverge do
matcher do React Router em barra final/maiúsculas. O uso do próprio matchPath
substitui essa comparação, com regressão Red/Green para as variantes.

## Verificação e entrega

1. Frontend implementa testes; registra Red esperado antes da correção e Green.
2. Lint, toda a suíte Vitest e build; automações Node. Playwright pertinente,
   comparando capturas com a referência aprovada. Executar também a suíte visual
   existente; divergências fora do escopo devem ser identificadas, sem atualizar
   silenciosamente baselines de outras telas.
3. Snapshots de login podem ser renovados somente após revisão documentada das
   diferenças intencionais com o Figma aprovado; mostrar evidências antes/depois.
4. arch-reviewer independente revisa o diff; QA independente verifica o aceite.
   Escritas de cada papel ficam em arquivos exclusivos de relatório.
5. Após todos os ajustes de código, executar doc-sync-onboarding por último;
   conferir AGENTS.md, CLAUDE.md e docs, atualizar PROGRESS e evidências.
6. Commit com Refs #239, push e PR para develop com Closes #239. Observar CI.
   Não promover stage ou publicar release. Integração depende de todos os gates
   aplicáveis e da revisão independente, sem bypass.

## Riscos e limites

A ausência do footer apenas no formulário pronto deixaria o bloco aparecer durante
carga/503; os testes devem cobrir a rota inteira. Snapshots antigos usam fontes do
sistema e podem conter divergências anteriores, que não autorizam redesign.
As validações de interface usam API controlada; não comprovam login contra banco
real nem deploy. Backend não será modificado; CI verifica regressões da stack.
