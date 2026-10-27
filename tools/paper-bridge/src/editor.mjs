import { selectors, unique, layerByName } from "./selectors.mjs";

export async function layers(page) {
  return page.locator(selectors.layer).evaluateAll(elements => elements.map(el => ({
    id: el.getAttribute("data-node-id"),
    name: el.querySelector("input.tree-item-input")?.value ?? el.querySelector(":scope > div > span")?.textContent?.trim(),
    selected: el.hasAttribute("data-selected"),
    indent: el.style.getPropertyValue("--indent"),
  })));
}

export async function assertLayerCoverage(page) {
  const inventory = await layers(page);
  const rendered = await page.locator(".paper-camera [data-node-id]").evaluateAll(elements => elements.map(el => el.getAttribute("data-node-id")));
  if (rendered.some(id => !inventory.some(layer => layer.id === id))) {
    throw new Error("Árvore incompleta. Expanda as camadas e mantenha a árvore visível antes de criar ou atualizar.");
  }
  return inventory;
}

export async function selectLayer(page, name) {
  await page.keyboard.press("Escape");
  const row = await unique(layerByName(page, name), "Camada " + name);
  await row.click();
  if (await row.getAttribute("data-selected") === null) throw new Error("Camada não selecionada.");
  return row;
}

export async function selectLayerById(page, id) {
  await page.keyboard.press("Escape");
  const row = await unique(page.locator(selectors.layer).and(page.locator('[data-node-id="' + id + '"]')), "Camada por ID observado");
  await row.click();
  if (await row.getAttribute("data-selected") === null) throw new Error("Camada não selecionada.");
  return row;
}

export async function dragLayer(page, source, target, position) {
  const from = await source.boundingBox(), to = await target.boundingBox();
  if (!from || !to) throw new Error("Camada sem geometria para arrastar.");
  await page.mouse.move(from.x + 60, from.y + 14);
  await page.mouse.down();
  try {
    await page.mouse.move(from.x + 90, from.y + 14, { steps: 8 });
    await page.mouse.move(to.x + position.x, to.y + position.y, { steps: 15 });
    // O alvo de drop é atualizado em frames de renderização após o pointermove.
    await page.evaluate(async () => {
      let timer;
      try {
        await Promise.race([
          (async () => { for (let frame = 0; frame < 3; frame++) await new Promise(resolve => requestAnimationFrame(resolve)); })(),
          new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("Paper não renderizou; restaure a janela.")), 3000); }),
        ]);
      } finally { clearTimeout(timer); }
    });
  } finally { await page.mouse.up(); }
}

export async function renameSelected(page, name) {
  const row = await unique(page.locator(selectors.selectedLayer), "Camada selecionada");
  await row.dblclick();
  const field = await unique(page.locator(selectors.rename), "Nome da camada");
  await field.fill(name);
  await field.press("Enter");
  await unique(layerByName(page, name), "Nome após commit");
}

export async function inspect(page) {
  return {
    title: await page.title(),
    layers: await layers(page),
    controls: await page.locator("input:not([aria-hidden]):visible, button[aria-label]:visible").evaluateAll(elements =>
      elements.filter(el => el.getBoundingClientRect().width > 1 && el.type !== "password").map(el => {
        const label = el.getAttribute("aria-label");
        const axis = el.parentElement.querySelector(".field-icon")?.textContent;
        const isFill = el.hasAttribute("data-color-input") && el.closest(".panel-root")?.querySelector(".panel-header-label")?.textContent === "Fill";
        const known = ["Width", "Height", "Opacity"].includes(label) || ["X", "Y"].includes(axis) || isFill;
        return { tag: el.tagName, label, role: el.getAttribute("role"), ...(known ? { value: el.value, axis } : {}) };
      })),
    canvas: await page.locator("canvas").evaluateAll(elements => elements.map(el => ({
      width: el.width, height: el.height, cssWidth: el.clientWidth, cssHeight: el.clientHeight,
    }))),
    limitations: ["Valores de campos desconhecidos e snapshots globais são omitidos para não registrar credenciais.", "Inventário depende de árvore expandida e inteiramente visível."],
  };
}
