---
numero: 0017
titulo: Redesign da página de login com referência oficial
tipo: melhoria
prioridade: P2
status: pronta
toca: [frontend, docs]
depende_de: [0011, 0015, 0016]
---

# 0017 — Redesign da página de login com referência oficial

Issue: https://github.com/SamiaLuvanice/bestprice/issues/56

## Problema

A área de login da tela de visitante ainda é um painel provisório e compacto. Ela não
reflete a composição em duas colunas, a linguagem de vidro (Liquid Glass) e as
conveniências de uso do protótipo oficial `designsystem/login.html`.

Isso afeta qualquer pessoa não autenticada que acessa o BestPrice: a primeira impressão
do produto fica aquém da identidade visual, e não há como conferir a senha digitada antes
de enviar.

## Comportamento esperado

Na tela de visitante, a área de login é redesenhada com base na composição de
`designsystem/login.html`, dentro de um contêiner de vidro sobre fundo claro com brilhos
ambientes sutis. O cabeçalho da página (logo oficial) e o formulário de monitoramento por
link continuam presentes, acima da área de login, para que novos visitantes experimentem a
proposta central antes de entrar.

Em telas largas, a área de login tem duas colunas:

1. **Coluna visual (esquerda), puramente decorativa:** a logo oficial sem distorção nem
   corte, tratada como decorativa porque a marca já está no cabeçalho; a frase de destaque
   "Acompanhe preços com a calma de uma vitrine." e um texto curto sobre monitoramento
   automático; e um card ilustrativo de vidro **sem dados**, isto é, sem produto, preço,
   percentual, contagem ou horário, apenas ícone e frase de benefício. Nenhum elemento da
   coluna é título de página nem repete o nome da marca para leitores de tela.
2. **Painel do formulário (direita):** título "Bem-vindo de volta" com um subtítulo
   orientador; campos E-mail e Senha; um controle para mostrar ou ocultar a senha; e o
   botão de ação primária "Entrar", em formato pílula, com a cor de ação do design system.

A tela não oferece "Lembrar de mim", "Esqueceu a senha?", "Criar conta" nem o separador
"OU" do protótipo, porque esses recursos não existem (spec 0011) e uma pessoa real não deve
encontrar controles sem efeito.

A validação continua a da spec 0011: campos vazios ou e-mail inválido impedem o envio,
indicam o que corrigir e levam o foco ao primeiro campo inválido. O cliente não impõe
regra de tamanho de senha.

Durante o envio, o botão mostra "Entrando…" e fica desabilitado, impedindo envios
duplicados. A senha volta a ficar oculta a cada tentativa disparada. Após uma falha, o foco
volta ao campo Senha para que quem usa teclado tente de novo sem percorrer a página. Erros de autenticação, de conexão,
de indisponibilidade e o aviso de sessão encerrada continuam anunciados como alerta.

Em telas estreitas, a coluna visual é ocultada e o formulário ocupa a largura disponível,
sem rolagem horizontal. O tema permanece o claro fixo da spec 0016. Com preferência por
movimento reduzido, transições e animações não essenciais são suprimidas.

## Critérios de aceite

- [ ] **AC01** — Com viewport acima de 840 px, a área de login aparece num contêiner de
      vidro sobre fundo com brilhos ambientes, em duas colunas: visual à esquerda e
      formulário à direita. Sem suporte a `backdrop-filter`, o contêiner mantém superfície
      sólida legível.
- [ ] **AC02** — A coluna visual mostra a logo oficial sem distorção nem corte, a frase de
      destaque, o texto de apoio e um card ilustrativo. A coluna inteira fica fora da
      árvore de acessibilidade (logo decorativa, sem `h1` extra, sem repetir "BestPrice").
      Nenhum texto da coluna contém produto, preço, percentual, contagem ou horário.
- [ ] **AC03** — O painel tem um título "Bem-vindo de volta" e campos E-mail
      (`type="email"`, `autocomplete="email"`) e Senha (`autocomplete="current-password"`),
      ambos obrigatórios e com rótulo acessível.
- [ ] **AC04** — O controle de visibilidade tem rótulo acessível fixo "Mostrar senha" e
      estado `aria-pressed` (`false` com a senha oculta, `true` com ela visível). O ícone
      alterna entre olho e olho riscado, e o valor digitado é preservado. Quando uma
      tentativa de login é disparada, a senha volta a ficar oculta e o estado volta a
      `false`.
- [ ] **AC05** — O botão "Entrar" tem formato pílula, a cor de ação do design system com
      texto escuro, e estados distintos de hover, foco visível e desabilitado. Durante o
      envio, mostra "Entrando…", fica desabilitado, e um segundo clique não dispara outra
      requisição.
- [ ] **AC06** — Campos vazios ou e-mail inválido não chamam a API e levam o foco ao
      primeiro campo inválido. Erros de uma tentativa de login (401, falha de rede,
      indisponibilidade) aparecem em caixa legível com `role="alert"`, preservam o e-mail e
      a senha digitados e devolvem o foco ao campo Senha. O aviso de sessão encerrada
      aparece na mesma caixa ao abrir a entrada, sem mover o foco.
- [ ] **AC07** — Em 320, 768 e 1280 px não há rolagem horizontal da página. Em 320 e 768 px
      a coluna visual está oculta. Nenhum texto ou campo fica cortado, e todo controle tem
      área de toque de pelo menos 44 × 44 px.
- [ ] **AC08** — Texto tem contraste de pelo menos 4,5:1 e bordas, controles e foco de
      pelo menos 3:1, tanto sobre o vidro quanto sobre a superfície sólida. Todos os
      controles são operáveis por teclado com foco visível. Com
      `prefers-reduced-motion: reduce`, transições e animações não essenciais são
      suprimidas.
- [ ] **AC09** — O formulário de monitoramento por link continua na tela de visitante.
      Os contratos `/api/auth/login` e `/api/auth/me` e os fluxos das specs 0011–0016
      seguem sem alteração de backend, comprovados pela suíte existente do frontend.

## Fora de escopo

- Alterações em endpoints, contratos REST, esquemas de banco ou regras do backend.
- Recuperação de senha, criação de conta, "lembrar de mim" ou duração de sessão
  configurável, inclusive como links ou controles sem efeito.
- Dados ilustrativos (produtos, preços, variações, horários) na interface de produção.
- Telas de carregamento e de sessão indisponível, que mantêm o visual atual.
- Seletor de tema ou tema escuro (a spec 0016 fixa o tema claro).

## Referências e decisões do intake

1. A composição de referência é `designsystem/login.html`. Os tokens vêm de
   `designsystem/index.html` e da spec 0015; se houver divergência, prevalece `index.html`.
2. O formulário de monitoramento por link fica na tela de visitante, preservando a
   proposta "cole o link uma vez".
3. Decisões tomadas com o usuário em 13/10/2026, após a revisão da spec:
   - o card demonstrativo vira uma ilustração sem dados, para cumprir `frontend.md`, o
     README do design system e o AC29 da 0012;
   - "Lembrar de mim", "Esqueceu a senha?", "Criar conta gratuita" e "OU" são removidos;
   - o controle de senha usa rótulo fixo com `aria-pressed`;
   - a coluna visual é decorativa: o cabeçalho e o `h1` do hero continuam como
     identificação e título da página.
4. Itens do protótipo que não entram: produto "Echo Dot" e preços, validação própria com
   `novalidate` e regra de 6 caracteres, rótulo "Entrar na conta" e o toast simulado.

## Perguntas em aberto

Nenhuma.
