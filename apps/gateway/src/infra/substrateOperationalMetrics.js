/**
 * Substrate operational metrics — gateway relay + aggregated client reality health.
 * Prometheus text via renderSubstratePrometheusMetricsV0(); JSON via buildSubstrateOperationalSnapshotV0().
 */

export const SUBSTRATE_OPERATIONAL_METRICS_SCHEMA_V0 = "castle.gateway.substrate_operational_metrics.v0";

const DRAIN_LATENCY_UPPER_MS = [50, 100, 250, 500, 1000, 2000, 5000, 15000];

/** @type {Record<string, number>} */
const walRejectByCode = {};

/** Rolling client aggregates (last report wins per clientId; TTL prune). */
const clientReports = new Map();
const CLIENT_REPORT_TTL_MS = 120_000;

let walPeerRejectTotal = 0;
let clientReportsTotal = 0;

let clientDrainPassesPerMinSum = 0;
let clientDrainPassesPerMinN = 0;
let clientEpochBumpsPerMinSum = 0;
let clientEpochBumpsPerMinN = 0;
let clientQuarantineEventsSum = 0;
let clientReplayMismatchSum = 0;
let clientUnsignedRejectSum = 0;
let clientInflationCriticalSum = 0;
let clientQueuePeakMax = 0;

const clientDrainLatencyBuckets = DRAIN_LATENCY_UPPER_MS.map(() => 0);

/**
 * @param {string} code
 */
export function recordWalPeerRejectV0(code) {
  const c = String(code || "unknown").slice(0, 48);
  walRejectByCode[c] = (walRejectByCode[c] || 0) + 1;
  walPeerRejectTotal += 1;
}

/**
 * @param {Record<string, unknown>} snapshot realityHealth-style payload from client
 * @param {{ clientId?: string, uid?: string }} meta
 */
export function recordClientSubstrateHealthV0(snapshot, meta = {}) {
  if (!snapshot || typeof snapshot !== "object") return;
  const id = String(meta.clientId || meta.uid || "anonymous").slice(0, 128);
  clientReports.set(id, { snapshot, atMs: Date.now(), meta });
  clientReportsTotal += 1;

  const rates = snapshot.rates && typeof snapshot.rates === "object" ? snapshot.rates : {};
  const counters = snapshot.counters && typeof snapshot.counters === "object" ? snapshot.counters : {};
  const qp = snapshot.queuePressure && typeof snapshot.queuePressure === "object" ? snapshot.queuePressure : {};

  if (Number.isFinite(Number(rates.drainPassesPerMin))) {
    clientDrainPassesPerMinSum += Number(rates.drainPassesPerMin);
    clientDrainPassesPerMinN += 1;
  }
  if (Number.isFinite(Number(rates.epochBumpsPerMin))) {
    clientEpochBumpsPerMinSum += Number(rates.epochBumpsPerMin);
    clientEpochBumpsPerMinN += 1;
  }
  clientQuarantineEventsSum += Number(counters.quarantineEvents) || 0;
  clientReplayMismatchSum += Number(counters.replayMismatchEvents) || 0;
  clientUnsignedRejectSum += Number(counters.unsignedRejectEvents) || 0;
  clientInflationCriticalSum += Number(counters.inflationCriticalHoldCount) || 0;
  clientQueuePeakMax = Math.max(clientQueuePeakMax, Number(qp.peakDepth) || 0);

  const latencyMs = Number(counters.lastDrainLatencyMs);
  if (Number.isFinite(latencyMs) && latencyMs >= 0) {
    for (let i = 0; i < DRAIN_LATENCY_UPPER_MS.length; i++) {
      if (latencyMs <= DRAIN_LATENCY_UPPER_MS[i]) {
        clientDrainLatencyBuckets[i] += 1;
        break;
      }
    }
  }

  pruneStaleClientReportsV0();
}

function pruneStaleClientReportsV0() {
  const now = Date.now();
  for (const [id, row] of clientReports.entries()) {
    if (now - row.atMs > CLIENT_REPORT_TTL_MS) clientReports.delete(id);
  }
}

/**
 * @returns {Record<string, unknown>}
 */
export function buildSubstrateOperationalSnapshotV0() {
  pruneStaleClientReportsV0();
  const activeClients = clientReports.size;
  const avgDrain =
    clientDrainPassesPerMinN > 0 ? clientDrainPassesPerMinSum / clientDrainPassesPerMinN : 0;
  const avgEpoch =
    clientEpochBumpsPerMinN > 0 ? clientEpochBumpsPerMinSum / clientEpochBumpsPerMinN : 0;

  return {
    schema: SUBSTRATE_OPERATIONAL_METRICS_SCHEMA_V0,
    ts: Date.now(),
    gateway: {
      walPeerRejectTotal,
      walRejectByCode: { ...walRejectByCode }
    },
    clients: {
      activeReports: activeClients,
      reportsTotal: clientReportsTotal,
      avgDrainPassesPerMin: avgDrain,
      avgEpochBumpsPerMin: avgEpoch,
      quarantineEventsSum: clientQuarantineEventsSum,
      replayMismatchSum: clientReplayMismatchSum,
      unsignedRejectSum: clientUnsignedRejectSum,
      inflationCriticalHoldSum: clientInflationCriticalSum,
      queuePeakMax: clientQueuePeakMax
    },
    alerts: deriveSubstrateAlertHintsV0({ avgDrain, avgEpoch, activeClients })
  };
}

/**
 * @param {Record<string, unknown>} ctx
 */
function deriveSubstrateAlertHintsV0(ctx) {
  /** @type {string[]} */
  const hints = [];
  if (ctx.avgEpoch > 30) hints.push("epoch_bump_burst");
  if (clientReplayMismatchSum > 5) hints.push("replay_mismatch_burst");
  if (clientQuarantineEventsSum > 10) hints.push("quarantine_spike");
  if (clientInflationCriticalSum > 3) hints.push("inflation_critical_hold");
  if (walPeerRejectTotal > 20) hints.push("wal_peer_reject_spike");
  return hints;
}

export function renderSubstratePrometheusMetricsV0() {
  const snap = buildSubstrateOperationalSnapshotV0();
  const g = snap.gateway;
  const c = snap.clients;
  const lines = [];

  lines.push("# HELP castle_substrate_wal_peer_reject_total WAL peer ingress rejected at gateway.");
  lines.push("# TYPE castle_substrate_wal_peer_reject_total counter");
  lines.push(`castle_substrate_wal_peer_reject_total ${g.walPeerRejectTotal}`);

  for (const [code, n] of Object.entries(g.walRejectByCode || {})) {
    const safe = code.replace(/[^a-zA-Z0-9_]/g, "_") || "unknown";
    lines.push(`castle_substrate_wal_peer_reject_total{code="${safe}"} ${n}`);
  }

  lines.push("# HELP castle_substrate_client_reports_total Client reality health reports ingested.");
  lines.push("# TYPE castle_substrate_client_reports_total counter");
  lines.push(`castle_substrate_client_reports_total ${c.reportsTotal}`);

  lines.push("# HELP castle_substrate_client_active_reports Active client health reports (TTL window).");
  lines.push("# TYPE castle_substrate_client_active_reports gauge");
  lines.push(`castle_substrate_client_active_reports ${c.activeReports}`);

  lines.push("# HELP castle_substrate_client_drain_passes_per_min_avg Rolling avg drain rate from clients.");
  lines.push("# TYPE castle_substrate_client_drain_passes_per_min_avg gauge");
  lines.push(`castle_substrate_client_drain_passes_per_min_avg ${c.avgDrainPassesPerMin}`);

  lines.push("# HELP castle_substrate_client_epoch_bumps_per_min_avg Rolling avg epoch bump rate from clients.");
  lines.push("# TYPE castle_substrate_client_epoch_bumps_per_min_avg gauge");
  lines.push(`castle_substrate_client_epoch_bumps_per_min_avg ${c.avgEpochBumpsPerMin}`);

  lines.push("# HELP castle_substrate_client_quarantine_events_sum Sum of client quarantine events.");
  lines.push("# TYPE castle_substrate_client_quarantine_events_sum counter");
  lines.push(`castle_substrate_client_quarantine_events_sum ${c.quarantineEventsSum}`);

  lines.push("# HELP castle_substrate_client_replay_mismatch_sum Sum of client replay mismatch events.");
  lines.push("# TYPE castle_substrate_client_replay_mismatch_sum counter");
  lines.push(`castle_substrate_client_replay_mismatch_sum ${c.replayMismatchSum}`);

  lines.push("# HELP castle_substrate_client_drain_latency_ms_bucket Client drain latency buckets.");
  lines.push("# TYPE castle_substrate_client_drain_latency_ms_bucket counter");
  for (let i = 0; i < DRAIN_LATENCY_UPPER_MS.length; i++) {
    lines.push(
      `castle_substrate_client_drain_latency_ms_bucket{le="${DRAIN_LATENCY_UPPER_MS[i]}"} ${clientDrainLatencyBuckets[i]}`
    );
  }

  return `${lines.join("\n")}\n`;
}

/** @internal */
export function resetSubstrateOperationalMetricsForTestV0() {
  for (const k of Object.keys(walRejectByCode)) delete walRejectByCode[k];
  walPeerRejectTotal = 0;
  clientReports.clear();
  clientReportsTotal = 0;
  clientDrainPassesPerMinSum = 0;
  clientDrainPassesPerMinN = 0;
  clientEpochBumpsPerMinSum = 0;
  clientEpochBumpsPerMinN = 0;
  clientQuarantineEventsSum = 0;
  clientReplayMismatchSum = 0;
  clientUnsignedRejectSum = 0;
  clientInflationCriticalSum = 0;
  clientQueuePeakMax = 0;
  for (let i = 0; i < clientDrainLatencyBuckets.length; i++) clientDrainLatencyBuckets[i] = 0;
}
