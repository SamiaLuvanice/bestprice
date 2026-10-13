#!/usr/bin/env bash
# Aponta cada ferramenta de IA para .agents/ — a fonte única.
# Nada é copiado: as pastas por ferramenta contêm apenas symlinks
# (e a config exclusiva da ferramenta, ex.: .claude/settings.local.json).
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

# link <caminho-do-link-relativo-à-raiz> <alvo-relativo-ao-link>
link() {
  local path="$ROOT/$1" target="$2"
  if [[ -L "$path" ]]; then
    [[ "$(readlink "$path")" == "$target" ]] && { echo "  = $1"; return; }
    rm "$path"
  elif [[ -e "$path" ]]; then
    echo "  ! $1 era cópia — removendo"
    rm -rf "$path"
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

# OpenCode lê o AGENTS.md da raiz e .opencode/{agent,skills}.
if [[ $WITH_OPENCODE -eq 1 || -d "$ROOT/.opencode" ]]; then
  echo "OpenCode:"
  mkdir -p "$ROOT/.opencode"
  link ".opencode/agent" "../$SRC/agents"
  link ".opencode/skills" "../$SRC/skills"
  [[ -d "$ROOT/$SRC/commands" ]] && link ".opencode/command" "../$SRC/commands"
fi

if [[ $WITH_CURSOR -eq 1 || -d "$ROOT/.cursor" ]]; then
  echo "Cursor:"
  link ".cursor/skills" "../$SRC/skills"
  [[ -d "$ROOT/$SRC/commands" ]] && link ".cursor/commands" "../$SRC/commands"
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
# é próprio do OpenCode.
project_mcp() {
  local canonical="$ROOT/$SRC/mcp.json"
  [[ -f "$canonical" ]] || return 0
  echo "MCP:"
  cp "$canonical" "$ROOT/.mcp.json"
  echo "  + .mcp.json (gerado — não editar)"

  local py=""
  command -v python3 >/dev/null 2>&1 && py=python3
  [[ -z "$py" ]] && command -v python >/dev/null 2>&1 && py=python
  if [[ -z "$py" ]]; then
    echo "  ! python3/python não encontrado — opencode.json não gerado" >&2
    return 0
  fi
  MCP_SRC="$canonical" MCP_OUT="$ROOT/opencode.json" "$py" - <<'PY'
import json, os
with open(os.environ["MCP_SRC"], encoding="utf-8") as f:
    data = json.load(f)
mcp = {}
for name, srv in (data.get("mcpServers") or {}).items():
    command = [srv["command"]] + list(srv.get("args") or [])
    entry = {"type": "local", "command": command, "enabled": srv.get("disabled") is not True}
    if srv.get("env"):
        entry["environment"] = srv["env"]
    mcp[name] = entry
config = {"$schema": "https://opencode.ai/config.json", "mcp": mcp}
with open(os.environ["MCP_OUT"], "w", encoding="utf-8") as f:
    json.dump(config, f, indent=2, ensure_ascii=False)
    f.write("\n")
PY
  echo "  + opencode.json (gerado — não editar)"
}

project_mcp

echo
echo "Codex: nada a fazer — lê AGENTS.md e .agents/skills direto."
echo "Fonte única: .agents/ — ver .agents/AGENTS.md"
