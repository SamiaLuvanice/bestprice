---
numero: 0016
titulo: Tema claro fixo no app
tipo: melhoria
prioridade: P1
status: implementada
toca: [frontend, docs]
depende_de: [0015]
---

# 0016 — Tema claro fixo no app

Issue: https://github.com/SamiaLuvanice/bestprice/issues/52

## Problema

A aparência da aplicação acompanha hoje a preferência de cor do sistema operacional.
Em computadores configurados com modo escuro, todas as superfícies — entrada, painel,
produtos, detalhe/histórico, alertas, notificações, menus e diálogos — aparecem escuras,
contrariando a identidade visual clara que o produto deseja apresentar nesta fase.

Isso afeta qualquer pessoa que acesse a aplicação a partir de um sistema com modo escuro:
o conteúdo continua funcional, mas a leitura e a percepção de marca ficam dependentes de
uma configuração externa ao produto.

## Comportamento esperado

A interface exibe sempre o tema claro, independentemente da preferência de cor do sistema
operacional. Não há seletor de tema na aplicação e nenhuma preferência de cor é gravada.

A mudança vale para todas as superfícies da entrada e da área autenticada e não altera
nenhum fluxo, mensagem, dado ou comportamento funcional. Texto, controles nativos, bordas
e indicação de foco permanecem legíveis, com contraste mínimo de 4,5:1 para texto e 3:1
para limites de controles e foco.

Alterar a preferência de cor do sistema com a página aberta não muda a aparência da
aplicação. Os protótipos visuais de referência não fazem parte desta entrega.

## Critérios de aceite

- [ ] **AC01** — Com o sistema operacional em modo escuro, todas as superfícies da entrada e da
      área autenticada aparecem no tema claro.
- [ ] **AC02** — No tema claro, texto, controles nativos, bordas e indicação de foco permanecem
      legíveis, com contraste mínimo de 4,5:1 para texto e 3:1 para limites de controles e foco.
- [ ] **AC03** — Alterar a preferência de cor do sistema com a página aberta não muda o tema da
      aplicação, sem perder campos ou sessão.
- [ ] **AC04** — As instruções e a documentação ativas descrevem o tema claro fixo e não afirmam
      que a aplicação acompanha a preferência do sistema.

## Fora de escopo

- Os protótipos visuais de referência e seus controles demonstrativos de tema.
- Seletor de tema manual ou armazenamento de preferência na aplicação.
- Mudanças no backend, nos contratos REST, nos dados ou nas mensagens funcionais.
- Novas telas, componentes ou estados além do necessário para fixar o tema claro.

## Referências e decisões do intake

Esta spec reverte conscientemente o AC03 da spec 0015, que definia o tema como acompanhando
a preferência do sistema; a decisão de "tema automático sem seletor" registrada no intake
da 0015 passa a ser "tema claro fixo". Não foi adotado seletor nem persistência.

A verificação de contraste reaproveita os valores já auditados na 0015 para o tema claro,
sem reabrir a matriz completa de revisão visual; a evidência foca em demonstrar que o tema
escuro deixou de ser aplicado e que o tema claro permanece legível.

## Limites e dependências

- A mudança é de apresentação; depende da identidade e dos tokens já definidos pela 0015.
- Navegadores ou extensões que forçam cores de alto contraste ficam fora do escopo.
