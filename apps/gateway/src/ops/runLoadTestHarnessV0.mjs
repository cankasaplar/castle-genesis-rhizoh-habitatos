#!/usr/bin/env node
/**
 * Load test harness CLI.
 * Usage:
 *   node src/ops/runLoadTestHarnessV0.mjs --phase=all
 *   node src/ops/runLoadTestHarnessV0.mjs --scenario=baseline --users=100
 * Env: CASTLE_PHASED_ROLLOUT_TIER=200, REDIS_URL, CASTLE_GCL_REQUIRE_REDIS=1 (prod-like)
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  runLoadTestPhasesV0,
  runLoadScenarioV0,
  verifyLoadTestReadinessV0,
  LOAD_TEST_SCENARIO_V0
} from "./loadTestHarnessV0.js";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? "1"];
  })
);

async function main() {
  const readiness = await verifyLoadTestReadinessV0();
  console.error(JSON.stringify({ readiness }, null, 2));
  if (readiness.ready === false && process.env.CASTLE_LOAD_TEST_FORCE !== "1") {
    console.error("readiness_failed — set CASTLE_LOAD_TEST_FORCE=1 to run anyway");
    process.exit(2);
  }

  let report;
  if (args.phase === "all" || !args.scenario) {
    report = await runLoadTestPhasesV0({
      sanityUsers: Number(args.sanityUsers) || 100,
      sanityUsersHigh: Number(args.sanityUsersHigh) || 500
    });
  } else {
    const scenario = args.scenario;
    if (!Object.values(LOAD_TEST_SCENARIO_V0).includes(scenario)) {
      throw new Error(`unknown scenario:${scenario}`);
    }
    report = await runLoadScenarioV0(scenario, {
      users: Number(args.users) || 100,
      burstMultiplier: Number(args.burst) || 1,
      concurrency: Number(args.concurrency) || 16
    });
  }

  const json = JSON.stringify(report, null, 2);
  console.log(json);

  const here = dirname(fileURLToPath(import.meta.url));
  const exportDir = join(here, "../../../../docs/exports/ops");
  mkdirSync(exportDir, { recursive: true });
  const out = join(exportDir, "load_test_harness_LATEST.json");
  writeFileSync(out, json, "utf8");
  console.error(`wrote ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
