#!/usr/bin/env node
// Roda os portões de qualidade declarados em harness.yaml (seção quality), na ordem.
// Convenção agnóstica de stack: chave `[<escopo>_]<etapa>_command`; o diretório do
// escopo vem de `profile.<escopo>_dir` (sem escopo, roda na raiz).
//
//   node .agents/scripts/gates.mjs                    # todos
//   node .agents/scripts/gates.mjs --skip-install     # pula *_install_command
//   node .agents/scripts/gates.mjs --only lint,test   # filtra etapas
//   node .agents/scripts/gates.mjs --scope frontend   # filtra escopos
//   node .agents/scripts/gates.mjs --list             # só mostra o plano
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { ROOT, loadHarness } from "./lib.mjs";

export function planGates(harness, { skipInstall = false, only = [], scopes = [] } = {}) {
  const profile = harness.profile ?? {};
  const plan = [];
  for (const [key, command] of Object.entries(harness.quality ?? {})) {
    const match = key.match(/^(?:([a-z0-9]+)_)?([a-z0-9]+)_command$/);
    if (!match || !command) continue;
    const [, scope = "", step] = match;
    if (skipInstall && step === "install") continue;
    if (only.length > 0 && !only.includes(step)) continue;
    if (scopes.length > 0 && !scopes.includes(scope)) continue;
    const dir = scope ? (profile[`${scope}_dir`] ?? scope) : ".";
    plan.push({ name: scope ? `${scope}:${step}` : step, step, dir, command: String(command) });
  }
  return plan;
}

function parseArgs(argv) {
  const options = { skipInstall: false, only: [], scopes: [], list: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--skip-install") options.skipInstall = true;
    else if (arg === "--list") options.list = true;
    else if (arg === "--only") options.only = (argv[++i] ?? "").split(",").filter(Boolean);
    else if (arg === "--scope") options.scopes = (argv[++i] ?? "").split(",").filter(Boolean);
    else throw new Error(`argumento desconhecido: ${arg}`);
  }
  return options;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const options = parseArgs(process.argv.slice(2));
  const plan = planGates(loadHarness(), options);
  if (plan.length === 0) {
    console.error("Nenhum portão selecionado em harness.yaml (quality).");
    process.exit(1);
  }
  if (options.list) {
    for (const gate of plan) console.log(`${gate.name}\t(${gate.dir})\t${gate.command}`);
    process.exit(0);
  }
  const results = [];
  for (const gate of plan) {
    console.log(`\n▶ ${gate.name} (${gate.dir}): ${gate.command}`);
    const started = Date.now();
    const run = spawnSync(gate.command, { cwd: join(ROOT, gate.dir), shell: true, stdio: "inherit" });
    const ok = run.status === 0;
    results.push({ ...gate, ok, seconds: ((Date.now() - started) / 1000).toFixed(1) });
    if (!ok && gate.step === "install") break; // sem dependências, os demais não têm valor
  }
  console.log("\nResumo dos portões:");
  for (const result of results) {
    console.log(`  ${result.ok ? "✔" : "✘"} ${result.name.padEnd(22)} ${result.seconds}s`);
  }
  const skipped = plan.length - results.length;
  if (skipped > 0) console.log(`  … ${skipped} portão(ões) não executado(s) após falha na instalação`);
  process.exit(results.every((result) => result.ok) && skipped === 0 ? 0 : 1);
}
