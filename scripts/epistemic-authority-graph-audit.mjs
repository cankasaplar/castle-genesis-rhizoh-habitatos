#!/usr/bin/env node
/**
 * Phase 2.3 — permission topology verification (static import graph only).
 * @see docs/architecture/rhizoh_authority_graph_audit_v1.md
 */
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { join, relative, basename, dirname } from "node:path";

const root = join(import.meta.dirname, "..");
const scanRoots = [
  join(root, "apps/client/src/rhizoh"),
  join(root, "apps/client/src/AppRhizoh528.jsx")
];

const EXEMPT = ["__tests__", "__research__", ".test.", ".spec."];

/** Zone by file basename */
const ZONES = {
  AUTHORITY_GATE: ["phase1ActivationGateV0.js"],
  DERIVED: [
    "epistemicStabilityControllerV0.js",
    "epistemicAuditBundleV0.js",
    "replayFeedbackAnalysisV0.js"
  ],
  INTERPRET: [
    "breachCorrelationSynthesisV0.js",
    "goLiveCohortSimulationV0.js",
    "synthesizeBreachCoherenceV0.js"
  ],
  ENFORCEMENT: [
    "postGoLiveIntegrityLoopV0.js",
    "externalBoundaryValidationV0.js",
    "closedUserAdmissionEngineV0.js"
  ],
  OBSERVATION_HUB: ["epistemicTickEngineV0.js"]
};

const IMPORT_RE = /^\s*import\s+.+?\s+from\s+['"](.+?)['"]/gm;

function zoneOf(filePath) {
  const base = basename(filePath);
  for (const [zone, names] of Object.entries(ZONES)) {
    if (names.includes(base)) return zone;
  }
  if (filePath.includes("/ingress/")) return "INGRESS";
  if (filePath.includes("/runtime/")) return "RUNTIME_OTHER";
  if (filePath.includes("/stability/")) return "UI_STABILITY_EMOTION";
  if (filePath.endsWith("AppRhizoh528.jsx")) return "UI_CAPTAIN";
  return "OTHER";
}

function resolveImport(fromFile, spec) {
  if (!spec.startsWith(".") && !spec.startsWith("/")) return { resolved: spec, external: true };
  const dir = dirname(fromFile);
  let p = join(dir, spec);
  if (!p.endsWith(".js") && !p.endsWith(".jsx")) p += ".js";
  return { resolved: relative(root, p).replace(/\\/g, "/"), external: false };
}

function walk(path, out = []) {
  if (path.endsWith(".jsx") || path.endsWith(".js")) {
    out.push(path);
    return out;
  }
  for (const name of readdirSync(path)) {
    const p = join(path, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith(".js") || name.endsWith(".jsx")) out.push(p);
  }
  return out;
}

/** [fromZone, toZone] forbidden direct imports */
const FORBIDDEN_EDGES = [
  ["AUTHORITY_GATE", "DERIVED"],
  ["AUTHORITY_GATE", "INTERPRET"],
  ["AUTHORITY_GATE", "ENFORCEMENT"],
  ["AUTHORITY_GATE", "OBSERVATION_HUB"],
  ["AUTHORITY_GATE", "RUNTIME_OTHER"],
  ["ENFORCEMENT", "DERIVED"],
  ["DERIVED", "AUTHORITY_GATE"],
  ["OBSERVATION_HUB", "AUTHORITY_GATE"],
  ["UI_STABILITY_EMOTION", "DERIVED"],
  ["UI_STABILITY_EMOTION", "AUTHORITY_GATE"]
];

function zoneOfResolved(resolvedPath) {
  const full = join(root, resolvedPath);
  return zoneOf(full);
}

function scan() {
  const files = scanRoots.flatMap((r) => walk(r));
  const edges = [];
  const violations = [];

  for (const file of files) {
    const rel = relative(root, file).replace(/\\/g, "/");
    if (EXEMPT.some((x) => rel.includes(x))) continue;
    const fromZone = zoneOf(file);
    const text = readFileSync(file, "utf8");
    let m;
    IMPORT_RE.lastIndex = 0;
    while ((m = IMPORT_RE.exec(text)) !== null) {
      const spec = m[1];
      const { resolved, external } = resolveImport(file, spec);
      if (external) continue;
      const toZone = zoneOfResolved(resolved);
      edges.push({ from: rel, to: resolved, fromZone, toZone });
      for (const [fz, tz] of FORBIDDEN_EDGES) {
        if (fromZone === fz && toZone === tz) {
          violations.push({
            rule: `${fz} → ${tz}`,
            from: rel,
            to: resolved,
            message: "unauthorized dependency path"
          });
        }
      }
    }
  }

  return { edges, violations, fileCount: files.length };
}

const { edges, violations, fileCount } = scan();
const outDir = join(root, "docs/exports/ops");
mkdirSync(outDir, { recursive: true });
const report = {
  schema: "castle.rhizoh.authority_graph_audit.v1",
  atMs: Date.now(),
  phase: "2.3",
  fileCount,
  edgeCount: edges.length,
  violations,
  ok: violations.length === 0,
  gateWiringNote:
    "phase1ActivationGateV0 has zero runtime imports; not wired from epistemicStability or audit bundle gateHints (human hints only)."
};

const outPath = join(outDir, "authority_graph_audit_v1.0.json");
writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");

if (violations.length) {
  console.error(`Authority graph: ${violations.length} violation(s):\n`);
  for (const v of violations) {
    console.error(`  [${v.rule}] ${v.from} → ${v.to}`);
  }
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, report: outPath, edges: edges.length }, null, 2));
