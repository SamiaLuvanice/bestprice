---
description: Evidência antes de hipótese — leia o erro registrado antes de explicar uma falha.
alwaysApply: true
---

# Evidência antes de hipótese

Leia a saída completa do comando que falhou e o registro da camada envolvida (teste, log do serviço, resposta HTTP, log do banco, Console/Network do navegador). As fontes concretas de cada camada da stack ficam nas regras do perfil ativo. Separe observação de inferência.

Teste verde só vale quando executou (contagem maior que zero); testes novos de comportamento devem falhar pelo motivo esperado antes da correção. Registre comando, resultado e limites em specs/<id>/verification.md.
