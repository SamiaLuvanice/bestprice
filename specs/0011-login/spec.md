---
numero: 0011
titulo: Acesso à conta BestPrice
tipo: feature
prioridade: P1
status: rascunho
toca: [frontend, backend, contrato]
depende_de: []
---

# 0011 — Acesso à conta BestPrice

## Problema

Pessoas que já têm uma conta BestPrice precisam entrar para acessar seus produtos
monitorados e dados pessoais. A aplicação atual ainda não oferece autenticação nem
uma página de login. Sem esse acesso, os recursos associados a cada usuário não
podem ser usados com segurança.

## Comportamento esperado

A pessoa encontra uma página de entrada que apresenta claramente a marca BestPrice,
incluindo sua logo, e permite informar e-mail e senha para acessar a conta. A
experiência segue a identidade visual do design system do projeto e toma como
referência a composição visual já fornecida para login, adaptando-a à aplicação.

O formulário orienta a pessoa quando os dados estão ausentes ou inválidos, permite
mostrar e ocultar a senha e comunica de forma compreensível uma tentativa recusada
ou uma indisponibilidade. Os campos permanecem utilizáveis por teclado, leitores de
tela e telas estreitas.

## Critérios de aceite

- [ ] Ao abrir a página de login, a pessoa vê a logo BestPrice e uma composição,
      tipografia e paleta coerentes com o design system e com a referência de login.
- [ ] A página apresenta campos identificados para e-mail e senha e uma ação clara
      para entrar; os campos oferecem rótulos acessíveis e tipos de preenchimento
      apropriados.
- [ ] Ao enviar campos vazios ou e-mail inválido, o formulário informa o que precisa
      ser corrigido e mantém o foco ou o associa ao primeiro campo inválido.
- [ ] Ao acionar mostrar ou ocultar senha, o valor permanece intacto e o estado da
      ação fica identificável para tecnologias assistivas.
- [ ] Durante o envio, a pessoa recebe indicação de que a tentativa está em curso e
      não consegue disparar envios duplicados pela mesma ação.
- [ ] Diante de credenciais recusadas ou falha de serviço/rede, a página apresenta
      uma mensagem compreensível, sem expor dados sensíveis ou detalhes internos.
- [ ] Em uma tentativa aceita, a pessoa recebe acesso à área autenticada sem que a
      interface trate uma resposta inválida como sucesso.
- [ ] Em larguras de tela estreitas e largas, o formulário permanece legível e
      utilizável sem rolagem horizontal; foco de teclado e mensagens de erro são
      visíveis e perceptíveis.

## Fora de escopo

- Recuperação ou redefinição de senha, criação de conta e autenticação por provedores
  externos.
- Administração de usuários, gerenciamento de perfil e mecanismos de autenticação
  multifator.
- Alterações em dashboard ou monitoramento de produtos que não sejam necessárias
  para encaminhar a pessoa após entrar.

## Perguntas em aberto

- O escopo inclui autenticação real de ponta a ponta, com API e sessão, ou somente a
  interface de login e seus comportamentos locais? A base atual não possui autenticação;
  a decisão altera o contrato, as partes tocadas e o critério de acesso bem-sucedido.
- A página deve oferecer uma opção de manter a sessão ativa? A referência visual a
  apresenta, mas a política de duração e persistência de sessão ainda não foi definida.
- A prioridade P1 é proposta porque o acesso é pré-requisito para recursos por usuário;
  confirmar no refinamento da fila.
