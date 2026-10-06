# Plano — 0006

## Fluxo e decisões

Issue #12 → branch vinculada via `gh issue develop` → commits com `Refs #12` → PR
com `Closes #12` → CI obrigatório → revisão → merge em develop. Promoções seguem
develop → stage → main. Usar develop como padrão permite fechamento nativo e ativa
eventos de Issues após integração; se main permanecer padrão, ativação/fechamento
dependem da promoção. Não implementar um fechador próprio de Issues.

CI reutilizável (`workflow_call`) executa Maven verify, npm ci/build/test e testes
Node das automações, mais validação de YAML/workflows. A PR também valida fluxo de
branches e uma Issue local existente. Um check agregador estável exige sucesso
de todos; nenhum filtro por caminho omite checks obrigatórios.

CD automático após push na main, ou manual com versão SemVer opcional, executa os mesmos gates e publica
imagens backend/frontend com tags de commit e versão; release só depois de ambas.
Sem implantação ou acesso a credenciais de runtime. A promoção revisada para main
é a decisão de entrega; versão automática build-SHA12 dispensa versionamento manual.

Project: workflow separado de CI, autenticado por secret PROJECT_TOKEN e variável
PROJECT_NUMBER/PROJECT_OWNER. Usa somente código da branch confiável nos eventos
privilegiados; nunca checkout da cabeça de uma PR. Inclui Issues e PRs como itens
distintos, consulta estado atual antes de atualizar e não altera prioridades.
Estados: Todo, In progress, In review, Done, Canceled. Sem credencial, produz aviso
e resumo com instrução concreta. Configuração inválida com token presente falha.

## Arquivos

- `.github/ISSUE_TEMPLATE/`, `.github/pull_request_template.md`.
- `.github/workflows/{ci,quality,project,release}.yml`.
- `.github/scripts/`: política de PR e sincronização Project com testes Node.
- `scripts/configure-github.ps1`: configuração reproduzível das proteções.
- `docs/github-workflow.md`: setup, eventos, permissões, manual e recuperação.
- `README.md`, `harness.yaml`, regras e skills do harness afetadas pelo novo fluxo.

Não há mudança de contrato REST, camadas Java ou componentes Angular.

## Riscos e mitigação

- Token de Project não existe: documentar criação/escopos sem copiar token pessoal
  de sessão para Actions; publicação no Project fica pendente até setup.
- Repositório solo: uma aprovação exige outra pessoa com permissão; sem autoaprovação
  nem bypass silencioso. A ativação de proteção considera os checks já publicados.
- Eventos de Issues e workflow_dispatch dependem da branch padrão conter os workflows.
- PRs de forks: CI sem segredo; Project processa apenas metadados, por código confiável.
- Tags de release existentes não são sobrescritas; repetir falha parcial com mesma
  versão exige conferir o commit; promover versão diferente se houver conflito.
- Actions externas fixadas em SHA; updates periódicos feitos por PR revisada.

## Verificação

Testes significativos de política de PR e transições de status; lint de workflows;
Maven/Angular pelos mesmos comandos do CI; execução real do CI na PR. Publicação
de release e Project não serão alegados como exercitados sem execução e credencial.
