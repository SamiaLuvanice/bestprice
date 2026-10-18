# Verificação — 0025

## Escopo observado

Mudança somente de harness/ferramentas e documentação: skills de design novas em
`.agents/skills/` via CLI `skills` (lock atualizado), arquivos de diretrizes e
protocolo de marca em `designsystem/`, regras ativas atualizadas e suíte Playwright
de regressão visual em `frontend/`. Nenhuma alteração de comportamento de produto,
API, backend ou banco. A identidade oficial permanece em `designsystem/index.html`
(spec 0015) e a skill `frontend-design` permanece obrigatória.

## Instalação e validação das skills

| Skill | Instalação | Validação observada |
|---|---|---|
| ui-ux-pro-max | `npx skills@latest add nextlevelbuilder/ui-ux-pro-max-skill --skill ui-ux-pro-max -y --copy`; estrutura `data/`, `references/`, `scripts/`, `SKILL.md` completa | `python .agents/skills/ui-ux-pro-max/scripts/search.py "price tracking marketplace dashboard" --design-system` retornou pattern Marketplace, estilo, paleta e regras offline; `--domain ux` com "touch target minimum size" retornou 3 diretrizes (WCAG Target Size, 44pt iOS, 48dp Android). Avaliação do ecossistema: Gen Safe, Socket 0 alerts, Snyk Low Risk. |
| huashu-design | `npx skills@latest add alchaincyf/huashu-design --skill huashu-design -y --copy`; subdiretórios `assets/`, `demos/`, `references/`, `scripts/` íntegros (conforme exigência do README) | Gen Safe, Socket 1 alert, Snyk Low Risk. O alert cobre scripts opt-in de rede (`scripts/cloud/tts-doubao.mjs`, `scripts/cloud/ai-review-video.py`, `scripts/fetch_images.py`); nenhum roda no fluxo normal e todos exigem credencial/pedido explícito — registrado em `designsystem/brand-spec.md`. |
| impeccable | `npx skills@latest add pbakaus/impeccable --skill impeccable -y --copy`; CLI em `scripts/impeccable.cmd` | `impeccable --version` → 4.6.0; `detect --help` operacional; `detect designsystem/index.html --quiet` → 46 anti-padrões e 4 notas no protótipo antigo (informativo; o detector é determinístico e local, sem serviço externo). |

As projeções `.claude/*` foram recriadas como junction por `.agents/sync.ps1`
(após remover as cópias reais geradas pela CLI, que o sync recusa). Pastas
`.junie/` e `.kiro/`, criadas pela CLI para outros assistentes, foram removidas e
ignoradas no `.gitignore`. `modules.yaml` e `sources.md` registram as skills novas.

## Gates locais

| Comando | Resultado observado |
|---|---|
| `npm ci`/instalação em `frontend/` | `@playwright/test` adicionado como devDependency; 0 vulnerabilidades. |
| `npm run lint` em `frontend/` | Passou. |
| `npm test -- --run` em `frontend/` | Passou: 293/293 testes em 27 arquivos (Vitest exclui `tests/visual/**` explicitamente). |
| `npm run build` em `frontend/` | Passou. |
| `npm run test:visual` em `frontend/` | 18/18 capturas (landing, login e 404 × temas claro/escuro × 320/768/1280 px) na geração de baseline e 18/18 na reexecução limpa. |
| `uv run ruff check .` em `backend/` | Passou (sem alteração de backend). |
| `uv run pytest -q` em `backend/` | 129 passed, 31 skipped (integração com `TEST_DATABASE_URL` indisponível localmente; backend não foi alterado). |
| `node --test .github/scripts/*.test.cjs` | 50/50 passaram. |
| `git diff --check` | Passou. |

## Detalhes da suíte visual

`frontend/playwright.config.ts` define projetos `viewport-320/768/1280`
(alturas 640 px) sobre Chromium headless, com `webServer` do Vite em
`http://127.0.0.1:5173`. `frontend/tests/visual/public-pages.spec.ts` intercepta
`/api/auth/me` com 401 para estado de visitante determinístico (sem backend),
espera imagens (inclusive `loading="lazy"`) terminarem de decodificar antes da
captura `fullPage` e compara snapshots com animações desabilitadas. Baselines em
`frontend/tests/visual/__screenshots__/` são locais (fontes do sistema variam por
máquina); execução em CI fica para tarefa futura, conforme "Fora de escopo" da spec.

O produto usa tema claro fixo desde a spec 0016; a emulação `colorScheme: dark`
não muda o render atual e os baselines escuros coincidem byte a byte com os claros
(conferido pelos tamanhos dos PNGs). A dimensão escura foi mantida para falhar caso
uma mudança futura altere o tema de forma inesperada, conforme o AC05 ajustado.

Uma instabilidade inicial na landing em 768 px (imagens lazy ainda carregando)
foi corrigida com rolagem prévia e espera por `img.complete`, regravada a baseline
e revalidada em execução limpa.

## Critérios de aceite

| Critério | Evidência e limite |
|---|---|
| AC01 | Três skills em `.agents/skills/` com estrutura íntegra, lock atualizado, `skills ls` as enxerga como projeto e junctions recriadas por sync. |
| AC02 | `search.py` respondeu offline nos modos `--design-system` e `--domain ux`, cobrindo estilos, paletas e diretrizes de UX (inclui Bento Grid e Minimalismo no catálogo instalado). |
| AC03 | `designsystem/brand-spec.md` mapeia logo, tokens extraídos de `index.html` e saída em `designsystem/prototypes/` (com README de uso); restrições de rede registradas. |
| AC04 | `designsystem/agent-guidelines.md` publica as seis regras automatizáveis (toque 44×44, HTML semântico, contraste AA/AAA, tokens, movimento reduzido, sem scroll horizontal) com vínculo a `frontend.md` e aos ACs da spec 0015; `frontend.md` e `workspace.md` exigem a leitura. |
| AC05 | Suíte Playwright 18/18 nos três viewports × emulação clara/escura, com baseline gerada e reexecução limpa; baselines escuros hoje idênticos aos claros por causa do tema claro fixo (spec 0016), diferença de evidência da redação original do intake, corrigida no AC05. |
| AC06 | Lint, 293 testes unitários e build verdes; ruff e pytest de backend sem regressão; `node --test` 50/50; doc-sync-onboarding executado ao final. |

## Limites

- Login real, área autenticada e navegação com backend não foram capturados; a
  extensão da suíte com mocks autenticados é tarefa futura.
- Baselines visuais são de lazer local; não há gate de CI para elas nesta entrega.
- A revisão de qualidade com `impeccable detect` foi executada apenas como
  demonstração do CLI sobre o protótipo; não virou gate automático.
