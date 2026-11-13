// Testes do núcleo agnóstico do harness: node --test .agents/scripts/
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { cleanMessage, protectedBranchError, validateMessage } from "./commit-msg.mjs";
import { findSecrets } from "./diagnose.mjs";
import { impactedDocs } from "./docs-impact.mjs";
import { planGates } from "./gates.mjs";
import { globToRegExp, parseYaml } from "./lib.mjs";
import { convertAgentForOpencode, projectMcp, sync } from "./sync.mjs";

test("parseYaml lê mapas, listas inline e em bloco, comentários e chaves com aspas", () => {
  const data = parseYaml(`
version: 0.4.0 # comentário
tools:
  claude: true
  cursor: false
git:
  protected_branches: [develop, "stage"]
core:
  rules:
    - git.md
    - security.md
docs_impact:
  "src/**": [README.md]
  'api/*.ts': docs/api.md
quality:
  lint_command: npm run lint -- --max-warnings=0
`);
  assert.equal(data.version, "0.4.0");
  assert.deepEqual(data.tools, { claude: true, cursor: false });
  assert.deepEqual(data.git.protected_branches, ["develop", "stage"]);
  assert.deepEqual(data.core.rules, ["git.md", "security.md"]);
  assert.deepEqual(data.docs_impact, { "src/**": ["README.md"], "api/*.ts": "docs/api.md" });
  assert.equal(data.quality.lint_command, "npm run lint -- --max-warnings=0");
});

test("globToRegExp trata ** como qualquer profundidade e * como um segmento", () => {
  assert.ok(globToRegExp("src/**").test("src/a/b.tsx"));
  assert.ok(globToRegExp("src/**/*.tsx").test("src/App.tsx"));
  assert.ok(globToRegExp("api/*.ts").test("api/contact.ts"));
  assert.ok(!globToRegExp("api/*.ts").test("api/_lib/contact.ts"));
  assert.ok(globToRegExp("package.json").test("package.json"));
});

test("commit-msg aceita Conventional Commits e mensagens automáticas do Git", () => {
  assert.deepEqual(validateMessage("feat(about): adiciona seção\n\nCorpo."), []);
  assert.deepEqual(validateMessage("fix!: corrige quebra"), []);
  assert.deepEqual(validateMessage("Merge branch 'main' into feature/x"), []);
  assert.deepEqual(validateMessage("# comentário do editor\nchore(ci): ajusta cache\n"), []);
});

test("commit-msg recusa título fora do padrão", () => {
  const errors = validateMessage("Update portfolio content");
  assert.equal(errors.length, 1);
  assert.match(errors[0], /Conventional Commits/);
});

test("commit-msg recusa atribuição a agentes de IA", () => {
  const agent = ["Cl", "aude"].join("");
  const samples = [
    `feat: x\n\nCo-Authored-By: ${agent} Opus <noreply@anthropic.com>`,
    "feat: x\n\nco-authored-by: GitHub Copilot <copilot@github.com>",
    `feat: x\n\nGenerated with [${agent} Code](https://example.com)`,
  ];
  for (const message of samples) {
    assert.ok(validateMessage(message).some((error) => /atribuição/.test(error)), message);
  }
  assert.deepEqual(validateMessage("feat: x\n\nCo-Authored-By: Pessoa Real <pessoa@example.com>"), []);
});

test("cleanMessage ignora o diff do commit -v", () => {
  const raw = "feat: x\n# ------------------------ >8 ------------------------\nCo-Authored-By: copilot";
  assert.equal(cleanMessage(raw), "feat: x");
});

test("guarda de branch protegida respeita lista e token de bootstrap", () => {
  assert.match(protectedBranchError("main", "feat: x", ["main"]), /protegida 'main'/);
  assert.equal(protectedBranchError("feature/x", "feat: x", ["main"]), null);
  assert.equal(protectedBranchError("main", "chore: x [bootstrap-guard]", ["main"]), null);
  assert.equal(protectedBranchError(null, "feat: x", ["main"]), null);
});

test("planGates deriva diretório do escopo e aplica filtros", () => {
  const harness = {
    profile: { backend_dir: "backend", frontend_dir: "web" },
    quality: {
      backend_install_command: "uv sync",
      backend_test_command: "uv run pytest -q",
      frontend_lint_command: "npm run lint",
      build_command: "npm run build",
      note: "ignorado",
    },
  };
  assert.deepEqual(
    planGates(harness).map((gate) => [gate.name, gate.dir]),
    [["backend:install", "backend"], ["backend:test", "backend"], ["frontend:lint", "web"], ["build", "."]],
  );
  assert.deepEqual(planGates(harness, { skipInstall: true, only: ["test"] }).map((gate) => gate.name), ["backend:test"]);
  assert.deepEqual(planGates(harness, { scopes: [""] }).map((gate) => gate.name), ["build"]);
});

test("impactedDocs mapeia arquivos alterados e marca docs já tocados", () => {
  const impacts = impactedDocs(["src/App.tsx", "api/contact.ts", "README.md"], {
    "src/**": ["README.md", "docs/architecture.md"],
    "api/*.ts": "docs/architecture.md",
  });
  assert.deepEqual(
    impacts.map((impact) => [impact.doc, impact.touched, impact.causes.length]),
    [["docs/architecture.md", false, 2], ["README.md", true, 1]],
  );
});

test("findSecrets detecta formatos comuns sem acusar placeholders", () => {
  const pem = ["-----BEGIN", "PRIVATE KEY-----"].join(" ");
  const jwt = ["eyJhbGciOiJIUzI1NiJ9", "eyJyb2xlIjoic2VydmljZV9yb2xlIn0", "c2lnbmF0dXJlLWFxdWk"].join(".");
  const resend = ["re", "AbCdEf12", "AbCdEfGhIjKlMnOpQr"].join("_");
  assert.deepEqual(findSecrets(pem), ["chave privada PEM"]);
  assert.ok(findSecrets(`KEY=${jwt}`).includes("JWT"));
  assert.ok(findSecrets(`RESEND_API_KEY=${resend}`).includes("chave Resend"));
  assert.deepEqual(findSecrets("RESEND_API_KEY=\npassword: ${DB_PASSWORD}\ntoken: <seu-token>"), []);
});

test("projectMcp converte remoto e local para Claude e OpenCode", () => {
  const result = projectMcp({
    mcpServers: {
      docs: { url: "https://example.com/mcp", headers: { Authorization: "Bearer ${TOKEN}" } },
      browser: { command: "npx", args: ["-y", "pkg"], disabled: true },
    },
  });
  assert.deepEqual(result.claude.mcpServers.docs, {
    type: "http",
    url: "https://example.com/mcp",
    headers: { Authorization: "Bearer ${TOKEN}" },
  });
  assert.equal(result.opencode.mcp.docs.headers.Authorization, "Bearer {env:TOKEN}");
  assert.deepEqual(result.opencode.mcp.browser, { type: "local", command: ["npx", "-y", "pkg"], enabled: false });
  assert.throws(() => projectMcp({ mcpServers: { bad: {} } }), /exatamente um/);
});

test("convertAgentForOpencode troca tools por permissões somente leitura", () => {
  const converted = convertAgentForOpencode("---\nname: x\ntools: Read, Grep\n---\ncorpo tools: aqui\n");
  assert.match(converted, /permission:\n {2}edit: deny/);
  assert.doesNotMatch(converted.split("---")[1], /tools:/);
  assert.match(converted, /corpo tools: aqui/);
});

test("sync --check acusa projeção MCP desatualizada e sync a corrige", () => {
  const root = mkdtempSync(join(tmpdir(), "harness-"));
  mkdirSync(join(root, ".agents", "agents"), { recursive: true });
  mkdirSync(join(root, ".agents", "skills"), { recursive: true });
  writeFileSync(join(root, "harness.yaml"), "tools:\n  claude: true\n");
  writeFileSync(join(root, ".agents", "mcp.json"), JSON.stringify({ mcpServers: { d: { url: "https://x/mcp" } } }));
  assert.throws(() => sync({ root, check: true, log: () => {} }), /desatualizadas: \.mcp\.json/);
  sync({ root, log: () => {} });
  assert.deepEqual(JSON.parse(readFileSync(join(root, ".mcp.json"), "utf8")), {
    mcpServers: { d: { type: "http", url: "https://x/mcp" } },
  });
  assert.deepEqual(sync({ root, check: true, log: () => {} }).drift, []);
});

test("findSecrets não atravessa linhas, ignora [placeholder] e respeita marcador por linha", () => {
  assert.deepEqual(findSecrets('prompt("Confirme a senha: ")\nif password != confirmation:\n  x = "abc"'), []);
  assert.deepEqual(findSecrets('BYPASS_TOKEN = "[bootstrap-guard]"'), []);
  const fixture = ['DUMMY_PASSWORD = "senha-', 'ficticia"'].join("");
  assert.deepEqual(findSecrets(fixture), ["senha literal"]);
  assert.deepEqual(findSecrets(`${fixture}  # gitleaks:allow`), []);
});
