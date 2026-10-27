import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../../../", import.meta.url));
export function normalizeHex(value) {
  const hex = value.replace(/^#/, "").toLowerCase();
  if (/^[0-9a-f]{3}$/.test(hex)) return "#" + [...hex].map(c => c + c).join("");
  if (/^[0-9a-f]{6}$/.test(hex)) return "#" + hex;
  throw new Error("Token sem conversão hexadecimal suportada: " + value);
}

export async function loadDesignSystem() {
  const css = await readFile(path.join(root, "frontend/src/styles.css"), "utf8");
  const researchCss = await readFile(path.join(root, "frontend/src/features/research/research.css"), "utf8");
  const app = await readFile(path.join(root, "frontend/src/App.tsx"), "utf8");
  const research = await readFile(path.join(root, "frontend/src/features/research/ResearchArea.tsx"), "utf8");
  const rootBlock = css.match(/:root\s*\{([\s\S]*?)\n\}/)?.[1];
  if (!rootBlock) throw new Error("Tokens :root não encontrados.");
  const tokens = Object.fromEntries([...rootBlock.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]));
  function resolve(name, chain = []) {
    if (chain.includes(name) || !(name in tokens)) throw new Error("Token ausente ou cíclico: " + name);
    const value = tokens[name];
    return value.replace(/var\(--([\w-]+)\)/g, (_, next) => resolve(next, [...chain, name]));
  }
  const colors = {};
  for (const name of Object.keys(tokens)) {
    const value = resolve(name);
    if (/^#[\da-f]{3,6}$/i.test(value)) colors[name] = normalizeHex(value);
  }
  const group = prefix => Object.fromEntries(Object.entries(tokens).filter(([name]) => name.startsWith(prefix)).map(([name]) => [name, resolve(name)]));
  const componentDirs = ["components", "components/ui", "dashboard", "features/research"];
  const components = (await Promise.all(componentDirs.map(async dir =>
    (await readdir(path.join(root, "frontend/src", dir))).filter(name => name.endsWith(".tsx") && !name.includes(".test.")).map(name => "frontend/src/" + dir + "/" + name)
  ))).flat();
  return {
    sources: ["frontend/src/styles.css", "frontend/src/features/research/research.css", "frontend/src/App.tsx", "frontend/src/features/research/ResearchArea.tsx", "designsystem/index.html", "designsystem/brand-spec.md"],
    colors, spacing: group("space-"), radius: group("radius-"), shadows: group("shadow-"),
    typography: { display: resolve("font-display"), body: rootBlock.match(/(?:^|\n)\s*font-family:\s*([^;]+);/)?.[1] },
    breakpoints: [...new Set([... (css + researchCss).matchAll(/@media\s*\((min|max)-width:\s*(\d+)px\)/g)].map(m => m[1] + "-width: " + m[2] + "px"))],
    routes: [...new Set([...[...app.matchAll(/<Route path="([^"]+)"/g)].map(m => m[1]), ...[...research.matchAll(/href: '([^']+)'/g)].map(m => m[1])])],
    components,
    layout: { pageWidth: resolve("page-width"), pageGutter: resolve("page-gutter"), researchShell: researchCss.match(/\.research-shell \{[^}]+\}/)?.[0] },
    limitations: ["Inventário de fontes estáticas; não substitui layout computado.", "Fontes do sistema precisam existir no Windows/Paper.", "Sombras, componentes React e breakpoints não são convertidos automaticamente em camadas."],
  };
}

export function resolveColor(ds, name = "background") {
  const key = name === "design-token" ? "background" : name.replace(/^--/, "");
  if (!Object.hasOwn(ds.colors, key)) throw new Error("Token de cor desconhecido: " + key);
  return ds.colors[key];
}

export function hexToRgb(value) {
  const hex = normalizeHex(value).slice(1);
  return "rgb(" + [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16)).join(", ") + ")";
}
