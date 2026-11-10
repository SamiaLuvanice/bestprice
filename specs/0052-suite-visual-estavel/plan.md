# Plano — 0052

1. Reproduzir a issue na ponta de develop com as dependências do lockfile e
   Chromium do Playwright. Registrar a etapa do timeout e comparar os pixels
   divergentes com as referências versionadas.
2. Em `frontend/tests/visual/public-pages.spec.ts`, emular movimento reduzido
   e responder às consultas de sessão e cadastro. Limitar a tolerância de
   rasterização aos snapshots da landing em 320 e 390 px e ao maior diff
   observado, de 12 pixels.
3. Em `frontend/tests/visual/landing.spec.ts`, abrir a landing uma vez e
   esperar o robô atingir a opacidade final no modo de movimento reduzido.
   Redimensionar a página em etapas nomeadas e esperar as fontes antes de
   medir os quatro limites do selo em cada largura.
4. Repetir os casos afetados e rodar a suíte completa e os gates de frontend.

A mudança se restringe ao harness de teste. O contrato REST permanece o atual.
