---
numero: 0048
titulo: Cadastro self-service de usuários
tipo: feature
prioridade: P1
status: pronta
toca: [backend, frontend, contrato]
depende_de: []
issue: https://github.com/SamiaLuvanice/bestprice/issues/252
---

# 0048 — Cadastro self-service de usuários

Issue: https://github.com/SamiaLuvanice/bestprice/issues/252

## Problema e público

O BestPrice é destinado a usuários reais, mas hoje uma conta só passa a existir quando
a operação a cria pela linha de comando, com acesso direto ao banco do ambiente. Quem
chega pela landing page pública ou pela tela de login não tem como começar a usar o
produto sozinho. Toda pessoa nova depende de uma ação manual da operação. Isso impede
qualquer uso real fora do círculo de quem já tem acesso ao terminal. Também contradiz a
proposta de um acompanhamento simples e automático. Feature P1 para visitantes sem conta
e, indiretamente, para a operação, que deixa de criar contas manualmente.

## Resultado esperado

Uma pessoa sem conta encontra a opção **Criar conta** na tela de login e na landing page.
Ela informa e-mail, senha e confirmação da senha. Se os dados forem válidos, a conta é
criada e a sessão é iniciada na hora. A pessoa segue para o destino de retorno que
trouxe ao cadastro, como no login (por exemplo, o Assistente). Sem destino, chega ao
painel vazio, pronta para colar o primeiro link. Não há etapa de confirmação por e-mail
nesta fase.

As regras de conta são as mesmas em todos os caminhos: cadastro, login e linha de
comando. O e-mail é único, sem diferença entre maiúsculas e minúsculas e sem espaços nas
pontas; precisa estar no formato `nome@domínio.tld` e ter no máximo 320 caracteres (contados como digitados). A
senha tem de 12 a 1024 caracteres. Uma conta criada pelo cadastro entra pelo login
existente exatamente como uma conta provisionada, e a criação pela linha de comando
continua disponível para a operação, passando a aplicar esses mesmos limites.

O formulário exibe um aviso curto e informativo sobre o uso do e-mail (identificar a
conta e permitir o acesso), sem caixa de aceite e sem registro de consentimento.

Erros de preenchimento aparecem junto ao campo, em português, sem apagar o que a pessoa
digitou (exceto as senhas). Se o e-mail já tiver conta, a pessoa é orientada a entrar.
Tentativas excessivas de cadastro a partir da mesma origem são recusadas temporariamente,
com o tempo de espera informado, para conter abuso de um cadastro aberto.

## Decisões do responsável (06/11/2026)

- **Acesso:** cadastro aberto a qualquer pessoa com e-mail, sem convite.
- **Verificação de e-mail:** não nesta fase. A conta fica ativa imediatamente e nenhum
  e-mail é enviado.
- **Recuperação de senha:** fora desta spec, em spec própria. Até lá, a operação
  redefine pela linha de comando.
- **Destino após o cadastro:** respeita o destino de retorno, como o login; sem ele, painel.
- **Tentativa:** todo envio de cadastro que chega ao servidor conta para o limite,
  inclusive os bem-sucedidos, os duplicados e os com erro de validação. Recusas pelo
  próprio limite (tempo de espera) não contam, para o tempo informado ser verdadeiro.
  Padrão de 5 tentativas por origem a cada 60 minutos, ajustável por configuração.
- **Regras únicas (06/11/2026):** e-mail no formato `nome@domínio.tld` em toda criação de
  conta (cadastro e linha de comando), validado no servidor, como a tela de login já
  exige. A linha de comando passa a seguir os mesmos limites do login (e-mail até 320
  caracteres antes de tirar os espaços; senha até 1024). O login não passa a recusar
  contas já existentes por formato.
- **Origem e privacidade do limite:** a origem só é aceita quando vem do proxy confiável
  do ambiente; o endereço de origem não é guardado em claro, só uma forma derivada não
  reversível, apagada após a janela.
- **Cadastro desligado:** o endereço do cadastro leva ao login.
- **Privacidade:** aviso informativo no formulário, sem aceite registrado.
- **Liberação (06/11/2026):** o cadastro não é liberado em Stage até a leitura de anúncios
  do Mercado Livre funcionar. Para isso, o cadastro fica atrás de um interruptor por
  ambiente, desligado por padrão; a operação o liga quando a integração funcionar.
- **Enumeração de contas:** aceita nesta fase; o AC07 revela que o e-mail tem conta,
  mitigado pelo AC09. A alternativa silenciosa depende de envio de e-mail.

## Critérios de aceite

- [ ] **AC01 — Acesso ao cadastro:** dado um visitante sem sessão, quando ele aciona "Criar conta" na tela de login ou na landing page, então vê o formulário de cadastro. Dado um usuário com sessão ativa, quando ele abre o endereço do cadastro, então é levado ao painel.
- [ ] **AC02 — Cadastro bem-sucedido:** dado um e-mail sem conta, uma senha de 12 ou mais caracteres e uma confirmação idêntica, quando o visitante envia, então a conta é criada, a sessão é iniciada sem novo login e ele chega ao painel sem monitoramentos. Se o cadastro foi aberto com um destino de retorno (por exemplo, a partir de "Começar com IA"), ele chega a esse destino.
- [ ] **AC03 — Login posterior:** dada uma conta criada pelo cadastro, quando a pessoa sai e entra de novo com o mesmo e-mail e a mesma senha, então o login funciona como para uma conta provisionada pela operação.
- [ ] **AC04 — E-mail normalizado:** dado o cadastro de ` Ana@Exemplo.com `, quando a pessoa entra com `ana@exemplo.com`, então o login funciona. Um novo cadastro com `ANA@exemplo.com` é recusado como e-mail já cadastrado.
- [ ] **AC05 — E-mail inválido:** dado um e-mail vazio, fora do formato `nome@domínio.tld` (por exemplo `a@b`) ou com mais de 320 caracteres, quando o visitante envia, então o campo de e-mail mostra a mensagem de erro e nenhuma conta é criada.
- [ ] **AC06 — Senha inválida:** dada uma senha com menos de 12 caracteres, com mais de 1024 caracteres ou com confirmação diferente, quando o visitante envia, então o campo correspondente mostra a mensagem de erro (inclusive quando a recusa vem do servidor) e nenhuma conta é criada.
- [ ] **AC07 — E-mail já cadastrado:** dado um e-mail que já tem conta, quando alguém tenta cadastrá-lo, então recebe a mensagem de que já existe conta com esse e-mail e um atalho para entrar. Nenhuma sessão é criada, e a senha da conta existente não muda.
- [ ] **AC08 — Envios simultâneos:** dados dois cadastros simultâneos com o mesmo e-mail, quando ambos são processados, então existe exatamente uma conta. A outra tentativa recebe o erro de e-mail já cadastrado, nunca um erro genérico do servidor.
- [ ] **AC09 — Limite de tentativas:** dado que uma mesma origem fez 5 envios de cadastro (qualquer resultado) nos últimos 60 minutos, com os valores padrão, quando ela tenta de novo, então a tentativa é recusada sem criar conta e a resposta informa o tempo de espera. Passado esse tempo, um cadastro válido volta a funcionar.
- [ ] **AC10 — Sigilo:** em nenhum dos cenários acima a senha aparece em claro no banco, nos logs ou nas respostas da API, e o endereço de origem usado no limite não fica guardado em claro.
- [ ] **AC11 — Isolamento:** dada uma conta recém-criada, quando ela consulta painel, monitoramentos, alertas, notificações e conversas do Assistente, então vê apenas dados próprios (vazios) e nunca dados de outras contas.
- [ ] **AC12 — Operação preservada:** a criação de conta pela linha de comando continua funcionando, com as mesmas regras de e-mail e senha (inclusive recusar e-mail com mais de 320 caracteres antes de tirar os espaços e senha com mais de 1024), e recusa um e-mail já cadastrado pelo fluxo self-service.
- [ ] **AC13 — Interface acessível e fiel ao Figma:** o formulário segue a referência do Figma aprovada para o cadastro. Cada campo tem rótulo visível, os erros são anunciados a leitores de tela e o fluxo funciona só com o teclado, em desktop (1440 px) e mobile (390 px). O aviso informativo sobre o uso do e-mail fica visível antes do envio.
- [ ] **AC14 — Cadastro desligado:** dado o interruptor de cadastro desligado (padrão), quando um visitante procura o cadastro, então não vê "Criar conta" no login nem na landing, o endereço do cadastro leva ao login e a API recusa o envio sem criar conta nem contar tentativa. A criação pela linha de comando e o login continuam funcionando. Com o interruptor ligado, valem AC01–AC13.

## Fora de escopo

- Confirmação de e-mail, envio de qualquer e-mail e escolha de serviço de e-mail.
- Recuperação ou redefinição de senha pela aplicação.
- Limite de tentativas no **login** (achado da auditoria do backend de 06/11/2026, tratado
  em spec própria). Esta spec limita apenas o cadastro.
- Convites, aprovação manual ou domínios permitidos.
- Login social (Google e outros) e autenticação em dois fatores.
- Edição de perfil, troca de e-mail ou senha e exclusão da conta pela aplicação.
- Limpeza de sessões expiradas e mudanças na duração da sessão.
- CAPTCHA ou desafios anti-robô além do limite de tentativas.

## Perguntas em aberto

- **Referência visual (bloqueia só a interface):** arquivo Figma indicado pelo
  responsável: https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=6-83.
  Falta confirmar se ele contém a tela de cadastro em desktop e mobile. Se não contiver,
  ela deve ser criada e aprovada antes do `/plan` da parte de interface (fluxo
  Figma → Codex → Implementação → Validação visual). O backend não depende disso.
- **Identificação da origem:** o `/plan` define como identificar a "origem" atrás dos
  proxies do ambiente, já que o limite só vale se essa identificação for confiável.
- **Risco registrado:** com contas ilimitadas, uma pessoa pode consumir a cota global da IA
  e as consultas ao Mercado Livre feitas pela conta operadora. Não é tratado aqui.
