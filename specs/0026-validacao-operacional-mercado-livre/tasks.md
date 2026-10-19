# Tarefas — 0026

- [x] Inspecionar OAuth, cliente MLB, gate de ativação e evidências prévias da spec 0013.
- [x] Definir critérios e limites da validação real em `spec.md` e `plan.md`.
- [x] Escrever testes de CLI para confirmação explícita, flag, IDs, cenários, rotação e saída segura; Red observado antes da implementação.
- [x] Implementar a sonda de leitura real usando as dependências existentes e sem alterar o flag de ativação.
- [x] Executar testes e gates disponíveis; registrar comandos e limitações em `verification.md`. Validação real permanece pendente por falta de credenciais/IDs.
- [x] Preparar procedimento e documentação de execução; conferir `AGENTS.md`, `CLAUDE.md` e `docs/`.
- [x] Revisar o diff contra `architecture.md`, segurança e critérios da spec; aceite operacional continua pendente.
- [x] Executar o agente `doc-sync-onboarding` por último; confirmou coerência de README, guias, arquitetura, progresso, `.env.example`, Compose, `AGENTS.md`, `CLAUDE.md` e índice de docs, sem ajustes adicionais.
- [ ] Handoff e PR para `develop` após concluir a validação operacional; a implementação local permanece sem commit/PR e aguarda credenciais OAuth e IDs de anúncios autorizados para demonstrar AC01–AC04.
