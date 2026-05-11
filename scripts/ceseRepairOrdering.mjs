/**
 * CESE-1 — deterministic repair ordering for pending amendments / CRA items.
 * @see docs/COMPENSATION_EXECUTION_SEMANTICS_ENGINE_V1.md §6
 *
 *   npm run epistemic:cese-order -- --file scripts/fixtures/cese-ordering-items.json
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

/**
 * Deterministic string compare (UTF-16 code units).
 * @param {string} a
 * @param {string} b
 */
export function compareDeterministic(a, b) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * @typedef {{ id: string, compensationOf?: string | null, priorAnchor: string }} RepairItem
 */

/**
 * @param {string} id
 * @param {Map<string, RepairItem>} byId
 * @param {Map<string, number>} memo
 * @param {Set<string>} visiting
 * @returns {number} depth, or -1 if cycle
 */
function getDepthFor(id, byId, memo, visiting) {
  if (memo.has(id)) return memo.get(id);
  if (visiting.has(id)) return -1;
  visiting.add(id);
  const item = byId.get(id);
  const co = item?.compensationOf?.trim() || "";
  if (!co || !byId.has(co)) {
    memo.set(id, 0);
    visiting.delete(id);
    return 0;
  }
  const pd = getDepthFor(co, byId, memo, visiting);
  if (pd < 0) {
    visiting.delete(id);
    return -1;
  }
  const out = pd + 1;
  memo.set(id, out);
  visiting.delete(id);
  return out;
}

/**
 * @param {RepairItem[]} items
 * @returns {{ ok: boolean, ordered: RepairItem[], error?: string }}
 */
export function orderRepairsDeterministic(items) {
  const byId = new Map();
  for (const it of items) {
    if (!it || typeof it.id !== "string" || !it.id.trim()) {
      return { ok: false, ordered: [], error: "CESE_CRA_INVALID: each item needs non-empty id" };
    }
    const id = it.id.trim();
    if (byId.has(id)) {
      return { ok: false, ordered: [], error: `CESE_CRA_INVALID: duplicate id ${id}` };
    }
    const priorAnchor = typeof it.priorAnchor === "string" ? it.priorAnchor : "";
    byId.set(id, {
      id,
      compensationOf: it.compensationOf == null || it.compensationOf === "" ? null : String(it.compensationOf).trim(),
      priorAnchor
    });
  }

  const memo = new Map();
  for (const id of byId.keys()) {
    const visiting = new Set();
    const d = getDepthFor(id, byId, memo, visiting);
    if (d < 0) {
      return { ok: false, ordered: [], error: "CESE_ORDER_CYCLE" };
    }
  }

  const list = [...byId.values()];
  list.sort((a, b) => {
    const da = memo.get(a.id) ?? 0;
    const db = memo.get(b.id) ?? 0;
    if (da !== db) return da - db;
    const c1 = compareDeterministic(a.priorAnchor, b.priorAnchor);
    if (c1 !== 0) return c1;
    return compareDeterministic(a.id, b.id);
  });

  return { ok: true, ordered: list };
}

function main() {
  const argv = process.argv.slice(2);
  const fi = argv.indexOf("--file");
  if (fi === -1 || !argv[fi + 1]) {
    console.error("Usage: npm run epistemic:cese-order -- --file path/to/items.json");
    process.exit(1);
  }
  let raw;
  try {
    raw = readFileSync(resolve(ROOT, argv[fi + 1]), "utf8");
  } catch {
    console.error("ceseRepairOrdering: cannot read file");
    process.exit(1);
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    console.error("ceseRepairOrdering: invalid JSON");
    process.exit(1);
  }
  if (!Array.isArray(data)) {
    console.error("ceseRepairOrdering: root must be array of RepairItem");
    process.exit(1);
  }
  const r = orderRepairsDeterministic(data);
  console.log(JSON.stringify({ ceseVersion: "1.0", ...r }, null, 2));
  process.exit(r.ok ? 0 : 1);
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main();
}
