# PO intake — referência

## Numeração

Sequencial, quatro dígitos, imutável, nunca reaproveitada.

```
specs/0001-health/    specs/0002-auth/    specs/0003-users/    specs/0004-…
```

O número não carrega significado de área. Categoria, prioridade e lados tocados são
campos no cabeçalho da spec, não no nome da pasta — assim uma spec pode mudar de
prioridade sem mudar de endereço.

## Slug

3 a 6 palavras, kebab-case, ASCII, sem acento. Descreve o **resultado**, não a tarefa.

```
0004-orders-checkout            ✓
0005-search-por-proximidade     ✓
0006-ajustes                    ✗  não diz nada
0007-corrigir-bug-do-joao       ✗  nome de pessoa, e "bug" não é resultado
```

## Prioridade

| Nível | Significado |
|---|---|
| P0 | bloqueia produção — regressão, indisponibilidade, perda de dado |
| P1 | no caminho crítico da entrega atual |
| P2 | melhoria relevante, sem bloquear ninguém |
| P3 | vale se sobrar tempo |

P0 fura a fila; qualquer outra coisa entra na ordem da lista de specs.

## Agente sugerido

| A mudança | Agente |
|---|---|
| só backend — endpoint FastAPI, regra ou persistência PostgreSQL, sem tela | `backend` |
| só frontend — tela, componente, sem rota nova | `frontend` |
| toca contrato, ou os dois lados | `fullstack` |
| só testes e evidência | `qa` |

Mudou o contrato da API? É `fullstack` mesmo que pareça só um campo: contrato primeiro,
depois backend e frontend.

## Tipo

`feature` — comportamento novo · `melhoria` — comportamento existente fica melhor ·
`bug` — comportamento existente está errado.

Bug tem um campo a mais e obrigatório: **como reproduzir**, passo a passo, do estado
inicial ao sintoma. Sem isso não vira spec — volte e pergunte.

## Cabeçalho da spec

```yaml
numero: 0004
titulo: …
tipo: feature | melhoria | bug
prioridade: P0 | P1 | P2 | P3
status: rascunho | pronta | implementada | descartada
toca: [backend, frontend, contrato]
depende_de: [0002]
```
