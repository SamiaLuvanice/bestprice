---
name: angular-feature
description: Criar uma tela ou comportamento no SPA Angular deste repositório — serviços em features, componentes standalone em ui, página em app, com signals e resource(). Use ao mexer em frontend/angular, ao adicionar rota, formulário ou consulta.
---

# Uma tela no SPA Angular

Leia primeiro `.agents/rules/frontend.md` e a skill `frontend-parity`. Aqui é a mecânica.

## Onde vai cada peça

```
src/features/<recurso>/<recurso>.service.ts   Injectable que fala com o repositório
src/ui/<nome>.component.ts                    standalone, OnPush, input()/output()
src/app/pages/<nome>.page.ts                  a página
src/app/routes.ts                             a rota e o canActivate
```

## Injeção

Os repositórios vêm de `features/repositories.ts` por `InjectionToken`, e o cliente HTTP é
o de `data/` — não o `HttpClient` do Angular. A renovação em voo único já está escrita e
testada ali; uma segunda versão como interceptor só teria como divergir.

Num teste, troque o repositório pelo token:

```ts
TestBed.configureTestingModule({
  providers: [{ provide: AUTH_REPOSITORY, useValue: repositorioFalso }],
});
```

## Consulta

```ts
protected readonly users = resource({
  params: () => ({ page: this.pagina(), perPage: 10 }),
  loader: ({ params }) => this.users_.list(params),
});
```

`resource()` expõe `isLoading()`, `value()`, `error()` e `reload()`. Mudar um signal em
`params` refaz a busca sozinho.

## Formulário

Reactive Forms com `nonNullable: true`. O Angular expõe erro como mapa de chaves
(`required`, `email`, `minlength`), e não como mensagem pronta — `app/form-errors.ts`
traduz, e é o único lugar onde essa diferença de idioma existe.

## Armadilhas que já custaram tempo aqui

- **Atributo nu não é booleano.** `retryable` passa a string `""`; use `[retryable]="true"`.
- **`output()` sem argumento de tipo.** `output<void>()` é tipo inválido no lint.
- **Não nomeie um `output` de `change`.** Colide com o evento nativo do DOM.
- **`tsconfig.json` é do tipo *solution*** e não inclui arquivo nenhum. Ferramenta que
  aponte para ele varre zero arquivos e passa em vazio — use `tsconfig.app.json`, e o
  ESLint usa `projectService: true`.
- **O `dependency-cruiser` precisa de glob e de extensões.** `depcruise src` não expande
  diretório aqui, e sem `enhancedResolveOptions.extensions` os imports sem extensão ficam
  sem resolver e nenhuma regra de camada dispara.

## Portões

```bash
cd frontend/angular && make lint && make test
```
