import { layers, selectLayer, selectLayerById, renameSelected, assertLayerCoverage, dragLayer } from "./editor.mjs";
import { drawFrame, renderedNode } from "./canvas.mjs";
import { setGeometry, setFill, readProperties } from "./properties.mjs";
import { compareProperties } from "./validation.mjs";
import { resolveColor, hexToRgb } from "./design-system.mjs";
import { unique } from "./selectors.mjs";

export const DASHBOARD = "BestPrice IA - Dashboard";

export function frameOptions(options = {}) {
  const values = { name: options.name ?? DASHBOARD, width: Number(options.width ?? 1440), height: Number(options.height ?? 900), x: Number(options.x ?? options.position?.x ?? 0), y: Number(options.y ?? options.position?.y ?? 0), background: options.background ?? "design-token", reuse: options.reuse };
  if (typeof values.name !== "string" || !values.name.trim() || values.name.length > 200) throw new Error("Nome deve ter de 1 a 200 caracteres.");
  for (const key of ["width", "height", "x", "y"]) if (!Number.isFinite(values[key]) || Math.abs(values[key]) > 20000 || (["width", "height"].includes(key) && values[key] <= 0)) throw new Error("Geometria inválida: " + key);
  return values;
}

export async function configureFrame(page, ds, options) {
  const values = frameOptions(options);
  const color = resolveColor(ds, values.background);
  let current = await assertLayerCoverage(page);
  let matches = current.filter(layer => layer.name === values.name);
  if (matches.length > 1) throw new Error("Nome de frame ambíguo.");
  let action = "updated";
  if (!matches.length && values.reuse) {
    matches = current.filter(layer => layer.name === values.reuse);
    if (matches.length !== 1) throw new Error("Frame a reutilizar ausente ou ambíguo.");
  }
  if (!matches.length) {
    const before = new Set(current.map(layer => layer.id));
    await drawFrame(page);
    await page.waitForFunction(ids => [...document.querySelectorAll(".tree-item[data-node-id]")].some(el => !ids.includes(el.getAttribute("data-node-id"))), [...before]);
    current = await layers(page);
    matches = current.filter(layer => !before.has(layer.id));
    if (matches.length !== 1) throw new Error("Gesto sem evidência de um novo frame. Inspecione antes de repetir.");
    action = "created";
  }
  const id = matches[0].id;
  await selectLayerById(page, id);
  const rendered = await unique(renderedNode(page, id), "Frame");
  if (await rendered.getAttribute("data-text-color-fill") !== null) throw new Error("Nome de frame pertence a texto.");
  if ((await rendered.evaluate(el => getComputedStyle(el).position)) !== "absolute") throw new Error("Elemento sem posicionamento de frame suportado.");
  if (matches[0].name !== values.name) await renameSelected(page, values.name);
  if (await rendered.evaluate(el => Boolean(el.parentElement.closest("[data-node-id]")))) {
    const root = (await layers(page)).find(layer => layer.indent === "0px" && layer.id !== id);
    if (!root) throw new Error("Raiz da árvore não encontrada para mover frame.");
    await dragLayer(page, page.locator('.tree-item[data-node-id="' + id + '"]'), page.locator('.tree-item[data-node-id="' + root.id + '"]'), { x: 8, y: 1 });
    await page.waitForFunction(id => !document.querySelector('.paper-camera [data-node-id="' + id + '"]')?.parentElement.closest("[data-node-id]"), id);
    await selectLayer(page, values.name);
  }
  await setGeometry(page, values);
  await setFill(page, color);
  await selectLayer(page, values.name);
  const properties = await readProperties(page);
  const validation = compareProperties(properties, { Width: values.width, Height: values.height, X: values.x, Y: values.y, Fill: color });
  const observed = await rendered.evaluate(el => ({ width: el.style.width, height: el.style.height, x: el.style.left, y: el.style.top, background: getComputedStyle(el).backgroundColor }));
  const geometryVerified = parseFloat(observed.width) === values.width && parseFloat(observed.height) === values.height && parseFloat(observed.x) === values.x && parseFloat(observed.y) === values.y && observed.background === hexToRgb(color);
  return { success: validation.verified && geometryVerified, operation: "create-frame", element: values.name, verified: validation.verified && geometryVerified, evidence: { id, action, properties, rendered: observed, checks: validation.checks, backgroundToken: values.background } };
}
