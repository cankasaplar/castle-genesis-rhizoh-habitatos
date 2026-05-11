/**
 * OTel span attribute anahtarları — gateway `opentelemetryGateway.js` ile uyumlu.
 */
export const CASTLE_OTEL_SEMANTIC_VERSION = "enterprise-scale-v1";

export const RHIZOH_OTEL_ATTRIBUTES = Object.freeze({
  TRACE_ID: "castle.rhizoh.trace_id",
  COMPONENT: "castle.component",
  TURN_LATENCY_MS: "castle.rhizoh.turn_latency_ms",
  PIPELINE_VERSION: "castle.rhizoh.pipeline_version",
  DECISION_ACTION: "rhizoh.constitutional.decision_action",
  SHOULD_PROCEED: "rhizoh.constitutional.should_proceed"
});
