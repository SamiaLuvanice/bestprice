
import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const CDP_URL = "http://127.0.0.1:9222";
const outputDir = path.resolve("screenshots");

await fs.mkdir(outputDir, { recursive: true });

let browser;

try {
    console.log("Conectando ao Paper Desktop...");

    browser = await chromium.connectOverCDP(CDP_URL, {
        timeout: 10000,
    });

    const contexts = browser.contexts();

    console.log(`Contextos encontrados: ${contexts.length}`);

    for (const [contextIndex, context] of contexts.entries()) {
        const pages = context.pages();

        console.log(
            `\nContexto ${contextIndex}: ${pages.length} página(s)`
        );

        for (const [pageIndex, page] of pages.entries()) {
            const title = await page.title().catch(() => "");
            const url = page.url();

            // Não registrar URLs completas que possam conter tokens.
            let origin = "internal";
            try {
                origin = new URL(url).origin;
            } catch { }

            console.log({
                contextIndex,
                pageIndex,
                title,
                origin,
            });

            const elements = await page.evaluate(() => ({
                buttons: document.querySelectorAll("button").length,
                inputs: document.querySelectorAll("input").length,
                canvases: document.querySelectorAll("canvas").length,
                svg: document.querySelectorAll("svg").length,
                frames: document.querySelectorAll("iframe").length,
                contentEditable: document.querySelectorAll(
                    '[contenteditable="true"]'
                ).length,
            })).catch(() => null);

            console.log("Elementos:", elements);

            // Captura apenas mediante autorização explícita.
            if (process.env.PAPER_CAPTURE === "1") {
                const file = path.join(
                    outputDir,
                    `paper-${contextIndex}-${pageIndex}.png`
                );

                await page.screenshot({
                    path: file,
                    fullPage: false,
                });

                console.log("Screenshot:", file);
            }
        }
    }

    console.log("\nInspeção concluída.");

} catch (error) {
    console.error("Falha:", error.message);
    process.exitCode = 1;
} finally {
    // Desconecta o cliente Playwright.
    // Não encerra intencionalmente o aplicativo Paper.
    if (browser) await browser.close();
}
