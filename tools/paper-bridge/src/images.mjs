import { readFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { readImages, writeImages, hash, imageStateDir, imageAssetDir, readImageFile, storeImageFile } from "./image-assets.mjs";
import { imageUI } from "./image-ui.mjs";
import { TEST_DOCUMENT, validateDocument } from "./policy.mjs";

const confirmationWindowMs = 15 * 60 * 1000;

function timeoutOption(value = 180000) {
  const timeout = Number(value);
  if (!Number.isSafeInteger(timeout) || timeout < 1000 || timeout > 600000) throw new Error("Timeout deve ser inteiro entre 1000 e 600000 ms.");
  return timeout;
}

async function generate(page, options, runtime, manifest) {
  const { ui, directory, now } = runtime;
  const kind = options.kind ?? "image";
  if (!["image", "svg"].includes(kind)) throw new Error("Use --kind image ou svg.");
  if (!options.promptFile) throw new Error("Informe --prompt-file com texto UTF-8.");
  const prompt = (await readFile(options.promptFile, "utf8")).trim();
  if (!prompt || prompt.length > 12000) throw new Error("Prompt deve ter entre 1 e 12000 caracteres.");
  const timeoutMs = timeoutOption(options.timeoutMs);
  const usage = metadata(options.usage, "teste");
  const controls = await ui.inspect(page, kind);
  const model = options.model ?? controls.model;
  const aspectRatio = options.aspectRatio ?? controls.aspectRatio;
  if (!controls.models.some(item => item.label === model && item.enabled)) throw new Error("Modelo ausente ou indisponível; execute image inspect.");
  if (/^Variety pack(?:\s|$)/i.test(model)) throw new Error("Conclusão de múltiplos resultados do Variety pack ainda não foi validada. Escolha um modelo individual de image inspect.");
  if (aspectRatio && !controls.aspectRatios.some(item => item.label === aspectRatio && item.enabled)) throw new Error("Proporção ausente ou indisponível; execute image inspect.");
  const parameters = { document: TEST_DOCUMENT, kind, prompt, model, aspectRatio: aspectRatio ?? null };
  const key = hash(JSON.stringify(parameters));
  const existing = manifest.assets.find(entry => entry.key === key);
  if (existing) {
    const result = await reuse(page, existing, ui);
    existing.usages = [...new Set([...existing.usages, usage])];
    await writeImages(manifest, directory);
    return result;
  }
  if (manifest.assets.some(entry => entry.status === "pending")) throw new Error("Importação anterior pendente; execute image validate antes de gerar.");
  const uncertain = manifest.requests.find(entry => entry.status === "submitted");
  if (uncertain) throw new Error("Geração anterior pendente; execute image validate e confira o canvas antes de qualquer nova submissão.");
  const capabilityHash = hash(JSON.stringify({ kind, models: controls.models.map(({ label, enabled }) => ({ label, enabled })), aspectRatios: controls.aspectRatios.map(({ label, enabled }) => ({ label, enabled })) }));
  let request = options.confirm ? manifest.requests.find(entry => entry.id === options.confirm) : null;
  if (options.confirm && (!request || request.status !== "prepared" || request.key !== key || request.capabilityHash !== capabilityHash
    || new Date(request.expiresAt).getTime() <= now().getTime())) throw new Error("Confirmação inválida, expirada ou parâmetros alterados. Prepare novamente sem --confirm.");
  await ui.prepare(page, parameters);
  if (!options.confirm) {
    request = { id: hash(randomUUID() + key), key, capabilityHash, parameters, status: "prepared", createdAt: now().toISOString(), expiresAt: new Date(now().getTime() + confirmationWindowMs).toISOString(), cost: "Desconhecido: pode consumir créditos; a disponibilidade no menu não comprova acesso gratuito." };
    manifest.requests = manifest.requests.filter(entry => entry.key !== key || entry.status !== "prepared");
    manifest.requests.push(request);
    await writeImages(manifest, directory);
    await ui.close(page);
    return { success: true, verified: false, confirmationRequired: true, action: "prepared", request };
  }
  request.before = await ui.snapshot(page);
  request.status = "submitted";
  request.submittedAt = now().toISOString();
  // Persistir ANTES do clique: falha/timeout não pode autorizar repetição de consumo.
  await writeImages(manifest, directory);
  const started = performance.now();
  try {
    await ui.submit(page, parameters);
    const nodes = await ui.wait(page, request.before, { timeoutMs, kind, expectedCount: 1 });
    if (!nodes.length) throw new Error("Geração sem imagem renderizada no canvas.");
    const entry = { key, document: TEST_DOCUMENT, origin: "paper-create-" + kind, parameters, nodes, status: "validated", createdAt: now().toISOString(), usages: [usage], requestId: request.id };
    manifest.assets.push(entry);
    request.status = "completed";
    request.elapsedMs = Math.round(performance.now() - started);
    await writeImages(manifest, directory);
    return { success: true, verified: true, action: "generated", asset: entry, waitMs: request.elapsedMs };
  } catch (error) {
    request.error = error.name === "TimeoutError" ? "Tempo de espera esgotado; confira o canvas e execute image validate." : error.message.split("\n")[0].replace(/https?:\/\/\S+/g, "[endereço omitido]");
    request.elapsedMs = Math.round(performance.now() - started);
    await writeImages(manifest, directory);
    throw new Error(request.error);
  }
}

async function reuse(page, entry, ui) {
  if (entry.status !== "validated") throw new Error("Importação anterior pendente; execute image validate e confira o canvas.");
  const nodes = await ui.verify(page, entry);
  if (!nodes.length) throw new Error("Imagem registrada removida ou alterada; confira o canvas antes de repetir.");
  return { success: true, verified: true, action: "reuse", asset: entry };
}

function metadata(value, fallback) {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !value.trim() || value.length > 300) throw new Error("Origem/utilização deve ser texto de até 300 caracteres.");
  return value.trim().replace(/https?:\/\/\S+/g, address => {
    try { const url = new URL(address); return url.origin + url.pathname; } catch { return "[origem]"; }
  });
}

async function importImage(page, options, runtime, manifest) {
  const source = await readImageFile(options.file);
  const timeoutMs = timeoutOption(options.timeoutMs ?? 15000);
  const usage = metadata(options.usage, "teste");
  const origin = { file: source.basename, attribution: metadata(options.source, "Arquivo local; licença não informada") };
  const key = hash("import:" + source.contentHash);
  const existing = manifest.assets.find(entry => entry.key === key);
  if (existing) {
    const result = await reuse(page, existing, runtime.ui);
    existing.usages = [...new Set([...existing.usages, usage])];
    await writeImages(manifest, runtime.directory);
    return result;
  }
  if (manifest.assets.some(entry => entry.status === "pending") || manifest.requests.some(entry => entry.status === "submitted")) throw new Error("Operação anterior pendente; execute image validate antes de importar.");
  const stored = await storeImageFile(source, runtime.assetDirectory);
  const entry = { key, document: TEST_DOCUMENT, contentHash: source.contentHash, file: stored.relative, origin, usages: [usage],
    status: "pending", before: await runtime.ui.snapshot(page), createdAt: runtime.now().toISOString(), nodes: [] };
  manifest.assets.push(entry);
  await writeImages(manifest, runtime.directory);
  const started = performance.now();
  try {
    await runtime.ui.importFile(page, stored.destination);
    entry.nodes = await runtime.ui.wait(page, entry.before, { timeoutMs, kind: source.extension === ".svg" ? "svg" : "image", expectedCount: 1 });
    if (entry.nodes.length !== 1) throw new Error("Importação sem camada única de imagem renderizada.");
    entry.status = "validated";
    delete entry.before;
    entry.elapsedMs = Math.round(performance.now() - started);
    await writeImages(manifest, runtime.directory);
    return { success: true, verified: true, action: "imported", asset: entry };
  } catch (error) {
    entry.elapsedMs = Math.round(performance.now() - started);
    entry.error = error.message.split("\n")[0].replace(/https?:\/\/\S+/g, "[endereço omitido]");
    await writeImages(manifest, runtime.directory);
    throw new Error(entry.error);
  }
}

async function validateImages(page, runtime, manifest) {
  const results = [];
  for (const entry of manifest.assets) {
    let verified = false, reason;
    if (entry.status !== "validated") reason = "Operação pendente; confira o canvas. Não repita a importação.";
    else {
      try {
        if (entry.file) {
          if (!/^(imported|svg)\/[a-f0-9]{64}\.(png|jpe?g|webp|svg)$/.test(entry.file)) throw new Error("Caminho de asset inválido.");
          if (hash(await readFile(path.join(runtime.assetDirectory, entry.file))) !== entry.contentHash) throw new Error("Conteúdo local alterado.");
        }
        verified = (await runtime.ui.verify(page, entry)).length === entry.nodes?.length && entry.nodes.length > 0;
        if (!verified) reason = "Camada ausente, imagem não carregada ou fingerprint alterado.";
      } catch { reason = "Asset local ausente, inválido ou alterado."; }
    }
    results.push({ key: entry.key, nodes: entry.nodes, verified, ...(reason ? { reason } : {}) });
  }
  const pending = manifest.requests.filter(request => request.status === "submitted").map(request => ({ id: request.id, submittedAt: request.submittedAt, error: request.error }));
  const verified = results.length > 0 && results.every(result => result.verified) && pending.length === 0;
  return { success: verified, verified, action: "validate", checked: results.length, results, pending,
    limitations: ["Estado pendente exige conferência manual do canvas e manifesto; nenhuma nova imagem é adotada automaticamente.", "Validação compara conteúdo local e DOM renderizado; não comprova licença nem igualdade por pixels."] };
}

export async function imageOperation(page, action, options = {}, overrides = {}) {
  validateDocument(options.document ?? TEST_DOCUMENT);
  const runtime = { ui: imageUI, directory: imageStateDir, assetDirectory: imageAssetDir, now: () => new Date(), ...overrides };
  if (action === "inspect") return { success: true, verified: true, controls: await runtime.ui.inspect(page, options.kind ?? "image"), reusableImages: await runtime.ui.media(page) };
  const manifest = await readImages(runtime.directory);
  if (action === "generate") return generate(page, options, runtime, manifest);
  if (action === "import") return importImage(page, options, runtime, manifest);
  if (action === "validate") return validateImages(page, runtime, manifest);
  throw new Error("Operação de imagem desconhecida.");
}
