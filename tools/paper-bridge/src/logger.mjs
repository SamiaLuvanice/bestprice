import { mkdir, open, unlink, appendFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

export const reportsDir = fileURLToPath(new URL("../reports/", import.meta.url));
const lockPath = path.join(tmpdir(), "bestprice-paper-bridge-test.lock");

export async function acquireLock() {
  let handle;
  try { handle = await open(lockPath, "wx"); }
  catch (error) {
    if (error.code === "EEXIST") throw new Error("Paper Bridge ocupada. Lock: " + lockPath + ". Confira o processo antes de remover um lock abandonado.");
    throw error;
  }
  await handle.writeFile(JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }));
  return async () => { await handle.close(); await unlink(lockPath); };
}

export async function beginReport(operation, page) {
  await mkdir(reportsDir, { recursive: true });
  const id = new Date().toISOString().replace(/[:.]/g, "-") + "-" + randomUUID().slice(0, 8);
  const prefix = path.join(reportsDir, id + "-" + operation);
  await page.screenshot({ path: prefix + "-before.png" });
  return { id, prefix, before: prefix + "-before.png" };
}

export async function finishReport(report, page, result) {
  if (page && report) {
    try {
      await page.screenshot({ path: report.prefix + "-after.png" });
      result.evidence = { ...result.evidence, before: report.before, after: report.prefix + "-after.png" };
    } catch { result.limitations = [...(result.limitations ?? []), "Screenshot final indisponível."]; }
    await writeFile(report.prefix + ".json", JSON.stringify(result, null, 2));
  }
  await mkdir(reportsDir, { recursive: true });
  await appendFile(path.join(reportsDir, "operations.jsonl"), JSON.stringify({ timestamp: new Date().toISOString(), ...result }) + "\n");
  return result;
}
