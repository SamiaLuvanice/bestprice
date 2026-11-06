# Sincronização de onboarding — spec 0034

Executada em 27/10/2026 na worktree
`feature-0034-issue-195-assistencia-compras-ai`, branch
`feature/0034-issue-195-assistencia-compras-ai`, como etapa final de documentação
após as últimas alterações de código, gates e revisão independente informados
pela coordenação. O diff unstaged de `state.ts` era somente remoção de linha vazia
pelo hook, anterior a esta etapa. Nenhum código foi alterado pelo doc-sync.

Foram aplicados o papel `.agents/agents/doc-sync-onboarding.md`, a skill
`.agents/skills/doc-sync-onboarding/SKILL.md` e as regras sempre ativas. Conferidos
`git status`, diffs staged/unstaged e arquivos novos, spec/plano, relatórios de
backend/frontend/revisão/QA e implementação real de research, rotas React,
configuração/proxies, migration e testes relacionados. Não houve commit, push,
chamada externa ou alteração do checkout principal.

## Documentos alterados

| Documento | Motivo |
|---|---|
| [README](../../README.md) | Entrada pelo novo espaço autenticado, IA opt-in, retenção/CLI e proxy Vite; limites operacionais e referência às evidências |
| [Contexto do produto](../../docs/product-context.md) | Reconciliar a assistência/comparação/histórico aprovados com o monitoramento por URL e separar implementação local de avaliação externa pendente |
| [Arquitetura](../../docs/architecture.md) | Novo módulo, fronteira Google opt-in, isolamento de sessão e rotas `/app/*`, cotas/idempotência, cleanup e configuração |
| [Banco](../../docs/database.md) | Head local `20261026research`, seis tabelas/RLS, preço original NUMERIC(18,2)/Decimal nullable, relações, retenção e tombstones |
| [Backend](../../docs/apps/backend.md) | Contrato research/AI, limites locais, erros, reserva/contexto, replay, privacidade e operação da limpeza |
| [Frontend](../../docs/apps/frontend.md) | Landing sempre pública, destinos protegidos e aliases, rascunho privado, comparação manual, recuperação de erro/conflito e histórico |
| [Infraestrutura](../../docs/apps/infraestrutura.md) | Env backend, leitura Nginx 35 s somente na geração/5 s restante, `API_PROXY_TARGET`, migration e cleanup sem alegar deploy |
| [Índice](../../docs/index.md) | Descrições atualizadas dos guias existentes; nenhum novo guia necessário |
| [Progresso](../../docs/PROGRESS.md) | Contagens finais e distinção entre QA local aprovada, pendências externas e handoff |

## Conferidos sem edição nesta etapa

- `AGENTS.md` e `CLAUDE.md`: instruções, imports e referências do harness continuam
  corretos; mudança de produto cabe no contexto e nos guias técnicos. Nenhuma
  fonte `.agents/` mudou; sincronização de projeções não foi necessária.
- `docs/LEARNINGS.md`: preservados os dois aprendizados já adicionados pela
  coordenação sobre rascunhos privados por sessão e captura de contexto sob trava.
- `docs/github-workflow.md`: nenhum workflow de entrega ou regra Git foi alterado
  pela feature; pendências de PR/CI seguem no handoff da coordenação.
- `designsystem/README.md`: já documenta a extensão 0034; não foi editado pelo
  doc-sync. Demais documentos do harness não tiveram instruções impactadas.

## Evidência usada e limites

Os testes abaixo foram executados antes desta etapa e constam dos relatórios;
o doc-sync os conferiu, sem reexecutar gates de aplicação:

- Backend final **239 passed, 2 skipped POSIX no Windows, 1 warning**, 82,39 s;
  **46 focados** HTTP/provider simulado/PostgreSQL/RLS. Ruff limpo; módulo novo
  64 blocos, média A/2,34, máximo B/10. Gate global aprovado com dívida legada
  idêntica à base, sem alterar baseline.
- Frontend **366/366** suíte completa e **18/18** afetados finais; lint/build
  aprovados (2.658 módulos). RB01/RB02 e RF01–RF06 corrigidos e aprovados
  independentemente; QA local aprovada.
- SPA/API/PostgreSQL reais, banco descartável novo no schema final: **4/4
  jornadas**, **6/6 erros** e **38/38** matriz em quatro larguras/oito rotas.
  Consulta SQL confirmou NUMERIC(18,2) e seis tabelas com RLS. Somente a geração
  externa foi fixture; Google real bloqueado, sem chave/custo.
- Rodada visual ampla anterior **129/132** antes do ajuste da marca; **8/8**
  afetados após correção. Somente oito baselines landing foram explicitamente
  revisados/atualizados e confirmados **8/8 sem update**. Login/404 preservados.

A revisão documental conferiu 10 documentos e 131 destinos locais de links,
sem arquivos ausentes; cercas Markdown em pares. `git diff --check -- README.md
docs specs/0034-assistencia-compras-bestprice-ai/doc-sync.md` passou. O gate final
`--changed origin/develop` informado pela coordenação cobre 136 blocos, média
A/2,94, sem D+; C14/C11 e MI 10,6 ficam somente no teste HTTP, sem piora de
produção. Esses resultados não equivalem a CI, deploy, Project ou merge.
A spec permanece `pronta`; AC10/AC15/AC19 dependem de configuração gratuita própria
e avaliação do modelo real, e AC30 aguarda fechamento do handoff. O aplicativo
não audita billing Google. A retenção local de 90 dias não elimina registros do
fornecedor nem backups. Monitoramento mantém o gate MLB desligado e a feature
não acrescenta busca de ofertas ou scraping.

Se houver nova alteração de código após esta etapa, o papel deve ser executado
novamente. Publicação da PR, checks remotos e integração permanecem sob
coordenação; nenhuma conclusão externa foi inferida.
