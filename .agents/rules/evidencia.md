---
description: Evidência antes de hipótese — leia o erro registrado antes de explicar uma falha.
alwaysApply: true
---

# Evidência antes de hipótese

Leia a saída completa do comando que falhou. Para backend, consulte pytest, logs do uvicorn e resposta de curl -i. Para banco, consulte logs do PostgreSQL e psql. Para frontend, consulte npm run build, Console e Network do navegador. Separe observação de inferência.

Teste verde só vale quando executou (contagem maior que zero); testes novos de comportamento devem falhar pelo motivo esperado antes da correção. Registre comando, resultado e limites em specs/<id>/verification.md.
