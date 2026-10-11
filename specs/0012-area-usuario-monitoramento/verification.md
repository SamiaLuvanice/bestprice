# Verificação — 0012

## 2026-10-11 — Revisão documental (sem implementação)

**O que mudou:** `spec.md` foi reescrita como spec somente de interface (`toca: [frontend]`,
`depende_de: [0011, 0013]`, `status: rascunho`) para o painel do usuário sobre o Mercado
Livre Brasil, usando apenas o contrato mínimo da spec 0013 e a referência
`designsystem/area-usuario-monitoramento.png`. Critérios de domínio e backend da versão
anterior (deduplicação, concorrência, consultas periódicas, falhas, `not_found`,
isolamento) foram removidos por já pertencerem à 0013. Elementos visuais sem dado no
contrato (busca/filtro/ordenação, deltas dos indicadores, “Ver todos/todas”, card e
gráfico do hero, nome do usuário) ficaram fora de escopo e as lacunas foram registradas.
`plan.md`, `tasks.md` e `source-evaluation.md` foram apagados.

**Por quê:** a spec 0013 substituiu a premissa Amazon e implementou o domínio (PR #35).
A implementação Amazon não commitada da 0012 foi descartada; o plano, as tarefas, a
avaliação de fonte e o registro de verificação anteriores (de 2026-10-07/08) eram da
premissa Amazon e ficaram obsoletos. Há backup deles fora desta branch.

**O que não houve:** nenhuma alteração de código, teste, build ou execução de gates.
Nenhum critério de aceite foi demonstrado. A implementação só começa após o PR #35 estar
integrado em `develop`, seguida de `/plan`.

## 2026-10-11 — Rodada de revisão da spec (spec-reviewer) — sem implementação

O `spec-reviewer` pediu ajustes; o coordenador decidiu os 18 pontos abaixo e eles foram
aplicados em `spec.md`. Critérios renumerados de AC01–AC23 para AC01–AC29.

- Sem regressão do AC-007 da 0013: cada produto mantém preço anterior, mínimo, máximo,
  variação, última consulta e última alteração (colunas/linha secundária em 1280,
  empilhado em 360) e o selo “Alerta em R$ X” quando houver alerta ativo (AC12).
- “Atualizar agora” e “Parar de monitorar” no menu da linha e no detalhe; estado ocupado
  só na linha; resultado em região anunciada junto da linha; casos 200 (inclusive
  `not_found`), 429 `refresh_not_due`, 409 `tracking_inactive`, 502/503 e recarga após
  falha (novo AC16). Parar pelo detalhe substitui o conteúdo do diálogo; foco definido em
  cada saída (AC18, AC19).
- Texto de confirmação condicional ao alerta ativo (AC18).
- Sino: estado “Notificações indisponíveis”, recálculo pela API após marcar lida, alerta e
  atualizar; sem atualização periódica (declarado fora de escopo); painel com até 5 não
  lidas e “Ver todas as notificações” (AC04, AC05).
- Estado vazio: Produtos leva ao campo de link; Alertas visível se houver notificações (AC23).
- Formato do prazo igual ao `retryHint` atual, com exemplos (AC08, AC16).
- Rótulos “Variação vs. preço anterior” (com data da alteração) e “Preço observado”;
  “Nenhuma oportunidade de queda nas últimas 24 horas.” (AC11).
- Direção queda/alta por comparação decimal exata, como requisito (AC20).
- Notificações exibem `created_at` (AC22).
- Regra de tempo relativo com tabela de exemplos e relógio controlado (AC26).
- `aria-current` no item de navegação ativo (AC02); padrão de teclado para menus e
  painéis (AC03).
- Textos exatos “Desconhecido” (preços) e “Desconhecida” (variação/datas) (AC13).
- Campo sem validação nativa de URL; AC08 demonstra 400 com entrada sem `https://`.
- Mensagem genérica para erro sem corpo estável; falha ao sair mantém a sessão local (AC01, AC08).
- “axe” substituído por “inspeção automatizada de acessibilidade (WCAG 2.1 AA)” (AC28).
- Rótulo único “Ver anúncio no Mercado Livre” no menu e no detalhe (AC15).

Nenhum código, teste ou gate foi executado; nenhum critério demonstrado. Status segue
`rascunho`, aguardando o PR #35 em `develop`.

## 2026-10-11 — Re-revisão da spec (spec-reviewer) — sem implementação

Os 18 achados da rodada anterior foram dados como resolvidos. Ajustes menores decididos
pelo coordenador e aplicados em `spec.md` (numeração AC01–AC29 mantida):

- N1 — Produto removido (parar, 409/404): mensagem em região anunciada de “Seus produtos”
  e foco no título; lista vazia → foco no campo de link e anúncio global (AC16, AC18, AC19).
- N2 — Teclado de menus: Tab/Shift+Tab percorrem, saem nas extremidades e fecham; sem
  setas (convenção e AC03).
- N3 — Recalcular indicadores sem descartar páginas carregadas; cenário com página 2
  (AC16, AC18).
- N4 — Após marcar lida, foco no próximo item ou no título; sino e seção Alertas
  consistentes (AC05, AC22).
- N5 — Seção Alertas sempre exibida, com “Nenhuma notificação por enquanto.” (AC22, AC23).
- N6 — “Última consulta” e “Última alteração” em tempo relativo; coluna Variação sem data,
  com “vs. preço anterior” (AC12).
- C1 — Texto relativo fixado na chegada da resposta da API (convenção e AC26).
- C2 — Clique fora na confirmação do detalhe cancela a confirmação, sem fechar o detalhe (AC19).
- C3 — `price_changed` com valores iguais ou não numéricos: “teve o preço alterado.” sem
  valores nem seta, nunca formatado como R$ (AC20).
- C4 — Prevalece a resposta mais recente do painel (convenção e AC24).
- C5 — AC28: inspeção automatizada WCAG 2.1 AA sem violações; ferramenta definida no plano.
- C6 — Convenções valem para as superfícies novas; o detalhe herdado da 0013 mantém seus
  textos atuais (convenção “Abrangência”).

Nenhum código, teste ou gate foi executado; nenhum critério demonstrado. Status segue
`rascunho`, aguardando o PR #35 em `develop`.

## 2026-10-11 — `/plan 0012` (sem implementação)

Criados `plan.md` e `tasks.md` (T01–T27) na worktree com `develop` atualizado e a 0013
integrada (PR #35). Contrato conferido no código de `backend/app/products/` e
`backend/app/auth/routes.py`: todos os dados usados pela spec existem; nenhum endpoint muda.
Decisões principais: lista “Seus produtos” separada do painel após a primeira carga (merge por
ID), descarte de respostas antigas por sequência, tempo relativo fixado por `receivedAt` com
relógio injetável, comparação decimal própria (sem dependência), contador do sino por
`unread_only=true&limit=100`, `@testing-library/user-event` como única dependência nova (dev),
inspeção Playwright + axe fora do repositório. Os 29 testes atuais da 0013 serão migrados
conscientemente (T03), com cada alteração listada aqui.

Nenhum código, teste ou gate foi executado nesta etapa; nenhum critério demonstrado. Status
da spec segue `rascunho` até a aprovação do plano.
