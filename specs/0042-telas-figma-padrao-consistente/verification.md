# Vistoria e entrega visual — 0042

Data: 29/10/2026. Proposta no Figma entregue para validação visual; aplicação não
implementada. O status da spec permanece `rascunho` até a validação da pessoa
responsável. Não houve commit, PR, merge ou deploy nesta etapa.

[Arquivo BestPrice IA](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA).

## Cobertura

As exportações em `before/` e `after/` usam o mesmo nome por quadro. Os IDs dos
20 quadros originais foram preservados. Desktop e mobile continuam com oito
quadros de página cada, sem seções de importação soltas como quadros adicionais.

| Quadro | ID | Dimensão | Evidência antes/depois | Resultado |
|---|---|---|---|---|
| Landing desktop | 16:2 | 1440×2880 | desktop-landing.png | Marca, CTAs e prévia atual do assistente; foto preservada |
| Entrar desktop | 59:44 | 1440×1040 | desktop-login.png | Marca, campos e ação rosa; foto preservada |
| Comparador desktop | 59:153 | 1440×1040 | desktop-comparator.png | Shell comum, margens, cards, tabela e ação |
| Histórico desktop | 59:204 | 1440×1040 | desktop-history.png | Shell comum, busca, filtros e cards alinhados |
| Monitoramento vazio desktop | 59:254 | 1440×1040 | desktop-monitoring-empty.png | Shell comum, vazio e indisponibilidade distintos |
| Monitoramento 0041 desktop | 151:11 | 1440×1040 | desktop-monitoring.png | Shell comum; gráfico e dados demonstrativos preservados |
| Assistente inicial desktop | 132:27 | 1440×960 | desktop-assistant.png | Shell comum; robô e recentes preservados |
| Assistente conversa desktop | 133:169 | 1440×960 | desktop-conversation.png | Shell comum; identificação BestPrice IA |
| Landing mobile | 12:2 | 390×2270 | mobile-landing.png | Marca e CTAs; foto e conteúdo preservados |
| Entrar mobile | 59:602 | 390×844 | mobile-login.png | Marca e formulário alinhados ao desktop |
| Comparador mobile | 59:681 | 390×844 | mobile-comparator.png | Cards e ação; header/nav com quatro destinos |
| Histórico mobile | 59:716 | 390×844 | mobile-history.png | Busca, filtros e cards; header/nav comuns |
| Monitoramento vazio mobile | 59:752 | 390×844 | mobile-monitoring-empty.png | Vazio, aviso e navegação comuns |
| Monitoramento 0041 mobile | 152:312 | 390×1920 | mobile-monitoring.png | Resumo com robô e aviso ocupa espaço antes vazio; nav comum |
| Assistente inicial mobile | 132:361 | 390×1190 | mobile-assistant.png | Header/nav; ajuda e aviso de processamento visíveis |
| Assistente conversa mobile | 132:468 | 390×1320 | mobile-conversation.png | Header/nav; identificação BestPrice IA |
| Fundamentos | 6:11 | 1440×1890 | system-foundations.png | Ação rosa, verde da marca, tipo e IA elevada |
| Biblioteca | 6:805 | 1440×1710 | system-library.png | Ação rosa/branco, IA elevada e nav atual |
| Estados do assistente | 137:43 | 1440×780 | system-assistant-states.png | Seis estados preservados; nova tentativa com altura 44 px |
| Estados do monitoramento | 152:535 | 1440×900 | system-monitoring-states.png | Conferidos; composição recente preservada |

## Correções compartilhadas

- Marca oficial reutilizada; IA menor, elevada e próxima do nome. A autoria das
  mensagens passou de BestPrice AI para BestPrice IA nas duas conversas.
- Header interno 80 px e sidebar 240 px, quatro destinos e seleção correspondente.
  No mobile, os quatro destinos têm ícone e rótulo. Não há Início na navegação.
- Nova conversa permanece junto de Conversas recentes; itens recentes não têm
  emojis ou pictogramas de produto. O robô original continua no assistente.
- Ações principais equivalentes rosa `#c7005e` com branco; verde da marca e cores
  semânticas de queda, erro e aviso preservadas. Controles internos têm ao menos
  44 px. Marketing e algumas amostras mantêm a forma de pílula como variação
  contextual; o controle mestre da aplicação usa raio de 12 px.
- Conteúdo interno usa margens de 32 px no desktop e 16–20 px no mobile. Títulos
  de 30 px desktop/24 px mobile, com variações contextuais no assistente e marketing.
- O espaço vazio do resumo do monitoramento mobile recebeu descrição, aviso da
  fonte indisponível e robô. Não promete atualização em tempo real.

## Componentes e tokens existentes

Foram conferidos os sete componentes mestres existentes: Campos/Link de anúncio,
Ações/Primária, Navegação/Mobile, Alertas/Notificação, Produtos/Linha monitorada,
Status/Queda de preço e Ações/Secundária. Campos e componentes sem divergência
semântica foram preservados.

O conjunto Ações/Primária `78:104` conserva as cinco variantes Normal, Foco,
Desabilitado, Hover e Carregando. O token existente `color/action` foi atualizado
para `#c7005e` e `color/action-text` para branco. Os textos das variantes estão
vinculados ao token de texto de ação. O foco usa contorno externo de 3 px vinculado
a `color/night`, distinguindo-se do preenchimento rosa. A variante desabilitada
mantém a atenuação. Navegação/Mobile `6:931` foi atualizada dentro do componente
original, mantendo seu ID e os quatro destinos atuais com ícones e rótulos.

## Verificação e limites

Conferência visual das 20 exportações após a edição, com atenção a títulos,
campos, contraste, listas, marca e navegação. A revisão detectou e corrigiu textos
acentuados truncados pela entrada nativa: o conteúdo foi reinserido por colagem de
texto/SVG no quadro e exportado novamente. Textos e vetores continuam como camadas nativas;
logo, robô e fotos continuam como imagens próprias do arquivo, sem rasterizar a
página inteira. A árvore de camadas foi conferida após recolocar seções que o
Figma inicialmente colou fora do quadro.

Branco sobre `#c7005e` tem contraste aproximado de 5,85:1; texto `#1d1d1f` sobre
branco, 16,83:1. Isso não equivale a uma auditoria WCAG completa. Não se comprova
teclado, leitor de tela, estados reais de rede, responsividade entre larguras,
fluxos funcionais ou vinculação de todos os objetos aos tokens a partir de PNGs.
Os frames mobile longos representam páginas roláveis; suas barras inferiores são
representações estáticas, sem promessa de comportamento fixo no viewport.

Não foram executados lint, build ou testes de aplicação, pois não houve alteração
de código. As provas são exportações reais dos quadros nomeados e inspeção pela
interface do Figma. Os exemplos de produtos/preços continuam identificados como
demonstrativos, exclusivamente Mercado Livre Brasil.

## Registro externo

Após autorização específica da pessoa responsável para o payload `issue.md`, foi
publicada a [Issue #222](https://github.com/SamiaLuvanice/bestprice/issues/222),
com o título `[0042] Harmonizar o padrão visual das telas do Figma`.
A Issue 221 pertence à spec 0041 e não foi reutilizada.

Verificação do registro externo:

- `gh issue list --repo SamiaLuvanice/bestprice --state all --search '0042 in:title' --json number,title,url`: nenhuma Issue anterior encontrada.
- `gh issue create --repo SamiaLuvanice/bestprice --title '[0042] Harmonizar o padrão visual das telas do Figma' --body-file specs/0042-telas-figma-padrao-consistente/issue.md`: criou #222.
- `gh issue view 222 --repo SamiaLuvanice/bestprice --json number,title,url,state,body,projectItems`: estado `OPEN`, título e conteúdo autorizado confirmados, incluindo link do Figma; `projectItems` vazio.

As operações de rede usaram a execução autorizada após a consulta inicial ser
bloqueada pela restrição de rede do ambiente. Não há vínculo com GitHub Project;
nenhuma sincronização foi presumida. O design continua aguardando validação,
sem implementação, commit, PR ou deploy.

O manifesto `evidence-manifest.json` registra dimensões e SHA-256 das 40 imagens.
A conferência final encontrou 20 pares antes/depois, dimensões preservadas e
nenhuma divergência entre os hashes registrados e os arquivos entregues.
