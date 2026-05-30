/**
 * Temporal BEA v0 — time-aware emergence budgeting (RESEARCH-ONLY).
 * Turns static per-tick budget into strategic pool: accumulate · conserve · release (controlled surprise).
 */

export const RHIZOH_TEMPORAL_BEA_SCHEMA_V0 = "castle.rhizoh.temporal_bea.v0";

export const TEMPORAL_BEA_PHASE_V0 = Object.freeze({
  ACCUMULATE: "accumulate",
  CONSERVE: "conserve",
  RELEASE: "release"
});

const POOL_CAP_V0 = 0.45;
const POOL_FLOOR_V0 = 0.05;
const REFILL_NOMINAL_V0 = 0.03;
const REFILL_CONTAMINATED_V0 = 0.012;
const RELEASE_POOL_THRESHOLD_V0 = 0.22;
const RELEASE_BOOST_V0 = 1.22;
const CONSERVE_POOL_THRESHOLD_V0 = 0.38;
const MAX_TICK_HISTORY_V0 = 16;
const STABLE_TICKS_FOR_RELEASE_V0 = 3;

/** @type {Map<string, { pool01: number, ticks: object[], tickCount: number }>} */
const sessionTemporalStateV0 = new Map();

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

/**
 * @param {string} sessionId
 */
function getOrInitSessionStateV0(sessionId) {
  const key = String(sessionId || "anonymous").slice(0, 128);
  let state = sessionTemporalStateV0.get(key);
  if (!state) {
    state = { pool01: POOL_FLOOR_V0, ticks: [], tickCount: 0 };
    sessionTemporalStateV0.set(key, state);
  }
  return state;
}

/**
 * @param {object[]} ticks
 */
function recentStableNominalTicksV0(ticks) {
  const recent = ticks.slice(-STABLE_TICKS_FOR_RELEASE_V0);
  return (
    recent.length >= STABLE_TICKS_FOR_RELEASE_V0 &&
    recent.every((t) => t.regime === "nominal" && t.contaminationDetected !== true)
  );
}

/**
 * @param {ReturnType<import("./rhizohClagBoundedEmergenceAllocatorV0.js").allocateBoundedEmergenceV0>} bea
 * @param {{ sessionId?: string | null, traceId?: string | null, revision?: number }} ctx
 */
export function applyTemporalBeaV0(bea, ctx = {}) {
  const state = getOrInitSessionStateV0(ctx.sessionId);
  state.tickCount += 1;

  const contaminated = bea.regime === "contaminated_capped";
  const refill = contaminated ? REFILL_CONTAMINATED_V0 : REFILL_NOMINAL_V0;
  state.pool01 = clamp01(state.pool01 + refill);

  let phase = TEMPORAL_BEA_PHASE_V0.ACCUMULATE;
  if (contaminated || state.pool01 >= CONSERVE_POOL_THRESHOLD_V0) {
    phase = TEMPORAL_BEA_PHASE_V0.CONSERVE;
  }
  const stable = recentStableNominalTicksV0(state.ticks);
  if (
    !contaminated &&
    stable &&
    state.pool01 >= RELEASE_POOL_THRESHOLD_V0 &&
    bea.emergenceBudgetRemaining > 0.02
  ) {
    phase = TEMPORAL_BEA_PHASE_V0.RELEASE;
  }

  const releaseBoost = phase === TEMPORAL_BEA_PHASE_V0.RELEASE ? RELEASE_BOOST_V0 : 1;
  const controlledSurpriseInjected = phase === TEMPORAL_BEA_PHASE_V0.RELEASE;

  const boostedResonance = bea.controlledResonance.map((edge) =>
    Object.freeze({
      ...edge,
      weight: Math.round(Math.min(0.12, Number(edge.weight) * releaseBoost) * 1000) / 1000,
      temporalBoost: releaseBoost > 1
    })
  );

  const tickSpend = clamp01(Math.min(bea.spent01, state.pool01));
  if (phase === TEMPORAL_BEA_PHASE_V0.RELEASE) {
    state.pool01 = clamp01(state.pool01 - tickSpend * 0.85);
  } else if (phase === TEMPORAL_BEA_PHASE_V0.CONSERVE) {
    state.pool01 = clamp01(state.pool01 - tickSpend * 0.35);
  } else {
    state.pool01 = clamp01(state.pool01 - tickSpend * 0.15);
  }
  state.pool01 = Math.min(POOL_CAP_V0, state.pool01);

  const tickRecord = Object.freeze({
    atMs: Date.now(),
    revision: ctx.revision ?? null,
    traceId: ctx.traceId ?? null,
    phase,
    pool01After: state.pool01,
    spent01: bea.spent01,
    regime: bea.regime,
    contaminationDetected: contaminated,
    controlledSurpriseInjected
  });
  state.ticks.push(tickRecord);
  if (state.ticks.length > MAX_TICK_HISTORY_V0) state.ticks.shift();

  const strategicFlow = Object.freeze({
    phase,
    controlledSurpriseInjected,
    releaseBoost: releaseBoost > 1 ? releaseBoost : null,
    pool01: Math.round(state.pool01 * 1000) / 1000,
    poolCap01: POOL_CAP_V0,
    refillThisTick: refill,
    tickCount: state.tickCount,
    stableTicksForRelease: stable,
    underEmergenceRisk:
      state.pool01 >= RELEASE_POOL_THRESHOLD_V0 &&
      phase === TEMPORAL_BEA_PHASE_V0.CONSERVE &&
      state.tickCount > 8,
    overRegulationRisk: phase === TEMPORAL_BEA_PHASE_V0.CONSERVE && state.pool01 > CONSERVE_POOL_THRESHOLD_V0
  });

  return Object.freeze({
    ...bea,
    schema: `${bea.schema}+temporal`,
    temporal: Object.freeze({
      schema: RHIZOH_TEMPORAL_BEA_SCHEMA_V0,
      executionApplied: false,
      role: "controlled_surprise_injector",
      strategicFlow,
      tickHistory: Object.freeze(state.ticks.slice(-8)),
      effectiveResonanceBudget01: clamp01(
        bea.resonanceBudget01 * (controlledSurpriseInjected ? releaseBoost : 1)
      ),
      emergencePoolRemaining01: state.pool01
    }),
    controlledResonance: Object.freeze(boostedResonance),
    controlledSurpriseInjected
  });
}

export function resetTemporalBeaStateV0() {
  sessionTemporalStateV0.clear();
}

export function getTemporalBeaSessionSnapshotV0(sessionId) {
  const state = sessionTemporalStateV0.get(String(sessionId || "anonymous").slice(0, 128));
  if (!state) return null;
  return Object.freeze({
    pool01: state.pool01,
    tickCount: state.tickCount,
    recentTicks: Object.freeze(state.ticks.slice(-8))
  });
}
