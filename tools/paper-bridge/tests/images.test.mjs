import test from "node:test";
import assert from "node:assert/strict";
import { main } from "../src/cli.mjs";
import { imageOperation } from "../src/images.mjs";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { readImages, readImageFile, validateSvg, writeImages } from "../src/image-assets.mjs";

test("CLI anuncia comandos de imagem e confirmação específica", async () => {
  const output = [];
  assert.equal(await main(["help"], value => output.push(value)), 0);
  assert.ok(output[0].commands.includes("image inspect"));
  assert.ok(output[0].options.includes("--confirm"));
});

test("importação SVG sem créditos registra origem/utilização e reutiliza; conflito não duplica", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "paper-image-import-"));
  try {
    const file = path.join(directory, "basket.svg");
    await writeFile(file, '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#c7005e"/></svg>');
    let imports = 0, changed = false;
    const runtime = { directory, assetDirectory: path.join(directory, "assets"), ui: {
      snapshot: async () => [],
      importFile: async () => { imports++; },
      wait: async () => [{ id: "svg-1", media: "svg", fingerprint: "f".repeat(64) }],
      verify: async (_page, entry) => changed ? [] : entry.nodes,
    } };
    const imported = await imageOperation({}, "import", { file, source: "Criado por código", usage: "hero" }, runtime);
    assert.equal(imported.verified, true);
    assert.equal(imported.asset.origin.attribution, "Criado por código");
    assert.deepEqual(imported.asset.usages, ["hero"]);
    assert.match(imported.asset.file, /^svg\/[a-f0-9]{64}\.svg$/);
    assert.equal((await imageOperation({}, "import", { file, usage: "comparador" }, runtime)).action, "reuse");
    assert.equal(imports, 1);
    assert.deepEqual((await readImages(directory)).assets[0].usages, ["hero", "comparador"]);
    changed = true;
    await assert.rejects(imageOperation({}, "import", { file }, runtime), /alterada/i);
    assert.equal(imports, 1);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("validate confere conteúdo local e camada; manifesto vazio não passa como validado", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "paper-image-validate-"));
  try {
    const empty = await imageOperation({}, "validate", {}, { directory });
    assert.equal(empty.verified, false);
    assert.equal(empty.success, false);
    assert.equal(empty.checked, 0);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("geração prepara pedido revisável sem submeter; confirmação só autoriza aquele pedido", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "paper-images-"));
  try {
    const promptFile = path.join(directory, "hero.txt");
    await writeFile(promptFile, "Uma cesta de compras verde sobre fundo claro.");
    let submissions = 0;
    const ui = {
      inspect: async () => ({ kind: "image", model: "Test model", aspectRatio: "1:1", models: [{ label: "Test model", enabled: true }], aspectRatios: [{ label: "1:1", enabled: true }] }),
      prepare: async () => {},
      snapshot: async () => [],
      submit: async () => { submissions++; },
      wait: async () => [{ id: "new-image", fingerprint: "a".repeat(64), media: "image" }],
      verify: async (_page, entry) => entry.nodes,
      close: async () => {},
    };
    const runtime = { directory, ui, now: () => new Date("2026-10-28T12:00:00Z") };
    const prepared = await imageOperation({}, "generate", { promptFile }, runtime);
    assert.equal(prepared.confirmationRequired, true);
    assert.equal(prepared.verified, false);
    assert.match(prepared.request.id, /^[a-f0-9]{64}$/);
    assert.equal(submissions, 0);
    const generated = await imageOperation({}, "generate", { promptFile, confirm: prepared.request.id }, runtime);
    assert.equal(generated.verified, true);
    assert.equal(submissions, 1);
    const reused = await imageOperation({}, "generate", { promptFile }, runtime);
    assert.equal(reused.action, "reuse");
    assert.equal(submissions, 1);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("prompt alterado, confirmação vencida e modelo indisponível nunca submetem; timeout bloqueia repetição", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "paper-image-safety-"));
  try {
    const promptFile = path.join(directory, "hero.txt");
    await writeFile(promptFile, "Cesta rosa");
    let submissions = 0;
    const ui = {
      inspect: async () => ({ model: "Test model", models: [{ label: "Test model", enabled: true }, { label: "Paid model", enabled: false }, { label: "Variety pack Model A, Model B", enabled: true }], aspectRatio: "1:1", aspectRatios: [{ label: "1:1", enabled: true }] }),
      prepare: async () => {}, close: async () => {}, snapshot: async () => [],
      submit: async () => { submissions++; },
      wait: async () => { throw new Error("Tempo de espera esgotado"); },
    };
    let instant = new Date("2026-10-28T12:00:00Z");
    const runtime = { directory, ui, now: () => instant };
    const prepared = await imageOperation({}, "generate", { promptFile }, runtime);
    await writeFile(promptFile, "Cesta azul");
    await assert.rejects(imageOperation({}, "generate", { promptFile, confirm: prepared.request.id }, runtime), /Confirmação inválida/);
    await writeFile(promptFile, "Cesta rosa");
    instant = new Date("2026-10-28T12:15:00Z");
    await assert.rejects(imageOperation({}, "generate", { promptFile, confirm: prepared.request.id }, runtime), /expirada/);
    await assert.rejects(imageOperation({}, "generate", { promptFile, model: "Paid model" }, runtime), /indisponível/);
    await assert.rejects(imageOperation({}, "generate", { promptFile, aspectRatio: "99:1" }, runtime), /Proporção/);
    await assert.rejects(imageOperation({}, "generate", { promptFile, model: "Variety pack Model A, Model B" }, runtime), /múltiplos resultados/);
    assert.equal(submissions, 0);
    const fresh = await imageOperation({}, "generate", { promptFile }, runtime);
    await assert.rejects(imageOperation({}, "generate", { promptFile, confirm: fresh.request.id }, runtime), /esgotado/);
    await assert.rejects(imageOperation({}, "generate", { promptFile, confirm: fresh.request.id }, runtime), /pendente/);
    assert.equal(submissions, 1);
    const state = await readImages(directory);
    assert.equal(state.requests.at(-1).status, "submitted");
    assert.match(state.requests.at(-1).error, /esgotado/);
    assert.equal((await imageOperation({}, "validate", {}, runtime)).pending.length, 1);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("arquivos inválidos, SVG ativo/externo e manifesto corrompido são recusados", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "paper-image-files-"));
  try {
    for (const extension of ["png", "jpg", "webp", "gif"]) {
      const file = path.join(directory, "fake." + extension);
      await writeFile(file, "não é uma imagem");
      await assert.rejects(readImageFile(file), /Conteúdo incompatível|não suportado/);
    }
    for (const body of ['<script>alert(1)</script>', '<image href="https://example.com/x.png"/>', '<rect onclick="alert(1)"/>', '<rect style="fill:url(https://example.com)"/>', '<use href="https://example.com/a.svg#x"/>', '<g></svg>']) {
      assert.throws(() => validateSvg('<svg xmlns="http://www.w3.org/2000/svg">' + body + '</svg>'), /SVG|suportado|externo/);
    }
    await writeFile(path.join(directory, "images.json"), '{"schemaVersion":1,"assets":{},"requests":[]}');
    await assert.rejects(readImages(directory), /inválido/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("validação detecta asset local adulterado mesmo com camada válida", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "paper-image-tamper-"));
  try {
    const key = "a".repeat(64), file = "svg/" + key + ".svg";
    const { mkdir } = await import("node:fs/promises");
    await mkdir(path.join(directory, "svg"));
    await writeFile(path.join(directory, file), "alterado");
    await writeImages({ schemaVersion: 1, requests: [], assets: [{ key, file, contentHash: key, nodes: [{ id: "svg-1", fingerprint: key }], status: "validated" }] }, directory);
    const result = await imageOperation({}, "validate", {}, { directory, assetDirectory: directory, ui: { verify: async (_page, entry) => entry.nodes } });
    assert.equal(result.verified, false);
    assert.equal(result.checked, 1);
    assert.match(result.results[0].reason, /alterado/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
