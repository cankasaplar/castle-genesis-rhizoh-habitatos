#!/usr/bin/env node
/**
 * Prod-like Redis stress: GCL + rollout cluster + phased load + analysis export.
 * Requires REDIS_URL reachable (default redis://127.0.0.1:6379).
 */
import { createConnection } from "node:net";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

function parseRedisHostPort(url) {
  try {
    const u = new URL(url);
    return { host: u.hostname || "127.0.0.1", port: Number(u.port) || 6379 };
  } catch {
    return { host: "127.0.0.1", port: 6379 };
  }
}

function probeRedis(host, port, ms = 1500) {
  return new Promise((resolve) => {
    const sock = createConnection({ host, port });
    const t = setTimeout(() => {
      sock.destroy();
      resolve(false);
    }, ms);
    sock.on("connect", () => {
      clearTimeout(t);
      sock.end();
      resolve(true);
    });
    sock.on("error", () => {
      clearTimeout(t);
      resolve(false);
    });
  });
}

async function main() {
  const { host, port } = parseRedisHostPort(redisUrl);
  const up = await probeRedis(host, port);
  if (!up) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          code: "redis_unreachable",
          redisUrl,
          hint: "Start Redis then re-run: npm run ops:redis-stress"
        },
        null,
        2
      )
    );
    process.exit(2);
  }

  const env = {
    ...process.env,
    REDIS_URL: redisUrl,
    CASTLE_GCL_REQUIRE_REDIS: "1",
    CASTLE_GCL_ALLOW_MEMORY_FALLBACK: "0",
    CASTLE_PHASED_ROLLOUT_REQUIRE_REDIS: "1",
    CASTLE_PHASED_ROLLOUT_ALLOW_MEMORY_FALLBACK: "0",
    CASTLE_PHASED_ROLLOUT_TIER: process.env.CASTLE_PHASED_ROLLOUT_TIER || "200",
    CASTLE_PHASED_ROLLOUT_LEASE_TTL_MS: process.env.CASTLE_PHASED_ROLLOUT_LEASE_TTL_MS || "120000",
    CASTLE_LOAD_TEST_REDIS_LATENCY_MS: process.env.CASTLE_LOAD_TEST_REDIS_LATENCY_MS || "200"
  };

  const nodeArgs = [
    join(here, "runLoadTestHarnessV0.mjs"),
    "--phase=all",
    `--sanityUsers=${process.env.CASTLE_REDIS_STRESS_SANITY || 100}`,
    `--sanityUsersHigh=${process.env.CASTLE_REDIS_STRESS_SANITY_HIGH || 300}`,
    `--spikeUsers=${process.env.CASTLE_REDIS_STRESS_SPIKE || 2000}`,
    `--chaosUsers=${process.env.CASTLE_REDIS_STRESS_CHAOS || 500}`
  ];

  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, nodeArgs, { env, stdio: "inherit", cwd: join(here, "..", "..") });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`harness_exit_${code}`))));
  });

  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [join(here, "runLoadTestAnalysisV0.mjs")], {
      env,
      stdio: "inherit",
      cwd: join(here, "..", "..")
    });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`analysis_exit_${code}`))));
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
