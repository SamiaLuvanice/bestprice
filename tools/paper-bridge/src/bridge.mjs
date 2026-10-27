import { connect } from "./connection.mjs";
import { loadDesignSystem } from "./design-system.mjs";
import { configureFrame, DASHBOARD } from "./frames.mjs";
import { inspect, selectLayer } from "./editor.mjs";
import { readProperties } from "./properties.mjs";
import { acquireLock, beginReport, finishReport } from "./logger.mjs";
import { compareProperties } from "./validation.mjs";
import { resolveColor } from "./design-system.mjs";
import { addText, verifyText } from "./text.mjs";
import { createScreen } from "./composition.mjs";
import { readFile } from "node:fs/promises";

const operations = new Set(["status", "inspect", "create-frame", "add-text", "screenshot", "validate", "design-system", "create-screen"]);

export async function runOperation(operation, options = {}, runtime = { connect, loadDesignSystem, acquireLock, beginReport, finishReport }) {
  let release, connection, report, result;
  try {
    if (!operations.has(operation)) throw new Error("Operação desconhecida: " + operation);
    release = await runtime.acquireLock();
    const ds = await runtime.loadDesignSystem();
    if (operation === "design-system") result = { success: true, operation, element: null, verified: true, evidence: ds };
    else {
      connection = await runtime.connect(options);
      const page = connection.page;
      try { report = await runtime.beginReport(operation, page); }
      catch { throw new Error("Screenshot indisponível. Restaure a janela do Paper se estiver minimizada e tente novamente."); }
      switch (operation) {
        case "status":
          result = { success: true, operation, element: "BestPrice Bridge Test", verified: true, evidence: { title: await page.title() } };
          break;
        case "inspect":
          result = { success: true, operation, element: "BestPrice Bridge Test", verified: true, evidence: await inspect(page) };
          break;
        case "create-frame":
          result = await configureFrame(page, ds, options);
          break;
        case "add-text":
          result = await addText(page, ds, options);
          break;
        case "create-screen": {
          let screen = options;
          if (options.file) {
            try { screen = JSON.parse(await readFile(options.file, "utf8")); }
            catch { throw new Error("Arquivo de composição ausente ou JSON inválido."); }
          }
          result = await createScreen(page, ds, screen);
          break;
        }
        case "screenshot":
          result = { success: true, operation, element: "BestPrice Bridge Test", verified: true };
          break;
        case "validate": {
          if (options.text) {
            result = { ...await verifyText(page, ds, options), operation };
            break;
          }
          const name = options.name ?? DASHBOARD;
          await selectLayer(page, name);
          const properties = await readProperties(page);
          const checked = compareProperties(properties, {
            Width: Number(options.width ?? 1440), Height: Number(options.height ?? 900),
            X: Number(options.x ?? 0), Y: Number(options.y ?? 0),
            Fill: resolveColor(ds, options.background ?? "design-token"),
          });
          result = { success: checked.verified, operation, element: name, verified: checked.verified, evidence: { properties, checks: checked.checks } };
          break;
        }
        default: throw new Error("Capacidade ainda não implementada: " + operation);
      }
    }
  } catch (error) {
    const message = error.name === "TimeoutError" ? "Controle não respondeu; inspecione o documento antes de repetir." : error.message.split("\n")[0].replace(/https?:\/\/[^\s]+/g, "[endereço omitido]");
    result = { success: false, operation, element: options.name ?? null, verified: false, error: message };
  } finally {
    const finalizationErrors = [];
    try { if (result) await runtime.finishReport(report, connection?.page, result); }
    catch { finalizationErrors.push("Não foi possível gravar todas as evidências."); }
    try { if (connection) await connection.disconnect(); }
    catch { finalizationErrors.push("Falha ao desconectar o cliente CDP."); }
    try { if (release) await release(); }
    catch { finalizationErrors.push("Lock não liberado; confira o processo antes de remover o arquivo."); }
    if (finalizationErrors.length) {
      result = { ...result, success: false, limitations: [...(result.limitations ?? []), ...finalizationErrors] };
    }
  }
  return result;
}

export function createPaper(options = {}) {
  return {
    status: () => runOperation("status", options),
    inspect: () => runOperation("inspect", options),
    createFrame: values => runOperation("create-frame", { ...options, ...values }),
    addText: values => runOperation("add-text", { ...options, ...values }),
    createScreen: values => runOperation("create-screen", { ...options, ...values }),
    screenshot: () => runOperation("screenshot", options),
    validate: values => runOperation("validate", { ...options, ...values }),
  };
}
