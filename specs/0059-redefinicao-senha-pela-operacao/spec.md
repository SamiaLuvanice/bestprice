---
numero: 0059
titulo: Redefinição de senha pela operação
tipo: bug
prioridade: P1
status: implementada
toca: [backend]
depende_de: [0011, 0048, 0057]
issue: https://github.com/SamiaLuvanice/bestprice/issues/326
---

# 0059 — Redefinição de senha pela operação

Issue: https://github.com/SamiaLuvanice/bestprice/issues/326

## Problema e público

Quem esquece a senha perde o acesso à conta e a todos os anúncios monitorados, e não há
nenhuma forma de recuperá-lo. A tela de login não oferece recuperação (0011, 0048 e 0057
deixaram isso fora de escopo) e a tentativa de criar uma nova conta com o mesmo e-mail
responde "Já existe uma conta com este e-mail."

A spec 0048 registrou como decisão que, até existir recuperação pela aplicação, "a
operação redefine pela linha de comando". Esse caminho não existe: o único comando de
operação para contas (`backend/app/auth/provision.py`) só cria contas e recusa um e-mail
já cadastrado. Hoje, a única saída seria alterar o hash da senha direto no banco, sem as
regras de senha e sem encerrar as sessões abertas.

Afeta toda pessoa com conta, e cresce com o cadastro self-service ligado. Afeta também a
operação, que precisa atender o pedido com segurança.

### Como reproduzir

1. Com uma conta existente `pessoa@exemplo.com`, considere que a dona esqueceu a senha.
2. Na tela de login, procure uma forma de recuperar o acesso: não há.
3. Em "Criar conta", informe o mesmo e-mail: a resposta é "Já existe uma conta com este
   e-mail."
4. Como operação, procure um comando para redefinir a senha (documentação e
   `backend/app/auth/`): só existe o de criar conta, que recusa o e-mail existente.

**Observado:** a pessoa fica sem acesso permanentemente.
**Esperado:** a operação consegue definir uma nova senha para a conta, com as mesmas
regras do cadastro, e a pessoa volta a entrar.

## Resultado esperado

Ao receber o pedido de uma pessoa (e confirmar a identidade fora do sistema), a operação
roda um comando que define uma nova senha para a conta. A senha é digitada sem aparecer na
tela, com confirmação, e segue as mesmas regras do cadastro. Todas as sessões abertas
daquela conta são encerradas, para que quem estiver usando a senha antiga perca o acesso.
A pessoa entra com a nova senha e encontra os mesmos anúncios monitorados.

## Decisões assumidas (22/11/2026)

- **Canal:** só operação, por linha de comando, no mesmo padrão do comando que cria contas.
  A recuperação pela própria pessoa (link "Esqueci minha senha" com envio de e-mail) fica
  para spec própria, porque exige provedor de e-mail e revisa a decisão da 0048 de não
  enviar e-mails nesta fase.
- **Confirmação de identidade:** responsabilidade da operação, fora do sistema. O comando
  não envia nada para a pessoa.
- **Sessões:** redefinir encerra todas as sessões da conta, inclusive a de quem pediu.

## Critérios de aceite

- [ ] **AC01 — Redefinição bem-sucedida:** dada uma conta existente, quando a operação
  roda o comando com o e-mail da conta e informa duas vezes a mesma senha válida, então o
  comando informa sucesso, o login com a senha antiga passa a responder
  `invalid_credentials` e o login com a nova senha abre sessão. Os anúncios monitorados
  e demais dados da conta não mudam.
- [ ] **AC02 — E-mail normalizado como no login:** dado o e-mail informado com letras
  maiúsculas ou espaços nas pontas, quando a operação roda o comando, então a conta
  encontrada é a mesma que o login encontraria.
- [ ] **AC03 — Conta inexistente:** dado um e-mail sem conta, quando a operação roda o
  comando, então ele termina com erro e mensagem em português, nenhuma conta é criada e
  nada é alterado no banco.
- [ ] **AC04 — Regras de senha do cadastro:** dada uma senha com menos de 12 ou mais de
  1024 caracteres, ou com caracteres que não viram UTF-8, quando a operação a informa,
  então o comando termina com a mesma mensagem do cadastro para aquela regra e a senha da
  conta não muda.
- [ ] **AC05 — Confirmação diferente:** dadas a senha e a confirmação diferentes, quando a
  operação as informa, então o comando termina com erro e a senha da conta não muda.
- [ ] **AC06 — Sessões encerradas:** dada uma conta com sessões abertas em dois
  navegadores, quando a senha é redefinida, então as duas sessões passam a receber
  `401 unauthenticated` em `GET /api/auth/me`. Sessões de outras contas continuam válidas.
- [ ] **AC07 — Senha nunca exposta:** a senha não é aceita como argumento do comando, não
  aparece na tela ao ser digitada e não é escrita em saída, log ou mensagem de erro.
- [ ] **AC08 — Atomicidade:** se o banco falhar durante a redefinição, nem a senha nem as
  sessões ficam em estado parcial: ou a senha mudou e as sessões foram encerradas, ou
  nada mudou.
- [ ] **AC09 — Documentação da operação:** o procedimento (como rodar localmente e em
  Stage, e o lembrete de confirmar a identidade antes) está documentado onde a operação já
  consulta o comando de criar conta.

## Fora de escopo

- Recuperação de senha pela própria pessoa, link "Esqueci minha senha", tokens de
  recuperação e qualquer envio de e-mail.
- Troca de senha pela pessoa logada (tela de conta).
- Mudanças nas regras de senha, no limite de tentativas de login (0057) ou na duração da
  sessão (0060).
- Bloqueio, desativação ou exclusão de contas.

## Riscos e perguntas em aberto

- **Limite de tentativas ainda ativo (aceito em 22/11/2026):** se a pessoa errou muitas
  vezes antes de pedir ajuda, a contagem da 0057 continua valendo até o fim da janela de
  15 minutos, mesmo com a senha nova. A redefinição não altera essa contagem; a janela é
  curta e a operação orienta a pessoa a aguardar.
- **Engenharia social:** o comando confia em quem o roda. A confirmação de identidade
  fora do sistema é o controle; o comando não a substitui.
- **Tela de login sem orientação:** a pessoa que esquece a senha não sabe que pode pedir
  ajuda. Uma frase na tela ("Esqueceu a senha? Fale com o suporte") exigiria canal de
  contato e quadro no Figma; fica para a spec de recuperação self-service.
