---
numero: 0062
titulo: API de Stage acordada pelo navegador
tipo: melhoria
prioridade: P2
status: rascunho
toca: [frontend]
depende_de: [0061]
issue: https://github.com/SamiaLuvanice/bestprice/issues/344
---

# 0062 — API de Stage acordada pelo navegador

Issue: https://github.com/SamiaLuvanice/bestprice/issues/344

## Problema e público

**O site não consegue acordar a API.** Em Stage, a API roda no Render Free e hiberna depois
de um período sem uso. Em 25/11/2026, com a API hibernando, observamos:

- toda chamada que passou pelo proxy do Pages (`https://bestprice-stage.pages.dev/api/*`)
  respondeu `429 Too Many Requests` com `x-render-routing: hibernate-rate-limited` em cerca
  de 0,25 s, sem acordar o serviço;
- uma chamada direta a `https://bestprice-stage-api.onrender.com/api/health` esperou cerca
  de 35 s, respondeu `200` e, a partir daí, o proxy passou a responder normalmente.

A spec 0061 faz o login aparecer com um aviso enquanto a API está indisponível, mas a
espera não termina: quem só usa o site pode nunca acordar a API. Afeta qualquer pessoa que
abra o BestPrice em Stage depois de um período sem uso. Detalhes em
`docs/apps/infraestrutura.md`, seção "Login com a API acordando em Stage — spec 0061".

## Resultado esperado

Quando a interface detecta a API indisponível (definição da 0061), o próprio navegador da
pessoa faz um pedido direto à origem da API, só para acordá-la. Dentro da janela de espera
da 0061, a API acorda, as novas tentativas pelo proxy passam a responder e o aviso some,
sem ação da pessoa.

## Decisões (25/11/2026)

- **Quem acorda:** o navegador da pessoa, com um pedido direto ao health da origem da API.
  A responsável escolheu esta opção em vez de um ping agendado, para não manter a API e o
  banco ativos sem uso.
- **Ambientes:** o pedido só acontece quando a origem direta da API estiver configurada no
  build. Sem configuração (Compose local, testes), nada muda.
- **Pedido "cego":** o resultado do pedido direto não decide nada na interface. Quem decide
  continua sendo a verificação de sessão pelo proxy (0061). O pedido só serve para acordar.

## Critérios de aceite

- [ ] **AC01 — Pedido ao abrir a janela:** dada a origem da API configurada, quando a
  interface detecta a API indisponível numa tela do escopo da 0061 e abre uma janela de
  espera, então o navegador faz um único `GET` direto ao health dessa origem.
- [ ] **AC02 — Um pedido por janela:** novas tentativas dentro da mesma janela não repetem o
  pedido direto. Uma nova janela (por exemplo, "Tentar novamente" ou nova entrada numa tela
  do escopo) pode fazer um novo pedido.
- [ ] **AC03 — Sem credenciais nem dados:** o pedido direto não envia cookies, cabeçalhos de
  autenticação, corpo ou dados da pessoa na URL. Ele não lê a resposta.
- [ ] **AC04 — Falha silenciosa:** se o pedido direto falhar (rede, bloqueio, CORS, tempo
  esgotado), nada muda na tela além do comportamento da 0061: nenhum erro aparece para a
  pessoa e a aplicação não gera erro não tratado. O registro de rede que o próprio
  navegador faz da falha é aceitável.
- [ ] **AC05 — Sem configuração, sem pedido:** sem a origem configurada, nenhum pedido
  direto é feito e o comportamento da 0061 é mantido.
- [ ] **AC06 — Caminho comum intacto:** com a API respondendo, nenhum pedido direto é feito.
- [ ] **AC07 — Em Stage, a API acorda pelo site:** com a API de Stage hibernando, abrir
  `/login` apenas pelo site faz a API acordar dentro da janela de 60 s da 0061: as consultas
  pelo proxy passam a responder e o aviso some. (Verificação em Stage após a promoção.)

## Fora de escopo

- Ping agendado ou qualquer chamada automática sem uma pessoa usando o site.
- Plano pago, outro provedor ou mudanças no proxy do Pages.
- Mudanças nos limites da janela da 0061 (5 s, 60 s, 6 tentativas).
- Produção, enquanto não existir.

## Riscos e perguntas em aberto

- **Despertar mais longo que a janela:** o despertar observado levou ~35 s; se passar de 60 s,
  a 0061 cai no erro com "Tentar novamente", que abre nova janela e novo pedido.
- **Política de segurança do navegador:** hoje não há CSP que restrinja `connect-src`. Se uma
  CSP for criada, a origem da API precisa ser liberada.
- **Exposição da origem:** a URL `*.onrender.com` passa a constar no bundle. Ela não é
  segredo, mas permite acesso direto à API sem o proxy; o cadastro e o login já tratam o
  acesso direto (specs 0048 e 0057). Confirmar no plano que nada novo fica exposto.
- **Comportamento do Render:** a premissa vem de uma observação (chamada direta acorda,
  chamada via Cloudflare não). AC07 é o que comprova que a solução funciona.
