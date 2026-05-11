/**
 * Print SHA256 (hex) of STABILIZATION_GRAPH.md after LF normalization.
 * After editing the graph doc, run this and commit scripts/stabilization-graph.sha256.lock:
 *
 *   node scripts/print-stabilization-graph-hash.mjs > scripts/stabilization-graph.sha256.lock
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const GRAPH_PATH = join(REPO_ROOT, "STABILIZATION_GRAPH.md");

function normalizeLf(content) {
  return content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function stabilizationGraphSha256Hex() {
  const raw = readFileSync(GRAPH_PATH, "utf8");
  return createHash("sha256").update(normalizeLf(raw), "utf8").digest("hex");
}

console.log(stabilizationGraphSha256Hex());
