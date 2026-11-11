# Verificação da spec 0053

[Issue #290](https://github.com/SamiaLuvanice/bestprice/issues/290) · Base `origin/develop` em `6d5f38b`.

## Reprodução

Em `frontend/`, `npm test -- src/App.test.tsx -t 'sessão pendente|404 público'`
falhou em três casos antes da correção. Os dois cenários de login receberam
“Página não encontrada · BestPrice” durante a consulta. O endereço inexistente
exibiu “Carregando sua conta…” e o título principal do 404 estava ausente.

## Aceite

`npm test -- src/App.test.tsx src/NotFoundPage.test.tsx src/seo/staticSeo.test.ts`
passou com 77 testes em três arquivos.

- **AC01.** “Entrar · BestPrice” durante a consulta pendente, após HTTP 503 ou
  falha de rede e depois da recuperação. A nova tentativa exibe o formulário
  após o 401 e mantém o destino de retorno.
- **AC02.** O endereço inexistente mostra o 404 público desde a primeira
  renderização e após HTTP 429 na consulta de sessão. O teste confirma o
  título da aba, o foco no título da página e o link para entrar.
- **AC03.** Em `/produtos`, o teste confirma o estado de carregamento e a ação
  de nova tentativa após HTTP 503, com o formulário protegido ausente.

## Gates

- `npm ci --no-audit --no-fund` instalou 403 pacotes na worktree.
- `npm run lint` passou.
- `npm test -- --run`, na versão final, passou em 825 casos e atingiu o limite
  de 15 segundos em “confirma a ação sem alterar a URL e cancela sem DELETE”,
  em `src/dashboard/detail.test.tsx`.
- `npm test -- --run --maxWorkers=4` passou com 826 testes em 61 arquivos,
  incluindo o caso que havia atingido o limite.
- `npm run build:check` passou, incluindo as verificações do catálogo e das
  fontes. O Vite emitiu um aviso de chunk acima de 500 kB. A comparação por
  SHA-256 confirmou que `dist/404.html` e `dist/index.html` são idênticos.
- `node --test .github/scripts/*.test.cjs` passou com 50 testes. `actionlint`
  estava indisponível no ambiente local.

## Revisão e limites

A revisão do diff confirmou que a verificação de sessão continua nas rotas
que a usam e que o 404 público controla seu título e foco. A primeira versão
usava uma rota de layout sem caminho, o que falhou na checagem estática de
SEO. A versão final aplica o estado de sessão diretamente às rotas e
preserva os caminhos literais cobertos por essa checagem.

O aceite local usou Testing Library com respostas HTTP simuladas. A entrega
aguarda revisão independente e validação no ambiente publicado.
