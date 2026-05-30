/**
 * SPECFLOW: RESEARCH-ONLY — overlap / interruption resolution (deterministic, no RNG).
 *
 * Pair with `castleMultiUserSocialRuntimeContractV0` + `socialStateAuthorityArbiterV0`:
 * USER_HARD wins first; tick drift never steals focus from an active hard window.
 */

/**
 * @param {{ userId: string, ts: number, kind?: string, priority?: number }} a
 * @param {{ userId: string, ts: number, kind?: string, priority?: number }} b
 * @returns {number}
 */
function compareSpeechEvents(a, b) {
  const dt = Number(a.ts) - Number(b.ts);
  if (dt !== 0) return dt;
  return String(a.userId || "").localeCompare(String(b.userId || ""));
}

/**
 * Simultaneous (or near-simultaneous) speech: earliest timestamp wins focus; others shadow-listen.
 *
 * @param {Array<{ userId: string, ts: number, textLen?: number }>} events
 * @returns {{
 *   focus: { userId: string, ts: number } | null,
 *   shadowListeners: Array<{ userId: string, ts: number, reason: string }>
 * }}
 */
export function resolveCastleSpeechOverlapV0(events) {
  const list = (Array.isArray(events) ? events : [])
    .map((e) => ({
      userId: String(e?.userId || "").trim(),
      ts: Math.max(0, Number(e?.ts) || 0),
      textLen: Math.max(0, Number(e?.textLen) || 0)
    }))
    .filter((e) => e.userId && Number.isFinite(e.ts));
  if (!list.length) {
    return { focus: null, shadowListeners: [] };
  }
  const sorted = [...list].sort(compareSpeechEvents);
  const [winner, ...rest] = sorted;
  return {
    focus: { userId: winner.userId, ts: winner.ts },
    shadowListeners: rest.map((r) => ({
      userId: r.userId,
      ts: r.ts,
      reason: "SIMULTANEOUS_EARLIEST_WINS"
    }))
  };
}

/**
 * True when two+ speakers share the same timestamp (collision bucket).
 *
 * @param {Array<{ userId: string, ts: number }>} events
 * @returns {boolean}
 */
export function detectCastleSimultaneousSpeechConflictV0(events) {
  const list = (Array.isArray(events) ? events : [])
    .map((e) => ({
      userId: String(e?.userId || "").trim(),
      ts: Math.max(0, Number(e?.ts) || 0)
    }))
    .filter((e) => e.userId);
  if (list.length < 2) return false;
  const byTs = new Map();
  for (const e of list) {
    byTs.set(e.ts, (byTs.get(e.ts) || 0) + 1);
  }
  for (const c of byTs.values()) {
    if (c > 1) return true;
  }
  return false;
}

/**
 * Sequential interruption: optional policy stub — Rhizoh / system barge-in uses arbitration stack elsewhere.
 *
 * @param {{
 *   currentFocus: { userId: string, sinceTs: number } | null,
 *   incoming: { userId: string, ts: number, tier: "USER_HARD"|"RHIZOH_INITIATIVE"|"TICK_DRIFT_AMBIENT" },
 *   minHoldMs?: number
 * }} input
 * @returns {{ allowed: boolean, nextFocus: { userId: string, sinceTs: number } | null, reason: string }}
 */
export function resolveCastleInterruptionRequestV0(input) {
  const tierOrder = { USER_HARD: 3, RHIZOH_INITIATIVE: 2, TICK_DRIFT_AMBIENT: 1 };
  const inc = input.incoming || {};
  const tier = String(inc.tier || "USER_HARD").toUpperCase();
  const incomingTier = tierOrder[tier] != null ? tierOrder[tier] : tierOrder.USER_HARD;
  const nowTs = Math.max(0, Number(inc.ts) || 0);
  const minHold = Math.max(0, Number(input.minHoldMs) || 0);
  const cur = input.currentFocus;
  if (!cur || !String(cur.userId || "").trim()) {
    return {
      allowed: true,
      nextFocus: { userId: String(inc.userId || "").trim(), sinceTs: nowTs },
      reason: "NO_ACTIVE_FOCUS"
    };
  }
  if (String(inc.userId || "").trim() === String(cur.userId || "").trim()) {
    return { allowed: true, nextFocus: { userId: cur.userId, sinceTs: cur.sinceTs }, reason: "SAME_SPEAKER" };
  }
  const held = nowTs - Number(cur.sinceTs || 0) < minHold;
  if (held && incomingTier < tierOrder.USER_HARD) {
    return { allowed: false, nextFocus: cur, reason: "FOCUS_MIN_HOLD" };
  }
  if (incomingTier >= tierOrder.USER_HARD) {
    return {
      allowed: true,
      nextFocus: { userId: String(inc.userId || "").trim(), sinceTs: nowTs },
      reason: "INCOMING_USER_HARD"
    };
  }
  return { allowed: false, nextFocus: cur, reason: "INCOMING_TIER_TOO_LOW" };
}

/**
 * @param {Array<{ userId: string, energy01?: number }>} userSlices
 * @returns {number}
 */
export function blendCastlePresenceEnergy01V0(userSlices) {
  const rows = Array.isArray(userSlices) ? userSlices : [];
  if (!rows.length) return 0;
  let sum = 0;
  let n = 0;
  for (const r of rows) {
    const e = Number(r?.energy01);
    if (Number.isFinite(e)) {
      sum += Math.min(1, Math.max(0, e));
      n += 1;
    }
  }
  if (!n) return 0;
  return Math.round((sum / n) * 1000) / 1000;
}
