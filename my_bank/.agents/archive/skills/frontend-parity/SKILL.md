---
name: frontend-parity
description: A regra de paridade entre os três SPAs — o que precisa ser idêntico, o que pode divergir, e como o roteiro único do Playwright verifica isso. Use antes de mexer em qualquer frontend, ao adicionar tela ou comportamento, ou quando um teste passar num SPA e falhar em outro.
---

# Paridade entre os três SPAs

React, Vue e Angular são **equivalentes por contrato**. Mudança de comportamento entra nos
três, ou o repositório passa a mentir sobre a paridade.

## O que é idêntico, byte a byte

```
src/domain/    tipos e regras puras
src/data/      cliente HTTP, repositórios, tradução do envelope de erro
```

São TypeScript puro, sem framework. Ao mexer em qualquer arquivo destes dois diretórios,
copie para os outros dois — e confira:

```bash
diff -r frontend/src/domain frontend/vue/src/domain
diff -r frontend/src/data   frontend/angular/src/data
```

Divergiu sem querer? Reconcilie. Divergiu de propósito? Ou é caso para mudar os três, ou
para uma ADR.

## O que pode divergir

`features`, `ui` e `app` — o idioma de cada framework:

| | React | Vue | Angular |
|---|---|---|---|
| estado de sessão | Zustand | Pinia | signal em `Injectable` |
| estado do servidor | TanStack Query | TanStack Query | `resource()` |
| formulários | RHF + Zod | VeeValidate + Zod | Reactive Forms |
| guarda de rota | componente `RequireAuth` | `beforeEach` do router | `CanActivateFn` |

Divergir de idioma é o esperado. Divergir de **comportamento** não é.

## O que precisa ser literalmente igual na tela

O roteiro do Playwright consulta por papel e por texto acessível. Então estes precisam
casar nos três, caractere a caractere:

- títulos: `Entrar`, `Criar conta`, `Usuários`, `Novo usuário`, `Editar usuário`,
  `Meu perfil`, `Situação do sistema`
- rótulos de campo: `Nome`, `E-mail`, `Senha`, `Buscar`
- botões: `Entrar`, `Criar conta`, `Salvar`, `Voltar`, `Novo usuário`, `Sair`,
  `Abrir`, `Remover {nome}`, `Anterior`, `Próxima`, `Tentar de novo`
- mensagens: `Nenhum usuário encontrado.`, `Alterações salvas.`,
  `Formato de e-mail inválido`, `A senha precisa de ao menos 12 caracteres`

Mudou um texto? Mudou nos três, e no roteiro.

## A verificação

```bash
make up && make migrate     # o backend precisa estar de pé
make e2e FRONT=react
make e2e-all                # os três, com o mesmo arquivo
```

**O roteiro não pode ramificar por framework.** Se você se pegar escrevendo
`if (framework === 'angular')`, o comportamento divergiu: conserte o SPA, não o teste.

## Ao adicionar uma tela

```
1. contract/openapi.yaml, se a API muda
2. make codegen
3. domain/ e data/ — escreva num SPA, copie nos outros dois
4. features/ + ui/ + app/ — nos três, no idioma de cada um
5. o roteiro do Playwright ganha o caso novo
6. make e2e-all
```
