#!/usr/bin/env node
/**
 * Multi-user genesis ingress load sim — social concurrency + agent noise probe.
 *
 * Usage:
 *   node scripts/genesis-ingress-social-load-sim.mjs
 *   CASTLE_GATEWAY_TOKEN=... node scripts/genesis-ingress-social-load-sim.mjs --users 8 --ticks 3
 */

const BASE = String(process.env.CASTLE_GATEWAY_BASE || process.env.VITE_LIVE_GATEWAY_BASE || "")
  .trim()
  .replace(/\/+$/, "") || "https://castle-genesis-rhizoh-habitatos.onrender.com";
const TOKEN = String(process.env.CASTLE_GATEWAY_TOKEN || process.env.VITE_GATEWAY_TOKEN || "").trim();
const USERS = Math.max(1, Math.min(24, Number(process.argv.find((a, i) => process.argv[i - 1] === "--users") || 6)));
const TICKS = Math.max(1, Math.min(10, Number(process.argv.find((a, i) => process.argv[i - 1] === "--ticks") || 2)));

async function postIngress(clientId, type, payload, atMs) {
  const headers = { "Content-Type": "application/json" };
  if (TOKEN) headers["X-Castle-Gateway-Token"] = TOKEN;
  const body = {
    schema: "castle.world_observation.ingress_envelope.v1",
    type,
    atMs,
    ingressKey: `${type}:${clientId}:${atMs}`,
    payload
  };
  const res = await fetch(`${BASE}/rhizoh/genesis/ingress`, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function runUser(userIndex) {
  const clientId = `loadsim:user:${userIndex}`;
  const results = [];
  for (let t = 0; t < TICKS; t += 1) {
    const atMs = Date.now() + userIndex * 17 + t;
    const tick = await postIngress(clientId, "world.tick", { simTime: t + 1, clientTickCount: t, mode: "loadsim" }, atMs);
    results.push(tick);
    const spoke = await postIngress(
      clientId,
      "agent.spoke",
      { preview: `loadsim hello from ${clientId}`, traceId: `sim-${userIndex}-${t}` },
      atMs + 1
    );
    results.push(spoke);
  }
  return results;
}

async function main() {
  console.log(`[ingress-load-sim] base=${BASE} users=${USERS} ticks=${TICKS}`);
  const t0 = Date.now();
  const batches = await Promise.all(Array.from({ length: USERS }, (_, i) => runUser(i + 1)));
  const flat = batches.flat();
  const ok = flat.filter((r) => r.status === 200 || r.status === 202).length;
  const deferred = flat.filter((r) => r.json?.deferred === true || r.status === 429).length;
  const idempotent = flat.filter((r) => r.json?.idempotent === true).length;

  let runtime = null;
  try {
    const r = await fetch(`${BASE}/rhizoh/genesis/runtime`);
    runtime = await r.json();
  } catch {
    /* noop */
  }

  const seqContinuity =
    runtime?.genesisStream?.clientIngress?.closure?.seqAudit ??
    runtime?.genesisStream?.seqContinuity ??
    null;

  console.log(
    JSON.stringify(
      {
        ok: true,
        elapsedMs: Date.now() - t0,
        requests: flat.length,
        accepted: ok,
        deferred,
        idempotent,
        lastAcceptedSeq: runtime?.genesisStream?.lastAcceptedSeq ?? null,
        socialLoad: runtime?.genesisStream?.clientIngress?.closure?.socialLoad ?? null,
        seqContinuity
      },
      null,
      2
    )
  );
  if (deferred > flat.length * 0.25) process.exitCode = 1;
}

main().catch((e) => {
  console.error("[ingress-load-sim] fatal", e);
  process.exit(1);
});
