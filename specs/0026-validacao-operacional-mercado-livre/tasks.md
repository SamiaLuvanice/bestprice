# Tarefas — 0026

- [x] Inspecionar OAuth, cliente MLB, gate de ativação e evidências prévias da spec 0013.
- [x] Definir critérios e limites da validação real em `spec.md` e `plan.md`.
- [x] Escrever testes de CLI para confirmação explícita, flag, IDs, cenários, rotação e saída segura; Red observado antes da implementação.
- [x] Implementar a sonda de leitura real usando as dependências existentes e sem alterar o flag de ativação.
- [x] Executar testes e gates disponíveis; registrar comandos e limitações em `verification.md`. Validação real permanece pendente por falta de credenciais/IDs.
- [x] Preparar procedimento e documentação de execução; conferir `AGENTS.md`, `CLAUDE.md` e `docs/`.
- [x] Revisar o diff contra `architecture.md`, segurança e critérios da spec; aceite operacional continua pendente.
- [x] Executar o agente `doc-sync-onboarding` após as mudanças na CLI; atualizou README e guia backend para explicar estados agregados, ações manuais e precedência das falhas. Reconfirmou `AGENTS.md`, `CLAUDE.md`, índice de docs e os demais guias/configuração sem necessidade de ajuste.
- [x] Abrir a PR inicial [#134](https://github.com/SamiaLuvanice/bestprice/pull/134) em rascunho; a implementação diagnóstica seguiu pela PR [#138](https://github.com/SamiaLuvanice/bestprice/pull/138), integrada em `develop` (`49fd8da`), e foi promovida pela PR [#139](https://github.com/SamiaLuvanice/bestprice/pull/139), integrada em `stage` (`de2861b`).
- [ ] Diagnosticar e concluir a autorização OAuth real após `invalid_state`, persistir uma credencial operadora e executar a sonda e os exercícios restantes com IDs permitidos; AC01–AC02 pendentes e AC03–AC04 parciais.
- [x] Fixar o contrato HTTPS do callback OAuth no plano antes de alterar o backend ou a configuração Stage.
- [x] Escrever testes de estado inválido/expirado, URL oficial de autorização, troca de código, persistência cifrada e remoção de query sensível dos logs; Red observado antes de criar `oauth_routes.py`.
- [x] Implementar o gerador local da URL de autorização e o callback Stage protegido por `state`, mantendo a integração desligada.
- [x] Atualizar variáveis de ambiente e documentação de operação para o callback Stage. O app foi criado no DevCenter; redirect, fluxos OAuth e permissões persistidos foram conferidos após a verificação da conta.
- [x] Revisar arquitetura/segurança e executar gates locais; a revisão independente não encontrou bloqueador.
- [x] Executar o agente `doc-sync-onboarding` após as mudanças OAuth; conferiu README, guias backend/infraestrutura, arquitetura, progresso, configuração Compose/Render, `AGENTS.md`, `CLAUDE.md` e índice de docs. Repetido após a categorização segura ser promovida e a terceira tentativa resultar em `invalid_state`; progresso, operação e gates foram alinhados às evidências.
- [ ] Resolver a causa de `invalid_state` e demonstrar autorização/persistência real; depois executar a sonda e os exercícios restantes com IDs permitidos. AC01–AC02 pendentes; AC03–AC04 parciais até haver evidência operacional suficiente.
