# Revisão da spec 0021

Data: 15/10/2026.

Revisão documental pelo roteiro `.agents/agents/spec-reviewer.md`, aplicada na própria
tarefa, sem revisão independente. Referências: template de specs, specs 0012 e 0020,
regras de segurança e frontend, contexto do produto e comportamento atual da área
autenticada, detalhe e sino de notificações.

## Achados e resolução

| Severidade | Achado | Resolução |
|---|---|---|
| Bloqueia | O grupo novo de alertas configurados não definia abrangência, itens pausados ou produtos além da primeira página. | Definidos os alertas de monitoramentos em andamento, ativos e pausados, campos, ordem e acesso a todos os itens; AC11 inclui estados independentes. |
| Corrigir | Destino de retorno reconhecido poderia incluir o próprio login; recarregar o login não tinha regra. | Retorno limitado às quatro rotas protegidas e preservado após recarga; AC19 explicita o fallback para Início. |
| Corrigir | A transformação de diálogo em página não definia a saída após parar de monitorar nem o acesso por notificação antiga. | AC20 define confirmação, cancelamento, sucesso, erro e foco; AC21 define o estado de monitoramento interrompido. |
| Corrigir | A revogação de requisitos de página única e diálogo estava genérica. | Identificados os trechos afetados da 0012 e a preservação da apresentação do login da 0020. |

## Resultado

Spec pronta para `/plan 0021`, sem bloqueio de produto identificado após os ajustes.
Os critérios permanecem desmarcados: esta revisão não verifica uma implementação.
Não houve alteração de código nem execução de testes da aplicação nesta etapa.

O plano deve definir a consulta completa de alertas com os recursos existentes, o
tratamento de acessos diretos na hospedagem e a validação da navegação em local e
stage. Não se presume necessidade de endpoint novo nem implantação de novo ambiente.

A consulta de Issues funcionou com acesso de rede fora do sandbox. A mensagem inicial
de credencial inválida não foi confirmada nesse contexto; a falha no sandbox também
se manifestou como impossibilidade de conectar a `api.github.com`.

Issue criada e vinculada: https://github.com/SamiaLuvanice/bestprice/issues/93.
Não foi verificada sincronização com GitHub Project nesta etapa.

## Revisão independente do plano — 15/10/2026

Papel: `.agents/agents/arch-reviewer.md`; escopo somente documental, comparando
spec, plano, tarefas, regras, cliente HTTP, rotas/modelos, sessão e hospedagem.

- Nenhum bloqueio arquitetural ou lacuna de rastreabilidade AC01–AC21 identificado.
- Corrigida a interpretação do 404 em endpoint de alerta: pode representar alerta
  ou monitoramento ausente. O plano agora exige recarregar o detalhe para distinguir
  os casos e preservar a recuperação existente.
- Incluída em T05 a leitura do design system e aplicação da skill frontend-design.
- Parecer favorável ao planejamento após a correção textual, incorporada. Revisão
  não comprova implementação, testes ou aceite dos critérios.

O agente frontend contribuiu, em leitura paralela, com a decomposição de AccountArea,
paginação dos alertas, links de notificação/timeline e regressões do harness de testes.
