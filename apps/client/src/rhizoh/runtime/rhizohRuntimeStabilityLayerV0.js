/**
 * Runtime Stability Layer v0 — product surface collapse.
 * CLAG / BEA / IPMP / SFR run internally; external output = conversation behavior only.
 * ARCHITECTURE FROZEN — no new graph features; stabilization pass only.
 */

import { logCastleLifecycleV0 } from "./rhizohProductionLogNamespacesV0.js";
import { TEMPORAL_BEA_PHASE_V0 } from "./rhizohClagTemporalBeaV0.js";
import {
  mergeSpeechResonanceIntoBehaviorV0,
  resetSpeechMeaningEngineV0,
  runSpeechMeaningEngineV0
} from "./rhizohSpeechMeaningEngineV0.js";
import { resetContinuityCacheV0 } from "./rhizohContinuityCacheV0.js";

export const RHIZOH_RUNTIME_STABILITY_SCHEMA_V0 = "castle.rhizoh.runtime_stability.v0";

/** @type {object | null} */
let lastInternalClagGraphV0 = null;
/** @type {object | null} */
let lastStabilitySnapshotV0 = null;

/**
 * @returns {boolean}
 */
export function isRhizohStabilityVerboseV0() {
  try {
    if (import.meta.env?.DEV) return true;
    return String(import.meta.env?.VITE_RHIZOH_STABILITY_VERBOSE || "") === "1";
  } catch {
    return false;
  }
}

/**
 * Phase labels hidden from product surface — feel engine only.
 * @param {string} phase
 */
function abstractPhaseFeelV0(phase) {
  if (phase === TEMPORAL_BEA_PHASE_V0.RELEASE) {
    return Object.freeze({ breath: "exhale", feel: "resonant_pulse" });
  }
  if (phase === TEMPORAL_BEA_PHASE_V0.CONSERVE) {
    return Object.freeze({ breath: "hold", feel: "steady_guarded" });
  }
  return Object.freeze({ breath: "inhale", feel: "calm_open" });
}

/**
 * @param {string} phase
 * @param {boolean} surprise
 */
function pacingFromPhaseV0(phase, surprise) {
  if (surprise) return "engaged";
  if (phase === TEMPORAL_BEA_PHASE_V0.CONSERVE) return "measured";
  if (phase === TEMPORAL_BEA_PHASE_V0.RELEASE) return "flowing";
  return "calm";
}

/**
 * @param {Record<string, unknown>} clagGraph
 * @param {Record<string, unknown> | null} [conversationDepth]
 */
export function collapseClagToConversationBehaviorV0(clagGraph, conversationDepth = null) {
  const phase =
    clagGraph?.boundedEmergence?.temporal?.strategicFlow?.phase ||
    clagGraph?.phaseCouplingGraph?.currentPhase ||
    TEMPORAL_BEA_PHASE_V0.ACCUMULATE;
  const surprise = clagGraph?.boundedEmergence?.controlledSurpriseInjected === true;
  const feel = abstractPhaseFeelV0(phase);
  const depth = conversationDepth && typeof conversationDepth === "object" ? conversationDepth : {};
  const hints = clagGraph?.memoryShapingHints || {};
  const contamination = clagGraph?.graphContamination?.detected === true;

  const continuity01 = clamp01(
    depth.continuityStrength ??
      (hints.storyContinuityScore != null ? Number(hints.storyContinuityScore) : 0.45)
  );

  const toneStability01 = clamp01(
    contamination ? 0.72 : phase === TEMPORAL_BEA_PHASE_V0.CONSERVE ? 0.88 : 0.8
  );

  const responseContinuity01 = clamp01(
    continuity01 * 0.55 +
      (clagGraph?.interPhaseMemory?.explicitMeaningTransfer?.carriedIntoThisPhase?.length
        ? 0.15
        : 0) +
      (surprise ? 0.08 : 0.12)
  );

  const sovereignLabels = (hints.activeSovereignNodes || [])
    .map((n) => n?.label)
    .filter(Boolean)
    .slice(0, 2);

  return Object.freeze({
    rhythm: Object.freeze({
      ...feel,
      pacing: pacingFromPhaseV0(phase, surprise)
    }),
    depthMode: depth.conversationMode || "explore",
    depthLevel: depth.depthLevel ?? 2,
    continuity01,
    toneStability01,
    responseContinuity01,
    phraseChunking: depth.phraseChunking === true,
    needsRecall: depth.needsRecall === true,
    spatialGround: hints.spatialEcho || null,
    sovereignPresence: Object.freeze(sovereignLabels),
    stabilityRegime: contamination ? "guarded" : "nominal"
  });
}

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

/**
 * @param {{
 *   mode: "llm_turn"|"living_world_frame",
 *   clagGraph: Record<string, unknown>,
 *   conversationDepth?: Record<string, unknown> | null,
 *   traceId?: string | null,
 *   sessionId?: string | null,
 *   utteranceText?: string | null,
 *   utteranceRole?: "user"|"assistant",
 *   skipSpeechMeaning?: boolean
 * }} input
 */
export function publishRuntimeStabilityV0(input) {
  lastInternalClagGraphV0 = input.clagGraph;

  let conversationBehavior = collapseClagToConversationBehaviorV0(
    input.clagGraph,
    input.conversationDepth
  );

  const utteranceText = String(input.utteranceText || "").trim();
  if (utteranceText && input.skipSpeechMeaning !== true) {
    const speechMeaning = runSpeechMeaningEngineV0({
      text: utteranceText,
      conversationBehavior,
      role: input.utteranceRole,
      traceId: input.traceId ?? input.clagGraph?.traceId ?? null
    });
    conversationBehavior = mergeSpeechResonanceIntoBehaviorV0(
      conversationBehavior,
      speechMeaning
    );
  }

  const snapshot = Object.freeze({
    schema: RHIZOH_RUNTIME_STABILITY_SCHEMA_V0,
    architectureFrozen: true,
    mode: input.mode,
    traceId: input.traceId ?? input.clagGraph?.traceId ?? null,
    sessionId: input.sessionId ?? input.clagGraph?.sessionId ?? null,
    conversationBehavior,
    stability: Object.freeze({
      regime: conversationBehavior.stabilityRegime,
      sovereignCount: input.clagGraph?.activeSovereignNodeCount ?? 2,
      emergencePool01: input.clagGraph?.boundedEmergence?.temporal?.emergencePoolRemaining01 ?? null
    }),
    _internalAvailable: isRhizohStabilityVerboseV0()
  });

  lastStabilitySnapshotV0 = snapshot;

  logCastleLifecycleV0("runtime_stability", Object.freeze({
    mode: input.mode,
    traceId: snapshot.traceId,
    conversationBehavior,
    stability: snapshot.stability
  }));

  if (typeof window !== "undefined") {
    window.__CASTLE_RHIZOH_RUNTIME_STABILITY__ = snapshot;
    if (isRhizohStabilityVerboseV0()) {
      window.__CASTLE_RHIZOH_CLAG_INTERNAL__ = input.clagGraph;
    } else {
      try {
        delete window.__CASTLE_RHIZOH_CLAG__;
      } catch {
        window.__CASTLE_RHIZOH_CLAG__ = undefined;
      }
      try {
        delete window.__CASTLE_RHIZOH_CLAG_INTERNAL__;
      } catch {
        /* noop */
      }
    }
  }

  return snapshot;
}

export function getLastRuntimeStabilitySnapshotV0() {
  return lastStabilitySnapshotV0;
}

/** @internal Tests and influence firewall only. */
export function getLastInternalClagGraphForStabilityV0() {
  return lastInternalClagGraphV0;
}

export function resetRuntimeStabilityLayerV0() {
  lastInternalClagGraphV0 = null;
  lastStabilitySnapshotV0 = null;
  resetSpeechMeaningEngineV0();
  resetContinuityCacheV0();
  if (typeof window !== "undefined") {
    try {
      delete window.__CASTLE_RHIZOH_RUNTIME_STABILITY__;
      delete window.__CASTLE_RHIZOH_CLAG__;
      delete window.__CASTLE_RHIZOH_CLAG_INTERNAL__;
    } catch {
      /* noop */
    }
  }
}
