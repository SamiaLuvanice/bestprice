---
name: stage-to-main
description: Promover a branch de staging para produção somente após autorização explícita do projeto.
---

# Promoção para produção

Use somente quando o projeto consumidor documentar branches, plataforma, smoke
test e procedimento de rollback em sua própria configuração.

Antes de promover:

- confirme autorização explícita;
- confira o estado real do deploy, não apenas o status do pipeline;
- execute o smoke contra uma rota da versão publicada;
- registre o commit, ambiente e resultado;
- não exponha credenciais ou dados de produção.
