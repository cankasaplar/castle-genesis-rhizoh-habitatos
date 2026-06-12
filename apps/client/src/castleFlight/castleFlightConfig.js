/**
 * Castle Flight Config
 * Client-safe gateway configuration layer
 */

/**
 * REQUIRED: legacy global registry compatibility
 */
export const CASTLE_FLIGHT_MANIFEST_KEYS = {
  RHIZOH_LLM_HTTP: "RHIZOH_LLM_HTTP",
  RHIZOH_LLM_TOKEN: "RHIZOH_LLM_TOKEN"
};

/**
 * Gateway config
 */
export function getCastleFlightConfig() {
  return {
    rhizohLlmHttp: process.env.RHIZOH_LLM_HTTP,
    rhizohLlmToken: process.env.RHIZOH_LLM_TOKEN
  };
}

/**
 * Legacy compatibility flag (always false in Leaflet mode)
 */
export function shouldUseSameOriginGatewayProxyV0() {
  return false;
}

/**
 * Legacy resolver fallback
 */
export function getRhizohSameOriginGatewayProxyBaseV0() {
  return "";
}
