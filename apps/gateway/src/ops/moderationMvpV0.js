/**
 * Moderation MVP v0 — abuse report, soft block, prompt abuse heuristics, admin queue.
 */
import { randomUUID } from "node:crypto";

const PROMPT_ABUSE_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /jailbreak/i,
  /dan\s+mode/i,
  /system\s+prompt\s+leak/i,
  /bypass\s+(safety|filter|moderation)/i,
  /pretend\s+you\s+are\s+not/i
];

/** @type {Record<string, unknown>[]} */
const reportQueue = [];
/** @type {Set<string>} */
const softBlocked = new Set();

export function resetModerationMvpV0() {
  reportQueue.length = 0;
  softBlocked.clear();
}

/**
 * @param {string} text
 */
export function detectPromptAbuseV0(text) {
  const t = String(text || "");
  const reasons = [];
  for (const re of PROMPT_ABUSE_PATTERNS) {
    if (re.test(t)) reasons.push(re.source.slice(0, 48));
  }
  return { flagged: reasons.length > 0, reasons };
}

/**
 * @param {string} uid
 */
export function isSoftBlockedV0(uid) {
  return softBlocked.has(String(uid || ""));
}

/**
 * @param {string} uid
 * @param {string} [reason]
 */
export function softBlockUserV0(uid, reason = "") {
  const id = String(uid || "").trim();
  if (!id) return { ok: false, error: "uid_required" };
  softBlocked.add(id);
  return { ok: true, uid: id, reason: String(reason || "").slice(0, 500) };
}

/**
 * @param {string} uid
 */
export function removeSoftBlockV0(uid) {
  softBlocked.delete(String(uid || ""));
  return { ok: true };
}

/**
 * @param {{
 *   reporterUid?: string | null,
 *   targetUid?: string | null,
 *   category?: string,
 *   detail?: string,
 *   traceId?: string | null
 * }} report
 */
export function submitAbuseReportV0(report) {
  const entry = Object.freeze({
    id: randomUUID(),
    atMs: Date.now(),
    reporterUid: report.reporterUid ?? null,
    targetUid: report.targetUid ?? null,
    category: String(report.category || "general").slice(0, 64),
    detail: String(report.detail || "").slice(0, 2000),
    traceId: report.traceId ?? null,
    status: "pending"
  });
  reportQueue.push(entry);
  while (reportQueue.length > 500) reportQueue.shift();
  return entry;
}

/** @param {number} [limit] */
export function listModerationQueueV0(limit = 50) {
  const n = Math.max(1, Math.min(500, Math.floor(Number(limit) || 50)));
  return reportQueue.slice(-n).reverse();
}

export function listSoftBlockedUsersV0() {
  return [...softBlocked];
}
