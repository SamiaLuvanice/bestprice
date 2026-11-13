#!/usr/bin/env node
// Diagnóstico do harness, multiplataforma e usado também no CI:
//   - arquivos obrigatórios, imports do CLAUDE.md e itens do perfil ativo existem;
//   - skills travadas em skills-lock.json existem;
//   - projeções MCP em dia (mesma checagem de sync.mjs --check);
//   - nenhuma referência proibida (harness.yaml → diagnose.forbidden_refs);
//   - nenhum segredo aparente em arquivos versionáveis;
//   - avisa worktrees cuja branch já foi integrada (limpeza pendente).
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { ROOT, asList, git, globToRegExp, loadHarness, parseYaml } from "./lib.mjs";
import { sync } from "./sync.mjs";

const REQUIRED = ["harness.yaml", "AGENTS.md", "CLAUDE.md", ".agents/AGENTS.md", ".agents/modules.yaml"];
const TEXT_FILE = /(\.(md|mdc|ya?ml|json|py|ps1|sh|cjs|mjs|js|jsx|ts|tsx|toml|txt|html|css|env\.example)|Dockerfile)$/i;
const ALWAYS_IGNORED = /(^|\/)(node_modules|\.venv|__pycache__|\.pytest_cache|dist|coverage|archive|\.worktrees)(\/|$)/;

export const SECRET_PATTERNS = [
  { name: "chave privada PEM", regex: /-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/ },
  // Valor literal na mesma linha; placeholders (${VAR}, {env}, <...>, [...]) não contam.
  { name: "senha literal", regex: /(?:password|passwd|senha)\s*[:=]\s*["'][^"'$\s{<[][^"'\n]{5,}["']/i },
  // Valor com cara de token: sem espaços/colchetes, com ao menos um dígito.
  { name: "segredo literal", regex: /(?:secret|api[_-]?key|token)\s*[:=]\s*["'](?=[^"']*\d)[A-Za-z0-9_\-+/=.]{12,}["']/i },
  { name: "JWT", regex: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/ },
  { name: "token GitHub", regex: /\b(gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{60,})\b/ },
  { name: "chave AWS", regex: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "chave Resend", regex: /\bre_[A-Za-z0-9]{8,}_[A-Za-z0-9]{16,}\b/ },
  { name: "chave OpenAI/Anthropic", regex: /\bsk-(ant-)?[A-Za-z0-9_-]{32,}\b/ },
];

// Marcador por linha para valor fictício intencional (o mesmo aceito pelo gitleaks).
const ALLOW_MARKER = /gitleaks:allow|harness:allow-secret/;

export function findSecrets(content) {
  const lines = content.split(/\r?\n/).filter((line) => !ALLOW_MARKER.test(line));
  return SECRET_PATTERNS.filter((pattern) => lines.some((line) => pattern.regex.test(line))).map(
    (pattern) => pattern.name,
  );
}

function claudeImports(root) {
  const text = readFileSync(join(root, "CLAUDE.md"), "utf8");
  return [...text.matchAll(/^@(\S+)\s*$/gm)].map((match) => match[1]);
}

function profileItems(root, harness) {
  const modules = parseYaml(readFileSync(join(root, ".agents/modules.yaml"), "utf8"));
  const profile = modules.profiles?.[harness.profile?.name] ?? {};
  const pick = (kind) => [...asList(modules.core?.[kind]), ...asList(profile[kind])];
  return [
    ...pick("rules").map((name) => `.agents/rules/${name.endsWith(".md") ? name : `${name}.md`}`),
    ...pick("skills").map((name) => `.agents/skills/${name}/SKILL.md`),
    ...pick("agents").map((name) => `.agents/agents/${name}.md`),
  ];
}

function versionableFiles(root, ignoreGlobs) {
  const listed = git(["ls-files", "--cached", "--others", "--exclude-standard"], { cwd: root }) ?? "";
  const ignored = ignoreGlobs.map(globToRegExp);
  return listed
    .split("\n")
    .filter(Boolean)
    .filter((file) => TEXT_FILE.test(file) && !ALWAYS_IGNORED.test(file))
    .filter((file) => !ignored.some((regex) => regex.test(file)))
    .filter((file) => existsSync(join(root, file)) && statSync(join(root, file)).isFile());
}

const normalizePath = (path) => path.replace(/\\/g, "/").replace(/\/$/, "").toLowerCase();

/** Worktrees cuja branch já foi integrada e pastas em .worktrees/ sem worktree registrada. */
function worktreeWarnings(root, base, keepBranches) {
  const output = git(["worktree", "list", "--porcelain"], { cwd: root, allowFailure: true }) ?? "";
  const merged = new Set(
    (git(["branch", "--merged", base, "--format=%(refname:short)"], { cwd: root, allowFailure: true }) ?? "")
      .split("\n")
      .filter(Boolean),
  );
  const entries = [];
  for (const line of output.split("\n")) {
    if (line.startsWith("worktree ")) entries.push({ path: line.slice(9), branch: null });
    if (line.startsWith("branch ") && entries.length > 0) {
      entries.at(-1).branch = line.slice(7).replace("refs/heads/", "");
    }
  }
  const [main, ...linked] = entries; // a primeira entrada é sempre o checkout principal
  const warnings = [];
  for (const { path, branch } of linked) {
    if (branch && merged.has(branch) && !keepBranches.includes(branch)) {
      warnings.push(`worktree com branch já integrada em ${base}: ${branch} (${path}) — aplicar task-cleanup`);
    }
  }
  const container = main ? join(main.path, ".worktrees") : null;
  if (container && existsSync(container)) {
    const registered = new Set(linked.map(({ path }) => normalizePath(path)));
    for (const name of readdirSync(container)) {
      const path = join(container, name);
      if (statSync(path).isDirectory() && !registered.has(normalizePath(path))) {
        warnings.push(`pasta sem worktree registrada: ${normalizePath(path)} — conferir o conteúdo e remover manualmente`);
      }
    }
  }
  return warnings;
}

export function diagnose(root = ROOT) {
  const errors = [];
  const warnings = [];
  for (const file of REQUIRED) if (!existsSync(join(root, file))) errors.push(`arquivo ausente: ${file}`);
  if (errors.length > 0) return { errors, warnings };

  const harness = loadHarness(root);
  for (const file of claudeImports(root)) {
    if (!existsSync(join(root, file))) errors.push(`CLAUDE.md importa arquivo inexistente: ${file}`);
  }
  for (const file of profileItems(root, harness)) {
    if (!existsSync(join(root, file))) errors.push(`item do perfil ativo ausente: ${file}`);
  }
  const lockPath = join(root, "skills-lock.json");
  if (existsSync(lockPath)) {
    const lock = JSON.parse(readFileSync(lockPath, "utf8"));
    for (const name of Object.keys(lock.skills ?? {})) {
      if (!existsSync(join(root, ".agents/skills", name, "SKILL.md"))) {
        errors.push(`skill travada em skills-lock.json sem pasta: .agents/skills/${name}`);
      }
    }
  }
  try {
    sync({ root, check: true, log: () => {} });
  } catch (error) {
    errors.push(error.message);
  }

  const config = harness.diagnose ?? {};
  const forbidden = asList(config.forbidden_refs).map(String);
  const ignoreGlobs = ["harness.yaml", ".agents/scripts/*.test.mjs", ...asList(config.ignore_paths)];
  for (const file of versionableFiles(root, ignoreGlobs)) {
    const content = readFileSync(join(root, file), "utf8");
    for (const value of forbidden) {
      if (content.includes(value)) errors.push(`referência proibida "${value}" em ${file}`);
    }
    for (const kind of findSecrets(content)) errors.push(`possível segredo (${kind}) em ${file}`);
  }

  const base = `origin/${harness.git?.default_base ?? "main"}`;
  const keepBranches = [harness.git?.default_base ?? "main", ...asList(harness.git?.protected_branches)];
  warnings.push(...worktreeWarnings(root, base, keepBranches));
  return { errors, warnings };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const { errors, warnings } = diagnose();
  for (const warning of warnings) console.warn(`aviso: ${warning}`);
  if (errors.length > 0) {
    for (const error of errors) console.error(`erro: ${error}`);
    process.exit(1);
  }
  console.log(`Harness válido: ${ROOT}`);
}
