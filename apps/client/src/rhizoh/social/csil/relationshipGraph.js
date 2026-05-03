/**
 * Familiarity ladder — görülen → tanışılan → bilinen → güven → bağ.
 */

export const REL_STAGE = Object.freeze({
  UNKNOWN: "unknown",
  SEEN: "seen",
  INTRODUCED: "introduced",
  KNOWN: "known",
  TRUSTED: "trusted",
  BONDED: "bonded"
});

/** @param {number} x */
function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x) || 0));
}

/**
 * @param {string} stage
 */
function stageRank(stage) {
  const o = {
    [REL_STAGE.UNKNOWN]: 0,
    [REL_STAGE.SEEN]: 1,
    [REL_STAGE.INTRODUCED]: 2,
    [REL_STAGE.KNOWN]: 3,
    [REL_STAGE.TRUSTED]: 4,
    [REL_STAGE.BONDED]: 5
  };
  return o[String(stage)] ?? 0;
}

/**
 * @param {string} a
 * @param {string} b
 */
function maxStage(a, b) {
  return stageRank(a) >= stageRank(b) ? a : b;
}

/**
 * @param {{
 *   stage?: string,
 *   familiarity?: number,
 *   trust?: number,
 *   userMessageCount?: number,
 *   introduced?: boolean,
 *   displayName?: string
 * }} prev
 * @param {{
 *   trust?: number,
 *   familiarity?: number,
 *   introduced?: boolean,
 *   displayName?: string,
 *   incrementMessages?: boolean
 * }} delta
 */
export function advanceRelationshipRecord(prev, delta) {
  const p = prev && typeof prev === "object" ? prev : {};
  const d = delta && typeof delta === "object" ? delta : {};
  let stage = String(p.stage || REL_STAGE.UNKNOWN);
  const trust = clamp01(d.trust != null ? d.trust : p.trust);
  const familiarity = clamp01(d.familiarity != null ? d.familiarity : p.familiarity);
  let userMessageCount = Math.max(0, Number(p.userMessageCount) || 0);
  if (d.incrementMessages) userMessageCount += 1;

  const introduced = !!(d.introduced != null ? d.introduced : p.introduced);
  const displayName = String(d.displayName != null ? d.displayName : p.displayName || "").trim();

  if (userMessageCount >= 2) stage = maxStage(stage, REL_STAGE.SEEN);
  if (introduced || displayName.length > 0) stage = maxStage(stage, REL_STAGE.INTRODUCED);
  if (familiarity >= 0.35 || trust >= 0.28) stage = maxStage(stage, REL_STAGE.KNOWN);
  if (trust >= 0.62) stage = maxStage(stage, REL_STAGE.TRUSTED);
  if (trust >= 0.82 && familiarity >= 0.72) stage = maxStage(stage, REL_STAGE.BONDED);

  return {
    stage,
    familiarity: Math.round(familiarity * 1000) / 1000,
    trust: Math.round(trust * 1000) / 1000,
    userMessageCount,
    introduced: introduced || displayName.length > 0,
    displayName: displayName || undefined
  };
}
