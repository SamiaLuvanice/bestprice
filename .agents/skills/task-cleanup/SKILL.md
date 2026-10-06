---
name: task-cleanup
description: Encerrar recursos locais de uma tarefa concluída — Compose isolado, worktree e branches — após PR integrada; use no handoff final de uma spec.
---

# Limpeza segura após tarefa

Execute esta rotina somente depois que a PR da tarefa estiver integrada em `develop` e não
houver feedback ou commits pendentes. A limpeza é do recurso criado pela tarefa, não do
ambiente inteiro.

## 1. Identifique e confirme o alvo

Registre a branch da tarefa, a worktree exata e o número da PR. Confirme no provedor que:

- a PR está `MERGED`, tem base `develop` e corresponde à branch que será removida;
- `origin/develop` contém o commit final da branch (depois de `git fetch origin`);
- a branch não é `main`, `stage`, `develop` nem outra branch protegida;
- a worktree fica sob o diretório `.worktrees/` do projeto e é a worktree desta tarefa.

Se qualquer identidade não puder ser confirmada, pare antes de apagar. Não inferir propriedade
somente pelo nome da pasta ou da branch.

## 2. Verifique alterações e serviços

Na worktree da tarefa, rode `git status --short` e `git status --short --ignored`. Se houver
qualquer alteração rastreada ou não rastreada, pare: não descarte, não faça stash automaticamente
e não use remoção forçada. Entregue o estado ao usuário para decidir como preservá-lo.

Inspecione também os arquivos ignorados, porque `git worktree remove` apaga todo o diretório da
worktree, inclusive `.env`, configuração local e outros arquivos que `git status --short` omite.
Não apague segredos, dados locais nem arquivos ignorados de finalidade desconhecida; peça ao
usuário um destino de preservação ou deixe a worktree no lugar. Só aceite perder artefatos
claramente regeneráveis (por exemplo, `.venv/`, `__pycache__/`, `.pytest_cache/`, `node_modules/`, `dist/` e os
links gerados `.claude/agents`, `.claude/skills` e `.claude/commands`). Se um diretório ignorado
contiver dados mistos, inspecione seu conteúdo antes de prosseguir; `.env` e
`.claude/settings.local.json` são dados locais, nunca artefatos descartáveis.

Se a tarefa iniciou a stack com `scripts/compose-worktree.ps1`, ainda dentro dessa worktree rode:

```powershell
.\scripts\compose-worktree.ps1 down --remove-orphans
```

Isso encerra somente o projeto Compose derivado daquela worktree, removendo containers e rede
do projeto. O volume nomeado do banco é preservado por padrão. Não use `-v` / `--volumes` sem
o consentimento definido abaixo; nunca use `docker system prune`, `docker volume prune`,
`docker container prune` ou comandos globais.

Se o Docker estiver indisponível ou a stack já estiver ausente, relate isso e prossiga com Git
apenas se os demais preflight checks passarem. Se a stack usou `docker compose` sem o helper,
não adivinhe o nome do projeto: identifique o projeto e prove que ele pertence exclusivamente
à tarefa; caso contrário, deixe os recursos e reporte-os.

Volume persistente só pode ser removido mediante pedido/consentimento explícito do usuário para
descartar os dados, e após confirmar pelo nome do projeto que ele é exclusivo desta tarefa. Nesse
caso, ainda dentro da worktree, use o helper com `down --remove-orphans --volumes`; não use um
comando global de remoção de volumes.

## 3. Remova worktree e branches

Faça estes passos a partir de outro checkout do mesmo repositório, nunca com o terminal situado
dentro da worktree que será removida. Mantenha os caminhos exatos sob `.worktrees/`.

1. A partir da raiz do projeto (a pasta que contém `docker-compose.yml` e `.worktrees/`), confirme
   novamente que a worktree está limpa, que arquivos ignorados não contêm dados a preservar e
   que a branch não está em uso por nenhuma outra worktree (`git worktree list`).
2. Se a worktree ainda estiver registrada e existir no caminho exato, remova-a sem `--force`:

   ```powershell
   git worktree remove -- .worktrees/<slug>
   ```

   Se o caminho não existir e `git worktree list` não o registrar, anote-a como já removida e
   continue. Se os resultados divergirem, pare e investigue; não use `git worktree prune`.

3. Se a branch local existir, remova-a com `git branch -d <branch>`; nunca troque por `-D`.
   Se já não existir, anote-a como removida. Se o Git recusar, pare e reporte em vez de forçar.
4. Se a branch remota da mesma PR ainda existir em `origin`, confirme que não é protegida e que
   seu commit está contido em `origin/develop`; então remova apenas ela:

   ```powershell
   git push origin --delete <branch>
   ```

   Se o provedor já a apagou automaticamente, registre-a como já limpa. Se o nome/owner/remote
   da branch não corresponder exatamente à PR desta tarefa, não a remova.

Não execute `git worktree prune`: ele pode afetar metadados de outras worktrees. Não remova
branches de outras tarefas nem imagens/volumes compartilhados.

## 4. Relate o resultado

Informe a PR integrada, o projeto Compose parado (ou ausente), se o volume foi preservado,
worktree removida, branches local/remota removidas ou já ausentes, e qualquer passo bloqueado.
Limpeza parcial não é sucesso completo; diga claramente o que sobrou e por quê.
