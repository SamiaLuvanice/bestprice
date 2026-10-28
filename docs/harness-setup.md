# Instalação do harness

Pré-requisitos deste perfil: Python 3.13, uv, Node.js 22/npm, Docker Compose, Git e PowerShell no Windows (ou Bash em Unix). Clone o repositório, crie .env a partir de .env.example, instale backend com uv sync --locked --extra dev e frontend com npm ci. Para ferramentas que precisam projeção, execute .agents/sync.ps1 no Windows ou bash .agents/sync.sh no Unix. O OpenCode recebe .opencode/agent apontando para .opencode/generated/agents, gerado a partir de .agents/agents com o frontmatter convertido; rode o sync novamente após editar um agente. Codex lê AGENTS.md e .agents/ diretamente.

Rode scripts/diagnose-harness.ps1 para conferir referências. Não copie segredos, volumes ou arquivos .env para outro projeto. Se adaptar o harness, edite .agents/ e config/harness.example.yaml; os links gerados não são fonte.

O servidor MCP oficial do Mercado Livre é remoto e usa OAuth do cliente MCP. A configuração do projeto aponta para `https://mcp.mercadolivre.com/devsite/v1/mcp` sem armazenar token nem cabeçalho manual no repositório. No Codex, confira se está habilitado com `codex mcp list`; para iniciar ou refazer a autorização, execute `codex mcp login mercadolibre-mcp-server`. Depois de alterar a configuração ou concluir a autorização, abra uma nova sessão do Codex para carregar as ferramentas MCP. O estado `enabled` confirma que o servidor está configurado, mas a autorização deve ser conferida no cliente; esta configuração não controla a flag de ativação da integração de monitoramento do BestPrice.

A fonte de configuração é `.agents/mcp.json`. Após alterá-la, execute
`.agents/sync.ps1 -WithCursor -WithOpenCode` no Windows ou
`bash .agents/sync.sh --with-cursor --with-opencode` em Unix. O sync projeta
`.mcp.json`, `opencode.json` e `.cursor/mcp.json`; não edite os arquivos gerados.
A spec 0039 retira somente o servidor Paper, preservando as outras integrações.

Para design, priorize o conector MCP oficial do Figma disponível e autorizado no
cliente. Verifique a autorização e o acesso ao arquivo/frame na tarefa que o
consultar; ferramentas listadas não comprovam acesso. Não duplique servidores
nem versione credenciais. Configurações e plugins globais do cliente ficam fora
das projeções deste repositório; a retirada local de Paper não os desinstala.
O [guia frontend](apps/frontend.md#fluxo-oficial-de-design--figma) define o fluxo
e o uso de exportações quando o MCP estiver indisponível ou limitado.
