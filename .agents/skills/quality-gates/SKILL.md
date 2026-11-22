---
name: quality-gates
description: Rodar e interpretar os portões de qualidade declarados em harness.yaml (lint, testes, build e automações).
---

# Portões de qualidade

Os comandos vivem em um só lugar: a seção `quality` de `harness.yaml`. Na worktree, rode:

- `node .agents/scripts/gates.mjs` — todos os portões, na ordem declarada (instala dependências primeiro);
- `--skip-install` pula instalação já feita; `--scope backend,frontend,automation` e `--only lint,test,build` filtram; `--list` mostra o plano sem executar.

Cada chave `[<escopo>_]<etapa>_command` roda no diretório `profile.<escopo>_dir`. Para mudar um portão, edite `harness.yaml`, não as instruções.

Checagens do perfil que ainda não são portões: complexidade do backend com `python .agents/skills/cyclomatic-complexity/scripts/complexity_report.py` (falha em rank >= D; use `--baseline .complexity-baseline.json`), actionlint nos workflows quando instalado e integração com serviços reais conforme `testing.md`.

Confirme contagem de testes maior que zero. Registre comando e resultado em verification.md; não marque skip ou teste não executado como verde. No GitHub, o check agregador CI deve passar para a PR. Se ferramenta ou serviço não estiver disponível, reporte pendência concreta.
