import test from "node:test";
import assert from "node:assert/strict";
import { main } from "../src/cli.mjs";
import { frameOptions } from "../src/frames.mjs";
import { textOptions } from "../src/text.mjs";
import { loadDesignSystem, resolveColor } from "../src/design-system.mjs";
import { screenOptions } from "../src/composition.mjs";
import { acquireLock } from "../src/logger.mjs";
import { runOperation } from "../src/bridge.mjs";
import { createScreen } from "../src/composition.mjs";

test("CLI retorna erro JSON e exit 1 para argumentos ou comandos desconhecidos", async () => {
  for (const args of [["remove-all"], ["status", "--unknown"], ["status", "--document", "BestPriceIA"], ["status", "--endpoint", "http://example.com:9222"]]) {
    const output = [];
    assert.equal(await main(args, value => output.push(value)), 1);
    assert.equal(output.length, 1);
    assert.equal(output[0].success, false);
    assert.equal(output[0].verified, false);
  }
});
test("geometria e texto inválidos são recusados antes da edição", () => {
  for (const options of [{ width: 0 }, { height: -1 }, { x: Infinity }, { width: "100x" }, { name: "" }]) assert.throws(() => frameOptions(options));
  for (const options of [{ text: "" }, { text: "Título", fontWeight: 333 }, { text: "Título", fontSize: NaN }, { text: "Título", y: -1 }]) assert.throws(() => textOptions(options));
});
test("composição valida todos os componentes e nomes antes de desenhar", async () => {
  const ds = await loadDesignSystem();
  assert.throws(() => resolveColor(ds, "invented"), /desconhecido/);
  assert.throws(() => resolveColor(ds, "__proto__"), /desconhecido/);
  assert.throws(() => screenOptions(ds, { components: [{ type: "text", text: "Título" }, { type: "sidebar" }] }), /sem conversão comprovada/);
  assert.throws(() => screenOptions(ds, { components: [{ type: "text", text: "Título" }, { type: "text", text: "Título" }] }), /duplicados/);
  assert.throws(() => screenOptions(ds, { width: 100, components: [{ type: "text", text: "Título", x: 120 }] }), /fora/);
});
test("falhas de finalização preservam observação e retornam erro estruturado", async () => {
  const fail = async () => { throw new Error("erro externo"); };
  const result = await runOperation("status", {}, {
    acquireLock: async () => fail, loadDesignSystem: async () => ({}),
    connect: async () => ({ page: { title: async () => "BestPrice Bridge Test · Paper" }, disconnect: fail }),
    beginReport: async () => ({}), finishReport: fail,
  });
  assert.equal(result.success, false);
  assert.equal(result.operation, "status");
  assert.equal(result.evidence.title, "BestPrice Bridge Test · Paper");
  assert.equal(result.limitations.length, 3);
});
test("composição registra etapas concluídas quando o componente falha", async () => {
  const ds = await loadDesignSystem();
  const result = await createScreen({}, ds, { components: [{ type: "text", text: "Título" }] }, {
    configureFrame: async () => ({ success: true, verified: true, evidence: { id: "frame-real-observado" } }),
    addText: async () => { throw new Error("controle indisponível"); },
  });
  assert.equal(result.verified, false);
  assert.equal(result.evidence.components[0].evidence.id, "frame-real-observado");
  assert.equal(result.evidence.components[1].element, "Título");
  assert.equal(result.evidence.components[1].verified, false);
});
test("lock impede comandos concorrentes e libera após finalizar", async () => {
  const release = await acquireLock();
  try { await assert.rejects(acquireLock(), /ocupada/); }
  finally { await release(); }
  const nextRelease = await acquireLock();
  await nextRelease();
});
