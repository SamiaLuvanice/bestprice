# Verificação — 0037

Data: 28/10/2026 (America/Sao_Paulo). Issue [#205](https://github.com/SamiaLuvanice/bestprice/issues/205).
Base origin/develop `7eb470f`; branch/worktree `feature/0037-issue-205-paper-images`.

## Gates executados

| Comando | Observado |
|---|---|
| `npm ci --ignore-scripts` na Bridge | Dependências travadas instaladas, 0 vulnerabilidades |
| `npm ci --offline --ignore-scripts` no frontend | 395 pacotes instalados, 0 vulnerabilidades; necessário para testes preexistentes de geração HTML |
| `npm run test:images` na Bridge | **9/9** testes, sem skip; serviço, arquivos e UI Chromium controlada |
| `npm test` na Bridge | **26/26**, sem skip; inclui dashboard real desktop/tablet/mobile |
| `npm run check` na Bridge | Sintaxe de módulos, testes e scripts aprovada |
| `node --test .github/scripts/*.test.cjs` na raiz | **50/50**, sem skip |
| `actionlint` v1.7.12 | Aprovado; binário oficial em diretório temporário, pois não estava no PATH |
| `git diff --check` | Sem erros |

Backend, banco e SPA de produto não foram alterados; gates específicos dessas
camadas não foram repetidos. O CI remoto ainda precisa rodar no PR.

## TDD e regressões

Red observado pela fronteira CLI: help não anunciava comandos de imagem. Green
após extensão da CLI. Red do serviço: geração e importação ainda não implementadas;
Green de preparo/confirmacão/reutilização e importação com manifesto. Validate
vazio inicialmente não existia; Green retorna checked:0 e verified:false.

O primeiro ensaio live importou os quatro formatos, mas a validação posterior
falhou: a troca de blob temporário por URL persistida alterava o fingerprint.
Regressão em Chromium reproduziu falha de igualdade; correção usa pixels
decodificados e detecta troca real de imagem. As quatro fixtures iniciais tiveram
registro corrigido somente após conferir pixels completos contra os arquivos
locais (raster) e assinatura anterior idêntica (SVG). Auditoria local:
`tools/paper-bridge/reports/fixture-fingerprint-migration.json`.

Revisão independente encontrou divergência possível entre parâmetros preparados
e os controles antes de submit. Teste Red alterando prompt exigiu rejeição e
falhou por ausência de bloqueio; Green relê prompt/modelo/proporção antes do
clique. O outro achado tratava primeiro resultado de Variety pack como conclusão;
agora geração múltipla é recusada antes de consumo e modelo individual exige
exatamente uma nova camada. Revisão final: sem achados bloqueantes remanescentes.

## Aceite e ensaios reais no documento de teste

| Critério | Evidência e limite |
|---|---|
| AC1 | `npm run paper -- image inspect` lê prompt, dez opções de modelo e sete proporções; `--kind svg` lê QuiverAI Arrow 2. Nenhum submit. Disabled é exercitado no formulário controlado. |
| AC2 | `image generate --prompt-file examples/hero.txt --aspect-ratio 16:9 --model 'Grok Very fast with usable quality'` preencheu controles reais e retornou confirmationRequired:true, verified:false. Confirmação específica, prazo de 15 min e mudança de parâmetros testados localmente. |
| AC3 | Testes cobrem modelo disabled/ausente, proporção ausente, confirmação alterada/expirada, timeout persistido e bloqueio de segunda submissão. Plano/credit gate real não provocado para evitar consumo; não há inferência de acesso gratuito. |
| AC4 | **Pendente de autorização e ensaio remoto.** UI controlada demonstra submit separado, espera, nova camada carregada e rejeição de alteração; não comprova conclusão da geração real do Paper. |
| AC5 | Atalho público Place image Ctrl+Shift+K abre filechooser `accept=image/*`. SVG, PNG, JPG e WebP importados no Paper; .jpeg segue o mesmo caminho de JPG e assinatura JPEG, sem ensaio separado da extensão. |
| AC6 | `examples/basket.svg` foi criado por código e importado como vetor `BK-0`; Create SVG foi inspecionado, sem geração remota. |
| AC7 | Cópias em assets/bestprice-ia/images/{svg,imported}, manifesto atômico state/images.json, hash, origem/utilização e IDs. Repetições reutilizaram os mesmos IDs. |
| AC8 | Os quatro subcomandos rodaram no documento de teste. Relatórios JSON/JSONL, screenshots e duração registram resultados/falhas. |

Ensaio corrigido: `npm run test:images:live` passou com **6 assets validados**, sem
nova geração. Raízes `BK-0` (SVG), `BP-0`/`BS-0` (PNG), `BQ-0`/`BT-0` (JPG),
`BR-0` (WebP). Duas versões raster são fixtures do diagnóstico/correção; nenhum
asset antigo foi apagado. WebP foi reutilizado por hash idêntico entre variantes.

Artefatos locais ignorados pelo Git:

- `tools/paper-bridge/reports/live-images.json`
- `tools/paper-bridge/reports/2026-10-28T10-56-55-274Z-39f3065c-image-validate-after.png`
- `tools/paper-bridge/reports/2026-10-28T10-50-47-375Z-c420d25e-image-generate-after.png`
- `tools/paper-bridge/state/images.json`

O documento BestPrice IA não foi alterado. Nenhum MCP oficial foi utilizado e
nenhuma API privada foi chamada. Leitura DOM, filechooser, teclado e decodificação
de recursos de imagem já expostos pelo DOM compõem o fluxo. A inspeção inicial
de um script foi recusada pelo auto-review por ambiguidade entre toolbar e submit;
o script restrito a `type=button` concluiu a inspeção sem geração.

## Limitações de entrega

Amostra raster até 128×128 não equivale a diff integral de pixels; canvas
virtualizado e edição manual concorrente permanecem limites. Erro/timeout após
tentativa guarda pendência antes do clique para evitar consumo duplicado;
`image validate` relata, mas não adota automaticamente resultados tardios.
Gerações registram origem/prompt/parâmetros/IDs no manifesto; o download de
arquivos gerados por exportação pública ainda não foi validado. O Paper pode
inserir arquivos em posições coincidentes; a Bridge cria camadas sem compor layout.

Uma confirmação para o pedido concreto foi solicitada ao usuário; sem resposta
autorizando, nenhuma geração real foi iniciada. Não há alegação de créditos
gratuitos, promoção ao documento BestPrice IA, merge ou deploy. A spec permanece
`pronta`, com AC4 pendente. Doc-sync-onboarding executado como etapa final após
gates/revisão; documentos e arquivos conferidos estão em [doc-sync.md](doc-sync.md).
Implementação entregue; aguarda revisão no [PR draft #206](https://github.com/SamiaLuvanice/bestprice/pull/206),
para develop, commit de código `67750d3`. Hooks de commit aprovados; branch publicada.
CI remoto iniciado, com Backend/Automation na fila e Frontend/PR policy em execução
na consulta inicial. Resultado final nos [checks da PR](https://github.com/SamiaLuvanice/bestprice/pull/206/checks).
