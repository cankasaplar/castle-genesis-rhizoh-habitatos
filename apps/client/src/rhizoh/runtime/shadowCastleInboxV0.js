/**
 * Castle Shadow Inbox v0 — C2C meaning-transfer feed (reactions, visits, chess echoes).
 * RESEARCH-ONLY · interpretive only, not execution authority.
 * @see docs/RHIZOH_SHADOW_DATA_PLANE_V0.md · docs/SESSION_GRAPH_V1.md
 */

import { SHADOW_CASTLE_REACTION_EVENT_V0 } from "./shadowDataPlaneLoopV0.js";

export const SHADOW_CASTLE_INBOX_SCHEMA_V0 = "castle.rhizoh.shadow_castle_inbox.v0";
export const SHADOW_CASTLE_INBOX_LS_KEY_V0 = "rhizoh.shadow_castle_inbox.v0";
export const SHADOW_CASTLE_INBOX_EVENT_V0 = "rhizoh:shadow-castle-inbox-v0";

const MAX_INBOX_V0 = 48;
/** @type {object[]} */
let sessionRowsV0 = [];
/** @type {Set<(snap: object) => void>} */
const listenersV0 = new Set();
/** @type {object | null} */
let cachedSnapshotV0 = null;
/** @type {string} */
let cachedSnapshotKeyV0 = "";

function invalidateInboxSnapshotCacheV0() {
  cachedSnapshotV0 = null;
  cachedSnapshotKeyV0 = "";
}

function buildInboxSnapshotKeyV0(items) {
  if (!items.length) return "0:0";
  const unread = items.filter((r) => !r.read).length;
  const ids = items.map((r) => `${r.id}:${r.read ? 1 : 0}`).join("|");
  return `${items.length}:${unread}:${ids}`;
}

function readPersistedInboxV0() {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(SHADOW_CASTLE_INBOX_LS_KEY_V0);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePersistedInboxV0(rows) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(SHADOW_CASTLE_INBOX_LS_KEY_V0, JSON.stringify(rows.slice(-MAX_INBOX_V0)));
  } catch {
    /* noop */
  }
}

function notifyInboxListenersV0() {
  invalidateInboxSnapshotCacheV0();
  const snap = getShadowCastleInboxSnapshotV0();
  for (const fn of listenersV0) {
    try {
      fn(snap);
    } catch {
      /* noop */
    }
  }
  if (typeof globalThis !== "undefined" && globalThis.dispatchEvent) {
    globalThis.dispatchEvent(new CustomEvent(SHADOW_CASTLE_INBOX_EVENT_V0, { detail: snap }));
  }
}

/**
 * @param {object} row
 */
export function appendShadowCastleInboxItemV0(row = {}) {
  const item = Object.freeze({
    schema: `${SHADOW_CASTLE_INBOX_SCHEMA_V0}.item`,
    id: String(row.id || `inbox_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`),
    kind: String(row.kind || "reaction"),
    titleTr: String(row.titleTr || row.title || "Kale sinyali"),
    titleEn: String(row.titleEn || row.title || "Castle signal"),
    bodyTr: String(row.bodyTr || row.body || ""),
    bodyEn: String(row.bodyEn || row.body || ""),
    pinId: row.pinId ? String(row.pinId) : null,
    isRealPeer: row.isRealPeer === true,
    eventType: row.eventType ? String(row.eventType) : null,
    san: row.san ? String(row.san) : null,
    read: false,
    atMs: Number(row.atMs) || Date.now()
  });
  sessionRowsV0 = [item, ...sessionRowsV0].slice(0, MAX_INBOX_V0);
  const persisted = [...sessionRowsV0, ...readPersistedInboxV0()]
    .filter((v, i, arr) => arr.findIndex((x) => x.id === v.id) === i)
    .slice(-MAX_INBOX_V0);
  writePersistedInboxV0(persisted);
  notifyInboxListenersV0();
  return item;
}

/**
 * @param {object} trace — shadow reaction trace detail
 */
export function appendShadowReactionToInboxV0(trace) {
  const reaction = trace?.reaction;
  const event = trace?.event;
  if (!reaction) return null;
  const toast = reaction.toast || {};
  const isVisit = String(event?.type || "").includes("visit");
  return appendShadowCastleInboxItemV0({
    kind: isVisit ? "visit" : String(event?.type || "reaction").split(".")[0],
    titleTr: isVisit ? "Peer ziyaret bağlantısı" : "Kale tepkisi",
    titleEn: isVisit ? "Peer visit link" : "Castle reaction",
    bodyTr: toast.tr || reaction.meaning || "",
    bodyEn: toast.en || reaction.meaning || "",
    pinId: reaction.target?.pinId || reaction.toCastleId || null,
    isRealPeer: reaction.target?.isSim === false,
    eventType: String(event?.type || ""),
    san: event?.payload?.san ? String(event.payload.san) : null,
    atMs: trace.atMs || Date.now()
  });
}

export function listShadowCastleInboxItemsV0(limit = 24) {
  const merged = [...sessionRowsV0, ...readPersistedInboxV0()];
  const seen = new Set();
  /** @type {object[]} */
  const out = [];
  for (const row of merged) {
    if (!row?.id || seen.has(row.id)) continue;
    seen.add(row.id);
    out.push(row);
    if (out.length >= limit) break;
  }
  return Object.freeze(out);
}

export function countUnreadShadowCastleInboxV0() {
  return listShadowCastleInboxItemsV0(MAX_INBOX_V0).filter((r) => !r.read).length;
}

export function markShadowCastleInboxReadV0() {
  sessionRowsV0 = sessionRowsV0.map((r) => Object.freeze({ ...r, read: true }));
  writePersistedInboxV0(sessionRowsV0.map((r) => Object.freeze({ ...r, read: true })));
  notifyInboxListenersV0();
}

export function getShadowCastleInboxSnapshotV0() {
  const items = listShadowCastleInboxItemsV0(MAX_INBOX_V0);
  const key = buildInboxSnapshotKeyV0(items);
  if (cachedSnapshotV0 && cachedSnapshotKeyV0 === key) {
    return cachedSnapshotV0;
  }
  cachedSnapshotKeyV0 = key;
  cachedSnapshotV0 = Object.freeze({
    schema: `${SHADOW_CASTLE_INBOX_SCHEMA_V0}.snapshot`,
    items,
    unreadCount: items.filter((r) => !r.read).length,
    atMs: Date.now()
  });
  return cachedSnapshotV0;
}

/**
 * @param {(snap: object) => void} fn
 */
export function subscribeShadowCastleInboxV0(fn) {
  listenersV0.add(fn);
  return () => listenersV0.delete(fn);
}

/** @type {((ev: Event) => void) | null} */
let reactionListenerV0 = null;
let inboxStartedV0 = false;

export function startShadowCastleInboxV0() {
  if (inboxStartedV0 || typeof window === "undefined") return stopShadowCastleInboxV0;
  inboxStartedV0 = true;
  reactionListenerV0 = (ev) => {
    appendShadowReactionToInboxV0(ev?.detail);
  };
  window.addEventListener(SHADOW_CASTLE_REACTION_EVENT_V0, reactionListenerV0);
  return stopShadowCastleInboxV0;
}

export function stopShadowCastleInboxV0() {
  inboxStartedV0 = false;
  if (typeof window !== "undefined" && reactionListenerV0) {
    window.removeEventListener(SHADOW_CASTLE_REACTION_EVENT_V0, reactionListenerV0);
  }
  reactionListenerV0 = null;
}

export function publishShadowCastleInboxDevtoolsV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.shadowCastleInbox = getShadowCastleInboxSnapshotV0;
  window.__rhizoh.markShadowCastleInboxReadV0 = markShadowCastleInboxReadV0;
  return getShadowCastleInboxSnapshotV0();
}

/** @internal vitest */
export function __resetShadowCastleInboxForTestV0() {
  stopShadowCastleInboxV0();
  sessionRowsV0 = [];
  listenersV0.clear();
  invalidateInboxSnapshotCacheV0();
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(SHADOW_CASTLE_INBOX_LS_KEY_V0);
    } catch {
      /* noop */
    }
  }
}
