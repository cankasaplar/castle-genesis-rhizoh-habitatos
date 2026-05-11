/**
 * EBVM-1 — trace replay / execution consistency verifier.
 * @see docs/EVALUATE_BIND_VIRTUAL_MACHINE_V1.md
 *
 *   npm run epistemic:csb-vm-replay
 *   node scripts/csbVmReplay.mjs <manifest.json> <inputs.json> <recorded-steps.json>
 */

import { readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { replayVmTrace } from "./evaluateBind.mjs";

function readJsonPath(p) {
  const full = isAbsolute(p) ? p : resolve(process.cwd(), p);
  return JSON.parse(readFileSync(full, "utf8"));
}

function main() {
  const argv = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  const manifestPath = argv[0] ?? "scripts/fixtures/emcs-sample-manifest.json";
  const inputsPath = argv[1] ?? "scripts/fixtures/emcs-sample-inputs-pass.json";
  const recordedPath = argv[2] ?? "scripts/fixtures/emcs-vm-trace-pass.json";

  let manifest;
  let inputs;
  let recorded;
  try {
    manifest = readJsonPath(manifestPath);
    inputs = readJsonPath(inputsPath);
    recorded = readJsonPath(recordedPath);
  } catch (e) {
    console.error("csbVmReplay:", e.message);
    process.exit(1);
  }

  const r = replayVmTrace(manifest, inputs, recorded);
  console.log(JSON.stringify({ replay: "EBVM-1.0", ...r }, null, 2));
  process.exit(r.ok ? 0 : 1);
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main();
}
