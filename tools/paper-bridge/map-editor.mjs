
import { chromium } from "playwright";
import fs from "node:fs/promises";

const browser = await chromium.connectOverCDP(
    "http://127.0.0.1:9222"
);

try {
    const pages = browser.contexts().flatMap(
        (context) => context.pages()
    );

    const page = pages.find((p) =>
        p.url().startsWith("https://app.paper.design") &&
        p.url() !== "https://app.paper.design/" &&
        p.url().length > 30
    ) ?? pages.find((p) =>
        p.url().startsWith("https://app.paper.design") &&
        p.url().includes("BestPriceIA")
    ) ?? pages.find((p) => p.url().startsWith("https://app.paper.design") &&
        p !== pages[0] &&
        p !== pages[1]
    );

    // Confirmar pelo título, independentemente da URL.
    const editor = await (async () => {
        for (const candidate of pages) {
            if ((await candidate.title()).includes("BestPriceIA")) {
                return candidate;
            }
        }
        return page;
    })();

    if (!editor) {
        throw new Error("Editor BestPriceIA não encontrado.");
    }

    console.log("Editor:", await editor.title());

    const report = await editor.evaluate(() => {
        const inspect = (el) => ({
            tag: el.tagName,
            text: (el.innerText || "").slice(0, 100),
            ariaLabel: el.getAttribute("aria-label"),
            title: el.getAttribute("title"),
            role: el.getAttribute("role"),
            dataState: el.getAttribute("data-state"),
            className: typeof el.className === "string"
                ? el.className.slice(0, 160)
                : "",
        });

        const selectors = [
            "button",
            "input",
            '[role="button"]',
            '[role="menuitem"]',
            '[role="toolbar"]',
            "[data-testid]",
            "canvas",
        ];

        const elements = [
            ...new Set(
                selectors.flatMap((selector) =>
                    [...document.querySelectorAll(selector)]
                )
            ),
        ];

        return {
            title: document.title,
            elements: elements.map(inspect),
            canvases: [...document.querySelectorAll("canvas")]
                .map((canvas) => ({
                    width: canvas.width,
                    height: canvas.height,
                    clientWidth: canvas.clientWidth,
                    clientHeight: canvas.clientHeight,
                })),
        };
    });

    await fs.writeFile(
        "editor-map.json",
        JSON.stringify(report, null, 2),
        "utf8"
    );

    console.log(
        `Elementos encontrados: ${report.elements.length}`
    );

    console.log("Canvas:", report.canvases);

    // Screenshot opcional para evitar capturar conteúdo
    // sem uma decisão explícita.
    if (process.env.PAPER_CAPTURE === "1") {
        await editor.screenshot({
            path: "editor-screenshot.png",
        });
        console.log("Screenshot salvo.");
    }

    console.log("Relatório salvo em editor-map.json");

} finally {
    await browser.close();
}
