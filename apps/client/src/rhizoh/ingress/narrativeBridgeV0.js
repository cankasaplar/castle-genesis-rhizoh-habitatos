/**
 * Narrative Bridge v0 — weak relation proposal → axiom gate → ledger record.
 * Does NOT append graph edges · does NOT write causal/map/chess sources.
 */

import { getObserverTraceSnapshotV0 } from "./observerReadOnlyHookV0.js";
import { resolveNarrativeFromObserverTraceV0 } from "./narrativeProjectionEngineV0.js";
import { bridgeValidateV0, BRIDGE_VALIDATION_THRESHOLDS_V0 } from "./narrativeBridgeValidationV0.js";
import { recordMeaningResonanceV0 } from "./meaningResonanceLedgerV0.js";

export const NARRATIVE_BRIDGE_SCHEMA_V0 = "castle.rhizoh.narrative_bridge.v0";

/**
 * @param {{ from?: string, to?: string, strength?: number, locale?: string, mapEvent?: object, chessEvent?: object }} [opts]
 */
export function proposeNarrativeBridgeV0(opts = {}) {
  const observerTrace = getObserverTraceSnapshotV0();
  const entries = observerTrace?.entries || [];
  const narrative = resolveNarrativeFromObserverTraceV0({ locale: opts.locale, observerTrace });

  const mapEvent =
    opts.mapEvent ||
    [...entries].reverse().find((e) => String(e.type || "").includes("map") || e.meta?.surface === "map") ||
    null;
  const chessEvent =
    opts.chessEvent ||
    [...entries].reverse().find((e) => String(e.type || "").includes("chess") || e.meta?.surface === "chess") ||
    null;

  const primary = narrative.primaryFocus;
  const narrativeEdge = Object.freeze({
    from: opts.from || (mapEvent ? `map:${mapEvent.target}` : "map"),
    to: opts.to || (chessEvent ? `chess:${chessEvent.target}` : primary?.entityId || "narrative"),
    strength: Math.min(
      BRIDGE_VALIDATION_THRESHOLDS_V0.MAX_WEAK_RELATION_STRENGTH,
      Number(opts.strength ?? primary?.salience ?? 0.15) || 0.15
    ),
    description: primary?.description || "co-occurrence observation",
    title: primary?.title || "resonance_candidate",
    influencesCausalGraph: false,
    influencesMap: false,
    influencesChess: false,
    writesToCausalMap: false
  });

  const validation = bridgeValidateV0({
    mapEvent,
    chessEvent,
    narrativeEdge,
    observerEntries: entries
  });

  if (!validation.passed) {
    return Object.freeze({
      schema: NARRATIVE_BRIDGE_SCHEMA_V0,
      status: "rejected",
      validation,
      narrativeEdge,
      ledgerRecord: null,
      interpretationOnly: true
    });
  }

  const ledgerRecord = recordMeaningResonanceV0({
    mapSignal: mapEvent ? Object.freeze({ type: mapEvent.type, target: mapEvent.target }) : null,
    chessSignal: chessEvent ? Object.freeze({ type: chessEvent.type, target: chessEvent.target }) : null,
    narrativeRelation: Object.freeze({
      from: narrativeEdge.from,
      to: narrativeEdge.to,
      strength: validation.metrics.cappedStrength
    }),
    temporalContinuity: validation.metrics.continuity,
    patternStability: validation.metrics.invariance,
    epistemicWeight: validation.metrics.cappedStrength
  });

  return Object.freeze({
    schema: NARRATIVE_BRIDGE_SCHEMA_V0,
    status: "recorded",
    validation,
    narrativeEdge,
    ledgerRecord,
    interpretationOnly: true,
    meaningEmergesAgencyNever: true
  });
}

export function mountNarrativeBridgeConsoleV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.narrativeBridge = Object.freeze({
    propose: proposeNarrativeBridgeV0,
    validate: bridgeValidateV0
  });
}
