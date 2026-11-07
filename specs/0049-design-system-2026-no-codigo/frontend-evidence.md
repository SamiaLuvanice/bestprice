# Evidência do frontend — 0049

Papel `frontend`, worktree `.worktrees/feature-0049-issue-267-design-system-2026`. Comandos
executados em `frontend/` (Windows 11, Node local, Vitest 5.0.3). Contagens copiadas da saída.

## F1 — Tokens do Figma (AC01, AC03, AC04)

- **Teste:** `src/tokens.figma.test.ts` lê `designsystem/tokens/figma-variables-2026-11.json` e
  compara as 67 variáveis (cor clara, Noite das superfícies fixas, raio e espaço), os 7 efeitos,
  as durações de movimento, o bloco de movimento reduzido e os 22 estilos de texto com
  `src/styles.css`.
- **Red:** `npx vitest run src/tokens.figma.test.ts` → **75 failed | 27 passed (102)**. Motivos
  esperados: tokens ausentes (`--card-foreground`, `--surface`, `--chart-*`, `--sidebar-*`,
  `--status-*`, `--night-*`, `--radius-xl/2xl`, `--space-5/10/20/30`, sombras, `--ring-width`,
  `--blur-glass`, `--motion-base/enter`), valores divergentes (`--card` `#f5f5f7` ≠ `#ffffff`,
  `--action-hover` `#65ff48` ≠ `#2fe80c`) e os 22 utilitários de texto inexistentes.
- **Green:** novo bloco de tokens em `styles.css` (`:root`, `@theme inline`, `@utility`).
  `npx vitest run src/tokens.figma.test.ts src/tokens.test.ts` → **106 passed (106)**.
- **Asserções existentes alteradas:** nenhuma. `tokens.test.ts` não fixava `--card` nem
  `--action-hover`; continua verde sem mudança.

## F2 — Cor solta (AC02)

- **Teste:** `src/no-raw-colors.test.ts` varre `.ts/.tsx/.css` de `src/` (exceto testes) em busca
  de `#hex`, `rgb(`, `rgba(`, `hsl(` fora dos blocos `:root` e dos comentários.
- **Red:** `npx vitest run src/no-raw-colors.test.ts` → **1 failed**, 7 ocorrências: 5 seletores
  `[stroke='#ccc']`/`[stroke='#fff']` em `components/ui/chart.tsx`, 1 comentário
  `#259` em `AccountMenu.tsx` e 1 comentário `(#f5f5f7)` em `styles.css`.
- **Ajuste do teste:** comentários deixaram de contar (citam valores, não aplicam cor). Os
  seletores do `chart.tsx` entraram como exceção justificada: localizam o traço padrão do
  Recharts para repintá-lo com tokens; não aplicam cor.
- **Green:** `npx vitest run src/no-raw-colors.test.ts` → **1 passed**. O teste continua ativo
  nas Fases 2–4 como guarda (F23).

## Gates por fase

| Fase | `npm run lint` | `npm test` | `npm run build` |
|---|---|---|---|
| 0 (linha de base) | 0 problemas | 530 passed, 1 failed (instável por carga; ver verification.md) | ok |
| 1 (tokens e fontes) | 0 problemas | 40 arquivos, **634 passed** | ok; 9 `woff2` da Geist Mono no `dist/` |
