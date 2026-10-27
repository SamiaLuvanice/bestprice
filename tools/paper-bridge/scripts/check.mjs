import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
for (const dir of ["src", "tests", "scripts"]) {
  for (const file of await readdir(new URL("../" + dir + "/", import.meta.url))) {
    if (!file.endsWith(".mjs")) continue;
    const result = spawnSync(process.execPath, ["--check", fileURLToPath(new URL("../" + dir + "/" + file, import.meta.url))], { stdio: "inherit" });
    if (result.status !== 0) process.exitCode = 1;
  }
}
