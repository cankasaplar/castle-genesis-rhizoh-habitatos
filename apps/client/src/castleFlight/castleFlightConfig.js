/**
 * Castle Flight Config
 * Client-safe gateway configuration layer
 */
export const CASTLE_FLIGHT_MANIFEST_KEYS = {
  RHIZOH_LLM_HTTP: "RHIZOH_LLM_HTTP",
  RHIZOH_LLM_TOKEN: "RHIZOH_LLM_TOKEN"
};
export function getCastleFlightConfig() {
  return {
    rhizohLlmHttp: process.env.RHIZOH_LLM_HTTP,
    rhizohLlmToken: process.env.RHIZOH_LLM_TOKEN
  };
}

/**
 * Client build compatibility flag
 * (no architecture change, sadece safety shim)
 */
export function shouldUseSameOriginGatewayProxyV0() {
  return false;
}

/**
 * Same-origin gateway base resolver (fallback)
 */
export function getRhizohSameOriginGatewayProxyBaseV0() {
  return "";
}
