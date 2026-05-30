#!/usr/bin/env node
/**
 * Redis-free load test — coordination simulation layer (no Docker / no Redis binary).
 * Exercises rollout leases + GCL memory + harness + analysis.
 */
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

const env = {
  ...process.env,
  CASTLE_COORDINATION_SIM: "1",
  CASTLE_PHASED_ROLLOUT_REQUIRE_REDIS: "1",
  CASTLE_PHASED_ROLLOUT_ALLOW_MEMORY_FALLBACK: "0",
  CASTLE_PHASED_ROLLOUT_TIER: process.env.CASTLE_PHASED_ROLLOUT_TIER || "200",
  CASTLE_PHASED_ROLLOUT_LEASE_TTL_MS: process.env.CASTLE_PHASED_ROLLOUT_LEASE_TTL_MS || "120000",
  CASTLE_GCL_REQUIRE_REDIS: "0",
  CASTLE_GCL_ALLOW_MEMORY_FALLBACK: "1",
  CASTLE_LOAD_TEST_HYBRID_CHAOS: process.env.CASTLE_LOAD_TEST_HYBRID_CHAOS || "1",
  CASTLE_LOAD_TEST_REDIS_LATENCY_MS: process.env.CASTLE_LOAD_TEST_REDIS_LATENCY_MS || "80",
  CASTLE_LLM_DAILY_TOKEN_BUDGET: process.env.CASTLE_LLM_DAILY_TOKEN_BUDGET || "50000000",
  CASTLE_LLM_DAILY_SPEND_LIMIT_USD: process.env.CASTLE_LLM_DAILY_SPEND_LIMIT_USD || "1000"
};

function run(script, extraArgs = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [join(here, script), ...extraArgs], {
      env,
      stdio: "inherit",
      cwd: join(here, "..", "..")
    });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${script}_exit_${code}`))));
  });
}

async function main() {
  console.error(
    JSON.stringify(
      {
        mode: "coordination_sim",
        note: "No Docker/Redis — ZSET+TTL+lease via inMemoryRedisCoordinationV0",
        hybridChaos: env.CASTLE_LOAD_TEST_HYBRID_CHAOS === "1"
      },
      null,
      2
    )
  );
  await run("runLoadTestHarnessV0.mjs", [
    "--phase=all",
    `--sanityUsers=${process.env.CASTLE_SIM_SANITY || 100}`,
    `--sanityUsersHigh=${process.env.CASTLE_SIM_SANITY_HIGH || 400}`,
    `--spikeUsers=${process.env.CASTLE_SIM_SPIKE || 1500}`,
    `--chaosUsers=${process.env.CASTLE_SIM_CHAOS || 600}`
  ]);
  const { analyzeAndExportLoadTestV0 } = await import("./loadTestAnalysisEngineV0.js");
  const harnessOut = join(here, "../../../../docs/exports/ops/load_test_harness_LATEST.json");
  const { jsonPath, mdPath } = analyzeAndExportLoadTestV0(harnessOut);
  console.error(`wrote ${jsonPath}`);
  console.error(`wrote ${mdPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
