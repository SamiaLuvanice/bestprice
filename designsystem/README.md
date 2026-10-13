# Protótipo visual BestPrice

`index.html` é uma página de demonstração do design system da BestPrice. Ela reúne tokens de cor e tipografia, componentes interativos e uma proposta de dashboard. Os produtos, preços e indicadores exibidos são exemplos, sem dados de lojas.

O arquivo veio do protótipo local `designsystem/index.html` do checkout principal. Sua autoria e a origem dos trechos que ele descreve como tokens Apple ainda precisam ser esclarecidas antes de reutilizar esses trechos em outro produto.

## Uso na aplicação

Conforme a spec 0015, `index.html` governa a identidade visual e seus tokens;
`logo-bestprice.png` é a logo oficial fornecida, preservada sem redesenho ou distorção.
`login.html` orienta a composição da entrada: se divergir dos tokens do catálogo,
prevalece `index.html`. Consulte a skill `frontend-design` e a regra ativa
`.agents/rules/frontend.md` antes de criar ou alterar uma tela.

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
| Vidro também na casca de entrada (`.login-card`): superfície sólida `--color-glass` por padrão; dentro de `@supports`, `backdrop-filter` com o novo token `--color-glass-translucent` (`rgba(251,251,253,.78)`) | Seguir a composição de `login.html` sem perder leitura em navegadores sem desfoque | Área de login da tela de visitante |
| Brilhos ambientes verde (`--color-action`) e rosa (`--color-primary`) desfocados, decorativos (`aria-hidden`) e contidos num contêiner com `overflow: clip` | Reproduzir a atmosfera de `login.html` sem gerar rolagem horizontal nem competir com o texto | Área de login da tela de visitante |
| Botão pílula de largura total (`.btn-pill`), reaproveitando `.primary-button` e os tokens `--color-action`, `--color-action-text` e `--color-action-hover` | Dar destaque à ação única do formulário sem criar uma cor nova | Botão "Entrar" |
| Card ilustrativo sem dados (ícone e frase de benefício, sem produto, preço, percentual, contagem ou horário) | `login.html` mostra produto e preços fictícios; a aplicação não pode exibir dados ilustrativos (`frontend.md`, AC29 da 0012) | Coluna visual da área de login |

## Abrir o protótipo

Abra `index.html` diretamente no navegador, ou execute `python -m http.server 8000` nesta pasta e acesse `http://localhost:8000/`. A página usa CSS e JavaScript embutidos e não precisa da API, do banco nem de dependências de rede para a demonstração.

Este protótipo é uma referência visual separada da aplicação em `frontend/` (React e TypeScript). Alterações aqui não atualizam a interface da aplicação.

Referência visual externa: [Nudge Portfolio Template](https://nudge-folio.framer.website/). A cópia baixada desse site não faz parte desta tarefa.
