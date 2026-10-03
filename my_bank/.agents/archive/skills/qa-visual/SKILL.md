---
name: qa-visual
description: Produzir evidência visual e E2E contra URLs e credenciais fornecidas pelo projeto consumidor.
---

# QA visual opcional

Use somente quando o projeto configurar `WEB_URL`, `QA_API_URL`, `QA_EMAIL` e
`QA_PASSWORD` no ambiente. Sem essas variáveis, pare: uma captura da tela de
login não prova o comportamento da aplicação.

Registre ambiente, commit, URL, viewport, conta sem expor a senha e resultado
em `docs/evidence/qa/<label>/RESUMO.md`. Nunca inclua credenciais, IDs de
domínio ou rotas específicas de outro projeto nesta skill.
