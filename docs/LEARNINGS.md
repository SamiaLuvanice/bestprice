# Aprendizados

As decisões ativas ficam em `.agents/`, no [contexto do produto](product-context.md), `README.md` e nas specs em `specs/`.

## 2026-10-07 — Distinguir visão de produto de funcionalidades entregues

**Contexto:** o responsável definiu o BestPrice como produto real de monitoramento automático da Amazon por URL; o checkout ainda contém apenas a base de comunicação entre frontend, API e banco.

**Princípio:** preservar o fluxo de entrada apenas por URL nas futuras specs e registrar a visão de produção em uma referência de produto. Documentação técnica deve distinguir explicitamente capacidades existentes, requisitos futuros e decisões pendentes.

**Anti-pattern:** tratar a base atual como produto pronto, exigir cadastro manual de dados obtidos pela integração ou documentar ORM, autenticação e deploy como existentes antes de implementá-los.

**Referências:** [contexto do produto](product-context.md), [arquitetura](architecture.md) e [regra de workspace](../.agents/rules/workspace.md).

## 2026-10-07 — Manter o índice alinhado aos documentos ativos

**Contexto:** uma revisão encontrou links de onboarding para documentos que não
fazem parte da documentação atual do projeto.

**Princípio:** confira se cada destino existe no checkout e atualize o índice na
mesma mudança que remove ou substitui um documento.

**Anti-pattern:** deixar links para materiais retirados ou fora do escopo atual.

**Referências:** `docs/index.md` e a revisão da documentação de onboarding.

## 2026-10-06 — Separar CI de automações com permissão de escrita

CI de PR usa permissões de leitura e nenhum secret. A sincronização do Project
usa somente metadados atuais e código da branch padrão; publicação ocorre na
`main` após os gates. Project e deploy só devem ser considerados ativos quando
há evidência de execução real.

## 2026-10-06 — Validar a base depois da migração de stack

Ao trocar a stack, a configuração ativa precisa apontar para FastAPI, React e
PostgreSQL em todos os pontos: regras, skills, gates, documentação, Compose e
workflows. As instruções e os links publicados devem corresponder aos arquivos
e ferramentas que fazem parte do projeto naquele momento.
