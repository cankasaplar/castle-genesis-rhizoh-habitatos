/**
 * HTTP handler — POST /rhizoh/council/anomaly-reasoning
 */

import { runCouncilAnomalyReasoningV0 } from "./rhizohEpistemicCouncilAnomalyV0.js";
import { buildCouncilGatewayRequestV0 } from "./rhizohEpistemicCouncilGatewayV0.js";

/**
 * @param {object} body
 */
export function handleCouncilAnomalyReasoningPostV0(body = {}) {
  const gatewayRequest = buildCouncilGatewayRequestV0({
    fen: body.fen,
    matchId: body.matchId,
    triggers: body.triggers
  });

  const result = runCouncilAnomalyReasoningV0({
    ...gatewayRequest,
    slotId: body.slotId ?? null,
    stressRunId: body.stressRunId || null,
    conflictGraph: body.conflictGraph || null,
    memoryGraph: body.memoryGraph || null,
    sessionId: body.sessionId || null
  });

  return Object.freeze({ status: 200, body: result });
}
