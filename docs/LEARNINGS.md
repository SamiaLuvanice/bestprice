# Aprendizados

As decisões da stack ativa ficam em `.agents/`, `README.md` e nas specs
`0007-reinicio-fastapi-react-postgresql` e `0008-project-sync-by-branch`.
O histórico da aplicação anterior está em `docs/archive/legacy-java-angular/`.

## 2026-10-06 — Separar CI de automações com permissão de escrita

CI de PR usa permissões de leitura e nenhum secret. A sincronização do Project
usa somente metadados atuais e código da branch padrão; publicação ocorre na
`main` após os gates. Project e deploy só devem ser considerados ativos quando
há evidência de execução real.

## 2026-10-06 — Validar a base depois da migração de stack

Ao trocar a stack, a configuração ativa precisa apontar para FastAPI, React e
PostgreSQL em todos os pontos: regras, skills, gates, documentação, Compose e
workflows. Material anterior deve ser arquivado ou removido da navegação ativa,
sem apagar evidências históricas necessárias para auditoria.
