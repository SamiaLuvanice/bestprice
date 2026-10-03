---
name: bug-resolve
description: Procedimento para corrigir bug — reproduzir, escrever o teste que falha, achar a causa raiz com evidência, corrigir e confirmar. Acionado por "resolva esse bug", "está dando erro" ou relato com sintoma/stack trace.
---

# bug-resolve

Fluxo para um bug relatado. O ponto é **não adivinhar**: regra `evidencia.md`.

## 1. Reproduzir

- Qual é o passo a passo, do estado inicial ao sintoma? Se faltar, pergunte.
- Reproduza localmente: `curl -i` na API ou os passos na tela. Cole a saída real (status, corpo, log).
- Não reproduziu? Diga com evidência o que tentou e peça mais contexto — não "conserte" no escuro.

## 2. Localizar a causa raiz

- Backend: stack trace completo (procure o último `Caused by:`), log do Spring, a requisição que disparou.
- Frontend: console e aba Network (status, payload, resposta), `ng build` sem erros.
- Descubra qual lado falha antes de editar: a resposta da API está certa? Então o bug é do Angular. Está errada? É do backend.
- Formule **uma** hipótese por vez e teste-a (log, breakpoint, teste mínimo).

## 3. Teste que falha primeiro

Escreva o teste de regressão que reproduz o bug e **veja-o falhar** (JUnit no backend; teste de
componente/serviço no Angular). Se não dá para testar, explique por quê.

## 4. Corrigir

Menor mudança que ataca a causa raiz. Sem refatoração oportunista misturada no mesmo commit.

## 5. Confirmar

- O teste de regressão passa; os demais continuam passando (`quality-gates`).
- Reexecute o passo a passo original e mostre a evidência.
- Se o bug revelou um padrão (ex.: validação faltando em vários DTOs), registre com a skill `learnings`.

Para uma sessão focada só em diagnóstico, use o agent `debugger`.
