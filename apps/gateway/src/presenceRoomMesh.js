/**
 * In-memory presence room mesh (C — minimum). Transport: HTTP + SSE first; WS later.
 * Payload shape aligns with client kernel deltas: `{ node?, projectionPatch?, seq, roomUid }`.
 */

function roomMap() {
  /** @type {Map<string, { seq: number, log: Array<{ seq: number, node: unknown, projectionPatch: unknown, roomUid: string, clientUid: string, ts: number, nodeId?: string }>, members: Map<string, number>, listeners: Set<(chunk: string) => void> }>} */
  if (!globalThis.__CASTLE_PRESENCE_MESH_ROOMS__) {
    globalThis.__CASTLE_PRESENCE_MESH_ROOMS__ = new Map();
  }
  return globalThis.__CASTLE_PRESENCE_MESH_ROOMS__;
}

function getRoom(roomUid) {
  const m = roomMap();
  let r = m.get(roomUid);
  if (!r) {
    r = { seq: 0, log: [], members: new Map(), listeners: new Set() };
    m.set(roomUid, r);
  }
  return r;
}

function broadcast(r, obj) {
  const line = `data: ${JSON.stringify(obj)}\n\n`;
  for (const fn of r.listeners) {
    try {
      fn(line);
    } catch {
      /* ignore broken SSE */
    }
  }
}

export function meshJoin(roomUid, clientUid) {
  const r = getRoom(roomUid);
  r.members.set(clientUid, Date.now());
  broadcast(r, { type: "member_join", roomUid, clientUid, seq: r.seq });
}

export function meshLeave(roomUid, clientUid) {
  const m = roomMap();
  const r = m.get(roomUid);
  if (!r) return;
  r.members.delete(clientUid);
  broadcast(r, { type: "member_leave", roomUid, clientUid, seq: r.seq });
  if (r.members.size === 0 && r.listeners.size === 0) {
    m.delete(roomUid);
  }
}

/**
 * @param {string} roomUid
 * @param {string} clientUid
 * @param {{ node?: unknown, projectionPatch?: unknown, writerSubject?: unknown }} body
 * @returns {number} seq
 */
export function meshAppendDelta(roomUid, clientUid, body) {
  const r = getRoom(roomUid);
  r.seq += 1;
  const node = body?.node ?? null;
  const projectionPatch = body?.projectionPatch ?? null;
  const writerSubject =
    body?.writerSubject != null && String(body.writerSubject).trim()
      ? String(body.writerSubject).trim().slice(0, 200)
      : "";
  let nodeId;
  if (node && typeof node === "object" && node.id != null) nodeId = String(node.id);
  const serverAt = Date.now();
  const entry = {
    seq: r.seq,
    node,
    projectionPatch,
    roomUid,
    clientUid,
    ts: serverAt,
    ...(nodeId ? { nodeId } : {}),
    ...(writerSubject ? { writerSubject } : {})
  };
  r.log.push(entry);
  if (r.log.length > 4000) r.log.splice(0, r.log.length - 4000);
  broadcast(r, {
    type: "delta",
    roomUid,
    seq: r.seq,
    node,
    projectionPatch,
    clientUid,
    serverAt,
    writerSubject: writerSubject || null
  });
  return r.seq;
}

export function meshSnapshot(roomUid) {
  const r = roomMap().get(roomUid);
  if (!r) return { ok: true, roomUid, seq: 0, members: [], tail: [] };
  return {
    ok: true,
    roomUid,
    seq: r.seq,
    members: [...r.members.keys()],
    tail: r.log.slice(-400)
  };
}

/** @param {string} roomUid @param {string} fromNodeId */
export function meshReplayFromNodeId(roomUid, fromNodeId) {
  const r = roomMap().get(roomUid);
  if (!r) return { ok: true, roomUid, entries: [] };
  if (!fromNodeId) return { ok: true, roomUid, entries: r.log.slice() };
  const id = String(fromNodeId);
  const idx = r.log.findIndex((e) => e.nodeId === id);
  const entries = idx >= 0 ? r.log.slice(idx) : r.log.slice();
  return { ok: true, roomUid, entries };
}

/** @param {string} roomUid @param {number} fromSeq */
export function meshReplayFromSeq(roomUid, fromSeq) {
  const r = roomMap().get(roomUid);
  if (!r) return { ok: true, roomUid, entries: [] };
  const fs = Number(fromSeq);
  if (!Number.isFinite(fs)) return { ok: true, roomUid, entries: r.log.slice() };
  return { ok: true, roomUid, entries: r.log.filter((e) => e.seq >= fs) };
}

/**
 * @param {string} roomUid
 * @param {(chunk: string) => void} onWrite
 * @returns {() => void} unsubscribe
 */
export function meshSubscribeSse(roomUid, onWrite) {
  const r = getRoom(roomUid);
  r.listeners.add(onWrite);
  onWrite(`data: ${JSON.stringify({ type: "hello", roomUid, seq: r.seq })}\n\n`);
  return () => {
    r.listeners.delete(onWrite);
    if (r.members.size === 0 && r.listeners.size === 0) roomMap().delete(roomUid);
  };
}

/** Aggregate presence mesh stats for read-only observability (no PII beyond opaque client Uids). */
export function meshContinuityAggregate() {
  const m = roomMap();
  let roomCount = 0;
  let maxSeq = 0;
  let logTailEntries = 0;
  let sseListenerCount = 0;
  const uniqueClientUids = new Set();
  for (const r of m.values()) {
    roomCount += 1;
    if (r.seq > maxSeq) maxSeq = r.seq;
    logTailEntries += r.log.length;
    sseListenerCount += r.listeners.size;
    for (const uid of r.members.keys()) uniqueClientUids.add(uid);
  }
  return {
    roomCount,
    uniqueClientUids: uniqueClientUids.size,
    maxSeqAcrossRooms: maxSeq,
    appendOnlyLogEntries: logTailEntries,
    sseListenerCount
  };
}
