/**
 * Epistemic Council gateway stub v0 — Karpathy-style collect/rank/synthesize.
 * Observation-only; no move authority. RESEARCH-ONLY
 */

import { runCouncilAnomalyReasoningV0 } from "./rhizohEpistemicCouncilAnomalyV0.js";

export const RHIZOH_EPISTEMIC_COUNCIL_GATEWAY_SCHEMA_V0 =
  "castle.rhizoh.epistemic_council_gateway.v0";

export const COUNCIL_GATEWAY_PHASE_V0 = Object.freeze({
  COLLECT: "COLLECT",
  RANK: "RANK",
  SYNTHESIZE: "SYNTHESIZE"
});

/**
 * @param {{ fen?: string, triggers?: string[], matchId?: string|null }} payload
 */
export function buildCouncilGatewayRequestV0(payload = {}) {
  return Object.freeze({
    schema: RHIZOH_EPISTEMIC_COUNCIL_GATEWAY_SCHEMA_V0,
    fen: payload.fen || null,
    matchId: payload.matchId || null,
    triggers: Object.freeze([...(payload.triggers || [])]),
    governance: Object.freeze({
      feedsDriftDetection: false,
      feedsMoveSelection: false,
      epistemicRole: "contextual_annotation"
    }),
    phases: Object.freeze([
      COUNCIL_GATEWAY_PHASE_V0.COLLECT,
      COUNCIL_GATEWAY_PHASE_V0.RANK,
      COUNCIL_GATEWAY_PHASE_V0.SYNTHESIZE
    ]),
    atMs: Date.now()
  });
}

/**
 * @param {object} request
 */
export function runCouncilGatewayStubV0(request) {
  return runCouncilAnomalyReasoningV0({
    fen: request?.fen,
    matchId: request?.matchId,
    triggers: request?.triggers || []
  });
}
