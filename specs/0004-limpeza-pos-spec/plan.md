# Plano — 0004 Limpeza segura após spec

## Contrato

Sem alteração na API da aplicação. O procedimento é um fluxo operacional local chamado ao
concluir uma spec após merge. Por padrão, remove apenas recursos isolados e identificáveis
da tarefa e mantém volumes persistentes.

## Arquivos e camadas

- `.agents/skills/task-cleanup/SKILL.md` (novo): checklist de preflight, encerramento Compose,
  remoção segura da worktree/branches e relatório do que restar.
- `.agents/rules/implementation-handoff.md`: inclui a limpeza pós-merge no handoff e aponta
  para a skill, deixando explícito que não se limpa durante revisão.
- `.agents/rules/workspace.md`: indexa a skill de limpeza no fluxo do trabalho.
- `.agents/AGENTS.md` e `.agents/modules.yaml`: registram a skill de processo.
- `AGENTS.md` raiz do projeto: informa que a limpeza de recursos locais é pós-merge e segue
  a skill, para ferramentas que leem somente o ponto de entrada.
- `specs/0004-limpeza-pos-spec/`: spec, plano, tarefas e evidências.
- `docs/PROGRESS.md`: registra a conclusão da mudança de harness e suas verificações.

## Decisões

| Decisão | Alternativa descartada | Motivo |
|---|---|---|
| Procedimento na skill e obrigação curta na rule | Criar novo agente ou automatizar tudo num script | Skill é acionável sob demanda; rule garante que não seja esquecida; um agente extra não acrescenta responsabilidade distinta. |
| Preservar volume Docker por padrão | Executar `down --volumes` automaticamente | Volumes podem conter dados de estudo que o usuário deseja reter. |
| Excluir branch remota apenas após verificação/consentimento | Apagar qualquer branch cujo nome pareça temporário | Nome não comprova propriedade nem que não existam commits úteis. |
| Remoção sem `--force` e sem prune global | Limpeza agressiva para sempre deixar zero recursos | Segurança e reversibilidade prevalecem sobre remover recursos compartilhados. |

## Riscos

- Docker pode estar indisponível ou o projeto Compose pode não existir mais; registrar como
  ausente/bloqueado e continuar apenas com os passos Git seguros.
- Worktree com alterações não commitadas não pode ser removida; parar e entregar o estado ao
  usuário em vez de forçar.
- `.env` e outros dados ignorados não aparecem em `git status --short`, mas são apagados com a
  pasta da worktree; inspecioná-los antes de `git worktree remove` é obrigatório.
- A branch remota pode ser apagada automaticamente após merge; tratar ausência como sucesso.
- Uma configuração Docker baseada em outro diretório pode não ser isolada; não adivinhar nomes
  nem remover recursos sem confirmação de ownership.
