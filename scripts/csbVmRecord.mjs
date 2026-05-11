/**
 * EBVM-1 — record evaluateBindVm trace (deterministic debug layer).
 * @see docs/EVALUATE_BIND_VIRTUAL_MACHINE_V1.md
 *
 *   npm run epistemic:csb-vm
 *   node scripts/csbVmRecord.mjs <manifest.json> <inputs.json>
 */

import { readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { evaluateBindVm } from "./evaluateBind.mjs";

function readJsonPath(p) {
  const full = isAbsolute(p) ? p : resolve(process.cwd(), p);
  return JSON.parse(readFileSync(full, "utf8"));
}

function main() {
  const argv = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  let manifestPath = argv[0];
  let inputsPath = argv[1];
  if (!manifestPath || !inputsPath) {
    manifestPath = "scripts/fixtures/emcs-sample-manifest.json";
    inputsPath = "scripts/fixtures/emcs-sample-inputs-pass.json";
  }
  let manifest;
  let inputs;
  try {
    manifest = readJsonPath(manifestPath);
    inputs = readJsonPath(inputsPath);
  } catch (e) {
    console.error("csbVmRecord:", e.message);
    process.exit(1);
  }
  const vm = evaluateBindVm(manifest, inputs);
  console.log(JSON.stringify(vm, null, 2));
  process.exit(vm.result?.ok ? 0 : 1);
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main();
}
