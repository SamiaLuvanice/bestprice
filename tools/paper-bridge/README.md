# Paper Bridge local

Controla o documento **BestPrice Bridge Test** do Paper Desktop por Playwright/CDP
e pela interface: mouse, teclado e controles do painel. Não usa MCP do Paper,
endpoints privados, cookies, credenciais ou arquivos internos do aplicativo.

## Instalação e conexão

Requer Windows, Node 22 ou superior, npm e Paper instalado. Ambiente exercitado:
Node 22.18.0, Playwright 1.64.1 e Chromium 152 do Paper.

Na raiz deste checkout/worktree:

```powershell
cd tools/paper-bridge
npm ci
& "$env:LOCALAPPDATA\Programs\Paper\Paper.exe" --remote-debugging-port=9222 --remote-debugging-address=127.0.0.1
npm run paper -- status
```

Abra o documento de teste e mantenha a janela **visível, sem minimizar** durante
a execução. Deixe a árvore de camadas expandida e inteira visível. Feche diálogos
de login, compartilhamento e propriedades antes de começar. A bridge não inicia,
reinicia ou encerra o Paper. O cliente CDP é desconectado ao finalizar.

A bridge aceita somente `http://127.0.0.1:PORTA` e o título exato do documento
autorizado. `--document` não libera documentos reais. Outro documento requer uma
mudança explícita na política e autorização própria; não há flag para contorná-la.

## CLI

```powershell
npm run paper -- status
npm run paper -- inspect
npm run paper -- design-system
npm run paper -- create-frame --name "BestPrice IA - Dashboard" --width 1440 --height 900 --x 0 --y 0 --background design-token
npm run paper -- add-text --parent "BestPrice IA - Dashboard" --text "BestPrice IA" --x 80 --y 64 --font-size 48 --font-weight 700 --color primary
npm run paper -- screenshot
npm run paper -- validate
npm run paper -- validate --parent "BestPrice IA - Dashboard" --text "BestPrice IA" --x 80 --y 64 --font-size 48 --font-weight 700 --color primary
npm run paper -- create-screen --file examples/smoke-screen.json
```

Para reaproveitar um frame experimental ainda chamado Frame, acrescente
`--reuse Frame` ao primeiro `create-frame`. Se o destino já existe, ele é atualizado.
Nomes ambíguos interrompem a operação. Frames são posicionados na raiz; novos
frames que o Paper insere em outro frame são movidos pela árvore para a raiz.
Para editar um texto preservando sua identidade, use `--name "nome estável"`;
sem esse argumento, o próprio conteúdo é o nome e mudar o conteúdo cria outra
identidade. Texto com nome já existente é atualizado, sem repetir a camada.

Para saída exclusivamente JSON, use `npm --silent run paper -- status`.
Sucesso retorna exit code 0; falha ou verificação negativa retorna 1:

```json
{"success":true,"operation":"create-frame","element":"BestPrice IA - Dashboard","verified":true,"evidence":{"id":"2-0","action":"updated"}}
```

`verified` exige observação: propriedades relidas após commit/seleção e geometria,
cor, texto, tipografia e parentesco conferidos no DOM renderizado. Screenshots
complementam essa evidência; não há comparação automática por pixels ou auditoria
visual completa. Falhas de finalização retornam `success:false`, preservando as
observações e limitações. Composição pode terminar parcialmente: os componentes
concluídos continuam no resultado. Não há rollback destrutivo ou retry cego.

## API JavaScript

```javascript
import { createPaper } from "./src/bridge.mjs";
const paper = createPaper();
const result = await paper.addText({
  parent: "BestPrice IA - Dashboard",
  text: "BestPrice IA",
  x: 80, y: 64,
  fontSize: 48, fontWeight: 700, color: "primary",
});
if (!result.success || !result.verified) throw new Error(JSON.stringify(result));
```

Também há `createFrame`, `createScreen`, `status`, `inspect`, `screenshot` e
`validate`. Cada chamada adquire um lock de exclusão mútua comum às worktrees.
Não execute os scripts experimentais ou outra automação no mesmo canvas durante
um comando: eles não participam desse lock.

## Design system e composição

O adaptador lê os arquivos do checkout atual, a partir da localização do módulo:

- `frontend/src/styles.css`: cores, aliases, fontes, espaços, raios e sombras.
- `frontend/src/features/research/research.css`: layout e breakpoints da área IA.
- `App.tsx` e `ResearchArea.tsx`: rotas declaradas e destinos da navegação.
- Diretórios de componentes, dashboard e research: inventário dos fontes reais.

`design-token` é um alias de `background` (`#ffffff` no estado verificado).
`primary` é o rosa `#c7005e`; `action` é o verde `#39ff14`. A CLI recebe
**nomes de tokens**, não cores arbitrárias. A fonte aplicada é Arial, fallback
publicado no design system e observado na lista de fontes do Paper no Windows.
Não distribui SF Pro nem redesenha o logo.

`create-screen` aceita frame e componentes `type:"text"`, com nomes estáveis,
posições e tokens explícitos. Todo o arquivo é validado antes de desenhar.
`header`, `sidebar` e `dashboard-content` retornam erro de capacidade ainda não
mapeada. O exemplo exercita um frame em X=1600 e um filho em X=40/Y=32: as
coordenadas do filho são locais ao frame. Zoom e pan vêm dos limites renderizados,
sem usar o DPR como zoom.

## Testes e evidências

```powershell
npm test
npm run check
# Opt-in: cria/atualiza apenas elementos de teste; não remove camadas.
npm run test:live
```

Testes offline verificam política de acesso, argumentos, tokens reais, geometria,
composição, falhas parciais, finalização e lock. O smoke ao vivo verifica IDs
estáveis, atualização de texto e propriedades na aplicação real.

Cada comando conectado registra `reports/*-before.png`, `*-after.png`, resultado
JSON e `operations.jsonl`, com instantes UTC. Os artefatos ficam ignorados pelo
Git. `inspect` omite valores de campos desconhecidos e snapshots globais; a bridge
recusa a conexão operacional se houver um diálogo aberto. Não exporta URLs de
documentos ou dados da sessão.

Se um processo for interrompido, o lock pode ficar em
`%TEMP%\bestprice-paper-bridge-test.lock`. Confira o PID gravado e se o processo
terminou antes de remover manualmente esse arquivo. A bridge não o remove por
idade nem inicia duas operações concorrentes.

## Capacidades e limites

| Capacidade | Situação |
| --- | --- |
| Conexão e documento autorizado | Implementado e exercitado |
| Criar/reutilizar/renomear frame, W/H/X/Y e preenchimento | Implementado e exercitado |
| Texto, edição, posição local, tamanho, pesos 400/700 e cor | Implementado; peso 700 exercitado |
| Reparenting e composição frame + texto | Implementado e exercitado |
| Screenshot e validação por propriedades/DOM | Implementado e exercitado |
| Opacidade, radius, border | Controles identificados; setters ainda pendentes |
| Retângulo próprio, criação de documentos, componentes React completos | Pendentes |
| Importação HTML pela interface | Documentada pelo fornecedor; não exercitada nesta versão |
| Layout responsivo automático | Inventário de breakpoints disponível; conversão pendente |

A idempotência foi comprovada no documento de teste pequeno, com árvore expandida.
O cheque de cobertura compara nós renderizados e camadas presentes no DOM e recusa
divergências. Ele não prova a ausência de elementos simultaneamente virtualizados
pelos dois painéis. Não use esta versão em documentos grandes ou como garantia
global de unicidade. O usuário também pode editar manualmente entre comandos.

A janela minimizada impede screenshots e pode suspender atualizações de UI.
Restaure-a e inspecione o estado antes de repetir uma operação interrompida.
Mudanças de versão do Paper podem exigir novo mapeamento; seletores são verificados
por unicidade em tempo de execução, sem fallback para cliques cegos.

Os scripts `inspect.mjs`, `map-editor.mjs` e `create-frame.mjs` foram preservados
como recebidos. São experimentos independentes; a CLI nova usa exclusivamente
`src/` e sua política de documento/lock.

## Evolução

1. Mapear e verificar setters de opacidade, cantos e bordas; adicionar retângulos.
2. Validar o fluxo público de [colar HTML](https://paper.design/docs/paste/html)
   pela interface, incluindo fidelidade, fontes e idempotência.
3. Mapear Brand, ResearchLayout/sidebar, cabeçalho e dashboard reais, com revisão
   visual e estados vazios/erro; preservar assets e texto da aplicação.
4. Compor variantes por breakpoints reais, validando desktop, tablet e mobile
   separadamente; não simular regras responsivas só redimensionando frames.
5. Ampliar seleção/inventário para documentos virtualizados e adicionar regressão
   visual aprovada, sem usar modelo interno, endpoints privados ou MCP.

Referência técnica: [Playwright connectOverCDP](https://playwright.dev/docs/api/class-browsertype#browser-type-connect-over-cdp).
O aceite e os resultados reais ficam em
[verification.md](../../specs/0035-paper-bridge-local/verification.md).
