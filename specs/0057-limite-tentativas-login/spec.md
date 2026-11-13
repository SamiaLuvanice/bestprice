---
numero: 0057
titulo: Limite de tentativas repetidas de login
tipo: melhoria
prioridade: P1
status: implementada
toca: [backend, frontend, contrato]
depende_de: [0011, 0048]
issue: https://github.com/SamiaLuvanice/bestprice/issues/128
---

# 0057 — Limite de tentativas repetidas de login

Issue: https://github.com/SamiaLuvanice/bestprice/issues/128

## Problema e público

O login aceita um número ilimitado de tentativas. Quem tenta adivinhar a senha de uma
conta pode repetir o envio indefinidamente. Cada tentativa contra um e-mail existente
custa uma verificação de senha propositalmente lenta, então um volume alto de envios
também consome a CPU da API e prejudica os demais usuários.

Há ainda um vazamento: hoje a resposta para um e-mail sem conta chega mais rápido do que
para um e-mail com conta, porque a verificação lenta só acontece no segundo caso. A
mensagem é a mesma, mas o tempo de resposta revela se a conta existe.

O cadastro já limita tentativas por origem (spec 0048), mas aquela spec deixou o login
explicitamente para uma spec própria. Esta é ela. Afeta todas as pessoas com conta, cuja
senha fica exposta a tentativas repetidas, e a operação, que responde pela
disponibilidade da API. O problema cresce quando o cadastro self-service for ligado.

## Resultado esperado

Uma pessoa que erra a senha algumas vezes continua podendo tentar normalmente. Depois de
muitas falhas em 15 minutos, a mesma origem passa a ser recusada por algum tempo, e a
tela de login informa quanto tempo falta, em português, sem apagar o e-mail digitado.
Passado esse tempo, o login volta a funcionar. Um login bem-sucedido zera as falhas
daquela origem para aquele e-mail.

O limite nunca revela se o e-mail tem conta. E-mails com e sem conta são contados,
recusados e respondidos da mesma forma, e toda falha de credencial custa o mesmo
trabalho de verificação. Enquanto a origem estiver bloqueada, nem uma senha correta abre
sessão, para que o bloqueio não sirva de oráculo.

O bloqueio vale para a origem que errou, não para a conta inteira. Quem erra a senha de
uma conta a partir da própria rede não impede o dono de entrar de outra rede. Origens
compartilhadas por muitas pessoas são uma exceção conhecida (ver riscos).

## Decisões assumidas (13/11/2026)

Os valores abaixo são o ponto de partida e podem mudar antes do `/plan`.

- **Duas contagens, só de falhas:**
  - **Origem + e-mail:** 10 falhas para o mesmo e-mail normalizado, vindas da mesma origem,
    em 15 minutos. Contém a adivinhação de uma senha.
  - **Origem:** 50 falhas da mesma origem, para quaisquer e-mails, em 15 minutos. Contém a
    tentativa de uma mesma senha contra muitas contas e o consumo de CPU.
- **O que é falha:** todo envio de login que chega ao servidor e não abre sessão, exceto
  as recusas pelo próprio limite. Envios com credenciais erradas, e-mail sem conta ou
  campos acima do tamanho máximo contam nas duas contagens. Envios malformados (corpo
  inválido, campo ausente ou extra, formato diferente de JSON) contam só na contagem da
  origem, porque não têm e-mail utilizável. Um e-mail acima do tamanho máximo é contado
  como enviado, depois da normalização.
- **Ordem:** o limite é avaliado antes de qualquer outra checagem. Uma origem bloqueada
  recebe a recusa por limite mesmo para envios malformados.
- **Recusas não contam:** uma recusa por qualquer dos dois limites não entra em nenhuma
  das contagens, para que o tempo informado seja verdadeiro.
- **Sucesso:** zera a contagem origem + e-mail daquela combinação. A contagem por origem
  não é zerada, porque um atacante com uma conta própria poderia zerá-la entrando nela.
- **Tempo de espera:** é o tempo até a contagem voltar a ficar abaixo do limite. Quando
  as duas contagens estão estouradas, vale a maior espera.
- **Envios simultâneos:** o limite é exato. Envios paralelos da mesma origem nunca
  registram mais falhas do que o limite permite nem abrem sessão depois que ele foi
  atingido.
- **Mensagem:** a API responde com um erro próprio de limite de login, distinto do erro de
  credenciais inválidas, com o tempo de espera em segundos e a mensagem "Muitas
  tentativas de login. Tente novamente mais tarde.". A tela de login monta o texto
  exibido a partir do tempo de espera: "Muitas tentativas de login. Tente novamente em N
  minutos.", como o cadastro já faz.
- **Configuração:** os dois limites e a janela são ajustáveis por ambiente. Faixas: limite
  origem + e-mail de 1 a 1000; limite por origem de 1 a 10000 e nunca menor que o limite
  origem + e-mail; janela de 1 a 1440 minutos. Fora disso, a API não inicia.
- **Origem confiável:** a origem é identificada do mesmo jeito confiável já definido para o
  cadastro. Ao contrário do cadastro, o login está sempre ligado. Por isso, em ambiente
  implantado (Stage e produção), a API não inicia sem a configuração que torna a origem
  confiável e a contagem sigilosa, independentemente de o cadastro estar ligado. Sem
  ela, todo o tráfego cairia numa única origem, e 50 falhas de qualquer pessoa
  bloqueariam o login de todos.
- **Privacidade:** a origem e o e-mail usados na contagem ficam guardados só numa forma
  derivada com segredo, não reversível por dicionário. Também não aparecem em logs e são
  apagados depois que saem da janela.
- **Várias instâncias:** a contagem é compartilhada entre todas as instâncias da API do
  ambiente. Um limite por instância não atende a esta spec.

## Critérios de aceite

Os números abaixo usam os valores padrão.

- [ ] **AC01 — Uso normal preservado:** dada uma conta válida, quando a pessoa erra a
  senha 9 vezes e depois acerta, a partir da mesma origem, então o login funciona.
- [ ] **AC02 — Limite por origem + e-mail:** dadas 10 falhas para o mesmo e-mail a partir
  da mesma origem nos últimos 15 minutos, quando essa origem tenta de novo com esse
  e-mail, mesmo com a senha correta, então a tentativa é recusada sem abrir sessão, com o
  erro de limite e o tempo de espera.
- [ ] **AC03 — Limite por origem:** dadas 50 falhas da mesma origem, distribuídas entre
  e-mails diferentes, nos últimos 15 minutos, quando essa origem tenta entrar com
  qualquer e-mail, inclusive um sem falhas próprias e com a senha correta, ou envia um
  corpo malformado, então a tentativa é recusada sem abrir sessão, com o erro de limite e
  o tempo de espera.
- [ ] **AC04 — Recuperação após a janela:** dada uma origem bloqueada por AC02, e também
  dada uma origem bloqueada por AC03, quando o tempo informado passa, então um login com
  credenciais corretas volta a funcionar.
- [ ] **AC05 — Sucesso zera só a combinação:** dadas 9 falhas para um e-mail seguidas de
  um login bem-sucedido a partir da mesma origem, quando essa origem erra a senha desse
  e-mail mais 9 vezes dentro da mesma janela e então envia a senha correta, então o login
  funciona. A contagem por origem dessa origem continua com as 18 falhas.
- [ ] **AC06 — Outra origem não é bloqueada:** dada uma origem bloqueada para um e-mail,
  quando o dono da conta entra de outra origem com a senha correta, então o login
  funciona.
- [ ] **AC07 — Sem revelar a conta pela resposta:** para um e-mail com conta e outro sem
  conta, com as mesmas falhas e a partir da mesma origem, a contagem, o momento do
  bloqueio, o código de erro, a mensagem e o tempo de espera são iguais.
- [ ] **AC08 — Sem revelar a conta pelo tempo:** toda falha de credencial executa a mesma
  verificação de senha, uma vez, inclusive quando o e-mail não tem conta ou os campos
  passam do tamanho máximo. Como evidência complementar, numa medição local com 30
  tentativas de cada tipo, a mediana do tempo de resposta para e-mail sem conta e para
  senha errada de e-mail com conta difere menos de 20%.
- [ ] **AC09 — Recusa não estende o bloqueio:** dada uma origem bloqueada por AC02, e
  também dada uma origem bloqueada por AC03, quando ela continua enviando durante a
  espera, então o tempo informado não aumenta por causa desses envios.
- [ ] **AC10 — Maior espera vence:** dada uma origem com as duas contagens estouradas,
  quando ela tenta de novo, então o tempo informado é o maior dos dois.
- [ ] **AC11 — Envios simultâneos:** dadas 9 falhas para um e-mail a partir de uma origem,
  quando essa origem envia 20 tentativas paralelas com senha errada para esse e-mail,
  então no máximo 1 nova falha é registrada e as demais são recusadas pelo limite. Dadas
  10 falhas, 20 envios paralelos com a senha correta não abrem nenhuma sessão.
- [ ] **AC12 — Várias instâncias:** dadas falhas distribuídas entre duas instâncias da API
  do mesmo ambiente, quando o total atinge o limite, então a próxima tentativa é recusada
  em qualquer uma delas.
- [ ] **AC13 — Configuração:** dados limites e janela válidos definidos no ambiente,
  quando a API inicia, então ela passa a usá-los. Valores ausentes usam os padrões.
  Valores fora das faixas, ou um limite por origem menor que o de origem + e-mail,
  impedem a inicialização com mensagem clara que não repete segredos.
- [ ] **AC14 — Ambiente implantado sem origem confiável:** dada a API em Stage ou produção
  sem a configuração de origem confiável ou de sigilo da contagem, quando ela inicia,
  então a inicialização falha com mensagem clara, mesmo com o cadastro desligado.
  Localmente, a API inicia e o limite funciona.
- [ ] **AC15 — Sigilo e retenção:** em nenhum cenário a senha, o e-mail ou o endereço de
  origem usados na contagem ficam guardados em claro ou aparecem em logs, e a senha não
  aparece em respostas. Falhas que saíram da janela são apagadas com a mesma cadência de
  limpeza do cadastro.
- [ ] **AC16 — Interface:** dada uma recusa por limite, quando a tela de login a recebe,
  então mostra "Muitas tentativas de login. Tente novamente em N minutos.", anunciada a
  leitores de tela, mantém o e-mail digitado e apaga a senha, em desktop (1440 px) e
  mobile (390 px). Credenciais inválidas continuam com a mensagem atual.
- [ ] **AC17 — Contas e sessões preservadas:** o limite não altera senha, conta nem
  sessões já abertas. Uma pessoa já conectada continua usando o produto enquanto uma
  origem está bloqueada para o mesmo e-mail.

## Fora de escopo

- Bloqueio da conta inteira, independente da origem, contra ataques distribuídos por
  muitas origens.
- CAPTCHA, desafio anti-robô, autenticação em dois fatores ou login social.
- Aviso por e-mail ao dono da conta sobre tentativas suspeitas, e qualquer envio de
  e-mail.
- Recuperação ou redefinição de senha pela aplicação.
- Painel ou relatório de tentativas para a operação.
- Mudanças no limite do cadastro, na duração da sessão ou nas regras de senha.
- Proteções de borda (Cloudflare, Render). Elas podem existir, mas não substituem este
  limite.

## Riscos e perguntas em aberto

- **Pré-condição de Stage (atendida em 13/11/2026):** a configuração de origem confiável
  e de sigilo foi preenchida antes da promoção, e a origem real atrás do Pages foi
  verificada depois dela (ver `verification.md`).
- **Valores padrão (confirmados em 13/11/2026):** 10 falhas por origem + e-mail e 50 por
  origem em 15 minutos foram confirmados pela responsável e aplicados em Stage.
- **Origens compartilhadas:** em redes com muitas pessoas na mesma origem (rede de
  empresa, operadora móvel, mesma faixa IPv6 /64), um atacante pode bloquear o dono da
  conta pela contagem origem + e-mail e bloquear todos pela contagem por origem. Aceito
  nesta fase. A mitigação depende de bloqueio por conta com desbloqueio pelo dono, que
  exige envio de e-mail.
- **Ataque distribuído:** um ataque vindo de muitas origens contra uma única conta não é
  contido por esta spec, só desacelerado. A senha mínima de 12 caracteres reduz o risco.
- **Referência visual (bloqueia só a interface):** o Figma tem o estado "limite de
  tentativas" para o cadastro, mas não foi confirmado se há o equivalente no login.
  Suposição: o login reutiliza o mesmo padrão visual de alerta do formulário, sem tela
  nova. Se a revisão exigir um quadro próprio, ele deve ser aprovado antes do `/plan` da
  interface.
