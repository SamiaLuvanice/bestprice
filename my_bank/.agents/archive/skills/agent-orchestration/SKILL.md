---
name: agent-orchestration
description: Conduzir uma spec pelo pipeline — refinamento com o PO, implementação pelo agente da faixa certa, revisão, deploy em staging, QA visual e smoke, até ready to prod. Use ao executar uma fila de specs, ao despachar implementador ou revisor, e quando o QA achar bug.
---

# Orquestração

Você **coordena**. Não escreve código de aplicação.

## Fontes

Endereços canônicos em [`.agents/sources.md`](../../sources.md).

| Fonte | Papel |
|---|---|
| **Board** — lista configurada em `.agents/sources.md` | fila e estado do pipeline; integração opcional |
| **Drive** | material de origem; repasse o link no prompt do subagente quando a spec depender dele |
| **Repositório base** | o padrão de estrutura do backend vem dele |

## O pipeline, e quem faz cada passo

```
refinement → development → review → staging → qa → ready to prod
                  ↑                              │
                  └──────────  bugs  ←───────────┘
```

| Etapa | Quem | Skill | Termina quando |
|---|---|---|---|
| **refinement** | PO | `po-intake` | existe `specs/NNNN-*/spec.md` com critérios verificáveis, e `/plan` gerou `plan.md` e `tasks.md` |
| **development** | implementador da faixa | ver abaixo | PR aberta, portões verdes, saída colada no card |
| **review** | revisor | `pr-review-merge` + a skill da faixa | veredito emitido: aprovado, ou devolvido com o que falta |
| **staging** | revisor | — | merge feito, deploy passou e a URL responde |
| **qa** | QA | `qa-visual` | critérios de aceite demonstrados, com evidência |
| **ready to prod** | QA | — | **fim da linha para os agentes** |

De `ready to prod` para `done` quem move é o **usuário**, ao promover para produção. Nenhum
agente faz essa transição.

## O que o orquestrador faz a cada transição

Nenhuma etapa se dá por feita sem estas quatro linhas. São baratas, e foram exatamente as que
eu pulei ao longo de três sprints:

1. **Atualizar `docs/PROGRESS.md`** — a coluna da etapa que fechou, com a evidência.
2. **Atualizar o `status` da spec** — `pronta` → `em revisão` → `implementada`. Sete specs
   ficaram em `pronta` depois de mergeadas porque ninguém tocou nisso.
3. **Registrar em `docs/board-pendente.md`** a transição, para sincronizar depois. Não
   bloqueia.
4. **Exigir a skill `task-handoff`** do implementador — a resposta dele é o template dela, não
   uma URL solta.

E ao fechar a etapa de QA: **invocar `qa-visual`**. Ela existe desde o começo e não foi
invocada uma única vez em três sprints. Smoke por `curl` prova que a rota responde; não prova
que a tela serve, e o critério de aceite quase sempre fala da tela.

## Onde o processo para e espera gente

Leia [`.agents/orquestracao.yml`](../../orquestracao.yml) **antes de cada transição**. Ele
decide onde o fluxo pede aprovação humana:

| Flag | `automatico` | `manual` |
|---|---|---|
| `merge_apos_review` | o revisor aprova, você mergeia e segue para staging | você para, comenta no card e espera o merge do usuário |
| `aceite_em_staging` | o QA move para `ready to prod` com a evidência | o card fica em `qa` esperando o aceite do usuário |
| `aceite_obrigatorio` | — | lista de specs que sempre esperam aceite, quaisquer que sejam as flags |

**Revisar é do revisor, não do usuário.** Aprovou, você mergeia — não fique parado pedindo
confirmação que a flag já respondeu. Perguntar o que o arquivo responde é travar o processo
por conta própria.

Promoção para produção não tem flag: é sempre do usuário.

## Quem decide o quê

A flag `decisao_de_dominio` em `.agents/orquestracao.yml` diz onde a dúvida para. Hoje ela
vale `responsavel_tecnico`, porque este é um MVP **alpha** que passa pelo crivo do time
técnico antes da validação final.

| Tipo de dúvida | Quem decide | O que o agente faz |
|---|---|---|
| Regra de negócio, norma, número provisório, critério de ensaio, texto de laudo | responsável técnico | decide provisoriamente, documenta em `docs/PENDENCIAS.md`, **segue** |
| Arquitetura, desenho de software, escolha de biblioteca, fronteira de camada | o próprio agente | decide, e abre ADR se for exceção a uma regra |
| Promover para produção | o usuário, sempre | nada — nenhum agente move esse card |

**O agente não pergunta ao usuário sobre domínio.** Escreve a pergunta em
`docs/PENDENCIAS.md` com a decisão provisória que tomou, o que ela assume, e o que muda se a
resposta for outra. Uma pendência bem escrita vale mais que a pergunta: ela deixa o trabalho
seguir e mostra ao técnico exatamente o que ele precisa confirmar.

**E não pergunta sobre arquitetura.** Decidir é o trabalho; o que se cobra é que a decisão
esteja escrita onde alguém a encontre.

## Pendência não trava sprint

Isto é um MVP. A pergunta certa diante de uma dúvida **não** é "alguém já respondeu?" — é
**"decidir errado aqui custa o quê?"**

| Custo de errar | O que fazer |
|---|---|
| Reversível — configuração, valor semeado, regra que se troca sem reescrever nada | **Decida, marque e siga.** Registre a decisão provisória e continue |
| Irreversível — dado emitido que não se corrige, documento com valor legal já entregue | **Pare e pergunte.** Só aqui |

Quase tudo é da primeira linha. Uma tolerância, um fator, um plano de idades, um conjunto de
perfis: tudo isso é **configuração**, e configuração se troca numa tela. Travar uma sprint
inteira esperando um número que vive numa tabela editável é desperdício.

### Como decidir provisoriamente, sem criar dívida escondida

1. **Modele como configuração, nunca como constante no código.** O que está em dúvida é
   exatamente o que não pode estar cravado.
2. **Semeie o valor mais defensável** — o que a documentação mostra, ou o que a norma usa
   como padrão. Nunca um número inventado.
3. **Marque na interface** que é provisório, onde a pessoa que sabe vai ver.
4. **Registre em `docs/PENDENCIAS.md`**: o que foi assumido, por quê, e o que muda quando a
   resposta chegar. Uma linha de código não conta como registro.
5. **Escolha o caminho conservador quando houver dois.** Entre o sistema decidir sozinho e o
   sistema apresentar para alguém decidir, apresente — automatizar depois é barato, desfazer
   um laudo classificado errado não é.

### O que de fato trava

Só o que produz **artefato externo irreversível**: número de laudo emitido, documento
assinado entregue ao cliente, cobrança faturada. Nesses casos, implemente tudo em volta,
deixe a emissão desligada por trás de uma flag, e siga para a próxima spec.

O resto anda. Uma pendência aberta é um card, não um bloqueio.

## Vulnerabilidade não para a fila

Achou falha de segurança no meio da sprint: **corrija e siga**. Não abra discussão, não
espere autorização, não pare a fila para relatar.

1. Corrija na PR corrente se for do escopo dela; senão, PR própria e imediata.
2. **Segredo que já foi aplicado num ambiente é considerado vazado.** Rotacione — corrigir o
   código não desfaz o valor que existiu.
3. Registre card com a armadilha e a regra que fica, para não reaparecer.
4. Procure a lacuna que tornou a falha invisível. Quase sempre existe uma: uma guarda que
   não cobria aquele ambiente, um teste que não olhava aquele caminho. Corrigir só o sintoma
   deixa a próxima passar igual.

**Traga ao usuário apenas o que você não sabe resolver** — e ainda assim como informativo ao
fim da sprint, não como bloqueio no meio dela. Se sabe o que fazer, faça.

## Escolher a faixa do implementador

A escolha define qual agente é despachado e quais skills ele carrega. Erre isso e o
implementador lê a documentação errada.

| A mudança toca | Agente | Skills que ele carrega |
|---|---|---|
| só `backend/` — rota, use case, migration, sem tela | `backend` | `fastapi-feature`, `fastapi-persistence`, `fastapi-testing`, `solid-principles` |
| só `frontend/` — tela, componente, sem rota nova | `frontend` | `react-feature`, `solid-principles` |
| `contract/openapi.yaml`, ou os dois lados | `fullstack` | `api-contract` + as duas listas acima |

**Mudou o contrato? É `fullstack`**, mesmo que pareça só um campo — a ordem contrato →
codegen → backend → frontend não se divide entre duas sessões.

O revisor carrega as mesmas skills da faixa, mais `pr-review-merge`. Revisar backend com a
cabeça de frontend não pega violação de camada.

## Antes de despachar

1. A spec existe e passou por `/plan`? Se não, o card volta para `refinement` — não se
   implementa a partir de conversa.
2. O card já tem claim ativo? Ler `docs/agent-claims.md`. Duas sessões na mesma spec é
   retrabalho garantido.
3. Registrar o claim: linha no arquivo com slot, spec, branch e agente.
4. Mover o card para `development` e comentar quem pegou — skill `clickup`.
5. Só então lançar o implementador.

## Paralelizar: o que ganha tempo e o que perde

Um implementador por vez é desperdício. Dois a quatro em worktrees separados encurtam a
sprint de verdade — mas só depois que a **espinha compartilhada** estiver resolvida, e ela
é quem determina o ganho, não o número de agentes.

### As quatro colisões desta base

Duas specs "independentes" ainda colidem nestes arquivos. Todos são de dono único e
nenhum é mergeável a três vias sem estrago:

| Superfície | Por que colide | Quem escreve |
|---|---|---|
| `contract/openapi.yaml` | arquivo único, toda spec de API mexe | **você**, antes de despachar |
| migração Alembic | a cadeia é linear; dois agentes partindo do mesmo `head` produzem dois heads | **você**, uma revisão por spec |
| `frontend/src/data/` gerado | sai do contrato via `make codegen`; regerar em paralelo dá diff fantasma | **você**, junto com o contrato |
| numeração de ADR e de spec | dois agentes escolhem `0011` no mesmo minuto — já aconteceu | **você**, reserva o número no claim |

O resto — entities, use cases, repositories, features, ui, testes — é território do
implementador e paraleliza sem atrito, porque cada spec traz arquivos novos.

### O procedimento

1. **Fatie a espinha primeiro.** Para cada spec da leva, escreva o trecho de contrato, crie
   a migração vazia com `down_revision` já encadeado na ordem que você escolheu, rode
   `make codegen` **uma vez** e comite tudo em `stage`. Uma leva de três specs custa um
   commit de espinha; sem ele custa três rebases.
2. **Encadeie as migrações na ordem de merge**, não na ordem de despacho. Se a 0008 vai
   mergear antes da 0009, o `down_revision` da 0009 aponta para a 0008 — mesmo que a 0009
   fique pronta antes. Quem termina cedo espera; conflito de head não se resolve rápido.
3. **Reserve os números** no claim: spec, ADR, revisão de migração. O claim é o cartório.
4. **Um worktree por agente**, sempre partindo do `stage` já com a espinha:
   `git worktree add .worktrees/<slug> -b feature/<spec> origin/stage`.
5. **Despache os implementadores numa única mensagem**, uma chamada de Agent por spec —
   eles rodam concorrentes e a notificação de cada um chega quando termina. Despachar em
   mensagens separadas serializa sem que nada obrigue a isso.
6. **Cada agente recebe explicitamente**: o caminho do worktree, que o contrato **já está
   escrito e é imutável para ele**, o número da sua migração e a proibição de tocar em
   qualquer linha da tabela acima. Sem isso um deles "melhora" o contrato e derruba os
   outros dois.

### Quando um implementador trava

Aconteceu na 0008: o agente constava como `running` por duas horas, sem commit
por duas, sem tocar arquivo por cinquenta minutos, e sem pegar a mensagem que
mandei — porque uma mensagem só é entregue no próximo ciclo de ferramenta dele,
e ele não fazia nenhum.

**`running` não é sinal de progresso.** O que é:

```bash
git -C <worktree> log -1 --format='%h %ar'          # último commit
find <worktree> -newermt '-30 minutes' -type f \
  -not -path '*/.git/*' -not -path '*/node_modules/*' | head   # arquivo tocado
docker stats --no-stream | grep <slug>              # CPU da stack dele
ps -eo etime,args | grep -E 'pytest|playwright'     # portão rodando?
```

Portão longo consome CPU e toca arquivo. **CPU em zero, nenhum arquivo e nenhum
processo de teste é travamento**, por mais que o registro diga `running`.

O procedimento, nesta ordem:

1. **Pergunte primeiro**, pela `SendMessage`. Se ele estiver vivo e só lento, a
   resposta vem no próximo ciclo e você não perdeu nada.
2. **Sem resposta e sem sinal de vida, encerre** com `TaskStop`. O trabalho está
   commitado na branch; encerrar não apaga nada.
3. **Avalie o que existe** antes de decidir: `git log origin/stage..HEAD`,
   `git diff --stat`, e rode os portões. Muitas vezes falta pouco.
4. **Não termine você mesmo**, salvo se o que falta for mecânico. Assumir
   implementação custa o dobro — é a mesma razão pela qual você não commita pelo
   agente. Redespache com escopo preciso: o que está feito, o que falta, qual o
   critério de aceite, e o que já verificou.
5. **Commite o que você mesmo apurou** ao avaliar. Um diagnóstico que morre no
   seu contexto obriga o próximo a redescobri-lo.

O redespacho não é recomeço: o agente novo herda a branch com os commits e um
briefing que custou minutos, não horas.

### Cada worktree entrega commit e PR — não código solto

O implementador da 0006 terminou com 123 arquivos **sem commit** e nenhum PR aberto. O
orquestrador teve de commitar e abrir o PR no lugar dele. A regra já existia em
`implementation-handoff.md`; o que faltava era o despacho **exigi-la como entrega** e o
orquestrador **recusar** qualquer coisa diferente.

Vale para todo agente, em todo worktree:

1. **A branch é dele e só dele.** `feature/<spec>` no worktree `.worktrees/<slug>`. Nunca
   commitar em `stage`; o guard rail `scripts/guard-stage-branch.sh` bloqueia, e
   `--no-verify` para burlar é violação do fluxo.
2. **Commits atômicos, Conventional Commits com escopo** (`git.md`). Se o resumo precisa
   de "e", são dois commits. Sem trailer de ferramenta na mensagem.
3. **`make ci` verde no worktree antes do push.** Rodar antes de commitar não serve para o
   check de codegen, que compara com o `HEAD` — commite, depois rode.
4. **Push da branch e `gh pr create --base stage`**, com o corpo trazendo link da spec, o
   que mudou em uma frase, como verificar, e o que ficou de fora.
5. **A entrega do agente é a URL do PR.** Não é "implementei", não é um resumo, não é uma
   lista de arquivos.

**O orquestrador recusa a entrega** que chegar sem URL de PR: devolve ao mesmo agente pela
`SendMessage`, com o worktree ainda de pé, para ele commitar e abrir. Assumir o trabalho
dele parece mais rápido e custa o dobro — some o histórico atômico, e o revisor recebe um
lump de 123 arquivos em vez de commits legíveis.

### O papel vai no prompt, sempre — não confie no `subagent_type`

Os papéis deste projeto vivem em `.agents/agents/` e estão ligados em `.claude/agents/`:
`arch-reviewer`, `backend`, `frontend`, `fullstack`, `orchestrator`, `product-owner`, `qa`,
`spec-reviewer`. Cada um traz o que aquele papel deve saber, e o `arch-reviewer` declara
`tools: Read, Grep, Glob, Bash` — **somente leitura**.

**Mas nem toda sessão os oferece como tipo de subagente.** Medido: uma sessão inteira despachou
oito agentes e o harness só aceitava `general-purpose`. O efeito de não perceber isso é
silencioso e real — revisores rodaram **com escrita**, quando o papel os define como leitura, e
um deles mutou arquivos no worktree que outro agente estava usando.

Portanto: **tente o tipo do papel; se ele não existir, carregue o papel pelo prompt.** Nunca
despache sem uma das duas coisas.

O prompt que carrega o papel começa assim, com os caminhos literais:

```
Antes de qualquer coisa, leia e siga:

- o papel: .agents/agents/<papel>.md
- as skills: .agents/skills/<skill>/SKILL.md — uma linha por skill que a tarefa exige
- as regras sempre ativas, a começar por .agents/rules/evidencia.md

Se o seu papel declara `tools:` restrito e você tem mais ferramentas que isso,
respeite a restrição do papel: ela é parte da definição, não do ambiente.
```

A última frase importa. Um revisor com escrita **pode** editar, e é justamente por isso que
precisa saber que não deve — salvo para falsificar, e aí em cópia isolada, revertendo depois.

**Skills por papel**, para o despacho não precisar redescobrir:

| Papel | Skills que o prompt carrega |
|---|---|
| implementador backend | `fastapi-feature`, `fastapi-persistence`, `fastapi-testing`, `api-contract`, `quality-gates`, `task-handoff` |
| implementador frontend | `react-feature`, `api-contract`, `quality-gates`, `task-handoff` |
| implementador fullstack | as duas listas acima |
| revisor | `pr-review-merge`, `clean-architecture`, mais a skill da faixa |
| QA | `qa-visual` |
| PO | `po-intake`, `spec-driven` |

### O prompt de despacho, no mínimo

Um implementador em paralelo precisa de seis coisas ditas em letra, porque ele não vê o
que os outros estão fazendo:

- **O worktree**, por caminho absoluto, e que ele não sai de lá.
- **A spec**, por caminho, e que o escopo é ela — não a spec vizinha.
- **Que o contrato já está escrito e é imutável para ele.** Sem isto um deles "melhora" o
  contrato e derruba os outros dois.
- **O número da migração reservada** e o `down_revision` a usar.
- **A lista do que ele não toca** — a tabela das quatro colisões.
- **A entrega**: `make ci` verde, commits atômicos, push, `gh pr create`, e a resposta é a

- **A regra `evidencia.md`**, apontada explicitamente. Ela é sempre ativa, mas dizer no
  despacho *quais* armadilhas desta base já custaram caro poupa a redescoberta: o
  `error-context.md` do Playwright, a ordem entre e2e e contract-test, o critério das duas
  execuções seguidas, e a falsificação de teste.
  URL do PR.
- **`make e2e-affected` para iterar, `make e2e` completo antes de pedir revisão** — regra
  `evidencia.md` §6. Diga isso no despacho: rodar o completo a cada ajuste pequeno é o que
  estava travando o monitoramento por timeout.

### A stack local também colide

A tabela acima cobre arquivos. Falta o que roda: o `docker compose` usa o mesmo
nome de projeto em todos os worktrees, então `make up` num deles **substitui os
containers do outro** — para o compose é o mesmo projeto, e o agente lesado vê a
API dele trocada por uma de outra branch, sem aviso. Quando o nome difere mas a
porta não, o erro é `port is already allocated`, que também não diz de onde vem.

`scripts/worktree-stack.sh` deriva nome de projeto e portas do diretório, e o
`Makefile` e os scripts o carregam. Cada `.worktrees/<slug>` sobe a própria
stack, sempre nas mesmas portas. **Não fixe `APP_NAME`, `API_PORT` nem
`WEB_PORT` no `.env`** — valor fixado vence a derivação e traz a colisão de
volta.

### O que continua em série, e por quê

- **QA** — um de cada vez. Evidência de QA misturada não prova nada sobre nenhuma das
  specs.
- **Merge** — um PR por vez, na ordem em que as migrações foram encadeadas. Merge de dois
  PRs simultâneos é o mesmo conflito de head, só que em `stage`.
- **Deploy em staging** — depois do último merge da leva, não a cada PR. Deploy por PR
  multiplica o tempo de fila sem multiplicar informação.

**Revisores** entram conforme as PRs abrem, e esses sim vão todos em paralelo: revisão é
leitura, não escreve nada.

### Quando não paralelizar

Uma spec que **redefine** a espinha em vez de estendê-la — migração async e fronteira de
transação, troca de biblioteca, refatoração de camada — vai sozinha. Ela reescreve o chão
onde os outros pisariam, e paralelizar com ela é garantir retrabalho nos três.

## Quando o QA acha bug

Não deixe o card parado esperando alguém notar. O ciclo é fechado na hora:

1. QA move o card para **`bugs`** e comenta: o que quebrou, como reproduzir passo a passo,
   em que ambiente, com screenshot.
2. Se o bug é da própria spec em QA, **o card não volta para `backlog`** — ele volta para
   `development`, com o mesmo número.
3. **Dispare o implementador imediatamente**, da mesma faixa, apontando para o comentário do
   QA. Não espere a próxima rodada.
4. Corrigido e mergeado, o card volta a `staging` e o **mesmo QA revalida** — inclusive o
   que já tinha passado, porque a correção pode ter quebrado outra coisa.
5. Se o bug é de outra spec, aí sim vira card novo em `backlog` — skill `bug-resolve`.

## Verificação que você exige

Do implementador e do revisor, com a **saída colada** no card, não a promessa dela:

```bash
make lint
make test
make ci        # o que o CI roda
```

Em container, sempre. PR sem essa evidência volta para o implementador — regra
`task-done-criteria`.

E antes da evidência, a entrega em si: **sem URL de PR não há o que verificar.** Worktree
com mudança não commitada é trabalho não entregue, por mais completo que o código esteja.

Do QA, em staging: os critérios de aceite da spec, um a um, com screenshot, mais o smoke das
rotas principais.

### CI verde não é "está em staging"

Confundir as duas coisas custou uma sprint inteira aqui. O `checkSuites` do Railway espera o
CI do GitHub ficar verde antes de publicar; o E2E de `stage` ficou vermelho da 0005 até a
0006, e **todo** deploy no intervalo foi recusado. Staging serviu um build antigo por dias
enquanto o board dizia que as tarefas estavam lá — e o orquestrador (eu) reportou sprint em
staging sem nunca ter batido numa rota nova.

**Antes de dizer que uma sprint está em staging, bata numa rota que só existe depois do
merge.** Uma linha, e ela distingue "implantado" de "acho que implantou":

```bash
curl -s -o /dev/null -w '%{http_code}\n' "$STAGING/api/v1/<rota-nova-da-spec>"
# 401 → a rota existe e exige sessão: implantado
# 404 → o build antigo ainda está servindo: NÃO implantado
```

O healthcheck não serve para isso: ele responde 200 no container velho, que é justamente o
que continua de pé quando o deploy novo falha.

E confira o estado do deploy, não só o do CI:

```bash
railway deployment list --service api --json   # SUCCESS, FAILED ou SKIPPED
```

`FAILED` e `SKIPPED` são silenciosos: ninguém é avisado, o serviço continua no ar servindo o
build anterior, e a única evidência é a rota nova que não existe.

## Tabela ESTADO, toda rodada

```markdown
| Slot | Spec | Fase | PR | Merge | QA | Card |
|------|------|------|----|-------|----|------|
| A | 0004-fundacao | review | #1 | ⏳ | — | 86e3… |
| B | 0005-perfis | development | — | — | — | 86e3… |
```

A tabela e o board contam a mesma história. Divergiu, o board manda — é o que a equipe lê.

## Handoff entre sessões

Quando o contexto passar de 70%: grave o estado completo e a tabela em
`docs/orchestrator-session.md`, e abra sessão nova com esta skill mais aquele arquivo. Fila
perdida no meio é pior que fila parada.
