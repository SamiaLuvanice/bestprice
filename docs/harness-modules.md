# Módulos do harness

O núcleo em .agents/modules.yaml reúne evidência, segurança, Git/worktree, specs, TDD, revisão, QA, orquestração e gates. O perfil técnico ativo fastapi-react-postgresql reúne architecture/backend/frontend/errors/datetime-pipeline e skills de FastAPI, persistência, testes, React, contrato e navegação. O agente `doc-sync-onboarding` integra o núcleo e sua skill integra o perfil técnico. Após qualquer alteração de código, execute esse agente por último, depois dos gates e da revisão, para conferir `AGENTS.md`, `CLAUDE.md` e os documentos afetados em `docs/`. Se o código mudar novamente, repita a sincronização. Integração GitHub usa Issue, PR, CI e entrega de imagens na main. Project é opcional; implantação externa não está configurada.

Somente os módulos e arquivos listados em `.agents/modules.yaml` integram o perfil ativo. Consulte as skills e regras ativas antes de desenvolver a aplicação.
