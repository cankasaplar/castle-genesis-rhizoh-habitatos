#!/usr/bin/env node
/**
 * Verify Phase 3 control ↔ Phase 3D observation firewall (no measure→govern coupling).
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { verifyControlPathFirewallV0 } from "../apps/gateway/src/ops/phase3ControlObservationFirewallV0.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const controlPath = join(root, "apps/gateway/src/ops/phase3ControlledDivergenceRuntimeV0.js");
const controlSource = readFileSync(controlPath, "utf8");
const result = verifyControlPathFirewallV0(controlSource);

if (!result.ok) {
  console.error(JSON.stringify({ ok: false, violations: result.violations }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      rule: "observation_never_feeds_execution_gate",
      controlModule: "phase3ControlledDivergenceRuntimeV0.js",
      violations: []
    },
    null,
    2
  )
);
