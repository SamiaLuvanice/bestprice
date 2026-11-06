# QA independente da implementação — 0044

Data: 03/11/2026. Worktree: `.worktrees/codex-0044-assistente-simples`.
Referência de produto: **IM01–IM08**, na revisão vigente de `spec.md`, e a seção
de implementação de `plan.md`. A confirmação de aplicar os mesmos cortes no
desktop e no mobile foi conferida nesses documentos. Os critérios históricos
de exemplos e detalhes expansíveis não governam esta implementação.

## Parecer

**QA da implementação aceita no escopo frontend verificado, sem achados de
produto P0–P2 pendentes.** Os cortes editoriais vigentes, a transparência
essencial, o disclosure de recentes e os fluxos de escrita/recuperação estão
coerentes com o diff, os testes e as evidências inspecionadas.

Este parecer não encerra a spec nem comprova publicação. Na conclusão desta
revisão, a etapa seguinte informada pela orquestração é exclusivamente
`doc-sync-onboarding`; IM08 permanece dependente dessa etapa e do handoff real.

## Método e evidência

Foram lidos os componentes `AssistantPage`, `RecentConversations`, o hook
compartilhado `useDisclosure`, o CSS responsivo, os testes de Assistente e
pesquisas, a configuração Playwright e o teste visual do Assistente. O diff não
altera backend, cliente REST tipado ou o hook de disclosure compartilhado.
As chaves de remontagem por conta e rota continuam presentes no shell.

Não foram iniciadas suítes paralelas por este revisor. Os testes foram executados
pela orquestração; as contagens positivas abaixo foram auditadas diretamente nos
logs locais. Lint e build foram confirmados pela orquestração após os ajustes.

| Verificação | Evidência final |
|---|---|
| Vitest | `frontend/test-results/0044-unit-gate.log`: `vitest run --run --maxWorkers=2`, **381 testes em 34 arquivos aprovados** |
| Playwright Assistente | `frontend/test-results/0044-visual-gate.log`: **32 testes aprovados**, 2 workers, 54,7 s; saída 0 confirmada pela orquestração |
| Lint | Saída 0 confirmada pela orquestração após a última alteração de testes |
| Build | Saída 0 confirmada pela orquestração |
| Inspeção visual independente | PNGs inicial/conversa em 320 e 1280; inicial em 390 × 844; erro em 390, carregamento e IA desativada em 320, vazio em 768 |
| Whitespace desta revisão | `git diff --check -- specs/0044-assistente-com-menos-sobrecarga/implementation-qa.md` sem erros |

As imagens foram abertas com `view_image` a partir de
`frontend/test-results/assistant-*/`. A segunda inspeção conferiu os screenshots
corrigidos: estados com recentes abertos e capturas de composição sem artefato de
foco no atalho de conteúdo. Em 390 × 844, pergunta, campo, aviso e envio aparecem
antes da navegação inferior. Em 320 × 640 há rolagem: o teste verifica que o envio
é alcançável e fica acima da barra móvel após rolar. A barra fixa aparece na
posição do viewport nas capturas longas; não se deve interpretar a imagem inteira
como um único viewport ou afirmar que todos os tamanhos cabem sem rolagem.

## Correspondência com o aceite vigente

| Critério | Resultado observado | Limite |
|---|---|---|
| **IM01** | Pergunta única, ajuda opcional, exemplo de orçamento no campo e asset original compacto. Não há Ver exemplos ou Sobre a IA na tela principal. Teste de conteúdo limita a exceção de orçamento à expressão aprovada e à superfície correta. | Paridade editorial com a edição desktop; sem alegação de paridade pixel a pixel com mudanças remotas posteriores. |
| **IM02** | Formulário mostra Google, possível uso gratuito e cuidado com dados pessoais antes do envio. Resposta usa autor BestPrice IA, nome acessível com dados não verificados e título contextual, sem rodapé visual removido. Teste valida o nome semântico e ausência do rodapé. | Leitor de tela real e interação de tooltip em dispositivo físico não foram exercitados. |
| **IM03** | Recentes começam recolhidos. Testes cobrem abrir/fechar, clique fora, Escape com retorno de foco, Tab, rascunho preservado e ausência de POST. Lista solicita somente conversas, limite 4; há histórico, nova conversa, carga, vazio e erro com tentativa de recuperação. | Dados controlados, sem consulta real a pesquisas privadas. |
| **IM04** | Conversa dispensa hero inicial e coluna permanente. Títulos e mensagens longas, inclusive sem espaços, têm teste de ausência de overflow horizontal. Screenshots mostram prioridade de mensagens e campo. | Não foi feita avaliação com pessoas nem validação de conversas muito extensas além das fixtures. |
| **IM05** | `maxLength` e validação de 2.000 preservados; testes cobrem transição em 1.800/2.000, retorno à edição, vazio, 429 e preservação após falha. Guarda de envio e bloqueio do botão enquanto ocupado continuam na fonte; testes existentes verificam repetição/idempotência após pendência. Estados de disponibilidade são distinguíveis. | Falhas HTTP/rede e resultados de IA são controlados; não houve chamada ao fornecedor real. |
| **IM06** | Playwright percorre 320, 390, 768 e 1280; mede ausência de overflow e alvos visíveis menores que 44 px. Há verificações de foco/Escape e do primeiro viewport 390 × 844. Descrição do campo contém apenas limite e contador contextual; axe não encontrou violações nos casos inicial/recentes abertos/conversa em que é executado. | Axe não comprova acessibilidade completa. Sem teclado virtual, zoom, leitor de tela ou dispositivo físico. |
| **IM07** | Sem diff de contrato/backend/API tipada. Recentes usa cancelamento lógico de resultados tardios; remontagem por conta continua no shell. Teste troca sessão e rejeita resultado atrasado da conta anterior. Abrir/fechar não navega nem remonta AssistantPage. | Não repete isolamento PostgreSQL ou autorização real; esses contratos não foram alterados. |
| **IM08** | Logs positivos de testes, lint/build confirmados, inspeção visual e esta revisão independente concluídos. A revisão de arquitetura foi informada separadamente pela orquestração. | Doc-sync-onboarding e handoff/publicação permanecem etapas do responsável pelo fechamento; sem inferência de CI, PR, merge ou deploy. |

## Achados e correções de evidência

- **P2 de evidência visual, resolvido:** a primeira versão dos testes abria
  recentes, preenchia o campo e então capturava estados. O preenchimento fechava
  corretamente o disclosure, ocultando no PNG o estado nomeado. A versão final
  captura o estado com o painel aberto e depois preenche/asserta o rascunho. Os
  novos PNGs de erro, carga, vazio e desativação foram reinspecionados; a última
  execução dos 32 testes passou.
- Não foram identificados achados de produto P0, P1 ou P2 pendentes no escopo
  observado. As capturas finais verificadas não têm corte de textos principais
  ou rolagem horizontal; a sobreposição temporária do popover à área de conversa
  é esperada enquanto o acesso está aberto e fecha por Escape ou clique fora.

## Limites da entrega

A API é controlada por interceptação Playwright e fixtures de Vitest. Não houve
integração com backend/PostgreSQL reais, teste de `/api/health`, execução de IA
real, verificação de cota no fornecedor, alteração de políticas ou ensaio de
limpeza/retentiva. Não se executaram gates de backend porque não houve alteração
nessa camada. A suíte visual exercita o frontend em navegador, sem prometer
funcionamento de integração externa ou substituir avaliação manual assistiva.

Nenhuma aplicação, configuração, arquivo de outro papel ou Figma foi editado por
este revisor. A única saída escrita é este parecer. A implementação deve continuar
como entregue para revisão, sem marcar a spec integrada/publicada antes da
sincronização documental final e das etapas reais de entrega.
