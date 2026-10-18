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
