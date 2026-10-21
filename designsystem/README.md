# Protótipo visual BestPrice

`index.html` é uma página de demonstração do design system da BestPrice. Ela reúne tokens de cor e tipografia, componentes interativos e uma proposta de dashboard. Os produtos, preços e indicadores exibidos são exemplos, sem dados de lojas.

O arquivo veio do protótipo local `designsystem/index.html` do checkout principal. Sua autoria e a origem dos trechos que ele descreve como tokens Apple ainda precisam ser esclarecidas antes de reutilizar esses trechos em outro produto.

## Uso na aplicação

Conforme a spec 0015, `index.html` governa a identidade visual e seus tokens;
`logo-bestprice.png` é a logo oficial fornecida, preservada sem redesenho ou distorção.
`login.html` orienta a composição da entrada: se divergir dos tokens do catálogo,
prevalece `index.html`. Consulte a skill `frontend-design` e a regra ativa
`.agents/rules/frontend.md` antes de criar ou alterar uma tela.

A partir da spec 0025, `agent-guidelines.md` publica as regras automatizáveis
obrigatórias para agentes (toque 44 × 44 px, HTML semântico, contraste AA/AAA) e os
comandos das skills de design instaladas; `brand-spec.md` é o Brand Asset Protocol
lido pelas ferramentas de geração visual; `prototypes/` recebe os artefatos
gerados, fora do código da SPA.

Esta orientação rege a SPA da spec 0015. O protótipo continua separado da aplicação.
Produtos, preços, gráficos e controles da demonstração não autorizam novos recursos.
Os contratos e a acessibilidade da aplicação continuam obrigatórios.

### Registro de extensões

Antes de aplicar uma extensão, registrar aqui o token/componente/regra, o motivo,
as superfícies afetadas e a spec responsável.

| Extensão da spec 0015 | Motivo | Superfícies |
|---|---|---|
| Rosa de leitura `#c7005e` no claro e `#ff3ea5` no escuro; verde de ação `#39ff14` com texto preto | Preservar a identidade de `index.html` e dar contraste a texto, foco e ações nos dois temas | Links, títulos de destaque, estados, botões e foco |
| Cores semânticas próprias para queda, alta, aviso e erro; bordas de controles mais fortes | Distinguir significado de preço e erro sem depender apenas da cor e manter limites visíveis | Painel, produtos, histórico, alertas e formulários |
| Superfície sólida sob o vidro, base escura `rgba(29,29,31,.96)` e desfoque apenas quando suportado | Manter leitura sem `backdrop-filter`; a base escura preserva contraste do rosa mesmo composta sobre branco | Cabeçalho, menus e diálogos |
| Fontes do sistema com alternativas sans-serif | Evitar distribuir fonte sem licença confirmada e manter a hierarquia tipográfica da referência | Toda a SPA |

| Extensão da spec 0017 | Motivo | Superfícies |
|---|---|---|
| Vidro também na casca de entrada (`.login-card`), com `-webkit-backdrop-filter` antes de `backdrop-filter` para o minificador do Vite manter a forma sem prefixo: superfície sólida `--color-glass` por padrão; dentro de `@supports`, `backdrop-filter` com o novo token `--color-glass-translucent` (`rgba(251,251,253,.78)`) | Seguir a composição de `login.html` sem perder leitura em navegadores sem desfoque | Área de login da tela de visitante |
| Brilhos ambientes verde e rosa como `radial-gradient` que esmaece até transparente dentro da própria caixa, com os novos tokens `--color-glow-action` (`rgba(57,255,20,.28)`) e `--color-glow-primary` (`rgba(199,0,94,.16)`); decorativos (`aria-hidden`) e contidos num contêiner com `overflow: hidden` | Reproduzir a atmosfera de `login.html` sem gerar rolagem horizontal nem competir com o texto | Área de login da tela de visitante |
| Botão pílula de largura total (`.btn-pill`), reaproveitando `.primary-button` e os tokens `--color-action`, `--color-action-text` e `--color-action-hover` | Dar destaque à ação única do formulário sem criar uma cor nova | Botão "Entrar" |
| Card ilustrativo de vidro sem dados (ícone e frase de benefício, sem produto, preço, percentual, contagem ou horário); superfície sólida por padrão e `--color-glass-translucent` com desfoque só em `@supports` | `login.html` mostra produto e preços fictícios; a aplicação não pode exibir dados ilustrativos (`frontend.md`, AC29 da 0012) | Coluna visual da área de login |

| Extensão da spec 0020 | Motivo | Superfícies |
|---|---|---|
| Anel de foco dos campos (`outline: 2px solid var(--color-focus)` com recuo de 2px), além da cor da borda | Indicador de foco com contraste mínimo de 3:1, sem depender só da cor da borda | Campos E-mail e Senha do login |
| Mensagem de validação em texto (`.field-error`, `--color-danger-text`, 14px) e borda `--color-danger-text` no campo inválido (`aria-invalid`), sem `role="alert"` | Substituir o balão nativo por texto associado ao campo (`aria-describedby`), mantendo o alerta do servidor como único `alert` | Login |
| Botão em envio com `aria-disabled`/`aria-busy`, fundo `--color-surface`, texto `--color-muted` e cursor de progresso | Aparência distinta sem usar `disabled`, que tira o foco do botão | Botão "Entrar" |
| Logo reduzida (`.login-brand-compact`, mesma imagem oficial sem distorção) acima do título, só até 840px; altura original de 32px e superfície sólida sem desfoque nem brilhos | A coluna visual some em telas estreitas e a marca ficaria ausente | Login em até 840px na spec 0020; altura atualizada pela 0023 |

| Extensão da spec 0023 | Motivo | Superfícies |
|---|---|---|
| Arte `imagem-lateral.png` fornecida pelo responsável, sem logo, texto ou card sobrepostos; imagem de fundo com escala `cover` e prioridade ao topo apenas acima de 840px | Preservar a marca e a mensagem incorporadas à peça no recorte de janelas largas e baixas sem baixar a arte em telas estreitas | Metade esquerda do login acima de 840px |
| Composição em duas metades com formulário sobre branco; em até 840px, arte oculta e logo oficial compacta antes do título | Aproximar a entrada da referência de composição sem criar controles de cadastro, recuperação ou Google | Login responsivo da spec 0023 |

| Extensão da spec 0024 | Motivo | Superfícies |
|---|---|---|
| Fundo branco, superfície `#f8fafc`, texto `#0b172b`, apoio `#64748b`, verde de ação `#39ff14` com texto escuro, verde de leitura `#087c1e` e rosa de destaque `#c7005e`; tipografia sans do sistema | Reaproveitar a identidade oficial e manter texto e ações legíveis nas artes fornecidas; correção de contraste da revisão independente (5,37:1 sobre branco e 5,11:1 no selo, conforme cálculo local) | Landing pública em `/` |
| Hero em duas colunas com recorte CSS do lado ilustrado de `hero.webp`; texto, CTA e navegação em React | Evitar duplicar o texto incorporado à arte e preservar conteúdo selecionável e acessível | Hero desktop e versão empilhada móvel |
| Faixa de benefícios com `scroll-margin-top: 94px`, sequência de quatro passos, sete cartões de categorias e banner panorâmico com arte WebP | Traduzir a referência visual fornecida para superfícies responsivas sem dados fictícios de produto da API e manter a âncora `#funcionalidades` visível sob o cabeçalho fixo | Seções públicas da landing |
| Menu móvel com estado expandido, link para pular ao conteúdo, foco visível e movimento reduzido | Manter navegação operável em teclado e telas estreitas | Cabeçalho e toda a landing |

As peças da 0024 contêm produtos e preços **ilustrativos**; os cartões de categoria
não consultam anúncios nem funcionam como filtros. A ação “Criar conta gratuita”
apresenta aviso local enquanto o cadastro público não existir; “Entrar” abre o
login existente.

As regras de vidro, brilhos e card ilustrativo das specs 0017 e 0020 acima foram substituídas **somente no login** pela spec 0023. A logo compacta passa a 40px na entrada estreita. Os produtos, preços e percentuais da arte são ilustração estática, sem vínculo com anúncios reais ou com a conta da pessoa.

## Abrir o protótipo

Abra `index.html` diretamente no navegador, ou execute `python -m http.server 8000` nesta pasta e acesse `http://localhost:8000/`. A página usa CSS e JavaScript embutidos e não precisa da API, do banco nem de dependências de rede para a demonstração.

Este protótipo é uma referência visual separada da aplicação em `frontend/` (React e TypeScript). Alterações aqui não atualizam a interface da aplicação.

Referência visual externa: [Nudge Portfolio Template](https://nudge-folio.framer.website/). A cópia baixada desse site não faz parte desta tarefa.


## Extensões da spec 0027 — redesign aprovado

Referência: [Figma BestPrice](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice),
com fontes editáveis em `prototypes/2026-10-21-bestprice-figma/`. O usuário aprovou
implementar essa composição com shadcn/ui e Recharts/shadcn Charts. A identidade de
`index.html` continua governando verde, rosa, fonte do sistema e logo original.

| Token/componente | Motivo | Superfícies |
|---|---|---|
| Grafite `#18171b`, texto sobre grafite `#fff`, grade `#49474f` e rótulos `#d2d2d7` | Reproduzir o gráfico aprovado com contraste legível | Histórico real no detalhe; ilustração pública de preço |
| Tokens shadcn `background/foreground/card/primary/secondary/muted/accent/destructive/border/input/ring` mapeados à identidade existente | Reutilizar código oficial dos controles sem adotar outra marca | Button, Input, Card, Badge, Table, Skeleton, Separator e Chart |
| Conteúdo de até 1248 px, superfícies planas, linhas de produtos e navegação inferior até 700 px | Seguir os quadros desktop/mobile e manter o foco na tarefa | Área autenticada |
| Recharts com série em degraus, pontos reais, tooltip decimal exato e tabela textual expansível | Não sugerir preços intermediários ou completude de histórico paginado | Detalhe; mais registros ampliam o período |
| Artes fornecidas `hero-person`, `footer-phone`, `login-left` (originais PNG em `prototypes/2026-10-21-bestprice-figma/assets/`; na SPA, WebP redimensionado pela spec 0028); recortes vetoriais identificados como ilustração | Reproduzir as peças aprovadas sem preencher a conta com dados de demonstração | Landing e login |

A landing da 0027 substitui a composição da 0024: os CTAs levam a `/login`;
nenhum botão promete cadastro público. Os sete cartões de categorias e o aviso
local de cadastro pertencem à versão anterior. Ilustrações públicas são estáticas
com identificação de exemplo; a conta sempre depende da API.

## Tokens da aplicação (spec 0028)

A SPA usa dois grupos de variáveis em `frontend/src/styles.css`, sem nomes repetidos com
significados diferentes. Antes da 0028, `--color-primary` era rosa no CSS próprio e verde
no tema shadcn, e `text-muted` pintava texto com a cor de superfície `#f5f5f7`.

**Tema shadcn/Tailwind** (gera os utilitários `bg-*`, `text-*`, `border-*`):

| Token | Valor | Uso | Utilitários |
|---|---|---|---|
| `--primary` / `--primary-foreground` | `#c7005e` / `#fff` | Rosa da marca: links, títulos de destaque, foco, seleção | `bg-primary`, `text-primary`, `text-primary-foreground` |
| `--action` / `--action-foreground` / `--action-hover` | `#39ff14` / `#000` / `#65ff48` | Verde das ações principais; variante `default` do `Button` | `bg-action`, `text-action-foreground`, `hover:bg-action-hover` |
| `--muted` | `#f5f5f7` | **Superfície** discreta | `bg-muted` |
| `--muted-foreground` | `#626267` | Texto secundário | `text-muted-foreground` e `text-muted` |
| `--accent` | `#fce9f2` | Fundo rosa-claro de hover e seleção | `bg-accent` |
| `--destructive` | `#b42318` (texto branco) | Ação destrutiva ("Parar de monitorar") | `bg-destructive` |
| `--border` / `--input` / `--ring` | `#d2d2d7` / `#86868b` / `#c7005e` | Bordas, bordas de controle e anel de foco | `border-border`, `border-input`, `ring-ring` |

`text-muted` produz o texto secundário `#626267`, igual a `text-muted-foreground`: o tema
declara `--text-color-muted: var(--muted-foreground)`, namespace do Tailwind v4 que vale
só para utilitários `text-*`, e `bg-muted` continua a superfície `#f5f5f7`. Os testes
`frontend/src/tokens.test.ts` e a sonda de cores de `frontend/tests/visual/redesign.spec.ts`
protegem esse contrato e recusam regras que corrigem a cor de variantes do `Button`.

**CSS próprio** (classes legadas e componentes da aplicação): `--color-brand`,
`--color-brand-strong`, `--color-brand-soft`, `--color-text`, `--color-text-muted`,
`--color-surface`, `--color-surface-raised`, `--color-border-soft`, `--color-control-border`,
cores semânticas `--color-down`, `--color-up`, `--color-amber`, `--color-danger-*` e os tokens
do gráfico. Eles derivam do tema quando o significado é o mesmo
(`--color-brand: var(--primary)`, `--color-text-muted: var(--muted-foreground)`).
Só `--color-border` e `--color-action` repetem um nome do tema, com o mesmo valor
(`var(--border)`, `var(--action)`).

Decisão: `--primary` passou a ser o rosa da marca e o verde virou um token próprio de
ação. Assim `text-primary` e a variante `link` ficam legíveis sem regra corretiva, e o
botão principal continua verde com texto preto, como no visual aprovado. As cores de
elementos (`a`, `button`, `input`) ficam em `@layer base`, para que os utilitários do tema
vençam sem `!important`.

Largura de página: `--page-width` (1248 px) e `--page-gutter` (32 px; 20 px até 700 px)
formam `--page-inline`, usado por cabeçalho, conteúdo e landing, que compartilham a
mesma margem lateral.
