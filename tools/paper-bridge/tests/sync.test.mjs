import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { planSync, readManifest, writeManifest } from "../src/manifest.mjs";
test("sync reutiliza versão idêntica somente se o canvas ainda coincide", () => {
  const previous = { status: "synced", sourceHash: "source-a", fingerprint: "canvas-a", version: 1 };
  assert.equal(planSync({ previous, sourceHash: "source-a", fingerprint: "canvas-a" }).action, "reuse");
  assert.throws(() => planSync({ previous, sourceHash: "source-a", fingerprint: "edited" }), /conflito/i);
});

test("manifesto de telas é persistido por troca atômica e não apaga estado inválido", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "paper-bridge-manifest-"));
  try {
    const initial = await readManifest(directory);
    assert.deepEqual(initial, { schemaVersion: 1, screens: {} });
    const pending = { version: 1, status: "pending", sourceHash: "a".repeat(64), rootName: "BestPrice IA - dashboard - desktop - v1", paperNodeId: null, fingerprint: null };
    await writeManifest({ schemaVersion: 1, screens: { "dashboard:desktop": pending } }, directory);
    assert.deepEqual(await readManifest(directory), { schemaVersion: 1, screens: { "dashboard:desktop": pending } });
    await writeManifest({ schemaVersion: 1, screens: { "dashboard:desktop": { ...pending, status: "synced", paperNodeId: "1-0", fingerprint: "b".repeat(64) } } }, directory);
    assert.equal((await readManifest(directory)).screens["dashboard:desktop"].status, "synced");
    const corrupt = '{"schemaVersion":1,"screens":[]}';
    await writeFile(path.join(directory, "manifest.json"), corrupt);
    await assert.rejects(readManifest(directory), /Manifesto inválido/i);
    assert.equal(await readFile(path.join(directory, "manifest.json"), "utf8"), corrupt);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
test("mudanças e operações interrompidas não substituem nem duplicam automaticamente", () => {
  const previous = { status: "synced", sourceHash: "source-a", fingerprint: "canvas-a", version: 2 };
  assert.throws(() => planSync({ previous, sourceHash: "source-b", fingerprint: "canvas-a" }), /nova versão/i);
  assert.equal(planSync({ previous, sourceHash: "source-b", newVersion: true }).version, 3);
  assert.throws(() => planSync({ previous: { ...previous, status: "pending" }, sourceHash: "source-a" }), /interrompida/i);
  assert.throws(() => planSync({ previous: { ...previous, status: "pending" }, sourceHash: "source-b", newVersion: true }), /interrompida/i);
});
