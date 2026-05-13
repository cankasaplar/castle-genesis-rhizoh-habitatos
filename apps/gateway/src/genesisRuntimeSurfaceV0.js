/**
 * Castle Genesis — gateway-authoritative runtime observation surface (V0).
 * Canonical tick = monotonic gateway clock (not wall-clock authority).
 */

import { publishGenesisContinuityEvent } from "./genesisContinuityStreamHubV0.js";

const CANONICAL_TICK_PERIOD_MS = 1000;

let canonicalTick = 0;
let clockStarted = false;

/** @type {{ sealHash: string, issuedAt: number } | null} */
let lastEpistemicSeal = null;

let epistemicLedgerEntriesPersistedTotal = 0;

export function startGenesisCanonicalClock() {
  if (clockStarted) return;
  clockStarted = true;
  setInterval(() => {
    canonicalTick += 1;
    publishGenesisContinuityEvent({
      type: "TickAdvanced",
      id: `tick:${canonicalTick}`,
      payload: { value: canonicalTick, periodMs: CANONICAL_TICK_PERIOD_MS }
    });
  }, CANONICAL_TICK_PERIOD_MS);
}

/** @param {string} hash */
export function recordGenesisEpistemicSealIssued(hash) {
  const h = String(hash || "").trim();
  if (!h) return;
  lastEpistemicSeal = { sealHash: h, issuedAt: Date.now() };
  publishGenesisContinuityEvent({
    type: "SealIssued",
    id: `seal:${h.slice(0, 16)}`,
    payload: { sealHash: h, issuedAt: lastEpistemicSeal.issuedAt }
  });
}

/** @param {number} n */
export function recordGenesisEpistemicLedgerPersisted(n) {
  const k = Math.max(0, Math.floor(Number(n) || 0));
  epistemicLedgerEntriesPersistedTotal += k;
  if (k > 0) {
    publishGenesisContinuityEvent({
      type: "LedgerAdvanced",
      id: `ledger:${epistemicLedgerEntriesPersistedTotal}`,
      payload: { delta: k, total: epistemicLedgerEntriesPersistedTotal }
    });
  }
}

export function getGenesisCanonicalTick() {
  return { value: canonicalTick, periodMs: CANONICAL_TICK_PERIOD_MS };
}

export function getLastGenesisEpistemicSeal() {
  return lastEpistemicSeal;
}

export function getGenesisEpistemicLedgerEntriesPersistedTotal() {
  return epistemicLedgerEntriesPersistedTotal;
}

/**
 * @param {{
 *   infraMetrics: import("./infra/metrics.js").metrics,
 *   scoredHealth: { status: string, score: number, reasons: string[] },
 *   rhizohEnterpriseMetrics: import("./infra/rhizohEnterpriseMetrics.js").rhizohEnterpriseMetrics,
 *   mesh: Record<string, unknown>,
 *   workerHealth: unknown,
 *   port: number,
 *   spiralWebSocketClientsActive?: number
 * }} p
 */
export function buildGenesisRuntimeSurfacePayload(p) {
  const { infraMetrics, scoredHealth, rhizohEnterpriseMetrics, mesh, workerHealth, port, spiralWebSocketClientsActive } =
    p;
  const tick = getGenesisCanonicalTick();
  const seal = getLastGenesisEpistemicSeal();
  const divergent = workerHealth?.metrics?.divergenceTotal;
  const divN = Number(divergent);
  const replayDivergenceKnown = workerHealth && Number.isFinite(divN);

  let replayAlignment = "worker_unavailable";
  if (replayDivergenceKnown) {
    replayAlignment = divN === 0 ? "no_divergence_signal" : "divergence_signal";
  }

  return {
    ok: true,
    schema: "castle.genesis.runtime.surface.v0",
    serverTime: Date.now(),
    uptimeSec: Math.round(process.uptime() * 1000) / 1000,
    canonicalTick: { value: tick.value, periodMs: tick.periodMs },
    lastEpistemicSeal: seal,
    infra: {
      status: scoredHealth.status,
      score: scoredHealth.score,
      reasons: scoredHealth.reasons,
      queueLagMs: infraMetrics.queueLag,
      queueDepth: infraMetrics.queueDepth,
      errors: infraMetrics.errors,
      eventsProcessed: infraMetrics.eventsProcessed
    },
    rhizohLlm: {
      turnsCompleted: rhizohEnterpriseMetrics.turnsTotal,
      turnErrors: rhizohEnterpriseMetrics.turnErrors,
      constitutionalThrottleTotal: rhizohEnterpriseMetrics.decisionByAction?.throttle ?? 0
    },
    presenceMesh: mesh,
    epistemicLedger: {
      entriesPersistedTotal: getGenesisEpistemicLedgerEntriesPersistedTotal()
    },
    replay: {
      source: "worker_infra_health",
      workerPresent: Boolean(workerHealth),
      divergenceTotal: replayDivergenceKnown ? divN : null,
      alignment: replayAlignment
    },
    spiralWebSocket:
      spiralWebSocketClientsActive == null
        ? undefined
        : { clientsActive: Math.max(0, Math.floor(Number(spiralWebSocketClientsActive) || 0)) },
    gateway: { service: "castle-gateway", wsPort: port }
  };
}
