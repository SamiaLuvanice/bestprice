---
name: angular-feature
description: Criar ou estender uma feature no frontend Angular deste monorepo. Use ao adicionar componente, rota, formulário ou consumo de endpoint.
---

# Feature Angular neste projeto

Leia `.agents/rules/frontend.md` e confira a versão em `frontend/package.json`. Para detalhes
de APIs Angular, consulte a skill oficial `angular-developer`.

## Estrutura e dependências

Uma feature fica sob `frontend/src/app/features/<feature>/`:

```text
features/<feature>/
  <feature>.routes.ts
  <feature>.service.ts
  <feature>.model.ts
  <feature>-page/                 componente de página, quando necessário
  <feature>-form/                  componentes de apresentação, quando necessário
```

Mantenha o fluxo simples: página/componente de feature → service → API. O service é a única
camada da feature que usa `HttpClient`, monta URLs e converte respostas HTTP em tipos da UI.
Modelos da feature refletem DTOs sem expor entidades JPA. Componentes visuais recebem dados
por `input()` e comunicam ações por `output()`; não criam sua própria chamada HTTP.

Use componentes standalone, `OnPush`, APIs de Signals (`input`, `output`, `signal`, `computed`)
e template control flow moderno, conforme a versão instalada. Não acrescente uma camada de
repositories, InjectionTokens ou uma biblioteca de estado sem uma necessidade demonstrada.

## Rota, carregamento e formulário

- Registre a feature com lazy loading em `app.routes.ts` quando ela tiver uma rota própria.
- Guards funcionais controlam navegação, mas autorização continua sendo responsabilidade do backend.
- Use `httpResource`/`resource` apenas quando a API e o padrão existente couberem; caso contrário,
  `Observable` com `async` ou `toSignal` é válido. Evite `subscribe()` sem cancelamento explícito.
- Use formulários tipados apropriados à complexidade e à versão. Não migre um formulário existente
  para outra estratégia incidentalmente.
- Mostre erros de campo próximos ao campo e erros gerais em uma mensagem acessível. Preserve
  o formato de erro definido no contrato da API.

## Estados e acessibilidade

Para cada leitura de dados, trate carregamento, vazio, falha e conteúdo. Associe rótulos aos
campos, preserve foco visível e garanta operação por teclado. Prefira seletores por papel/texto
acessível nos testes, não classes de CSS.

## Verificação

Consulte `.agents/skills/quality-gates/SKILL.md` para os comandos vigentes. No mínimo, o build
Angular deve validar TypeScript e templates quando o frontend foi alterado.
