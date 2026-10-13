---
name: spec-driven
description: O fluxo de trabalho deste repositório — toda mudança de comportamento nasce de uma spec numerada em specs/, passa por plano e tarefas, e só então vira código. Use ao começar qualquer feature, ao receber um pedido vago, ao escrever ou revisar um arquivo em specs/, ou quando perguntarem "por onde começo".
---

# Desenvolvimento orientado a spec

Mudança de comportamento não começa no editor. Começa em `specs/`.

## Quando pular

Correção óbvia de bug, ajuste de formatação, bump de dependência, typo em documentação.
Se a mudança não altera o que o sistema faz do ponto de vista de quem usa, vá direto.

Na dúvida, escreva a spec. Ela é barata; refazer a implementação, não.

## Os quatro passos

```
/spec <nome>    →  specs/NNNN-<slug>/spec.md      o quê e por quê
/plan NNNN      →  plan.md + tasks.md             como
/implement NNNN →  código com TDD (skill tdd)     Red → Green → Refactor por comportamento
/verify NNNN    →  aceite + portões
```

Cada passo produz um artefato revisável antes do próximo. Não pule para `implement` sem
`plan.md`: é ali que as decisões caras aparecem enquanto ainda são baratas de mudar.

## O que vai em cada arquivo

**`spec.md`** — o quê e por quê. Nunca como.
Problema, quem é afetado, comportamento esperado, critérios de aceite verificáveis,
o que está explicitamente fora de escopo. Sem nome de arquivo, sem nome de função.

**`plan.md`** — como.
Contrato da API (se houver), camadas tocadas, arquivos novos e alterados, decisões
de desenho com a alternativa descartada e o porquê, riscos.

**`tasks.md`** — passos verificáveis.
Cada tarefa é executável e tem um jeito de saber que terminou. Uma tarefa que não pode
ser verificada está mal escrita.

## Numeração

Sequencial e imutável: `0001-accounts`, `0002-transfers`, ....
Número não é reaproveitado. Spec abandonada vira `status: descartada` no cabeçalho, e fica.

## A ordem da implementação

Numa mudança que atravessa backend e frontend, fixe o contrato antes dos dois lados:

```
1. contrato da API (no plan.md)   rotas, DTOs, erros
2. backend                       teste → rota FastAPI → regra/persistência necessária
3. frontend                      teste → cliente tipado → tela React
4. teste de integração           API, interface e PostgreSQL quando o fluxo atravessar os três
```

Começar pela UI produz um backend moldado por acidentes da tela.

## Exemplos vivos

Use `specs/0000-template/spec.md` como modelo (crie-o na primeira spec, se ainda não existir).
As specs já implementadas viram a referência de formato para as próximas.

## Ao terminar

`/verify` roda os critérios de aceite e os portões. Nenhuma spec é dada como concluída
com build/teste vermelho ou critério não demonstrado.
