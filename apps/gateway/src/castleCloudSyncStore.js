/**
 * Castle cloud sync store v0 — gateway-backed durable vault for Archive/Library/Ghost Memory.
 * Events remain append-only; entity tombstones preserved server-side.
 */

import fs from "node:fs/promises";
import path from "node:path";

const DATA_DIR = process.env.CASTLE_CLOUD_SYNC_DIR || path.join(process.cwd(), "data", "cloud-sync");
const FILE_NAME = "castle_cloud_sync_v0.json";

/** @type {Record<string, { entities: object[], events: object[], ghostMemory: object[], codex: object[], castleIdentity: object | null, chronicle: object[], knowledge: object[], updatedAt: string }>} */
let cache = null;

async function ensureLoaded() {
  if (cache) return cache;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(path.join(DATA_DIR, FILE_NAME), "utf8");
    cache = JSON.parse(raw);
  } catch {
    cache = {};
  }
  return cache;
}

async function persist() {
  if (!cache) return;
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(path.join(DATA_DIR, FILE_NAME), JSON.stringify(cache, null, 2), "utf8");
}

function bucketForUid(uid) {
  const id = String(uid || "").trim();
  if (!id) throw new Error("uid_required");
  if (!cache[id]) {
    cache[id] = {
      entities: [],
      events: [],
      ghostMemory: [],
      codex: [],
      castleIdentity: null,
      chronicle: [],
      knowledge: [],
      updatedAt: new Date().toISOString()
    };
  }
  return cache[id];
}

/**
 * @param {string} uid
 */
export async function getCloudSyncSnapshotV0(uid) {
  await ensureLoaded();
  const bucket = bucketForUid(uid);
  return Object.freeze({
    schema: "castle.cloud_sync.v0",
    uid,
    entities: Object.freeze((bucket.entities || []).map((e) => Object.freeze({ ...e }))),
    events: Object.freeze((bucket.events || []).map((e) => Object.freeze({ ...e }))),
    ghostMemory: Object.freeze((bucket.ghostMemory || []).map((e) => Object.freeze({ ...e }))),
    codex: Object.freeze((bucket.codex || []).map((e) => Object.freeze({ ...e }))),
    castleIdentity: bucket.castleIdentity ? Object.freeze({ ...bucket.castleIdentity }) : null,
    chronicle: Object.freeze((bucket.chronicle || []).map((e) => Object.freeze({ ...e }))),
    knowledge: Object.freeze((bucket.knowledge || []).map((e) => Object.freeze({ ...e }))),
    updatedAt: bucket.updatedAt
  });
}

/**
 * @param {string} uid
 * @param {{ entities?: object[], ghostMemory?: object[], codex?: object[], events?: object[], castleIdentity?: object, chronicle?: object[], knowledge?: object[] }} patch
 */
export async function mergeCloudSyncSnapshotV0(uid, patch = {}) {
  await ensureLoaded();
  const bucket = bucketForUid(uid);
  const now = new Date().toISOString();

  if (Array.isArray(patch.entities)) {
    const byId = new Map((bucket.entities || []).map((e) => [e.id, e]));
    for (const ent of patch.entities) {
      if (!ent?.id) continue;
      byId.set(ent.id, { ...byId.get(ent.id), ...ent, syncedAt: now });
    }
    bucket.entities = [...byId.values()].slice(0, 256);
  }

  if (Array.isArray(patch.ghostMemory)) {
    const byId = new Map((bucket.ghostMemory || []).map((e) => [e.id, e]));
    for (const row of patch.ghostMemory) {
      if (!row?.id) continue;
      byId.set(row.id, { ...byId.get(row.id), ...row, syncedAt: now });
    }
    bucket.ghostMemory = [...byId.values()].slice(0, 512);
  }

  if (Array.isArray(patch.codex)) {
    const byId = new Map((bucket.codex || []).map((e) => [e.id, e]));
    for (const row of patch.codex) {
      if (!row?.id) continue;
      byId.set(row.id, { ...byId.get(row.id), ...row, syncedAt: now });
    }
    bucket.codex = [...byId.values()].slice(0, 256);
  }

  if (Array.isArray(patch.events)) {
    const existing = new Set((bucket.events || []).map((e) => e.id));
    const appended = (patch.events || []).filter((e) => e?.id && !existing.has(e.id));
    bucket.events = [...(bucket.events || []), ...appended].slice(-1024);
  }

  if (patch.castleIdentity && typeof patch.castleIdentity === "object") {
    const local = bucket.castleIdentity || {};
    const remote = patch.castleIdentity;
    bucket.castleIdentity = {
      ...local,
      ...remote,
      visitors: Math.max(Number(local.visitors) || 0, Number(remote.visitors) || 0),
      matchesPlayed: Math.max(Number(local.matchesPlayed) || 0, Number(remote.matchesPlayed) || 0),
      libraryWingsOpened: Math.max(
        Number(local.libraryWingsOpened) || 0,
        Number(remote.libraryWingsOpened) || 0
      ),
      firstContacts: Math.max(Number(local.firstContacts) || 0, Number(remote.firstContacts) || 0),
      syncedAt: now
    };
  }

  if (Array.isArray(patch.chronicle)) {
    const byId = new Map((bucket.chronicle || []).map((e) => [e.id, e]));
    for (const row of patch.chronicle) {
      if (!row?.id) continue;
      byId.set(row.id, { ...byId.get(row.id), ...row, syncedAt: now });
    }
    bucket.chronicle = [...byId.values()]
      .sort((a, b) => String(a.ts).localeCompare(String(b.ts)))
      .slice(-512);
  }

  if (Array.isArray(patch.knowledge)) {
    const byNorm = new Map((bucket.knowledge || []).map((e) => [e.questionNorm || e.id, e]));
    for (const row of patch.knowledge) {
      const key = row?.questionNorm || row?.id;
      if (!key) continue;
      byNorm.set(key, { ...byNorm.get(key), ...row, syncedAt: now });
    }
    bucket.knowledge = [...byNorm.values()].slice(0, 512);
  }

  bucket.updatedAt = now;
  await persist();
  return getCloudSyncSnapshotV0(uid);
}

export async function resetCloudSyncStoreForTestV0() {
  cache = {};
  try {
    await fs.unlink(path.join(DATA_DIR, FILE_NAME));
  } catch {
    /* noop */
  }
}
