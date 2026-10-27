import { chromium } from "playwright";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { serializeScreen } from "./serialize-html.mjs";
import { hash } from "./manifest.mjs";
import { reportsDir } from "./logger.mjs";

const root = fileURLToPath(new URL("../../../", import.meta.url));
export const viewports = { desktop: { width: 1440, height: 1000 }, tablet: { width: 768, height: 1024 }, mobile: { width: 390, height: 1080 } };

export async function generateScreen({ screen = "dashboard", viewport = "desktop" } = {}) {
  if (screen !== "dashboard" || !Object.hasOwn(viewports, viewport)) throw new Error("Tela/viewport não suportado. Use dashboard e desktop, tablet ou mobile.");
  const requireFrontend = createRequire(path.join(root, "frontend/package.json"));
  const { createServer } = await import(pathToFileURL(requireFrontend.resolve("vite")).href);
  const server = await createServer({ root: path.join(root, "frontend"), configFile: path.join(root, "frontend/vite.config.ts"), logLevel: "error", server: { host: "127.0.0.1", port: 0, open: false } });
  let browser;
  try {
    await server.listen();
    const origin = "http://127.0.0.1:" + server.httpServer.address().port;
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: viewports[viewport], deviceScaleFactor: 1, reducedMotion: "reduce" });
    const unknownApi = [];
    await page.route("**/*", async route => {
      const url = new URL(route.request().url());
      if (url.origin !== origin) return route.abort();
      if (url.pathname.startsWith("/api/")) {
        if (url.pathname === "/api/auth/me") return route.fulfill({ json: { id: "paper-preview", email: "preview@bestprice.invalid" } });
        if (url.pathname === "/api/research") return route.fulfill({ json: { items: [], next_offset: null } });
        unknownApi.push(url.pathname);
        return route.fulfill({ status: 503, json: { detail: "Preview isolado" } });
      }
      return route.continue();
    });
    await page.goto(origin + "/app/dashboard", { waitUntil: "networkidle" });
    await page.locator(".research-empty-pair").waitFor({ state: "visible", timeout: 10000 });
    if (unknownApi.length) throw new Error("Preview solicitou contrato não mapeado: " + unknownApi.join(", "));
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
    const source = await page.locator(".research-shell").evaluate(serializeScreen);
    // Assets são lidos somente do servidor local da referência, sem cookies ou conta real.
    for (const asset of source.images) {
      const assetUrl = new URL(asset.source);
      if (assetUrl.origin !== origin) throw new Error("Asset fora da origem local da referência.");
      const response = await page.request.get(assetUrl.href);
      if (!response.ok()) throw new Error("Asset da referência indisponível.");
      const data = "data:" + response.headers()["content-type"].split(";")[0] + ";base64," + (await response.body()).toString("base64");
      source.html = source.html.replaceAll(asset.source.replaceAll("&", "&amp;"), data);
      asset.sourceHash = hash(data); delete asset.source;
    }
    await mkdir(reportsDir, { recursive: true });
    const base = path.join(reportsDir, "dashboard-" + viewport);
    await page.screenshot({ path: base + "-reference.png", fullPage: true });
    source.sourceHash = hash(source.html);
    source.screen = screen; source.viewport = viewport;
    source.reference = base + "-reference.png";
    source.sources = ["frontend/src/App.tsx", "frontend/src/features/research/ResearchArea.tsx", "frontend/src/features/research/research.css", "frontend/src/styles.css", "frontend/src/components/Brand.tsx", "frontend/src/assets/logo-bestprice.png"];
    await writeFile(base + ".html", source.html);
    await writeFile(base + ".json", JSON.stringify({ ...source, html: undefined }, null, 2));
    return source;
  } finally { if (browser) await browser.close(); await server.close(); }
}
