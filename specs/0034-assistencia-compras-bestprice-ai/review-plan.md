# Revisão independente do plano da spec 0034

Data: 26/10/2026. Issue #195. Base informada: `origin/develop`, `de31eb7`.
Papéis aplicados: `spec-reviewer` e `arch-reviewer`.

## Parecer

**Plano aprovado para seguir para a implementação prevista**, sem bloqueio
remanescente identificado no contrato revisado. A direção A e a escolha de
retenção local de 90 dias estão registradas. A recomendação do fornecedor fica
na configuração/adapter, e a geração externa permanece desativada até a
configuração explícita, sem contratação ou ativação presumida.

Este parecer não aprova uma implementação que ainda será revisada, não comprova
critérios funcionais e não marca a spec como implementada.

## Primeira rodada e correções conferidas

| Achado inicial | Correção observada no plano | Situação |
|---|---|---|
| Exclusão em cascata de tentativas poderia restituir a cota se o consumo fosse calculado delas | Contadores persistentes por janela, sem conteúdo, independentes da pesquisa e das tentativas; exclusão e expiração não restituem consumo | Resolvido no desenho; exigir teste de gerar → excluir → gerar e de expiração |
| `Capabilities` fixava Google e um modelo como literais do contrato | `provider` e `model` são strings; contrato funcional não depende do fornecedor | Resolvido no contrato; validação da UI não deve reintroduzir enum específico |
| Primeiro envio falho poderia deixar conversa vazia sem identificação recuperável | Tentativa reservada sem pesquisa/mensagem; conversa e par de mensagens criados atomicamente apenas no sucesso | Resolvido no lifecycle planejado |
| Replay poderia devolver snapshot de pesquisa excluída ou expirada | Replay revalida propriedade, existência e expiração; exclusão apaga snapshots e mantém tombstone sem conteúdo por 24 horas | Resolvido no desenho; exigir testes de replay após exclusão/expiração |
| Promessa de não enviar email era incompatível com entrada textual livre | O sistema não acrescenta metadados de sessão; informa que texto livre pode conter conteúdo digitado e que a advertência não é sanitização garantida | Resolvido no texto de privacidade |
| Destino equivalente dos alertas não era explícito | `/app/monitoring/alerts` preserva a lista de alertas configurados | Resolvido no escopo e no plano |
| Mudança da home poderia perder o painel completo anterior | `/app/monitoring/overview` preserva resumos e comandos do painel existente | Preservação explicitada; verificar rotas e navegação na implementação |

## Pontos adequados no plano

- Sessão existente e autorização por proprietário em todas as operações; recurso
  alheio, excluído ou expirado não revela conteúdo.
- Expiração desde criação, sem renovação por edição, com acesso bloqueado no
  instante exato e limpeza física horária enquanto o serviço estiver em execução.
- Exclusão local não promete eliminação de backups ou de registros do fornecedor.
- Reserva de tentativa e consumo sob trava curta, sem manter transação de banco
  durante chamada HTTP; limites persistidos entre processos.
- Idempotência no produto sem prometer exatamente uma chamada externa diante de
  timeout ambíguo; retry automático de geração não autorizado.
- Comparações isoladas dos produtos monitorados, resultado associado à versão
  e invalidação após edição; URLs informadas não são requisitadas.
- Texto gerado identificado como análise não verificada; os dados lado a lado
  provêm das entradas fornecidas, sem HTML executável.
- Contratos, divisão de propriedade de arquivos, gates e ordem de revisão/QA e
  doc-sync-onboarding estão definidos antes da implementação.

## Evidência exigida na revisão do código

Conferir especialmente os limites exatos de 90 dias, geração concorrente com
exclusão/expiração/edição, replay após essas mudanças, cotas após exclusão e
isolamento entre processos e pessoas. Conferir também configuração desativada
sem acesso de rede, erros seguros, aliases de produtos/alertas/overview, troca de
sessão e manutenção da cobertura de monitoramento.

## Limites desta revisão

Foi feita leitura do plano atualizado e das mudanças correspondentes na spec,
confrontando os quatro achados prioritários anteriores e a preservação do painel.
Nenhum código de aplicação foi alterado nesta revisão. Novos arquivos de testes
em desenvolvimento por outros papéis não foram avaliados aqui.

Não foram executados Ruff, pytest, Vitest, build, complexidade, navegador, banco,
chamadas ao fornecedor ou deploy. Não se trata de QA nem de verificação de uma
implementação. A disponibilidade, os termos e os limites reais do modelo citados
nas fontes do coordenador não foram revalidados independentemente nesta rodada.
