/**
 * Semantic Compression / Forgetting Regulator (SFR) v0 — RESEARCH-ONLY.
 * IPMP carries meaning forward; SFR resolves, compresses, and forgets naturally.
 */

import { INTER_PHASE_CARRIER_KIND_V0 } from "./rhizohClagInterPhaseMemoryV0.js";
import { replaceInterPhaseCarriersV0 } from "./rhizohClagInterPhaseMemoryV0.js";
import { TEMPORAL_BEA_PHASE_V0 } from "./rhizohClagTemporalBeaV0.js";

export const RHIZOH_SEMANTIC_FORGETTING_REGULATOR_SCHEMA_V0 =
  "castle.rhizoh.semantic_forgetting_regulator.v0";

const FORGET_STRENGTH_THRESHOLD_V0 = 0.12;
const COMPRESS_STRENGTH_MAX_V0 = 0.42;
const SURPRISE_RESOLVE_IN_ACCUMULATE_V0 = 0.48;

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

/**
 * @param {object} carrier
 * @param {string} phase
 * @param {string} transition
 * @param {boolean} contaminationDetected
 */
function shouldForgetCarrierV0(carrier, phase, transition, contaminationDetected) {
  if (Number(carrier.strength01) < FORGET_STRENGTH_THRESHOLD_V0) {
    return { forget: true, reason: "strength_below_threshold" };
  }

  if (
    carrier.kind === INTER_PHASE_CARRIER_KIND_V0.SURPRISE_RESIDUE &&
    phase === TEMPORAL_BEA_PHASE_V0.ACCUMULATE &&
    (transition === "release_to_accumulate" || transition === "release_to_conserve")
  ) {
    return { forget: true, reason: "surprise_residue_naturally_resolved" };
  }

  if (
    carrier.kind === INTER_PHASE_CARRIER_KIND_V0.SURPRISE_RESIDUE &&
    phase === TEMPORAL_BEA_PHASE_V0.ACCUMULATE &&
    Number(carrier.strength01) < SURPRISE_RESOLVE_IN_ACCUMULATE_V0
  ) {
    return { forget: true, reason: "surprise_absorbed_into_accumulate" };
  }

  if (
    carrier.kind === INTER_PHASE_CARRIER_KIND_V0.CONTAMINATION_REGIME &&
    !contaminationDetected &&
    phase !== TEMPORAL_BEA_PHASE_V0.CONSERVE
  ) {
    return { forget: true, reason: "contamination_regime_cleared" };
  }

  if (
    !carrier.persistsToPhases?.includes(phase) &&
    Number(carrier.strength01) < 0.28
  ) {
    return { forget: true, reason: "phase_arc_completed" };
  }

  return { forget: false, reason: null };
}

/**
 * @param {object[]} carriers
 * @param {string} kind
 */
function compressByKindV0(carriers, kind) {
  const group = carriers.filter((c) => c.kind === kind);
  if (group.length < 2) return { compressed: [], remainder: carriers };

  const payloads = group.map((c) => String(c.payload || "")).filter(Boolean);
  const avgStrength =
    group.reduce((s, c) => s + Number(c.strength01), 0) / group.length;

  if (avgStrength > COMPRESS_STRENGTH_MAX_V0) {
    return { compressed: [], remainder: carriers };
  }

  const compressed = Object.freeze({
    id: `compressed:${kind}:${group.length}`,
    kind: `compressed_${kind}`,
    sourceKind: kind,
    payload:
      kind === INTER_PHASE_CARRIER_KIND_V0.SOVEREIGN_ECHO
        ? `dual_sovereign_field:${payloads.join("|")}`
        : kind === INTER_PHASE_CARRIER_KIND_V0.NARRATIVE_THREAD
          ? `thread_bundle:${payloads.length}`
          : `bundle:${payloads.slice(0, 2).join("·")}`,
    bornPhase: group[0].bornPhase,
    persistsToPhases: group[0].persistsToPhases,
    strength01: clamp01(avgStrength + 0.08),
    compressedFrom: Object.freeze(group.map((c) => c.id))
  });

  const dropIds = new Set(group.map((c) => c.id));
  const remainder = carriers.filter((c) => !dropIds.has(c.id));
  return { compressed: [compressed], remainder };
}

/**
 * @param {ReturnType<import("./rhizohClagInterPhaseMemoryV0.js").persistInterPhaseMemoryV0>} interPhaseMemory
 * @param {{
 *   sessionId?: string | null,
 *   graphContamination?: { detected?: boolean } | null
 * }} ctx
 */
export function applySemanticForgettingRegulatorV0(interPhaseMemory, ctx = {}) {
  const phase = interPhaseMemory?.currentPhase || TEMPORAL_BEA_PHASE_V0.ACCUMULATE;
  const transition = interPhaseMemory?.phaseTransition || "bootstrap";
  const contaminationDetected = ctx.graphContamination?.detected === true;
  const sessionId = ctx.sessionId;

  let carriers = [...(interPhaseMemory?.semanticCarriers || [])];

  /** @type {object[]} */
  const forgotten = [];
  /** @type {object[]} */
  const retained = [];

  for (const c of carriers) {
    const { forget, reason } = shouldForgetCarrierV0(
      c,
      phase,
      transition,
      contaminationDetected
    );
    if (forget) {
      forgotten.push(
        Object.freeze({
          id: c.id,
          kind: c.kind,
          payload: c.payload,
          reason,
          strength01: c.strength01
        })
      );
    } else {
      retained.push(c);
    }
  }

  carriers = retained;

  /** @type {object[]} */
  const compressed = [];

  const sov = compressByKindV0(carriers, INTER_PHASE_CARRIER_KIND_V0.SOVEREIGN_ECHO);
  carriers = sov.remainder;
  compressed.push(...sov.compressed);

  const narr = compressByKindV0(carriers, INTER_PHASE_CARRIER_KIND_V0.NARRATIVE_THREAD);
  carriers = narr.remainder;
  compressed.push(...narr.compressed);

  carriers = [...carriers, ...compressed].slice(-24);

  if (sessionId) {
    replaceInterPhaseCarriersV0(sessionId, carriers);
  }

  const compressionRatio =
    interPhaseMemory?.semanticCarriers?.length > 0
      ? Math.round((1 - carriers.length / interPhaseMemory.semanticCarriers.length) * 1000) / 1000
      : 0;

  const regulator = Object.freeze({
    schema: RHIZOH_SEMANTIC_FORGETTING_REGULATOR_SCHEMA_V0,
    executionApplied: false,
    principle: "carry_forward_with_natural_resolution",
    phase,
    transition,
    forgottenCarriers: Object.freeze(forgotten),
    compressedCarriers: Object.freeze(compressed),
    retainedCarriers: Object.freeze(
      carriers.map((c) =>
        Object.freeze({
          id: c.id,
          kind: c.kind,
          payload: c.payload,
          strength01: c.strength01
        })
      )
    ),
    summary: Object.freeze({
      forgottenCount: forgotten.length,
      compressedCount: compressed.length,
      retainedCount: carriers.length,
      compressionRatio,
      naturalResolution: forgotten.some((f) =>
        String(f.reason).includes("resolved") || String(f.reason).includes("cleared")
      )
    })
  });

  return Object.freeze({
    ...interPhaseMemory,
    semanticCarriers: Object.freeze(carriers),
    explicitMeaningTransfer: Object.freeze({
      ...interPhaseMemory.explicitMeaningTransfer,
      carriedIntoThisPhase: Object.freeze(
        carriers.map((c) =>
          Object.freeze({
            id: c.id,
            kind: c.kind,
            payload: c.payload,
            strength01: c.strength01
          })
        )
      )
    }),
    semanticForgetting: regulator
  });
}

export function resetSemanticForgettingRegulatorV0() {
  /* state lives in IPMP store; reset via resetInterPhaseMemoryV0 */
}
