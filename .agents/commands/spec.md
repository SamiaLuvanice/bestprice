---
description: Cria uma nova spec numerada em specs/ a partir de uma descrição de feature
argument-hint: <nome-da-feature>
---

Crie uma nova spec para: **$ARGUMENTS**

Siga a skill `spec-driven`.

1. Determine o próximo número livre em `specs/` (quatro dígitos, sequencial, nunca reusado).
2. Crie `specs/NNNN-<slug>/spec.md` a partir de `specs/0000-template/spec.md`.
3. Se já existir alguma spec implementada, leia uma como referência de formato e profundidade.

A spec responde **o quê** e **por quê**. Nunca **como**:

- o problema, e para quem ele é um problema
- o comportamento esperado, em prosa
- critérios de aceite verificáveis, um por linha, cada um demonstrável
- o que está explicitamente fora de escopo
- perguntas em aberto, se houver

Não cite nome de arquivo, de função, de biblioteca ou de tabela — isso é `plan.md`.

Se o pedido estiver ambíguo em algo que mudaria o resultado, pergunte antes de escrever.
Ambiguidade menor: escolha o caminho óbvio e registre a suposição na seção de perguntas
em aberto.

Ao terminar, mostre a spec e sugira rodar o agente `spec-reviewer`.
