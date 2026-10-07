---
name: react-vite-performance
description: Revisar desempenho de componentes React e da SPA Vite da BestPrice. Use ao escrever ou refatorar componentes, busca de dados e carregamento de módulos quando houver custo perceptível ou evidência de regressão.
---

# Desempenho React/Vite

Este projeto usa React com Vite e uma API FastAPI. Leia `.agents/rules/frontend.md` e o contrato da feature antes de otimizar. Priorize clareza e comportamento correto; compare o custo antes e depois quando afirmar ganho de desempenho.

- Inicie requisições independentes em paralelo quando o contrato permitir. Trate carregamento e falha de rede na UI.
- Use importação dinâmica para módulos pesados que aparecem apenas em fluxos secundários. Confira o resultado no build do Vite.
- Mantenha estado derivado no render; use atualização funcional quando o próximo estado depender do anterior.
- Use `memo`, `useMemo` e `useCallback` somente para evitar trabalho medido ou uma renderização cara conhecida. Evite cálculos triviais em `useMemo`.
- Para listas longas, investigue custo real de renderização antes de adicionar virtualização ou `content-visibility`.
- Prefira eventos passivos para listeners de rolagem quando não houver `preventDefault`.

Recursos como React Server Components, `next/dynamic`, Server Actions e `after()` pertencem a aplicações Next.js e não fazem parte desta SPA. Referência externa para consulta, sem cópia de regras: [Vercel React Best Practices](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices).
