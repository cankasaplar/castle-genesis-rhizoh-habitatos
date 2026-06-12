/**
 * Castle Flight Config — SINGLE SOURCE OF TRUTH
 * IMPORTANT: Do NOT split this contract across files
 */

export const CASTLE_FLIGHT_MANIFEST_KEYS = Object.freeze({
  RHIZOH_LLM_HTTP: "RHIZOH_LLM_HTTP",
  RHIZOH_LLM_TOKEN: "RHIZOH_LLM_TOKEN"
});

export function getCastleFlightConfig() {
  return Object.freeze({
    rhizohLlmHttp: process.env.RHIZOH_LLM_HTTP,
    rhizohLlmToken: process.env.RHIZOH_LLM_TOKEN
  });
}

export function shouldUseSameOriginGatewayProxyV0() {
  return false;
}

export function getRhizohSameOriginGatewayProxyBaseV0() {
  return "";
}

/**
 * IMPORTANT: compatibility export set
 * (prevents Rollup missing export graph split)
 */
export default {
  CASTLE_FLIGHT_MANIFEST_KEYS,
  getCastleFlightConfig,
  shouldUseSameOriginGatewayProxyV0,
  getRhizohSameOriginGatewayProxyBaseV0
};
