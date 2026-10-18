---
name: cyclomatic-complexity
description: Mede e interpreta complexidade ciclomática e manutenibilidade com radon. Use ao auditar qualidade do backend Python, decidir o que refatorar, revisar um diff antes de commit/PR, ou quando o usuário pedir "complexidade", "radon", "código complexo demais", "refatorar função grande".
---

# Complexidade ciclomática com radon

Mede quantos caminhos independentes existem em cada função/método. Alta
complexidade significa mais casos de teste necessários, mais chance de bug e
codigo mais difícil de mudar. Esta skill roda o [radon](https://radon.readthedocs.io),
converte a saida em relatorio priorizado e oferece um *gate* de revisao.

## Quando usar

- Auditoria de qualidade ou levantamento de divida tecnica.
- Antes de refatorar: descobrir **o que** refatorar primeiro.
- Revisao de diff/PR: garantir que a mudanca nao piorou a complexidade.
- Depois de implementar uma feature grande (rotas, worker de monitoramento, servicos).

## Instalacao

O radon e dev-dependencia do backend (`backend/pyproject.toml`, extra `dev`) e ja
esta no `backend/.venv` apos `uv sync --locked --extra dev`. Em ambiente novo:

```bash
cd backend && uv sync --locked --extra dev   # instala radon junto
uvx radon cc app                             # execucao efemera, sem instalar
```

O script localiza o radon sozinho, nesta ordem: `$RADON` → `backend/.venv`
(`Scripts/` no Windows, `bin/` no Unix) → `radon` no PATH → `uvx radon`. Se nada
existir, falha com as instrucoes acima.

## Uso

Sempre a partir da raiz do projeto:

```powershell
# Relatorio completo do codigo de producao (backend/app)
python .agents/skills/cyclomatic-complexity/scripts/complexity_report.py

# Um submodulo especifico
python .agents/skills/cyclomatic-complexity/scripts/complexity_report.py backend/app/products

# So o que mudou em relacao a branch base — ideal para revisao de PR
python .agents/skills/cyclomatic-complexity/scripts/complexity_report.py --changed origin/develop

# Listar tudo, inclusive rank B, e salvar em Markdown
python .agents/skills/cyclomatic-complexity/scripts/complexity_report.py --min-rank B --top 0 --markdown docs/complexity-report.md
```

No Unix os wrappers `.sh` fazem a mesma coisa:
`.agents/skills/cyclomatic-complexity/scripts/check_complexity.sh [caminhos...]`;
no Windows, `check_complexity.ps1`.

### Flags principais

| Flag | Efeito |
| --- | --- |
| `--min-rank {A..F}` | Rank minimo listado na tabela (padrao `C`). |
| `--fail-on {A..F}` | Rank que faz o comando sair com codigo 1 (padrao `D`, ou seja CC >= 21). |
| `--changed REF` | Analisa so arquivos `.py` alterados vs. `REF` (via `git diff`). |
| `--baseline FILE` | So falha em blocos **novos** ou que **pioraram** desde o baseline. |
| `--update-baseline` | Grava o estado atual como baseline e sai com 0. |
| `--mi-threshold N` | Lista arquivos com indice de manutenibilidade abaixo de `N` (padrao 20). |
| `--top N` | Maximo de linhas na tabela; `0` mostra todas (padrao 25). |
| `--markdown F` / `--json F` | Grava o relatorio / os dados brutos. |
| `--ignore a,b` | Diretorios ignorados (padrao ja exclui `.venv`, `alembic`, `node_modules`, `__pycache__`). |

Codigos de saida: `0` limpo · `1` limite estourado · `2` erro de execucao.

## Escala de ranks

| Rank | CC | Leitura | Acao |
| --- | --- | --- | --- |
| A | 1–5 | Simples | Nenhuma. |
| B | 6–10 | Bem estruturado | Nenhuma. |
| C | 11–20 | Levemente complexo | Observar; refatorar se for tocar no codigo. |
| D | 21–30 | Alto risco | Refatorar — muitos caminhos para testar. |
| E | 31–40 | Alarmante | Refatorar com prioridade. |
| F | 41+ | Erro de design | Quebrar em unidades menores ja. |

O **indice de manutenibilidade (MI)** e uma metrica separada, por arquivo, de 0 a
100 (combina volume de Halstead, CC e linhas). MI < 20 = arquivo dificil de manter,
geralmente por tamanho + complexidade acumulados.

## Como interpretar e agir

1. **Priorize por risco, nao pelo numero.** Um CC 25 em `products/service.py`
   (estoque, preco, concorrencia) vale mais atencao que CC 25 num script utilitario.
2. **Cruze com cobertura de teste.** CC alto informa quantos casos de teste o
   bloco exige; se o CC e 22 e existem 3 testes, o buraco esta ai.
3. **Nao persiga o numero.** Extrair 6 helpers de uso unico so para baixar o rank
   dispersa a logica e piora a leitura. A meta e codigo mais claro; o rank e o sintoma.
4. **Ignore falsos positivos conhecidos**: migrations do Alembic, dispatchers com
   longos `if/elif` sobre tipos de evento, e blocos declarativos de configuracao.

Padroes de refatoracao para cada causa (ninhos de `if`, dispatch, validacoes
encadeadas, `try/except` extensos, rotas FastAPI gordas) estao em
[references/refactoring-patterns.md](references/refactoring-patterns.md).

## Usando baseline num codigo legado

Rodar o gate com `--fail-on D` num repositorio existente costuma acusar dezenas de
blocos antigos. O baseline congela esse passivo e faz o gate cobrar so o que for
novo:

```powershell
# 1. congela o estado atual
python .agents/skills/cyclomatic-complexity/scripts/complexity_report.py `
    --baseline .complexity-baseline.json --update-baseline

# 2. da em diante, so falha em bloco novo ou que piorou
python .agents/skills/cyclomatic-complexity/scripts/complexity_report.py `
    --baseline .complexity-baseline.json
```

Commite o `.complexity-baseline.json`. Ao refatorar e reduzir a complexidade,
rode `--update-baseline` de novo para travar a melhoria.

## Comandos radon crus

Quando precisar de algo que o wrapper nao cobre:

```bash
cd backend
uv run radon cc app -s -a -nc          # complexidade, ordenada, so rank C+, com media
uv run radon mi app -s                 # indice de manutenibilidade por arquivo
uv run radon raw app -s                # LOC, LLOC, comentarios
uv run radon hal app                   # metricas de Halstead (esforco, bugs estimados)
uv run radon cc app -j                 # JSON (formato consumido pelo script)
```

## Depois de refatorar

Rodar o relatorio sozinho nao altera codigo e nao dispara a regra de
sincronizacao; refatoracoes resultantes, sim — execute o agente
`.agents/agents/doc-sync-onboarding.md` como ultima etapa. A
skill `quality-gates` e o comando `/verify` cobram este relatorio nos gates de
backend.
