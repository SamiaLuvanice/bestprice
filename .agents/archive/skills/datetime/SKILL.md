---
name: datetime
description: Casos difíceis de data, hora e fuso — agendamento, janela de validade, horário de funcionamento, disponibilidade. Use ao criar ou corrigir qualquer fluxo que grave, compare ou exiba um instante, e quando um horário aparecer errado para alguém.
---

# Data, hora e fuso

A regra está em `.agents/rules/datetime-pipeline.md`: UTC aware no banco, ISO 8601 com
offset no contrato, conversão só na apresentação. Esta skill é o que fazer quando isso
não basta.

## Instante não é o mesmo que hora local

Duas coisas diferentes usam o mesmo tipo, e confundi-las é a origem de quase todo bug de
fuso:

| O que é | Exemplo | Como guardar |
|---|---|---|
| **Instante** — um ponto na linha do tempo | "criado em", "expira em", "pagou às" | `DateTime(timezone=True)` em UTC |
| **Hora local** — um horário de parede, sem dia | "abre às 09:00" | `Time` + o fuso do recurso, separados |
| **Data civil** — um dia, sem hora | "vence em 30/08" | `Date`, sem fuso nenhum |

Guardar "abre às 09:00" como instante UTC parece funcionar até o horário de verão mudar
e o local passar a abrir às 08:00.

## Três casos que aparecem sempre

### Formulário que envia um horário

O usuário digita hora local; o navegador conhece o fuso dele. Envie o instante já
resolvido, com offset — nunca o texto do campo:

```ts
const instante = new Date(valorDoCampo).toISOString();  // "2026-08-30T17:00:00.000Z"
```

### Regra que roda no fuso do recurso

Uma validade que termina "à meia-noite" termina à meia-noite **de onde o recurso está**,
não de onde o usuário está:

```python
from zoneinfo import ZoneInfo

def valido_ate(inicio: date, recurso: Recurso) -> datetime:
    tz = ZoneInfo(recurso.timezone)                 # IANA, guardado com o recurso
    fim_local = datetime.combine(inicio, time(23, 59, 59), tzinfo=tz)
    return fim_local.astimezone(UTC)
```

Todo recurso com horário próprio carrega um campo `timezone` IANA
(`America/Fortaleza`), preenchido no cadastro. Sem ele, a regra não tem como estar certa.

### Janela de disponibilidade

Compare instante com instante, sempre em UTC. Se um dos lados é hora local, converta
primeiro — e converta usando o fuso do recurso, não o do servidor.

## Horário de verão

Ele existe, muda de país para país e muda de ano para ano. Duas consequências práticas:

- Somar 24 horas **não** é o mesmo que somar um dia. Para "amanhã no mesmo horário",
  opere na data civil no fuso local e só então converta para instante.
- Uma hora local pode não existir (a madrugada que pulou) ou existir duas vezes. Se a
  regra depende disso, decida explicitamente qual delas vale e escreva o teste.

## Testes

- Grave, releia, edite e releia de novo: o instante tem que voltar igual.
- Rode a suíte com `TZ` do processo em algo diferente de UTC. Teste que só passa com o
  servidor em UTC não está testando o código, está testando a máquina.
- Para o que depende de "agora", injete o relógio; não chame `datetime.now(UTC)` dentro
  do use case.

## Onde os bugs se escondem

| Sintoma | Causa quase sempre |
|---|---|
| horário three horas atrás ou à frente | conversão dupla, ou naive tratado como local |
| certo hoje, errado em outubro | horário de verão, ou soma de 24h no lugar de um dia |
| certo para o dev, errado para o usuário | fuso do servidor entrou em alguma conta |
| um dia a menos na borda | data civil convertida para instante e de volta |
