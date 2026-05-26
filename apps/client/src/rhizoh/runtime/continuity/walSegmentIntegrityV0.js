/**
 * WAL segment structural integrity — existence ≠ valid segment (partial crash defense).
 */

export const WAL_SEGMENT_BODY_SCHEMA_V0 = "castle.rhizoh.substrate_continuity_drain_segment.v0";

/** Observation / living-loop memory lane (does not advance sealer epoch). */
export const WAL_SEGMENT_BODY_LIVING_LOOP_SCHEMA_V0 = "castle.rhizoh.living_loop_frame.v0";

const ALLOWED_WAL_BODY_SCHEMAS_V0 = new Set([
  WAL_SEGMENT_BODY_SCHEMA_V0,
  WAL_SEGMENT_BODY_LIVING_LOOP_SCHEMA_V0,
  "castle.rhizoh.shadow_continuity_buffer.v0"
]);

/**
 * @param {unknown} segment
 */
export function validateWalSegmentIntegrityV0(segment) {
  if (!segment || typeof segment !== "object") {
    return { ok: false, code: "segment_malformed" };
  }
  const o = /** @type {Record<string, unknown>} */ (segment);
  if (typeof o.diskKey !== "string" || !o.diskKey) {
    return { ok: false, code: "segment_integrity_failed", field: "diskKey" };
  }
  if (!Number.isFinite(o.tick) || o.tick < 0) {
    return { ok: false, code: "segment_integrity_failed", field: "tick" };
  }
  if (typeof o.hash !== "string" || !o.hash) {
    return { ok: false, code: "segment_integrity_failed", field: "hash" };
  }
  if (typeof o.segmentId !== "string" || !o.segmentId) {
    return { ok: false, code: "segment_integrity_failed", field: "segmentId" };
  }
  if (o.body === null || o.body === undefined) {
    return { ok: false, code: "segment_integrity_failed", field: "body" };
  }
  if (typeof o.body !== "object") {
    return { ok: false, code: "segment_integrity_failed", field: "body" };
  }
  const body = o.body && typeof o.body === "object" ? /** @type {Record<string, unknown>} */ (o.body) : null;
  if (body && body.schema && !ALLOWED_WAL_BODY_SCHEMAS_V0.has(String(body.schema))) {
    return { ok: false, code: "segment_integrity_failed", field: "body.schema" };
  }
  return { ok: true };
}
