#!/usr/bin/env node
/**
 * CLI: node apps/gateway/src/ops/runCapacityRealityCurveV0.mjs
 * Optional: CASTLE_PHASED_ROLLOUT_TIER=200 GATEWAY_INSTANCES=2
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runCapacityRealityCurveReportV0 } from "./capacityRealityCurveV0.js";

const instances = Math.max(1, Math.floor(Number(process.env.GATEWAY_INSTANCES) || 1));
const report = runCapacityRealityCurveReportV0({
  gatewayInstances: instances,
  steadyTurnsPerDay: Number(process.env.CAPACITY_STEADY_TURNS_PER_DAY) || 80_000
});

const json = JSON.stringify(report, null, 2);
console.log(json);

const here = dirname(fileURLToPath(import.meta.url));
const exportDir = join(here, "../../../../docs/exports/ops");
mkdirSync(exportDir, { recursive: true });
const out = join(exportDir, "capacity_10k_100k_reality_curve_LATEST.json");
writeFileSync(out, json, "utf8");
console.error(`wrote ${out}`);
