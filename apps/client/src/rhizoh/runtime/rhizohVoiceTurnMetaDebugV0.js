/**
 * DevTools snapshot for voice turn meta wiring (continuity vs voice memory vs habit familiarity).
 */

export const RHIZOH_VOICE_TURN_META_DEBUG_SCHEMA_V0 = "castle.rhizoh.voice_turn_meta_debug.v0";

/**
 * @param {{
 *   witnessed?: { observation?: { band?: string } } | null,
 *   band?: string | null,
 *   preCommitment?: { band?: string; memoryEligible?: boolean } | null,
 *   commitment?: { band?: string; memoryEligible?: boolean; commitment?: string } | null,
 *   turnAccepted?: boolean,
 *   turnReason?: string,
 *   source?: string,
 *   preview?: string
 * }} snap
 */
export function publishRhizohVoiceTurnMetaDebugV0(snap = {}) {
  if (typeof window === "undefined") return null;
  const witnessedBand = snap.witnessed?.observation?.band || null;
  const band = String(snap.band || witnessedBand || snap.preCommitment?.band || "").trim() || null;
  const frozen = Object.freeze({
    schema: RHIZOH_VOICE_TURN_META_DEBUG_SCHEMA_V0,
    atMs: Date.now(),
    witnessedBand,
    band,
    preCommitmentBand: snap.preCommitment?.band || null,
    preMemoryEligible: snap.preCommitment?.memoryEligible,
    commitmentBand: snap.commitment?.band || null,
    commitment: snap.commitment?.commitment || null,
    memoryEligible: snap.commitment?.memoryEligible,
    turnAccepted: snap.turnAccepted,
    turnReason: snap.turnReason || null,
    source: snap.source || null,
    preview: String(snap.preview || "").slice(0, 96)
  });
  window.__CASTLE_RHIZOH_VOICE_TURN_META__ = frozen;
  return frozen;
}
