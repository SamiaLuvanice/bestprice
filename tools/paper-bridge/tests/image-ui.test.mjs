import test from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { imageUI } from "../src/image-ui.mjs";

test("UI inspeciona menus, preenche parâmetros e só submete por ação separada", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(`<title>BestPrice Bridge Test · Paper</title>
      <button type="button" aria-label="Create image" onclick="openPanel()">Create image</button>
      <div class="paper-camera"></div>
      <script>
      window.submissions = 0;
      function openPanel() {
        const dialog = document.createElement('div'); dialog.setAttribute('role','dialog');
        dialog.innerHTML = '<form><textarea name="prompt"></textarea><div><button type="button" aria-haspopup="menu" onclick="showMenu(this, false)">Test model</button><input aria-hidden="true" name="model" readonly value="test"></div><div><button type="button" aria-haspopup="menu" onclick="showMenu(this, true)">1:1</button><input aria-hidden="true" name="aspectRatio" readonly value="1:1"></div><button type="submit">Create image</button></form>';
        dialog.querySelector('form').onsubmit = e => { e.preventDefault(); window.submissions++; dialog.remove(); document.querySelector('.paper-camera').innerHTML='<svg data-node-id="created" width="64" height="64"><rect width="64" height="64" fill="red"/></svg>'; };
        document.body.append(dialog);
      }
      function showMenu(button, ratio) {
        const menu = document.createElement('div'); menu.setAttribute('role','menu');
        for (const label of ratio ? ['1:1','16:9'] : ['Test model','Paid model']) {
          const item = document.createElement('button'); item.type='button'; item.setAttribute('role','menuitemradio');
          item.setAttribute('aria-checked',String(label===button.textContent)); item.textContent=label;
          if(label==='Paid model') item.setAttribute('aria-disabled','true');
          item.onclick = () => { button.textContent=label; menu.remove(); }; menu.append(item);
        }
        document.body.append(menu);
      }
      document.addEventListener('keydown',e=> { if(e.key==='Escape') (document.querySelector('[role=menu]') || document.querySelector('[role=dialog]'))?.remove(); });
      </script>`);
    const controls = await imageUI.inspect(page, "image");
    assert.deepEqual(controls.models.map(({ label, enabled }) => ({ label, enabled })), [{ label: "Test model", enabled: true }, { label: "Paid model", enabled: false }]);
    assert.equal(controls.aspectRatio, "1:1");
    assert.equal(await page.getByRole("dialog").count(), 0);
    const before = await imageUI.snapshot(page);
    await imageUI.prepare(page, { kind: "image", model: "Test model", aspectRatio: "16:9", prompt: "Cesta" });
    assert.equal(await page.locator('textarea[name="prompt"]').inputValue(), "Cesta");
    assert.equal(await page.evaluate(() => window.submissions), 0);
    await page.locator('textarea[name="prompt"]').fill("Pedido diferente");
    await assert.rejects(imageUI.submit(page, { kind: "image", model: "Test model", aspectRatio: "16:9", prompt: "Cesta" }), /autorizado/);
    assert.equal(await page.evaluate(() => window.submissions), 0);
    await page.locator('textarea[name="prompt"]').fill("Cesta");
    await imageUI.submit(page, { kind: "image", model: "Test model", aspectRatio: "16:9", prompt: "Cesta" });
    assert.equal(await page.evaluate(() => window.submissions), 1);
    const nodes = await imageUI.wait(page, before, { kind: "svg", timeoutMs: 2000 });
    assert.equal(nodes[0].id, "created");
    assert.equal((await imageUI.verify(page, { nodes })).length, 1);
    await page.locator('svg rect').evaluate(node => node.setAttribute("fill", "blue"));
    assert.deepEqual(await imageUI.verify(page, { nodes }), []);
    await assert.rejects(imageUI.wait(page, ["created"], { timeoutMs: 1000 }), /esgotado/);
  } finally { await browser.close(); }
});

test("imagem mantém fingerprint quando o Paper troca blob temporário pelo recurso persistido", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent('<title>BestPrice Bridge Test · Paper</title><div class="paper-camera"><div data-node-id="image" data-has-image style="width:64px;height:64px"></div></div>');
    await page.evaluate(async () => {
      const canvas = document.createElement("canvas"); canvas.width = 4; canvas.height = 4;
      const context = canvas.getContext("2d"); context.fillStyle = "red"; context.fillRect(0, 0, 4, 4);
      window.persistentImage = canvas.toDataURL();
      const blob = await new Promise(resolve => canvas.toBlob(resolve));
      document.querySelector('[data-node-id="image"]').style.backgroundImage = 'url("' + URL.createObjectURL(blob) + '")';
    });
    const before = await imageUI.media(page);
    assert.equal(before.length, 1);
    await page.evaluate(() => { document.querySelector('[data-node-id="image"]').style.backgroundImage = 'url("' + window.persistentImage + '")'; });
    const after = await imageUI.media(page);
    assert.equal(before[0].fingerprint, after[0].fingerprint);
    await page.evaluate(() => {
      const canvas = document.createElement("canvas"); canvas.width = 4; canvas.height = 4;
      const context = canvas.getContext("2d"); context.fillStyle = "blue"; context.fillRect(0, 0, 4, 4);
      document.querySelector('[data-node-id="image"]').style.backgroundImage = 'url("' + canvas.toDataURL() + '")';
    });
    assert.notEqual((await imageUI.media(page))[0].fingerprint, before[0].fingerprint);
  } finally { await browser.close(); }
});
