---
description: Complexidade ciclomática controlada no backend Python.
---

# Complexidade ciclomática

Funções de negócio em `backend/app` devem permanecer simples: alvo rank A/B pela escala da skill `cyclomatic-complexity` (CC até 10). Não introduza bloco novo com rank D ou pior (CC >= 21); ao tocar um bloco rank C+, reduza o rank ou justifique com comentário curto e testes de caso-limite. Migrations do Alembic, parsers e blocos declarativos são isentos por natureza. Antes de fechar alteração de backend, rode `python .agents/skills/cyclomatic-complexity/scripts/complexity_report.py backend/app --changed origin/develop` e trate qualquer violação nova; o agente arch-reviewer confere o relatório na revisão e a skill `quality-gates` o cobra nos gates.
