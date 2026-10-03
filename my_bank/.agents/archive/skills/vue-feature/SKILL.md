---
name: vue-feature
description: Criar uma tela ou comportamento no SPA Vue deste repositório — composables em features, SFCs em ui, página em app. Use ao mexer em frontend/vue, ao adicionar rota, formulário ou consulta.
---

# Uma tela no SPA Vue

Leia primeiro `.agents/rules/frontend.md` e a skill `frontend-parity`. Aqui é a mecânica.

## Onde vai cada peça

```
src/features/<recurso>/use-<recurso>.ts   composables: TanStack Query (Vue) + Pinia
src/ui/<Componente>.vue                   apresentação, props e emits
src/app/pages/<Nome>Page.vue              a página
src/app/router.ts                         a rota e a guarda
```

`features` não importa `ui`. SFC de `ui/` não conhece repositório.

## Consulta reativa

A query precisa reagir a filtro e página. Passe um **getter**, não um valor:

```ts
const users = useUsers(() => ({ page: page.value, perPage: 10, term: term.value || undefined }));
```

Passar `{ page: page.value }` congela o valor no primeiro render e a paginação para de
funcionar sem erro nenhum — é o engano mais fácil de cometer aqui.

## Desembrulhar no template

O TanStack Query devolve refs. No `<script setup>` use `.value`; no template, o Vue
desembrulha sozinho — mas os campos do resultado da query não:

```vue
<AppLoading v-if="users.isPending.value" />
<div v-else-if="users.data.value">…</div>
```

## Formulário

`vee-validate` + `toTypedSchema(z.object({...}))`, com `defineField` por campo:

```ts
const { handleSubmit, errors, defineField } = useForm({ validationSchema: schema });
const [email] = defineField("email");
```

Precedência de erro igual às outras stacks: `firstMessage(errors.email, serverErrors['email'])`.

## Guarda de rota

Fica em `router.beforeEach`, não em componente. Ela espera a restauração da sessão
terminar antes de decidir — sem isso, recarregar a página joga para `/login` enquanto o
refresh silencioso ainda está em voo.

## Portões

```bash
cd frontend/vue && make lint && make test
```

O ESLint precisa do `vue-eslint-parser` nos `.vue` **depois** do `strictTypeChecked`, que
sobrescreve o parser. Formatação é do Prettier: as regras `vue/*` de layout estão
desligadas de propósito.
