/**
 * Rhizoh trust debug — read-only ops overlay (no execution authority).
 * Enable: window.__rhizoh.trustDebug = true  OR  localStorage rhizoh.trust_debug.v1 = "1"
 */

export const RHIZOH_TRUST_DEBUG_SCHEMA = "castle.rhizoh.trust_debug.v0";

export function isRhizohTrustDebugEnabledV0() {
  if (typeof window === "undefined") return false;
  if (window.__rhizoh?.trustDebug === true) return true;
  try {
    return window.localStorage.getItem("rhizoh.trust_debug.v1") === "1";
  } catch {
    return false;
  }
}

/**
 * @param {{
 *   phase?: string,
 *   turns?: number,
 *   turnsTarget?: number,
 *   bond?: number,
 *   bondTarget?: number,
 *   trust?: number,
 *   familiarity?: number,
 *   voiceConfidence?: number | null,
 *   voiceSource?: string,
 *   turnAccepted?: boolean,
 *   turnReason?: string
 * }} snap
 */
export function formatRhizohTrustDebugLineV0(snap = {}) {
  const phase = String(snap.phase || "?");
  const turns = Math.max(0, Math.floor(Number(snap.turns) || 0));
  const turnsTarget = Math.max(1, Math.floor(Number(snap.turnsTarget) || 12));
  const bond = Number(snap.bond);
  const bondTarget = Number(snap.bondTarget);
  const trust = Number(snap.trust);
  const voice =
    snap.voiceConfidence == null || !Number.isFinite(Number(snap.voiceConfidence))
      ? "—"
      : Number(snap.voiceConfidence).toFixed(2);
  const accept = snap.turnAccepted === true ? "yes" : snap.turnAccepted === false ? "no" : "—";
  const bondStr = Number.isFinite(bond)
    ? `${bond.toFixed(2)}/${Number.isFinite(bondTarget) ? bondTarget.toFixed(2) : "?"}`
    : "—/?";
  return `[TRUST_DEBUG] phase=${phase} turns=${turns}/${turnsTarget} bond=${bondStr} trust=${Number.isFinite(trust) ? trust.toFixed(2) : "—"} voice=${voice} turnAccepted=${accept}${snap.turnReason ? ` reason=${snap.turnReason}` : ""}`;
}

/**
 * @param {Parameters<typeof formatRhizohTrustDebugLineV0>[0]} snap
 */
export function publishRhizohTrustDebugV0(snap = {}) {
  if (!isRhizohTrustDebugEnabledV0()) return null;
  const payload = Object.freeze({
    schema: RHIZOH_TRUST_DEBUG_SCHEMA,
    atMs: Date.now(),
    ...snap
  });
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.trustDebugSnapshot = payload;
  }
  console.info(formatRhizohTrustDebugLineV0(snap));
  return payload;
}
