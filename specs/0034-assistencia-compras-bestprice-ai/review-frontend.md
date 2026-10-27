# Revisão independente do frontend da spec 0034

Rodada de implementação na worktree da Issue #195. Papel: arch-reviewer.
Parecer após revalidação: **código aprovado na revisão independente, sem achado
bloqueante remanescente identificado**. Gates finais e matriz visual/baselines
continuam condições de evidência separadas da aprovação do código.
As linhas abaixo identificam a versão lida antes dos ajustes dos implementadores.

## RF01 P1 Rascunho de outra sessão recuperável pelo histórico

Arquivos: `frontend/src/features/research/ResearchArea.tsx`, transporte do prompt
do dashboard, e `AssistantPage.tsx:14–16`.

O dashboard coloca o rascunho em location.state; o assistente consome esse texto
sem verificar sua sessão de origem. Montar a área com key=user.id limpa os estados
dos componentes, mas não as entradas de history.state do navegador.

Cenário: A abre o assistente a partir de um rascunho, navega ao histórico e sai;
B entra; ao voltar até a entrada anterior do assistente, a tela inicializa com
o texto de A. Isso expõe conteúdo privado entre sessões e viola AC24.

Correção solicitada: transporte efêmero vinculado à sessão, invalidado no logout
e validado antes do consumo. Cobrir retorno à entrada anterior com rascunho após
troca de conta e também após saída/entrada da mesma conta.

## RF02 P2 Falha ao carregar comparação permite criar outra no endereço antigo

Arquivo: `frontend/src/features/research/ComparisonPage.tsx:31–64,88`.

Após GET do recurso existente falhar, loading fica false e saved continua null.
O formulário é exibido; Salvar usa POST por não haver saved, mas não navega ao
novo ID porque a URL já contém id. A pessoa pode receber “Comparação salva” em um
endereço que não corresponde ao registro criado e que continuará falhando após
recarga.

Correção solicitada: não permitir edição/salvamento de um destino existente até
o carregamento concluir com sucesso. Cobrir GET 404 e 503 e provar ausência de
POST acidental, com caminho explícito para nova comparação ou nova tentativa.

## RF03 P2 Conversão repetida corrompe preço digitado com separador de milhar

Arquivo: `frontend/src/features/research/ComparisonPage.tsx:94`.

O value aplica targetPriceInput tanto ao valor canônico recebido quanto ao texto
já digitado. Esse helper troca o primeiro ponto por vírgula. Colar `1.899,90`
produz `1,899,90`, que não é aceito pelo normalizador no salvamento. O normalizador
existente aceita a entrada original; a corrupção acontece no controle.

Correção solicitada: converter o preço canônico para texto de edição apenas ao
carregar/salvar e preservar a string digitada até normalizar na fronteira. Cobrir
digitação/colagem e reabertura de valor `1899.90` como `1899,90`.

## RF04 P2 Foco pode sair do menu móvel e ficar sob a sobreposição

Arquivo: `frontend/src/features/research/ResearchArea.tsx:35–37,57–65` e regra
mobile de `.research-sidebar.is-open` em `research.css`.

O menu fixo cobre o conteúdo, mas não contém o foco nem fecha quando ele sai da
sidebar. Tab após o último link alcança controles cobertos pela sobreposição,
deixando foco invisível. Escape e clique em links, sozinhos, não cobrem essa saída.

Correção solicitada: fechar ao sair por foco ou adotar navegação modal com foco
contido/retorno ao botão. Cobrir sequência de Tab/Shift+Tab e Escape na composição
mobile, preservando a navegação de teclado do desktop.

## Escopo examinado e limites

Foram lidos os oito arquivos novos de `features/research`, o novo conjunto de
testes, alterações de App, cliente HTTP, retorno seguro, landing, aliases de
monitoramento e configurações Vite/Nginx. As respostas são renderizadas como
texto e o cliente valida dados unknown na fronteira; indisponibilidade do
histórico não é apresentada como ausência de registros.

Os quatro achados foram comunicados ao coordenador durante a revisão. RF01 já
estava sendo tratado pelo implementador ao registrar este documento. Não
alterei código ou testes. Não executei browser/axe, lint, Vitest ou build nesta
rodada; o coordenador está preparando QA independente. Comparação visual,
contraste e dimensões finais dependem de observação em navegador, não desta leitura.

Nenhum resultado de teste com fixtures comprova operação real do provider ou
integração de banco.

## Revalidação e fechamento dos achados

| Achado | Correção conferida no código e regressão inspecionada | Situação |
|---|---|---|
| RF01 privacidade do rascunho | ResearchArea guarda texto em Map da montagem autenticada; history.state contém somente token opaco. AssistantPage recebe o texto resolvido pela montagem. Há regressão de troca de conta e restauração de entrada antiga | Resolvido |
| RF02 formulário após falha de GET | Registro existente só oferece formulário se tiver sido carregado; save também recusa id presente sem saved; casos 404/503 verificam ausência de POST acidental | Resolvido |
| RF03 preço de edição | Conversão canônica acontece em editableInput ao carregar/salvar; o controle conserva a string digitada; regressão comprova `1.899,90` enviado como `1899.90` | Resolvido |
| RF04 foco no menu | Sidebar fecha ao foco sair da região; Escape devolve foco ao toggle; sequência de teclado consta em teste e no relatório de browser | Resolvido |

### RF05 P2 Recuperação de conflito e síntese antiga

Na revisão do fluxo novo de 409 foi identificado que GET de recuperação não
limpava dirty após conflito de gravação, mantendo análise bloqueada mesmo após
recuperar a versão atual. Também era possível continuar mostrando análise anterior
após conflito de versão, porque sua apresentação verificava !dirty, mas não
!conflicted.

**Resolvido:** GET bem-sucedido agora limpa dirty/conflicted/status; síntese
somente aparece com !dirty e !conflicted. Foram inspecionadas as regressões
específicas de PUT409 → recarga e de análise prévia escondida após conflito.

### RF06 P2 Alvo do skip link no monitoramento

O layout novo apontava sempre a research-content, mas o main preservado de
AccountArea tem id conteudo. **Resolvido:** o href usa #conteudo para monitoramento
e #research-content para as demais páginas. A regra de marca duplicada no desktop
também foi ajustada para o span.brand efetivamente produzido pelo componente.

## Leitura independente dos artefatos de QA

Foram inspecionados os JSONs e o harness locais da coordenação:

- `qa-spec0034-journey-results.json`: 4 resultados aprovados e 0 falhas, cobrindo
  conversa/recarga, comparação/edição/análise, exclusão e acesso entre contas.
- `qa-spec0034-errors-results.json`: 6 resultados aprovados e 0 falhas, incluindo
  Tab/Escape, falha de rede/listagem, falha de save/delete e retry com mesmo UUID.
- O bootstrap de QA usa a aplicação e dependências locais reais e substitui somente
  get_provider; a implementação Google é bloqueada nesse processo. Isso confirma
  o limite declarado dos artefatos: integração local, não avaliação do Gemini real.
- A matriz final `qa-spec0034-results.json` foi relida: **38 aprovados, 0 falhas**.
  Inclui 32 combinações de oito rotas com 320/390/768/1280 px para renderização,
  axe e overflow, além de health pelo proxy, autenticação com retorno ao deep link,
  rascunho sem texto na URL, comparação salva/reaberta na API/PostgreSQL,
  histórico persistido e ausência de erros não capturados no navegador.

Também foram vistas as capturas atuais `spec0034-1280-dashboard.png`,
`spec0034-390-compare.png` e `spec0034-390-landing.png`. Nessas superfícies, a
hierarquia e a marca são coerentes com a direção A, o comparador é legível e a
landing explica a assistência e retenção sem mostrar preços fictícios. O anel
de foco dos títulos é visível. Captura fullPage com barra fixa não comprova,
isoladamente, toda a interação de rolagem e teclado.

Não executei novamente os comandos de teste desses artefatos nem a suíte
frontend. A coordenação comunicou suíte final com 366 testes, 18 testes afetados,
lint e build aprovados; esses comandos não foram reexecutados pelo revisor.
A leitura independente dos três relatórios locais confirma 38 + 4 + 6 resultados
aprovados e zero falhas, dentro do limite de provider simulado na fronteira.

## Aprovação restrita dos oito baselines da landing

Foram conferidos os oito actuals e oito diffs em
`C:/Users/luvan/.codex/visualizations/2026/10/26/01a17919-9893-7493-81cb-696372adfa2d/landing-review/`,
com nomes `public-pages-tema-{light|dark}-landing-pública-viewport-{320|390|768|1280}-landing-{light|dark}-{actual|diff}.png`.
SHA256 confirma que light e dark são idênticos por viewport, tanto para actual
quanto para diff; foram inspecionados visualmente os quatro pares únicos.
Essa igualdade é coerente com a superfície pública clara preservada nos dois
esquemas de preferência.

Em 320 e 390 px, navegação compacta, CTAs empilhadas e seções em coluna ficam
legíveis, sem corte horizontal ou sobreposição concreta nos actuals. Em 768 px,
os passos em três colunas e a seção comparativa em duas colunas permanecem
legíveis; em 1280 px, hero e comparação em duas colunas mantêm hierarquia clara.
Marca, imagem, rodapé, texto de retenção de 90 dias e acesso ao monitoramento
estão presentes. Os diffs mostram a substituição intencional da mensagem de
monitoramento pela assistência da direção A, a remoção dos preços ilustrativos
e a redução de altura da página; não são prova de regressão por si só.

**Aprovada a regeneração exclusivamente destes oito baselines:**
`frontend/tests/visual/__screenshots__/viewport-{320,390,768,1280}/public-pages.spec.ts/landing-{light,dark}.png`.
Login e página 404 estão fora da aprovação. Nenhum baseline foi editado pelo
revisor. Após regenerar, a suíte visual deve rodar sem atualização para confirmar
a correspondência; a execução anterior sem update falhou pela comparação com as
oito imagens antigas. Essa aprovação visual não amplia a validação operacional
do provider nem encerra AC19.

A suíte de identidade identificou herança de espaçamento calculado para 22 px
no nome exibido a 23 px. O CSS final foi conferido: `research.css:6` aplica
`letter-spacing: -.011em` em `.research-brand .brand-name`.

**Revalidação final aprovada:** as oito capturas
`landing-final-{320|390|768|1280}-{light|dark}.png`, no mesmo diretório de artefatos,
incorporam o ajuste de tracking e o ajuste de nome acessível. SHA256 confirma
novamente igualdade light/dark por largura. As quatro imagens únicas foram
reinspecionadas integralmente em resolução original: marca e CTAs legíveis,
refluxo responsivo estável e nenhuma nova sobreposição ou recorte identificado.
Essa rodada substitui a aprovação pré-ajuste para a regeneração dos oito
baselines especificados; mantém a exigência de execução visual sem update após
regenerar e não aprova alterações em login ou 404.

## Fechamento da evidência local de QA

Após a adequação monetária, os JSONs de journey e errors foram relidos e mantêm
**4/4 e 6/6 aprovados**, sem falhas. A coordenação informa que essas rodadas foram
repetidas com API/autenticação/PostgreSQL reais no banco descartável
`bestprice_ui0034_numeric`, migrado do zero até head, com geração substituída
somente na fronteira externa. Também informa conferência SQL de Numeric(18,2)
e RLS habilitada nas seis tabelas research; essa consulta não foi reexecutada
pelo revisor. O relato é compatível com a migration e regressões examinadas na
revisão backend.

Foi conferido que o diff de screenshots altera somente os oito baselines landing
autorizados. Seis PNGs (390/768/1280, light/dark) têm SHA256 idêntico aos actuals
finais inspecionados. O PNG de 320 tem hash diferente; seu baseline final foi
aberto integralmente em resolução original e a composição aprovada foi
reconfirmada, sem novo defeito visual identificado.

A coordenação comunica **8/8 snapshots landing aprovados sem update** após a
regeneração e **8/8 casos afetados de marca/redesign aprovados**. A rodada visual
ampla anterior teve 129/132 aprovados; suas três falhas correspondiam ao tracking
e nome acessível da landing antes dos ajustes, cobertos novamente nos casos
afetados. Esses comandos não foram reexecutados pelo revisor. A matriz ampliada
final local permaneceu 38/38 segundo a coordenação, agora incluindo wcag21aa.

**Parecer de revisão/QA local: aprovado, sem bloqueio frontend remanescente
identificado**, com limites de execução e autoria acima. Não comprova CI, deploy,
uso real do fornecedor ou qualidade do modelo. A suíte backend final posterior
à mudança NUMERIC foi depois registrada em backend-evidence.md: 239 passed,
2 skipped e 1 warning; 46 casos focados aprovados. Foi conferida sua consistência
com verification.md, mantendo a autoria dos comandos no implementador/coordenador.

Na conferência final, spec.md conserva AC10, AC15 e AC19 abertos para o modelo
real e AC30 para o handoff, com legenda de escopo local/fixture e status pronta.
Isso é compatível com o parecer de revisão local e não anuncia conclusão
operacional da spec. Doc-sync permanece etapa documental final separada.

## Limite funcional de AC19

A jornada local comprova solicitação, persistência, versionamento e apresentação
de uma resposta controlada. As instruções de comparação exigem uso, prós, contras
e lacunas, mas essa resposta de fixture não demonstra qualidade contextual ou
correção factual do modelo real. AC19 permanece com avaliação operacional de
qualidade pendente, sem chave externa utilizada nesta revisão. A IA fica desativada
por padrão e a spec não deve ser declarada implementada apenas com essa evidência.
