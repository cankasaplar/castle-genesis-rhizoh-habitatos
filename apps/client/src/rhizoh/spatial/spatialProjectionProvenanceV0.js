/**
 * PR-4-C — Deterministic projection event provenance (replay / “why did the room change?”).
 * SPECFLOW: **RESEARCH-ONLY**
 */

const SCHEMA = "spatialProjectionEvent.v0";

function djb2Hex(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/**
 * @param {{ effectKind: string, atMs: number, cueFingerprint: string, lane?: string }} io
 */
export function deriveProjectionEventIdV0(io) {
  const basis = `${io.effectKind}|${io.atMs}|${String(io.cueFingerprint ?? "")}|${String(io.lane ?? "")}`;
  return `proj_evt_${djb2Hex(basis)}`;
}

/**
 * @param {{
 *   effectKind: string,
 *   atMs: number,
 *   cueFingerprint: string,
 *   lane?: string,
 *   sourceRuntime?: string
 * }} io
 */
export function buildProjectionEventEnvelopeV0(io) {
  const eventId = deriveProjectionEventIdV0(io);
  return Object.freeze({
    schema: SCHEMA,
    eventId,
    atMs: typeof io.atMs === "number" && Number.isFinite(io.atMs) ? io.atMs : 0,
    effectKind: String(io.effectKind || ""),
    cueFingerprint: String(io.cueFingerprint || ""),
    lane: io.lane != null ? String(io.lane) : undefined,
    provenanceSource: String(io.sourceRuntime || "projection_runtime")
  });
}
