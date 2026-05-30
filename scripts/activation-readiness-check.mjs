#!/usr/bin/env node
/**
 * Activation Readiness Checklist — go/no-go (automated slice).
 * @see docs/RHIZOH_ACTIVATION_READINESS_CHECKLIST_V1.0.md
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "docs/exports/ops");
mkdirSync(outDir, { recursive: true });

/** @param {string} id @param {string} label @param {boolean} pass @param {string} [detail] */
function item(id, label, pass, detail = "") {
  return { id, label, type: "AUTO", pass, detail: detail || (pass ? "ok" : "fail") };
}

const checks = [];

function runNpmTest(suite) {
  const r = spawnSync("npm", ["run", "test", "-w", "apps/client", "--", suite], {
    cwd: root,
    encoding: "utf8",
    shell: true
  });
  return r.status === 0;
}

// R1 — ingress
const ingressOk = runNpmTest("src/rhizoh/ingress/__tests__/");
checks.push(item("R1", "Ingress unit tests", ingressOk));

// R2 — passive coherence
const passiveOk = spawnSync("npm", ["run", "ops:passive-coherence-check"], {
  cwd: root,
  encoding: "utf8",
  shell: true
}).status === 0;
checks.push(item("R2", "Passive coherence check", passiveOk));

// R3 — Phase 1 signal not enabled in env files
const envFiles = [
  "apps/client/.env.production",
  "apps/client/.env.production.example",
  "apps/client/.env.local"
].filter((f) => existsSync(join(root, f)));

let phase1Open = false;
const phase1Hits = [];
for (const f of envFiles) {
  const text = readFileSync(join(root, f), "utf8");
  if (/VITE_RHIZOH_PHASE1_SIGNAL\s*=\s*1/.test(text)) {
    phase1Open = true;
    phase1Hits.push(f);
  }
}
checks.push(
  item("R3", "VITE_RHIZOH_PHASE1_SIGNAL not 1 in tracked env", !phase1Open, phase1Hits.join(", ") || "none")
);

// R4 — ingress router fallback contract
try {
  const routerUrl = pathToFileURL(join(root, "apps/client/src/rhizoh/ingress/ingress_router.js")).href;
  const router = await import(routerUrl);
  const route = router.resolveIngressRouteV0();
  const r4 =
    route.fallbackCarriesState === false &&
    route.fallbackRoute != null &&
    typeof router.hardResetIngressToEntryPhaseV0 === "function";
  checks.push(item("R4", "Ingress fallback (no state carry)", r4, JSON.stringify({
    fallbackCarriesState: route.fallbackCarriesState,
    fallbackRoute: route.fallbackRoute
  })));
} catch (e) {
  checks.push(item("R4", "Ingress fallback (no state carry)", false, String(e?.message || e)));
}

// R5 — cohort UI no-op (no evaluateClosedAdmission in cohort screen)
const cohortPath = join(root, "apps/client/src/rhizoh/ingress/ClosedAdmissionCohortScreen.jsx");
const cohortSrc = existsSync(cohortPath) ? readFileSync(cohortPath, "utf8") : "";
const r5 =
  cohortSrc.includes("completeCohortGateNoOpV0") &&
  !cohortSrc.includes("evaluateClosedAdmissionForSessionV0");
checks.push(item("R5", "Cohort UI no-op gate (no engine on UI path)", r5));

// R6 — no heartbeat route in gateway/apps (spec-only)
const gatewaySrc = existsSync(join(root, "apps/gateway"))
  ? spawnSync("rg", ["-l", "signal/heartbeat|device_heartbeat|PHASE1_SIGNAL"], {
      cwd: join(root, "apps/gateway"),
      encoding: "utf8",
      shell: true
    })
  : { status: 1, stdout: "" };
const r6 = !gatewaySrc.stdout?.trim();
checks.push(
  item(
    "R6",
    "No Phase 1 heartbeat ingest route in apps/gateway",
    r6,
    r6 ? "none found" : gatewaySrc.stdout?.trim().slice(0, 200)
  )
);

// R7 — legal preamble SSOT
const routerPath = join(root, "apps/client/src/rhizoh/ingress/ingress_router.js");
const routerText = readFileSync(routerPath, "utf8");
const r7 =
  routerText.includes("getLegalPreambleCopyV0") &&
  routerText.includes("consentLabel") &&
  routerText.includes("acceptLabel");
checks.push(item("R7", "Legal preamble copy SSOT", r7));

// R9 — single activation switch SSOT
const rgAll = spawnSync(
  "rg",
  ["VITE_RHIZOH_PHASE1_SIGNAL", "apps/client/src", "-g", "!**/__tests__/**"],
  { cwd: root, encoding: "utf8", shell: true }
);
const hits = (rgAll.stdout || "")
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => line.split(":")[0]);
const allowed = new Set([
  "apps/client/src/rhizoh/ingress/phase1ActivationGateV0.js".replace(/\//g, "\\"),
  "apps\\client\\src\\rhizoh\\ingress\\phase1ActivationGateV0.js"
]);
const stray = [...new Set(hits)].filter((f) => !allowed.has(f) && !f.includes("phase1ActivationGateV0"));
const r9 = stray.length === 0 && existsSync(join(root, "apps/client/src/rhizoh/ingress/phase1ActivationGateV0.js"));
checks.push(item("R9", "Single activation switch SSOT (phase1ActivationGateV0.js only)", r9, stray.join(", ") || "ok"));

const manual = [
  { id: "A1", label: "DNS proxied (dig + dashboard)", type: "MANUAL", pass: null },
  { id: "A2", label: "TLS valid (curl -sI https://rhizoh.com)", type: "MANUAL", pass: null },
  { id: "A3", label: "Legal / counsel / PRIMARY PDF", type: "MANUAL", pass: null },
  { id: "A4", label: "Firebase rules read-only (firestore.rules)", type: "MANUAL", pass: null },
  { id: "A5", label: "Ingress route inert (staging smoke)", type: "MANUAL", pass: null },
  { id: "A6", label: "UI read-only decision gate only", type: "MANUAL", pass: null },
  { id: "A8", label: "Cohort sim decision filed", type: "MANUAL", pass: null },
  { id: "A9", label: "READY/HOLD ops log signed", type: "MANUAL", pass: null },
  { id: "OPS", label: "Decision: READY or HOLD (human)", type: "MANUAL", pass: null }
];

const autoPass = checks.every((c) => c.pass);
const report = {
  schema: "castle.rhizoh.activation_readiness.v1",
  generatedAt: new Date().toISOString(),
  go: autoPass ? "AUTO_PASS_MANUAL_PENDING" : "NO_GO",
  autoPass,
  checks,
  manual,
  doc: "docs/RHIZOH_ACTIVATION_READINESS_CHECKLIST_V1.0.md"
};

const outPath = join(outDir, "activation_readiness_v1.0.json");
writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");

console.log(JSON.stringify({ ok: autoPass, go: report.go, path: outPath, failed: checks.filter((c) => !c.pass).map((c) => c.id) }, null, 2));
process.exit(autoPass ? 0 : 1);
