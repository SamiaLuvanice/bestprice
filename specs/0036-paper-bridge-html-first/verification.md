# Verificação — 0036

Data: 27/10/2026 (America/Sao_Paulo). Base `origin/develop` em `b4fd94f`;
branch `feature/0036-issue-203-paper-html-sync`; Issue #203.

## Gates locais

| Comando | Resultado |
|---|---|
| `npm test` em `tools/paper-bridge` | 17/17 testes passaram, incluindo geração Vite/React real nos viewports 1440, 768 e 390 px, manifesto e conflito de versões. |
| `npm run check` em `tools/paper-bridge` | Sintaxe dos módulos validada. |
| `npm run paper -- status` | Conectou ao título exato `BestPrice Bridge Test · Paper`; screenshot antes/depois salvo. |

## Importação live e evidências

O ensaio HTML inicial importou a raiz `Paper Bridge HTML Probe 0036` e três
camadas observáveis. A camada de texto foi alterada e restaurada via editor do
Paper: `reports/html-probe-result.json`, `reports/html-probe.png` e
`reports/html-probe-editable.png`.

`npm run paper -- sync --screen dashboard` gerou a rota real `/app/dashboard`,
colou HTML pelo clipboard público e confirmou frame, texto editável, IDs e
imagem local no canvas. O desktop v1 criou 140 nós, texto `L-0` editado e
restaurado. A variante mobile criou 123 nós e também confirmou edição e
restauração. Referências, screenshots antes/depois e relatórios JSON são
artefatos ignorados pelo Git, preservados no diretório `tools/paper-bridge/reports/`.

Depois que a captura foi ajustada para remover o foco transitório do link de
acessibilidade, a proteção detectou a mudança de referência e recusou o sync
automático. `npm run paper -- sync --screen dashboard --new-version` importou a
versão aditiva v2 (`paperNodeId` `7O-0`, 140 nós, texto `7W-0` editado e
restaurado). A repetição sem `--new-version` reutilizou o mesmo ID e fingerprint
`e67bfbede37778446ba249b464f48006cf14cc7c31dec107584a73adc19bd3c8`, sem
importar outra raiz. Os screenshots correspondentes incluem:

- `reports/2026-10-27T21-50-15-701Z-1ad52c76-sync-before.png`
- `reports/2026-10-27T21-50-15-701Z-1ad52c76-sync-after.png`
- `reports/2026-10-27T21-51-16-014Z-9f123101-sync-before.png`
- `reports/2026-10-27T21-51-16-014Z-9f123101-sync-after.png`
- `reports/dashboard-desktop-reference.png`
- `reports/dashboard-mobile-reference.png`

O manifesto runtime local registrou `dashboard:desktop` v2 como `synced`, com
hash-fonte, fingerprint, 140 IDs e texto editável. Ele fica em `state/`, ignorado
pelo Git para separar estado local do código.

## Revisão e limites

Revisão do diff contra a arquitetura, regras frontend, segurança e testes:

- Geração roda a SPA local em Chromium headless e só permite a origem Vite local;
  respostas de sessão e pesquisas são sintéticas. Assets só são incorporados
  quando vêm da mesma origem local. Nenhuma chamada ao backend de produção ou
  sessão real foi observada.
- O clipboard é escrito com HTML gerado por `Set-Clipboard`; conteúdo anterior
  não é lido. A colagem e a edição são ações públicas de teclado/controles no
  Paper. Não há MCP, endpoint privado ou acesso ao modelo interno do documento.
- O fingerprint verifica texto, geometria, cores e tipografia observados no DOM
  renderizado. Não é diff visual por pixels nem detector de toda propriedade
  possível do Paper.
- HTML converte os controles em representação visual editável, usa fallback
  Arial, transforma `fixed` em `absolute`, omite itens invisíveis e não preserva
  a responsividade como comportamento. Tablet foi gerado e testado localmente,
  mas a importação live de tablet não foi feita.
- A versão mobile v1 foi importada/editada antes da remoção do foco transitório;
  a referência desktop limpa v2 foi importada e sincronizada. Versões anteriores
  permanecem no documento de teste, sem remoção automática.
- Uma tentativa posterior de repetir live foi bloqueada porque a janela do Paper
  ficou minimizada. A ferramenta retornou `success:false`, `verified:false`; a
  automação nativa não recuperou a janela. Isso não invalida o sync v2 e a
  repetição idempotente já observados antes do bloqueio.

Sem alteração do frontend de produto. Os scripts experimentais preexistentes da
bridge foram preservados. Status da spec permanece `pronta` até revisão e
integração da PR.
