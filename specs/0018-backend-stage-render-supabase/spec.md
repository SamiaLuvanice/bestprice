---
numero: 0018
titulo: Aplicação de stage no Render, Supabase e Cloudflare Pages
tipo: feature
prioridade: P1
status: implementada
toca: [backend, frontend, infraestrutura, docs]
depende_de: [0013]
---

# 0018 — Aplicação de stage no Render, Supabase e Cloudflare Pages

## Problema

A branch `stage` representa uma candidata de release, mas não há banco, backend ou
frontend de stage nos provedores. Quem valida a release não consegue acessar a
aplicação completa fora do ambiente local.

## Comportamento esperado

Uma promoção aprovada para `stage` publica a interface em Cloudflare Pages e a API
em um serviço web gratuito do Render. A API usa exclusivamente um projeto
PostgreSQL de stage no Supabase. A interface encaminha chamadas `/api` à API pela
mesma origem para manter a sessão por cookie HttpOnly e Secure. A implantação da
API aplica as migrations antes de aceitar tráfego e expõe endereços HTTPS estáveis.
O health check da API só passa quando o banco responde.

Todos os serviços e recursos permanecem nos planos gratuitos, sem add-ons pagos,
upgrade automático ou cobrança por excedentes. Ao atingir uma cota gratuita, o
serviço poderá limitar, suspender ou ficar indisponível até a cota ser renovada;
não deverá migrar para um recurso cobrado.

O ambiente de stage é isolado dos dados e segredos de outros ambientes. Falhas de
configuração, banco ou migration impedem que a nova versão seja considerada pronta.

## Critérios de aceite

- [x] O serviço web gratuito do Render acompanha a branch `stage` e só publica uma
  revisão depois que os checks exigidos dessa revisão passam.
- [x] O projeto Cloudflare Pages usa `frontend/`, compila a aplicação e publica a
  branch `stage` no ambiente de produção do projeto Pages.
- [x] Render, Supabase e Cloudflare estão configurados somente nos planos gratuitos,
  sem add-ons, compute pago, recurso premium ou upgrade automático.
- [x] Os limites de gasto estão em zero ou não há forma de pagamento habilitada para
  excedentes; esgotar uma cota pode interromper o serviço, sem gerar cobrança.
- [x] Chamadas `/api/*` da interface chegam à API de stage por proxy da mesma
  origem, sem exigir CORS aberto nem expor credenciais de banco na SPA.
- [x] O backend de stage usa um projeto PostgreSQL próprio no Supabase, com conexão
  cifrada; nenhuma credencial aparece no repositório ou nos logs de validação.
- [x] Uma implantação limpa aplica todas as migrations e responde `200` em
  `GET /api/health`, com `status` e `database` iguais a `ok`.
- [x] Sem acesso ao banco, `GET /api/health` responde `503` com o contrato seguro, e
  o Render não considera a instância saudável.
- [x] O cookie de sessão emitido pelo backend de stage tem os atributos `Secure` e
  `HttpOnly`.
- [x] Uma promoção posterior para `stage` atualiza o serviço sem alterar `develop`
  ou `main`; a revisão implantada e o resultado do health check ficam registrados.
- [x] O procedimento de implantação e reversão, as variáveis necessárias e os
  limites do plano gratuito estão documentados e foram conferidos no ambiente real.
  A ação de rollback Render reimplantou um deploy anterior do mesmo commit;
  reversão entre versões e rollback Pages não foram testados nesta spec.

## Fora de escopo

- Hospedar worker periódico ou produção nesta entrega.
- Habilitar a integração real do Mercado Livre sem autorização e validação externa.
- Garantir disponibilidade contínua no plano gratuito.
- Usar qualquer recurso pago, add-on, upgrade ou excedente faturável.

## Perguntas em aberto

- A criação dos projetos Supabase, Render e Cloudflare Pages começa do zero, conforme
  informado pelo responsável; as regiões devem ser escolhidas na criação.
- A Issue GitHub desta entrega é [#60](https://github.com/SamiaLuvanice/bestprice/issues/60).
- O worker periódico fica fora desta implantação; a automação de consultas depende
  de uma hospedagem de worker definida em outra entrega.
