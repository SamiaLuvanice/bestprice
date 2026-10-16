---
numero: 0023
titulo: Login com imagem lateral de referência
tipo: melhoria
prioridade: P2
status: pronta
toca: [frontend, docs]
depende_de: [0011, 0015, 0016, 0017, 0020]
---

# 0023 — Login com imagem lateral de referência

Issue: https://github.com/SamiaLuvanice/bestprice/issues/106

## Problema

A tela de entrada já permite autenticação, mas sua apresentação ainda difere da
referência visual escolhida para o BestPrice. Para pessoas não autenticadas, a
primeira experiência deve comunicar a marca e deixar o formulário de entrada
claro, sem sugerir funções que ainda não existem.

## Relação com as specs 0017 e 0020

Esta spec substitui a apresentação da coluna visual e o contêiner de vidro com
brilhos da 0017/AC01–AC02 e da 0020/AC11–AC13 **somente na tela de entrada**.
A arte fornecida é uma exceção explícita à proibição anterior de nomes de
produtos, preços e percentuais na coluna decorativa: esses elementos já estão
incorporados à imagem estática escolhida pelo responsável. Eles não autorizam
cards de produto ou preços fictícios criados separadamente na interface.
Permanecem válidos os critérios de autenticação, responsividade, acessibilidade
e primeira dobra das duas specs, incluindo a 0020/AC03.

## Comportamento esperado

Em telas largas, a entrada ocupa uma composição de duas áreas lado a lado, inspirada
na [referência de composição](./referencia-composicao.png): uma área visual à esquerda
e o formulário de login à direita. A área esquerda usa a [imagem fornecida](./imagem-lateral.png)
como sua arte principal, preservando proporção e a marca que já está incorporada
nela. Em janelas largas e baixas, a imagem pode ser recortada: a marca e a
mensagem principal devem permanecer visíveis; os cartões de exemplo e os
benefícios no rodapé podem ficar fora do enquadramento. A composição da direita
segue a hierarquia da referência: título
"Bem-vindo de volta", texto de apoio, campos E-mail e Senha, controle de visibilidade
da senha e ação "Entrar" em destaque.

A imagem lateral é uma peça promocional estática. Produtos, valores, percentuais e
frases nela incorporados são parte da ilustração, não informações de anúncios reais
nem resultados obtidos da conta da pessoa. A tela não repete por cima da imagem a
marca ou o texto que ela já contém.

Em telas estreitas, a pessoa vê o formulário com a marca, sem precisar percorrer
primeiro a imagem lateral. Nas larguras de 320, 768 e 1280 px, com 640 px de
altura útil e sem mensagens de erro, os campos e o botão "Entrar" continuam
inteiros na primeira dobra, conforme a 0020/AC03. Com mensagens visíveis, vale
o mesmo comportamento de rolagem já definido por essa spec.

Esta melhoria mantém os fluxos atuais de autenticação e os estados de validação,
envio, erro e sessão encerrada. Os controles de cadastro, recuperação de senha e
entrada com Google exibidos na referência de composição não aparecem, conforme a
decisão do responsável nesta demanda.

## Critérios de aceite

- [ ] **AC01** — Dada uma pessoa não autenticada em tela larga, quando a entrada é
      exibida, então a imagem fornecida ocupa a área esquerda e o formulário ocupa
      a direita, com hierarquia e espaçamento reconhecíveis da referência de
      composição.
- [ ] **AC02** — Dada a imagem lateral em tela larga, então sua proporção é preservada,
      não há distorção, e marca e mensagem principal permanecem reconhecíveis
      inclusive em 1280 × 640 px. Cartões de exemplo e rodapé podem ser recortados
      nessa janela. Não há textos ou logo duplicados sobre a arte.
- [ ] **AC03** — Dados os textos, produtos, valores e percentuais contidos na imagem,
      então eles são apresentados apenas como parte da peça promocional estática;
      a interface não os anuncia como dados reais da conta ou como resultados de
      monitoramento.
- [ ] **AC04** — Em larguras de 320, 768 e 1280 px, o formulário, suas mensagens e
      seus controles permanecem legíveis e operáveis, sem rolagem horizontal.
      Com 640 px de altura útil, sem mensagens, os campos e "Entrar" aparecem
      inteiros sem rolagem vertical; com mensagens, vale a 0020/AC03. Nas
      larguras estreitas, a imagem lateral não antecede o formulário e a marca
      continua identificável.
- [ ] **AC05** — O formulário mostra "Bem-vindo de volta", os campos E-mail e Senha,
      o controle de mostrar/ocultar senha e "Entrar". Cadastro, recuperação de
      senha, separador "ou" e entrada com Google não são exibidos.
- [ ] **AC06** — Validação de e-mail e senha, envio único durante carregamento,
      autenticação bem-sucedida, erro de credenciais, falha de rede e aviso de
      sessão encerrada preservam os comportamentos já definidos para o login.
- [ ] **AC07** — A entrada pode ser percorrida por teclado com foco visível; campos,
      ações, erros e marca têm nomes e avisos acessíveis. O conteúdo textual
      incorporado na imagem recebe uma descrição curta da marca, da mensagem
      principal e dos benefícios; valores e percentuais ilustrativos não são
      lidos como dados da conta. Não há anúncios redundantes. Contraste e áreas
      de toque atendem aos critérios já vigentes.
- [ ] **AC08** — A mudança visual não altera a autenticação da API nem a experiência
      da área autenticada e dos estados de carregamento ou indisponibilidade da sessão.

## Fora de escopo

- Criar conta, recuperar senha ou autenticar com Google.
- Alterar regras de autenticação, contratos REST, persistência ou backend.
- Redesenhar a área autenticada ou os estados de carregamento e indisponibilidade.
- Transformar preços e produtos da peça promocional em dados dinâmicos.

## Referências e decisões do intake

- A imagem 1 fornecida pelo responsável orienta a composição; a imagem 2 fornecida
  deve ser usada na lateral esquerda. Ambas foram preservadas junto desta spec
  para que o planejamento e a implementação tenham a mesma referência.
- Em 16/10/2026, o responsável confirmou que a melhoria inclui apenas a
  apresentação visual e o login atual. Os recursos adicionais visíveis na imagem 1
  não entram nesta entrega.
- A prioridade P2 indica melhoria relevante sem bloqueio operacional relatado.

## Perguntas em aberto

Nenhuma dúvida de produto bloqueante para o planejamento.
