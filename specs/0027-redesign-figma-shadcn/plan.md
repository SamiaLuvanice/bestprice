# Plano — 0027

## Referência e direção fixadas

Usar os SVGs de `designsystem/prototypes/2026-10-21-bestprice-figma`.
Paleta: branco #fff, superfície #f5f5f7, texto #1d1d1f, grafite #18171b,
rosa #c7005e, ação #39ff14; fonte sans do sistema conforme identidade existente.
Desktop com conteúdo de até 1248 px, cabeçalho horizontal, leitura por linhas;
mobile com conteúdo empilhado e navegação inferior na conta. Landing com fotografia
e painel ilustrativo grafite; login com arte lateral apenas no desktop.
O brief fixa composição e identidade: não há rodada de novas direções.

## Contrato

Nenhuma alteração REST. `api.ts`, cookies, DTOs, dinheiro decimal e instantes UTC
continuam como estão. Gráfico usa Recharts e Chart oficial do shadcn/ui (pedido explícito do usuário), com `HistoryEntry[]`, sem interpolar preços ausentes
nem calcular métricas monetárias. Coordenadas numéricas só para apresentação.

## Implementação

1. Configurar Tailwind v4 via plugin Vite, aliases `@/`, `components.json` e utilitário cn.
2. Adicionar componentes locais pelo CLI oficial shadcn/ui: button, input, card,
   badge, table, separator, skeleton. Incorporar controles e superfícies aos fluxos.
3. Reproduzir landing e login com imagens fornecidas, mantendo entrada; os CTAs aprovados levam ao login porque cadastro público não existe.
4. Reorganizar cabeçalho, formulário, indicadores, tabelas, detalhe e alertas.
5. Acrescentar visualização acessível do histórico junto à lista textual existente.
6. Ajustar CSS existente e remover estilos visuais substituídos para evitar cascata contraditória.

shadcn/ui distribui código local; a identidade BestPrice governa seus tokens.
Preferir primitivos oficiais a reimplementar controles. Não migrar menus/diálogos
com foco já estabelecido sem necessidade, para reduzir risco de regressão.

## Riscos e verificação

Tailwind preflight pode modificar controles existentes: revisar estilos globais,
rodar suíte de comportamento e capturar todas as rotas nos três viewports.
Baselines da 0025 representam design anterior: registrar diferenças esperadas sem
substituir referências silenciosamente. Comparar capturas novas com SVGs.
Rodar lint, Vitest, build, Playwright e detector de design; revisão independente;
doc-sync-onboarding por último. Entregar branch/PR para develop sem merge.
