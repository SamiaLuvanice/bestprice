---
numero: 0042
titulo: Telas do Figma com padrão visual consistente
tipo: melhoria
prioridade: P2
status: rascunho
toca: [design, docs]
depende_de: [0039, 0040, 0041]
---

# 0042 — Telas do Figma com padrão visual consistente

Issue: [#222](https://github.com/SamiaLuvanice/bestprice/issues/222).

## Problema e público

Quem revisa o BestPrice no Figma encontra telas antigas e propostas recentes com
diferenças de marca, navegação, margens, tipografia e ações. Isso dificulta saber
qual padrão orientar na implementação. A pessoa responsável pediu vistoria de
todas as telas e correção das inconsistências com as últimas atualizações.

O público é a pessoa que usa e valida o produto, além de quem mantém o design.
É melhoria visual P2, sem incidente operacional. O escopo é o arquivo BestPrice IA
já utilizado nesta conversa, incluindo desktop, mobile, fundamentos, exemplos de
componentes e estados auxiliares, sem alteração da aplicação.

## Situação observada

A vistoria inicial identificou oito quadros desktop, oito mobile e quatro quadros
de referência/estados. Landing e login têm IA na linha de base antiga; há ações
verdes concorrendo com o rosa das propostas recentes. Comparador e Histórico
usam margens e superfícies diferentes do Monitoramento 0041. Várias navegações
mobile perderam os rótulos visíveis e a biblioteca ainda apresenta três destinos
antigos. O exemplo de assistente da landing também é anterior à 0040.

## Resultado esperado

Todas as telas seguem uma direção coerente com Assistente 0040 e Monitoramento
0041, mantendo a função de cada página. A vistoria identifica cada quadro e
registra antes/depois, decisões, correções e eventuais limites.

### Elementos compartilhados

A marca mantém o símbolo oficial, BestPrice e IA menor, elevada e próxima do nome.
Headers e sidebars internos têm alinhamentos e dimensões comuns, os quatro
destinos atuais e destaque apenas no destino correspondente. A navegação mobile
tem ícone e rótulo para Assistente, Comparar, Histórico e Monitorar.

Landing e login conservam navegação pública; não recebem sidebar de sessão.
Suas marcas, campos e ações acompanham os mesmos padrões visuais. Ilustrações e
fotos originais permanecem reconhecíveis, sem substituir ou redesenhar a marca.

As ações principais usam o rosa das propostas recentes, com texto branco; verde
permanece na marca, ilustração e indicação de situações favoráveis, com texto de
contraste adequado. Ações secundárias usam superfície clara, contorno e texto
escuro. Avisos, erros, indisponibilidade e exclusão conservam suas diferenças
semânticas; uniformizar a aparência não muda seu significado.

### Composição e conteúdo

As páginas internas alinham o conteúdo a uma mesma margem e hierarquia de
título, descrição, controles e seções. Tipografia, espaços, bordas e raios se
repetem em componentes equivalentes. Títulos e textos não se sobrepõem nem são
cortados; campos e botões têm dimensões coerentes e ações visíveis.

O Assistente mantém o robô, a escrita e conversas recentes sem pictogramas de
produto. O Monitoramento mantém gráfico de um anúncio identificado, valores
ilustrativos e seus estados de recuperação. Comparador e Histórico preservam
informações, ações e avisos sobre dados manuais. Exemplos da landing e da
biblioteca acompanham o padrão atual, sem apresentar resultados operacionais.

As versões anteriores de Monitoramento continuam identificadas como estado
vazio/indisponível, distinguindo-as da proposta com dados. Quadros não são
apagados para esconder diferenças. Os estados auxiliares compartilham os
controles e o vocabulário visual das telas principais.

## Critérios de aceite

- [x] **AC01 — Cobertura:** a evidência inventaria os 20 quadros encontrados, seus IDs, dimensões, função e resultado da vistoria; componentes compartilhados também são conferidos.
- [x] **AC02 — Marca:** desktop e mobile apresentam a marca oficial com IA elevada; variações por tamanho preservam proporção, leitura e proximidade do nome.
- [x] **AC03 — Navegação:** as telas internas usam o mesmo padrão de header/sidebar; todos os mobiles internos mostram os quatro destinos com ícones e rótulos completos, sem Início ou destinos legados.
- [x] **AC04 — Composição:** Comparador, Histórico, Assistente e Monitoramento seguem margens e hierarquia comuns; seções, campos e ações não têm sobreposição ou corte nas exportações de revisão.
- [x] **AC05 — Controles:** ações principais equivalentes usam rosa com texto branco e dimensões coerentes; secundárias, estados desabilitados, sucesso, alerta e erro continuam distinguíveis.
- [x] **AC06 — Público:** landing e login acompanham marca, tipografia e controles comuns, mantendo sua função pública, fotos e conteúdo; a prévia da aplicação na landing não apresenta navegação antiga.
- [x] **AC07 — Referência:** fundamentos e biblioteca mostram a direção atual, incluindo as quatro entradas mobile; componentes existentes não ficam anunciando padrões visuais contraditórios.
- [x] **AC08 — Estados:** vazio, carregamento, erro, envio e fonte indisponível são preservados e apresentados com a mesma linguagem de controle; dados fictícios continuam identificados.
- [x] **AC09 — Evidência:** existem exportações antes/depois dos quadros, comparação visual documentada e comprovação de texto/camadas editáveis; limites de a11y e comportamento estático são explícitos.
- [x] **AC10 — Escopo:** não há alteração de frontend/backend, contratos, integrações ou deploy; a proposta aguarda validação antes de implementar.

## Fora de escopo

- Criar novos recursos, ativar serviços externos, redesenhar o robô ou a logo.
- Implementar a aplicação ou transformar telas estáticas em fluxos funcionais.
- Trocar fatos, preços, condições de uso ou regras de negócio por motivos estéticos.
- Apagar as versões anteriores ou o trabalho da pessoa responsável.

## Suposições e pendências

- As versões mais recentes de Assistente e Monitoramento são a referência pedida
  pela pessoa responsável. A cor rosa de ação será estendida às ações equivalentes
  no Figma; a aplicação permanece com sua identidade implementada até aprovação.
- A autorização de edição pela interface do Figma já registrada continua aplicável.
  O MCP foi consultado e permanece limitado pela cota do plano Starter.
- Os quadros anteriores são preservados e harmonizados conforme sua função,
  inclusive a variante de monitoramento sem dados.
- A publicação do payload `issue.md` foi autorizada especificamente e gerou a
  Issue #222. A consulta de verificação não encontrou vínculo com GitHub Project;
  o design continua aguardando validação, sem autorização de implementação.
