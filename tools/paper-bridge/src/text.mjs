import { layers, selectLayer, renameSelected, assertLayerCoverage, dragLayer } from "./editor.mjs";
import { renderedNode, pointInFrame, zoomToSelection } from "./canvas.mjs";
import { setGeometry, setFill, commitField, readProperties } from "./properties.mjs";
import { selectors, unique } from "./selectors.mjs";
import { resolveColor, hexToRgb } from "./design-system.mjs";
import { compareProperties } from "./validation.mjs";
import { DASHBOARD } from "./frames.mjs";

export function textOptions(options = {}) {
  const values = {
    parent: options.parent ?? DASHBOARD, text: options.text,
    name: options.name ?? options.text, x: Number(options.x ?? 80), y: Number(options.y ?? 64),
    fontSize: Number(options.fontSize ?? 48), fontWeight: Number(options.fontWeight ?? 700),
    color: options.color ?? "primary",
  };
  for (const key of ["text", "name", "parent"]) if (typeof values[key] !== "string" || !values[key].trim() || values[key].length > (key === "text" ? 10000 : 200)) throw new Error("Texto, nome ou parent inválido.");
  if (![400, 700].includes(values.fontWeight)) throw new Error("Pesos suportados nesta versão: 400 e 700.");
  for (const key of ["x", "y", "fontSize"]) if (!Number.isFinite(values[key]) || values[key] < 0 || values[key] > 20000 || (key === "fontSize" && values[key] === 0)) throw new Error("Propriedade de texto inválida: " + key);
  return values;
}

export async function parentEvidence(page, childId, parentId) {
  return renderedNode(page, childId).evaluate((el, id) => el.parentElement.closest("[data-node-id]")?.getAttribute("data-node-id") === id, parentId);
}

async function moveInto(page, id, parentId) {
  if (await parentEvidence(page, id, parentId)) return;
  const row = page.locator(selectors.layer).and(page.locator('[data-node-id="' + id + '"]'));
  const parent = page.locator(selectors.layer).and(page.locator('[data-node-id="' + parentId + '"]'));
  const bounds = await parent.boundingBox();
  // O terço direito produz reparenting; o centro apenas reordena irmãos.
  await dragLayer(page, row, parent, { x: Math.min(190, bounds.width - 40), y: 14 });
  await page.waitForFunction(({ id, parentId }) => {
    const node = document.querySelector('.paper-camera [data-node-id="' + id + '"]');
    return node?.parentElement.closest("[data-node-id]")?.getAttribute("data-node-id") === parentId;
  }, { id, parentId });
}

export async function addText(page, ds, options) {
  const values = textOptions(options);
  const color = resolveColor(ds, values.color);
  const initial = await assertLayerCoverage(page);
  const parents = initial.filter(layer => layer.name === values.parent);
  const existing = initial.filter(layer => layer.name === values.name);
  if (parents.length !== 1 || existing.length > 1 || values.name === values.parent) throw new Error("Camada ou parent ausente/ambíguo.");
  const parentId = parents[0].id;
  await selectLayer(page, values.parent);
  const size = await readProperties(page);
  if (!(values.x < Number(size.Width) && values.y < Number(size.Height))) throw new Error("Texto fora das dimensões do parent.");
  let id = existing[0]?.id;
  let action = "updated";
  if (id) {
    const node = await unique(renderedNode(page, id), "Texto renderizado");
    if (!await node.getAttribute("data-text-color-fill").then(value => value !== null)) throw new Error("Nome já pertence a uma camada que não é texto.");
    await selectLayer(page, values.name);
    if (await node.textContent() !== values.text) {
      await page.keyboard.press("Enter");
      const editor = page.locator(".paper-rte[contenteditable=true]");
      await editor.waitFor({ state: "attached" });
      await editor.press("Control+a");
      await page.keyboard.type(values.text);
      await page.waitForFunction(text => document.querySelector(".paper-rte")?.textContent === text, values.text);
      await page.getByRole("button", { name: "Move", exact: true }).click();
      await editor.waitFor({ state: "detached" });
    }
  } else {
    await zoomToSelection(page);
    await page.getByRole("button", { name: "Text", exact: true }).click();
    const point = await pointInFrame(page, parentId, { width: Number(size.Width), height: Number(size.Height) }, values);
    await page.mouse.click(point.x, point.y);
    await page.locator(".paper-rte[contenteditable=true]").waitFor({ state: "attached" });
    await page.locator(".paper-rte[contenteditable=true]").focus();
    await page.keyboard.type(values.text);
    await page.waitForFunction(text => document.querySelector(".paper-rte")?.textContent === text, values.text);
    await page.getByRole("button", { name: "Move", exact: true }).click();
    await page.locator(".paper-rte[contenteditable=true]").waitFor({ state: "detached" });
    const created = (await layers(page)).filter(layer => !initial.some(prior => prior.id === layer.id));
    if (created.length !== 1) throw new Error("Criação de texto sem camada única; inspecione antes de repetir.");
    id = created[0].id;
    await renameSelected(page, values.name);
    action = "created";
  }
  await moveInto(page, id, parentId);
  await selectLayer(page, values.name);
  await setGeometry(page, values);
  await setFill(page, color);
  // Arial é um fallback explicitamente publicado nos tokens oficiais, disponível no Windows.
  if (!ds.typography.display.includes("Arial")) throw new Error("Fallback Arial ausente no design system.");
  await page.getByRole("button", { name: "Font family", exact: true }).click();
  await page.getByRole("combobox", { name: "Search fonts", exact: true }).fill("Arial");
  await page.getByRole("option", { name: "Arial", exact: true }).click();
  await page.getByRole("button", { name: "Font style", exact: true }).click();
  await page.getByRole("option", { name: values.fontWeight === 700 ? "Bold" : "Regular", exact: true }).click();
  const fontSize = page.locator(".field-root").filter({ has: page.locator('svg[width="16"][height="14"]') }).locator("input[role=combobox]");
  await commitField(fontSize, values.fontSize, "Tamanho da fonte (ícone observado)");
  await selectLayer(page, values.name);
  return verifyText(page, ds, values, { id, action, parentId });
}

export async function verifyText(page, ds, options, context = {}) {
  const values = textOptions(options);
  const color = resolveColor(ds, values.color);
  const inventory = await assertLayerCoverage(page);
  const matches = inventory.filter(layer => layer.name === values.name);
  const parents = inventory.filter(layer => layer.name === values.parent);
  if (matches.length !== 1 || parents.length !== 1) throw new Error("Texto ou parent ausente/ambíguo.");
  const id = matches[0].id, parentId = parents[0].id;
  await selectLayer(page, values.name);
  const properties = await readProperties(page);
  const comparison = compareProperties(properties, { X: values.x, Y: values.y, Fill: color });
  const observed = await renderedNode(page, id).evaluate(el => {
    const style = getComputedStyle(el);
    return { text: el.textContent, fontSize: style.fontSize, fontWeight: style.fontWeight, color: style.color, fontFamily: style.fontFamily, x: el.style.left, y: el.style.top };
  });
  const parentVerified = await parentEvidence(page, id, parentId);
  const verified = comparison.verified && parentVerified && observed.text === values.text && parseFloat(observed.fontSize) === values.fontSize && Number(observed.fontWeight) === values.fontWeight && observed.fontFamily.includes("Arial") && observed.color === hexToRgb(color) && parseFloat(observed.x) === values.x && parseFloat(observed.y) === values.y;
  return { success: verified, operation: "add-text", element: values.name, verified, evidence: { ...context, id, parentId, parentVerified, properties, rendered: observed, checks: comparison.checks }, limitations: ["Arial usado como fallback oficial da tipografia SF Pro."] };
}
