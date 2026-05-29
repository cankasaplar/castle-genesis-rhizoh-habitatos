/**
 * Post-go-live integrity loop (T+0 → T+300s) — read-only self-audit.
 * @see docs/RHIZOH_GO_LIVE_ACTIVATION_PROTOCOL_V1.md §7
 * @see docs/POST_GO_LIVE_AUTONOMOUS_STABILITY_CONTRACT_V1.md
 */

export const POST_GO_LIVE_INTEGRITY_SCHEMA_V0 = "castle.rhizoh.post_go_live_integrity.v0";

export const SYSTEM_STATE_V0 = Object.freeze({
  LIVE_OK: "LIVE_OK",
  DEGRADED: "DEGRADED",
  QUARANTINE: "QUARANTINE"
});

const DEFAULT_LOOP_MS_V0 = 300_000;
const DEFAULT_INTERVAL_MS_V0 = 30_000;

/**
 * @param {number[]} seqs
 */
export function isMonotonicNonDecreasingV0(seqs) {
  if (!seqs.length) return true;
  for (let i = 1; i < seqs.length; i++) {
    if (seqs[i] < seqs[i - 1]) return false;
  }
  return true;
}

/**
 * @param {object} signals
 * @returns {{ system_state: string, checks: object, atMs: number }}
 */
export function evaluatePostGoLiveIntegrityV0(signals = {}) {
  const atMs = Date.now();
  const checks = {
    eventConsistency: { ok: true, detail: "no_signal" },
    layerTrace: { ok: true, detail: "no_signal" },
    nodeHealthEcho: { ok: true, detail: "no_signal" }
  };

  const eventSeqs = Array.isArray(signals.eventSeqs) ? signals.eventSeqs.filter(Number.isFinite) : [];
  if (eventSeqs.length > 0) {
    const monotonic = isMonotonicNonDecreasingV0(eventSeqs);
    const dupes = new Set(eventSeqs).size !== eventSeqs.length;
    checks.eventConsistency = {
      ok: monotonic && !dupes,
      detail: monotonic ? (dupes ? "duplicate_seq" : "monotonic") : "ordering_regression"
    };
  } else if (Number.isFinite(signals.shadowWalTick)) {
    checks.eventConsistency = {
      ok: signals.shadowWalTick >= 0,
      detail: `shadow_wal_tick_${signals.shadowWalTick}`
    };
  }

  const orphanNarrative =
    Boolean(signals.orphanNarrativeDetected) ||
    Number(signals.orphanNarrativeCount) > 0;
  const derivedTraceOk = signals.derivedTracePresent !== false;
  const provenanceOk = signals.narrativeProvenanceOk !== false;
  checks.layerTrace = {
    ok: !orphanNarrative && derivedTraceOk && provenanceOk,
    detail: orphanNarrative
      ? "orphan_narrative"
      : !provenanceOk
        ? "missing_source_provenance_tag"
        : derivedTraceOk
          ? "trace_ok"
          : "missing_derived_trace"
  };

  const expectedNodes = Number(signals.expectedGuardianNodes) || 0;
  const heartbeats = Array.isArray(signals.nodeHeartbeats) ? signals.nodeHeartbeats : [];
  const staleMs = Number(signals.heartbeatStaleMs) || 120_000;
  const alive = heartbeats.filter((h) => h && atMs - Number(h.lastSeenMs) <= staleMs);
  const nodeOk =
    expectedNodes === 0
      ? heartbeats.length === 0 || alive.length === heartbeats.length
      : alive.length >= expectedNodes;
  checks.nodeHealthEcho = {
    ok: nodeOk,
    detail: `alive_${alive.length}_of_${heartbeats.length}_expected_${expectedNodes}`
  };

  const anyFail = Object.values(checks).some((c) => !c.ok);
  const twoFail = Object.values(checks).filter((c) => !c.ok).length >= 2;

  const system_state = twoFail
    ? SYSTEM_STATE_V0.QUARANTINE
    : anyFail
      ? SYSTEM_STATE_V0.DEGRADED
      : SYSTEM_STATE_V0.LIVE_OK;

  const result = Object.freeze({
    schema: POST_GO_LIVE_INTEGRITY_SCHEMA_V0,
    system_state,
    checks,
    atMs
  });

  return result;
}

/**
 * @param {{ collectSignals?: () => object, onTick?: (r: ReturnType<typeof evaluatePostGoLiveIntegrityV0>) => void, durationMs?: number, intervalMs?: number }} [opts]
 * @returns {() => void} teardown
 */
export function startPostGoLiveIntegrityLoopV0(opts = {}) {
  const durationMs = Number(opts.durationMs) || DEFAULT_LOOP_MS_V0;
  const intervalMs = Number(opts.intervalMs) || DEFAULT_INTERVAL_MS_V0;
  const collect = opts.collectSignals || (() => ({}));
  const started = Date.now();
  let last = null;

  const tick = () => {
    last = evaluatePostGoLiveIntegrityV0(collect());
    opts.onTick?.(last);
    if (typeof window !== "undefined") {
      window.__rhizoh_go_live_integrity = { ...last, loopActive: Date.now() - started < durationMs };
    }
  };

  tick();
  const id = setInterval(() => {
    if (Date.now() - started >= durationMs) {
      clearInterval(id);
      if (typeof window !== "undefined" && window.__rhizoh_go_live_integrity) {
        window.__rhizoh_go_live_integrity.loopActive = false;
      }
      return;
    }
    tick();
  }, intervalMs);

  return () => clearInterval(id);
}
