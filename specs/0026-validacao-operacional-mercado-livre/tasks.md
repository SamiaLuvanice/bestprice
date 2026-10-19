# Tarefas — 0026

- [x] Inspecionar OAuth, cliente MLB, gate de ativação e evidências prévias da spec 0013.
- [x] Definir critérios e limites da validação real em `spec.md` e `plan.md`.
- [x] Escrever testes de CLI para confirmação explícita, flag, IDs, cenários, rotação e saída segura; Red observado antes da implementação.
- [x] Implementar a sonda de leitura real usando as dependências existentes e sem alterar o flag de ativação.
- [x] Executar testes e gates disponíveis; registrar comandos e limitações em `verification.md`. Validação real permanece pendente por falta de credenciais/IDs.
- [x] Preparar procedimento e documentação de execução; conferir `AGENTS.md`, `CLAUDE.md` e `docs/`.
- [x] Revisar o diff contra `architecture.md`, segurança e critérios da spec; aceite operacional continua pendente.
- [x] Executar o agente `doc-sync-onboarding` após as mudanças na CLI; atualizou README e guia backend para explicar estados agregados, ações manuais e precedência das falhas. Reconfirmou `AGENTS.md`, `CLAUDE.md`, índice de docs e os demais guias/configuração sem necessidade de ajuste.
- [x] Publicar a branch e abrir a PR [#134](https://github.com/SamiaLuvanice/bestprice/pull/134) em rascunho para `develop`; hooks passaram e o corpo registra critérios ainda pendentes.
- [ ] Concluir a validação operacional autorizada, atualizar evidências/PR e só então tirar de rascunho; AC01–AC04 dependem de credenciais OAuth e IDs de anúncios permitidos.
- [x] Fixar o contrato HTTPS do callback OAuth no plano antes de alterar o backend ou a configuração Stage.
- [x] Escrever testes de estado inválido/expirado, URL oficial de autorização, troca de código, persistência cifrada e remoção de query sensível dos logs; Red observado antes de criar `oauth_routes.py`.
- [x] Implementar o gerador local da URL de autorização e o callback Stage protegido por `state`, mantendo a integração desligada.
- [x] Atualizar variáveis de ambiente e documentação de operação para o callback Stage. O app foi criado no DevCenter; redirect, fluxos OAuth e permissões persistidos foram conferidos após a verificação da conta.
- [x] Revisar arquitetura/segurança e executar gates locais; a revisão independente não encontrou bloqueador.
- [x] Executar o agente `doc-sync-onboarding` após as mudanças OAuth; conferiu README, guias backend/infraestrutura, arquitetura, progresso, configuração Compose/Render, `AGENTS.md`, `CLAUDE.md` e índice de docs. Repetido após a aceitação case-insensitive de `token_type` e a revisão de escopos; `docs/PROGRESS.md` e `verification.md` registram as alterações e evidências, sem outros ajustes necessários.
- [ ] Implantar o callback via fluxo de promoção Stage, configurar as credenciais no ambiente e executar a autorização real e a sonda com IDs permitidos; AC01–AC04 permanecem pendentes até haver evidência operacional.
