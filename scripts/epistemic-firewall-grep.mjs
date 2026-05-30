#!/usr/bin/env node
/**
 * Phase 2.1 — narration pattern scan on authority-adjacent runtime only.
 * Default: warn + exit 0.  --strict: fail on authority surface.
 * @see docs/architecture/rhizoh_final_epistemic_firewall_v1.md
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, basename } from "node:path";

const root = join(import.meta.dirname, "..");
const scanRoot = join(root, "apps/client/src/rhizoh/runtime");
const strict = process.argv.includes("--strict");

/** Modules that must not narrate (compute/project only). */
const AUTHORITY_BASENAMES = new Set([
  "epistemicStabilityControllerV0.js",
  "epistemicAuditBundleV0.js",
  "goLiveCohortSimulationV0.js",
  "breachCorrelationSynthesisV0.js",
  "violationObservationLogV0.js",
  "replayFeedbackAnalysisV0.js"
]);

const EXEMPT_SEGMENTS = ["__tests__", "__research__"];

const STRING_DENY = [
  /system is (stable|unstable)/i,
  /risk is (high|low)/i,
  /trend is/i,
  /getting (better|worse)/i,
  /anomaly detected/i,
  /stability is improving/i,
  /behavior is converging/i
];

const EXPORT_NARRATION_DENY = [
  /\b(overallHealth|stabilityTrend|riskTrend|narrativeSummary)\b/i
];

/** Phase 2.2+ — must stay empty after lexical normalize */
const LEGACY_WARN = [];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith(".js")) out.push(p);
  }
  return out;
}

function isExempt(rel) {
  return EXEMPT_SEGMENTS.some((s) => rel.includes(s));
}

function scan() {
  const files = walk(scanRoot);
  const failures = [];
  const warnings = [];

  for (const file of files) {
    const rel = relative(root, file).replace(/\\/g, "/");
    if (isExempt(rel)) continue;
    const base = basename(file);
    const authority = AUTHORITY_BASENAMES.has(base);
    const text = readFileSync(file, "utf8");

    for (const re of LEGACY_WARN) {
      if (re.test(text)) {
        warnings.push({ rel, rule: re.source, kind: "legacy_rename_pending" });
      }
    }

    if (base === "replayFeedbackAnalysisV0.js") {
      warnings.push({ rel, rule: "OFFLINE_REVIEW_ONLY", kind: "module_class" });
      continue;
    }

    if (!authority) continue;

    const lines = text.split(/\r?\n/);
    lines.forEach((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("*")) return;

      for (const re of STRING_DENY) {
        if (re.test(line)) {
          failures.push({ rel, line: i + 1, rule: re.source, kind: "string" });
        }
      }
      if (/export function|export const/.test(line) || /^\w+:\s*["']/.test(trimmed)) {
        for (const re of EXPORT_NARRATION_DENY) {
          if (re.test(line)) failures.push({ rel, line: i + 1, rule: re.source, kind: "export" });
        }
      }
    });
  }

  return { failures, warnings };
}

const { failures, warnings } = scan();

for (const w of warnings) {
  console.warn(`[warn] ${w.rel} — ${w.kind}: ${w.rule}`);
}

if (failures.length) {
  console.error(`Epistemic firewall (${strict ? "STRICT" : "audit"}): ${failures.length} hit(s):\n`);
  for (const h of failures) {
    console.error(`  ${h.rel}:${h.line} [${h.kind}] ${h.rule}`);
  }
  if (strict) process.exit(1);
} else {
  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: strict ? "strict" : "audit",
        authorityModules: [...AUTHORITY_BASENAMES],
        warnings: warnings.length,
        failures: 0
      },
      null,
      2
    )
  );
}
