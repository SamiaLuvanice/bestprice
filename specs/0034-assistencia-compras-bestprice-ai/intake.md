# Registro do intake da spec 0034

Data: 26/10/2026, fuso America/Sao_Paulo.

## Origem e decisão

Pedido: invocação da skill `po-intake` com “siga com o plano A”. Direção escolhida:
**A — Conversa em primeiro plano**. A escolha é registrada como decisão explícita,
sem pedir nova confirmação do estilo.

Briefing: guia BestPrice AI versão 1.0, fornecido em DOCX, links do Paper e do
Figma, auditoria local de 26/10/2026 e estado real da aplicação. O conteúdo do
guia é referência de produto, não evidência de endpoints ou features implementadas.

Issue: https://github.com/SamiaLuvanice/bestprice/issues/195.

Branch: `feature/0034-issue-195-assistencia-compras-ai`.
Base: `origin/develop`, SHA `de31eb7dc6e8cf9adc04cedb9c95724733026a50`.
Worktree: `.worktrees/feature-0034-issue-195-assistencia-compras-ai`.

## Esclarecimentos obtidos do contexto

| Campo | Resultado |
|---|---|
| Quem é afetado | Visitantes, pessoas autenticadas pesquisando compras e pessoas com monitoramentos existentes |
| Hoje | Entrada e monitoramento existentes; sem assistente nem comparações manuais persistidas |
| Esperado | Conversa como entrada principal, comparação de até três produtos e continuidade das pesquisas |
| Tipo e severidade | Feature, prioridade sugerida P1; sem incidente de produção |
| Lados tocados no futuro | Frontend, backend e contrato; persistência fará parte do planejamento |
| Núcleo | Quatro telas centrais, sessão/navegação, conversas, comparações, histórico simples e acesso ao monitoramento |
| Posterior | Cadastro, recuperação, preferências gerais e troca de tema |
| Dependências | Base existente, consolidação das telas, fornecedor/limites e política de retenção |

## Evidência desta etapa

- Regras ativas, skill po-intake e referência, comando /spec, papel product-owner,
  template e spec implementada de referência lidos.
- `git fetch origin`: concluído; `origin/develop` existe.
- Specs locais, árvore da base remota e nomes das branches conferidos; próximo
  número 0034, sem reutilizar o número 0031 da tarefa ainda em outra branch.
- Issues abertas consultadas; nenhuma tarefa aberta equivalente encontrada na
  consulta. A consulta externa precisou de acesso fora do sandbox; não havia
  evidência de token inválido após a consulta bem-sucedida.
- Issue #195 criada e branch vinculada pelo fluxo de desenvolvimento da Issue.
- Worktree criada sobre a branch derivada de develop; checkout principal preservado.
- Hooks pre-commit e commit-msg instalados; a tentativa inicial foi bloqueada pelo
  cache em leitura e a instalação permitida fora do sandbox concluiu sem bypass.
- A direção A desktop e mobile foi revisada na etapa visual anterior. Não foi
  feita nova escrita no Paper ou no Figma neste intake; as cotas não impedem a spec.
- Somente documentos da spec foram adicionados na worktree. Sem alteração em
  código de aplicação, dependências, banco ou deploy; testes funcionais não se
  aplicam a esta entrega de intake e não foram executados.
- Verificação documental executada: 30 critérios de aceite numerados de AC01 a
  AC30, sem lacunas ou duplicatas; cabeçalho em rascunho e vínculo à Issue #195
  conferidos; sem espaços ao fim de linha. `git diff --check` sem achados nos
  arquivos rastreados; os documentos novos também foram conferidos diretamente.
- Consulta final confirmou Issue #195 aberta e checkout principal limpo em
  develop. Os documentos permanecem locais, ainda sem commit ou publicação;
  a existência da branch remota não implica que a spec esteja publicada.

## Pendências

1. Revisar a spec com o papel `spec-reviewer` antes de /plan.
2. Resolver fornecedor/consumo e retenção para a etapa de IA. Registrar números e
   regras aprovados, sem transformar esses itens em defaults silenciosos.
3. Consolidar as quatro telas e seus estados na direção A.
4. Criar plan.md e tasks.md no planejamento, fixando contratos antes de backend
   e frontend e dividindo o núcleo em fatias verificáveis.
5. Reconciliar docs/product-context.md com a nova direção durante o planejamento;
   o contexto atual ainda descreve o monitoramento como proposta central.
6. Não afirmar sincronização do Project sem evidência; nenhuma consulta ou atualização
   do board foi realizada neste intake.

## Prompt para a próxima etapa

> Revise a spec 0034 conforme `.agents/agents/spec-reviewer.md`, confrontando-a
> com o template, as regras ativas e a preservação do monitoramento. Separe
> bloqueios, correções e considerações. Resolva as perguntas de produto necessárias
> antes de planejar a etapa de IA. Depois execute /plan na mesma worktree, mantendo
> decisões de arquivos, contratos, modelagem e fornecedor em plan.md e passos
> verificáveis em tasks.md. A direção A já está aprovada; não reabra seleção de estilo.
> Não implemente nem abra PR durante o intake. Não marque pronta ou implementada
> com pendências de refinamento.
