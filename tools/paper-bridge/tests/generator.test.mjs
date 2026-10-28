import test from "node:test";
import assert from "node:assert/strict";
import { generateScreen } from "../src/generator.mjs";

for (const [viewport, width] of [["desktop", 1440], ["tablet", 768], ["mobile", 390]]) {
  test(`gera dashboard real com CSS inline e assets locais em ${viewport}`, async () => {
    const screen = await generateScreen({ screen: "dashboard", viewport });
    assert.equal(screen.width, width);
    assert.match(screen.html, /^<div layer-name="bp-/);
    assert.match(screen.html, /style="[^"]+"/);
    assert.ok(screen.expectedTexts.some(text => text.includes("Uma boa compra começa")));
    assert.ok(screen.expectedTexts.includes("Suas pesquisas"));
    assert.doesNotMatch(screen.html, /\son[a-z]+\s*=/i);
    assert.equal(screen.images.length, 1);
    assert.match(screen.html, /src="data:image\//);
    assert.ok(screen.sources.includes("frontend/src/features/research/ResearchArea.tsx"));
    assert.ok(screen.conversions.inlineStyles > 20);
  });
}
