# Plano técnico

## Contratos

Nenhuma mudança REST, DTO, validação de rede, banco ou backend. Componentes de apresentação continuam delegando ações aos handlers existentes.

## Direção

Modo Operate no app e Persuade na landing. Manter mundo visual oficial: branco #fff, grafite #1d1d1f, superfície #f5f5f7, texto secundário #626267, verde #39ff14 para ação e rosa #c7005e para foco/acento. Fonte de sistema SF Pro/Helvetica existente. Não adicionar fontes remotas, imagens, efeitos de vidro ou métricas fictícias.

Landing: mais ritmo e hierarquia de texto, foto original e CTAs preservados; neutralizar destaque excessivo no título e reduzir números decorativos do processo. App: navegação ativa clara, campo de entrada em superfície leve, resumo com separação por grupos e alinhamento vertical, preço em primeiro plano, listas legíveis e controles com feedback. Login: manter fotografia lateral, reduzir medidas excessivas e unificar campos/ações. Detalhe: conservar gráfico escuro e dados exatos acessíveis, atenuar metadados secundários. 404: preservar recuperação e ilustração existente.

## Arquivos

- frontend/src/styles.css: tokens de ritmo, tamanho, movimento, foco, superfícies e aplicação transversal.
- frontend/src/landing/LandingPage.css e .tsx: composição responsiva, processo e fechamento acessível do menu.
- Componentes existentes de resumo/formulário/detalhe apenas onde markup melhora hierarquia; sem extrair componentes usados uma única vez.
- frontend/src/landing/LandingPage.test.tsx: regressão Escape e saída de foco com TDD.
- frontend/tests/visual/: auditoria e capturas existentes; testes novos apenas para lacunas observáveis.
- designsystem/README.md: registrar extensão antes da adoção.
- specs/0030-*/audit.md, verification.md: evidência e relatório.

## Ordem e riscos

1. Capturar base e auditar rotas/estados.
2. Registrar achados e aplicar tokens/componentes compartilhados.
3. Refinar layouts, landing/login, listas/detalhe/alertas e estados.
4. TDD para fechamento do menu e validação de navegador em quatro larguras.
5. Gates, revisão documentada, sincronização final por doc-sync-onboarding, PR para develop.

Snapshots públicos existentes mudarão intencionalmente; não aprovar baselines automaticamente. Gerar atual/diff e manter a atualização sujeita à revisão explícita. Sem afirmar ganho de performance sem medição; preservar lazy loading do gráfico e imagens. Testes simulados não validam operação real da API.
