# Instalação do harness

Pré-requisitos deste perfil: Python 3.13, uv, Node.js 22/npm, Docker Compose, Git e PowerShell no Windows (ou Bash em Unix). Clone o repositório, crie .env a partir de .env.example, instale backend com uv sync --locked --extra dev e frontend com npm ci. Para ferramentas que precisam projeção, execute .agents/sync.ps1 no Windows ou bash .agents/sync.sh no Unix. O OpenCode recebe .opencode/agent apontando para .opencode/generated/agents, gerado a partir de .agents/agents com o frontmatter convertido; rode o sync novamente após editar um agente. Codex lê AGENTS.md e .agents/ diretamente.

Rode scripts/diagnose-harness.ps1 para conferir referências. Não copie segredos, volumes ou arquivos .env para outro projeto. Se adaptar o harness, edite .agents/ e config/harness.example.yaml; os links gerados não são fonte.

A fonte de configuração é `.agents/mcp.json`. Após alterá-la, execute
`.agents/sync.ps1 -WithCursor -WithOpenCode` no Windows ou
`bash .agents/sync.sh --with-cursor --with-opencode` em Unix. O sync projeta
`.mcp.json` com `"type": "http"` nas entradas remotas — o Claude Code descarta
entradas com `url` sem tipo —, gera `opencode.json` e `.cursor/mcp.json`; não
edite os arquivos gerados. O canônico permanece agnóstico, sem credenciais.
`scripts/diagnose-harness.ps1` confere se as projeções geradas listam os mesmos
servidores do canônico e se as entradas remotas de `.mcp.json` têm transporte
válido.

O perfil declara cinco servidores: `chrome-devtools` (local, via npx),
`mercadolibre-mcp-server` (`https://mcp.mercadolivre.com/devsite/v1/mcp`, OAuth;
não controla a ativação do monitoramento no produto),
`context7` (`https://mcp.context7.com/mcp/oauth`, OAuth para documentação de
bibliotecas), `figma` (`https://mcp.figma.com/mcp`, OAuth) e `paper`
(`http://127.0.0.1:29979/mcp`, Paper Desktop). O Paper permanece para uso
eventual conforme a spec 0039; não reativa a Paper Bridge nem substitui o Figma
como padrão de design. As demais integrações também são preservadas.

A autenticação é feita no cliente, não no repositório. No Claude Code, aprove o
`.mcp.json` na primeira sessão e conclua o login em `/mcp`; `claude mcp list`
mostra `Needs authentication` até a autorização. No OpenCode, use
`opencode mcp auth context7` e `opencode mcp auth figma` (os tokens ficam em
`~/.local/share/opencode/mcp-auth.json`). O Codex não lê o canônico: registre os
remotos com `codex mcp add context7 --url https://mcp.context7.com/mcp/oauth`,
`codex mcp add figma --url https://mcp.figma.com/mcp` e
`codex mcp add mercadolibre-mcp-server --url https://mcp.mercadolivre.com/devsite/v1/mcp`;
autentique com `codex mcp login <nome>` e abra uma nova sessão. No Cursor,
conecte cada servidor em Tools & MCP.

Para design, priorize o conector MCP oficial do Figma disponível e autorizado no
cliente. Verifique a autorização e o acesso ao arquivo/frame na tarefa que o
consultar; ferramentas listadas não comprovam acesso. O MCP do Figma acessa
apenas arquivos da conta e aplica limites por assento: até 20 chamadas de leitura
por mês em View/Collab e até 200 por dia em Full/Dev. Se o OAuth falhar ou o
limite for atingido, use as exportações locais, conforme o
[guia frontend](apps/frontend.md#fluxo-oficial-de-design--figma). O Context7 é a
fonte para documentação de bibliotecas quando a versão importar; se o OAuth não
funcionar em algum cliente, o endpoint `/mcp` aceita acesso anônimo com limite
menor. Nenhum token é gravado no repositório.
