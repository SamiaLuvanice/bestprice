# Plano — 0028

Base: `origin/develop` em `fb71646`. Worktree `.worktrees/feature-0028-issue-157-ajustes-auditoria-redesign`.

## Contrato

Nenhuma alteração REST. `PUT/POST` de alerta continua enviando `target_price` como string
decimal com ponto e duas casas. O cliente aceita `99,90`, `99.90`, `1.899,90` e `1899,9`
na digitação e normaliza para `"99.90"`/`"1899.90"` sem usar `number` (manipulação de
string). Entrada inválida mostra erro local, sem chamar a API.

## Implementação (frontend)

1. AC01: `.product-image` com `flex: none` e tamanho fixo no cabeçalho do detalhe.
2. AC02: função pura `normalizeTargetPrice` testada (Red → Green); placeholder `99,90`;
   valor existente exibido com vírgula.
3. AC03: converter `hero-person.png`, `login-left.png`, `footer-phone.png` para WebP
   redimensionado (Pillow, largura máxima ~2× o tamanho renderizado, ≤ 300 KB);
   otimizar ou rasterizar `dashboard-preview.svg` se ficar acima da dobra; remover PNGs.
4. AC04: renomear tokens: o tema shadcn passa a usar a paleta da marca de forma
   documentada (`--primary` = ação verde ou rosa conforme decisão registrada no
   README) e o legado `--color-*` deixa de colidir; eliminar regras corretivas como
   `[data-variant="link"] { color: var(--color-primary) }`; `--muted` vira superfície e
   `--muted-foreground` texto; nenhum `text-muted` com cor de superfície.
5. AC05/AC10: Produtos sem hero; botão compacto "Adicionar anúncio" que abre/expande o
   formulário; linha móvel compacta (quadro 11); selo de variação em uma linha com
   rótulo "vs. preço anterior" fora da pílula.
6. AC06/AC07: detalhe com metadados agrupados (lista de definição curta + `<details>`),
   botões "Salvar alvo", "Pausar/Retomar alerta", "Excluir alerta" separados, e
   "Parar de monitorar" com variante destrutiva; eixo Y com BRL sem `compact`
   (ex.: `R$ 1.899`) e domínio com folga, tooltip exato mantido.
7. AC08/AC09: item de alerta móvel em grade; Início vazio sem indicadores.
8. AC11/AC12: posicionamento do cartão do hero; largura de conteúdo única
   (token `--page-gutter`) usada por cabeçalho e conteúdo.
9. AC13/AC14: remover órfãos e CSS morto; carregamento de sessão sem formulário.
10. AC15: atualizar baselines visuais intencionalmente, rodar axe em 320/768/1280.

## Verificação

`npm run lint`, `npm test -- --run`, `npm run build`, `npm run test:visual` (com
baselines regeneradas e registradas), auditoria axe Playwright, tamanho dos assets.
Backend não muda; Ruff/pytest rodados apenas como sanidade. Revisão independente
(arch-reviewer), QA e doc-sync-onboarding por último.
