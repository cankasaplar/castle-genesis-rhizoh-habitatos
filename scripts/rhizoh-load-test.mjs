#!/usr/bin/env node
/**
 * Rhizoh gateway load harness — eşzamanlı POST /rhizoh/llm basıncı + latency özeti.
 *
 * Kullanım:
 *   GATEWAY=https://host CASTLE_DEV_UID=dev-1 RHIZOH_LOAD_TOTAL=200 RHIZOH_LOAD_CONCURRENCY=20 node scripts/rhizoh-load-test.mjs
 *
 * Opsiyonel: FIREBASE_ID_TOKEN, CASTLE_GATEWAY_TOKEN (Authorization veya x-castle-gateway-token — gateway hangisini kullanıyorsa)
 */
const gateway = String(process.env.GATEWAY || process.env.VITE_GATEWAY_URL || "").replace(/\/$/, "");
const devUid = String(process.env.CASTLE_DEV_UID || "load-test").trim();
const bearer = String(process.env.FIREBASE_ID_TOKEN || "").trim();
const gatewayToken = String(process.env.CASTLE_GATEWAY_TOKEN || "").trim();
const total = Math.max(1, Math.floor(Number(process.env.RHIZOH_LOAD_TOTAL || 50)));
const concurrency = Math.max(1, Math.floor(Number(process.env.RHIZOH_LOAD_CONCURRENCY || 10)));
const timeoutMs = Math.max(5000, Math.floor(Number(process.env.RHIZOH_LOAD_TIMEOUT_MS || 120000)));

if (!gateway) {
  console.error("GATEWAY veya VITE_GATEWAY_URL gerekli");
  process.exit(1);
}

function percentile(sorted, p) {
  if (sorted.length === 0) return null;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

async function oneRequest(i) {
  const u = `${gateway}/rhizoh/llm`;
  const headers = { "Content-Type": "application/json" };
  if (bearer) headers.Authorization = `Bearer ${bearer}`;
  else headers["X-Castle-Dev-Uid"] = devUid;
  if (gatewayToken) headers["x-castle-gateway-token"] = gatewayToken;

  const t0 = performance.now();
  let status = 0;
  let okStruct = false;
  try {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    const r = await fetch(u, {
      method: "POST",
      headers,
      signal: ac.signal,
      body: JSON.stringify({
        message: `Load probe ${i}`,
        llmKeySource: "env",
        context: {
          agentId: "RHIZOH-LOAD",
          continuity: { recentTurns: [] },
          constitutionalTheta: 0.46
        }
      })
    });
    clearTimeout(timer);
    status = r.status;
    const json = await r.json().catch(() => null);
    okStruct =
      status === 200 &&
      json &&
      typeof json.turnLatencyMs === "number" &&
      String(json.traceId || "").length > 4;
  } catch {
    status = status || -1;
  }
  const ms = Math.round(performance.now() - t0);
  return { status, ms, okStruct };
}

let cursor = 0;
async function worker() {
  const results = [];
  while (cursor < total) {
    const i = cursor++;
    results.push(await oneRequest(i));
  }
  return results;
}

const tStart = performance.now();
const workers = Array.from({ length: concurrency }, () => worker());
const chunks = await Promise.all(workers);
const flat = chunks.flat();

const latencies = flat.map((x) => x.ms).sort((a, b) => a - b);
const failures = flat.filter((x) => !x.okStruct).length;
const durSec = (performance.now() - tStart) / 1000;

console.log(
  JSON.stringify(
    {
      schema: "rhizoh.load_test.summary.v1",
      gateway,
      total,
      concurrency,
      durationSec: Math.round(durSec * 1000) / 1000,
      rps: Math.round((total / durSec) * 1000) / 1000,
      failures,
      latencyMs: {
        min: latencies[0] ?? null,
        p50: percentile(latencies, 50),
        p95: percentile(latencies, 95),
        max: latencies[latencies.length - 1] ?? null
      }
    },
    null,
    2
  )
);

process.exit(failures > Math.floor(total * 0.05) ? 1 : 0);
