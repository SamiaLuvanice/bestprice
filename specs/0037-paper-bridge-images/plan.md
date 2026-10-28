# Plano — 0037

Base: origin/develop 7eb470f; worktree feature/0037-issue-205-paper-images.

## Contrato CLI e arquitetura

Sem mudança REST, FastAPI ou SPA. Em tools/paper-bridge, acrescentar comandos
`image inspect`, `image generate --prompt-file`, `image import --file` e
`image validate`. `--kind svg` inspeciona/prepara Create SVG; SVG local usa import.
`--model` é o nome completo observado no menu, `--aspect-ratio` exige opção observada.
Geração sem `--confirm <id>` apenas prepara: retorna ID SHA256 de pedido, parâmetros,
prazo de 15 minutos e aviso de custo desconhecido. Confirmação não interativa é a
autorização explícita daquele pedido; não existe --yes genérico. Alteração de
prompt/parâmetros/modelos/documento ou pedido vencido exige nova preparação.

Separar descoberta/execução UI (image-ui.mjs), arquivos/manifesto (image-assets.mjs)
e serviço de comandos (images.mjs). Reutilizar conexão restrita ao documento de
teste, lock e relatórios antes/depois. Medir duração também em falhas.

## Evidência da inspeção anterior à implementação

28/10/2026, CDP local, título exato BestPrice Bridge Test · Paper. Toolbar
`button[aria-label="Create image"][type="button"]` abre diálogo; submit separado
`button[type="submit"]`. Prompt `textarea[name=prompt]`; menus por campos públicos
`input[name=model]` e `input[name=aspectRatio]` apenas para encontrar o botão irmão,
sem alterar input oculto. As opções vêm de menuitemradio, incluindo disabled.
Modelo Variety pack e proporção 1:1 são defaults observados; sete proporções e
dez opções de modelo (incluindo Variety pack). Create SVG tem QuiverAI Arrow 2.
Menu Hotkeys confirma Place image Ctrl+Shift+K. Nada foi gerado.

## Importação e persistência

Usar atalho público Place image e Playwright filechooser; verificar o MIME aceito
e, após seleção, clicar em área livre do canvas se houver modo de colocação.
O ensaio confirmou que Place image também importa SVG; nenhum fallback de
clipboard é necessário nesta implementação.
Validar extensão, assinatura/tamanho, recusar SVG ativo/recursos externos.
Copiar para assets/bestprice-ia/images/{imported,svg}; manifesto local atômico
em state/images.json: hash, origem informada (sem segredo/URL completa), arquivo,
utilização, documento, IDs, status pendente/validado, fingerprint visual.
Estado pendente após submissão/timeout impede repetição. `validate` relata a
pendência e exige conferência manual do canvas/manifesto; não adota nós novos
automaticamente. Gerações guardam prompt/hash/parâmetros e referências do canvas;
não acessar URL interna para baixar resultado sem exportação pública validada.

## Verificação e riscos

TDD pela CLI e serviço com UI injetada; testes Playwright de contrato em HTML
controlado e ensaios reais de inspeção/importação/validação no documento de teste.
Sem teste pago até confirmação específica. Não inferir conclusão de qualquer
nova camada: confirmar imagem/SVG carregado, geometria e fingerprint associado.
Sem retries em submissão/importação incerta. Registrar seleção e mudanças de UI
como limites; não ler estado interno React nem fazer requisições privadas.

## Ajustes confirmados pelos ensaios e revisão

O fingerprint raster inclui dimensões, propriedades visuais e pixels decodificados
amostrados em até 128×128; não usa URL, porque o Paper troca blob temporário pelo
asset persistido sem alterar os pixels. SVG usa o markup renderizado normalizado.
Isso não representa comparação integral por pixels nem comprovação de licença.

A revisão independente exigiu reler prompt, modelo e proporção antes do clique
de submit. A geração fica restrita a modelos individuais, com exatamente um novo
resultado carregado; Variety pack é inspecionado mas recusado antes de consumir
créditos, até demonstrar o término de todos os resultados. Nenhum fallback de
modelo é escolhido automaticamente. Sem --model, usa-se a seleção atual se for
um modelo individual; o default Variety pack exige seleção explícita.

O job Automation de .github/workflows/quality.yml instala a Bridge e Chromium e
executa sintaxe + test:images, com formulário local, sem CDP Paper ou créditos.
