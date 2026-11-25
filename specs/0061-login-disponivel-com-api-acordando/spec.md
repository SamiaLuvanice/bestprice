---
numero: 0061
titulo: Login disponível enquanto a API está acordando
tipo: melhoria
prioridade: P2
status: implementada
toca: [frontend]
depende_de: [0048, 0050]
issue: https://github.com/SamiaLuvanice/bestprice/issues/336
---

# 0061 — Login disponível enquanto a API está acordando

Issue: https://github.com/SamiaLuvanice/bestprice/issues/336

## Problema e público

**Login bloqueado por uma verificação que falhou.** Ao abrir qualquer tela fora da
landing, a interface primeiro pergunta à API se já existe sessão. Só a resposta "sem
sessão" (`401`) leva ao formulário de login. Qualquer outra falha (rede, `429`, `502`,
`503`) deixa a tela apenas com a mensagem de erro e o botão "Tentar novamente": a pessoa
não vê o formulário de login nem o de cadastro, e as áreas logadas não abrem. Enquanto a
verificação demora, a tela fica só em "Carregando sua conta…".

Isso acontece toda vez que a API de Stage, no Render Free, está hibernando por falta de
uso. Em 25/11/2026, `https://bestprice-stage.pages.dev/login` mostrava só "Tentar
novamente". Todas as chamadas `/api/*` pelo Pages voltavam `429 Too Many Requests` com
`x-render-routing: hibernate-rate-limited`. Pouco depois, a API acordou e as mesmas
chamadas passaram a responder `200`.

Afeta quem abre o BestPrice depois de um período sem uso: quem vai entrar, quem vai
criar conta e quem já tem sessão e volta a uma área logada.

## Resultado esperado

- **Entrar:** o formulário aparece mesmo se a verificação de sessão falhar ou demorar,
  com um aviso discreto. A sessão continua sendo verificada em segundo plano.
- **Criar conta:** a tela espera a API acordar sem exigir clique.
- **Áreas logadas:** a verificação de sessão se repete sozinha por um tempo limitado
  antes de mostrar o erro.

Ninguém fica preso a uma tela que só oferece "Tentar novamente" enquanto a API ainda está
acordando.

## Definições

- **Telas do escopo:** Entrar (`/login`), Criar conta (`/cadastro`) e as áreas logadas,
  isto é, toda rota que hoje mostra "Carregando sua conta…" durante a verificação:
  `/app`, `/app/*`, `/produtos`, `/produtos/:id` e `/alertas`.
- **Verificação de sessão:** a consulta da interface à API para saber se já existe
  sessão. Hoje ela roda ao carregar a página e ao voltar a uma página pelo histórico do
  navegador.
- **Indisponibilidade:** a verificação de sessão falhou por erro de rede, por resposta
  fora do formato do contrato (como o `429` do Render, sem corpo de erro da API) ou por
  `5xx`, **ou** está há mais de 5 segundos sem resposta. `401` continua significando
  "sem sessão". Outro `4xx` com corpo de erro da API mostra a API acordada: vale o erro
  atual, sem novas tentativas.
- **Janela de espera:** 60 segundos contados a partir da primeira indisponibilidade
  observada numa tela do escopo. Dentro dela, a interface repete a verificação sozinha.
- **API acordada:** resposta de sucesso da API, ou `4xx` com corpo de erro da API
  (inclusive `401`).

## Decisões (25/11/2026)

- **Janela e tentativas:** janela de 60 segundos, com **no máximo 6** novas tentativas e
  **pelo menos 2 segundos** entre o fim de uma tentativa e o início da seguinte. Uma
  tentativa sem resposta não dispara outra em paralelo.
- **Texto do aviso (neutro, porque a mesma falha pode ser falta de internet ou erro
  real):** "Não conseguimos falar com o servidor agora. Ele pode estar iniciando; isso
  leva alguns segundos."
- **Visual:** o aviso reutiliza o componente de aviso informativo existente
  (`role="status"`). Não há quadro Figma próprio, como no estado de limite de login
  (0057).
- **Landing (`/`):** não inicia janela nem novas tentativas, e o comportamento de 0050
  não muda. Se outra tela já tiver confirmado a sessão ou o cadastro, a landing usa essa
  informação, como hoje.
- **Mudanças intencionais em specs anteriores:**
  - 0048, AC14: o erro do interruptor de cadastro passa a ser precedido por espera
    automática dentro da janela, em vez de exigir clique de imediato.
  - 0050: o login e o cadastro deixam de esperar a confirmação da sessão para mostrar o
    formulário quando há indisponibilidade.

## Critérios de aceite

### Entrar (`/login`)

- [ ] **AC01 — Formulário apesar da falha ou da demora:** dada a verificação de sessão
  indisponível (falha ou mais de 5 segundos sem resposta), quando a pessoa abre
  `/login`, então o formulário de login aparece (e-mail, senha e "Entrar"), sem a tela
  que só oferece "Tentar novamente".
- [ ] **AC02 — Aviso discreto:** nesse caso, a tela mostra o aviso da seção Decisões.
  Leitores de tela anunciam o aviso de forma educada, sem interromper a leitura (status,
  não alerta), e o foco inicial continua no título do login, como hoje.
- [ ] **AC03 — Sessão encontrada depois:** se uma nova verificação, dentro da janela,
  encontra sessão válida, então a pessoa segue ao destino seguro (`returnTo` válido ou
  `/app/dashboard`), mesmo que esteja digitando, como quando a sessão é encontrada logo
  de início.
- [ ] **AC04 — API acordou sem sessão:** se uma nova verificação recebe `401`, então o
  aviso some, as tentativas param e o formulário continua igual. O que a pessoa já
  digitou é preservado.
- [ ] **AC05 — Envio durante o despertar:** se a pessoa envia o login antes de a
  verificação terminar:
  - o envio segue o tratamento de erro atual (mensagem de falha ou de limite de
    tentativas, spec 0057);
  - uma resposta do envio que mostra a API acordada (por exemplo, `401` de credencial)
    também faz o aviso sumir e as tentativas pararem;
  - um login bem-sucedido encerra as tentativas e não é desfeito por uma verificação
    atrasada.
- [ ] **AC06 — Fim da janela no login:** se a janela termina sem a API acordar, então as
  tentativas param, o formulário continua disponível e o aviso permanece. Nenhuma tela
  de erro substitui o formulário.
- [ ] **AC07 — Link de cadastro:** o link "Criar conta" do login só aparece quando o
  cadastro estiver confirmado como habilitado, como hoje. Se a confirmação falhar por
  indisponibilidade, ela é repetida dentro da mesma janela e com os mesmos limites, e o
  link aparece sem recarregar a página quando o cadastro for confirmado.

### Criar conta (`/cadastro`)

- [ ] **AC08 — Espera sem clique:** dada a API indisponível, quando a pessoa abre
  `/cadastro`, então a tela mostra "Carregando…" com o aviso da seção Decisões, e as
  consultas são repetidas sozinhas dentro da janela.
  - O formulário aparece assim que o cadastro é confirmado como habilitado, mesmo que a
    sessão ainda não tenha sido confirmada.
  - Se a sessão for encontrada depois, a pessoa segue ao destino, como hoje.
  - Se o cadastro for informado como desligado, a pessoa vai para o login (0048, AC14).
- [ ] **AC09 — Fim da janela no cadastro:** se a janela termina sem confirmar o cadastro,
  então aparece o erro atual do cadastro ("Não foi possível verificar o cadastro agora.
  Tente novamente.") com "Tentar novamente". O botão inicia uma nova janela.

### Áreas logadas

- [ ] **AC10 — Nova tentativa automática:** dada a verificação de sessão indisponível,
  quando a pessoa abre uma área logada, então a tela continua em "Carregando sua
  conta…" com o aviso, e a verificação é repetida sozinha dentro da janela.
  - Se encontrar sessão, a área abre.
  - Se receber `401`, a pessoa vai para o login com `returnTo`, como hoje.
- [ ] **AC11 — Fim da janela na área logada:** se a janela termina sem a API acordar,
  então aparece o erro atual com "Tentar novamente". O botão inicia uma nova janela.

### Geral

- [ ] **AC12 — Limites das tentativas:** em uma janela, há no máximo 6 novas tentativas
  de cada consulta, com pelo menos 2 segundos entre elas, e nenhuma depois de 60
  segundos.
- [ ] **AC13 — Navegação durante a janela:** ao navegar entre telas do escopo (por
  exemplo, do login para o cadastro), a janela em curso continua, sem reiniciar.
  - Ao ir para a landing ou para uma rota inexistente, as tentativas param.
  - Ao entrar de novo numa tela do escopo depois disso, uma nova janela começa, se a
    sessão ainda não estiver decidida.
  - Voltar pelo histórico do navegador refaz a verificação desde o início, como hoje.
- [ ] **AC14 — Sem mudança no caminho comum:** com a API respondendo em menos de 5
  segundos, os fluxos atuais não mudam: sem sessão (`401`) mostra o login sem aviso,
  sessão válida segue ao destino, e a revalidação ao voltar pelo histórico continua
  funcionando.
- [ ] **AC15 — Tempo controlado nos testes:** a demora de 5 segundos, a janela e o
  espaçamento entre tentativas são testados com timers controlados, sem esperar o tempo
  real. (Restrição de teste, conforme `datetime-pipeline.md`.)

## Fora de escopo

- Manter a API acordada (ping periódico, plano pago ou outro provedor).
- Mudanças no backend, no proxy do Pages ou nos códigos de resposta da API.
- Respeitar `Retry-After` nas novas tentativas: o `429` de hibernação observado não traz
  esse cabeçalho, e os limites de AC12 já controlam a carga.
- Repetição automática de outras chamadas (painel, alertas, pesquisas), que já têm seus
  próprios estados de erro.
- Mudanças no limite de tentativas de login (0057) ou de cadastro (0048), e nas
  mensagens de erro do envio do login.
- Mudanças na landing (`/`) e na página de rota inexistente.

## Riscos e perguntas em aberto

- **Interface sem Figma:** o aviso reutiliza um componente existente, sem quadro próprio.
  Se a responsável quiser um quadro, ele entra como validação visual posterior.
- **429 legítimo da API:** a verificação de sessão não tem limite de tentativas próprio
  hoje. Se passar a ter, um `429` legítimo seria repetido dentro da janela. Os limites de
  AC12 contêm o efeito.
- **Despertar mais longo que a janela:** a área logada cai no erro com "Tentar novamente"
  e o cadastro, no erro do cadastro. O login mantém o formulário.
- **Formulário mostrado antes da confirmação:** quem tem sessão e abre `/login` com a
  API lenta vê o formulário por alguns segundos antes de seguir ao destino. A
  autorização continua no backend; não há exposição de dados.
- **Produção:** se a produção também usar Render Free, o mesmo comportamento vale para
  pessoas reais. Esta spec não decide o plano de hospedagem.
