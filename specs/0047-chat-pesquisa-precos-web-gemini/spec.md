---
numero: 0047
titulo: Chat pesquisa preços na web com Gemini
tipo: feature
prioridade: P2
status: pronta
toca: [backend, frontend, contrato]
depende_de: [0034, 0040, 0044]
---

# 0047 — Chat pesquisa preços na web com Gemini

Issue: [#245](https://github.com/SamiaLuvanice/bestprice/issues/245).

## Problema e público

Hoje o Assistente responde só com o que a pessoa escreve (spec 0034: "Não há busca web").
Quem pergunta "quanto custa o produto X?" recebe a limitação em vez de uma referência de
preço. Feature P2 para pessoas autenticadas que usam o chat livre do Assistente.

## Resultado esperado

No chat livre, quando a pergunta pede preços ou ofertas atuais, o Assistente consulta a web
pela ferramenta nativa de grounding com Google Search do Gemini e responde em português
citando as fontes. A resposta com busca mostra as fontes, as sugestões de pesquisa do Google,
o momento da consulta e o rótulo **não verificado**. Os preços da web são referência: não criam
monitoramento nem produto monitorado, e o chat nunca elege vencedor sem evidência.

## Decisões do responsável

- **Fonte:** grounding com Google Search do Gemini. Não há scraping próprio nem leitura
  automática de páginas pelo backend.
- **Custo:** somente free tier, sem fallback pago, mantendo a 0034. Ao esgotar a cota ou o
  recurso ficar indisponível, o chat segue sem busca e informa isso claramente.
- **Confiança:** toda resposta com dados da web cita fonte, data da consulta e rótulo
  "não verificado".
- **Escopo:** apenas o chat livre. A análise de comparação continua sem busca.
- **Modelo (04/11/2026):** a documentação oficial informa que o grounding não está no free
  tier do `gemini-3.5-flash-lite` e só existe no tier pago. O `gemini-2.5-flash-lite` oferece até
  500 requisições com grounding por dia no free tier, compartilhadas com o Flash, e não tem
  desligamento anunciado. A responsável decidiu usar `gemini-2.5-flash-lite` em **todo** o
  Assistente (chat e comparação), revertendo a escolha de modelo da 0034.

## Termos do Google aplicáveis

Termos de "Grounding with Google Search", consultados em 04/11/2026:

- O resultado só é exibido à pessoa que fez a pergunta, junto das sugestões de pesquisa.
- O texto e as sugestões não são alterados nem intercalados com outro conteúdo.
- Não há página intermediária, rastreamento de clique ou monitoramento dos links.
- Guardar o texto é permitido para mostrar à pessoa o próprio histórico, por até dois anos.
  A retenção de 90 dias está dentro desse limite.
- Com grounding, o Google guarda prompt e resposta por 30 dias, inclusive no uso gratuito.

## Critérios de aceite

- [ ] **AC01 — Busca em pergunta de preço:** uma pergunta sobre preço ou oferta atual gera uma resposta fundamentada na web, com a lista de fontes (título e link) devolvida pelo provedor.
- [ ] **AC02 — Rótulo e data:** a resposta com busca exibe "não verificado" e o instante da consulta (UTC no contrato, fuso do usuário na interface). Respostas sem busca não mostram esse bloco.
- [ ] **AC03 — Sem evidência:** quando a busca não traz preço confiável, o chat diz que não encontrou, não inventa valor e não elege vencedor (instrução de sistema e teste na fronteira simulada).
- [ ] **AC04 — Busca indisponível:** se a chamada com busca falhar (sem cota, erro HTTP, timeout ou grounding inválido), o chat tenta uma vez sem busca. A resposta avisa que a pesquisa na web está indisponível, sem custo extra. Uma resposta com sinal de busca e sem fonte `https` válida conta como grounding inválido. Se a nova tentativa também falhar, valem os erros existentes.
- [ ] **AC05 — Sem cobrança:** não há billing nem fallback pago. A busca só funciona com `AI_ENABLED=true` e `AI_WEB_SEARCH_ENABLED=true` explícitos, e nenhum segredo vai para o frontend.
- [ ] **AC06 — Limites existentes:** cotas por usuário e globais, idempotência por `request_id`, retenção de 90 dias e limites de tamanho continuam valendo. Fontes, sugestões e data são salvas com a mensagem do assistente e expiram ou são excluídas junto com a conversa.
- [ ] **AC07 — Segurança:** o conteúdo da web é tratado como dado. Os links aceitos são `https` e abrem com `rel="noopener noreferrer"`, sem rastreamento. O HTML de sugestões roda isolado (iframe com sandbox, sem scripts) e tem limite de tamanho. O backend não faz requisições às URLs devolvidas.
- [ ] **AC08 — Aviso de privacidade:** antes do envio, a interface informa que a pergunta pode ser pesquisada pelo Google e guardada pelo fornecedor por 30 dias, além do aviso atual.
- [ ] **AC09 — Interface:** fontes e sugestões aparecem na mensagem com navegação por teclado, nome acessível e foco visível, sem overflow em 320/390/768/1280/1440 px.
- [ ] **AC10 — Modelo:** chat e análise de comparação usam `gemini-2.5-flash-lite`. A análise continua sem busca.
- [ ] **AC11 — Entrega:** lint, testes e build verdes com contagem positiva. Há testes de sucesso e de erro principal (AC03/AC04) na fronteira Gemini simulada. A documentação (`product-context.md` e guias dos módulos) está sincronizada.

## Fora de escopo

Scraping, leitura automática de páginas, busca na análise de comparação, comparação
automática de lojas, transformar resultados em monitoramento automático, plano pago ou
billing, novos marketplaces e alertas baseados em preços da web.

## Suposições e limites

- Esta spec reverte parcialmente a exclusão de "pesquisa web autônoma" e a escolha de modelo
  da 0034 e de `docs/product-context.md`.
- Não há prova do free tier na conta operadora: a validação é local, com o Gemini simulado.
  Configurar e chamar a conta real é pendência explícita.
- O modelo decide quando pesquisar. Uma resposta sem busca é válida.
- Grounding não garante que o preço esteja certo, daí o rótulo "não verificado".
