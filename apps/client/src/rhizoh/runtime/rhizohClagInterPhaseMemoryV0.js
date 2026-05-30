/**
 * Inter-Phase Memory Persistence (IPMP) v0 — RESEARCH-ONLY.
 * Makes cross-phase meaning transfer explicit (no longer implicit in logs).
 */

import { TEMPORAL_BEA_PHASE_V0 } from "./rhizohClagTemporalBeaV0.js";

export const RHIZOH_INTER_PHASE_MEMORY_SCHEMA_V0 =
  "castle.rhizoh.inter_phase_memory.v0";

export const INTER_PHASE_CARRIER_KIND_V0 = Object.freeze({
  NARRATIVE_THREAD: "narrative_thread",
  SOVEREIGN_ECHO: "sovereign_echo",
  ROUTE_ECHO: "route_echo",
  CONTAMINATION_REGIME: "contamination_regime",
  SURPRISE_RESIDUE: "surprise_residue",
  SPATIAL_ECHO: "spatial_echo"
});

const MAX_CARRIERS_V0 = 24;
const MAX_LEDGER_V0 = 16;
const DECAY_PER_TICK_V0 = 0.08;

/** @type {Map<string, { carriers: object[], ledger: object[] }>} */
const sessionInterPhaseMemoryV0 = new Map();

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

/**
 * Which phases a carrier may persist into (from transition table).
 * @param {string} transition
 */
function targetPhasesForTransitionV0(transition) {
  const map = Object.freeze({
    bootstrap: [TEMPORAL_BEA_PHASE_V0.ACCUMULATE],
    accumulate_to_accumulate: [TEMPORAL_BEA_PHASE_V0.ACCUMULATE, TEMPORAL_BEA_PHASE_V0.CONSERVE],
    accumulate_to_conserve: [TEMPORAL_BEA_PHASE_V0.CONSERVE],
    accumulate_to_release: [TEMPORAL_BEA_PHASE_V0.RELEASE],
    conserve_to_accumulate: [TEMPORAL_BEA_PHASE_V0.ACCUMULATE],
    conserve_to_conserve: [TEMPORAL_BEA_PHASE_V0.CONSERVE],
    conserve_to_release: [TEMPORAL_BEA_PHASE_V0.RELEASE],
    release_to_accumulate: [TEMPORAL_BEA_PHASE_V0.ACCUMULATE],
    release_to_conserve: [TEMPORAL_BEA_PHASE_V0.CONSERVE],
    release_to_release: [TEMPORAL_BEA_PHASE_V0.RELEASE, TEMPORAL_BEA_PHASE_V0.ACCUMULATE]
  });
  return map[transition] || [TEMPORAL_BEA_PHASE_V0.ACCUMULATE];
}

/**
 * @param {string} sessionId
 */
function getSessionStoreV0(sessionId) {
  const key = String(sessionId || "anonymous").slice(0, 128);
  let store = sessionInterPhaseMemoryV0.get(key);
  if (!store) {
    store = { carriers: [], ledger: [] };
    sessionInterPhaseMemoryV0.set(key, store);
  }
  return store;
}

/**
 * @param {object[]} carriers
 */
function decayCarriersV0(carriers) {
  return carriers
    .map((c) =>
      Object.freeze({
        ...c,
        strength01: clamp01(Number(c.strength01) - DECAY_PER_TICK_V0)
      })
    )
    .filter((c) => c.strength01 > 0.05);
}

/**
 * @param {{
 *   sessionId?: string | null,
 *   traceId?: string | null,
 *   revision?: number,
 *   phaseCouplingGraph?: Record<string, unknown> | null,
 *   boundedEmergence?: Record<string, unknown> | null,
 *   memoryShapingHints?: Record<string, unknown> | null,
 *   graphContamination?: { detected?: boolean } | null
 * }} input
 */
export function persistInterPhaseMemoryV0(input = {}) {
  const store = getSessionStoreV0(input.sessionId);
  store.carriers = decayCarriersV0(store.carriers);

  const pcg = input.phaseCouplingGraph;
  const hints = input.memoryShapingHints;
  const bea = input.boundedEmergence;
  const phase = pcg?.currentPhase || TEMPORAL_BEA_PHASE_V0.ACCUMULATE;
  const transition = pcg?.phaseTransition || "bootstrap";
  const targetPhases = targetPhasesForTransitionV0(transition);

  /** @type {object[]} */
  const bornThisTick = [];

  const threads = hints?.openThreadsBoost;
  if (Array.isArray(threads) && threads.length > 0) {
    for (const t of threads.slice(0, 4)) {
      bornThisTick.push(
        Object.freeze({
          id: `carrier:narr:${String(t).slice(0, 48)}`,
          kind: INTER_PHASE_CARRIER_KIND_V0.NARRATIVE_THREAD,
          payload: String(t),
          bornPhase: phase,
          persistsToPhases: Object.freeze([...targetPhases]),
          strength01: 0.75
        })
      );
    }
  }

  if (hints?.spatialEcho) {
    bornThisTick.push(
      Object.freeze({
        id: "carrier:spatial",
        kind: INTER_PHASE_CARRIER_KIND_V0.SPATIAL_ECHO,
        payload: String(hints.spatialEcho),
        bornPhase: phase,
        persistsToPhases: Object.freeze([...targetPhases]),
        strength01: 0.55
      })
    );
  }

  const route = hints?.primaryRoute?.chainId || bea?.temporal?.strategicFlow?.phase;
  if (hints?.primaryRoute?.chainId) {
    bornThisTick.push(
      Object.freeze({
        id: `carrier:route:${hints.primaryRoute.chainId}`,
        kind: INTER_PHASE_CARRIER_KIND_V0.ROUTE_ECHO,
        payload: hints.primaryRoute.chainId,
        bornPhase: phase,
        persistsToPhases: Object.freeze([...targetPhases]),
        strength01: 0.6
      })
    );
  }
  void route;

  const sovereigns = hints?.activeSovereignNodes;
  if (Array.isArray(sovereigns)) {
    for (const s of sovereigns) {
      bornThisTick.push(
        Object.freeze({
          id: `carrier:sov:${s.registryId || s.label}`,
          kind: INTER_PHASE_CARRIER_KIND_V0.SOVEREIGN_ECHO,
          payload: s.label || s.registryId,
          bornPhase: phase,
          persistsToPhases: Object.freeze([...targetPhases]),
          strength01: s.isPrimary ? 0.7 : 0.45
        })
      );
    }
  }

  if (input.graphContamination?.detected === true) {
    bornThisTick.push(
      Object.freeze({
        id: "carrier:contamination",
        kind: INTER_PHASE_CARRIER_KIND_V0.CONTAMINATION_REGIME,
        payload: "simulation_excluded_runtime",
        bornPhase: phase,
        persistsToPhases: Object.freeze([TEMPORAL_BEA_PHASE_V0.CONSERVE]),
        strength01: 0.85
      })
    );
  }

  if (bea?.controlledSurpriseInjected === true) {
    bornThisTick.push(
      Object.freeze({
        id: `carrier:surprise:${input.revision ?? Date.now()}`,
        kind: INTER_PHASE_CARRIER_KIND_V0.SURPRISE_RESIDUE,
        payload: pcg?.dominantNodesThisPhase?.join(" · ") || "release_pulse",
        bornPhase: TEMPORAL_BEA_PHASE_V0.RELEASE,
        persistsToPhases: Object.freeze([
          TEMPORAL_BEA_PHASE_V0.ACCUMULATE,
          TEMPORAL_BEA_PHASE_V0.CONSERVE
        ]),
        strength01: 0.8
      })
    );
  }

  const byId = new Map(store.carriers.map((c) => [c.id, c]));
  for (const born of bornThisTick) {
    const prev = byId.get(born.id);
    byId.set(
      born.id,
      prev
        ? Object.freeze({
            ...born,
            strength01: clamp01(Math.max(Number(prev.strength01), Number(born.strength01)))
          })
        : born
    );
  }
  store.carriers = [...byId.values()].slice(-MAX_CARRIERS_V0);

  const carriedIntoThisPhase = store.carriers.filter((c) =>
    c.persistsToPhases.includes(phase)
  );

  const explicitMeaningTransfer = Object.freeze({
    transition,
    fromPhase: pcg?.previousPhase ?? null,
    toPhase: phase,
    bornThisTick: Object.freeze(bornThisTick.map((c) => c.id)),
    carriedIntoThisPhase: Object.freeze(
      carriedIntoThisPhase.map((c) =>
        Object.freeze({
          id: c.id,
          kind: c.kind,
          payload: c.payload,
          strength01: c.strength01
        })
      )
    ),
    implicitBefore: false,
    explicitNow: true
  });

  const ledgerEntry = Object.freeze({
    atMs: Date.now(),
    revision: input.revision ?? null,
    traceId: input.traceId ?? null,
    transition,
    phase,
    carrierCount: store.carriers.length,
    carriedCount: carriedIntoThisPhase.length,
    bornCount: bornThisTick.length
  });
  store.ledger.push(ledgerEntry);
  if (store.ledger.length > MAX_LEDGER_V0) store.ledger.shift();

  return Object.freeze({
    schema: RHIZOH_INTER_PHASE_MEMORY_SCHEMA_V0,
    executionApplied: false,
    principle: "cross_phase_meaning_explicit_not_implicit",
    currentPhase: phase,
    phaseTransition: transition,
    semanticCarriers: Object.freeze(store.carriers),
    explicitMeaningTransfer,
    phaseMemoryLedger: Object.freeze(store.ledger.slice(-8)),
    persistenceSummary: Object.freeze({
      narrativeThreads: carriedIntoThisPhase.filter(
        (c) => c.kind === INTER_PHASE_CARRIER_KIND_V0.NARRATIVE_THREAD
      ).length,
      sovereignEchoes: carriedIntoThisPhase.filter(
        (c) => c.kind === INTER_PHASE_CARRIER_KIND_V0.SOVEREIGN_ECHO
      ).length,
      surpriseResidue: carriedIntoThisPhase.filter(
        (c) => c.kind === INTER_PHASE_CARRIER_KIND_V0.SURPRISE_RESIDUE
      ).length,
      contaminationLocked: carriedIntoThisPhase.some(
        (c) => c.kind === INTER_PHASE_CARRIER_KIND_V0.CONTAMINATION_REGIME
      )
    })
  });
}

export function resetInterPhaseMemoryV0() {
  sessionInterPhaseMemoryV0.clear();
}

/**
 * @param {string} sessionId
 * @param {object[]} carriers
 */
export function replaceInterPhaseCarriersV0(sessionId, carriers) {
  const store = getSessionStoreV0(sessionId);
  store.carriers = [...carriers];
}

/**
 * @param {string} sessionId
 */
export function getInterPhaseMemorySnapshotV0(sessionId) {
  const store = sessionInterPhaseMemoryV0.get(String(sessionId || "anonymous").slice(0, 128));
  if (!store) return null;
  return Object.freeze({
    carrierCount: store.carriers.length,
    carriers: Object.freeze(store.carriers.slice(-12)),
    ledger: Object.freeze(store.ledger.slice(-8))
  });
}
