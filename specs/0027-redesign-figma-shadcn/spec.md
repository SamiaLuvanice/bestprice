---
numero: 0027
titulo: Redesign aprovado do BestPrice
tipo: melhoria
prioridade: P2
status: pronta
toca: [frontend]
depende_de: [0013, 0021, 0024, 0025]
---

# 0027 — Redesign aprovado do BestPrice

Issue: https://github.com/SamiaLuvanice/bestprice/issues/153

## Problema

A interface atual não reproduz o redesign aprovado no Figma. Visitantes e usuários
precisam encontrar a mesma identidade e hierarquia em todas as telas.

## Comportamento esperado

Landing, login, início, produtos, detalhe, alertas e página não encontrada seguem
os quadros desktop/mobile aprovados. Marca original, verde para ação, rosa para
informação, superfícies claras e grafite compõem a experiência. A pessoa informa
somente o link do anúncio para monitorar; informações autenticadas vêm da API.
Estados de carregamento, vazio, falha e dados desatualizados continuam explícitos.

## Critérios de aceite

- [x] AC01: Landing reproduz composição, imagens fornecidas, seções de acompanhamento e alertas; suas ações permitem entrar e compreender o serviço.
- [x] AC02: Login reproduz a referência desktop/mobile e preserva validação, mostrar senha, envio único, erro e retorno seguro à rota solicitada.
- [x] AC03: Início apresenta título, formulário de link, indicadores reais, oportunidades e atualizações na hierarquia da referência.
- [x] AC04: Produtos apresenta listagem responsiva com preços, variação, disponibilidade, ações e paginação existentes.
- [x] AC05: Detalhe apresenta imagem, preço, contexto, histórico e configuração de alerta; gráfico usa apenas registros carregados e identifica cobertura parcial.
- [x] AC06: Alertas configurados e notificações preservam operações, estados e distinção lido/não lido; rotas inexistentes oferecem recuperação.
- [x] AC07: Todas as telas funcionam em 320, 768 e 1280 px sem rolagem horizontal da página, com foco visível, semântica e alvos de toque de 44 px.
- [x] AC08: Dados ilustrativos ficam restritos às peças públicas explicitamente identificadas; nenhum número do protótipo preenche listas, preços ou métricas da conta.
- [x] AC09: Contratos HTTP, autorização, rotas e comportamentos existentes continuam compatíveis; verificações de frontend passam.

## Fora de escopo

Cadastro público, novos canais de notificação, mudanças no backend, filtros temporais
que dependam de novo contrato, implantação e integração automática em develop.

## Perguntas em aberto

Direção já aprovada pelo usuário. A referência local é a pasta de SVGs de 21/10/2026,
associada ao arquivo Figma LZVtUEAycEzfbwL0H5YL3r. O conector devolveu autenticação
repetida, inclusive no diagnóstico de conta; alterações posteriores no Figma não
puderam ser consultadas. Navegação pública usa âncoras e entrada, sem expor dados de conta.
