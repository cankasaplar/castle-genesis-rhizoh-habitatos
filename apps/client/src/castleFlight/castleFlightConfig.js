/**
 * Castle Flight Config
 * FIX: missing gateway proxy helpers restored for client build compatibility
 */

export function getCastleFlightConfig() {
  return {
    rhizohLlmHttp: process.env.RHIZOH_LLM_HTTP,
    rhizohLlmToken: process.env.RHIZOH_LLM_TOKEN
  };
}

/**
 * FIX: build-time compatibility shim
 * (client expects this even if gateway routing is disabled)
 */
export function shouldUseSameOriginGatewayProxyV0() {
  return false;
}

/**
 * FIX: fallback base proxy resolver
 */
export function getRhizohSameOriginGatewayProxyBaseV0() {
  return "";
}
