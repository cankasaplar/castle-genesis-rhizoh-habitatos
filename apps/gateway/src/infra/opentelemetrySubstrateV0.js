/**
 * Lightweight OTEL attributes for substrate events (when CASTLE_OTEL_ENABLED=1).
 */

import { getCastleGatewayTracer } from "./opentelemetryGateway.js";

let initialized = process.env.CASTLE_OTEL_ENABLED === "1";

/**
 * @param {string} name
 * @param {Record<string, string | number | boolean>} attrs
 */
export function recordSubstrateOtelEventV0(name, attrs = {}) {
  if (!initialized) return;
  try {
    const tracer = getCastleGatewayTracer();
    const span = tracer.startSpan(`substrate.${name}`);
    for (const [k, v] of Object.entries(attrs)) {
      span.setAttribute(`castle.substrate.${k}`, v);
    }
    span.end();
  } catch {
    /* noop */
  }
}
