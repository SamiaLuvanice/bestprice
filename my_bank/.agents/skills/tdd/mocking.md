# Uso de mocks

Use mocks ou fakes quando isolarem uma fronteira externa ou não determinística, como uma API
externa, relógio, gerador aleatório ou serviço de e-mail. Para persistência, prefira o nível de
teste descrito em `.agents/rules/testing.md` — por exemplo, H2/`@DataJpaTest` para queries ou
uma fatia Spring para o contrato HTTP.

Evite mockar cada colaborador interno da aplicação. Testes que só verificam que um método foi
chamado tendem a quebrar em refactors que preservam o comportamento.

Passe dependências externas por injeção ou use adapters do projeto para manter os limites
explícitos. No Angular, use `HttpTestingController` para observar a fronteira HTTP do service;
não substitua o contrato por mocks internos do componente.
