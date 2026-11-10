# Verificação — 0052

Ambiente local em 10/11/2026 com Windows, Node 22.18.0, Playwright 1.64.1
e Chromium headless 156.0.8078.4 (revisão 1248). O Vite da worktree usou
`PLAYWRIGHT_BASE_URL=http://127.0.0.1:5190`. As dependências vieram de
`npm ci --no-audit --no-fund` no frontend (403 pacotes).

## Reprodução em develop (`d1da76e`)

```powershell
npm run test:visual -- tests/visual/public-pages.spec.ts tests/visual/landing.spec.ts -g 'landing pública|A1 — selo' --workers=4
```

Resultado com 5 aprovados, 3 exclusões por projeto e 4 falhas. O Playwright
reportou uma captura estável em cada comparação. O diff teve 10 pixels
isolados em 390 px e 12 em 320 px, com a mesma contagem nos dois temas.
A inspeção dos PNGs de diff encontrou os pixels principalmente nas bordas
dos anéis tracejados do robô do CTA final. O Vite registrou conexões
recusadas para `/api/auth/signup`, uma consulta que ainda passava pelo proxy
durante as capturas.

O A1 passou em 11,1 s nessa execução. A verificação da 0051 registrou
`page.goto: Test timeout of 30000ms exceeded` na execução anterior.
O teste original fazia cinco navegações completas dentro desse mesmo prazo.

## Validação dos casos da issue

```powershell
npm run test:visual -- tests/visual/public-pages.spec.ts tests/visual/landing.spec.ts -g 'landing pública|A1 — selo' --workers=1 --repeat-each=2 --output=test-results/0052-repeat
```

- AC01 — As oito combinações de largura e tema passaram duas vezes com os
  PNGs versionados. A comparação aceita até 12 pixels divergentes apenas
  nas capturas da landing de 320 e 390 px. O teste emula movimento reduzido
  e simula sessão de visitante e cadastro desabilitado.
- AC02 — O A1 passou em 7,5 s e 13,1 s. Cada execução verificou quatro limites
  do selo em 320, 390, 768, 1280 e 1440 px após uma única navegação. As seis
  exclusões da execução focada correspondem ao A1 agendado para outros
  projetos de viewport.

## Primeira execução completa

`npm run test:visual -- --workers=4 --reporter=dot` terminou com 311
aprovados, 449 exclusões por projeto e uma falha. Os casos da issue
passaram. Em 320 px, a verificação AC12 do menu mobile ficou com o
diálogo visível após clicar em “Demonstração” e esgotou os 5 s de
`toBeHidden`. O trace local confirmou que Esc e o botão de fechar
passaram antes do clique na âncora.

Essa rodada coincidiu com a repetição focada e parte da execução do
Vitest. O Vitest registrou cinco falhas em testes de integração com
duração de 20 a 33 s antes de ser interrompido. A coincidência motivou a
reexecução das suítes em sequência. O ambiente também registrou
`ECONNREFUSED` para consultas de cadastro em outros cenários do Playwright.

## Execução completa em isolamento

`npm run test:visual -- --workers=4 --output=test-results/0052-full-isolated`
terminou com **312 aprovados, 449 exclusões por projeto e zero falhas** em
9,4 min, com retentativas desativadas (AC03). O menu de 320 px passou em
10,5 s e o A1 passou em 7,2 s. O Vitest foi iniciado depois que o Playwright
encerrou.

## Portões de qualidade

| Comando | Resultado |
| --- | --- |
| `npm run lint` | Aprovado |
| `npm run build:check` | Aprovado, incluindo as verificações de catálogo e fontes |
| `npm test -- --run --maxWorkers=4` | **825 testes em 61 arquivos**, todos aprovados em 141 s |
| `node --test .github/scripts/*.test.cjs` | **50 aprovados** |
| `git diff --check` | Aprovado |

O `actionlint` estava indisponível no PATH. Backend e integração com
PostgreSQL ficaram fora dos gates locais desta alteração de testes frontend.

## Revisão do diff

O isolamento de API se restringe à captura da landing. O comparador usa os
mesmos PNGs de referência, mantém o limite de zero pixels nas outras
larguras e deixa login e 404 com a configuração padrão. A1 conserva os
quatro limites geométricos nas cinco larguras e remove recargas e rolagens
que não participam da medição em movimento reduzido. O diff foi revisado
à luz de `.agents/rules/architecture.md` e `testing.md`. A alteração
fica na suíte Playwright e na documentação, com os dublês na fronteira HTTP.

## Sincronização do onboarding

O guia de frontend registra o comportamento das capturas e a execução
isolada. O progresso da spec 0052 e o aprendizado sobre isolamento de API
e tolerância por cenário foram documentados. `AGENTS.md`, `CLAUDE.md` e
`docs/index.md` foram conferidos. Os links locais para esta verificação
e o `git diff --check` passaram.
