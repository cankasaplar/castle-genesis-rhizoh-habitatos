/**
 * EQR-1 — epistemic retrieval compiler: deterministic reconstruction plan (read-only, compile-time).
 * @see docs/EPISODIC_QUERY_RECONSTRUCTION_V1.md
 *
 *   npm run epistemic:eqr-plan -- --file scripts/fixtures/eqr-sample-query.json
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const LAYER_ORDER = Object.freeze([
  "SNAPSHOT_LOCK",
  "TAL",
  "CRA",
  "EPOCH",
  "ECG_EXPORT",
  "GEMC_ROLLUP",
  "WORLDSTATE"
]);

function stableStringify(obj) {
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) return `[${obj.map(stableStringify).join(",")}]`;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => JSON.stringify(k) + ":" + stableStringify(obj[k])).join(",")}}`;
}

/**
 * @param {Record<string, unknown>} query
 */
export function buildEqrPlan(query) {
  const snap = String(query.commitSnapshot ?? "").trim();
  if (!snap) {
    return {
      eqrVersion: "1.0",
      ok: false,
      error: "EQR_SNAPSHOT_MISSING",
      planId: null,
      steps: []
    };
  }

  const requested = Array.isArray(query.layers) ? query.layers.map(String) : [];
  const unknown = requested.filter((l) => !LAYER_ORDER.includes(l) && l !== "SNAPSHOT_LOCK");
  if (unknown.length) {
    return {
      eqrVersion: "1.0",
      ok: false,
      error: "EQR_LAYER_UNAVAILABLE",
      detail: `unknown layers: ${unknown.join(", ")}`,
      planId: null,
      steps: []
    };
  }

  const steps = [];
  steps.push({
    order: 0,
    layer: "SNAPSHOT_LOCK",
    action: "verify_commit_tree",
    inputs: { commitSnapshot: snap }
  });

  let o = 1;
  for (const layer of LAYER_ORDER) {
    if (layer === "SNAPSHOT_LOCK") continue;
    if (!requested.includes(layer)) continue;
    steps.push({
      order: o++,
      layer,
      action:
        layer === "TAL"
          ? "read_tal_anchors"
          : layer === "CRA"
            ? "walk_cra_lineage"
            : layer === "EPOCH"
              ? "partial_epoch_witness"
              : layer === "ECG_EXPORT"
                ? "load_exported_subgraph"
                : layer === "GEMC_ROLLUP"
                  ? "resolve_rollup_manifest"
                  : "load_worldstate_envelope",
      inputs:
        layer === "TAL"
          ? { anchors: query.filters?.talAnchors ?? [] }
          : layer === "CRA"
            ? { craArtifactIds: query.filters?.craArtifactIds ?? [] }
            : layer === "EPOCH"
              ? { window: query.bounds?.epochWindow ?? null }
              : {}
    });
  }

  const canonical = stableStringify({
    snap,
    layers: [...requested].sort(),
    bounds: query.bounds ?? null,
    filters: query.filters ?? null
  });
  const planId = createHash("sha256").update(`EQR-1|${canonical}`).digest("hex");

  return {
    eqrVersion: "1.0",
    ok: true,
    planId,
    deterministic: true,
    observerConsistent: true,
    steps,
    notes: [
      "Plan is read-only; no mutation of TAL/ECG/CIL.",
      "Partial epoch: bounds must be complete or EQR_EPOCH_GAP at execution time."
    ]
  };
}

function main() {
  const argv = process.argv.slice(2);
  const fi = argv.indexOf("--file");
  if (fi === -1 || !argv[fi + 1]) {
    console.error("Usage: npm run epistemic:eqr-plan -- --file path/to/eqr-sample-query.json");
    process.exit(1);
  }
  let raw;
  try {
    raw = readFileSync(resolve(ROOT, argv[fi + 1]), "utf8");
  } catch {
    console.error("eqrReconstructionPlan: cannot read file");
    process.exit(1);
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    console.error("eqrReconstructionPlan: invalid JSON");
    process.exit(1);
  }
  const plan = buildEqrPlan(data);
  console.log(JSON.stringify(plan, null, 2));
  process.exit(plan.ok ? 0 : 1);
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main();
}
