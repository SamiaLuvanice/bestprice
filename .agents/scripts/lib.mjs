// Utilitários compartilhados pelos scripts do harness. Sem dependências externas:
// roda com Node >= 20 em qualquer sistema e em qualquer projeto que siga .agents/.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

function parseScalar(raw) {
  const value = raw.trim();
  if (value === "") return null;
  if (value.startsWith("[") && value.endsWith("]")) {
    const inner = value.slice(1, -1).trim();
    return inner === "" ? [] : splitInline(inner).map(parseScalar);
  }
  if (/^".*"$/.test(value)) return JSON.parse(value);
  if (/^'.*'$/.test(value)) return value.slice(1, -1).replace(/''/g, "'");
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null" || value === "~") return null;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  return value;
}

function splitInline(text) {
  const parts = [];
  let current = "";
  let quote = null;
  for (const char of text) {
    if (quote) {
      current += char;
      if (char === quote) quote = null;
    } else if (char === '"' || char === "'") {
      quote = char;
      current += char;
    } else if (char === ",") {
      parts.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts.map((part) => part.trim());
}

function stripComment(line) {
  let quote = null;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (quote) {
      if (char === quote) quote = null;
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === "#" && (i === 0 || /\s/.test(line[i - 1]))) {
      return line.slice(0, i);
    }
  }
  return line;
}

/**
 * Lê o subconjunto de YAML usado pelo harness: mapas por indentação, escalares,
 * listas inline ([a, b]) e listas em bloco de escalares (- item). Não cobre
 * âncoras, multilinhas nem listas de mapas — mantenha harness.yaml simples.
 */
export function parseYaml(text) {
  const root = {};
  const stack = [{ indent: -1, container: root }];
  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = stripComment(lines[index]).replace(/\s+$/, "");
    if (line.trim() === "") continue;
    const indent = line.length - line.trimStart().length;
    const content = line.trim();
    while (stack.length > 1 && indent <= stack.at(-1).indent) stack.pop();
    const parent = stack.at(-1);

    if (content.startsWith("- ")) {
      if (!Array.isArray(parent.container)) {
        throw new Error(`YAML: item de lista sem chave na linha ${index + 1}`);
      }
      parent.container.push(parseScalar(content.slice(2)));
      continue;
    }

    const match = content.match(/^("[^"]*"|'[^']*'|[^:]+?)\s*:(?:\s+(.*))?$/);
    if (!match) throw new Error(`YAML: linha inválida ${index + 1}: ${content}`);
    const key = parseScalar(match[1]);
    if (Array.isArray(parent.container)) {
      throw new Error(`YAML: mapa dentro de lista não suportado (linha ${index + 1})`);
    }
    const rest = match[2];
    if (rest !== undefined && rest.trim() !== "") {
      parent.container[key] = parseScalar(rest);
      continue;
    }
    const next = lines.slice(index + 1).find((candidate) => stripComment(candidate).trim() !== "");
    const isList = next !== undefined && stripComment(next).trim().startsWith("- ");
    const child = isList ? [] : {};
    parent.container[key] = child;
    stack.push({ indent, container: child });
  }
  return root;
}

export function loadHarness(root = ROOT) {
  const path = join(root, "harness.yaml");
  if (!existsSync(path)) throw new Error(`harness.yaml não encontrado em ${root}`);
  return parseYaml(readFileSync(path, "utf8"));
}

export function git(args, { cwd = ROOT, allowFailure = false } = {}) {
  try {
    return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch (error) {
    if (allowFailure) return null;
    throw error;
  }
}

/** Converte um glob simples (**, *, ?) em RegExp ancorada sobre caminhos com "/". */
export function globToRegExp(glob) {
  let source = "";
  for (let i = 0; i < glob.length; i += 1) {
    const char = glob[i];
    if (char === "*") {
      if (glob[i + 1] === "*") {
        const slash = glob[i + 2] === "/";
        source += slash ? "(?:.*/)?" : ".*";
        i += slash ? 2 : 1;
      } else {
        source += "[^/]*";
      }
    } else if (char === "?") {
      source += "[^/]";
    } else {
      source += char.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    }
  }
  return new RegExp(`^${source}$`);
}

export function asList(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}
