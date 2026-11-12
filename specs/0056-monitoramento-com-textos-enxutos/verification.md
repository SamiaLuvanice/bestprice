# Verificação da spec 0056

## Critérios de aceite

- Formulário e lista: os testes existentes verificam a ausência das quatro frases, a ação de monitorar e a presença das colunas e informações de produto.
- Ordenação: o diff remove apenas os parágrafos e seus estilos. A tabela continua renderizando a sequência de entradas que recebe, sem mudança na consulta ou no reducer da lista.
- Desktop e mobile: quatro casos Playwright com API simulada passaram em 1440 px e 390 px, com e sem produtos. As capturas foram conferidas e estão em `frontend/test-results/monitoramento-*.png` na worktree.
- Figma: em Chrome, a busca em todas as páginas do arquivo BestPrice IA retornou “Nenhum resultado neste arquivo” para cada uma das quatro frases. Referência [Monitoramento desktop](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=151-11).

## Execução

- Antes da mudança no JSX, a execução focada de HeroTrackForm.test.tsx e products.test.tsx registrou 2 falhas esperadas por presença do texto e 18 testes aprovados.
- `npm test -- --run --maxWorkers=1 src/dashboard/HeroTrackForm.test.tsx src/dashboard/hero.test.tsx src/dashboard/products.test.tsx` — 33 aprovados.
- `npm run lint` e `npm run build:check` — aprovados.
- Com `EVIDENCE_0049=1` e `PLAYWRIGHT_BASE_URL=http://127.0.0.1:5179`, `npm run test:visual -- evidence-0049.spec.ts --project=viewport-1440 --grep 'monitoramento-vazio|monitoramento-produtos' --workers=1` — 4 aprovados.
- `node --test .github/scripts/*.test.cjs` — 50 aprovados.
- Revisão do diff e `git diff --check` — remoções de texto e CSS, com atualização dos testes correspondentes.
- `npm test -- --run --maxWorkers=4 --testTimeout=30000` — 826 aprovados em 61 arquivos. Rodadas anteriores foram interrompidas depois de falhas sob carga. Os 44 testes de detalhe e navegação também passaram ao serem reexecutados isoladamente com o mesmo limite de tempo.
- Backend, PostgreSQL e actionlint ficaram fora da execução local. O diff afeta somente JSX, CSS, testes de frontend e documentação, e o actionlint não está instalado.
