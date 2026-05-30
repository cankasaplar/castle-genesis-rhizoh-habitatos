#!/usr/bin/env node
/**
 * O1 / T1 violation harness — AUTO slice + export template.
 * @see docs/RHIZOH_O1_VIOLATION_EXECUTION_SPEC_V1.0.md
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "docs/exports/ops");
mkdirSync(outDir, { recursive: true });

/** @param {string} id @param {boolean} pass @param {string} type @param {string} [detail] */
function row(id, pass, type, detail = "") {
  return { id, pass, type, detail: detail || (pass ? "ok" : "fail") };
}

function runTest(suite) {
  const r = spawnSync("npm", ["run", "test", "-w", "apps/client", "--", suite], {
    cwd: root,
    encoding: "utf8",
    shell: true
  });
  return r.status === 0;
}

const violations = [];

// Gate — T1_DRY expects inactive data plane in default env
let dataPlaneActive = null;
try {
  const gateUrl = pathToFileURL(
    join(root, "apps/client/src/rhizoh/ingress/phase1ActivationGateV0.js")
  ).href;
  const gate = await import(gateUrl);
  dataPlaneActive = gate.isDataPlaneActiveV0() === true;
  violations.push(
    row("GATE", !dataPlaneActive, "AUTO", `isDataPlaneActiveV0=${dataPlaneActive}`)
  );
} catch (e) {
  violations.push(row("GATE", false, "AUTO", String(e?.message || e)));
}

// R9 — single switch reader (NI2 ops)
const rg = spawnSync(
  "rg",
  ["VITE_RHIZOH_PHASE1_SIGNAL", "apps/client/src", "-g", "!**/__tests__/**"],
  { cwd: root, encoding: "utf8", shell: true }
);
const hits = (rg.stdout || "")
  .split("\n")
  .map((l) => l.trim())
  .filter(Boolean);
const onlyGate =
  hits.length === 0 ||
  hits.every((h) => h.includes("phase1ActivationGateV0.js"));
violations.push(
  row("NI2-SWITCH", onlyGate, "AUTO", hits.slice(0, 5).join("; ") || "no hits")
);

const gateTestOk = runTest("src/rhizoh/ingress/__tests__/phase1ActivationGateV0.test.js");
violations.push(row("GATE-TEST", gateTestOk, "AUTO"));

const ingressOk = runTest("src/rhizoh/ingress/__tests__/ingress_router.test.js");
violations.push(row("INGRESS", ingressOk, "AUTO"));

// O1 rows — full detection when ingest exists; MANUAL / SKIP until then
const ingestBuilt = spawnSync(
  "rg",
  ["device_heartbeat|controlled_signal_heartbeat", "apps/gateway", "apps/client/src"],
  { cwd: root, encoding: "utf8", shell: true }
);
const hasIngest = Boolean(ingestBuilt.stdout?.trim());
const pendingDetail = hasIngest
  ? "implement O1-1..O1-5 per execution spec"
  : "SKIP: heartbeat ingest not built — T1_DRY static only";

for (const id of ["O1-1", "O1-2", "O1-3", "O1-4", "O1-5", "A9", "NI2-O"]) {
  violations.push(
    row(id, !hasIngest, hasIngest ? "MANUAL" : "SKIP", pendingDetail)
  );
}

const failed = violations.filter((v) => v.pass === false && v.type !== "SKIP");
const manual = violations.filter((v) => v.type === "MANUAL" || v.type === "SKIP");

const payload = {
  schema: "castle.rhizoh.ops.o1_violation_run.v1",
  mode: dataPlaneActive ? "O1_PROBE" : "T1_DRY",
  dataPlaneActive: dataPlaneActive === true,
  at: new Date().toISOString(),
  baseline: { coreStateHash: null, tau: null, observationCount: null },
  final: { coreStateHash: null, tau: null, observationCount: null },
  violations,
  ni2: {
    gateInactive: dataPlaneActive === false,
    singleSwitchSsot: onlyGate
  },
  go:
    failed.length > 0
      ? "FAIL"
      : manual.length > 0
        ? "PARTIAL_MANUAL"
        : "PASS"
};

const outPath = join(outDir, "o1_violation_run_v1.0.json");
writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");
console.log(JSON.stringify({ ok: failed.length === 0, go: payload.go, path: outPath }, null, 2));
process.exit(failed.length > 0 ? 1 : 0);
