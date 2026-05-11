/**
 * Ürün oturumu — tarayıcı localStorage + continuity.meta ile Firebase uyumlu replay alanı.
 */

import { RHIZOH_CONVERSATION_PHASE } from "./rhizohConversationOrchestratorV1.js";

const LS_KEY = "rhizoh.product.session.v1";
const SCHEMA_VERSION = "1.0.0";

/**
 * @returns {{ sessionId: string, conversationPhase: string, userTurnCount: number, updatedAt: number, schemaVersion: string }}
 */
export function createInitialRhizohProductSession() {
  let sid = `rs_${Date.now().toString(36)}`;
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") sid = crypto.randomUUID();
  } catch {
    /* noop */
  }
  return {
    schemaVersion: SCHEMA_VERSION,
    sessionId: sid,
    conversationPhase: RHIZOH_CONVERSATION_PHASE.NEW_USER,
    userTurnCount: 0,
    updatedAt: Date.now()
  };
}

function normalizeSnapshot(raw) {
  if (!raw || typeof raw !== "object") return null;
  const sessionId = String(raw.sessionId || "").trim() || createInitialRhizohProductSession().sessionId;
  const conversationPhase = String(raw.conversationPhase || RHIZOH_CONVERSATION_PHASE.NEW_USER).trim();
  const userTurnCount = Math.max(0, Math.floor(Number(raw.userTurnCount) || 0));
  const updatedAt = Number.isFinite(Number(raw.updatedAt)) ? Number(raw.updatedAt) : Date.now();
  /** @type {Record<string, unknown>} */
  const out = {
    schemaVersion: SCHEMA_VERSION,
    sessionId,
    conversationPhase,
    userTurnCount,
    updatedAt
  };
  if (raw.userGoalHintBucket != null)
    out.userGoalHintBucket = String(raw.userGoalHintBucket || "").slice(0, 64);
  if (raw.userGoalHintLabel != null)
    out.userGoalHintLabel = String(raw.userGoalHintLabel || "").slice(0, 280);
  if (Array.isArray(raw.closureMilestones)) {
    out.closureMilestones = raw.closureMilestones
      .filter((m) => m && typeof m === "object")
      .slice(-12)
      .map((m) => ({
        atMs: Number.isFinite(Number(m.atMs)) ? Number(m.atMs) : 0,
        fromPhase: String(m.fromPhase || "").slice(0, 32),
        toPhase: String(m.toPhase || "").slice(0, 32),
        headline: String(m.headline || "").slice(0, 320),
        unlockedKeys: Array.isArray(m.unlockedKeys) ? m.unlockedKeys.map(String).slice(0, 24) : []
      }));
  }
  return out;
}

function pickNewer(a, b) {
  if (!a) return b;
  if (!b) return a;
  return Number(b.updatedAt || 0) >= Number(a.updatedAt || 0) ? b : a;
}

/**
 * continuity.meta içinden + localStorage birleşimi (replay / çok sekme).
 * @param {Record<string, unknown> | null | undefined} continuityMeta
 */
export function loadRhizohProductSession(continuityMeta = undefined) {
  /** @type {unknown} */
  let lsRaw = null;
  try {
    lsRaw = typeof window !== "undefined" ? window.localStorage.getItem(LS_KEY) : null;
  } catch {
    lsRaw = null;
  }
  /** @type {Record<string, unknown> | null} */
  let lsParsed = null;
  try {
    lsParsed = lsRaw ? JSON.parse(lsRaw) : null;
  } catch {
    lsParsed = null;
  }

  const fromLs = normalizeSnapshot(lsParsed);
  const metaObj =
    continuityMeta && typeof continuityMeta === "object"
      ? /** @type {Record<string, unknown>} */ (continuityMeta).rhizohProductSessionV1
      : null;
  const fromMeta = normalizeSnapshot(metaObj && typeof metaObj === "object" ? metaObj : null);

  const merged = pickNewer(fromMeta, fromLs);
  return merged || createInitialRhizohProductSession();
}

/**
 * @param {ReturnType<createInitialRhizohProductSession>} snapshot
 */
export function saveRhizohProductSession(snapshot) {
  const next = normalizeSnapshot({ ...snapshot, updatedAt: Date.now() });
  if (!next) return createInitialRhizohProductSession();
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(LS_KEY, JSON.stringify(next));
  } catch {
    /* noop */
  }
  return next;
}

/**
 * Closure milestone ekler (normalize + LS yazımı çağıran için hazır snapshot döner).
 * @param {Record<string, unknown>} snapshot
 * @param {{ atMs?: number, fromPhase?: string, toPhase?: string, headline?: string, unlockedKeys?: string[] }} entry
 */
export function appendRhizohClosureMilestone(snapshot, entry) {
  const prev = Array.isArray(snapshot.closureMilestones) ? snapshot.closureMilestones : [];
  const row = {
    atMs: Number.isFinite(Number(entry.atMs)) ? Number(entry.atMs) : Date.now(),
    fromPhase: String(entry.fromPhase || "").slice(0, 32),
    toPhase: String(entry.toPhase || "").slice(0, 32),
    headline: String(entry.headline || "").slice(0, 320),
    unlockedKeys: Array.isArray(entry.unlockedKeys) ? entry.unlockedKeys.map(String).slice(0, 24) : []
  };
  return saveRhizohProductSession({
    ...snapshot,
    closureMilestones: [...prev, row].slice(-12)
  });
}

/** Yerel gelişmiş mod kilidi (ürün kararı; kullanıcı tarayıcıda kalır). */
export function readRhizohExplicitPowerUnlock() {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem("rhizoh.capability.power_mode.v1") === "1";
  } catch {
    return false;
  }
}
