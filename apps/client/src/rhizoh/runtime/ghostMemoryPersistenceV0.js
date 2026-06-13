/**
 * Ghost Memory Persistence v0 — relationships, episodic memories, preferences.
 */

export const GHOST_MEMORY_PERSISTENCE_SCHEMA_V0 = "castle.ghost_memory.v0";
export const GHOST_MEMORY_LS_KEY_V0 = "rhizoh_ghost_memory_v0";
export const GHOST_MEMORY_EVENT_V0 = "rhizoh:ghost-memory-v0";

const MAX_RELATIONSHIPS = 64;
const MAX_MEMORIES = 256;
const MAX_PREFERENCES = 32;

function nowIso() {
  return new Date().toISOString();
}

function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function readRawV0() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(GHOST_MEMORY_LS_KEY_V0);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return {
        schema: GHOST_MEMORY_PERSISTENCE_SCHEMA_V0,
        ghostId: "ghost_default",
        relationships: [],
        memories: parsed.slice(0, MAX_MEMORIES),
        preferences: []
      };
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeRawV0(row) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GHOST_MEMORY_LS_KEY_V0, JSON.stringify(row));
  try {
    window.dispatchEvent(
      new CustomEvent(GHOST_MEMORY_EVENT_V0, {
        detail: Object.freeze({ ghostId: row.ghostId, memoryCount: row.memories?.length || 0 })
      })
    );
  } catch {
    /* noop */
  }
}

/**
 * @param {{ ghostId?: string }} opts
 */
export function ensureGhostMemoryV0(opts = {}) {
  const ghostId = String(opts.ghostId || "ghost_default").slice(0, 64);
  const existing = readRawV0();
  if (existing?.ghostId === ghostId) return Object.freeze({ ...existing });

  const created = Object.freeze({
    schema: GHOST_MEMORY_PERSISTENCE_SCHEMA_V0,
    id: ghostId,
    ghostId,
    relationships: [],
    memories: [],
    preferences: Object.freeze([
      Object.freeze({ key: "tone", value: "calm" }),
      Object.freeze({ key: "language", value: "auto" })
    ]),
    updatedAt: nowIso()
  });
  writeRawV0(created);
  return created;
}

export function readGhostMemoryV0() {
  const row = readRawV0();
  return row ? Object.freeze({ ...row }) : null;
}

/**
 * @param {{ peerCastleId: string, kind?: string, note?: string }} rel
 */
export function addGhostRelationshipV0(rel = {}) {
  const ghost = ensureGhostMemoryV0({ ghostId: rel.ghostId });
  const peerCastleId = String(rel.peerCastleId || "").trim();
  if (!peerCastleId) return ghost;
  const relationships = [...(ghost.relationships || [])];
  const idx = relationships.findIndex((r) => r.peerCastleId === peerCastleId);
  const row = Object.freeze({
    peerCastleId,
    kind: String(rel.kind || "acquaintance").slice(0, 32),
    since: relationships[idx]?.since || nowIso(),
    note: String(rel.note || "").slice(0, 240),
    lastSeenAt: nowIso()
  });
  if (idx >= 0) relationships[idx] = row;
  else relationships.unshift(row);
  const next = Object.freeze({
    ...ghost,
    relationships: Object.freeze(relationships.slice(0, MAX_RELATIONSHIPS)),
    updatedAt: nowIso()
  });
  writeRawV0(next);
  return next;
}

/**
 * @param {{ summary: string, tags?: string[], peerCastleId?: string }} mem
 */
export function appendGhostMemoryV0(mem = {}) {
  const ghost = ensureGhostMemoryV0();
  const summary = String(mem.summary || "").trim();
  if (!summary) return ghost;
  const memories = [
    Object.freeze({
      id: newId("mem"),
      ts: nowIso(),
      summary: summary.slice(0, 480),
      tags: Object.freeze((mem.tags || []).map((t) => String(t).slice(0, 32)).slice(0, 8)),
      peerCastleId: mem.peerCastleId ? String(mem.peerCastleId).slice(0, 64) : null
    }),
    ...(ghost.memories || [])
  ].slice(0, MAX_MEMORIES);
  const next = Object.freeze({ ...ghost, memories: Object.freeze(memories), updatedAt: nowIso() });
  writeRawV0(next);
  return next;
}

/**
 * @param {string} key
 * @param {string} value
 */
export function setGhostPreferenceV0(key, value) {
  const ghost = ensureGhostMemoryV0();
  const k = String(key || "").slice(0, 48);
  if (!k) return ghost;
  const prefs = [...(ghost.preferences || [])].filter((p) => p.key !== k);
  prefs.unshift(Object.freeze({ key: k, value: String(value || "").slice(0, 120) }));
  const next = Object.freeze({
    ...ghost,
    preferences: Object.freeze(prefs.slice(0, MAX_PREFERENCES)),
    updatedAt: nowIso()
  });
  writeRawV0(next);
  return next;
}

/** Export array shape for cloud sync store. */
export function listGhostMemoryForCloudSyncV0() {
  const ghost = readRawV0() || ensureGhostMemoryV0();
  return Object.freeze([Object.freeze({ ...ghost })]);
}

/**
 * @param {ReadonlyArray<object>} rows
 */
export function mergeGhostMemoryFromCloudV0(rows = []) {
  const remote = rows?.[0];
  if (!remote?.ghostId) return readGhostMemoryV0();
  const local = readRawV0();
  if (!local) {
    writeRawV0({
      schema: GHOST_MEMORY_PERSISTENCE_SCHEMA_V0,
      id: remote.ghostId,
      ghostId: remote.ghostId,
      relationships: remote.relationships || [],
      memories: remote.memories || [],
      preferences: remote.preferences || [],
      updatedAt: nowIso()
    });
    return readGhostMemoryV0();
  }

  const relByPeer = new Map((local.relationships || []).map((r) => [r.peerCastleId, r]));
  for (const r of remote.relationships || []) {
    if (!r?.peerCastleId) continue;
    const existing = relByPeer.get(r.peerCastleId);
    relByPeer.set(
      r.peerCastleId,
      existing
        ? { ...existing, ...r, since: existing.since || r.since }
        : { ...r }
    );
  }
  const memById = new Map((local.memories || []).map((m) => [m.id, m]));
  for (const m of remote.memories || []) {
    if (!m?.id) continue;
    memById.set(m.id, { ...memById.get(m.id), ...m });
  }
  const prefByKey = new Map((local.preferences || []).map((p) => [p.key, p]));
  for (const p of remote.preferences || []) {
    if (!p?.key) continue;
    prefByKey.set(p.key, p);
  }

  const merged = Object.freeze({
    ...local,
    relationships: Object.freeze([...relByPeer.values()].slice(0, MAX_RELATIONSHIPS)),
    memories: Object.freeze(
      [...memById.values()].sort((a, b) => String(b.ts).localeCompare(String(a.ts))).slice(0, MAX_MEMORIES)
    ),
    preferences: Object.freeze([...prefByKey.values()].slice(0, MAX_PREFERENCES)),
    updatedAt: nowIso()
  });
  writeRawV0(merged);
  return merged;
}

export function resetGhostMemoryForTestV0() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(GHOST_MEMORY_LS_KEY_V0);
  }
}
