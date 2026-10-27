# Evidência frontend — 0034

Implementação entregue para revisão na worktree `feature-0034-issue-195-assistencia-compras-ai`, sem commit ou push. Direção A aprovada, contrato de `plan.md` preservado. Os screenshots e o QA com Chrome/API/PostgreSQL são coordenados pelo agente raiz e registrados separadamente.

## Escopo implementado

- Landing pública também autenticada; dashboard A, assistente, comparador e histórico em `/app` com retorno seguro após login e estados explícitos de carregamento, erro, vazio e indisponibilidade.
- Cliente REST valida respostas `unknown`, mensagens, instantes UTC, preços decimais e correspondência entre versão da comparação e análise. Respostas da IA são texto; nenhum HTML executável.
- Rascunho do dashboard fica em memória da montagem autenticada. O histórico de navegação recebe somente um token opaco; logout, 401, troca de conta e remontagem invalidam o acesso ao texto. Nova conversa limpa o rascunho. Callbacks obsoletos de chat, save, análise, histórico e logout não atualizam a montagem encerrada.
- Chat e análise mantêm `request_id` por até 24 h após falha de rede ou 409 `request_in_progress`; falha definitiva libera novo UUID. Conflito de versão bloqueia nova gravação/análise até recarregar o registro. Alterações escondem a análise anterior até salvar e analisar a versão atual.
- Comparação manual pode ser salva com IA desativada. Campos preservam a digitação; preço brasileiro, inclusive `1.899,90`, só é normalizado no envio. Falha ao abrir comparação existente não oferece formulário nem cria outra comparação.
- Histórico busca por título, filtra tipo, pagina, retoma e confirma exclusão. Cancelar não envia DELETE; falha mantém registro e confirmação acessíveis.
- Disclosure anterior ao envio: processamento pelo Google, possível uso do conteúdo na cota gratuita, não inserir dados pessoais/confidenciais, retenção no BestPrice de 90 dias desde criação, limites da exclusão e dados de mercado não verificados.
- Painel completo antigo em `/app/monitoring/overview`; lista, alertas e detalhes com aliases explícitos. Rotas legadas e respectivas assertions permanecem. Em mobile, monitoramento mantém navegação legada única e retorno “Espaço de compras”; desktop evita marca duplicada.
- Marca original preservada, ícone 40 px e alvos 44 px; tokens locais, foco, Escape/Tab, estados sem valores inventados. Drawer fecha quando o foco sai e Escape retorna ao acionador.
- Vite permite `API_PROXY_TARGET` somente no servidor. Nginx permite 35 s apenas para chat/analyze (adapter 25 s); endpoints anteriores continuam 5 s e fallback da SPA é preservado.

## TDD e gates executados

| Comando / ciclo | Resultado observado |
|---|---|
| Baseline `npm test -- --run --maxWorkers=2` antes das telas |31 arquivos,350 testes aprovados;237,67 s. |
| Primeiro Red `npm test -- --run src/research.test.tsx --maxWorkers=2` |4 testes executados,4 falhas esperadas por ausência das telas/rotas. |
| Green inicial e refinamento | Primeira execução 3/4; corrigido espaço no nome acessível do título com quebra de linha. Os 4 passaram na execução posterior de 7 testes. |
| Red de comparação existente e preço colado |7 executados:4 passaram,3 falharam exatamente por formulário após 404/503 e alteração `1.899,90`→`1,899,90`. |
| Red de privacidade |1 executado: falhou porque B recebeu rascunho da conta A ao reabrir entrada antiga do navegador. |
| Red de navegação por teclado |1 executado: Tab deixava drawer aberto ao sair. |
| Green das telas `npm test -- --run src/research.test.tsx --maxWorkers=2` |12/12 aprovados;7,46 s. |
| Red de conflito da análise |1 executado: botão ainda permitia análise com versão em conflito. |
| `npm test -- --run src/research.test.tsx src/features/research/api.test.ts --maxWorkers=1` |2 arquivos,16/16 aprovados;9,68 s. Inclui 409 pendente, conflito/reload, HTML como texto, exclusão e DTO inválido. |
| Primeira suíte completa após implementação |33 arquivos,365 testes:363 aprovados e 2 timeouts de 15 s (hero `already_tracked` e routes login/recarga), sob gates concorrentes;178,40 s. Não declarada verde. |
| Suíte completa `npm test -- --run --maxWorkers=1` | 33 arquivos, 366/366 testes aprovados; 248,84 s. Sem aumentar timeout. |
| Red de recuperação PUT/analyze 409 | 2 executados, 2 falhas esperadas: dirty após reload e síntese antiga ainda visível após conflito. |
| Red do skip-link de monitoramento | 1 executado, 1 falha esperada: alvo `#research-content` inexistente no monitoramento. |
| Regressões finais `npm test -- --run src/research.test.tsx src/features/research/api.test.ts --maxWorkers=1` | 2 arquivos, 18/18 aprovados; 21,69 s. Executado após as últimas correções e inclui os dois casos adicionados após a importação da suíte completa. |
| `npm run lint` | Execução final aprovada sem erro ou warning. |
| `npm run build` | Execução final aprovada: 2658 módulos, main 410,27 kB (gzip125,58 kB), CSS85,85 kB (gzip16,80 kB); Vite5,52 s. Uma execução anterior detectou propriedade inválida `exact` no teste; corrigida antes desta execução. |
| `impeccable.cmd detect frontend/src/features/research --json` | Aprovado, resultado `[]`. |
| `git diff --check -- frontend` | Aprovado (apenas avisos informativos de conversão LF/CRLF). |

## Ajuste após QA visual da marca

A execução visual da coordenação reproduziu Red no teste existente de identidade: a marca da landing em 23 px herdava tracking calculado a partir do parent de 22 px (−0,242 px em vez de −0,253 px). A correção declara `letter-spacing: -.011em` em `.research-brand .brand-name`, de modo que acompanhe também a marca compacta de 19 px sem modificar o componente Brand global nem enfraquecer a assertion.

O axe com tag `wcag21a` identificou também `label-content-name-mismatch`: a composição produzia texto visível `BestPriceAI`, sem o espaço presente no nome acessível. Espaço explícito entre Brand e AI foi aplicado na landing, sidebar e topbar mobile; assertions de texto visível reforçam o contrato nos testes existentes das telas. A coordenação repetirá marca/axe e revisará novamente as oito capturas da landing antes de alterar baselines.

Após estes ajustes: `npm run lint` aprovado; `npm run build` aprovado (2658 módulos, main410,28 kB, CSS85,87 kB, Vite8,74 s); `npm test -- --run src/research.test.tsx src/features/research/api.test.ts --maxWorkers=1` aprovado, 18/18 testes em119,21 s sob carga concorrente da execução visual. Não foi alterado timeout nem regenerado snapshot por este implementador.

## Limites e continuidade

Não houve chamada real ao Gemini nem uso de chave real. IA permanece condicionada às capabilities reais e configuração do backend; testes de geração usam a fronteira HTTP simulada. O agente raiz executa QA real, revisão independente, baselines visuais e doc-sync-onboarding final. Os harnesses visuais antigos migraram o destino do painel e os nomes acessíveis da marca/CTA sem regenerar snapshots. Não são reivindicados resultados de comandos não executados, nem conclusão da spec ou integração em `develop`.
