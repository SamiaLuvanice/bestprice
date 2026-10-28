import { hash } from "./manifest.mjs";
import { TEST_DOCUMENT } from "./policy.mjs";

async function assertPage(page) {
  if (await page.title() !== TEST_DOCUMENT + " · Paper") throw new Error("Documento de teste não está ativo.");
  if (await page.evaluate(() => document.visibilityState !== "visible")) throw new Error("Restaure a janela do Paper.");
}

async function open(page, kind) {
  await assertPage(page);
  if (!["image", "svg"].includes(kind)) throw new Error("Use --kind image ou svg.");
  if (await page.getByRole("dialog").count()) throw new Error("Feche os diálogos antes da operação de imagem.");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Control+Escape");
  if (await page.locator(".tree-item[data-selected]").count()) throw new Error("Limpe a seleção antes de gerar; edição de imagens existentes não está habilitada.");
  const label = kind === "svg" ? "Create SVG" : "Create image";
  // O botão da toolbar apenas abre o painel; o submit é um controle diferente.
  const toolbar = page.locator('button[type="button"]').and(page.getByRole("button", { name: label, exact: true }));
  if (await toolbar.count() !== 1) throw new Error("Toolbar de geração ausente ou ambígua.");
  await toolbar.click();
  const dialog = page.getByRole("dialog");
  await dialog.locator('textarea[name="prompt"]').waitFor({ state: "visible" });
  return dialog;
}

async function fieldMenu(dialog, name) {
  const field = dialog.locator(`input[name="${name}"]`);
  if (await field.count() !== 1) return null;
  const button = field.locator("..").locator('button[aria-haspopup="menu"]');
  if (await button.count() !== 1) throw new Error("Seletor de geração ambíguo.");
  return button;
}

async function inspectMenu(page, dialog, name) {
  const button = await fieldMenu(dialog, name);
  if (!button) return { current: null, options: [] };
  await button.click();
  const items = await page.getByRole("menu").getByRole("menuitemradio").evaluateAll(nodes => nodes.map(node => ({
    label: node.innerText?.replace(/\s+/g, " ").trim(),
    enabled: node.getAttribute("aria-disabled") !== "true" && !node.hasAttribute("disabled") && !node.hasAttribute("data-disabled"),
    checked: node.getAttribute("aria-checked") === "true",
  })));
  const current = items.find(item => item.checked)?.label;
  await page.keyboard.press("Escape");
  if (!current || !items.length) throw new Error("Menu não expõe opções selecionáveis; inspecione a interface.");
  return { current, options: items };
}

async function inspect(page, kind = "image") {
  const dialog = await open(page, kind);
  try {
    const model = await inspectMenu(page, dialog, "model");
    const ratio = await inspectMenu(page, dialog, "aspectRatio");
    const otherControls = await dialog.locator("button,input,textarea,select").evaluateAll(nodes => nodes
      .filter(node => node.tagName !== "INPUT" || node.getAttribute("aria-hidden") !== "true")
      .map(node => ({ tag: node.tagName, type: node.type, label: node.getAttribute("aria-label"), text: node.tagName === "BUTTON" ? node.textContent?.trim() : undefined })));
    return { kind, prompt: { tag: "textarea", name: "prompt", editable: await dialog.locator('textarea[name="prompt"]').isEditable() },
      model: model.current, models: model.options, aspectRatio: ratio.current, aspectRatios: ratio.options,
      otherControls, cost: "Não confirmado pela interface inspecionada; pode consumir créditos.",
      limitations: ["Modelos listados não comprovam acesso no plano gratuito.", "Geração automatizada aceita somente modelos individuais; Variety pack exige validação adicional de conclusão múltipla.", "Seleção de referência e edição de imagens existentes não são automatizadas."] };
  } finally { await close(page); }
}

async function selectOption(page, dialog, field, label) {
  const button = await fieldMenu(dialog, field);
  if (!button) throw new Error("Parâmetro não disponível nesta ferramenta: " + field);
  await button.click();
  const item = page.getByRole("menu").getByRole("menuitemradio", { name: label, exact: true });
  if (await item.count() !== 1 || !await item.isEnabled() || await item.getAttribute("aria-disabled") === "true") throw new Error("Opção indisponível: " + label);
  await item.click();
}

async function prepare(page, parameters) {
  const dialog = await open(page, parameters.kind);
  try {
    await selectOption(page, dialog, "model", parameters.model);
    if (parameters.aspectRatio) await selectOption(page, dialog, "aspectRatio", parameters.aspectRatio);
    const prompt = dialog.locator('textarea[name="prompt"]');
    await prompt.fill(parameters.prompt);
    if (await prompt.inputValue() !== parameters.prompt) throw new Error("Prompt não foi aplicado.");
  } catch (error) { await close(page); throw error; }
}

async function close(page) {
  if (await page.getByRole("menu").count()) await page.keyboard.press("Escape");
  const prompt = page.getByRole("dialog").locator('textarea[name="prompt"]');
  if (await prompt.count()) await page.keyboard.press("Escape");
}

async function snapshot(page) {
  await assertPage(page);
  return page.locator(".paper-camera [data-node-id]").evaluateAll(nodes => nodes.map(node => node.getAttribute("data-node-id")));
}

async function media(page) {
  const rows = await page.locator(".paper-camera [data-node-id]").evaluateAll(async nodes => {
    const result = [];
    for (const node of nodes) {
      const style = getComputedStyle(node), box = node.getBoundingClientRect();
      if (box.width <= 0 || box.height <= 0 || style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) continue;
      const vector = node.tagName.toLowerCase() === "svg";
      const background = node.hasAttribute("data-has-image") && style.backgroundImage !== "none";
      const image = node.tagName === "IMG";
      if (!vector && !background && !image) continue;
      let loaded = vector, pixels = null;
      if (background || image) {
        const source = image ? node.currentSrc : style.backgroundImage.match(/^url\("?(.*?)"?\)$/)?.[1];
        if (source) pixels = await new Promise(resolve => {
          const probe = new Image();
          const timer = setTimeout(() => resolve(null), 1500);
          probe.onload = () => {
            clearTimeout(timer);
            try {
              const canvas = document.createElement("canvas");
              canvas.width = Math.min(probe.naturalWidth, 128); canvas.height = Math.min(probe.naturalHeight, 128);
              canvas.getContext("2d").drawImage(probe, 0, 0, canvas.width, canvas.height);
              resolve({ width: probe.naturalWidth, height: probe.naturalHeight, sample: canvas.toDataURL() });
            } catch { resolve(null); }
          };
          probe.onerror = () => { clearTimeout(timer); resolve(null); };
          probe.src = source;
        });
        loaded = pixels !== null;
      }
      if (!loaded) continue;
      result.push({ id: node.getAttribute("data-node-id"), media: vector ? "svg" : "image",
        signature: JSON.stringify({ width: style.width, height: style.height, pixels,
          size: style.backgroundSize, position: style.backgroundPosition, opacity: style.opacity,
          vector: vector ? node.outerHTML.replace(/ data-node-id="[^"]+"/g, "") : null }) });
    }
    return result;
  });
  return rows.map(({ signature, ...node }) => ({ ...node, fingerprint: hash(signature) }));
}

async function wait(page, before, { timeoutMs, kind, expectedCount } = {}) {
  const started = performance.now();
  while (performance.now() - started < timeoutMs) {
    await assertPage(page);
    const errors = await page.getByRole("alert").allTextContents();
    if (errors.some(text => /error|failed|credit|limit|upgrade|quota|erro|falh/i.test(text))) throw new Error("Paper exibiu erro, limite ou exigência de plano; confira o alerta na interface.");
    const nodes = (await media(page)).filter(node => !before.includes(node.id) && (kind !== "image" || node.media === "image"));
    const dialogOpen = await page.getByRole("dialog").locator('textarea[name="prompt"]').count();
    if (nodes.length && !dialogOpen && (!expectedCount || nodes.length === expectedCount)) return nodes;
    await page.waitForTimeout(250);
  }
  throw new Error("Tempo de espera esgotado; resultado incerto. Confira o canvas e execute image validate; não repita a submissão.");
}

async function verify(page, entry) {
  const current = await media(page);
  if (!entry.nodes?.length) return [];
  return entry.nodes.every(expected => current.some(node => node.id === expected.id && node.fingerprint === expected.fingerprint)) ? entry.nodes : [];
}

async function submit(page, parameters) {
  await assertPage(page);
  const dialog = page.getByRole("dialog");
  const selectedModel = await inspectMenu(page, dialog, "model");
  const selectedRatio = await inspectMenu(page, dialog, "aspectRatio");
  const prompt = await dialog.locator('textarea[name="prompt"]').inputValue();
  if (prompt !== parameters.prompt || selectedModel.current !== parameters.model || selectedRatio.current !== (parameters.aspectRatio ?? null)) throw new Error("Controles diferem do pedido autorizado; nenhuma geração foi submetida.");
  const label = parameters.kind === "svg" ? "Create SVG" : "Create image";
  const button = dialog.locator('button[type="submit"]').and(page.getByRole("button", { name: label, exact: true }));
  if (await button.count() !== 1 || !await button.isEnabled()) throw new Error("Geração indisponível; confira prompt, plano e créditos na interface.");
  await button.click();
}

async function importFile(page, file) {
  await assertPage(page);
  await page.keyboard.press("Escape");
  await page.keyboard.press("Control+Escape");
  if (await page.locator(".tree-item[data-selected]").count()) throw new Error("Limpe a seleção para importar uma nova camada.");
  const before = await snapshot(page);
  const chooserPromise = page.waitForEvent("filechooser", { timeout: 6000 });
  await page.keyboard.press("Control+Shift+k");
  const chooser = await chooserPromise;
  const accept = await chooser.element().getAttribute("accept");
  if (!accept?.includes("image/")) { await chooser.setFiles([]); throw new Error("Seletor público não aceita imagens."); }
  await chooser.setFiles(file);
  // Alguns formatos são inseridos imediatamente; outros ativam o cursor Place image.
  const autoPlaced = await page.waitForFunction(ids => [...document.querySelectorAll(".paper-camera [data-node-id]")].some(node => !ids.includes(node.getAttribute("data-node-id"))), before, { timeout: 1200 }).then(() => true, () => false);
  if (autoPlaced) return;
  const point = await page.evaluate(() => {
    const boxes = [...document.querySelectorAll(".paper-camera [data-node-id]")].map(node => node.getBoundingClientRect());
    for (let y = 120; y < innerHeight - 60; y += 64) {
      for (let x = 340; x < innerWidth - 300; x += 64) {
        if (document.elementFromPoint(x, y)?.tagName === "CANVAS" && !boxes.some(box => x >= box.left - 8 && x <= box.right + 8 && y >= box.top - 8 && y <= box.bottom + 8)) return { x, y };
      }
    }
    return null;
  });
  if (!point) { await page.keyboard.press("Escape"); throw new Error("Não há área livre para posicionar imagem; afaste o zoom e valide o canvas antes de repetir."); }
  await page.mouse.click(point.x, point.y);
}

export const imageUI = { inspect, prepare, close, snapshot, submit, wait, verify, media, importFile };
