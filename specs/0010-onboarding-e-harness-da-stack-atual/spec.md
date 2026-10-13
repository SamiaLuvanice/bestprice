---
numero: 0010
titulo: Onboarding e harness coerentes com a stack atual
tipo: melhoria
prioridade: P2
status: pronta
toca: [docs, harness]
depende_de: [0007, 0009]
---

# 0010 — Onboarding e harness coerentes com a stack atual

Issue: https://github.com/SamiaLuvanice/bestprice/issues/29

## Problema

Quem chega ao projeto precisa entender e executar a aplicação atual sem recorrer ao time. Parte das instruções e do material arquivado ainda descrevia a stack anterior, enquanto a base em FastAPI, React e PostgreSQL ganhou documentação e uma nova skill local que ainda precisam ser avaliadas como um conjunto antes da integração. Referências obsoletas confundem o onboarding; publicar material de terceiros sem origem e licença comprovadas cria uma pendência adicional.

## Comportamento esperado

Ao entrar no repositório, uma pessoa desenvolvedora encontra um caminho de leitura único, prepara o ambiente e entende o fluxo entre interface, API, banco e infraestrutura. A documentação explica os limites reais da base atual, inclusive funcionalidades ainda inexistentes e problemas observáveis, sem atribuir ao sistema comportamento não implementado.

As instruções dos agentes indicam somente o processo e a stack ativos. O material específico da aplicação anterior deixa de fazer parte da árvore atual do projeto, inclusive em arquivos inativos e referências de documentação. A numeração das specs atuais continua sequencial e o histórico Git existente permanece íntegro.

Uma skill adicional para trabalho em React só entra no conjunto versionado se sua origem, licença e aplicação à SPA Vite estiverem claras. Diretrizes exclusivas de outra arquitetura não devem ser apresentadas como regra da aplicação atual. O conjunto resultante fica pronto para revisão e integração pelo fluxo normal de Issue, branch, verificações e PR para `develop`.

## Critérios de aceite

- [ ] Dado um clone limpo e os pré-requisitos declarados, uma pessoa desenvolvedora consegue seguir o guia inicial para configurar o ambiente, iniciar banco, API e interface e verificar a resposta da aplicação, sem passos que dependam de conhecimento não documentado.
- [ ] Dado o índice de documentação, todos os guias ativos de arquitetura, banco, módulos e operação são alcançáveis por links válidos e apresentam primeiro uma visão compreensível para recém-chegados, seguida dos detalhes técnicos conferidos no código.
- [ ] Ao comparar documentação e aplicação, rotas, configuração, persistência, integrações, tarefas e infraestrutura descritas correspondem ao estado executável; ausências e limitações relevantes são declaradas, sem inventar modelos, migrações ou painel administrativo.
- [ ] Uma busca pela árvore atual do projeto não encontra material específico da aplicação anterior nem referências que levem a esse material, incluindo cópias inativas e registros antigos de especificação; termos legítimos da stack atual continuam permitidos.
- [ ] Ao consultar as instruções disponíveis às ferramentas de desenvolvimento, a stack, os papéis, as skills e o fluxo de trabalho ativos são coerentes entre si, e nenhuma instrução necessária aponta para um arquivo removido.
- [ ] Antes de versionar a skill adicional de React, sua origem e os termos de licença estão comprovados no material entregue; suas orientações são aplicáveis à SPA Vite ou distinguem explicitamente os recursos de outras arquiteturas. Se essas condições não forem satisfeitas, a cópia não entra na integração.
- [ ] O pacote de mudanças passa por revisão documental e verificações aplicáveis; os resultados executados e eventuais pendências são registrados sem apresentar como concluída uma etapa não verificada.
- [ ] A integração proposta segue uma Issue vinculada e um PR para `develop`, preservando a sequência de numeração das specs, as mudanças locais não relacionadas e o histórico Git existente.

## Fora de escopo

- Criar funcionalidades de negócio, contratos HTTP, modelos de dados, migrações ou painel administrativo.
- Alterar a infraestrutura de implantação externa ou publicar uma release.
- Reescrever o histórico Git para apagar versões anteriores já registradas.
- Versionar materiais locais de referência visual que não façam parte da documentação ou do harness desta mudança.

## Perguntas em aberto

Nenhuma. A cópia local de skill de terceiro foi avaliada no planejamento e ficou fora desta integração.
