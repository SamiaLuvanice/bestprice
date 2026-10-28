import { chromium } from "playwright";
import { TEST_DOCUMENT, validateEndpoint, validateDocument } from "./policy.mjs";

export const START_COMMAND = '& "$env:LOCALAPPDATA\\Programs\\Paper\\Paper.exe" --remote-debugging-port=9222 --remote-debugging-address=127.0.0.1';

export async function connect({ endpoint = "http://127.0.0.1:9222", document = TEST_DOCUMENT } = {}) {
  validateDocument(document);
  const url = validateEndpoint(endpoint);
  let browser;
  try {
    browser = await chromium.connectOverCDP(url, { timeout: 30000, noDefaults: true });
  } catch {
    throw new Error("CDP indisponível. Inicie o Paper: " + START_COMMAND);
  }
  try {
    const matches = [];
    for (const page of browser.contexts().flatMap(context => context.pages())) {
      const title = await page.title();
      if (title === document + " · Paper") matches.push(page);
    }
    if (matches.length !== 1) throw new Error("Abra exatamente uma aba do documento autorizado BestPrice Bridge Test.");
    const page = matches[0];
    page.setDefaultTimeout(6000);
    if (await page.evaluate(() => document.visibilityState !== "visible")) throw new Error("Paper está oculto ou minimizado. Restaure a janela do documento de teste.");
    if (await page.locator('[role="dialog"]:visible, [aria-modal="true"]:visible, input[type="password"]:visible').count()) throw new Error("Feche os diálogos do Paper antes de executar a bridge.");
    await page.getByRole("button", { name: document, exact: true, includeHidden: true }).waitFor({ state: "visible" });
    await page.getByRole("button", { name: "Frame", exact: true, includeHidden: true }).waitFor({ state: "visible" });
    return { browser, page, disconnect: () => browser.close() };
  } catch (error) {
    await browser.close();
    throw error;
  }
}
