---
description: Convenções de Angular e TypeScript — componentes, services, rotas, formulários, consumo da API.
---

# Frontend (Angular + TypeScript)

Guia completo e atualizado: skill `angular-developer` (oficial do time do Angular).
Para organizar uma feature neste monorepo, use também `.agents/skills/angular-feature/SKILL.md`.
**Antes de gerar código, confira a versão do Angular do projeto** (`package.json`) — as práticas variam por versão.
Esta regra fixa as decisões do projeto.

## Componentes

- **Standalone** (sem NgModule) e `changeDetection: ChangeDetectionStrategy.OnPush`.
- Entrada/saída com `input()`, `output()`, `model()`; estado com `signal()` e `computed()`.
- Template com controle de fluxo moderno: `@if`, `@for` (com `track`), `@switch`.
- Um componente = uma responsabilidade visual. Se passa de ~150 linhas de template/classe, divida.
- Crie via CLI (`ng generate component ...`) para manter a convenção.
- Componente de apresentação não injeta `HttpClient`; recebe dados por `input()` e emite eventos.

## Services e consumo da API

- Um `*.service.ts` por feature, `@Injectable({ providedIn: 'root' })`, usando `inject(HttpClient)`.
- É o **único** lugar que monta URL e chama a API. A base URL vem de configuração de ambiente, não é espalhada.
- Tipos das respostas em `*.model.ts` (interfaces espelhando os DTOs do backend). Sem `any`.
- Leitura reativa: `httpResource`/`resource` (versões recentes) ou `Observable` + `toSignal`/`async`.
  Se usar RxJS manualmente, garanta o cancelamento (sem `subscribe` vazando).
- Proxy de desenvolvimento: `proxy.conf.json` apontando `/api` para `http://localhost:8080`.

## Rotas

- `app.routes.ts` com *lazy loading* por feature (`loadChildren`/`loadComponent`).
- Guards funcionais (`CanActivateFn`) para proteger rotas; o backend continua sendo a autoridade.

## Formulários

- Prefira o padrão que a versão do projeto recomenda (Signal Forms nas versões mais novas;
  senão Reactive Forms tipados com `nonNullable`). Evite misturar os dois na mesma feature.
- Mostre erros de validação perto do campo; erros do backend (`errors[]`) mapeiam para os campos pelo nome.

## Estados da tela

Toda tela que busca dados trata **quatro** estados: carregando, vazio, erro, conteúdo.

## TypeScript

- `strict: true` (já é o padrão do `ng new`). Proibido `any`; use `unknown` e estreite o tipo.
- `readonly` para o que não muda; funções pequenas e puras quando possível.
- Imports absolutos/relativos consistentes; sem dependência circular entre features.

## Acessibilidade e estilo

Rótulo associado a cada campo, foco visível, navegação por teclado. Estilo no escopo do componente;
valores repetidos (cores, espaçamentos) em variáveis CSS ou no tema, não "números mágicos".
(Tailwind é opcional — só adote se for um objetivo de estudo.)

## Verificação

```bash
cd frontend && ng build && ng test --watch=false
```

`ng build` sem erros é obrigatório antes de entregar (inclui checagem de tipos dos templates).
