import { selectors, unique } from "./selectors.mjs";

export function documentToCss(bounds, documentSize, point) {
  if (!bounds || ![bounds.x, bounds.y, bounds.width, bounds.height, documentSize.width, documentSize.height, point.x, point.y].every(Number.isFinite)) throw new Error("Transformação do canvas não suportada.");
  const scaleX = bounds.width / documentSize.width;
  const scaleY = bounds.height / documentSize.height;
  if (!(scaleX > 0 && scaleY > 0) || Math.abs(scaleX - scaleY) > 0.01) throw new Error("Transformação do canvas não suportada.");
  return { x: bounds.x + point.x * scaleX, y: bounds.y + point.y * scaleY, scaleX, scaleY };
}

export function renderedNode(page, id) {
  return page.locator(".paper-camera").locator("[data-node-id]")
    .and(page.locator('[data-node-id="' + id.replaceAll('"', "") + '"]'));
}

export async function drawFrame(page) {
  await page.keyboard.press("Escape");
  await page.keyboard.press("Control+Escape");
  if (await page.locator(selectors.selectedLayer).count()) throw new Error("Não foi possível limpar a seleção antes de criar frame.");
  await page.getByRole("button", { name: "Frame", exact: true }).click();
  const canvas = await unique(page.locator(selectors.canvas), "Canvas");
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error("Canvas sem geometria.");
  const viewport = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
  // Mesmo gesto experimental; a geometria definitiva será aplicada no painel.
  const x = viewport.width / 2 - 80;
  const y = viewport.height / 2 - 50;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 160, y + 100, { steps: 15 });
  await page.mouse.up();
}

export async function pointInFrame(page, id, size, point) {
  const node = await unique(renderedNode(page, id), "Frame renderizado");
  const bounds = await node.boundingBox();
  const target = documentToCss(bounds, size, point);
  const isCanvas = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.tagName === "CANVAS", target);
  if (!isCanvas) throw new Error("Ponto fora da área editável. Use o menu Zoom > Zoom to selection e repita.");
  return target;
}

export async function zoomToSelection(page) {
  await page.getByRole("button", { name: /^\d+%$/ }).click();
  await page.getByRole("menuitem", { name: "Zoom to selection Shift + 2", exact: true }).click();
  await page.evaluate(async () => {
    let timer;
    const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("Zoom não estabilizou; restaure a janela.")), 3000); });
    try { await Promise.race([(async () => {
    const camera = document.querySelector(".paper-camera");
    let previous, stable = 0;
    for (let count = 0; count < 120; count++) {
      await new Promise(resolve => requestAnimationFrame(resolve));
      const box = camera.getBoundingClientRect();
      const signature = [box.x, box.y, box.width, box.height].join(",");
      stable = previous === signature ? stable + 1 : 0;
      if (stable >= 8) return;
      previous = signature;
    }
    throw new Error("Zoom não estabilizou.");
    })(), timeout]); } finally { clearTimeout(timer); }
  });
}
