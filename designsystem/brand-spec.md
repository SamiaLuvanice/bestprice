# Brand Asset Protocol — BestPrice

Protocolo de assets da marca para ferramentas de design conversacional (skill
`huashu-design` e equivalentes). Toda ferramenta que gerar artefato visual de alta
fidelidade para o BestPrice lê os assets reais deste repositório antes de desenhar e
grava a saída em `designsystem/prototypes/`. A identidade de `index.html` prevalece
sobre qualquer estilo sugerido por ferramenta externa.

## Assets de marca (nunca redesenhar)

| Asset | Caminho | Regra |
|---|---|---|
| Logo oficial | `designsystem/logo-bestprice.png` | Usar sem redesenho, recorte, distorção ou substituição (spec 0015, AC02) |
| Identidade de referência | `designsystem/index.html` | Governa cor, tipografia, espaçamento e forma |
| Composição de entrada | `designsystem/login.html` | Somente composição; em divergência, prevalece `index.html` |
| Arte da entrada | `frontend/src/assets/redesign/login-left.webp` | Arte do redesign (0027), convertida para WebP na 0028; a anterior `imagem-lateral.png` foi removida. Ilustração estática, sem dados de anúncio ou da conta; a marca oficial fica sobre a área clara da arte |

## Tokens oficiais (extraídos de `index.html`)

Cores: fundo `--bg: #ffffff`; superfície `--surface: #f5f5f7`; texto `--fg: #1d1d1f`;
apoio `--fg-2: #424245`, `--muted: #6e6e73`, `--meta: #86868b`; borda `--border: #d2d2d7`;
verde de ação `--accent: #39ff14` com texto `--accent-on: #000000`; rosa de leitura
`--accent-ink: #c7005e` (claro) e `#ff3ea5` no escuro (extensão 0015); semânticas
`--success: #16a34a`, `--warn: #eab308`, `--danger: #dc2626`.

Tipografia: `--font-display`/`--font-body` SF Pro com fallback Helvetica/Arial
sans-serif (fontes do sistema; não distribuir fontes de terceiros). Escala
`--text-xs: 12px` até `--text-4xl: 80px`, corpo em 17px, entrelinha 1.47.

Espaçamento e forma: escala 4–48px (`--space-1`…`--space-12`), raios 8/12/18px e
pílula `980px`, elevações flat/ring/raised, anel de foco rosa, movimento 150/220ms
com `prefers-reduced-motion`.

Superfícies de vidro: base sólida `--color-glass` sempre; desfoque
(`-webkit-backdrop-filter` antes de `backdrop-filter`, só dentro de `@supports`) com
`--color-glass-translucent`. Brilhos ambientes verde/rosa decorativos (`aria-hidden`)
dentro de contêiner com `overflow: hidden`.

## Saída dos artefatos gerados

- Diretório de saída: `designsystem/prototypes/` — nada gerado por IA entra em
  `frontend/` ou em outros diretórios de código sem revisão humana.
- Nome sugerido: `<yyyy-mm-dd>-<tema>-<tipo>.html` (ex.: `2026-10-18-alertas-prototipo.html`).
- Todo artefato declara no topo do HTML (comentário) a ferramenta, a data, o estilo
  escolhido e o vínculo com a spec; dados de produto nele são ilustrativos.
- Artefatos de protótipo não viram funcionalidade nem dados reais do produto.

## Restrições de execução das ferramentas

- Sem rede em tempo de execução nas suítes de teste; fontes do sistema, sem CDN.
- Scripts opt-in da skill `huashu-design` que acessam rede (TTS Doubao, API Volces,
  busca de imagens no Wikimedia Commons) só são executados sob pedido explícito da
  pessoa usuária, com credenciais em variáveis de ambiente fora do repositório.
- A revisão de qualidade de design usa o detector local da skill `impeccable`
  (`impeccable detect`), sem serviço externo.
