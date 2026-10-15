---
numero: 0022
titulo: Conexão resiliente ao banco
tipo: melhoria
prioridade: P2
status: pronta
toca: [backend]
depende_de: []
---

# 0022 — Conexão resiliente ao banco

## Problema

A API mantém um conjunto de conexões de banco reaproveitadas entre requisições. Hoje esse conjunto só revalida uma conexão no momento em que ela é retirada; não há limite de idade para a conexão nem prazo para obtê-la. Em stage a API conversa com o banco por um pooler compartilhado, e o projeto pode pausar ou reiniciar o banco sem aviso. Nesse cenário, conexões guardadas podem ficar obsoletas e uma tentativa de conectar a um banco inacessível pode ficar esperando por tempo indeterminado, segurando a requisição e o processo.

Quem é afetado: qualquer pessoa que use a API de stage ou execute a stack local. O sintoma é uma requisição que demora ou falha de forma intermitente após o banco ser reiniciado/pausado, mesmo com o processo da API de pé, sem relação com os dados.

## Comportamento esperado

O conjunto de conexões deve se manter utilizável ao longo do tempo sem intervenção:

- Enquanto houver conexões íntegras disponíveis, elas são reaproveitadas em vez de abrir conexões novas, mantendo limitado o número de conexões abertas no banco.
- Uma conexão que atingiu um limite de idade — contado desde o momento em que foi aberta — é descartada e substituída por uma nova no próximo uso, em vez de ser reutilizada indefinidamente.
- Obter uma conexão é limitado por prazo, em dois momentos distintos: (a) a espera por uma conexão do conjunto quando todas estão em uso e (b) a abertura de uma conexão nova quando o banco não responde. Em ambos, a falha ocorre dentro do prazo, em vez de esperar indefinidamente.
- Quando a obtenção de conexão falha por estourar o prazo, a requisição termina de forma rápida e segura, com o formato de erro já usado pela API quando o banco está indisponível, sem expor detalhes internos.
- O comportamento observável de hoje é preservado: com o banco disponível, o health responde 200 `{"status":"ok","database":"ok"}`; sem banco, responde 503 com o contrato seguro; as consultas de domínio continuam funcionando.

O health usa uma conexão direta, com prazo próprio, e **não** faz parte do conjunto: os limites de idade e de prazo desta spec não se aplicam a ele.

## Critérios de aceite

- [ ] Dado o conjunto de conexões em uso, quando uma conexão atinge o limite de idade desde a sua abertura, então ela não é reutilizada: o próximo uso abre uma conexão nova no lugar dela.
- [ ] Dada carga repetida dentro do limite do conjunto, quando conexões íntegras estão disponíveis, então nenhuma conexão nova é aberta e o total de conexões abertas no banco não cresce além do limite do conjunto.
- [ ] Dado que todas as conexões do conjunto estão em uso, quando uma consulta espera por uma conexão, então a espera é limitada por um prazo, sem espera indefinida.
- [ ] Dado o banco inacessível, quando é preciso abrir uma conexão nova, então a abertura falha dentro de um prazo, sem espera indefinida.
- [ ] Dado que a obtenção de conexão falha por estourar o prazo, quando a consulta não obtém conexão, então a requisição termina rapidamente com o formato de erro seguro já usado pela API, sem expor detalhes internos.
- [ ] Dado o banco disponível, quando a aplicação opera normalmente, então `GET /api/health` responde 200 com `status` e `database` iguais a `ok`, e sem banco responde 503 com o contrato seguro já definido.
- [ ] Dado o esquema atual, quando a mudança é aplicada, então nenhuma migration é necessária e o head do esquema permanece o mesmo.

## Fora de escopo

- Mudança de esquema ou novas migrations.
- Alteração de rotas, contrato HTTP ou telas.
- Desacoplar a aplicação de migrations no boot (Grupo C) e promoção a `stage`.
- Trocar a estratégia de pool por conexões descartáveis a cada uso (só faz sentido em modo de pooler transacional/servidor efêmero, que não é o caso).
- Aplicar prazo a consultas de longa duração do domínio (pode interromper operações legítimas; fica para outra spec se houver necessidade).

## Perguntas em aberto

- Limite de idade da conexão: assumido **300 s**, contado desde a abertura da conexão. Escolha feita por dar folga sobre o comportamento de pausa/reinício do pooler sem gerar churn relevante no tráfego atual.
- Espera por uma conexão do conjunto: valor assumido no `plan.md`. A abertura de conexão nova: assumido **5 s** (acima dos 3 s usados pelo health, deixando margem para a primeira conexão com TLS).
- Política de reuso: preferir a conexão usada mais recentemente, para que conexões antigas ociosas expirem pelo limite de idade em vez de serem mantidas. Demais valores no `plan.md`.
- Tamanho do conjunto de conexões e excedente: **mantidos os padrões**, por ser instância única e tráfego baixo.
- Os valores finais e a justificativa ficam no `plan.md`; os critérios acima são demonstrados por teste automatizado e pela suíte de integração existente, com valores de teste curtos e independentes dos de produção.
