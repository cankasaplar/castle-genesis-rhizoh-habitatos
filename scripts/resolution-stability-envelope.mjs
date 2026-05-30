#!/usr/bin/env node
/**
 * Resolution stability envelope — Phase 3 pre-gate (deterministic resolution under repeat).
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { verifyResolutionStabilityEnvelopeV0 } from "../apps/gateway/src/ops/resolutionStabilityEnvelopeV0.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "docs/exports/ops");
mkdirSync(outDir, { recursive: true });

const envelope = verifyResolutionStabilityEnvelopeV0();
const report = {
  schema: "rhizoh.resolution_stability.verify.v0",
  atMs: new Date().toISOString(),
  envelope,
  phase3Gate: envelope.pass ? "resolution_stability_ready_for_phase3" : "hold_fix_resolution_instability"
};

const outPath = join(outDir, "resolution_stability_envelope_LATEST.json");
writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");

console.log(JSON.stringify({ ok: envelope.pass, outPath, phase3Gate: report.phase3Gate }, null, 2));
process.exit(envelope.pass ? 0 : 1);
