import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir, writeFile } from "node:fs/promises";
import { generateScreen } from "./generator.mjs";
import { TEST_DOCUMENT } from "./policy.mjs";
import { readManifest, writeManifest, planSync, hash } from "./manifest.mjs";
import { layers, selectLayerById } from "./editor.mjs";
import { zoomToSelection } from "./canvas.mjs";
import { reportsDir } from "./logger.mjs";

const execFileAsync = promisify(execFile);
const clipboardScript = fileURLToPath(new URL("../scripts/set-html-clipboard.ps1", import.meta.url));
const validScreen = /^[a-z0-9-]{1,48}$/;

function htmlWithRootName(html, name) {
  const renamed = html.replace(/^(<[^>]+\slayer-name=")[^"]+(")/, "$1" + name + "$2");
  if (renamed === html) throw new Error("HTML gerado não possui identificador de camada raiz.");
  return renamed;
}

async function setClipboard(htmlPath) {
  if (process.platform !== "win32") throw new Error("Importação HTML automatizada requer o clipboard público do Windows.");
  await execFileAsync("powershell.exe", ["-NoProfile", "-STA", "-File", clipboardScript, "-HtmlPath", htmlPath], { windowsHide: true, timeout: 10000, maxBuffer: 1024 * 1024 });
}

async function renderedFingerprint(page, id) {
  return page.locator(".paper-camera [data-node-id]").evaluateAll((nodes, rootId) => {
    const root = nodes.find(node => node.getAttribute("data-node-id") === rootId);
    if (!root) return null;
    const descendants = [root, ...root.querySelectorAll("[data-node-id]")];
    return descendants.map(node => {
      const style = getComputedStyle(node);
      return {
        id: node.getAttribute("data-node-id"), text: node.textContent?.replace(/\s+/g, " ").trim() ?? "",
        width: style.width, height: style.height, x: style.left, y: style.top,
        background: style.backgroundColor, color: style.color, font: style.font,
      };
    });
  }, id).then(nodes => nodes ? hash(JSON.stringify(nodes)) : null);
}

async function findVisibleRoot(page, name) {
  const rows = await layers(page);
  const matches = rows.filter(row => row.name === name);
  if (matches.length > 1) throw new Error("Nome de frame duplicado sem manifesto; inspecione o canvas antes de sincronizar.");
  if (!matches.length) return null;
  const id = matches[0].id;
  const exists = await page.locator(".paper-camera [data-node-id]").evaluateAll((nodes, nodeId) => nodes.some(node => node.getAttribute("data-node-id") === nodeId), id);
  return exists ? { id } : null;
}

async function expandPathToLayer(page, id) {
  const chain = await page.locator(".paper-camera [data-node-id]").evaluateAll((nodes, targetId) => {
    const target = nodes.find(node => node.getAttribute("data-node-id") === targetId);
    if (!target) return null;
    const result = [];
    for (let node = target.parentElement?.closest("[data-node-id]"); node; node = node.parentElement?.closest("[data-node-id]")) result.unshift(node.getAttribute("data-node-id"));
    return result;
  }, id);
  if (!chain) throw new Error("Texto de validação ausente no canvas.");
  for (const parentId of chain) {
    const parentRow = page.locator(".tree-item[data-node-id]").and(page.locator(`[data-node-id="${parentId}"]`));
    if (await parentRow.count() !== 1) continue;
    const expander = parentRow.locator(".collapsible-indicator");
    if (await expander.count() && await expander.locator('svg[transform*="-90"]').count()) {
      await expander.click();
      await page.waitForTimeout(100);
    }
  }
}

async function verifyEditableText(page, rootId, expectedTexts) {
  const candidates = await page.locator(".paper-camera [data-node-id]").evaluateAll((nodes, args) => {
    const root = nodes.find(node => node.getAttribute("data-node-id") === args.rootId);
    if (!root) return [];
    return [...root.querySelectorAll("[data-node-id]")].filter(node => {
      const text = node.textContent?.replace(/\s+/g, " ").trim();
      return text && args.expected.includes(text) && node.hasAttribute("data-text-color-fill");
    }).map(node => ({ id: node.getAttribute("data-node-id"), text: node.textContent.replace(/\s+/g, " ").trim() }));
  }, { rootId, expected: expectedTexts });
  if (!candidates.length) throw new Error("Importação visível sem camada de texto editável para validar.");
  const candidate = candidates[0];
  await expandPathToLayer(page, candidate.id);
  await selectLayerById(page, candidate.id);
  await page.keyboard.press("Enter");
  const editor = page.locator(".paper-rte[contenteditable=true]");
  await editor.waitFor({ state: "attached" });
  const originalText = candidate.text;
  const sentinel = originalText + " · editável";
  await editor.press("Control+a");
  await page.keyboard.type(sentinel);
  await page.waitForFunction(text => document.querySelector(".paper-rte")?.textContent === text, sentinel);
  await page.getByRole("button", { name: "Move", exact: true }).click();
  await editor.waitFor({ state: "detached" });
  let changed = await page.locator(".paper-camera [data-node-id]").evaluateAll((nodes, args) => nodes.some(node => node.getAttribute("data-node-id") === args.id && node.textContent?.replace(/\s+/g, " ").trim() === args.text), { id: candidate.id, text: sentinel });
  if (!changed) throw new Error("A camada importada não confirmou a edição temporária.");
  await selectLayerById(page, candidate.id);
  await page.keyboard.press("Enter");
  await editor.waitFor({ state: "attached" });
  await editor.press("Control+a");
  await page.keyboard.type(originalText);
  await page.waitForFunction(text => document.querySelector(".paper-rte")?.textContent === text, originalText);
  await page.getByRole("button", { name: "Move", exact: true }).click();
  await editor.waitFor({ state: "detached" });
  const restored = await page.locator(".paper-camera [data-node-id]").evaluateAll((nodes, args) => nodes.some(node => node.getAttribute("data-node-id") === args.id && node.textContent?.replace(/\s+/g, " ").trim() === args.text), { id: candidate.id, text: originalText });
  if (!restored) throw new Error("Texto temporário não foi restaurado após o teste de edição.");
  return { id: candidate.id, text: originalText, edited: changed, restored };
}

export async function syncHtmlScreen(page, { screen = "dashboard", viewport = "desktop", newVersion = false } = {}) {
  if (typeof newVersion !== "boolean") throw new Error("newVersion precisa ser booleano.");
  if (!validScreen.test(screen)) throw new Error("Identificador de tela inválido.");
  const generated = await generateScreen({ screen, viewport });
  const key = `${screen}:${viewport}`;
  const manifest = await readManifest();
  const previous = manifest.screens[key];
  if (previous?.status === "pending") throw new Error("Sincronização anterior ficou pendente; confira o frame " + (previous.rootName ?? "registrado") + " antes de iniciar uma nova versão.");
  const nextVersion = previous?.version + (newVersion ? 1 : 0) || 1;
  const rootName = `BestPrice IA - ${screen} - ${viewport} - v${nextVersion}`;
  const html = htmlWithRootName(generated.html, rootName);
  const sourceHash = hash(html);
  let existing;
  if (previous?.paperNodeId) {
    const found = await page.locator(".paper-camera [data-node-id]").evaluateAll((nodes, id) => nodes.some(node => node.getAttribute("data-node-id") === id), previous.paperNodeId);
    if (!found) throw new Error("Frame registrado não está visível; sincronização preservada para evitar duplicação.");
    existing = { id: previous.paperNodeId };
  } else {
    existing = await findVisibleRoot(page, rootName);
    if (existing) throw new Error("Frame com este nome já existe sem registro; inspecione o canvas antes de repetir.");
  }
  const currentFingerprint = existing ? await renderedFingerprint(page, existing.id) : null;
  const action = planSync({ previous, sourceHash, fingerprint: currentFingerprint, newVersion });
  if (action.action === "reuse") {
    await selectLayerById(page, existing.id);
    await zoomToSelection(page);
    return { success: true, operation: "sync", element: rootName, verified: true, evidence: { screen, viewport, version: action.version, paperNodeId: existing.id, fingerprint: currentFingerprint, reused: true, sourceHash, htmlReference: generated.reference, expectedTextCount: generated.expectedTexts.length } };
  }

  const htmlPath = path.join(reportsDir, `${screen}-${viewport}-v${action.version}.html`);
  const entry = { document: TEST_DOCUMENT, screen, viewport, version: action.version, status: "pending", sourceHash, rootName, paperNodeId: null, fingerprint: null, htmlPath, createdAt: new Date().toISOString() };
  manifest.screens[key] = entry;
  await writeManifest(manifest);
  await mkdir(reportsDir, { recursive: true });
  await writeFile(htmlPath, html);
  await setClipboard(htmlPath);
  await page.getByRole("button", { name: "Move", exact: true }).click();
  await page.keyboard.press("Control+Escape");
  const canvas = page.locator("canvas");
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error("Canvas sem geometria para receber HTML.");
  await page.mouse.click(bounds.x + Math.min(24, bounds.width / 4), bounds.y + Math.min(24, bounds.height / 4));
  const beforeIds = await page.locator(".paper-camera [data-node-id]").evaluateAll(nodes => nodes.map(node => node.getAttribute("data-node-id")));
  await page.keyboard.press("Control+v");
  const rootRow = page.locator(".tree-item[data-node-id]").filter({ has: page.getByText(rootName, { exact: true }) });
  await rootRow.waitFor({ state: "visible", timeout: 15000 });
  const rootId = await rootRow.getAttribute("data-node-id");
  if (beforeIds.includes(rootId)) throw new Error("Importação não criou uma nova raiz observável.");
  const renderedRoot = page.locator(".paper-camera [data-node-id]").and(page.locator(`[data-node-id="${rootId}"]`));
  await renderedRoot.waitFor({ state: "attached" });
  const nodeIds = await renderedRoot.evaluate(root => [root, ...root.querySelectorAll("[data-node-id]")].map(node => node.getAttribute("data-node-id")));
  if (nodeIds.length < 3) throw new Error("Importação criou estrutura incompleta no canvas.");
  const editability = await verifyEditableText(page, rootId, generated.expectedTexts);
  const fingerprint = await renderedFingerprint(page, rootId);
  if (!fingerprint) throw new Error("Frame HTML ausente após validação de edição.");
  manifest.screens[key] = { ...entry, status: "synced", paperNodeId: rootId, nodeIds, fingerprint, editableTextId: editability.id, syncedAt: new Date().toISOString() };
  await writeManifest(manifest);
  await selectLayerById(page, rootId);
  await zoomToSelection(page);
  return { success: true, operation: "sync", element: rootName, verified: true, evidence: { screen, viewport, version: action.version, paperNodeId: rootId, nodeCount: nodeIds.length, fingerprint, sourceHash, imported: true, editable: editability, htmlReference: htmlPath, generatedReference: generated.reference, expectedTextCount: generated.expectedTexts.length, embeddedImageCount: generated.images.length, conversions: generated.conversions } };
}
