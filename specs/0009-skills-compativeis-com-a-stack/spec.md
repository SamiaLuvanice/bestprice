---
numero: 0009
titulo: Skills compatíveis com a stack ativa
tipo: melhoria
prioridade: P2
status: pronta
toca: [harness]
depende_de: [0007]
---

# 0009 — Skills compatíveis com a stack ativa

## Problema

Quem usa os agentes recebe orientações genéricas de FastAPI e React que podem conflitar com as decisões já adotadas para este projeto. Material de terceiros também precisa de origem e licença claras antes de entrar no histórico público.

## Comportamento esperado

Ao iniciar uma tarefa de API, interface ou desempenho, o agente encontra instruções aplicáveis à stack atual, com prioridade explícita para as regras do projeto. As referências externas são identificadas e não induzem a instalar bibliotecas ou camadas sem necessidade.

## Critérios de aceite

- [ ] Dada uma tarefa FastAPI neste projeto, a skill apropriada aponta para PostgreSQL e para as regras locais, sem prescrever SQLite, ORM ou camadas vazias.
- [ ] Dada uma tarefa React/Vite, as orientações de design e desempenho aplicam-se à SPA e distinguem recursos exclusivos de Next.js.
- [ ] Dado material de terceiros, a origem e a licença dos trechos incorporados são identificáveis; conteúdo sem licença comprovada não é republicado.
- [ ] As skills integradas possuem descrições específicas e estrutura válida para descoberta.

## Fora de escopo

Alterar código da aplicação, dependências, contrato HTTP ou implementar o protótipo visual.

## Perguntas em aberto

Nenhuma. A cópia externa que não puder ser curada fica preservada no checkout local para eventual decisão posterior.
