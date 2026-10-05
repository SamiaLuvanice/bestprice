# Plano — 0003 Aproveitamento seletivo do archive

## Contrato

Sem alteração na API da aplicação. O comando auxiliar de Docker aceita os argumentos usuais
do `docker compose` e os encaminha ao mesmo arquivo Compose. Em checkout principal usa as
portas padrão 8080/4200; em worktree, seleciona um nome de projeto e um par de portas
determinísticos derivados da branch e do caminho da worktree. Variáveis `BACKEND_PORT` e `FRONTEND_PORT` definidas
pelo usuário têm precedência.

## Arquivos e camadas

- `.agents/skills/java-datetime/SKILL.md` (novo): casos de fuso e horário civil em Java,
  alinhados a `datetime-pipeline.md`.
- `.agents/skills/angular-feature/SKILL.md` (novo): guia de feature Angular adaptado à
  arquitetura documentada em `frontend.md`.
- `.agents/rules/datetime-pipeline.md` e `.agents/rules/frontend.md`: apontam para as skills
  específicas sem duplicar seus procedimentos.
- `.agents/AGENTS.md` e `.agents/modules.yaml`: registram as skills como parte do perfil ativo.
- `docker-compose.yml`: permite sobrescrever as portas publicadas sem mudar as portas internas.
- `scripts/compose-worktree.ps1` (novo): deriva projeto/portas por branch de worktree e chama
  Docker Compose preservando o ambiente do processo chamador.
- `README.md`: documenta uso no checkout principal e em worktrees.
- `.agents/archive/README.md`: registra as adaptações e as partes mantidas em arquivo.
- `specs/0003-aproveitamento-seletivo-do-archive/`: spec, plano, tarefas e evidência.

## Decisões

| Decisão | Alternativa descartada | Motivo |
|---|---|---|
| Guias de projeto pequenos complementam as skills oficiais | Reativar diretamente as skills antigas | As antigas assumem diretórios, bibliotecas ou camadas ausentes |
| Worktree helper em PowerShell com portas determinísticas e override explícito | Trocar o comando padrão do Compose ou alocar portas aleatórias | Mantém fluxo atual e permite repetir `up`/`down` com o mesmo endereço |
| Preservar os arquivos de origem no archive | Mover os originais para a configuração ativa | Mantém rastreabilidade e evita carregar dependências antigas |

## Riscos

- O hash pode colidir ou as portas podem já estar ocupadas; Docker Compose falha a publicação,
  e o helper aponta para `BACKEND_PORT`/`FRONTEND_PORT` como override.
- O Docker Compose deve continuar expandindo as variáveis de porta tanto em `up` quanto em
  `down`; o helper mantém as mesmas variáveis no par de comandos.
- As skills devem evitar prescrever APIs Angular que não existem na versão instalada.
