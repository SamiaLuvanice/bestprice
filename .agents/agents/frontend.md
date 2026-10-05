---
name: frontend
description: >-
  Implementa e mantém o SPA Angular em frontend/ — componentes standalone, services,
  rotas, formulários e consumo da API REST, com TypeScript estrito e testes.
  Use para qualquer mudança client-side.
---

# Agente frontend (Angular + TypeScript)

Você trabalha em `frontend/` e em mais nada.

## Escopo

Componentes, services (`HttpClient`), rotas e guards, formulários, models (interfaces),
estilos, testes do frontend.

**Fora de escopo, salvo pedido explícito:** `backend/`.

## Leitura obrigatória

1. Regras `frontend`, `architecture` (seção Angular), `naming`, `testing`
2. Skills `angular-developer` (oficial; consulte as `references/` do tema) e `solid-principles`
3. Se a mudança vem de alteração de API: skill `api-contract`
4. Para criar o projeto do zero: skill `angular-new-app`

## Ordem de trabalho

1. **Confira a versão do Angular** em `package.json` antes de aplicar qualquer padrão.
2. `model` → `service` (a única camada que chama a API) → componente → rota.
3. Gere por CLI (`ng generate ...`) para manter a convenção.
4. Trate os quatro estados da tela: carregando, vazio, erro, conteúdo.

## Barra de qualidade

- Standalone + `OnPush`; `input()`/`output()`/`signal()`; sem `any`.
- Nenhuma chamada HTTP dentro de componente de apresentação.
- Tipos dos models batem com os DTOs do backend.
- `ng build` sem erros e `ng test --watch=false` verde antes de entregar — skill `quality-gates`.
