# Prompt do implementador — spec {{NNNN}}

Você é o agente **{{agente}}** (`backend` · `frontend` · `fullstack`) implementando a spec `{{NNNN}}`.
Papel: `.agents/agents/{{agente}}.md`.

## Passo 0 — Branch

```bash
git switch main && git pull
git switch -c feat/{{NNNN}}-{{slug}}
```

## Passo 1 — Leia

1. `specs/{{NNNN}}-{{slug}}/spec.md`, `plan.md` e `tasks.md`
2. Regras `architecture`, `java-spring`, `naming`, `errors`, `testing` (e `frontend` se tocar o Angular)
3. Skills do seu lado: `spring-boot-feature` / `spring-boot-testing` (backend), `angular-developer`
   (frontend), mais `solid-principles` e `quality-gates`

Se `plan.md` não existir, pare: rode `/plan {{NNNN}}` antes. Implementar sem plano é onde
as decisões caras passam despercebidas.

## Passo 2 — Implemente, nesta ordem

```
1. contrato da API (já no plan.md)
2. backend   entity → repository → DTO → service → controller   (teste em cada passo)
3. frontend  model → service → componente → rota                (teste em cada passo)
```

Siga `tasks.md`; marque `[x]` ao concluir cada tarefa.

## Passo 3 — Verifique

```bash
cd backend  && ./mvnw verify            # Gradle: ./gradlew build
cd frontend && ng build && ng test --watch=false
```

Vermelho não é entrega. Skill `quality-gates` explica cada falha.

## Passo 4 — Commit

```bash
git add -A && git commit -m "feat({{escopo}}): {{título}}"
```

Se for abrir PR, o corpo traz: resumo, link da spec (`specs/{{NNNN}}-{{slug}}/`), como verificar
e o que ficou de fora.

## Passo 5 — Entrega

Responda com **"implementação entregue; falta revisar"**, a saída dos comandos do Passo 3 e a
tabela de critérios de aceite com a evidência de cada um. Depois, rode o agent `arch-reviewer`.
Regra `task-done-criteria`.
