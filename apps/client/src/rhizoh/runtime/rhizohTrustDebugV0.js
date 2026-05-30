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

function roundMetricV0(n, digits = 3) {
  const x = Number(n);
  if (!Number.isFinite(x)) return null;
  const m = 10 ** digits;
  return Math.round(x * m) / m;
}

/**
 * Enriched payload for [CASTLE_continuity_saved] — always logged (not gated on trustDebug flag).
 * @param {{
 *   phase?: string,
 *   traceId?: string,
 *   rhizohProductSnap?: { userTurnCount?: number, conversationPhase?: string },
 *   turnAcceptance?: { accepted?: boolean, reason?: string, confidence?: number },
 *   bondGovernance01?: number,
 *   relPhase?: { trust?: number, familiarity?: number },
 *   tuning?: { trustBondForNormal?: number, trustTurnsForNormal?: number },
 *   voiceTurnMeta?: { confidence?: number, source?: string } | null,
 *   phaseExit?: ReturnType<import("../product/rhizohConversationOrchestratorV1.js").describeRhizohPhaseExitProgressV0>,
 *   fallback?: boolean
 * }} ctx
 */
export function buildRhizohContinuityHealthDetailV0(ctx = {}) {
  const snap = ctx.rhizohProductSnap && typeof ctx.rhizohProductSnap === "object" ? ctx.rhizohProductSnap : {};
  const turn = ctx.turnAcceptance && typeof ctx.turnAcceptance === "object" ? ctx.turnAcceptance : {};
  const rel = ctx.relPhase && typeof ctx.relPhase === "object" ? ctx.relPhase : {};
  const tuning = ctx.tuning && typeof ctx.tuning === "object" ? ctx.tuning : {};
  const accepted = turn.accepted === true;
  const baseTurns = Math.max(0, Math.floor(Number(snap.userTurnCount) || 0));
  const turns = accepted ? baseTurns + 1 : baseTurns;
  const trust = roundMetricV0(rel.trust);
  const familiarity = roundMetricV0(rel.familiarity);
  const bond = roundMetricV0(ctx.bondGovernance01);
  const voiceConf = turn.confidence ?? ctx.voiceTurnMeta?.confidence;
  const voiceConfidence =
    voiceConf == null || !Number.isFinite(Number(voiceConf)) ? null : roundMetricV0(voiceConf, 2);

  const detail = {
    phase: String(ctx.phase || snap.conversationPhase || "?"),
    traceId: ctx.traceId ? String(ctx.traceId) : undefined,
    turns,
    turnsTarget: Math.max(1, Math.floor(Number(tuning.trustTurnsForNormal) || 12)),
    bond,
    bondTarget: roundMetricV0(tuning.trustBondForNormal ?? 0.34, 2),
    trust,
    familiarity,
    identityTrust: trust,
    voiceConfidence,
    voiceSource: ctx.voiceTurnMeta?.source ? String(ctx.voiceTurnMeta.source) : "text",
    turnAccepted: accepted,
    turnReason: turn.reason ? String(turn.reason) : undefined
  };

  if (ctx.phaseExit && typeof ctx.phaseExit === "object") {
    detail.phaseExit = ctx.phaseExit;
  }
  if (ctx.fallback === true) detail.fallback = true;

  return Object.freeze(detail);
}
