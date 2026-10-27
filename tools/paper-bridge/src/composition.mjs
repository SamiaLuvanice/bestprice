import { frameOptions, configureFrame } from "./frames.mjs";
import { textOptions, addText } from "./text.mjs";
import { resolveColor } from "./design-system.mjs";

export function screenOptions(ds, options) {
  const frame = frameOptions(options);
  resolveColor(ds, frame.background);
  if (!Array.isArray(options.components) || !options.components.length) throw new Error("Composição requer uma lista não vazia de componentes.");
  const names = new Set([frame.name]);
  const components = options.components.map(component => {
    if (component.type !== "text") throw new Error("Componente sem conversão comprovada: " + component.type + ". Nesta versão use text; header/sidebar/dashboard-content ficam pendentes.");
    const values = textOptions({ ...component, parent: frame.name });
    resolveColor(ds, values.color);
    if (names.has(values.name)) throw new Error("Nomes duplicados na composição.");
    if (values.x >= frame.width || values.y >= frame.height) throw new Error("Texto fora das dimensões da tela.");
    names.add(values.name);
    return values;
  });
  return { frame, components };
}

export async function createScreen(page, ds, options, operations = { configureFrame, addText }) {
  const screen = screenOptions(ds, options);
  const results = [await operations.configureFrame(page, ds, screen.frame)];
  for (const component of screen.components) {
    if (!results.at(-1).success) break;
    try { results.push(await operations.addText(page, ds, component)); }
    catch {
      results.push({ success: false, operation: "add-text", element: component.name, verified: false, error: "Componente não concluído; inspecione a tela antes de repetir." });
      break;
    }
  }
  const verified = results.length === screen.components.length + 1 && results.every(result => result.verified);
  return { success: verified, operation: "create-screen", element: screen.frame.name, verified, evidence: { components: results }, limitations: ["Composição comprovada de frame e textos; conversão de componentes React e regras responsivas pendente."] };
}
