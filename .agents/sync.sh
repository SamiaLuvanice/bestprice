#!/usr/bin/env bash
# Aponta cada ferramenta de IA para .agents/ — a fonte única.
# As pastas por ferramenta contêm symlinks; exceções geradas: .opencode/agent
# (frontmatter convertido), .cursor/rules/*.mdc e opencode.json.
#
#   bash .agents/sync.sh                  # Claude Code
#   bash .agents/sync.sh --with-opencode  # + OpenCode
#   bash .agents/sync.sh --with-cursor    # + Cursor (rules exigem .mdc: cópia gerada)
set -euo pipefail
# Git Bash (Windows): sem isto, "ln -s" faz cópia silenciosa em vez de link.
export MSYS=winsymlinks:nativestrict

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC=".agents"
WITH_CURSOR=0
WITH_OPENCODE=0
for arg in "$@"; do
  [[ "$arg" == "--with-cursor" ]] && WITH_CURSOR=1
  [[ "$arg" == "--with-opencode" ]] && WITH_OPENCODE=1
done

# Remove um link ou uma projeção gerada sem atravessar junctions do Windows.
remove_projection() {
  local path="$1"
  if [[ -L "$path" ]]; then
    rm "$path"
    return 0
  fi
  if [[ -e "$path" ]] && command -v cygpath >/dev/null 2>&1 && command -v powershell.exe >/dev/null 2>&1; then
    local winpath is_reparse
    winpath="$(cygpath -w "$path")"
    is_reparse="$(powershell.exe -NoProfile -Command "if ((Get-Item -LiteralPath '$winpath' -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) { '1' } else { '0' }" 2>/dev/null | tr -d '\r')"
    if [[ "$is_reparse" == "1" ]]; then
      powershell.exe -NoProfile -Command "Remove-Item -LiteralPath '$winpath' -Force"
      return 0
    fi
  fi
  [[ -e "$path" ]] && rm -rf "$path"
}

# link <caminho-do-link-relativo-à-raiz> <alvo-relativo-ao-link>
link() {
  local path="$ROOT/$1" target="$2"
  if [[ -L "$path" ]]; then
    [[ "$(readlink "$path")" == "$target" ]] && { echo "  = $1"; return; }
    remove_projection "$path"
  elif [[ -e "$path" ]]; then
    echo "  ! $1 era cópia — removendo"
    remove_projection "$path"
  fi
  mkdir -p "$(dirname "$path")"
  if ln -s "$target" "$path" 2>/dev/null; then
    echo "  + $1 -> $target"
  elif command -v cygpath >/dev/null 2>&1; then
    # Windows sem privilégio de symlink: junction de diretório (não exige admin)
    local abs; abs="$(cd "$(dirname "$path")" && cd "$target" && pwd)"
    powershell.exe -NoProfile -Command "New-Item -ItemType Junction -Path \"$(cygpath -w "$path")\" -Target \"$(cygpath -w "$abs")\" | Out-Null"
    echo "  + $1 => junction para $target"
  else
    echo "  ! não foi possível criar $1" >&2; return 1
  fi
}

# Claude Code descobre subagentes e skills só em .claude/{agents,skills}.
# Rules: o AGENTS.md da raiz lista os caminhos; o CLAUDE.md as importa com @.
echo "Claude Code:"
mkdir -p "$ROOT/.claude"
link ".claude/agents" "../$SRC/agents"
link ".claude/skills" "../$SRC/skills"
[[ -d "$ROOT/$SRC/commands" ]] && link ".claude/commands" "../$SRC/commands"
# CLAUDE.md da raiz é um arquivo de texto com `@AGENTS.md` (não é symlink: no Windows
# symlink exige privilégio, e o @import funciona igual).

# Converte o frontmatter dos agentes para o formato do OpenCode. As regras
# ficam em .opencode/generated/agents; .opencode/agent aponta para lá.
opencode_agents() {
  local src="$ROOT/$SRC/agents" gen="$ROOT/.opencode/generated/agents"
  mkdir -p "$gen"
  rm -f "$gen"/*.md
  local f
  for f in "$src"/*.md; do
    [[ -e "$f" ]] || continue
    awk '
      BEGIN { fm = 0; cr = "" }
      NR == 1 && $0 ~ /^---\r?$/ { fm = 1; cr = ($0 ~ /\r$/) ? "\r" : ""; print; next }
      fm == 1 && $0 ~ /^---\r?$/ { fm = 0; print; next }
      fm == 1 && $0 ~ /^[[:space:]]*tools[[:space:]]*:/ {
        line = $0
        sub(/\r$/, "", line)
        if (line ~ /^[[:space:]]*tools[[:space:]]*:[[:space:]]*$/) {
          print "tools: em formato objeto/multilinha nao suportado pelo sync" > "/dev/stderr"
          exit 2
        }
        print "permission:" cr
        print "  edit: deny" cr
        print "  bash: deny" cr
        print "  task: deny" cr
        print "  todowrite: deny" cr
        print "  webfetch: deny" cr
        print "  websearch: deny" cr
        next
      }
      { print }
    ' "$f" > "$gen/$(basename "$f")" || return 1
  done
  echo "  + .opencode/generated/agents (gerado — não editar)"
}

# OpenCode lê o AGENTS.md da raiz e .opencode/{agent,skills}.
if [[ $WITH_OPENCODE -eq 1 || -d "$ROOT/.opencode" ]]; then
  echo "OpenCode:"
  mkdir -p "$ROOT/.opencode"
  opencode_agents
  link ".opencode/agent" "generated/agents"
  link ".opencode/skills" "../$SRC/skills"
  [[ -d "$ROOT/$SRC/commands" ]] && link ".opencode/command" "../$SRC/commands"
fi

if [[ $WITH_CURSOR -eq 1 || -d "$ROOT/.cursor" ]]; then
  echo "Cursor:"
  link ".cursor/skills" "../$SRC/skills"
  [[ -d "$ROOT/$SRC/commands" ]] && link ".cursor/commands" "../$SRC/commands"
  cp "$ROOT/$SRC/mcp.json" "$ROOT/.cursor/mcp.json"
  echo "  + .cursor/mcp.json (gerado — não editar)"
  # Único caso de cópia no projeto: Cursor só lê regras com extensão .mdc.
  rm -rf "$ROOT/.cursor/rules"; mkdir -p "$ROOT/.cursor/rules"
  for f in "$ROOT/$SRC/rules"/*.md; do
    [[ -e "$f" ]] || continue
    cp "$f" "$ROOT/.cursor/rules/$(basename "${f%.md}").mdc"
    echo "  + .cursor/rules/$(basename "${f%.md}").mdc  (gerado — não editar)"
  done
fi

# MCP agnóstico: .agents/mcp.json é a fonte. Geramos o .mcp.json da raiz no formato
# mcpServers (lido por Claude e afins) e o bloco mcp do opencode.json, cujo formato
# é próprio do OpenCode. Claude exige "type": "http" em entradas com url e trata a
# ausência do campo como servidor stdio; por isso a projeção não é uma cópia.
project_mcp() {
  local canonical="$ROOT/$SRC/mcp.json"
  [[ -f "$canonical" ]] || return 0
  echo "MCP:"

  local py="" candidate
  for candidate in python3 python py; do
    if command -v "$candidate" >/dev/null 2>&1 && "$candidate" -c 'import sys' >/dev/null 2>&1; then
      py="$candidate"
      break
    fi
  done
  if [[ -z "$py" ]]; then
    echo "  ! Python 3 funcional não encontrado — .mcp.json e opencode.json não gerados" >&2
    return 0
  fi
  MCP_SRC="$canonical" MCP_CLAUDE_OUT="$ROOT/.mcp.json" MCP_OPENCODE_OUT="$ROOT/opencode.json" "$py" - <<'PY'
import json, os, re
with open(os.environ["MCP_SRC"], encoding="utf-8") as f:
    data = json.load(f)
claude = {}
mcp = {}
for name, srv in (data.get("mcpServers") or {}).items():
    if srv.get("url"):
        claude_entry = {"type": "http", "url": srv["url"]}
        if srv.get("headers"):
            claude_entry["headers"] = dict(srv["headers"])
        entry = {"type": "remote", "url": srv["url"], "enabled": srv.get("disabled") is not True}
        if srv.get("headers"):
            entry["headers"] = {
                key: re.sub(r"\$\{([A-Za-z_][A-Za-z0-9_]*)\}", r"{env:\1}", value)
                for key, value in srv["headers"].items()
            }
            entry["oauth"] = False
    else:
        claude_entry = {"command": srv["command"]}
        if srv.get("args"):
            claude_entry["args"] = list(srv["args"])
        if srv.get("env"):
            claude_entry["env"] = srv["env"]
        command = [srv["command"]] + list(srv.get("args") or [])
        entry = {"type": "local", "command": command, "enabled": srv.get("disabled") is not True}
        if srv.get("env"):
            entry["environment"] = srv["env"]
    claude[name] = claude_entry
    mcp[name] = entry
with open(os.environ["MCP_CLAUDE_OUT"], "w", encoding="utf-8") as f:
    json.dump({"mcpServers": claude}, f, indent=2, ensure_ascii=False)
    f.write("\n")
with open(os.environ["MCP_OPENCODE_OUT"], "w", encoding="utf-8") as f:
    json.dump({"$schema": "https://opencode.ai/config.json", "mcp": mcp}, f, indent=2, ensure_ascii=False)
    f.write("\n")
PY
  echo "  + .mcp.json (gerado — não editar)"
  echo "  + opencode.json (gerado — não editar)"
}

project_mcp

echo
echo "Codex: nada a fazer — lê AGENTS.md e .agents/skills direto."
echo "Fonte única: .agents/ — ver .agents/AGENTS.md"
