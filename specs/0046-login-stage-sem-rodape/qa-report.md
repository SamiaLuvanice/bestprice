# QA independente — 0046

04/11/2026. Papel `.agents/agents/qa.md`; worktree e branch
`feature/0046-issue-239-login-stage-sem-rodape`, base origin/develop `72689fe`.
Esta revisão não alterou produção, testes versionados nem baselines.

## Parecer

Aceite local da mudança de login, sem achado P0–P2 pendente neste escopo.
O rodapé e sua reserva de altura foram retirados sem remover a orientação de
Mercado Livre ou o retorno ao início. Marca, fotografia, controles e fontes da
aplicação foram preservados. Falhas da suíte global e limites da referência
continuam discriminados abaixo; este parecer não declara a suíte global verde,
login real contra banco, integração ou deploy.

## Verificação executada pela QA

Servidor próprio: `npm run dev -- --port 5186 --strictPort`, iniciado na worktree
depois que a execução global encerrou o servidor anterior; encerrado com Ctrl+C
após a QA. Navegador Chromium headless, API interceptada e dados fictícios.

`node test-results/qa-0046-capture.mjs` executou as etapas de layout em
320×640, 390×640, 768×640, 1280×640, 1440×640, 390×844 e 1440×1040.
Antes da etapa posterior que falhou pela fixture de sessão, todas as sete
iterações completaram estas assertivas: ausência de contentinfo e texto do
rodapé, altura mínima do login pelo menos igual ao viewport, início em y=0,
sem overflow horizontal ou controles cortados lateralmente, alvos interativos
de pelo menos 44×44 px, botão verde `rgb(57, 255, 20)`, conteúdo de apoio/retorno
preservado, validação local de e-mail com foco e zero violações axe nas tags
WCAG 2/2.1/2.2 A/AA. Não se contabiliza esse comando inteiro como verde.

No mesmo comando completaram as etapas de interação: senha mostrada por teclado,
foco visível (outline solid) com movimento reduzido, envio ocupado sem rodapé,
401 com campos preservados e retorno do foco à senha, novo envio bem-sucedido
com returnTo=/produtos e rodapé da área Produtos preservado. As variantes /LOGIN
e /login/ também renderizaram o login sem rodapé após a correção com matchPath.

A etapa inicial de sessão usava a primeira chamada de /api/auth/me como pendente
e respondia 401 à segunda. O StrictMode de desenvolvimento faz duas chamadas;
a resposta ativa 401 ultrapassava o 503 e tornava inválida a expectativa de alerta.
Corrigida somente a fixture temporária para suspender todas as chamadas iniciais
até a liberação comum. Nenhuma correção de produção foi sugerida por essa falha.

`node test-results/qa-0046-session.mjs`: **6/6 cenários concluídos**, exit 0.
HTTP 503 e falha de rede foram demonstrados desde a sessão pendente, sem rodapé
durante carga, erro e recuperação. Depois do Tentar novamente, o formulário
voltou sem rodapé. /LOGIN e /login/ foram verificados novamente sem rodapé;
landing e rota inexistente mantiveram seus rodapés visíveis.

`git diff --quiet origin/develop -- frontend/src/LoginForm.tsx frontend/src/components/Brand.tsx frontend/src/assets`:
exit 0. Esses componentes e assets não foram alterados pela implementação.

## Comparação visual

Foram abertas as exportações Figma de 04/11/2026 e as capturas locais nas mesmas
dimensões: desktop 1440×1040 e mobile 390×844. Também foram inspecionadas as
capturas locais 320×640, 768×640, 1280×640 e o estado mobile de erro de credenciais.
Sem rodapé/divisória/faixa inferior, cortes de texto/controle ou sobreposições
observados. A fotografia ocupa a coluna esquerda no desktop; a coluna direita
mantém o formulário. No mobile o formulário ocupa a largura disponível.

As capturas iniciais de desktop não esperavam a decodificação do background CSS;
uma captura 1440×1040 ficou com a coluna branca. Essa imagem foi substituída por
captura após decode explícito da fotografia e dois frames de pintura. A imagem
final conferida contém a arte original. Não se tratou o estado incompleto da
captura como decisão de design nem como prova de fidelidade.

Diferenças de tipografia/quebras em relação ao desenho são limitadas pela
equivalência Arimo do Figma, já registrada na spec. A implementação conserva as
fontes reais da SPA e o conteúdo de stage; não foram introduzidas quebras manuais
para imitar os blocos estáticos do desenho. Não se declara paridade pixel a pixel.

Capturas e dados finais preservados fora do repositório em:
`C:/Users/luvan/.codex/visualizations/2026/11/04/01a1a6db-5f5a-7c80-bd73-ce67a5426697/0046-qa/qa-0046/`.
Arquivos principais: login-1440x1040.png, login-390x844.png,
login-320x640.png, login-768x640.png, login-1280x640.png,
login-busy-mobile.png, login-error-mobile.png, login-session-503.png,
login-session-network.png e session-observations.json.

## Suíte global e snapshots

A execução global foi assumida pelo orquestrador para evitar execuções concorrentes
sobre o mesmo diretório de resultados. Resultado informado pelo orquestrador:
196 previstos, 67 passaram, 12 falharam e 117 não executaram após max-failures=12.
As falhas de login refletem os snapshots anteriores com rodapé (alturas 703/705 px
contra 640 px sem o bloco). Os arquivos actual/expected/diff de login 320/390,
temas light/dark, foram preservados pela QA na pasta de visualizações 0046-qa,
antes de qualquer execução posterior apagar test-results.

O orquestrador comprovou separadamente as falhas landing/brand na base detached
72689fe: capturas landing base/feature byte-idênticas por SHA-256 e falha de logo
34 px contra expectativa mínima de 40 px reproduzida. A QA não alterou essas telas
nem declara esses testes aprovados. O reviewer autorizou a renovação dos oito
snapshots de login após inspeção das diferenças intencionais; a renovação e a
reexecução dos testes pertinentes ficam registradas pelo orquestrador, não por
inferência deste relatório.

## Matriz de aceite

| Critério | Evidência | Situação local |
|---|---|---|
| AC01 | Componentes/assets preservados; comparação 1440×1040 e 390×844 com origem identificada | Demonstrado com limite tipográfico do Figma |
| AC02 | Login/returnTo, variantes de URL, validação, ocupado, 401, sessão pendente/503/rede/recuperação sem footer; altura mínima sem desconto | Demonstrado |
| AC03 | Nota do Mercado Livre e link Voltar para o início visíveis e corretos nas capturas e assertivas | Demonstrado |
| AC04 | Exportações 59:44 e 59:602 de 04/11/2026, etapa de design anterior documentada | Evidência anterior conferida; remoto não relido nesta QA |
| AC05 | Teclado no toggle, campos/foco após 401, busy, sucesso e retorno seguro para /produtos | Demonstrado com API controlada |
| AC06 | Sete combinações de dimensões, axe0, alvos44, foco e inspeções de layout/erro | Demonstrado automaticamente; dispositivos assistivos reais não testados |
| AC07 | Footer da landing, rota inexistente e Produtos; ausência de alterações em fontes/assets/formulário | Demonstrado |

Não houve teste de /api/health com PostgreSQL real: esta spec não altera API nem
banco. Backend/CI, doc-sync final, publicação e revisão da PR pertencem ao handoff
do orquestrador e não foram presumidos por esta QA.
