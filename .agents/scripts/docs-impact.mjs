#!/usr/bin/env node
// Diz quais documentos a mudança atual pode ter desatualizado, pelo mapa
// `docs_impact` de harness.yaml (glob → documentos). Usado pelo agente
// doc-sync-onboarding para decidir se precisa agir e onde.
//
//   node .agents/scripts/docs-impact.mjs              # compara com origin/<default_base>
//   node .agents/scripts/docs-impact.mjs --base HEAD~3
//   node .agents/scripts/docs-impact.mjs --strict     # falha se doc impactado não mudou
import { pathToFileURL } from "node:url";
import { asList, git, globToRegExp, loadHarness } from "./lib.mjs";

export function impactedDocs(changedFiles, mapping) {
  const rules = Object.entries(mapping ?? {}).map(([glob, docs]) => ({
    regex: globToRegExp(glob),
    docs: asList(docs),
  }));
  const changed = new Set(changedFiles);
  const impacts = new Map();
  for (const file of changedFiles) {
    for (const rule of rules) {
      if (!rule.regex.test(file)) continue;
      for (const doc of rule.docs) {
        if (doc === file) continue;
        if (!impacts.has(doc)) impacts.set(doc, { doc, touched: changed.has(doc), causes: [] });
        impacts.get(doc).causes.push(file);
      }
    }
  }
  return [...impacts.values()].sort((a, b) => a.doc.localeCompare(b.doc));
}

export function changedFiles(base) {
  const files = new Set();
  const committed = git(["diff", "--name-only", `${base}...HEAD`], { allowFailure: true });
  for (const line of (committed ?? "").split("\n")) if (line) files.add(line);
  const status = git(["status", "--porcelain", "--untracked-files=all"]) ?? "";
  for (const line of status.split("\n")) {
    if (!line.trim()) continue;
    const path = line.slice(3).split(" -> ").at(-1).replace(/^"|"$/g, "");
    files.add(path);
  }
  return [...files].map((file) => file.replace(/\\/g, "/"));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const args = process.argv.slice(2);
  const harness = loadHarness();
  const baseIndex = args.indexOf("--base");
  const base = baseIndex >= 0 ? args[baseIndex + 1] : `origin/${harness.git?.default_base ?? "main"}`;
  const impacts = impactedDocs(changedFiles(base), harness.docs_impact);
  if (impacts.length === 0) {
    console.log(`Nenhum documento mapeado é impactado pelas mudanças desde ${base}.`);
    process.exit(0);
  }
  console.log(`Documentos a conferir (mudanças desde ${base}):`);
  for (const impact of impacts) {
    const mark = impact.touched ? "✔ alterado" : "• revisar";
    const causes = impact.causes.slice(0, 3).join(", ") + (impact.causes.length > 3 ? ", …" : "");
    console.log(`  ${mark}  ${impact.doc}  ← ${causes}`);
  }
  const pending = impacts.filter((impact) => !impact.touched);
  if (args.includes("--strict") && pending.length > 0) process.exit(1);
}
