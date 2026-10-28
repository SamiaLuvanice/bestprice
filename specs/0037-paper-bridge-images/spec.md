---
numero: 0037
titulo: Imagens na Paper Bridge
tipo: feature
prioridade: P2
status: pronta
toca: [tooling]
depende_de: [0035, 0036]
---

# 0037 — Imagens na Paper Bridge

Issue: #205.

## Problema

A automação do documento de design ainda não oferece um fluxo verificável para
imagens e vetores da identidade BestPrice IA, com rastreabilidade e controle de créditos.

## Comportamento esperado

A pessoa inspeciona os controles disponíveis antes de preparar uma geração. O
pedido preparado informa prompt, parâmetros e incerteza de custo, e exige uma
confirmação específica antes de submeter. Reutiliza resultados existentes quando
possível. Importa imagens locais e SVGs criados por código sem geração remota.
Toda operação registra duração, erro ou evidência de inserção. As operações ficam
restritas ao documento BestPrice Bridge Test até validação e autorização de promoção.

## Critérios de aceite

- [x] AC1 Inspeção mostra prompt, modelos, proporções e controles indisponíveis sem gerar imagens.
- [x] AC2 Geração prepara os parâmetros disponíveis e exige confirmação específica antes de qualquer consumo possível.
- [x] AC3 Opções ausentes, plano bloqueado, falha e timeout retornam resultado verificável, sem repetição automática de geração.
- [ ] AC4 Geração autorizada aguarda conclusão e exige imagem renderizada em uma nova camada no canvas.
- [x] AC5 PNG, JPG/JPEG, WebP e SVG locais podem ser importados pelos mecanismos públicos da interface.
- [x] AC6 SVG criado por código pode ser importado sem consumo de créditos; Create SVG é inspecionado.
- [x] AC7 Assets locais são organizados por tipo com hash e manifesto de origem/utilização; repetição reutiliza camada validada.
- [x] AC8 CLI oferece image inspect/generate/import/validate e evidencia erros, duração e resultados no documento de teste.

## Fora de escopo

MCP oficial, APIs privadas, alteração de limites, compra de plano, publicação ou
alteração do documento BestPrice IA, downloads arbitrários de URLs e geração sem autorização.

## Perguntas em aberto

Não há autorização para consumir créditos neste pedido. A geração real depende
da confirmação do pedido preparado; listagem de modelo não comprova acesso gratuito.
