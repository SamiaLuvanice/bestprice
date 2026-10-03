---
name: pr-review-merge
description: >-
  Obrigatório com vários agentes no mesmo repo: passo 0 = git worktree
  em .worktrees/<slug>/ antes de editar; principal em stage.
  Verificadores, PR, review, merge e deploy Railway. Use para qualquer
  código em backend e frontend.
---

# pr-review-merge

## Passo 0 — Git worktree (obrigatório)

```bash
cd backend    # ou frontend
git fetch origin && git checkout stage && git pull origin stage
BRANCH=feature/<id-tarefa>-<slug>
SLUG=${BRANCH//\//-}
mkdir -p .worktrees && git worktree add .worktrees/$SLUG -b "$BRANCH" origin/stage
cd .worktrees/$SLUG
```

Confirmar: `pwd` termina em `.worktrees/<slug>` antes de editar.

Se o worktree já existe: `cd .worktrees/$SLUG && git pull origin stage` (rebase se conflito).

## §1a — Verificadores locais (implementador antes da PR)

### Backend (`backend`)

```bash
uv run ruff check .
uv run ruff format --check .
uv run mypy app --strict
uv run pytest tests/unit -m unit -v
uv run alembic upgrade head    # se tocou schema
```

Ou via container:

```bash
make test
```

### Frontend (`frontend`)

```bash
npm run lint
npm run typecheck
npm run build
```

Ou via container:

```bash
make lint
```

## §1b — Verificadores para revisor (Docker obrigatório)

Todo review DEVE rodar em container — nunca no host:

```bash
# Raiz do workspace
make test
make lint
make up && make status
```

## §2 — PR

Título: `<NNNN> — <título curto>` (ex. `0004 — Checkout de pedido`).

Body via HEREDOC:

```bash
gh pr create --base stage --title "0004 — Checkout de pedido" --body "$(cat <<'EOF'
## Resumo
- Entity `Order` + port `OrderRepository`.
- Use cases: `CreateOrder`, `ListOrders`.
- Rotas `POST /orders`, `GET /orders/{id}`; contrato atualizado antes.
- FE: página `/partner/locais`, service `partners.ts`.

## Test plan
- [x] `make ci` verde
- [x] portões do frontend verdes
- [x] `curl POST /orders` cria; `GET /orders/{id}` devolve o recurso.
- [ ] QA: critérios de aceite da spec, screenshot desktop + mobile.

Closes: specs/0004-orders-checkout/
EOF
)"
```

## §3 — Review checklist

Ver [`specs/…/acceptance.md`](../../../specs/) da tarefa + checklist da regra `task-done-criteria`.

Foco:

1. **Camadas:** router não importa SQLAlchemy; use case não importa framework externo; página não faz axios.
2. **Contratos:** `SuccessResponse[T]`; tipos TS batem com Pydantic.
3. **Migration reversível:** `alembic downgrade -1` funciona.
4. **Sem dados sensíveis** commitados (.env, tokens, chaves).
5. **Docstrings + testes** nos use cases.

## §3b — Conformidade com o protótipo (PR que mexe em tela)

Se a PR entrega ou altera tela, confronte-a com o artboard correspondente em
`design/*.dc.html`. O que se compara é o que a tela **promete** — seções, rótulos, colunas,
ordem da informação —, nunca pixel ou espaçamento.

Três perguntas:

1. **Todo campo do artboard existe na tela?** Ausência é lacuna, e lacuna é bloqueio se a spec
   também a exige.
2. **Os rótulos batem?** Rótulo diferente costuma ser decisão que alguém tomou sem registrar.
3. **A ordem da informação é a mesma?** O que o desenho põe primeiro é o que ele considera
   mais importante; inverter é decisão de produto.

**Divergência sem uma linha no PR explicando é achado.** Não necessariamente bloqueio — o
desenho envelhece —, mas o PR tem de dizer que divergiu e por quê. Divergência registrada é
evolução; silenciosa é a tela dizendo uma coisa e o desenho outra, e ninguém sabe qual vale.

## §4 — Merge

```bash
gh pr merge <PR_NUMBER> --squash --delete-branch --subject "0004 — Checkout de pedido (#<PR>)"
```

## §5 — Deploy

Merge em `stage` dispara deploy Railway staging automaticamente (~2–3 min).

Smoke:

```bash
curl -s "https://backend-staging.up.railway.app/health" | jq .
```

Detalhes na documentação de deploy do projeto (`docs/deploy.md`).

## §6 — Cleanup worktree

Após merge:

```bash
cd backend
git worktree remove .worktrees/<slug>
git fetch origin --prune
```

## Skill relacionada

- `task-handoff` — pacote para o próximo agente (revisor / QA)
- `stage-to-main` — promoção staging → production (só sob demanda do usuário)
