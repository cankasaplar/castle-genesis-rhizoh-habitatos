/**
 * Single contract for world observation → gateway ingress (client + gateway SSOT shape).
 */

export const WORLD_OBSERVATION_INGRESS_ENVELOPE_SCHEMA_V1 = "castle.world_observation.ingress_envelope.v1";
export const WORLD_OBSERVATION_EVENT_SCHEMA_V0 = "castle.world_observation.v0";

const ALLOWED_TYPES = new Set(["world.tick", "agent.spoke"]);

/**
 * Stable idempotency key for POST /rhizoh/genesis/ingress
 * @param {{ type: string, atMs: number, payload?: Record<string, unknown> }} row
 */
export function buildWorldObservationIngressKeyV0(row) {
  const type = String(row?.type || "").slice(0, 64);
  const atMs = Math.floor(Number(row?.atMs) || 0);
  const p = row?.payload && typeof row.payload === "object" ? row.payload : {};
  const preview = String(p.preview || p.text || "").slice(0, 96);
  const traceId = String(p.traceId || "").slice(0, 64);
  const sim = Number(p.simTime);
  const tick = Math.floor(Number(p.clientTickCount) || 0);
  if (type === "agent.spoke") {
    return `as:${traceId || preview}:${atMs}`;
  }
  if (type === "world.tick") {
    return `wt:${tick}:${Number.isFinite(sim) ? sim.toFixed(2) : "0"}:${atMs}`;
  }
  return `${type}:${atMs}`;
}

/**
 * @param {{ type: string, atMs: number, payload?: Record<string, unknown>, ingressKey?: string }} row
 */
export function buildWorldObservationIngressEnvelopeV1(row) {
  const type = String(row?.type || "").slice(0, 64);
  if (!ALLOWED_TYPES.has(type)) {
    return { ok: false, error: "type_not_allowed" };
  }
  const atMs = Math.floor(Number(row?.atMs) || Date.now());
  const ingressKey = String(row?.ingressKey || buildWorldObservationIngressKeyV0({ type, atMs, payload: row?.payload }))
    .slice(0, 180);
  return {
    ok: true,
    envelope: Object.freeze({
      schema: WORLD_OBSERVATION_INGRESS_ENVELOPE_SCHEMA_V1,
      observationSchema: WORLD_OBSERVATION_EVENT_SCHEMA_V0,
      type,
      atMs,
      ingressKey,
      payload: row?.payload && typeof row.payload === "object" ? { ...row.payload } : {}
    })
  };
}
