# Diretrizes de design para agentes (Web Design Guidelines)

Leia este arquivo antes de criar ou alterar qualquer HTML/CSS/JSX na SPA. Ele
publica as regras automatizáveis obrigatórias do projeto e os comandos das skills
de design instaladas (spec 0025). A referência visual principal é o Figma
aprovado (spec 0039); siga `.agents/rules/frontend.md` e o fluxo em
[`docs/apps/frontend.md`](../docs/apps/frontend.md). Os HTMLs locais e as skills
apoiam a implementação, preservando marca, contratos e acessibilidade; não
substituem o Figma nem autorizam redesign ou novas interfaces. Sem acesso MCP,
use exportações Figma com origem/data/dimensões e registre limites. Novas bridges
ou automações de ferramentas de design exigem autorização específica.

## Regras automatizáveis obrigatórias

| # | Regra | Critério | Origem |
|---|---|---|---|
| 1 | Área de toque mínima | Botões e links interativos com alvo de pelo menos 44 × 44 px (inclusive em telas estreitas) | Spec 0015, AC05; `frontend.md` |
| 2 | HTML semântico para SEO e a11y | Tags `header`/`nav`/`main`/`section`/`article`/`footer`, `label` visível em campos, `button` para ações, `a` para navegação; sem `div` clicável sem papel e sem `aria-label` ausente em botão só de ícone | `frontend.md`; skill `ui-ux-pro-max`, prioridades 5 e 8 |
| 3 | Contraste AA/AAA | Texto ≥ 4,5:1 (ou 3:1 em texto grande); limites de controles e foco ≥ 3:1 contra o fundo adjacente, nos temas claro e escuro | Spec 0015, AC03; WCAG 2.2 AA |
| 4 | Tokens de cor, não hex solto | Componentes usam os tokens do design system; nova cor exige registro em `designsystem/README.md` | `frontend.md`; skill `ui-ux-pro-max`, prioridade 6 |
| 5 | Movimento reduzido | Animações não essenciais respeitam `prefers-reduced-motion` | Spec 0015, AC05 |
| 6 | Sem rolagem horizontal | Nenhum viewport de 320, 390, 768 ou 1280 px causa scroll horizontal da página | Spec 0015, AC04; spec 0029 |

A apresentação da marca na SPA usa o componente compartilhado `Brand`
(`frontend/src/components/Brand.tsx`): nome “BestPrice”, fonte `--font-display`,
peso 600 e tracking `-.011em`. Variações de tamanho por superfície preservam
ícone quadrado, nome sem quebra e alinhamento horizontal. O componente fornece
um único nome acessível; em links ou ilustrações já nomeados, use `decorative`
para que o contêiner forneça essa identificação. Ver a decisão da
[spec 0029](README.md#marca-compartilhada-na-spa-spec-0029).

## Skills de design instaladas

- **ui-ux-pro-max** (`ui-ux-pro-max`): catálogo pesquisável de estilos (Bento Grid,
  Minimalismo, etc.), 192 paletas, pares tipográficos, 119 diretrizes de UX e regras
  por produto. Antes de decidir estilo/paleta/tipografia, consulte localmente:

  ```powershell
  python .agents/skills/ui-ux-pro-max/scripts/search.py "marketplace price monitoring dashboard" --design-system
  python .agents/skills/ui-ux-pro-max/scripts/search.py "focus not obscured" --domain ux
  ```

  Não persista saída sem verificar; a identidade oficial prevalece sobre a sugestão.

- **huashu-design** (`huashu-design`): gera protótipos HTML de alta fidelidade,
  decks e animações a partir do Brand Asset Protocol. Saída em
  `designsystem/prototypes/`; ver `designsystem/brand-spec.md`. Não roda scripts de
  rede (TTS, busca de imagens) sem pedido explícito e credenciais externas.

- **impeccable** (`impeccable`): crítica de design com detector determinístico de
  anti-padrões, sem serviço externo. Execute sobre markup novo ou alterado:

  ```powershell
  & .agents/skills/impeccable/scripts/impeccable.cmd detect frontend/src --json
  ```

## Regressão visual

A suíte Playwright em `frontend/tests/visual/` captura snapshots nos viewports 320,
390, 768 e 1280 px, com emulação de esquema clara e escura (o produto usa tema claro
fixo, spec 0016). Rode `npm run test:visual` em `frontend/` antes de entregar
mudança visual; baselines só mudam por revisão explícita (escreva com
`--update-snapshots` e mostre o diff).
