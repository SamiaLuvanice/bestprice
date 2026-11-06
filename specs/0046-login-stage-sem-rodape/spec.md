---
numero: 0046
titulo: Login de stage como referência, sem rodapé
tipo: melhoria
prioridade: P2
status: implementada
toca: [frontend]
depende_de: [0039]
---

# 0046 — Login de stage como referência, sem rodapé

Issue: [#239](https://github.com/SamiaLuvanice/bestprice/issues/239).

## Problema e público

Pessoas que acessam o BestPrice devem encontrar a tela de login já aprovada pela
responsável pelo produto em stage. A demanda determina preservar essa versão no
projeto e atualizar o Figma para representá-la, com uma única mudança visual:
retirar o rodapé do login. Trata-se de melhoria P2, sem incidente operacional
relatado, restrita à interface pública de autenticação e à sua referência visual.

## Comportamento esperado

A tela publicada em [stage](https://bestprice-stage.pages.dev/login), conferida em
04/11/2026, é a referência aprovada para o login. Permanecem a marca BestPrice,
o título “Entrar na sua conta”, o subtítulo “Acesse seus anúncios monitorados e
alertas.”, os campos E-mail e Senha, o controle Mostrar senha, a ação Entrar com
o tratamento visual verde existente, a orientação “O monitoramento começa com um
link do Mercado Livre.” e o acesso “Voltar para o início”. A composição, a
tipografia, as imagens e a adaptação entre telas largas e estreitas seguem stage.

O rodapé “BestPrice · Acompanhe com clareza”, sua divisória e sua faixa visual
deixam de aparecer no login, inclusive abaixo da dobra ou durante estados de
validação, envio e erro. A orientação sobre o link do Mercado Livre e o retorno
ao início pertencem ao conteúdo do login e permanecem visíveis. A tela utiliza
o espaço liberado sem reservar uma área vazia equivalente ao antigo rodapé.

O [Figma BestPrice](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice)
passa a documentar esse mesmo resultado em desktop e mobile com camadas editáveis.
Para esta tela, a decisão explícita de preservar stage prevalece sobre diferenças
de versões anteriores do desenho. A atualização não autoriza um novo redesign.

## Critérios de aceite

- [x] **AC01 — Referência preservada:** o login mantém a composição, marca, textos, controles, cores, tipografia e imagens da versão aprovada em stage, exceto pela retirada do rodapé e pelo ajuste de espaço decorrente dela; a comparação identifica a referência consultada.
- [x] **AC02 — Login sem rodapé:** acessar diretamente o login, inclusive com destino de retorno, não apresenta o rodapé, sua divisória nem espaço reservado a ele; o resultado permanece durante validação, envio e falha de autenticação.
- [x] **AC03 — Conteúdo preservado:** a orientação sobre o Mercado Livre e “Voltar para o início” continuam disponíveis e não são removidos junto com o rodapé.
- [x] **AC04 — Figma sincronizado:** os quadros de login desktop e mobile refletem stage sem rodapé, com textos e controles editáveis; links dos quadros, dimensões, data e evidências da comparação estão registrados. Atualizados pelo Chrome em 04/11/2026; equivalência de fonte e limites em verification.md.
- [x] **AC05 — Fluxo preservado:** preencher e enviar credenciais, mostrar/ocultar senha, receber erros e retornar ao destino permitido após autenticação conservam o comportamento existente.
- [x] **AC06 — Responsividade e acesso:** em 320, 390, 768, 1280 e 1440 px não há rolagem horizontal, sobreposição nem corte de controles; teclado, foco visível, rótulos e alvos interativos de pelo menos 44 × 44 px são preservados. A rolagem vertical necessária em telas baixas continua permitida.
- [x] **AC07 — Escopo do rodapé:** landing, área autenticada e demais páginas mantêm seu comportamento de rodapé atual.

## Fora de escopo

Redesenhar a identidade do login; trocar sua paleta, conteúdo ou imagens por
uma versão antiga do Figma; criar cadastro ou recuperação de senha; alterar
autenticação, contrato da API, backend ou banco; modificar rodapés de outras
telas; promover branches, publicar release ou realizar deploy.

## Dependências e limites

- A tentativa inicial pelo MCP em 04/11/2026 foi bloqueada pelo limite Starter. Em seguida, a responsável autorizou expressamente a edição pelo Chrome; os quadros desktop e mobile foram atualizados pela interface normal do Figma, com exportações de evidência.
- A verificação da referência deve registrar a versão publicada e os recursos observados, pois stage pode mudar. O SHA da branch não comprova sozinho o SHA implantado.
- A Issue deve permanecer aberta até a entrega verificada; registrar a demanda não comprova implementação nem sincronização do Figma.

## Perguntas em aberto e suposições

Não há dúvida de produto impeditiva para o intake. Considera-se que “rodapé”
significa o bloco final “BestPrice · Acompanhe com clareza”, observado em stage,
e não a orientação e o link de retorno dentro do login. A retirada vale para
desktop e mobile e somente para o login. A sincronização Figma foi realizada
pelo Chrome. A fonte Arial não estava disponível no editor web: Arimo foi usada
como equivalente visual, sem alterar a fonte da aplicação; não se declara
igualdade pixel a pixel de tipografia. A implementação foi integrada em develop
pela PR #240; a promoção e a validação de stage são uma etapa de entrega separada.
