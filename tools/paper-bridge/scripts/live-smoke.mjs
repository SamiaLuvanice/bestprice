import assert from "node:assert/strict";
import { createPaper } from "../src/bridge.mjs";

// Opt-in: este teste altera somente BestPrice Bridge Test; não remove camadas.
const paper = createPaper();
async function checked(result) {
  console.log(JSON.stringify(result));
  assert.equal(result.success, true);
  assert.equal(result.verified, true);
  return result;
}
await checked(await paper.status());
const first = await checked(await paper.createFrame({ name: "BestPrice IA - Frame Creation", width: 320, height: 200, x: 0, y: 1100, background: "card" }));
const second = await checked(await paper.createFrame({ name: "BestPrice IA - Frame Creation", width: 320, height: 200, x: 0, y: 1100, background: "card" }));
assert.equal(first.evidence.id, second.evidence.id);
await checked(await paper.createScreen({ name: "BestPrice IA - CLI Smoke", width: 640, height: 360, x: 1600, components: [
  { type: "text", name: "CLI Smoke - Title", text: "BestPrice IA", x: 40, y: 32, fontSize: 32, fontWeight: 700, color: "primary" },
] }));
await checked(await paper.addText({ name: "CLI Smoke - Title", parent: "BestPrice IA - CLI Smoke", text: "BestPrice IA — teste", x: 40, y: 32, fontSize: 32, fontWeight: 700, color: "primary" }));
await checked(await paper.addText({ name: "CLI Smoke - Title", parent: "BestPrice IA - CLI Smoke", text: "BestPrice IA", x: 40, y: 32, fontSize: 32, fontWeight: 700, color: "primary" }));
await checked(await paper.validate());
const text = { parent: "BestPrice IA - Dashboard", text: "BestPrice IA", x: 80, y: 64, fontSize: 48, fontWeight: 700, color: "primary" };
const beforeText = await checked(await paper.addText(text));
const afterText = await checked(await paper.addText(text));
assert.equal(beforeText.evidence.id, afterText.evidence.id);
await checked(await paper.validate(text));
await checked(await paper.screenshot());
