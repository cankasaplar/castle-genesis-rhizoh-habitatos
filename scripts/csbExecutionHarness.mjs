/**
 * CSB execution harness — execution consistency verifier (determinism + defined exit + CSB_ERR space).
 * Not a "truth check"; verifies evaluator behavior under EMCS-1.
 * @see docs/ENGINE_MANIFEST_CANONICAL_SCHEMA_V1.md
 *
 *   npm run epistemic:csb-harness
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { evaluateBind, stableStringifyForDeterminism } from "./evaluateBind.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

/**
 * @param {typeof evaluateBind} evaluateBindFn
 * @param {object} manifest
 * @param {{ name?: string, input: object }[]} testCases
 */
export function runCSBHarness(evaluateBindFn, manifest, testCases) {
  for (const t of testCases) {
    const label = t.name ?? "(unnamed)";
    const r1 = evaluateBindFn(manifest, t.input);
    const r2 = evaluateBindFn(manifest, t.input);

    if (stableStringifyForDeterminism(r1) !== stableStringifyForDeterminism(r2)) {
      const err = new Error(`DETERMINISM_FAILURE:${label}`);
      err.cause = { r1, r2 };
      throw err;
    }

    if (r1.ok === undefined) {
      throw new Error(`UNDEFINED_EXIT:${label}`);
    }

    if (r1.ok === false) {
      const code = r1.error;
      if (typeof code !== "string" || !code.startsWith("CSB_ERR_")) {
        throw new Error(`OUT_OF_SPACE_ERROR:${label}:${code}`);
      }
    }
  }
}

function readJson(rel) {
  return JSON.parse(readFileSync(resolve(ROOT, rel), "utf8"));
}

function main() {
  const manifest = readJson("scripts/fixtures/emcs-sample-manifest.json");
  const pass = readJson("scripts/fixtures/emcs-sample-inputs-pass.json");
  const failG0 = readJson("scripts/fixtures/emcs-sample-inputs-fail-g0.json");

  runCSBHarness(evaluateBind, manifest, [
    { name: "pass", input: pass },
    { name: "fail_g0", input: failG0 }
  ]);

  console.log(JSON.stringify({ harness: "CSB-1", ok: true, cases: 2 }, null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  try {
    main();
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
