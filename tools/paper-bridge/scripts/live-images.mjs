// Ensaio opt-in: importa apenas fixtures locais no documento de teste. Não gera com IA.
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { runOperation } from "../src/bridge.mjs";
import { reportsDir } from "../src/logger.mjs";

const fixtures = path.join(reportsDir, "image-fixtures");
await mkdir(fixtures, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  for (const [extension, mime] of [["png", "image/png"], ["jpg", "image/jpeg"], ["webp", "image/webp"]]) {
    const data = await page.evaluate(({ mime, extension }) => {
      const canvas = document.createElement("canvas"); canvas.width = 96; canvas.height = 96;
      const context = canvas.getContext("2d"); context.fillStyle = "#FCE7F4"; context.fillRect(0, 0, 96, 96);
      context.fillStyle = "#C7005E"; context.fillRect(20, 32, 56, 42);
      context.fillStyle = "#FFFFFF"; context.font = "16px sans-serif"; context.fillText(extension, 26, 57);
      return canvas.toDataURL(mime).split(",")[1];
    }, { mime, extension });
    await writeFile(path.join(fixtures, "basket." + extension), Buffer.from(data, "base64"));
  }
} finally { await browser.close(); }

const results = [];
const inspect = await runOperation("image-inspect");
assert.equal(inspect.success, true, inspect.error);
results.push({ operation: "inspect", controls: inspect.controls });
const svgInspect = await runOperation("image-inspect", { kind: "svg" });
assert.equal(svgInspect.success, true, svgInspect.error);
results.push({ operation: "inspect-svg", controls: svgInspect.controls });
for (const file of [fileURLToPath(new URL("../examples/basket.svg", import.meta.url)), ...["png", "jpg", "webp"].map(extension => path.join(fixtures, "basket." + extension))]) {
  const imported = await runOperation("image-import", { file, source: "Fixture local criada por código", usage: "ensaio spec 0037" });
  assert.equal(imported.success, true, imported.error);
  assert.equal(imported.verified, true);
  const reused = await runOperation("image-import", { file, usage: "reutilização no ensaio" });
  assert.equal(reused.action, "reuse", reused.error);
  assert.deepEqual(reused.asset.nodes, imported.asset.nodes);
  results.push({ file: path.basename(file), action: imported.action, reused: reused.action, nodes: imported.asset.nodes });
  console.log(JSON.stringify(results.at(-1)));
}
const validated = await runOperation("image-validate");
assert.equal(validated.verified, true, JSON.stringify(validated));
results.push(validated);
await writeFile(path.join(reportsDir, "live-images.json"), JSON.stringify(results, null, 2));
console.log(JSON.stringify({ verified: true, checked: validated.checked, report: path.join(reportsDir, "live-images.json") }));
