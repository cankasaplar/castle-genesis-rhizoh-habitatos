#!/usr/bin/env node
/**
 * Collect machine-verifiable MANUAL activation evidence (A1, A2, A4 scan, A8 ref).
 * Human steps (A3 counsel, A5/A6 browser smoke, A9 ack) stay in the runbook.
 * @see docs/ops/ACTIVATION_MANUAL_EVIDENCE_RUNBOOK_V1.0.md
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const evidenceDir = join(root, "docs/exports/ops/evidence");
const opsDir = join(root, "docs/exports/ops");
const stamp = new Date().toISOString().slice(0, 10);

mkdirSync(evidenceDir, { recursive: true });

function sh(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: root, encoding: "utf8", shell: false });
  return (r.stdout || "") + (r.stderr || "");
}

function writeEvidence(name, body) {
  const path = join(evidenceDir, `${name}_${stamp}.txt`);
  writeFileSync(path, body, "utf8");
  return path;
}

const a1 = [
  "# A1 — DNS (auto-collected)",
  `generatedAt: ${new Date().toISOString()}`,
  "",
  "## dig NS rhizoh.com",
  sh("dig", ["NS", "rhizoh.com", "+short"]).trim(),
  "",
  "## dig A rhizoh.com",
  sh("dig", ["A", "rhizoh.com", "+short"]).trim(),
  "",
  "## dig A www.rhizoh.com",
  sh("dig", ["A", "www.rhizoh.com", "+short"]).trim(),
  "",
  "## Pass criteria",
  "- Cloudflare proxied: response headers include cf-ray + server: cloudflare",
  "- Registrar transfer lock: dashboard screenshot required (not auto)",
  "",
  "## Current auto verdict",
  sh("curl", ["-sI", "https://rhizoh.com"])
    .toLowerCase()
    .includes("cf-ray")
    ? "LIKELY_PASS (Cloudflare headers seen)"
    : "ACTION_REQUIRED — no cf-ray; NS may still be registrar-direct (e.g. GoDaddy → Firebase IP)"
].join("\n");

const a2 = [
  "# A2 — TLS (auto-collected)",
  `generatedAt: ${new Date().toISOString()}`,
  "",
  "## curl -sI https://rhizoh.com",
  sh("curl", ["-sI", "https://rhizoh.com"]).trim(),
  "",
  "## curl -sI https://www.rhizoh.com",
  sh("curl", ["-sI", "https://www.rhizoh.com"]).trim(),
  "",
  "## curl -sI http://rhizoh.com",
  sh("curl", ["-sI", "http://rhizoh.com"]).trim(),
  "",
  "## Pass criteria",
  "- HTTPS 200 on apex + www",
  "- HTTP → HTTPS redirect",
  "- Cloudflare SSL Full (strict): dashboard screenshot required"
].join("\n");

const rulesPath = join(root, "firestore.rules");
const rulesText = existsSync(rulesPath) ? readFileSync(rulesPath, "utf8") : "";
const openWrite = /\ballow\s+write:\s+if\s+true\b/.test(rulesText);
const heartbeatLine = rulesText
  .split("\n")
  .find((l) => l.includes("active_castles")) || "(not found)";

const a4 = [
  "# A4 — Firestore rules scan (auto-collected)",
  `generatedAt: ${new Date().toISOString()}`,
  "",
  `open_write_if_true: ${openWrite ? "FAIL" : "PASS"}`,
  `active_castles_rule: ${heartbeatLine.trim()}`,
  "",
  "## Notes",
  "- castle/* and artifacts/* allow write when request.auth != null (not public open write)",
  "- rhizoh_events items: create-only, append-only (no update/delete)",
  "- default deny on unmatched paths",
  "",
  "## Human still required",
  "- Firebase Console rules deployed == repo firestore.rules",
  "- Anonymous client write probe on heartbeat path (should deny)"
].join("\n");

const cohortPath = join(opsDir, "go_live_cohort_simulation_v1.0.json");
let cohortDecision = "missing";
if (existsSync(cohortPath)) {
  try {
    cohortDecision = JSON.parse(readFileSync(cohortPath, "utf8")).decision || "unknown";
  } catch {
    cohortDecision = "parse_error";
  }
}

const a8 = [
  "# A8 — Cohort sim (auto-collected)",
  `generatedAt: ${new Date().toISOString()}`,
  `jsonPath: docs/exports/ops/go_live_cohort_simulation_v1.0.json`,
  `decision: ${cohortDecision}`,
  "",
  "Re-run: npm run legal:go-live-cohort-sim"
].join("\n");

const paths = {
  A1: writeEvidence("A1_dns", a1),
  A2: writeEvidence("A2_tls", a2),
  A4: writeEvidence("A4_firestore_rules_scan", a4),
  A8: writeEvidence("A8_cohort_sim", a8)
};

const tlsOk =
  sh("curl", ["-sI", "https://rhizoh.com"]).includes("200") &&
  sh("curl", ["-sI", "https://www.rhizoh.com"]).includes("200");
const dnsProxied = sh("curl", ["-sI", "https://rhizoh.com"]).toLowerCase().includes("cf-ray");

const decisionPath = join(opsDir, `activation_decision_${stamp}.json`);
const decisionTemplate = existsSync(join(root, "docs/ops/activation_decision_LOG.template.json"))
  ? JSON.parse(readFileSync(join(root, "docs/ops/activation_decision_LOG.template.json"), "utf8"))
  : {};

const decision = {
  ...decisionTemplate,
  schema: "castle.rhizoh.activation_decision.v1",
  decision: "HOLD",
  signedBy: "",
  date: stamp,
  environment: "production",
  checklistRef: "docs/RHIZOH_ACTIVATION_READINESS_CHECKLIST_V1.0.md",
  autoReport: "docs/exports/ops/activation_readiness_v1.0.json",
  evidenceDir: "docs/exports/ops/evidence/",
  runbook: "docs/ops/ACTIVATION_MANUAL_EVIDENCE_RUNBOOK_V1.0.md",
  manualVerified: {
    A1_dns_proxied: dnsProxied,
    A2_tls_valid: tlsOk,
    A3_legal: false,
    A4_firebase_readonly: !openWrite,
    A5_ingress_inert: false,
    A6_ui_readonly_gate: false,
    A8_cohort_sim_filed: cohortDecision === "proceed",
    A9_surface_not_activation: false
  },
  evidenceFiles: Object.fromEntries(
    Object.entries(paths).map(([k, v]) => [k, v.replace(root + "/", "")])
  ),
  blockers: [
    ...(dnsProxied ? [] : ["A1: Cloudflare proxied DNS not verified (no cf-ray)"]),
    "A3: Counsel pass + signed READY/HOLD not filed",
    "A5: Browser ingress smoke + screenshots not filed",
    "A6: Cohort UI screenshot not filed",
    "A9: Founder surface≠activation acknowledgment not signed"
  ],
  notes:
    "Auto-collected evidence only. Set decision=READY after all manualVerified true + npm run activation:readiness-check AUTO pass + counsel sign-off."
};

writeFileSync(decisionPath, `${JSON.stringify(decision, null, 2)}\n`, "utf8");

console.log(
  JSON.stringify(
    {
      ok: true,
      evidenceDir: evidenceDir.replace(root + "/", ""),
      decisionPath: decisionPath.replace(root + "/", ""),
      manualVerified: decision.manualVerified,
      blockers: decision.blockers
    },
    null,
    2
  )
);
