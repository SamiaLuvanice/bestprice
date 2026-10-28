import { axisField, unique, selectors, fillPanel } from "./selectors.mjs";

export async function commitField(locator, value, label) {
  await unique(locator, label);
  await locator.fill(String(value));
  await locator.press("Enter");
  await locator.press("Tab");
}

export async function setGeometry(page, values) {
  for (const key of ["width", "height"]) {
    if (values[key] !== undefined) await commitField(page.getByRole("combobox", { name: key === "width" ? "Width" : "Height", exact: true }), values[key], key);
  }
  for (const axis of ["x", "y"]) {
    if (values[axis] !== undefined) await commitField(axisField(page, axis.toUpperCase()), values[axis], axis);
  }
}

export async function setFill(page, color) {
  const control = fillPanel(page).locator(selectors.color);
  if (await control.count() === 0) {
    const add = page.locator(".panel-header").filter({ has: page.getByText("Fill", { exact: true }) }).locator("button");
    await (await unique(add, "Adicionar preenchimento")).click();
    await control.waitFor({ state: "visible" });
  }
  await commitField(control, color, "Preenchimento");
}

export async function readProperties(page) {
  const result = {};
  for (const key of ["Width", "Height", "Opacity"]) {
    const field = page.getByRole("combobox", { name: key, exact: true });
    if (await field.count() === 1) result[key] = await field.inputValue();
  }
  for (const axis of ["X", "Y"]) {
    const field = axisField(page, axis);
    if (await field.count() === 1) result[axis] = await field.inputValue();
  }
  const colorOpacity = fillPanel(page).getByRole("combobox", { name: "Color opacity", exact: true });
  if (await colorOpacity.count() === 1) result["Color opacity"] = await colorOpacity.inputValue();
  const fill = fillPanel(page).locator(selectors.color);
  if (await fill.count() === 1) result.Fill = await fill.inputValue();
  return result;
}
