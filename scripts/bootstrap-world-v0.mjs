#!/usr/bin/env node
/**
 * Bootstrap world runtime (Node / CI / staging operator).
 * @see docs/RHIZOH_PRODUCTION_AUTOMATION_LAYER_V0.md
 */
import { ensureWorldDeployWindowV0 } from "./lib/world-deploy-node-harness-v0.mjs";
import { bootstrapWorldV0 } from "../apps/client/src/rhizoh/runtime/rhizohWorldBootstrapV0.js";

ensureWorldDeployWindowV0();

const skipGates = process.argv.includes("--skip-gates");
const status = await bootstrapWorldV0({ skipGates, stressTicks: 32 });

if (!status.ok) {
  console.error("World bootstrap failed:", status.code || "gate_or_loop_fail");
  process.exit(1);
}

console.log(JSON.stringify(status, null, 2));
process.exit(0);
