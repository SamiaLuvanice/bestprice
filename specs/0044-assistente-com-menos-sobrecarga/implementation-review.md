# Revisão independente da implementação — 0044

Data: 03/11/2026. Papel: `.agents/agents/arch-reviewer.md`.
Worktree: `.worktrees/codex-0044-assistente-simples`.
Base de comparação: `origin/develop`, SHA
`9d3b482a924d14fa8ff9f33cfb1fdac4a5044acb`.

## Parecer

Código revisado sem achados acionáveis P0–P2. A implementação atende à seção
vigente IM01–IM08 da spec, dentro dos limites de verificação abaixo. A confirmação
da responsável de aplicar os cortes editoriais também ao mobile governa esta
revisão; os critérios históricos de exemplos e detalhes sob demanda não devem
reintroduzir conteúdo removido no Figma atual.

Este parecer aceita o diff de implementação para o handoff local. Não declara
integração, publicação, CI remoto, deploy, IA real ou operação real do backend.
O fechamento ainda requer a QA visual final e o doc-sync-onboarding executado
após a última alteração de código e as revisões.

## Escopo examinado

- `frontend/src/features/research/AssistantPage.tsx` e `assistant.css`.
- `frontend/src/features/research/RecentConversations.tsx`.
- `frontend/src/assistant.test.tsx`, `research.test.tsx` e `content.test.tsx`.
- `frontend/tests/visual/assistant.spec.ts`.
- Spec, plano, registro TDD e gates comunicados pelo implementador.

Confrontados com as regras de arquitetura, frontend, segurança e testes, o
contrato tipado existente e os requisitos de privacidade já registrados.
O revisor não editou código nem publicou no GitHub. Sua única alteração local
nesta etapa é este relatório.

## Constatações

1. **Contrato e responsabilidade preservados.** O diff não altera backend,
   `api.ts`, `common.tsx` ou `lib/focus.ts`. Chamadas HTTP, validação tipada,
   autorização, fornecedor, cotas, retenção e persistência continuam na fronteira
   existente. `AIInformation` compartilhado permanece intacto para outros
   consumidores. Não há dependência ou camada nova.
2. **Fluxo de envio preservado.** Não mudou o tratamento de trava, request_id,
   repetição idempotente, captura de falhas, limite de entrada ou descarte de
   respostas tardias de componentes desmontados. A nova apresentação mantém
   sucesso, disponibilidade inicial, indisponibilidade e erro distintos.
3. **Recentes recolhidos sem navegação lateral involuntária.** O controle usa
   `useDisclosure` existente, IDs próprios, `aria-expanded`, `aria-controls` e
   painel `hidden`. Abrir/fechar não navega, não altera a key da conversa e não
   apaga seu rascunho. A consulta continua restrita a quatro conversas e conserva
   estados de carga, vazio, erro, atualização e isolamento por montagem.
4. **Texto e apresentação dentro da decisão vigente.** Pergunta principal,
   exemplo de orçamento, robô compacto e aviso essencial estão no compositor.
   Foram removidos atalhos e explicações que a responsável retirou do Figma.
   Google, possível uso do conteúdo gratuito e cuidado com dados pessoais/
   confidenciais permanecem antes do envio. A autoria IA e a ressalva de dados
   não verificados permanecem na semântica do artigo e no título contextual do
   autor, sem restaurar o rodapé visual removido.
5. **Descrição do campo curta.** A descrição acessível contém limite de entrada
   e, somente ao restarem 200 caracteres ou menos, a contagem restante. Não inclui
   toda a política. Label e nome acessível do envio permanecem explícitos.
6. **CSS contido na superfície.** A composição passa a uma coluna de tarefa e
   usa tokens e assets existentes. O painel tem largura limitada ao viewport,
   altura limitada com rolagem própria e abertura fora do fluxo da conversa.
   Texto extenso pode quebrar sem impor largura intrínseca ao layout. A revisão
   estática não substitui as capturas e verificações visuais da QA.
7. **Exceção editorial precisa no teste de conteúdo.** A liberação de orçamento
   é restrita ao literal completo `'Ex.: notebook para estudar, até R$ 3.500'`,
   no arquivo `AssistantPage.tsx`, somente na regra de preço fixo. Outros valores,
   arquivos e regras continuam sujeitos à verificação. É um exemplo de intenção
   de compra explicitamente identificado, sem preço de oferta ou produto fictício.
8. **Teste de transição ajustado ao comportamento real.** A espera pelo heading
   da conversa após a resposta e o navigate evita abrir o disclosure da montagem
   anterior. Os testes continuam verificando a primeira conversa na lista e o
   novo endereço; não foi removida a asserção de resultado.

## Evidência conferida e gates

| Verificação | Resultado e origem |
|---|---|
| `git diff --check -- frontend` | Executado pelo revisor, sem erros de whitespace; aviso de normalização LF/CRLF do CSS não representa falha. |
| `python .agents/skills/cyclomatic-complexity/scripts/complexity_report.py --changed origin/develop` | Executado pelo revisor: nenhum arquivo `.py` alterado. Sem mudança Python a classificar por radon. |
| `npm test -- --run --maxWorkers=2` | Log local `frontend/test-results/0044-unit-gate.log` conferido: 34 arquivos, 381 testes passaram; exit 0 e duração de 146,39 s comunicados pelo implementador. |
| `npm run lint` | Exit 0 após as alterações, comunicado pelo implementador. |
| `npm run build` | Exit 0, comunicado pelo implementador. |
| Playwright do Assistente | 32 testes passaram, comunicado pelo implementador; `.last-run.json` local conferido como passed, sem failedTests. Nova execução apenas para melhorar artefatos/capturas fica a cargo do implementador/QA. |
| Detector Impeccable nos três arquivos da superfície | `[]` em cada arquivo, comunicado pelo implementador; ausência de findings não comprova acessibilidade completa. |
| `node --test .github/scripts/*.test.cjs` | 50/50 passaram, comunicado pelo implementador. |

O registro TDD preserva falhas Red e execução intermediária não verde. A execução
Vitest anterior teve falhas de timeout, transição e regra editorial; não foi
contada como gate verde. O resultado final completo acima é o gate aplicável.
Não foram repetidas suítes amplas pelo revisor enquanto o implementador executava
os gates; a origem de cada evidência está discriminada na tabela.

## Limites e pendências do handoff

- A revisão é independente da autoria do código, mas não substitui a QA visual
  separada. Playwright usa API controlada; não valida Gemini, Mercado Livre ou
  PostgreSQL reais.
- Não houve ensaio manual com leitor de tela nem teclado virtual real. ARIA,
  axe e teclado automatizado não equivalem a conformidade integral de acesso.
- Conferir na documentação final que a aplicação dos cortes ao mobile foi
  confirmada; não deixar a seção vigente apresentar essa decisão como suposição
  ainda pendente. As seções históricas devem continuar identificáveis como tais.
- Incorporar a última execução de capturas à verificação e executar
  doc-sync-onboarding por último. Repetir a sincronização se houver nova mudança
  de código depois dela.
- Issue/PR continuam sujeitos à autorização de publicação já registrada. Este
  parecer não autoriza contornar a rejeição automática, fazer push ou integrar
  a branch em `develop`.
