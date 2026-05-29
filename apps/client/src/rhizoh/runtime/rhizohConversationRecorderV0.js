/**
 * RhizohConversationRecorder v0 — dev-only surface (§17.10–17.12 RHIZOH_GOVERNANCE_MIDDLEWARE_V1).
 * Temporal state compiler: observe + group; no control, no core mutation.
 * Same debug gate as authority witness unless only recorder needed — uses WITNESS flag for one-switch dev UX.
 */

import { isCastleDebugGranularFlagEnabled } from "./castleDebugGateV0.js";

const FLAG = "VITE_RHIZOH_AUTHORITY_WITNESS_DEBUG";

const MAX_SESSIONS = 12;
const MAX_TURNS_PER_SESSION = 48;
const MAX_WITNESS_PER_TURN = 48;

/** @type {Map<string, { sessionId: string, turns: object[], updatedAt: number }>} */
const sessions = new Map();
/** @type {Map<string, { sessionId: string, turnIndex: number }>} */
const activeTurnByTrace = new Map();

let devApiInstalled = false;

function ensureDevApi() {
  if (devApiInstalled || typeof window === "undefined") return;
  devApiInstalled = true;
  try {
    window.__RHIZOH_CONVERSATION_RECORDER__ = {
      exportJson: (sessionId) => rhizohConversationRecorderExportJsonV0(sessionId),
      exportAll: () => rhizohConversationRecorderExportJsonV0(),
      clear: () => rhizohConversationRecorderClearV0()
    };
  } catch {
    /* noop */
  }
}

function pruneSessions() {
  while (sessions.size > MAX_SESSIONS) {
    let oldestKey = "";
    let oldestTs = Infinity;
    for (const [k, v] of sessions.entries()) {
      const t = Number(v.updatedAt) || 0;
      if (t < oldestTs) {
        oldestTs = t;
        oldestKey = k;
      }
    }
    if (!oldestKey) break;
    const s = sessions.get(oldestKey);
    if (s && Array.isArray(s.turns)) {
      for (const t of s.turns) {
        const tid = t && typeof t === "object" ? String(t.authorityTraceId || "").trim() : "";
        if (tid) activeTurnByTrace.delete(tid);
      }
    }
    sessions.delete(oldestKey);
  }
}

/**
 * @param {{ sessionId: string, authorityTraceId: string, phase?: string, userInput?: string }} ctx
 */
export function rhizohConversationRecorderBeginTurnV0(ctx) {
  if (!isCastleDebugGranularFlagEnabled(FLAG)) return;
  ensureDevApi();
  const sessionId = String(ctx.sessionId || "unknown").slice(0, 128);
  const authorityTraceId = String(ctx.authorityTraceId || "").trim();
  if (!authorityTraceId) return;
  if (activeTurnByTrace.has(authorityTraceId)) return;

  let s = sessions.get(sessionId);
  if (!s) {
    s = { sessionId, turns: [], updatedAt: Date.now() };
    sessions.set(sessionId, s);
    pruneSessions();
  }
  if (s.turns.length >= MAX_TURNS_PER_SESSION) {
    const dropped = s.turns.shift();
    const d = dropped && typeof dropped === "object" ? String(dropped.authorityTraceId || "").trim() : "";
    if (d) activeTurnByTrace.delete(d);
  }
  const turn = {
    schemaVersion: "rhizoh.conversation_turn.v0",
    authorityTraceId,
    phaseAtStart: String(ctx.phase || "").slice(0, 32),
    userInput: String(ctx.userInput || "").slice(0, 800),
    witnessEvents: [],
    rhizohOutput: null,
    source: null,
    gatewayTraceId: null,
    timestamps: { startedAt: Date.now(), closedAt: null }
  };
  const turnIndex = s.turns.length;
  s.turns.push(turn);
  s.updatedAt = Date.now();
  activeTurnByTrace.set(authorityTraceId, { sessionId, turnIndex });
}

/**
 * @param {Record<string, unknown>} payload — same shape as witness console payload
 */
export function rhizohConversationRecorderAppendWitnessV0(payload) {
  if (!isCastleDebugGranularFlagEnabled(FLAG)) return;
  const tid = String(payload.traceId || "").trim();
  if (!tid) return;
  const ref = activeTurnByTrace.get(tid);
  if (!ref) return;
  const s = sessions.get(ref.sessionId);
  if (!s || !Array.isArray(s.turns)) return;
  const turn = s.turns[ref.turnIndex];
  if (!turn || String(turn.authorityTraceId) !== tid) return;
  if (turn.witnessEvents.length >= MAX_WITNESS_PER_TURN) return;
  const snap = { ...payload };
  turn.witnessEvents.push(snap);
  s.updatedAt = Date.now();
}

/**
 * @param {{ authorityTraceId: string, rhizohOutput?: string, source?: string, gatewayTraceId?: string }} ctx
 */
export function rhizohConversationRecorderEndTurnV0(ctx) {
  if (!isCastleDebugGranularFlagEnabled(FLAG)) return;
  const authorityTraceId = String(ctx.authorityTraceId || "").trim();
  if (!authorityTraceId) return;
  const ref = activeTurnByTrace.get(authorityTraceId);
  if (!ref) return;
  const s = sessions.get(ref.sessionId);
  if (!s || !Array.isArray(s.turns)) {
    activeTurnByTrace.delete(authorityTraceId);
    return;
  }
  const turn = s.turns[ref.turnIndex];
  if (!turn || String(turn.authorityTraceId) !== authorityTraceId) {
    activeTurnByTrace.delete(authorityTraceId);
    return;
  }
  turn.rhizohOutput = String(ctx.rhizohOutput || "").slice(0, 4000);
  turn.source = String(ctx.source || "").slice(0, 64);
  turn.gatewayTraceId = String(ctx.gatewayTraceId || "").slice(0, 256);
  turn.timestamps.closedAt = Date.now();
  s.updatedAt = Date.now();
  activeTurnByTrace.delete(authorityTraceId);
}

/**
 * @param {string | null | undefined} sessionId
 * @returns {string|null}
 */
export function rhizohConversationRecorderExportJsonV0(sessionId = null) {
  if (!isCastleDebugGranularFlagEnabled(FLAG)) return null;
  try {
    if (sessionId != null && String(sessionId).trim()) {
      const sid = String(sessionId).trim();
      const s = sessions.get(sid);
      return s ? JSON.stringify({ exportedAt: Date.now(), session: s }, null, 0) : null;
    }
    const all = [];
    for (const s of sessions.values()) {
      all.push(s);
    }
    return JSON.stringify({ exportedAt: Date.now(), schemaVersion: "rhizoh.conversation_recorder_export.v0", sessions: all }, null, 0);
  } catch {
    return null;
  }
}

export function rhizohConversationRecorderClearV0() {
  sessions.clear();
  activeTurnByTrace.clear();
}
