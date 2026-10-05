---
name: drive-artefatos
description: Publicar artefato no Google Drive — imagem de referência do design, documento de decisão, e pergunta ao responsável técnico. Use ao terminar um desenho de interface, ao acumular dúvida que trava spec, ou quando pedirem para "mandar para o Drive", "registrar no Drive" ou "levar para o pessoal técnico".
---

# Artefatos no Google Drive

O repositório guarda o que é executável: código, spec, contrato. O Drive guarda o que
**uma pessoa lê** — desenho para aprovar, pergunta para responder, decisão para consultar
numa reunião. Não duplique: cada coisa mora num lugar só, e o outro lado aponta.

## Onde as coisas ficam

```
Drive/<pasta do projeto>/
  Artefatos/
    Índice dos artefatos            ← porta de entrada; atualize sempre
    Design — telas de referência/   ← imagens estáticas para anexar ou imprimir
    Perguntas ao responsável técnico/
```

Endereços canônicos — IDs de pasta e links — em [`.agents/sources.md`](../../sources.md).
Ao criar uma subpasta nova, registre lá; um artefato que ninguém acha não foi publicado.

## O índice é obrigatório

Todo artefato entra no **Índice dos artefatos**, com uma linha dizendo o que é e para quem
serve. Sem isso a pasta vira depósito em três semanas. Ao publicar qualquer coisa,
atualizar o índice faz parte da tarefa — não é passo opcional no fim.

## Imagem de referência de design

O canvas publicado é a **referência viva**; a imagem no Drive é cópia congelada para anexar
em e-mail, imprimir e levar a reunião. O índice diz sempre qual link é o vivo.

Para gerar imagem a partir de artboards `.dc.html`:

1. Converta cada artboard em HTML autônomo — mova o conteúdo de `<helmet>` para o `<head>`,
   descarte `<x-dc>` e o `<script data-dc-script>`, e resolva os holes de tema
   (`{{temaClass}}` vira `''` ou `'dark'`).
2. Rasterize com o Chrome já instalado:

   ```bash
   google-chrome --headless --disable-gpu --no-sandbox --hide-scrollbars \
     --force-device-scale-factor=2 --virtual-time-budget=6000 \
     --window-size=<w>,<h> --screenshot=<saida>.png "file://$PWD/<pagina>.html"
   ```

   `--virtual-time-budget` existe para dar tempo à fonte do Google Fonts carregar. Sem ele
   a captura sai na fonte de fallback.
3. **Confira a captura antes de publicar.** Abra o PNG e olhe. Fonte errada, coluna
   colidindo e bloco cortado só aparecem assim — foi exatamente desse jeito que se
   descobriu, uma vez, que dois artboards tinham sido publicados com o `<style>` sem fechar.

### O limite que você vai encontrar — medido, não estimado

**Upload de imagem pelo conector do Drive não funciona.** A ferramenta exige o conteúdo em
base64 dentro da própria chamada, e a chamada é construída a partir da saída do modelo — ou
seja, o base64 precisa primeiro ser lido para o contexto. Saída de comando acima de um
limite é persistida em arquivo em vez de devolvida, e o que está em arquivo não pode ser
reinjetado numa chamada de ferramenta. Nenhum script resolve isso: o gargalo não é gerar o
base64, é fazê-lo atravessar a saída do modelo.

**O limite medido fica entre 20 KB e 32 KB de base64** — 20 KB voltou inline, 32 KB foi
persistido. Isso é cerca de 15 a 24 KB de imagem, o que dá uma captura de UI de ~500 px de
largura: ilegível.

Já foram testados e falharam: JPEG de q82 a q36, PNG com paleta de 128 a 16 cores, com e sem
dithering, de 1200 px a 580 px de largura. Uma tela de UI legível não cabe. **Não repita
essa investigação** — vá direto para os passos abaixo.

O que fazer, em ordem:

1. **Publique o canvas** e ponha o link no índice. É a melhor referência de qualquer forma:
   navegável, com zoom, sempre atual.
2. **Deixe os arquivos prontos e organizados** em `design/render/`, nomeados na ordem em que
   devem ser lidos (`01-…`, `02-…`), em tema claro e escuro. Diga à pessoa que basta
   arrastar para a pasta do Drive.
3. **Não gaste contexto** tentando espremer a imagem até caber. Uma tela ilegível no Drive
   não serve para nada, e a tentativa custa caro.

Se um dia o conector aceitar upload por caminho de arquivo, este passo vira trivial e esta
seção encolhe.

## Pergunta ao responsável técnico

Dúvida que trava spec não fica em comentário de card nem em conversa de chat: vira documento
no Drive, que a pessoa lê no tempo dela e responde por escrito.

O documento vive em `docs/PENDENCIAS.md` no repositório — essa é a fonte. O do Drive é a
versão para **quem não abre o repositório**, e por isso é escrita diferente:

- Comece dizendo **por que o documento existe** e o que acontece se a pergunta não for
  respondida. Quem vai responder não acompanha o desenvolvimento.
- Uma seção por pergunta, com um identificador estável (`P-01`, `P-02`) que também existe no
  repositório e nos cards. É assim que a resposta encontra o caminho de volta.
- Diga **o que cada pergunta trava**. "Bloqueia a emissão de laudo" move mais que
  "pendência".
- Ofereça a recomendação da equipe quando houver uma, com o motivo — e deixe claro que é
  recomendação, não decisão tomada.
- Marque valor de exemplo como exemplo. Se a tela mostra "± 2 h" só para ilustrar, escreva
  isso; senão vira requisito por acidente.
- Feche com **o que já está definido e não precisa de resposta**. Encurta a leitura e evita
  reabrir o que já foi fechado.
- Pergunta respondida não some: vira `RESPONDIDA` com a decisão e o motivo. O histórico é
  o que impede a mesma discussão de voltar em três meses.

## Ao publicar qualquer artefato

1. Crie o arquivo na subpasta certa
2. Atualize o **Índice dos artefatos**
3. Registre link e ID em `.agents/sources.md` se for pasta ou documento recorrente
4. Comente no card do board com o link — skill `clickup`
5. Se a publicação responde uma pendência, atualize `docs/PENDENCIAS.md` **e** o documento
   do Drive; os dois divergindo é pior que nenhum dos dois existir

## Formato

Passe `contentMimeType: text/markdown` e o conteúdo em `textContent`: o Drive converte para
Documento Google com a formatação preservada. Tabela em markdown funciona e é a melhor forma
de apresentar parâmetro, estado e critério.

Para pasta, `contentMimeType: application/vnd.google-apps.folder`, sem conteúdo.

Apresentação de slides só quando o artefato for **para apresentar a uma sala** — não para
documento que se lê sozinho. O conector cria a apresentação vazia e não popula os slides,
então o conteúdo precisa ser montado à mão depois; avise isso antes de prometer.
