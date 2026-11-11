# Verificação

## Reprodução controlada

- Com a versão original do teste, uma pausa temporária de 6.100 ms no `json()` do dublê de histórico, via `Atomics.wait`, bloqueou o worker antes da entrega do corpo válido. O carregamento do detalhe depende das duas respostas. O prazo de 6.000 ms do `findByRole` venceu com “Carregando produto…” no DOM e a busca pelo título “Fone sem fio” falhou.
- Com a mesma pausa e a versão corrigida, o teste passou. Em ambas as rodadas, o comando foi `npm test -- src/App.test.tsx -t 'preserva preço desconhecido' --reporter=dot`. Resultado original de 1 falha e resultado corrigido de 1 teste aprovado, com 46 excluídos pelo filtro em cada rodada.
- O experimento mostra que a busca pode expirar antes de o React aplicar o detalhe, mesmo com respostas válidas. A carga original não foi instrumentada e a hipótese de descarte por `openSequence` não foi demonstrada. A pausa existiu só nas rodadas controladas.
- O teste entregue aguarda sessão, detalhe e histórico via `act` e a importação do gráfico via `vi.dynamicImportSettled()` em outro `act`. O título, o aviso, a mensagem de histórico vazio e a ausência de preço zero continuam sendo verificados. Os limites de espera do projeto foram preservados.

## Revisão do diff

O diff de código fica em um teste de integração. A rota real, a validação do contrato HTTP e os componentes reais continuam sob teste, com dublê apenas em `fetch`. Backend, banco, fluxo visual e configuração da aplicação estão fora do escopo da mudança.

## Portões locais

- `npm ci --prefer-offline --fetch-retries=0` instalou as dependências do lockfile. A primeira tentativa dentro do sandbox terminou com EPERM.
- `npm test -- src/App.test.tsx --reporter=verbose` passou com 47 testes.
- `npm run lint` passou.
- `npm run build:check` passou com as checagens de catálogo e fontes. O Vite emitiu aviso de tamanho de chunk.
- `node --test .github/scripts/*.test.cjs` passou com 50 testes.
- `actionlint` não está disponível localmente. Os gates de backend e a integração com PostgreSQL não foram executados localmente para esta alteração de teste do frontend.
- Cinco rodadas completas consecutivas de `npm test -- --run --maxWorkers=4 --reporter=default` passaram. A rodada anterior no sandbox foi interrompida após ficar sem emitir progresso, antes da sequência abaixo. O jsdom emitiu avisos sobre dimensões do gráfico.

| Rodada | Arquivos aprovados | Testes aprovados | Duração |
| --- | ---: | ---: | ---: |
| 1 | 61 | 826 | 172,42 s |
| 2 | 61 | 826 | 169,03 s |
| 3 | 61 | 826 | 375,74 s |
| 4 | 61 | 826 | 216,35 s |
| 5 | 61 | 826 | 252,53 s |
