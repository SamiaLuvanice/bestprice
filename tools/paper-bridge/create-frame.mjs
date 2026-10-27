
import { chromium } from "playwright";

const browser = await chromium.connectOverCDP(
    "http://127.0.0.1:9222"
);

try {
    const pages = browser.contexts().flatMap(
        (context) => context.pages()
    );

    let page = null;

    for (const candidate of pages) {
        const title = await candidate.title();

        if (title.includes("BestPrice Bridge Test")) {
            page = candidate;
            break;
        }
    }

    if (!page) {
        throw new Error(
            "Abra o arquivo 'BestPrice Bridge Test' antes de executar."
        );
    }

    console.log("Editor encontrado:", await page.title());

    const frameTool = page.getByRole("button", {
        name: "Frame",
        exact: true,
    });

    await frameTool.waitFor({
        state: "visible",
        timeout: 10000,
    });

    console.log("Selecionando ferramenta Frame...");
    await frameTool.click();

    const canvas = page.locator("canvas");
    await canvas.waitFor({ state: "visible" });

    const bounds = await canvas.boundingBox();

    if (!bounds) {
        throw new Error("Canvas não encontrado.");
    }

    console.log("Canvas:", bounds);

    // Coordenadas em pixels visuais, relativas ao canvas.
    // Criamos um frame pequeno para validar a interação.
    const startX = bounds.x + bounds.width * 0.35;
    const startY = bounds.y + bounds.height * 0.35;

    const endX = startX + 240;
    const endY = startY + 150;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY, {
        steps: 15,
    });
    await page.mouse.up();

    console.log("Gesto de criação executado.");

    // Captura para verificar visualmente o resultado.
    await page.screenshot({
        path: "frame-test.png",
    });

    console.log("Screenshot salvo em frame-test.png");

} finally {
    await browser.close();
}
