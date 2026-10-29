# Fontes do projeto

Sem segredos, tokens ou senhas.

- Repositório: https://github.com/SamiaLuvanice/bestprice
- Especificações: specs/
- Arquitetura atual: docs/architecture.md; decisões de cada mudança ficam em specs/.
- Design/protótipo: designsystem/ local (identidade em `index.html`, regras de agentes em
  `agent-guidelines.md`, Brand Asset Protocol em `brand-spec.md`, artefatos gerados em
  `prototypes/`); não pressupor conteúdo versionado.
- Design no Figma: https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice. Copie o
  link do frame no Figma para o MCP resolver o node; exportações locais são fallback quando
  o MCP estiver indisponível ou limitado (ver docs/apps/frontend.md).
- Issues: https://github.com/SamiaLuvanice/bestprice/issues
- Actions: https://github.com/SamiaLuvanice/bestprice/actions
- Project: [Project 1 de SamiaLuvanice](https://github.com/users/SamiaLuvanice/projects/1) configurado; o workflow Project sync sincroniza Issues e PRs. PROJECT_TOKEN, PROJECT_OWNER e PROJECT_NUMBER foram conferidos em 11/10/2026. Confirme cada sincronização pela execução do workflow; veja [docs/github-workflow.md](../docs/github-workflow.md).
- Entrega: stage implantado em Render, Supabase e Cloudflare Pages; GHCR e releases após tag SemVer no SHA validado na ponta atual de stage. DEV e PROD ainda não têm implantação configurada.

Referências técnicas: https://fastapi.tiangolo.com/ · https://docs.python.org/3/ · https://www.postgresql.org/docs/ · https://react.dev/ · https://vite.dev/ · Context7 (documentação de bibliotecas por MCP)
