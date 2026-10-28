import { parseArgs } from "node:util";
import { runOperation } from "./bridge.mjs";
import { pathToFileURL } from "node:url";

export async function main(args = process.argv.slice(2), write = value => console.log(JSON.stringify(value, null, 2))) {
  const imageCommand = args[0] === "image";
  const operation = imageCommand ? "image-" + (args[1] ?? "help") : args[0] ?? "help";
  if (operation === "help" || operation === "--help") {
    write({ success: true, operation: "help", element: null, verified: false, commands: ["status", "inspect", "create-frame", "add-text", "screenshot", "validate", "design-system", "create-screen", "sync", "image inspect", "image generate", "image import", "image validate"], options: ["--name", "--reuse", "--width", "--height", "--x", "--y", "--background", "--parent", "--text", "--font-size", "--font-weight", "--color", "--endpoint", "--document", "--file", "--screen", "--viewport", "--new-version", "--prompt-file", "--model", "--aspect-ratio", "--kind", "--confirm", "--timeout-ms", "--source", "--usage"] });
    return 0;
  }
  try {
    const keys = ["name", "reuse", "width", "height", "x", "y", "background", "parent", "text", "font-size", "font-weight", "color", "endpoint", "document", "file", "screen", "viewport", "new-version", "prompt-file", "model", "aspect-ratio", "kind", "confirm", "timeout-ms", "source", "usage"];
    const parsed = parseArgs({ args: args.slice(imageCommand ? 2 : 1), options: Object.fromEntries(keys.map(key => [key, { type: key === "new-version" ? "boolean" : "string" }])), strict: true });
    const values = { ...parsed.values, fontSize: parsed.values["font-size"], fontWeight: parsed.values["font-weight"] };
    values.newVersion = values["new-version"] ?? false;
    values.promptFile = values["prompt-file"];
    values.aspectRatio = values["aspect-ratio"];
    values.timeoutMs = values["timeout-ms"];
    const result = await runOperation(operation, values);
    write(result);
    return result.success ? 0 : 1;
  } catch {
    write({ success: false, operation, element: null, verified: false, error: "Argumentos inválidos. Consulte npm run paper -- help." });
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = await main();
