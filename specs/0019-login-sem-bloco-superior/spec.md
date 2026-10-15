---
numero: 0019
titulo: Login direto, sem bloco superior
tipo: melhoria
prioridade: P2
status: pronta
toca: [frontend]
depende_de: [0017]
---

# 0019 — Login direto, sem bloco superior

Issue: https://github.com/SamiaLuvanice/bestprice/issues/75

## Problema

Na tela de visitante, a área de login fica empilhada abaixo do cabeçalho de marca
(masthead) e do formulário de monitoramento por link (hero). Juntos, esses dois blocos
ocupam a primeira dobra e empurram os campos de entrada para baixo, de modo que quem
chega para entrar precisa rolar a página antes de ver o formulário.

Isso afeta qualquer pessoa não autenticada que abre o BestPrice com a intenção de entrar:
a ação principal da tela não está visível de imediato. Além disso, o formulário de link do
visitante é inócuo — sem sessão ele apenas devolve o aviso "Entre na sua conta para
monitorar este anúncio" — e por isso ocupa espaço sem oferecer função real.

Uma revisão da tela de login (14/10/2026, a partir do código; ainda sem medição no
navegador) levantou ainda lacunas que passam a fazer parte desta spec: o título da tela de
visitante perde o nível de título principal quando o hero sai; a marca fica sem nome
acessível; o indicador de foco dos campos depende só da cor da borda; os erros de
validação usam o balão nativo do navegador; o botão desabilitado durante o envio perde o
foco; o texto da coluna decorativa se repete; e a tela estreita fica sem marca.

## Relação com a 0017

Esta spec **revoga** os trechos abaixo da 0017; todo o restante da 0017 permanece,
inclusive a segunda metade do AC09 (contratos `/api/auth/*` sem alteração), o AC07
(rolagem, coluna oculta em 320 e 768 px, toque de 44 × 44 px) e o AC03 (campos E-mail e
Senha obrigatórios e com rótulo acessível — a obrigatoriedade continua, só a apresentação
do erro muda).

| Trecho da 0017 | O que muda |
|---|---|
| "Comportamento esperado": cabeçalho e formulário de link "continuam presentes, acima da área de login" | Deixam de existir na tela de visitante. |
| Intake, decisão 2 (formulário de link fica na tela de visitante) e AC09 (primeira metade) | O formulário de monitoramento por link deixa de existir na tela de visitante. |
| Intake, decisão 3 (cabeçalho e `h1` do hero continuam como identificação e título da página) | Na tela de visitante, o `h1` passa a ser "Bem-vindo de volta" (AC02) e a marca é identificada pela logo (AC12). |
| Intake, item 4 (exclui "validação própria com `novalidate`") | Passa a valer validação própria com mensagens em texto (AC07). A regra de 6 caracteres de senha continua excluída. |
| AC06 | O balão nativo cede lugar às mensagens do AC07. O foco no primeiro campo inválido e na senha após falha continuam. |
| AC05 e "Comportamento esperado" (parágrafo que diz que o botão "fica desabilitado") | "O botão fica desabilitado durante o envio" é substituído pelo AC08: o botão fica indisponível e com aparência distinta, mas mantém o foco. |
| AC08 | O contraste mínimo de 4,5:1 permanece; o AC10 desta spec redefine o pior caso a medir (ponto de maior brilho) e o estende às mensagens novas. |
| AC01 e "Comportamento esperado" (contêiner de vidro com brilhos) | Em até 840 px, o card não aplica desfoque de fundo nem exibe os brilhos (AC11). É decisão de design para a tela estreita, em que a coluna decorativa já não aparece, e não ganho de desempenho medido. Acima de 840 px nada muda. |
| AC02 (coluna fora da árvore de acessibilidade) | A coluna deixa de ser integralmente oculta aos leitores de tela: a logo passa a ter o nome "BestPrice" (AC12) e é a única exceção. |
| AC02 (texto da coluna) | O título e o cartão de destaque mudam e o parágrafo de apoio da coluna é removido (AC13). A regra "nenhum texto da coluna contém produto, preço…" passa a proibir dado de preço (valor ou variação) e nome de produto; a palavra "preço" em frase genérica é permitida. |

A coluna visual continua oculta em até 840 px e visível acima disso, como na 0017/AC01.

## Comportamento esperado

Na tela de visitante (quem ainda não está autenticado), a página passa a mostrar
diretamente a área de login: o cabeçalho de marca e o formulário de monitoramento por link
deixam de ser exibidos antes do formulário de entrada. Os campos E-mail e Senha e o botão
"Entrar" ficam visíveis na primeira dobra, sem rolagem, em viewport de 640 px de altura.

A tela de login é refinada em acessibilidade, validação, texto e marca (critérios abaixo).
A composição — card com a coluna visual decorativa em telas largas, título "Bem-vindo de
volta", controle de mostrar/ocultar senha e botão em pílula — permanece a da 0017, assim
como o comportamento de autenticação.

A tela deve ter o landmark `main` como contêiner do conteúdo principal (AC01). A entrega
separa os commits por grupo de critério (remoção do bloco superior, acessibilidade e
validação, marca e texto), conforme o `git.md`.

A remoção dos blocos vale apenas para a tela de visitante; as telas de carregamento e de
sessão indisponível continuam com o visual atual. O tema claro fixo (0016) e os contratos
de backend (0011) não mudam.

## Critérios de aceite

### Remoção do bloco superior

- [ ] **AC01** — Dado um visitante não autenticado, quando a tela de login renderiza, então
      o cabeçalho de marca e o formulário de monitoramento por link não fazem parte da
      página, e o primeiro elemento dentro do conteúdo principal (`main`) é a área de
      login.
- [ ] **AC02** — Dado um visitante não autenticado, quando a tela renderiza, então
      "Bem-vindo de volta" é o único título de nível 1 da página e não existe título de
      nível 2 anterior a ele.
- [ ] **AC03** — Dado um visitante não autenticado, sem alerta de erro, sem alerta de sessão
      encerrada e sem mensagens de validação visíveis, quando a tela renderiza em larguras
      de 320, 768 e 1280 px com viewport de 640 px de altura (emulação de dispositivo do
      DevTools), então os campos E-mail e Senha
      e o botão "Entrar" aparecem inteiros dentro da janela, sem rolagem vertical; o
      rodapé pode ficar abaixo da dobra; e não há rolagem horizontal. Com alerta ou
      mensagens de validação visíveis, o botão pode ficar abaixo da dobra, mas o alerta ou
      a primeira mensagem aparece inteiro na janela e não há rolagem horizontal.
- [ ] **AC04** — Dado o estado de carregamento da sessão ou o de sessão indisponível, quando
      a tela renderiza, então o cabeçalho de marca e o hero com o status continuam
      presentes (comprovado por teste automatizado).
- [ ] **AC05** — Dado o estado de carregamento ou o de sessão indisponível, quando
      conferido no navegador em 320, 768 e 1280 px, então o layout é igual ao da base
      `b431134`: sem deslocamento, corte ou rolagem horizontal novos. A comparação usa
      capturas de tela da base e da mudança, referenciadas em `verification.md` por
      link, com as imagens anexadas ao PR ou à issue (não são versionadas). Os estados de
      carregamento e de sessão indisponível são obtidos limitando a rede e derrubando o
      backend local.

### Acessibilidade e validação

- [ ] **AC06** — Dado o foco por teclado em E-mail ou Senha, então o campo mostra um
      indicador de foco além da cor da borda (contorno, anel ou espessura, à escolha do
      plano), com contraste de pelo menos 3:1 contra o fundo do card.
- [ ] **AC07** — Dado um envio com campos inválidos, então a API não é chamada e a validação
      acontece apenas no envio, não ao sair do campo. Os espaços nas pontas do e-mail são
      desconsiderados. Cada campo inválido mostra, em texto junto a ele, uma destas
      mensagens (sem o balão nativo do navegador):
      - E-mail vazio: "Informe seu e-mail."
      - E-mail em formato inválido: "Informe um e-mail válido, como nome@exemplo.com."
      - Senha vazia: "Informe sua senha."

      "Formato inválido" é o que não tem texto, `@` e domínio com ponto: `nome@exemplo.com`
      é aceito; `nome@exemplo`, `nome.exemplo.com`, `a@@b.com`, `nome@.com`,
      `nome@exemplo.` e e-mail com espaço no meio são recusados. Senha só com espaços é
      aceita (a 0017 não impõe regra de senha). Todos os campos inválidos mostram a
      mensagem ao mesmo tempo; cada campo fica marcado como inválido e associado à sua
      mensagem para leitores de tela; o foco vai ao primeiro campo inválido (se só a senha
      for inválida, vai à senha). A mensagem de um campo só aparece no envio e só some
      quando o campo volta a ser válido ao digitar; ela não reaparece até o próximo envio.
      As mensagens são texto associado ao campo, sem papel de alerta, para que o alerta
      único do AC15 continue sendo o do servidor. Se um novo envio falha na validação, o
      alerta de erro do servidor anterior é removido.
- [ ] **AC08** — Dado um envio em andamento, então o botão mostra "Entrando…", é anunciado
      como ocupado e indisponível, tem aparência distinta do estado normal (0017/AC05),
      ignora novos cliques e Enter, e permanece com o foco de teclado se o tinha. Quando o
      envio falha, o foco vai ao campo Senha, como na 0017/AC06. Quando tem sucesso, a
      tela de visitante deixa de existir e o foco segue o que a tela autenticada já faz,
      sem exigência nova nesta spec.
- [ ] **AC09** — Dado o campo E-mail, então ele não pede capitalização automática da
      primeira letra nem verificação ortográfica do endereço.
- [ ] **AC10** — Dado o texto da tela (subtítulo, rótulos, mensagens de validação, alerta e
      coluna visual), então o contraste é de pelo menos 4,5:1 medido contra o pior caso do
      fundo realmente exibido: o ponto de maior brilho atrás do texto. Como o DevTools não
      mede contraste sobre gradiente com vidro translúcido, a medição amostra pixels de
      uma captura de tela, acima de 840 px (vidro) e em até 840 px (sem desfoque, AC11).
      Este critério mantém o AC08 da 0017, redefine o pior caso a medir e o estende às
      mensagens novas.

### Marca, texto e efeitos

- [ ] **AC11** — Dado uma largura de até 840 px, então o card não aplica desfoque de fundo
      nem exibe os brilhos decorativos; acima de 840 px (testado em 840 e 841 px) o
      comportamento da 0017 se mantém. Comprova-se pelas propriedades computadas no
      DevTools. Este critério confere o comportamento visual, e não promete ganho de
      desempenho medido.
- [ ] **AC12** — Dado a logo oficial da tela de login, então ela tem o nome acessível
      "BestPrice" (teste automatizado). Em qualquer largura aparece apenas uma logo: a da
      coluna visual acima de 840 px e a reduzida do AC14 em até 840 px (QA no navegador).
      O resto da coluna visual continua decorativo, fora da árvore de acessibilidade.
- [ ] **AC13** — Dado a coluna visual em telas acima de 840 px, então o título é "Cole o
      link uma vez. A BestPrice acompanha o preço.", o parágrafo de apoio da coluna é
      removido e o cartão de destaque diz "Você é avisado quando o preço cair.". Os dois
      textos usam a voz do design system: a marca na terceira pessoa e "você".
- [ ] **AC14** — Dado uma largura de até 840 px, onde a coluna visual está oculta, então a
      logo oficial aparece em tamanho reduzido acima do título, com altura de até 32 px,
      sem violar o AC03 (QA no navegador); o teste automatizado confere apenas que a logo
      reduzida existe com o nome acessível do AC12.

### Regressão e acessibilidade geral

- [ ] **AC15** — Dado o novo arranjo, quando a suíte de login do frontend roda, então
      continuam comprovados, com os testes atualizados, o foco na senha após falha, o
      alerta único, o mostrar/ocultar senha com rótulo "Mostrar senha" e a entrada
      bem-sucedida, e a contagem de testes executados é maior que zero.
- [ ] **AC16** — Dado o novo arranjo, quando avaliado o acesso, então operação por teclado,
      `prefers-reduced-motion: reduce` e área de toque de ao menos 44 × 44 px (medida no
      botão "Entrar" e no controle de mostrar senha) seguem atendidos como na 0017.

### Como cada critério é comprovado

| Critério | Método |
|---|---|
| AC01, AC02, AC04, AC07, AC09, AC13, AC15 | teste automatizado (Vitest) |
| AC08 | teste automatizado (estado ocupado, cliques ignorados, foco) mais QA no navegador (aparência distinta do botão) |
| AC12, AC14 | teste automatizado (ao menos uma logo com o nome acessível; existência da logo reduzida) mais QA no navegador (uma logo por vez, tamanho) |
| AC03, AC05, AC06, AC10, AC11, AC16 | QA no navegador (DevTools, Chrome, zoom 100%, janela com 640 px de altura útil), com valores medidos em `verification.md` |

## Fora de escopo

- Alterações em endpoints, contratos REST, esquemas de banco ou regras do backend.
- Telas de carregamento e de sessão indisponível, que mantêm o visual atual.
- Os fluxos "Lembrar de mim", "Esqueceu a senha?" e "Criar conta", que a 0017 já exclui.
- Reflow a 200% de zoom (WCAG 1.4.10); o QA é feito a 100%.
- Tema, paleta, tipografia e demais elementos do design system (spec 0015/0016).

## Decisões registradas

- 14/10/2026 — Remover o cabeçalho e o hero apenas no estado de visitante.
- 14/10/2026 — A tela estreita ganha a logo reduzida (AC14). Isso substitui a decisão
  inicial desta spec, de aceitar a tela estreita sem logo.
- 14/10/2026 — A marca tem nome acessível em todas as larguras (AC12), porque o cabeçalho
  que a identificava saiu da tela.
- 14/10/2026 — Em telas estreitas a proposta "cole o link uma vez" deixa de aparecer no
  login. Aceito: o visitante vem para entrar e a proposta aparece depois, na tela
  autenticada; a coluna larga ainda a comunica.
- 14/10/2026 — Valem as exclusões da 0017 ("Esqueceu a senha?", "Criar conta").
- 14/10/2026 — A voz dos textos novos segue o design system (marca em terceira pessoa e
  "você"), e não "a gente" nem "avisamos".

## Perguntas em aberto

Nenhuma.
