---
name: fastapi-templates
description: Estruturar uma nova parte FastAPI deste monorepo quando ainda não houver um módulo existente adequado. Use apenas para decisões iniciais de organização; para endpoints, persistência e testes siga as skills específicas do projeto.
---

# Estrutura inicial FastAPI da BestPrice

Leia `.agents/rules/architecture.md`, `backend.md`, `errors.md`, `datetime-pipeline.md` e `testing.md` antes de definir a estrutura. Este repositório já possui uma aplicação em `backend/`; preserve sua organização e amplie-a apenas quando uma responsabilidade concreta exigir.

1. Comece pelo contrato HTTP em `plan.md` e pelas tarefas verificáveis da spec.
2. Mantenha a rota responsável por entrada e saída HTTP. Coloque regra de negócio testável em função ou serviço quando ela existir. Isole SQL em persistência quando houver consulta real.
3. Injete conexões e relógio nas regras que dependem deles. Use PostgreSQL real para testes de integração e `Decimal` para dinheiro; instantes de eventos são UTC.
4. Não crie camadas, ORM, middleware ou dependências apenas para preencher um modelo de diretórios. Para um health check, siga o exemplo existente em `backend/app/`.
5. Use `fastapi-feature`, `fastapi-persistence` e `fastapi-testing` conforme o trabalho. Rode os gates descritos em `quality-gates`.

Esta skill é uma orientação local escrita para a BestPrice. A cópia genérica avaliada durante a curadoria não foi incorporada porque seus exemplos de SQLite, SQLAlchemy e CORS não representam esta aplicação.
