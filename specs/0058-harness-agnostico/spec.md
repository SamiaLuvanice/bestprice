---
numero: 0058
titulo: Harness agnóstico e verificável
tipo: melhoria
prioridade: P2
status: pronta
toca: [harness, ci]
depende_de: []
---

# 0058 — Harness agnóstico e verificável

Issue: [#322](https://github.com/SamiaLuvanice/bestprice/issues/322)

## Problema

Quem mantém o projeto (pessoa ou agente de IA) depende de um harness que hoje:

- tem duas implementações da mesma projeção de instruções, uma por sistema operacional, que podem divergir;
- só diagnostica o próprio estado em Windows, fora do CI, com valores do projeto fixados no código;
- confia em instruções em prosa para regras de processo verificáveis (formato do commit, autoria humana, branch protegida);
- não procura segredos fora de chaves privadas;
- repete os comandos de qualidade e a regra de sincronização de documentação em vários arquivos, o que convida a divergência;
- exige a sincronização de documentação em toda mudança de código, mesmo quando nenhum documento é afetado;
- mistura no núcleo exemplos específicos desta stack, o que impede reaproveitá-lo em outro projeto.

## Comportamento esperado

O harness passa a ter um núcleo agnóstico: uma única implementação multiplataforma por função (projeção, diagnóstico, política de commit, portões de qualidade e impacto em documentação), configurada pelo arquivo de configuração do harness. As regras verificáveis são aplicadas por hook local e repetidas no CI sobre o range do PR. A sincronização de documentação é exigida quando a mudança afeta documentos mapeados e a regra vive em um único lugar. O núcleo deixa de citar specs, rotas e ferramentas da stack; esses exemplos ficam no perfil técnico.

## Critérios de aceite

- [x] AC01 — Dado Windows ou Unix com Node, quando a projeção roda, então os arquivos gerados ficam idênticos aos atuais e os links das ferramentas continuam apontando para a fonte única.
- [x] AC02 — Dado uma projeção gerada desatualizada, quando a checagem roda, então ela falha nomeando o arquivo.
- [x] AC03 — Dado um commit com título fora de Conventional Commits, com atribuição a agente de IA ou feito em branch protegida (sem o token de bootstrap), quando o hook de mensagem roda, então o commit é recusado com o motivo.
- [x] AC04 — Dado um PR, quando o CI roda, então a mesma política de commit é aplicada a todos os commits do range e o resultado compõe o check agregador.
- [x] AC05 — Dado o CI, quando um PR é aberto, então testes do harness, checagem de projeções, diagnóstico e varredura de segredos do range executam e compõem o check agregador.
- [x] AC06 — Dado o diagnóstico, quando ele roda em qualquer sistema, então valida arquivos obrigatórios, itens do perfil ativo, skills travadas, projeções, referências proibidas lidas da configuração e segredos aparentes; worktrees com branch já integrada geram aviso, sem remoção.
- [x] AC07 — Dado a configuração do harness, quando os portões rodam, então executam os comandos declarados no diretório de cada escopo; as instruções citam esse comando em vez de repetir a lista.
- [x] AC08 — Dado um diff, quando a checagem de impacto roda, então lista os documentos mapeados a revisar; a regra de sincronização de documentação existe em um único arquivo de regra e os demais apenas a referenciam.
- [x] AC09 — Os arquivos do núcleo (regras, agentes e skills listados em `core`) não citam specs numeradas, rotas da API nem ferramentas exclusivas da stack.
- [x] AC10 — A configuração local do Claude nega leitura de `.env` também por comandos de shell comuns.

## Fora de escopo

- Remover worktrees obsoletas (apenas reportar).
- Alterar código da aplicação, o fluxo develop/stage ou a política de releases.
- Varrer o histórico inteiro do Git em busca de segredos.

## Perguntas em aberto

- Suposição: Node ≥ 20 já é pré-requisito do projeto (frontend e automações do GitHub), então a implementação única usa Node sem dependências em vez de Python.
