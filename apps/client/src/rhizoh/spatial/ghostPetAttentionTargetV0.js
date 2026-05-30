/**
 * SPECFLOW: RESEARCH-ONLY — **Ghost pet attention targeting** (kim kime bakıyor).
 * Konum verisi olmadan sembolik yaw ofseti + hedef UID’ler; studio mesh gerçek dünya açısını sonra bağlar.
 */

export const GHOST_PET_ATTENTION_TARGET_SCHEMA_V0 = "castle.rhizoh.ghost_pet_attention_target.v0";

/** @param {string} uid */
function pseudoYawFromUid(uid) {
  const s = String(uid || "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  const t = (Math.abs(h) % 1000) / 1000;
  return Math.round((t - 0.5) * 0.74 * 1000) / 1000;
}

/**
 * @param {Record<string, unknown>|null|undefined} llmSnapshot
 * @param {{
 *   operatorUserId?: string|null,
 *   focusUserId?: string|null,
 *   recentJoinerUserId?: string|null
 * }|null|undefined} opts
 */
export function resolveGhostPetAttentionTargetV0(llmSnapshot, opts) {
  const s = llmSnapshot && typeof llmSnapshot === "object" ? llmSnapshot : {};
  const o = opts && typeof opts === "object" ? opts : {};

  const op = String(o.operatorUserId || "").trim();
  const focus = String(o.focusUserId || "").trim();
  const recent = String(o.recentJoinerUserId || "").trim();

  const peers = Array.isArray(s.castlePeersHead) ? /** @type {unknown[]} */ (s.castlePeersHead) : [];
  const peerIds = peers
    .map((p) => {
      const row = p && typeof p === "object" ? p : {};
      return String(row.id || row.userId || "").trim();
    })
    .filter(Boolean);

  const role = String(s.rhizohCastleRuntimeRole || "").toUpperCase().trim();
  const sf = s.socialFocus && typeof s.socialFocus === "object" ? s.socialFocus : {};
  const focusFromCsil = String(sf.userId || "").trim();
  const effectiveFocus = focus || focusFromCsil;

  if (recent && op && recent !== op) {
    return {
      schema: GHOST_PET_ATTENTION_TARGET_SCHEMA_V0,
      mode: "NEW_JOINER",
      primaryUid: recent,
      secondaryUid: op || null,
      blend01: 0.86,
      yawOffsetRad: pseudoYawFromUid(recent)
    };
  }

  const interpreterish = role === "INTERPRETER" || role.includes("INTERPRET");
  if (interpreterish && op) {
    const other = peerIds.find((id) => id && id !== op) || (effectiveFocus && effectiveFocus !== op ? effectiveFocus : "");
    if (other && other !== op) {
      return {
        schema: GHOST_PET_ATTENTION_TARGET_SCHEMA_V0,
        mode: "INTERPRETER_SPLIT",
        primaryUid: op,
        secondaryUid: other,
        blend01: 0.72,
        yawOffsetRad: 0
      };
    }
  }

  if (effectiveFocus && op && effectiveFocus !== op) {
    return {
      schema: GHOST_PET_ATTENTION_TARGET_SCHEMA_V0,
      mode: "ACTIVE_SPEAKER",
      primaryUid: effectiveFocus,
      secondaryUid: op,
      blend01: 0.78,
      yawOffsetRad: pseudoYawFromUid(effectiveFocus)
    };
  }

  if (effectiveFocus && op && effectiveFocus === op) {
    return {
      schema: GHOST_PET_ATTENTION_TARGET_SCHEMA_V0,
      mode: "OWNER_PROXIMITY",
      primaryUid: op,
      secondaryUid: null,
      blend01: 0.9,
      yawOffsetRad: 0
    };
  }

  return {
    schema: GHOST_PET_ATTENTION_TARGET_SCHEMA_V0,
    mode: "NEUTRAL_ORBIT",
    primaryUid: op || peerIds[0] || null,
    secondaryUid: null,
    blend01: 0.48,
    yawOffsetRad: 0
  };
}
