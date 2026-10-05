---
numero: 0002
titulo: Autenticação de usuário com tela de login e redirecionamento para página principal
tipo: feature
prioridade: P1
status: pronta
toca: [backend, frontend, contrato]
depende_de: [0001]
---

# 0002 — Autenticação de usuário com tela de login e redirecionamento

## Problema

Hoje o `my_bank` não possui mecanismo de identificação nem controle de acesso. Qualquer pessoa que acessa a aplicação visualiza o esqueleto inicial sem precisar autenticar-se. Sem uma tela de login e validação de credenciais, não é possível proteger informações bancárias nem identificar qual usuário está operando o sistema.

Esta entrega atende quem desenvolve e testa o projeto localmente: será possível entrar com uma conta de teste, acessar uma página protegida e encerrar a sessão. Nenhuma informação bancária será apresentada nesta etapa.

## Comportamento esperado

1. **Acesso não autenticado:** Quando um usuário não autenticado acessa a aplicação ou tenta entrar na rota principal, a interface o redireciona automaticamente para a tela de login.
2. **Formulário de login:** A tela apresenta os campos obrigatórios e-mail e senha e um botão para enviar as credenciais. Apenas e-mail é aceito como identificador. E-mail sem formato válido ou senha vazia impedem o envio e geram uma mensagem junto ao campo correspondente. A API também valida esses campos quando chamada diretamente.
3. **Autenticação bem-sucedida:** Ao submeter credenciais válidas, a API confirma a autenticação e a interface redireciona o usuário para a página principal. Essa página contém apenas a confirmação de acesso, o e-mail do usuário autenticado e a opção de logout.
4. **Tratamento de credenciais inválidas:** Se as credenciais forem incorretas, a interface permanece na página de login e exibe "E-mail ou senha inválidos". E-mail inexistente e senha incorreta produzem o mesmo status e conteúdo de erro na API, sem revelar se a conta existe.
5. **Acesso autenticado à rota de login:** Um usuário já autenticado que tentar acessar a rota de login é redirecionado automaticamente de volta para a página principal.
6. **Encerramento de sessão (Logout):** Na página principal, o usuário autenticado possui uma opção de logout. Após a confirmação da API, a sessão fica inválida no servidor, o estado de autenticação da interface é limpo e o usuário volta à tela de login. Reutilizar a sessão encerrada não permite acessar recursos protegidos. Se não for possível confirmar o encerramento, a interface informa a falha e permite tentar novamente, sem anunciar sucesso.
7. **Proteção na API:** A API verifica a autenticação em seus recursos protegidos, inclusive em requisições feitas diretamente, sem passar pela interface. Ausência de sessão válida resulta em 401, sem dados protegidos na resposta. O login e a consulta de saúde continuam acessíveis sem autenticação.
8. **Falha de comunicação:** Se a API estiver indisponível ou ocorrer uma falha de rede durante o login, a interface permanece no formulário, informa "Não foi possível entrar. Tente novamente" e permite novo envio. Essa situação não é apresentada como credencial incorreta.
9. **Duração da sessão:** Recarregar a página mantém a autenticação enquanto a sessão estiver válida. A sessão expira após 30 minutos sem requisições autenticadas à API; a próxima tentativa de acesso protegido exige novo login e informa "Sua sessão expirou. Entre novamente". Fechar todas as janelas do navegador e abri-lo novamente, sem restauração de sessão, exige novo login. Não há opção "lembrar de mim".
10. **Conta local:** Quem desenvolve informa o e-mail e a senha da conta de teste por configuração do ambiente local, sem credenciais literais versionadas ou exibidas em logs. A conta fica disponível para login após a inicialização e continua utilizável após reiniciar a aplicação com a mesma configuração. Se essas credenciais não forem fornecidas no ambiente local, a inicialização falha com indicação da configuração ausente, sem revelar seu valor. Testes automatizados não dependem dessas credenciais locais.

## Superfície de acesso prevista

- Interface: `/` encaminha para `/login` sem sessão válida e para `/dashboard` com sessão válida; `/login` é a tela de entrada e `/dashboard` é a página principal protegida.
- `POST /api/auth/login`: recebe `email` e `password` e autentica a conta local.
- `GET /api/auth/me`: recurso protegido que retorna o `email` do usuário da sessão atual; permite demonstrar a proteção no servidor e recuperar a identificação após recarregar a página.
- `POST /api/auth/logout`: encerra a sessão atual; sem sessão válida, responde 401 e a interface retorna ao login, pois já não há autenticação válida.
- `GET /actuator/health`: permanece público, conforme a entrega anterior.

O contrato detalhado, os demais códigos de sucesso, o mecanismo de sessão e a forma de disponibilizar a conta local serão definidos no plano, seguindo as regras do projeto.

## Critérios de aceite

- [x] Dado um usuário não autenticado, quando ele acessa a rota inicial ou qualquer rota protegida da aplicação, então ele é redirecionado para a tela de login.
- [x] Dado que o usuário está na tela de login, quando ele preenche credenciais válidas e envia o formulário, então a autenticação é confirmada pela API e ele é redirecionado para `/dashboard`, que exibe a confirmação de acesso, seu e-mail e a opção de logout, sem dados bancários.
- [x] Dado um e-mail inexistente ou uma senha incorreta para um e-mail existente, quando se tenta autenticar, então a API responde 401 com o mesmo conteúdo de erro em ambos os casos e a interface exibe "E-mail ou senha inválidos", sem realizar o redirecionamento.
- [x] Dado um usuário já autenticado, quando ele tenta navegar diretamente para a rota de login, então a interface o redireciona de volta para a página principal.
- [x] Dado um usuário autenticado na página principal, quando ele aciona o logout e a API confirma o encerramento, então o estado de autenticação é limpo e ele é redirecionado para a tela de login; uma requisição direta usando a sessão anterior recebe 401.
- [x] Dado um usuário autenticado, quando o logout falha por indisponibilidade da API, então a interface informa que não foi possível confirmar o encerramento e permite tentar novamente, sem exibir confirmação de sucesso.
- [x] Dado um formulário com e-mail vazio, e-mail sem formato válido ou senha vazia, quando o usuário tenta submeter, então nenhuma requisição de login é enviada e cada campo inválido recebe uma mensagem explicando o problema.
- [x] Dada uma requisição direta de login com e-mail ausente ou malformado ou senha ausente ou vazia, quando a API a recebe, então responde 400 com os campos inválidos em `errors`, sem criar uma sessão.
- [x] Dado um cliente sem sessão válida, quando ele consulta diretamente um recurso protegido da API, então recebe 401 sem dados protegidos; o login e a consulta de saúde permanecem públicos.
- [x] Dada uma falha de rede ou indisponibilidade da API, quando o usuário envia o login, então permanece no formulário, vê "Não foi possível entrar. Tente novamente" e pode tentar outra vez.
- [x] Dada uma tentativa de login, quando são inspecionados os logs e as respostas da API, então não há senha, hash de senha ou detalhes internos de erro expostos.
- [x] Dada uma sessão válida, quando o usuário recarrega `/dashboard`, então permanece autenticado e visualiza o mesmo e-mail obtido da API.
- [x] Dada uma sessão cuja última requisição autenticada ocorreu há 30 minutos ou mais, quando se consulta `/api/auth/me`, então a API responde 401 e a interface encaminha para o login com a mensagem de sessão expirada.
- [x] Dada uma sessão com menos de 30 minutos de inatividade, quando uma requisição autenticada é aceita pela API, então o prazo de inatividade passa a contar a partir dessa requisição.
- [x] Dado um usuário autenticado, quando fecha todas as janelas do navegador e o abre novamente sem restauração de sessão, então o acesso à página principal exige novo login.
- [x] Dada a configuração local de e-mail e senha, quando a aplicação inicia e depois é reiniciada com a mesma configuração, então as credenciais permitem login nas duas ocasiões, sem cadastro pela interface.
- [x] Dada a ausência de e-mail ou senha na configuração local, quando se inicia a aplicação nesse ambiente, então a inicialização falha indicando a configuração ausente, sem expor credenciais.
- [x] Dado o ambiente de testes automatizados sem credenciais locais configuradas, quando os testes de autenticação são executados, então usam dados próprios de teste e não dependem de uma conta previamente cadastrada no ambiente local.

## Fora de escopo

- Cadastro próprio de novos usuários (auto-registro / sign-up).
- Fluxos de "Esqueci minha senha" ou redefinição de credenciais por e-mail.
- Autenticação multifator (MFA) ou login social (OAuth2 com Google/GitHub/etc.).
- Controle de acesso granular por perfis e permissões complexas (RBAC avançado).
- Saldos, contas bancárias, extratos, transferências, gráficos e demais funcionalidades de dashboard.
- Login por nome de usuário e opção "lembrar de mim".
- Garantir encerramento por fechamento em navegadores que restauram sessões; nesses casos, permanecem válidos o logout explícito e a expiração por inatividade.
- Administração de usuários e alteração das credenciais da conta local durante a execução.

## Perguntas em aberto

- **Base autorizada para implementação:** após a revisão da spec e do plano, o usuário solicitou implementar. A entrega segue identificação somente por e-mail; conta de teste configurada por variáveis de ambiente; manutenção do login ao recarregar a página; novo login após fechar o navegador sem restauração de sessão; expiração após 30 minutos de inatividade; página principal limitada à confirmação de acesso, e-mail e logout. `pronta` indica que a spec pode ser implementada, não que a feature foi verificada.
- **Dependência:** a spec 0001 fornece a aplicação, o banco e a consulta de saúde; esta entrega acrescenta autenticação e altera o acesso à página inicial.
- **Decisões reservadas ao plano:** contrato detalhado da API, configuração da conta local e mecanismo de armazenamento e invalidação da sessão. As escolhas técnicas devem atender aos comportamentos acima e às regras de segurança existentes.
