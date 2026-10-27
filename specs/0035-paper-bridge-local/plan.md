# Plano — 0035

CLI Node ESM com Playwright já instalado. A implementação fica em worktree baseada
em origin/develop, branch `feature/0035-issue-201-paper-bridge-local`, Issue #201.
Copiar os experimentos locais sem alterações; artefatos e dependências ficam ignorados.

Separar conexão/seleção segura do documento, seletores verificados, propriedades,
gestos do canvas, frames, texto, adaptador de tokens, composição, evidências e CLI.
Não há contrato HTTP novo. Entrada via argumentos; saída JSON com success,
operation, element, verified, evidence e limitations; erro retorna exit code 1.

Usar DOM somente para leitura de controles e geometria visível; edição exclusivamente
por locators, teclado e mouse. Nunca ler estado interno da aplicação. Identificação
por título exato e botão do documento. CDP aceita somente 127.0.0.1. Lock exclusivo
em diretório temporário comum às worktrees protege o documento em todos os comandos.
Não há recuperação automática de lock abandonado nem retries cegos de criação.

Medidas são aplicadas no painel, não inferidas do gesto. Coordenadas de texto devem
usar zoom/viewport observados e/ou propriedades locais X/Y; DPR não é zoom. Releitura
após desfocar e selecionar novamente comprova propriedades. Nomes únicos e nomes
estáveis para texto permitem repetição; ambiguidades interrompem antes da mutação.

Extrair tokens do CSS real da SPA, metadados de rotas/componentes dos fontes e
conservar referência à identidade oficial. Não inventar sidebar ou cores. Composição
aceita apenas primitivas e componentes mapeados com evidência; suportes não mapeados
retornam erro explícito antes de criar. Screenshots antes/depois ficam em reports/.

Testes Node test runner na fronteira da CLI, políticas de segurança, adaptador,
verificação e conversão de coordenadas; ciclo TDD registrado. Testes ao vivo somente
no documento autorizado e sequenciais. Gates da ferramenta e automações da raiz;
SPA/backend não tocados. Revisão independente antes de doc-sync-onboarding final.
