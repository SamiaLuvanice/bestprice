# Plano — Spec 0009

## Escopo e abordagem

- Substituir o conteúdo genérico de `fastapi-templates` por um guia curto de início de novas partes FastAPI neste monorepo, encaminhando às skills de feature, persistência e testes já mantidas.
- Incorporar `frontend-design` com sua licença Apache 2.0, atribuição de origem e uma seção de aplicação à BestPrice. Ajustar a instrução de esclarecimento para usar a spec e o contexto conhecido.
- Criar uma skill original `react-vite-performance` para desempenho da SPA. Não copiar o pacote `vercel-react-best-practices`: ele contém regras exclusivas de Next.js e sua cópia local não inclui o aviso de licença completo.
- Atualizar os índices do harness e registrar as decisões na documentação da tarefa. O checkout principal mantém intactas as cópias recebidas.

## Arquivos

`specs/0009-skills-compativeis-com-a-stack/`, `.agents/skills/fastapi-templates/`, `.agents/skills/frontend-design/`, `.agents/skills/react-vite-performance/`, `.agents/AGENTS.md`, `docs/PROGRESS.md`.

## Decisões

O guia FastAPI será específico do projeto em vez de preservar exemplos genéricos, pois estes entram em conflito com a arquitetura atual. O material Vercel será referenciado por URL, sem republicar sua árvore de regras. Isso evita incorporar instruções Next.js na SPA Vite e um pacote sem aviso de licença verificável na cópia local.

## Riscos e verificação

As skills são instruções, não código da aplicação. Verificar metadados, links internos, ausência de exemplos conflitantes, sincronização dos adaptadores e diff. Gates de backend/frontend não demonstram o comportamento de uma skill e ficam fora desta tarefa.
