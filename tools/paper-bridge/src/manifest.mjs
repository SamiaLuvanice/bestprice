import { createHash } from "node:crypto";
import { readFile, mkdir, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const stateDir = fileURLToPath(new URL("../state/", import.meta.url));
export const hash = value => createHash("sha256").update(value).digest("hex");

function isValidManifest(manifest) {
  if (manifest?.schemaVersion !== 1 || !manifest.screens || typeof manifest.screens !== "object" || Array.isArray(manifest.screens)) return false;
  return Object.entries(manifest.screens).every(([key, screen]) =>
    /^[a-z0-9-]{1,48}:(desktop|tablet|mobile)$/.test(key)
    && screen && typeof screen === "object" && !Array.isArray(screen)
    && Number.isSafeInteger(screen.version) && screen.version > 0
    && ["pending", "synced"].includes(screen.status)
    && typeof screen.sourceHash === "string" && /^[a-f0-9]{64}$/.test(screen.sourceHash)
    && typeof screen.rootName === "string" && screen.rootName.length <= 200
    && (screen.paperNodeId === null || typeof screen.paperNodeId === "string")
    && (screen.fingerprint === null || typeof screen.fingerprint === "string" && /^[a-f0-9]{64}$/.test(screen.fingerprint))
  );
}

export function planSync({ previous, sourceHash, fingerprint, newVersion = false }) {
  if (!previous) return { action: "import", version: 1 };
  if (previous.status !== "synced") throw new Error("Sincronização interrompida; inspecione o canvas antes de continuar.");
  if (previous.status === "synced" && previous.sourceHash === sourceHash && previous.fingerprint === fingerprint) return { action: "reuse", version: previous.version };
  if (!newVersion) throw new Error(previous.sourceHash === sourceHash ? "Conflito: a tela foi alterada ou removida no canvas." : "Referência mudou; solicite nova versão com --new-version.");
  return { action: "import", version: previous.version + 1 };
}

export async function readManifest(directory = stateDir) {
  try {
    const manifest = JSON.parse(await readFile(path.join(directory, "manifest.json"), "utf8"));
    if (!isValidManifest(manifest)) throw new Error();
    return manifest;
  } catch (error) {
    if (error.code === "ENOENT") return { schemaVersion: 1, screens: {} };
    throw new Error("Manifesto inválido. Preserve o arquivo e resolva antes de sincronizar.");
  }
}

export async function writeManifest(manifest, directory = stateDir) {
  await mkdir(directory, { recursive: true });
  const temporary = path.join(directory, "manifest.pending.json");
  await writeFile(temporary, JSON.stringify(manifest, null, 2));
  await rename(temporary, path.join(directory, "manifest.json"));
}
