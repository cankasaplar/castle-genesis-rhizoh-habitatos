/**
 * GCR-1 — read-only multi-CRA reconcile report (stub implementation).
 * @see docs/GLOBAL_CONSISTENCY_RECONCILIATION_V1.md
 *
 *   npm run epistemic:gcr-reconcile -- --file scripts/fixtures/gcr-multi-cra-bundle.json
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { orderRepairsDeterministic } from "./ceseRepairOrdering.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

/** @typedef {{ amendmentId?: string, compensationOf?: string | null, priorCraAnchor?: string | null, ceeArtifactId?: string, targetsRemaining?: string[], inject?: { aeePhases?: string[] } }} CraLike */

/**
 * @param {{ cras: CraLike[] }} bundle
 * @returns {{ gcrVersion: string, ok: boolean, findings: { code: string, severity: string, detail: string }[] }}
 */
export function reconcileMultiCra(bundle) {
  const findings = [];
  const cras = Array.isArray(bundle.cras) ? bundle.cras : [];

  const byAmendment = new Map();
  for (const c of cras) {
    const aid = c.amendmentId?.trim();
    if (!aid) {
      findings.push({
        code: "GCR_CRA_INVALID",
        severity: "error",
        detail: "CRA missing amendmentId"
      });
      continue;
    }
    if (byAmendment.has(aid)) {
      const prev = byAmendment.get(aid);
      const sig = (x) =>
        `${x.compensationOf ?? ""}|${x.priorCraAnchor ?? ""}|${x.ceeArtifactId ?? ""}`;
      if (sig(prev) !== sig(c)) {
        findings.push({
          code: "GCR_IDENTITY_FORK",
          severity: "error",
          detail: `amendmentId ${aid} has divergent immutable fields across CRAs`
        });
      }
    } else {
      byAmendment.set(aid, c);
    }
  }

  const targetMap = new Map();
  for (const c of cras) {
    const phases = (c.inject?.aeePhases || []).join(",");
    for (const t of c.targetsRemaining || []) {
      const key = t.trim();
      if (!key) continue;
      if (!targetMap.has(key)) targetMap.set(key, []);
      targetMap.get(key).push({ amendmentId: c.amendmentId, phases });
    }
  }
  for (const [target, entries] of targetMap) {
    if (entries.length < 2) continue;
    const phaseSets = new Set(entries.map((e) => e.phases));
    if (phaseSets.size > 1) {
      findings.push({
        code: "GCR_INJECT_DIVERGENCE",
        severity: "error",
        detail: `target ${target}: divergent inject.aeePhases across CRAs`
      });
    } else {
      findings.push({
        code: "GCR_TARGET_CONTENTION_GLOBAL",
        severity: "warning",
        detail: `target ${target}: overlapping targetsRemaining — review merge order (same phase fingerprint)`
      });
    }
  }

  const byId = new Map();
  for (const c of cras) {
    const id = c.amendmentId?.trim();
    if (id) byId.set(id, c);
  }
  for (const c of cras) {
    const co = c.compensationOf?.trim();
    if (!co) continue;
    if (!byId.has(co)) {
      findings.push({
        code: "GCR_STALE_PRIOR_CRA",
        severity: "warning",
        detail: `compensationOf ${co} not present in bundle for ${c.amendmentId}`
      });
    }
  }

  const items = cras
    .map((c) => ({
      id: c.amendmentId || "unknown",
      compensationOf: c.compensationOf ?? null,
      priorAnchor: c.priorAnchor || ""
    }))
    .filter((x) => x.id !== "unknown");
  const ord = orderRepairsDeterministic(items);
  if (!ord.ok) {
    findings.push({
      code: ord.error === "CESE_ORDER_CYCLE" ? "GCR_GLOBAL_COMP_CYCLE" : "GCR_CRA_INVALID",
      severity: "error",
      detail: ord.error || "ordering failed"
    });
  }

  const hasErr = findings.some((f) => f.severity === "error");
  return {
    gcrVersion: "1.0",
    ok: !hasErr,
    findings
  };
}

function main() {
  const argv = process.argv.slice(2);
  const fi = argv.indexOf("--file");
  if (fi === -1 || !argv[fi + 1]) {
    console.error("Usage: npm run epistemic:gcr-reconcile -- --file path/to/gcr-multi-cra-bundle.json");
    process.exit(1);
  }
  let raw;
  try {
    raw = readFileSync(resolve(ROOT, argv[fi + 1]), "utf8");
  } catch {
    console.error("gcrReconcileReport: cannot read file");
    process.exit(1);
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    console.error("gcrReconcileReport: invalid JSON");
    process.exit(1);
  }
  const report = reconcileMultiCra(data);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.ok ? 0 : 1);
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main();
}
