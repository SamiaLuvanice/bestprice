# Roteiro de QA da spec 0034

Planejamento em 26/10/2026, conforme `.agents/agents/qa.md`. Issue #195.
Worktree: `feature-0034-issue-195-assistencia-compras-ai`.

Este documento define verificações futuras. **Não contém resultados de testes**,
não revisa arquivos de implementação transitórios e não substitui verification.md.
O plano/contrato revisado é a referência. A revisão do diff ocorrerá somente
quando os implementadores indicarem uma ponta estável.

## Ambientes e fronteiras da evidência

| Camada de evidência | O que deve ser real | O que pode ser simulado | Limite da conclusão |
|---|---|---|---|
| Testes unitários/HTTP focados | Validação, serviço e serialização sob teste | Provider, falhas externas e relógio injetado; banco rápido quando declarado | Não comprovam locks, migration ou integração PostgreSQL |
| Integração backend | API, autenticação, migrations, SQL e PostgreSQL descartável | Apenas geração externa na fronteira do adapter; relógio determinístico para bordas | Comprova contrato e persistência locais, sem validar o serviço Google |
| Fluxo integrado em navegador | SPA, chamadas `/api`, API e PostgreSQL isolados | Apenas a fronteira do provider no processo local de teste | Comprova a jornada local com resposta externa controlada; não é validação operacional do modelo |
| Regressão visual com fixtures | Render e navegador nos viewports definidos | Respostas HTTP sintéticas explicitamente identificadas | Comprova composição/estados; não comprova API ou banco |

A integração não deve substituir o cliente de pesquisas, o repository, a sessão
ou a API por um fake. O navegador deve chamar a API local e os registros devem
persistir no PostgreSQL. A substituição do provider deve existir apenas no
bootstrap/fixture de teste, sem criar configuração pública de respostas fictícias.

## Preparação e isolamento

1. Confirmar branch, worktree, SHA e estado dos implementadores antes da rodada.
   Não executar testes de integração sobre código em mudança, Stage ou banco de
   usuário real.
2. Usar PostgreSQL descartável exclusivo da tarefa. O helper existente é
   `scripts/compose-worktree.ps1`, que deriva projeto e portas por worktree e usa
   `docker-compose.yml`. Capturar as portas reais informadas pelo helper; não
   presumir 8000/5173/5432. Preservar volumes e serviços de outras tarefas.
3. Aplicar migrations e configurar `TEST_DATABASE_URL` somente para o banco
   descartável. Não imprimir a URL com senha nos relatórios.
4. Provisionar duas contas sintéticas A e B pelo mecanismo existente, sem ler
   dados de contas reais. Preparar uma conversa e uma comparação de cada conta,
   e registros sintéticos suficientes para atravessar páginas do histórico.
5. Manter `AI_ENABLED=false` na configuração padrão. Para os casos de sucesso da
   integração, usar somente processo/harness local de teste com provider controlado
   na fronteira. Nenhuma chave real, conta, faturamento ou acesso de rede ao
   fornecedor é necessário ou autorizado por este roteiro.
6. Ter transporte controlado capaz de responder: texto válido, timeout,
   indisponibilidade, 429, corpo inválido e resposta vazia/incompleta. Contar
   invocações para comprovar idempotência e ausência de rede quando desativado.
7. Injetar relógio nos testes que usam expiração/janelas. Não esperar 90 dias,
   não depender do relógio da máquina e não adicionar controles de tempo à API
   pública. Manipular somente fixtures/registros do banco descartável.

## Matriz de cobertura do aceite

| Grupo | Critérios | Demonstração e resultado esperado |
|---|---|---|
| Direção A | AC01 | Conferir Landing, Dashboard, Assistente e Comparador em desktop/mobile com vazio, carga e erro aplicáveis; logo original e hierarquia coerente |
| Descoberta | AC02, AC03, AC29 | Abrir landing como visitante e autenticado; “Começar com IA” preserva o destino após login; recursos futuros não fingem sucesso |
| Sessão e retorno | AC04, AC05, AC24 | Deep link sem sessão, sessão em verificação, 401 e falha de rede distintos; retorno seguro; logout A/login B/voltar/bfcache sem conteúdo de A |
| Navegação anterior | AC06, AC25 | `/produtos`, detalhe, `/alertas` e novos destinos de lista/alerts/overview continuam corretos; nenhum alerta é apagado pela troca de rota |
| Entrada da conversa | AC07, AC08 | Texto chega ao assistente sem aparecer na URL; espaços são recusados; categoria apenas preenche sugestão editável; sem envio silencioso |
| Dashboard real | AC09 | Listar registros próprios persistidos; vazio apenas com consulta bem-sucedida vazia; indisponibilidade não vira “nenhuma pesquisa” |
| Conversa contextual | AC10, AC11 | Duas mensagens na mesma conversa e uma em outra; contexto não mistura conversas; recarga/logout/login recuperam os pares e sua ordem |
| Duplicidade e falha | AC12, AC13 | Duplo envio/retry de rede com mesmo ID não gera outro par ou outra chamada; falhas conhecidas preservam texto e têm retry explícito |
| Limites | AC14 | Bordas de tamanho e de contadores localmente publicados; recusa anterior ao provider; 429 com espera compatível |
| Procedência e informação | AC15, AC16, AC18 | Sem dados fornecidos, não fabricar fatos; rótulo de análise não verificada; aviso externo e retenção antes de enviar; sem metadados de sessão/segredos |
| Quantidade e análise | AC17, AC19 | Dois/três produtos aceitos; menos de dois/quarto recusados também via API; resultado contextual identifica lacunas e pode não eleger vencedor |
| Versão | AC20 | Salvar, analisar, editar, verificar análise invalidada, reanalisar e reabrir versão correspondente |
| Histórico | AC21 | Busca por título sem diferença de caixa, filtro por tipo, paginação, busca sem resultados e retomada do registro correto |
| Exclusão | AC22 | Cancelar não altera; confirmar retira das listas e do acesso direto; falha permite tentar novamente; dados apagados não voltam por replay |
| Propriedade | AC23 | Toda operação de leitura/escrita/lista/continuidade/análise/exclusão com IDs de A sob sessão B falha sem conteúdo alheio |
| Persistência indisponível | AC28 | Salvar/recuperar/excluir com falha de banco nunca mostra sucesso; a UI mantém recuperação e funções independentes disponíveis |
| Interface | AC26, AC27 | Quatro viewports, toque, foco/teclado, landmarks/rótulos, contraste e redução de movimento |
| Handoff | AC30 | Cada conclusão aponta comando/caso/resultado/limite; distinção explícita entre fixture, PostgreSQL real e provider não validado operacionalmente |

## Riscos que exigem PostgreSQL e concorrência reais

### R01 Retenção, exclusão e replay

- Criar em instante T; em T + 90 dias − um incremento mínimo do relógio,
  recuperar; no instante exato T + 90 dias, obter 404 e ausência nas listas.
- Editar antes da borda não muda expires_at. Conferir listagem, detalhe, alteração,
  continuação e análise: nenhuma operação contorna expiração.
- Rodar a limpeza com relógio controlado e conferir remoção de conteúdo, mensagens
  e resultados. O agendador/CLI deve respeitar a limpeza horária prevista enquanto
  o serviço está em execução, inclusive após reinício.
- Depois de exclusão manual, conferir conteúdo ativo removido e somente tombstone
  sem conteúdo preservado pelo prazo definido. Reenviar request_id antigo não
  devolve snapshot nem ressuscita a pesquisa.
- Expirar/apagar uma pesquisa durante uma geração bloqueada na fronteira do
  provider; liberar a resposta controlada e verificar que o commit é recusado e
  que não ficam novos conteúdos órfãos ou acessíveis.
- Não interpretar essa evidência como eliminação de backups ou de registros do
  fornecedor.

### R02 Cotas não restituídas

- Gerar uma pesquisa, excluí-la e tentar gerar outra sob a mesma janela: o consumo
  continua contado. Repetir com expiração e limpeza da pesquisa.
- Usar duas conexões/sessões independentes, no limite da cota, para reservar ao
  mesmo tempo. Somente a quantidade ainda permitida é aceita; o restante recebe
  rate limit e nenhuma chamada ao provider.
- Conferir limites por pessoa e globais, minuto e dia UTC, inclusive virada exata
  de janela. Conta B não herda cota pessoal de A, mas participa da global.
- Reiniciar o processo de aplicação sem limpar banco: cotas persistem. Limpar
  contadores somente após suas janelas; conteúdo nunca é armazenado neles.
- Tentativa aceita seguida de falha do provider conta consumo; replay do mesmo
  request_id não conta outra chamada nem nova reserva.

### R03 Idempotência e transações

- Enviar mesmo request_id/payload simultaneamente por conexões independentes:
  uma reserva, no máximo uma geração e um par concluído; concorrente recebe o
  estado de processamento definido no contrato.
- Mesmo ID com payload diferente retorna conflito, inclusive se os dados forem
  semelhantes. Mesmo ID concluído devolve o resultado autorizado sem geração nova.
- Primeiro envio com falha não cria pesquisa vazia invisível; nenhum par parcial
  fica persistido. Retry explícito com ID novo não duplica pesquisa concluída.
- Simular falha de rede depois do commit: replay com mesmo ID recupera o resultado
  dentro da janela, sem nova cobrança local ou mensagem.
- Com o provider bloqueado por evento de teste, executar uma leitura independente
  e confirmar que não há transação/lock longo de geração impedindo outros acessos.
  Usar sincronização por eventos/barreiras, sem sleeps como prova de ordenação.
- Simular reserva abandonada com mais de 90s: falha recuperável, sem regeneração
  automática ou promessa de exatamente uma chamada no fornecedor.

### R04 Comparação e versão

- Analisar versão N com o provider controlado pendente; atualizar para N+1 e
  liberar a resposta de N. Resultado antigo não é salvo como análise atual.
- Repetir o caso com exclusão/expiração durante a análise. Testar replay para
  não devolver resultado obsoleto ou conteúdo excluído.
- Dois PUT com a mesma versão: apenas um vence; outro recebe conflito, sem
  sobrescrever silenciosamente a edição.

### R05 Migration, propriedade e dados seguros

- Aplicar a migration sobre o head anterior em banco descartável e conferir RLS
  habilitada nas novas tabelas públicas conforme o padrão do projeto. O teste de
  aplicação com role privilegiada não substitui a conferência de RLS.
- Provar ownership no banco e em todas as rotas; falsificar user_id na entrada
  não transfere dados nem muda o proprietário.
- Gerar dados de A e B intercalados; busca/filtro/paginação não devem incluir
  registros de outra conta. Recurso alheio tem o mesmo erro seguro de inexistente.
- Datas são UTC; preço ausente é null e não zero; preço informado conserva moeda
  e precisão decimal. URL de referência nunca provoca requisição ao destino.

## Smoke integrado independente no navegador

Executar depois dos gates dos implementadores, sobre processo/API/banco isolados
e com o provider substituído apenas pela fronteira de teste. Registrar o SHA
avaliado, URLs locais e os limites desse modo. Não apresentar esta rodada como
teste de um modelo real.

1. Entrar por link privado e concluir login; conferir o retorno. Abrir `/` ainda
   autenticado e voltar ao dashboard pelo caminho público.
2. Enviar texto pelo dashboard, conferir que o endereço não carrega a mensagem,
   ler a informação sobre processamento externo e concluir a ação explícita no
   assistente. O Network deve mostrar chamadas à API real local.
3. Enviar continuação, recarregar e abrir o histórico. Conferir no banco descartável
   que há uma pesquisa e os pares corretos, não apenas estado em memória.
4. Criar comparação com dois produtos, deixando um preço/especificação ausente;
   salvar sem depender de IA; analisar com a fronteira controlada; editar,
   verificar invalidação e reanalisar. Reabrir o endereço salvo.
5. Buscar, filtrar, paginar e excluir uma pesquisa. Conferir ausência no dashboard,
   histórico e acesso direto. Cancelar outra exclusão e conferir preservação.
6. Iniciar uma operação, provocar timeout/falha controlada do provider e falha de
   rede da UI; conferir preservação do texto, ausência de sucesso fictício e retry
   definido. Os casos negativos de provider não substituem testes de falha de banco.
7. Sair de A, entrar como B, voltar/avançar e restaurar página. Nenhum título,
   mensagem, comparação ou resposta tardia de A deve aparecer.
8. Abrir monitoramento antigo/novo, overview e alertas configurados por links
   diretos. Exercitar ações existentes com seus estados reais/autorizados;
   integração externa indisponível não pode virar sucesso ou preço fabricado.
9. Repetir os fluxos centrais em 320, 390, 768 e 1280 px. Medir overflow da página
   e áreas de toque; conferir menus, composição da comparação, foco visível,
   confirmação de exclusão e navegação apenas por teclado. Conferir axe onde
   houver harness, além de inspeção visual.
10. Enviar resposta controlada com texto semelhante a HTML/script. O conteúdo é
    mostrado como texto e não executa. Conferir ausência de credencial e dados de
    sessão no payload enviado ao adapter e de prompts/respostas nos logs.

Em rodada separada, iniciar sem provider configurado: capabilities desativada,
estado honesto de indisponibilidade, comparações salvas acessíveis e **zero**
requisições externas. Não mudar a configuração padrão do produto para conseguir
um screenshot de sucesso.

## Saúde e indisponibilidade do banco

- PostgreSQL disponível: GET `/api/health` retorna o contrato fechado 200 com
  status/database ok.
- Interromper somente o banco descartável da tarefa: health retorna o contrato
  fechado 503, sem detalhes internos. Recuperar o banco e comprovar retorno 200.
- Em operações de pesquisa, conferir erro seguro de persistência e recuperação;
  falha de rede no browser continua distinta de resposta HTTP 503.

## Gates e registro

Os comandos devem ser executados na worktree e ter sua saída preservada com
contagem positiva. Não repetir gates já comprovados sem mudança/falha nova.

- Backend: `uv run ruff check .` e `uv run pytest -q` em backend, com
  `TEST_DATABASE_URL` apontando ao PostgreSQL descartável para a rodada de integração.
- Complexidade: relatório da skill cyclomatic-complexity para o diff contra
  origin/develop, sem aceitar bloco novo rank D+; registrar comando real utilizado.
- Frontend: `npm run lint`, `npm test -- --run`, `npm run build` em frontend.
- Visual: `npm run test:visual` no escopo alterado conforme harness; nenhuma
  atualização automática de baselines é aprovação do resultado.
- Automação: testes Node da raiz e actionlint quando aplicável/disponível; hooks
  executados sem bypass antes da publicação.
- Revisão estável do diff e QA antecedem doc-sync-onboarding. Se houver novo código
  depois da sincronização, repetir a etapa final de documentação.

No verification.md, registrar por caso: critério, SHA, comando/passos, fixture ou
serviço real, resultado observado, artefato e limite. Separar **passou**, **falhou**,
**não executado**, **parcial** e **skip**; skip não comprova PostgreSQL nem aceite.
Registrar CI/Project/deploy somente se observados. A ausência de chamada real ao
fornecedor é uma pendência operacional explícita, não uma aprovação da qualidade
ou das cotas do modelo.
