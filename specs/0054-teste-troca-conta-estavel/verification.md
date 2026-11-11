# Verificação

## Evidência e diagnóstico

- O [CI do PR #297, tentativa 1](https://github.com/SamiaLuvanice/bestprice/actions/runs/42845036553/attempts/1) registrou o formulário de login com e-mail vazio e “Informe seu e-mail.” quando a busca pelo botão da segunda conta expirou.
- O login agenda o foco no título via requestAnimationFrame. O log comprova a validação local do e-mail vazio. A ordem exata dos eventos de foco no CI não foi capturada.
- Reprodução local controlada com `npm test -- src/research.test.tsx -t 'não restaura rascunho'`. Um listener temporário moveu o foco ao título depois do clique no campo de e-mail. A versão com digitação simulada reproduziu a mesma validação e a mesma falha ao buscar a segunda conta (1 falha).
- Com o foco deslocado e o preenchimento por mudança direta dos campos, o mesmo comando passou (1 teste). A versão final remove a instrumentação temporária e mantém a confirmação da segunda conta antes da navegação e a asserção de mensagem vazia após restaurar o histórico.

## Portões locais

- `npm run lint` passou.
- `npm test -- src/research.test.tsx` passou na versão final (15 testes).
- `npm test -- --run --maxWorkers=4 --reporter=dot` passou (826 testes em 61 arquivos). O jsdom emitiu avisos de dimensões de gráficos.
- `npm run build:check` passou após restaurar o tarball de Geist Mono 5.3.0 do lockfile. A primeira execução concluiu o build e falhou na checagem de fontes por ausência dos arquivos WOFF2 na instalação reaproveitada.
- `node --test .github/scripts/*.test.cjs` passou (50 testes).
- O `npm ci` local não foi concluído. Os comandos rodaram na worktree com as dependências reaproveitadas do checkout principal, com lockfile idêntico.

## Revisão do diff

Mudança restrita ao preenchimento dos campos no teste de integração. O fluxo continua passando pelo formulário e pela navegação da aplicação com respostas HTTP simuladas. Os limites de espera e as asserções de isolamento foram preservados. A cobertura de backend, banco e fluxo visual está fora da verificação local desta correção de teste.
