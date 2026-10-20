---
numero: 0026
titulo: Validacao operacional do Mercado Livre
tipo: melhoria
prioridade: P0
status: rascunho
toca: [backend, docs, infraestrutura]
depende_de: [0013]
---

# 0026 — Validacao operacional do Mercado Livre

Issue: https://github.com/SamiaLuvanice/bestprice/issues/127

## Problema

O cadastro e o monitoramento dependem da API oficial do Mercado Livre, mas a
autorização da conta operadora, a renovação OAuth e a leitura de anúncios de
terceiros nunca foram comprovadas com credenciais operacionais. Mocks confirmam
o tratamento do código, mas não provam acesso real, o formato das respostas ou
os limites aplicáveis. A integração deve continuar desligada enquanto essa
evidência não existir.

## Comportamento esperado

Uma pessoa operadora consegue autorizar a conta no fluxo OAuth oficial por um
callback HTTPS protegido por `state`; os tokens resultantes são cifrados no banco
do ambiente de validação. Ela executa uma validação controlada usando IDs de
anúncios previamente autorizados, sem expor tokens nem modificar dados de
monitoramento. O resultado distingue verificações concluídas, falhas e itens
que exigem operação manual, e pode ser registrado sem segredos. A validação não
liga a integração por conta própria. O procedimento cobre autorização e rotação
de tokens, anúncios com preço, sem preço e indisponíveis, cadastro/atualização,
falhas temporárias, rate limit e recuperação, respeitando os limites observados.

## Critérios de aceite

- [ ] **AC01** — A autorização OAuth oficial valida `state`, troca o código usando o redirect URI registrado, armazena access/refresh tokens cifrados e o procedimento registra uma renovação real sem revelar tokens.
- [ ] **AC02** — Anúncios permitidos de terceiros com preço, sem preço e indisponíveis são consultados pela API oficial e seus campos/contexto são conferidos contra os dados normalizados. Uma resposta parcial documentada de item é aceita somente quando contém os campos necessários à normalização.
- [ ] **AC03** — O procedimento demonstra cadastro, atualização e recuperação após falha temporária ou limite real de requisições, sem gerar consultas acima do permitido.
- [ ] **AC04** — Evidências registram data UTC, resultado, IDs de anúncio de teste e limites, sem armazenar credenciais ou dados pessoais desnecessários.
- [ ] **AC05** — A integração permanece desativada por padrão e nenhuma validação bem-sucedida a ativa automaticamente.
- [ ] **AC06** — Testes automatizados cobrem estado OAuth inválido/expirado, troca e persistência de tokens, saída segura do callback e da sonda sem depender de rede ou credenciais.

## Fora de escopo

- Criar ou alterar aplicação, escopos, termos e credenciais no DevCenter; a configuração do app é feita pelo operador.
- Habilitar monitoramento contínuo ou alterar o flag de ativação em qualquer ambiente.
- Scraping, consulta de anúncios não autorizados ou geração de tráfego para provocar rate limit.
- Mudar o contrato de monitoramento ou persistir snapshots de anúncios usados como evidência.

## Perguntas em aberto

- A operação precisa fornecer credenciais OAuth vigentes e IDs MLB de anúncios de terceiros permitidos que representem cada cenário. A decisão é não registrar segredos ou dados pessoais nos artefatos do repositório.
- A API pode não oferecer um anúncio naturalmente sem preço ou indisponível permitido pela conta. Nesse caso, registrar o critério como bloqueado e preservar o flag desligado, sem inferir aprovação a partir de mocks.
- Não se provocará um 429 em produção. O comportamento de falha e recuperação será exercitado com resposta simulada; validação do limite real depende de observação passiva ou orientação oficial de cadência.
