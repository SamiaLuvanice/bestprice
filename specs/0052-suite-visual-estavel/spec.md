---
numero: 0052
titulo: Suíte visual estável para a landing pública
tipo: bug
prioridade: P2
status: pronta
toca: [frontend]
depende_de: [0050, 0051]
---

# 0052 — Suíte visual estável para a landing pública

Issue: [#289](https://github.com/SamiaLuvanice/bestprice/issues/289)

## Problema

Quem revisa mudanças no frontend recebe falsos negativos na regressão visual da
landing pública e timeout na verificação do selo “menor preço” da Demonstração.
Essas falhas dificultam distinguir regressões visuais de variação entre execuções.

## Como reproduzir

1. Partir de develop, instalar as dependências do frontend e usar o navegador
   previsto pela suíte visual.
2. Executar a regressão visual da landing pública nos temas claro e escuro e a
   verificação A1 da Demonstração.
3. Na reprodução da issue, as capturas em 320 e 390 px divergiram na área dos
   arcos do robô do CTA final e o teste A1 esgotou seu prazo.

## Critérios de aceite

- AC01 — As capturas da landing passam em claro e escuro em 320, 390, 768 e
  1280 px com as referências existentes.
- AC02 — A1 verifica os quatro limites do selo dentro do painel da Demonstração
  em 320, 390, 768, 1280 e 1440 px.
- AC03 — A suíte visual completa passa sem retentativas no ambiente de referência.

## Fora de escopo

Redesign da landing, troca das referências visuais e inclusão da suíte visual no CI.
