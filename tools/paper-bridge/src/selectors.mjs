// Seletores observados no DOM do documento de teste em 27/10/2026.
export const selectors = {
  layer: ".tree-item[data-node-id]",
  selectedLayer: ".tree-item[data-node-id][data-selected]",
  rename: "input.tree-item-input",
  color: "input[data-color-input]",
  canvas: "canvas",
};

export async function unique(locator, description) {
  const count = await locator.count();
  if (count !== 1) throw new Error(description + ": esperado 1 controle, encontrados " + count);
  await locator.waitFor({ state: "visible" });
  return locator;
}

export function axisField(page, axis) {
  return page.locator(".field-root").filter({
    has: page.locator(".field-icon").getByText(axis, { exact: true }),
  }).locator("input:not([aria-hidden])");
}

export function layerByName(page, name) {
  return page.locator(selectors.layer).filter({ has: page.getByText(name, { exact: true }) });
}

export function fillPanel(page) {
  return page.locator(".panel-root").filter({ has: page.locator(".panel-header-label").filter({ hasText: /^Fill$/ }) });
}
