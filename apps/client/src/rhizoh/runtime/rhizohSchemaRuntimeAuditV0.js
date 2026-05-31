/**
 * Runtime schema audit — observation only (no execution authority).
 */

/**
 * @param {Record<string, unknown>} payload
 */
export function publishRhizohSchemaRuntimeAuditV0(payload) {
  if (typeof window === "undefined") return payload;
  const row = Object.freeze({
    schema: "castle.rhizoh.schema_runtime_audit.v0",
    at: Date.now(),
    ...payload
  });
  window.__CASTLE_SCHEMA_RUNTIME_AUDIT__ = row;
  return row;
}
