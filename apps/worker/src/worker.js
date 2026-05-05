import { createClient } from "redis";
import { createServer } from "node:http";
import { consume } from "../../kernel/src/consumer/KernelConsumer.js";
import { recordConsumeLatency, recordKernelMetrics, workerMetrics } from "./metrics.js";
import { scoreHealth } from "./healthScore.js";

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const STREAM = process.env.WORKER_STREAM || "castle:events:branch:main";
const GROUP = process.env.WORKER_GROUP || "kernel-workers";
const CONSUMER = process.env.WORKER_CONSUMER || `consumer-${process.pid}`;
const BLOCK_MS = Number(process.env.WORKER_BLOCK_MS || 5000);
const CLAIM_MIN_IDLE_MS = Number(process.env.WORKER_CLAIM_MIN_IDLE_MS || 15000);
const RETRY_DELAYS_MS = [1000, 5000, 30000];
const RETRY_MAX_ATTEMPTS = Number(process.env.WORKER_RETRY_MAX_ATTEMPTS || 3);
const INFRA_PORT = Number(process.env.WORKER_INFRA_PORT || 8092);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureGroup(client) {
  try {
    await client.xGroupCreate(STREAM, GROUP, "$", { MKSTREAM: true });
  } catch (e) {
    if (!String(e?.message || "").includes("BUSYGROUP")) throw e;
  }
}

async function sendToDLQ(client, envelope, reason, streamId) {
  workerMetrics.dlqRate += 1;
  await client.xAdd("castle:dlq", "*", {
    reason: String(reason || "unknown"),
    stream: STREAM,
    streamId: String(streamId || ""),
    envelope: JSON.stringify(envelope || {})
  });
}

async function processRecord(client, id, fields) {
  const raw = fields?.envelope;
  let envelope = null;
  try {
    envelope = raw ? JSON.parse(raw) : null;
    if (!envelope) throw new Error("missing_envelope");
    const t0 = Date.now();
    const out = await consume(envelope);
    recordKernelMetrics(out?.kernelMetrics);
    const latency = Date.now() - t0;
    recordConsumeLatency(latency);
    workerMetrics.consumed += 1;
    workerMetrics.ackDelayMs = Math.max(0, Date.now() - Number(envelope.timestamp || Date.now()));
    await client.xAck(STREAM, GROUP, id);
  } catch (e) {
    const reason = e instanceof Error ? e.message : "consume_failed";
    const attempt = Math.max(1, Number(envelope?.attempt || 1));
    if (attempt <= RETRY_MAX_ATTEMPTS) {
      const delay = RETRY_DELAYS_MS[Math.min(attempt - 1, RETRY_DELAYS_MS.length - 1)];
      const retryEnvelope = {
        ...(envelope || {}),
        attempt: attempt + 1,
        lastError: reason,
        nextRetryAt: Date.now() + delay
      };
      workerMetrics.retries += 1;
      await sleep(delay);
      await client.xAdd(STREAM, "*", {
        envelope: JSON.stringify(retryEnvelope)
      });
    } else {
      await sendToDLQ(client, envelope, reason, id);
    }
    await client.xAck(STREAM, GROUP, id);
  }
}

async function autoClaimIdle(client) {
  try {
    let startId = "0-0";
    for (let i = 0; i < 4; i++) {
      const res = await client.xAutoClaim(STREAM, GROUP, CONSUMER, CLAIM_MIN_IDLE_MS, startId, {
        COUNT: 32
      });
      const nextStart = res?.nextId || res?.nextStart || "0-0";
      const messages = res?.messages || [];
      if (!messages.length) break;
      workerMetrics.pendingClaimedTotal += messages.length;
      for (const msg of messages) {
        await processRecord(client, msg.id, msg.message || {});
      }
      startId = nextStart;
      if (nextStart === "0-0") break;
    }
  } catch (e) {
    console.error("[worker-autoclaim]", e?.message || e);
  }
}

function renderMetricsProm() {
  const lines = [
    `castle_worker_consumed_total ${workerMetrics.consumed}`,
    `castle_worker_retry_total ${workerMetrics.retries}`,
    `castle_worker_dlq_total ${workerMetrics.dlqRate}`,
    `castle_worker_ack_delay_ms ${workerMetrics.ackDelayMs}`,
    `castle_worker_consume_latency_p50 ${workerMetrics.consumeLatencyP50}`,
    `castle_worker_consume_latency_p95 ${workerMetrics.consumeLatencyP95}`,
    `castle_worker_pending_claimed_total ${workerMetrics.pendingClaimedTotal}`,
    `castle_kernel_turn_ms ${workerMetrics.kernelTurnMs}`,
    `castle_kernel_causal_append_ms ${workerMetrics.causalAppendMs}`,
    `castle_kernel_replay_ms ${workerMetrics.replayMs}`,
    `castle_kernel_divergence_total ${workerMetrics.divergenceTotal}`
  ];
  for (const k of Object.keys(workerMetrics.consumeLatencyBuckets || {})) {
    lines.push(`castle_worker_consume_latency_bucket{le="${k}"} ${workerMetrics.consumeLatencyBuckets[k]}`);
  }
  lines.push(`castle_worker_consume_latency_bucket{le="+Inf"} ${workerMetrics.consumed}`);
  for (const k of Object.keys(workerMetrics.kernelTurnLatencyBuckets || {})) {
    lines.push(`castle_kernel_turn_latency_bucket{le="${k}"} ${workerMetrics.kernelTurnLatencyBuckets[k]}`);
  }
  lines.push(`castle_kernel_turn_latency_bucket{le="+Inf"} ${workerMetrics.consumed}`);
  return lines.join("\n");
}

function startInfraHttp() {
  const server = createServer((req, res) => {
    const path = String(req.url || "").split("?")[0];
    if (req.method === "GET" && path === "/infra/health") {
      const scored = scoreHealth(workerMetrics);
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(
        JSON.stringify({
          ok: true,
          role: "worker",
          stream: STREAM,
          group: GROUP,
          consumer: CONSUMER,
          status: scored.status,
          score: scored.score,
          reasons: scored.reasons,
          metrics: workerMetrics
        })
      );
      return;
    }
    if (req.method === "GET" && path === "/infra/metrics") {
      res.writeHead(200, { "Content-Type": "text/plain; version=0.0.4; charset=utf-8" });
      res.end(renderMetricsProm());
      return;
    }
    res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: false, error: "not_found" }));
  });
  server.listen(INFRA_PORT, () => {
    console.log(`[worker-infra] http :${INFRA_PORT}`);
  });
}

async function run() {
  startInfraHttp();
  const client = createClient({ url: REDIS_URL });
  client.on("error", (e) => console.error("[worker]", e?.message || e));
  await client.connect();
  await ensureGroup(client);
  console.log(`[worker] online stream=${STREAM} group=${GROUP} consumer=${CONSUMER}`);

  while (true) {
    try {
      const rows = await client.xReadGroup(GROUP, CONSUMER, [{ key: STREAM, id: ">" }], {
        BLOCK: BLOCK_MS,
        COUNT: 32
      });
      await autoClaimIdle(client);
      if (!rows || !rows.length) continue;
      for (const row of rows) {
        for (const msg of row.messages || []) {
          await processRecord(client, msg.id, msg.message || {});
        }
      }
    } catch (e) {
      console.error("[worker-loop]", e?.message || e);
      await sleep(1000);
    }
  }
}

run().catch((e) => {
  console.error("[worker-fatal]", e);
  process.exit(1);
});
