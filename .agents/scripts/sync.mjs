#!/usr/bin/env node
// Projeta .agents/ (fonte única) para cada ferramenta de IA. Implementação única
// para Windows, macOS e Linux; sync.sh e sync.ps1 apenas delegam para este arquivo.
//
//   node .agents/scripts/sync.mjs                  # ferramentas ativas em harness.yaml
//   node .agents/scripts/sync.mjs --with-opencode  # força OpenCode
//   node .agents/scripts/sync.mjs --with-cursor    # força Cursor
//   node .agents/scripts/sync.mjs --check          # só confere os arquivos gerados (CI)
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  realpathSync,
  rmSync,
  rmdirSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { ROOT, loadHarness } from "./lib.mjs";

const SRC = ".agents";

/** Converte o mcp.json agnóstico (mcpServers) nos formatos de Claude e OpenCode. */
export function projectMcp(canonical) {
  const claude = {};
  const opencode = {};
  for (const [name, server] of Object.entries(canonical.mcpServers ?? {})) {
    const hasUrl = Boolean(server.url);
    const hasCommand = Boolean(server.command);
    if (hasUrl === hasCommand) {
      throw new Error(`MCP '${name}' deve ter exatamente um entre url e command`);
    }
    const enabled = server.disabled !== true;
    if (hasUrl) {
      // Claude trata entrada sem "type" como stdio; por isso a projeção não é cópia.
      claude[name] = { type: "http", url: server.url };
      opencode[name] = { type: "remote", url: server.url, enabled };
      if (server.headers) {
        claude[name].headers = { ...server.headers };
        opencode[name].headers = Object.fromEntries(
          Object.entries(server.headers).map(([key, value]) => [
            key,
            String(value).replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g, "{env:$1}"),
          ]),
        );
        opencode[name].oauth = false;
      }
    } else {
      claude[name] = { command: server.command };
      if (server.args?.length) claude[name].args = [...server.args];
      if (server.env) claude[name].env = server.env;
      opencode[name] = { type: "local", command: [server.command, ...(server.args ?? [])], enabled };
      if (server.env) opencode[name].environment = server.env;
    }
  }
  return {
    claude: { mcpServers: claude },
    opencode: { $schema: "https://opencode.ai/config.json", mcp: opencode },
  };
}

/** Agentes com "tools:" viram somente leitura no OpenCode (formato de permissão próprio). */
export function convertAgentForOpencode(text) {
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const lines = text.split(/\r?\n/);
  if (lines[0]?.trim() !== "---") return text;
  const output = [lines[0]];
  let inFrontmatter = true;
  for (const line of lines.slice(1)) {
    if (inFrontmatter && line.trim() === "---") {
      inFrontmatter = false;
      output.push(line);
      continue;
    }
    if (inFrontmatter && /^\s*tools\s*:/.test(line)) {
      if (/^\s*tools\s*:\s*$/.test(line)) {
        throw new Error("tools: em formato objeto/multilinha não é suportado pelo sync");
      }
      output.push(
        "permission:",
        "  edit: deny",
        "  bash: deny",
        "  task: deny",
        "  todowrite: deny",
        "  webfetch: deny",
        "  websearch: deny",
      );
      continue;
    }
    output.push(line);
  }
  return output.join(eol);
}

const json = (value) => `${JSON.stringify(value, null, 2)}\n`;

function isLink(path) {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}

function removeLink(path) {
  try {
    unlinkSync(path);
  } catch {
    rmdirSync(path); // junction de diretório no Windows
  }
}

function link(root, linkPath, target, log) {
  const path = join(root, linkPath);
  const absoluteTarget = resolve(dirname(path), target);
  if (isLink(path)) {
    if (existsSync(path) && realpathSync(path) === realpathSync(absoluteTarget)) {
      log(`  = ${linkPath}`);
      return;
    }
    removeLink(path);
  } else if (existsSync(path)) {
    // Pasta real (cópia antiga ou conteúdo pessoal): preserva em backup, nunca apaga.
    const backup = `${path}.bak-${new Date().toISOString().replace(/[:.]/g, "-")}`;
    renameSync(path, backup);
    log(`  ! ${linkPath} era uma pasta real — movida para ${relative(root, backup)}`);
  }
  mkdirSync(dirname(path), { recursive: true });
  if (process.platform === "win32") {
    // Junction não exige privilégio de administrador nem modo desenvolvedor.
    symlinkSync(absoluteTarget, path, "junction");
    log(`  + ${linkPath} => junction para ${target}`);
  } else {
    symlinkSync(target, path, "dir");
    log(`  + ${linkPath} -> ${target}`);
  }
}

function writeGenerated(root, relPath, content, { check, drift, log }) {
  const path = join(root, relPath);
  const current = existsSync(path) ? readFileSync(path, "utf8").replace(/\r\n/g, "\n") : null;
  if (current === content) {
    log(`  = ${relPath}`);
    return;
  }
  if (check) {
    drift.push(relPath);
    return;
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
  log(`  + ${relPath} (gerado — não editar)`);
}

export function sync({ root = ROOT, check = false, withOpencode = false, withCursor = false, log = console.log } = {}) {
  const harness = existsSync(join(root, "harness.yaml")) ? loadHarness(root) : {};
  const tools = harness.tools ?? {};
  const opencode = withOpencode || tools.opencode === true;
  const cursor = withCursor || tools.cursor === true;
  const drift = [];
  const src = join(root, SRC);
  const hasCommands = existsSync(join(src, "commands"));

  if (!check) {
    log("Claude Code:");
    link(root, ".claude/agents", `../${SRC}/agents`, log);
    link(root, ".claude/skills", `../${SRC}/skills`, log);
    if (hasCommands) link(root, ".claude/commands", `../${SRC}/commands`, log);
  }

  if (opencode && !check) {
    log("OpenCode:");
    const generated = join(root, ".opencode", "generated", "agents");
    rmSync(generated, { recursive: true, force: true });
    mkdirSync(generated, { recursive: true });
    for (const file of readdirSync(join(src, "agents")).filter((name) => name.endsWith(".md"))) {
      const text = readFileSync(join(src, "agents", file), "utf8");
      writeFileSync(join(generated, file), convertAgentForOpencode(text));
    }
    log("  + .opencode/generated/agents (gerado — não editar)");
    link(root, ".opencode/agent", "generated/agents", log);
    link(root, ".opencode/skills", `../${SRC}/skills`, log);
    if (hasCommands) link(root, ".opencode/command", `../${SRC}/commands`, log);
  }

  if (cursor && !check) {
    log("Cursor:");
    link(root, ".cursor/skills", `../${SRC}/skills`, log);
    if (hasCommands) link(root, ".cursor/commands", `../${SRC}/commands`, log);
    // Único caso de cópia: Cursor só lê regras com extensão .mdc. Só os arquivos que o
    // próprio sync gerou (listados no manifesto) são removidos; regras pessoais ficam.
    const rules = join(root, ".cursor", "rules");
    const manifest = join(rules, ".harness-generated");
    mkdirSync(rules, { recursive: true });
    const previous = existsSync(manifest) ? readFileSync(manifest, "utf8").split(/\r?\n/).filter(Boolean) : [];
    for (const file of previous) rmSync(join(rules, basename(file)), { force: true });
    const generated = [];
    for (const file of readdirSync(join(src, "rules")).filter((name) => name.endsWith(".md"))) {
      const name = `${basename(file, ".md")}.mdc`;
      writeFileSync(join(rules, name), readFileSync(join(src, "rules", file)));
      generated.push(name);
    }
    writeFileSync(manifest, `${generated.join("\n")}\n`);
    log("  + .cursor/rules/*.mdc (gerado — não editar)");
  }

  const canonicalPath = join(src, "mcp.json");
  if (existsSync(canonicalPath)) {
    log("MCP:");
    const canonicalText = readFileSync(canonicalPath, "utf8").replace(/\r\n/g, "\n");
    const canonical = JSON.parse(canonicalText);
    const projected = projectMcp(canonical);
    const options = { check, drift, log };
    writeGenerated(root, ".mcp.json", json(projected.claude), options);
    if (opencode || existsSync(join(root, "opencode.json"))) {
      writeGenerated(root, "opencode.json", json(projected.opencode), options);
    }
    if (cursor || existsSync(join(root, ".cursor", "mcp.json"))) {
      // Cursor lê o formato agnóstico: cópia fiel da fonte, sem reformatar.
      writeGenerated(root, ".cursor/mcp.json", canonicalText, options);
    }
  }

  if (check && drift.length > 0) {
    throw new Error(`Projeções desatualizadas: ${drift.join(", ")}. Rode node .agents/scripts/sync.mjs`);
  }
  if (!check) {
    log("");
    log("Codex: nada a fazer — lê AGENTS.md e .agents/skills direto.");
    log(`Fonte única: ${relative(root, src) || SRC}/ — ver .agents/AGENTS.md`);
  }
  return { drift };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const args = new Set(process.argv.slice(2));
  try {
    sync({
      check: args.has("--check"),
      withOpencode: args.has("--with-opencode"),
      withCursor: args.has("--with-cursor"),
    });
    if (args.has("--check")) console.log("Projeções em dia.");
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
