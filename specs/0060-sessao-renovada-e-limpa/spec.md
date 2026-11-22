---
numero: 0060
titulo: Sessão renovada durante o uso e sessões expiradas removidas
tipo: melhoria
prioridade: P2
status: implementada
toca: [backend]
depende_de: [0011]
issue: https://github.com/SamiaLuvanice/bestprice/issues/327
---

# 0060 — Sessão renovada durante o uso e sessões expiradas removidas

Issue: https://github.com/SamiaLuvanice/bestprice/issues/327

## Problema e público

**Desconexão no meio do uso.** A sessão aberta no login ou no cadastro dura 24 horas
fixas a partir do login, e nada a prolonga. Quem usa o BestPrice todo dia é desconectado
a cada 24 horas, inclusive no meio de uma ação, e precisa entrar de novo mesmo estando
ativo. Afeta toda pessoa com conta.

**Sessões que nunca saem do banco.** Toda sessão gravada continua na tabela de sessões
depois de expirar. A limpeza periódica da API remove pesquisas expiradas e as tentativas
de cadastro e de login, mas não as sessões. A tabela cresce a cada login, sem limite, e
guarda por tempo indeterminado o vínculo entre a conta e cada acesso (hash do token e
datas). Afeta a operação (armazenamento do plano gratuito do banco) e a privacidade das
pessoas. A spec 0048 deixou isso explicitamente fora de escopo.

## Resultado esperado

Quem está usando o BestPrice continua conectado enquanto usa. A sessão só termina depois
de um período sem uso, ou ao atingir um teto absoluto desde o login, ou no logout. Sessões
que já terminaram saem do banco na limpeza periódica, sem ação da operação.

## Decisões assumidas (22/11/2026)

Os valores abaixo são o ponto de partida e podem mudar antes do `/plan`.

- **Inatividade:** a sessão termina após 24 horas sem nenhuma requisição autenticada.
  Cada uso dentro desse prazo o reinicia (mantém a duração atual para quem para de usar).
- **Teto absoluto:** 7 dias desde o login, mesmo com uso contínuo. Depois disso a pessoa
  entra de novo. Limita o tempo de vida de um cookie copiado.
- **Precisão da renovação:** a renovação pode ser aplicada com atraso de até 1 hora
  (não precisa gravar no banco a cada requisição). A inatividade efetiva fica entre 23 e
  24 horas.
- **Limpeza:** as sessões terminadas são removidas no mesmo ciclo de limpeza que já
  existe (na partida da API e a cada hora enquanto ela está acordada).

## Critérios de aceite

- [ ] **AC01 — Uso prolonga a sessão:** dada uma sessão aberta há 20 horas e usada agora,
  quando a pessoa faz uma requisição autenticada 23 horas depois desse uso (43 horas após
  o login), então a requisição é aceita.
- [ ] **AC02 — Inatividade encerra:** dada uma sessão sem nenhuma requisição autenticada
  por mais de 24 horas, quando a pessoa faz uma requisição, então recebe
  `401 unauthenticated` e a interface mostra o login, como hoje.
- [ ] **AC03 — Teto absoluto:** dada uma sessão usada continuamente, quando se passam 7
  dias desde o login, então a próxima requisição recebe `401 unauthenticated`, mesmo que
  a última atividade tenha sido há minutos.
- [ ] **AC04 — Cookie acompanha a sessão:** quando a sessão é renovada, o cookie de
  sessão recebido pelo navegador também passa a valer até o novo término, sem mudar seus
  atributos de segurança (HttpOnly, SameSite=Lax, caminho `/api`, Secure em Stage). O
  cookie nunca vale além do teto absoluto.
- [ ] **AC05 — Logout continua imediato:** dada uma sessão renovada, quando a pessoa sai,
  então a sessão é encerrada na hora e o mesmo cookie recebe `401` em seguida.
- [ ] **AC06 — Limpeza das sessões terminadas:** dadas sessões expiradas por inatividade,
  pelo teto ou pelo prazo antigo, quando o ciclo de limpeza roda, então elas são
  removidas do banco, e as sessões ainda válidas (de qualquer conta) permanecem.
- [ ] **AC07 — Falha na limpeza não derruba a API:** se a remoção das sessões falhar, a
  falha é registrada como as demais da limpeza e a API continua respondendo.
- [ ] **AC08 — Sessões abertas antes da mudança:** sessões emitidas antes da implantação
  continuam válidas até o término que já tinham e não ganham sobrevida indevida além do
  teto de 7 dias contado a partir da criação.
- [ ] **AC09 — Relógio injetado:** as regras de inatividade e teto são testadas com fonte
  de tempo controlada, sem esperar o relógio real.

## Fora de escopo

- "Manter conectado" opcional na tela de login, ou qualquer mudança visual.
- Listar ou encerrar sessões de outros dispositivos pela interface.
- Rotação do token de sessão a cada renovação.
- Encerramento de sessões ao redefinir a senha (spec 0059).
- Mudanças no limite de tentativas de login ou de cadastro.

## Riscos e perguntas em aberto

- **Valores de inatividade e teto (confirmados em 22/11/2026):** 24 horas e 7 dias foram
  aprovados pela responsável. Um teto maior (30 dias) seria mais cômodo para quem acessa
  pouco, mas ampliaria a janela de um cookie copiado.
- **Escrita no banco por requisição:** renovar a cada requisição multiplicaria as
  escritas no banco gratuito; por isso a decisão de tolerar até 1 hora de atraso.
- **API hibernando (Render Free):** a limpeza só roda com a API acordada; sessões
  terminadas durante o sono saem na próxima partida. A validade nunca depende da limpeza:
  uma sessão terminada é recusada mesmo antes de ser removida.
