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

A experiência de entrada e login da aplicação BestPrice ainda apresenta um painel
provisório e compacto em `App.tsx`, sem refletir a composição rica em duas colunas, a
linguagem de Liquid Glass e os recursos de usabilidade presentes no protótipo oficial
`designsystem/login.html`.

Isso afeta qualquer pessoa não autenticada que acessa o BestPrice: a primeira impressão do
produto fica aquém da identidade visual e a interação de login não dispõe de conveniências
comuns de acessibilidade e experiência, como a alternância de visibilidade da senha.

## Comportamento esperado

Na tela de visitante, a pessoa encontra a área de login redesenhada com base na
composição de `designsystem/login.html`.

A estrutura utiliza um container com estilo Liquid Glass sobre fundo claro com brilhos
ambientes sutis. Em telas largas (desktop), o container se divide em duas colunas:
1. **Lateral visual (à esquerda):** exibe a logo oficial BestPrice sem distorção, a marca,
   o título "Acompanhe preços com a calma de uma vitrine.", o subtítulo de monitoramento
   inteligente e um card demonstrativo ilustrativo (`aria-hidden="true"`, adaptado para
   produto neutro do Mercado Livre Brasil, sem qualquer referência à Amazon ou marcas
   fictícias tratadas como reais).
2. **Painel do formulário (à direita):** apresenta a saudação "Bem-vindo de volta", campos
   identificados para e-mail e senha, controle para mostrar/ocultar senha com retorno visual
   e acessível (`aria-pressed` e `aria-label`), opções informativas ("Lembrar de mim" e
   "Esqueceu a senha?"), botão de ação primária em formato pílula com verde neon (`#39ff14`)
   e rótulo "Entrar", separador "OU" e nota informativa para criação de conta.

O formulário de rastreamento por URL (`HeroTrackForm`) permanece acessível na página de
visitante para que novos usuários possam experimentar a proposta central de colar um link do
Mercado Livre antes de entrar.

Durante o envio, o botão indica estado de carregamento e fica desabilitado para evitar
submissões duplicadas. Mensagens de erro de autenticação ou de conexão continuam anunciadas
com `role="alert"`. O layout se adapta responsivamente às larguras de 320, 768 e 1280 px sem
rolagem horizontal da página, ocultando a lateral visual em telas estreitas (<= 840 px).

O tema permanece o claro fixo definido na spec 0016. Preferências por movimento reduzido
suprimem transições e animações não essenciais.

## Critérios de aceite

- [ ] **AC01** — A área de login apresenta a casca de vidro (Liquid Glass) com efeito de
      iluminação ambiente e layout em duas colunas (lateral visual e painel do formulário)
      em viewports largas (>= 840 px).
- [ ] **AC02** — A lateral visual inclui a logo oficial BestPrice sem distorção ou corte, o
      nome da marca, o título e descrição de apresentação e um card demonstrativo puramente
      ilustrativo marcado com `aria-hidden="true"`.
- [ ] **AC03** — O painel de formulário oferece cabeçalho "Bem-vindo de volta", campos
      identificados para E-mail e Senha com rótulos acessíveis e tipos adequados.
- [ ] **AC04** — O campo de senha oferece controle de alternar visibilidade ("Mostrar senha" /
      "Ocultar senha"), com estado `aria-pressed`, ícone coerente e preservação do valor
      digitado.
- [ ] **AC05** — O botão de submissão adota formato pílula com fundo verde de ação (`#39ff14`)
      e texto escuro, informando estado desabilitado/ocupado durante a autenticação para
      prevenir envios concorrentes.
- [ ] **AC06** — Erros de autenticação (401, falha de rede ou indisponibilidade) continuam
      anunciados com `role="alert"` em caixa de erro acessível e legível.
- [ ] **AC07** — Em larguras de 320, 768 e 1280 px, o layout não gera rolagem horizontal;
      em telas de 320 e 768 px a coluna visual é ocultada e o formulário permanece
      confortável e utilizável.
- [ ] **AC08** — O formulário HeroTrackForm continua acessível na página de visitante e os
      contratos de autenticação existentes com a API (`/api/auth/login`, `/api/auth/me`) e
      os fluxos das specs 0011–0016 são mantidos sem alteração de backend.

## Fora de escopo

- Alterações em endpoints, contratos REST, esquemas de banco ou regras de domínio do backend.
- Fluxos reais de recuperação de senha ou cadastro de novos usuários no backend (links
  permanecem informativos/placeholders).
- Qualquer menção a produtos da Amazon, serviços Prime ou inclusão de dados fixos fictícios
  como dados reais de negócio.
- Seletor de tema manual ou tema escuro (o tema claro permanece fixo pela spec 0016).

## Referências e decisões do intake

1. A referência de composição é `designsystem/login.html`, e a autoridade de tokens de
   identidade visual é `designsystem/index.html` e a spec 0015.
2. Na decisão de design alinhada com o usuário, o formulário `HeroTrackForm` é preservado na
   página de visitante para manter a proposta de valor ("cole o link uma vez").
3. O card demonstrativo da lateral visual é adaptado com `aria-hidden="true"` e produto
   neutro do Mercado Livre, em estrito cumprimento às regras do projeto (sem produtos da
   Amazon ou dados fictícios reais).
