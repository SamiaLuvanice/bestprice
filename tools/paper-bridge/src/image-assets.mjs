import { readFile, mkdir, writeFile, rename, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hash } from "./manifest.mjs";

export const imageStateDir = fileURLToPath(new URL("../state/", import.meta.url));
export const imageAssetDir = fileURLToPath(new URL("../assets/bestprice-ia/images/", import.meta.url));

export function validateSvg(text) {
  const tags = new Set("svg g path rect circle ellipse line polyline polygon defs linearGradient radialGradient stop clipPath mask title desc text tspan use".split(" "));
  const attributes = new Set("xmlns id width height viewBox fill fill-rule fill-opacity stroke stroke-width stroke-linecap stroke-linejoin stroke-opacity stroke-dasharray stroke-dashoffset opacity d x y x1 x2 y1 y2 cx cy r rx ry points transform gradientUnits gradientTransform offset stop-color stop-opacity clip-path clipPathUnits mask maskUnits maskContentUnits preserveAspectRatio font-size font-family font-weight text-anchor dominant-baseline dx dy href".split(" "));
  const source = text.trim().replace(/^<\?xml[^?]*\?>\s*/, "").replace(/<!--[\s\S]*?-->/g, "");
  if (!source.startsWith("<svg") || /[&]|<!|<\?|url\s*\((?!\s*#)/i.test(source)) throw new Error("SVG deve ser estático, sem entidades ou recursos externos.");
  const stack = [];
  let roots = 0, cursor = 0;
  for (const match of source.matchAll(/<([^>]+)>/g)) {
    if (source.slice(cursor, match.index).includes("<")) throw new Error("SVG inválido.");
    cursor = match.index + match[0].length;
    const token = match[1], closing = token.startsWith("/"), selfClosing = token.endsWith("/");
    const name = token.match(/^\/?([a-zA-Z][a-zA-Z0-9]*)\b/)?.[1];
    if (!tags.has(name)) throw new Error("Elemento SVG não suportado ou ativo.");
    if (closing) {
      if (token.trim() !== "/" + name || stack.pop() !== name) throw new Error("SVG malformado.");
      continue;
    }
    if (!stack.length && (++roots > 1 || name !== "svg")) throw new Error("SVG deve possuir uma raiz.");
    let rest = token.slice(name.length).replace(/\/$/, "");
    const seen = new Set();
    while (rest.trim()) {
      const attribute = rest.match(/^\s+([a-zA-Z][a-zA-Z0-9-]*)\s*=\s*("[^"]*"|'[^']*')/);
      if (!attribute || !attributes.has(attribute[1]) || seen.has(attribute[1])) throw new Error("Atributo SVG não suportado; remova estilos, eventos e conteúdo ativo.");
      const [, key, quoted] = attribute, value = quoted.slice(1, -1);
      if (key === "xmlns" && value !== "http://www.w3.org/2000/svg" || key === "href" && !/^#[\w-]+$/.test(value)
        || /[<>\\]|javascript:|data:|https?:|\/\//i.test(key === "xmlns" ? "" : value)) throw new Error("Recurso SVG externo ou ativo recusado.");
      seen.add(key);
      rest = rest.slice(attribute[0].length);
    }
    if (!selfClosing) stack.push(name);
  }
  if (stack.length || roots !== 1 || source.slice(cursor).trim()) throw new Error("SVG malformado.");
  return text;
}

export async function readImageFile(file) {
  if (!file) throw new Error("Informe --file PNG, JPG, WebP ou SVG local.");
  const extension = path.extname(file).toLowerCase();
  if (![".png", ".jpg", ".jpeg", ".webp", ".svg"].includes(extension)) throw new Error("Formato não suportado; use PNG, JPG, WebP ou SVG.");
  const info = await stat(file);
  if (!info.isFile() || info.size < 1 || info.size > 20 * 1024 * 1024) throw new Error("Imagem deve ser arquivo local de até 20 MiB.");
  const bytes = await readFile(file);
  let valid;
  if (extension === ".svg") { validateSvg(bytes.toString("utf8")); valid = true; }
  else if (extension === ".png") valid = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  else if (extension === ".webp") valid = bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP";
  else valid = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (!valid) throw new Error("Conteúdo incompatível com a extensão da imagem.");
  return { bytes, extension, contentHash: hash(bytes), basename: path.basename(file) };
}

export async function storeImageFile(source, directory = imageAssetDir) {
  const relative = (source.extension === ".svg" ? "svg/" : "imported/") + source.contentHash + source.extension;
  const destination = path.join(directory, relative);
  await mkdir(path.dirname(destination), { recursive: true });
  try { await writeFile(destination, source.bytes, { flag: "wx" }); }
  catch (error) {
    if (error.code !== "EEXIST") throw error;
    if (hash(await readFile(destination)) !== source.contentHash) throw new Error("Asset local alterado; não será sobrescrito.");
  }
  return { relative, destination };
}

export async function readImages(directory = imageStateDir) {
  try {
    const value = JSON.parse(await readFile(path.join(directory, "images.json"), "utf8"));
    if (value?.schemaVersion !== 1 || !Array.isArray(value.assets) || !Array.isArray(value.requests)
      || [...value.assets, ...value.requests].some(entry => !entry || typeof entry.key !== "string" || !/^[a-f0-9]{64}$/.test(entry.key))) throw new Error();
    return value;
  } catch (error) {
    if (error.code === "ENOENT") return { schemaVersion: 1, assets: [], requests: [] };
    throw new Error("Manifesto de imagens inválido; preserve e confira state/images.json.");
  }
}

export async function writeImages(value, directory = imageStateDir) {
  await mkdir(directory, { recursive: true });
  const temporary = path.join(directory, "images.pending.json");
  await writeFile(temporary, JSON.stringify(value, null, 2));
  await rename(temporary, path.join(directory, "images.json"));
}

export { hash };
