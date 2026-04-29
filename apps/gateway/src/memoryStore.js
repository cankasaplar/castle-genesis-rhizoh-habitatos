import { promises as fs } from "node:fs";
import { join } from "node:path";
import { getFirebasePersistence } from "./firebasePersistence.js";

const dataDir = process.env.CASTLE_DATA_DIR || join(process.cwd(), "apps", "gateway", "data");
const filePath = join(dataDir, "rhizoh-memory.v2.json");
const MEMORY_LIMIT = Number(process.env.CASTLE_MEMORY_LIMIT || 3000);
const HOT_LIMIT = Number(process.env.CASTLE_MEMORY_HOT_LIMIT || 80);
const COMPACT_THRESHOLD = Number(process.env.CASTLE_MEMORY_COMPACT_THRESHOLD || 220);
let loaded = false;
const store = {
  users: {},
  agents: {},
  profiles: {},
  repeatStats: {}
};

const KINDS = ["episodic", "semantic", "procedural"];

function normalizeKind(kind) {
  return KINDS.includes(kind) ? kind : "episodic";
}

function memoryCollection(scope) {
  return scope === "agents" ? "castle_agent_memory" : "castle_user_memory";
}

async function ensureLoaded() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const json = JSON.parse(raw);
    if (json?.users && typeof json.users === "object") store.users = json.users;
    if (json?.agents && typeof json.agents === "object") store.agents = json.agents;
    if (json?.profiles && typeof json.profiles === "object") store.profiles = json.profiles;
    if (json?.repeatStats && typeof json.repeatStats === "object") store.repeatStats = json.repeatStats;
  } catch {
    /* cold start */
  }
}

async function persist() {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(
    filePath,
    JSON.stringify({ version: 2, users: store.users, agents: store.agents, profiles: store.profiles, repeatStats: store.repeatStats }, null, 2),
    "utf8"
  );
}

function ensureBucket(type, id) {
  if (!store[type][id]) store[type][id] = [];
  return store[type][id];
}

function ensureProfile(uid) {
  if (!store.profiles[uid]) {
    store.profiles[uid] = {
      persona: { tone: "warm-strategic", style: "concise", relationship: "operator-partner" },
      goals: ["Protect user continuity", "Improve city intelligence", "Evolve agent collaboration"],
      preferences: {},
      updatedAt: Date.now()
    };
  }
  return store.profiles[uid];
}

function fingerprint(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9ğüşöçıİĞÜŞÖÇ\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function scoreMemory(m, query = "") {
  const ageHours = Math.max(0, (Date.now() - Number(m.ts || 0)) / 3600000);
  const freshness = Math.max(0, 1 - ageHours / 24 / 21);
  const importance = Math.max(0, Math.min(1, Number(m.importance || 0.5)));
  const q = String(query || "").toLowerCase();
  const text = String(m.text || "").toLowerCase();
  const tagHit = Array.isArray(m.tags) ? m.tags.some((t) => q.includes(String(t).toLowerCase()) || String(t).toLowerCase().includes(q)) : false;
  const textHit = q && text ? (text.includes(q) ? 1 : 0) : 0;
  const kindBoost = m.kind === "semantic" ? 0.08 : m.kind === "procedural" ? 0.05 : 0;
  return importance * 0.52 + freshness * 0.28 + (tagHit || textHit ? 0.2 : 0) + kindBoost;
}

function summarizeChunk(rows) {
  const top = [...rows].sort((a, b) => Number(b.importance || 0) - Number(a.importance || 0)).slice(0, 5);
  const tags = new Set();
  for (const r of top) {
    for (const t of r.tags || []) tags.add(String(t));
  }
  const summary = top.map((r) => String(r.text || "").slice(0, 200)).join(" | ");
  return {
    text: `Long-memory summary: ${summary}`.slice(0, 1800),
    tags: [...tags].slice(0, 12)
  };
}

async function getRepeatBoost(scope, id, text) {
  const key = fingerprint(text);
  if (!key) return 0;
  const { db } = getFirebasePersistence();
  if (db) {
    const ref = db.collection(memoryCollection(scope)).doc(id).collection("stats").doc("repeatIndex");
    const snap = await ref.get();
    const map = snap.exists ? snap.data()?.map || {} : {};
    const count = Number(map[key] || 0) + 1;
    map[key] = count;
    const compacted = Object.entries(map)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, 600)
      .reduce((acc, [k, v]) => {
        acc[k] = v;
        return acc;
      }, {});
    await ref.set({ map: compacted, updatedAt: Date.now() }, { merge: true });
    return Math.min(0.35, Math.log1p(count) * 0.08);
  }

  await ensureLoaded();
  const root = `${scope}:${id}`;
  if (!store.repeatStats[root]) store.repeatStats[root] = {};
  const count = Number(store.repeatStats[root][key] || 0) + 1;
  store.repeatStats[root][key] = count;
  return Math.min(0.35, Math.log1p(count) * 0.08);
}

export async function appendMemory({ scope = "users", id, text, tags = [], importance = 0.5, kind = "episodic", meta = {} }) {
  const { db } = getFirebasePersistence();
  const memKind = normalizeKind(kind);
  if (!id || !text) throw new Error("memory_id_text_required");
  const boostedImportance = Math.max(0, Math.min(1, Number(importance || 0.5) + (await getRepeatBoost(scope, id, text))));
  if (db) {
    const col = db.collection(memoryCollection(scope)).doc(id).collection("entries");
    const ref = col.doc();
    const row = {
      ts: Date.now(),
      text: String(text).slice(0, 2000),
      tags: Array.isArray(tags) ? tags.slice(0, 12).map((t) => String(t).slice(0, 32)) : [],
      importance: boostedImportance,
      kind: memKind,
      meta
    };
    await ref.set(row);
    return { id: ref.id, ...row };
  }

  await ensureLoaded();
  const bucket = ensureBucket(scope === "agents" ? "agents" : "users", id);
  bucket.push({
    id: `mem-${Math.random().toString(36).slice(2, 10)}`,
    ts: Date.now(),
    text: String(text).slice(0, 2000),
    tags: Array.isArray(tags) ? tags.slice(0, 12).map((t) => String(t).slice(0, 32)) : [],
    importance: boostedImportance,
    kind: memKind,
    meta
  });
  if (bucket.length > MEMORY_LIMIT) bucket.splice(0, bucket.length - MEMORY_LIMIT);
  await persist();
  return bucket[bucket.length - 1];
}

export async function listMemories({ scope = "users", id, kind = "", limit = 40 }) {
  const { db } = getFirebasePersistence();
  const memKind = kind ? normalizeKind(kind) : "";
  if (db) {
    let q = db.collection(memoryCollection(scope)).doc(id || "unknown").collection("entries").orderBy("ts", "desc");
    if (memKind) q = q.where("kind", "==", memKind);
    const snap = await q.limit(Math.max(1, Math.min(500, Number(limit) || 40))).get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  await ensureLoaded();
  const bucket = ensureBucket(scope === "agents" ? "agents" : "users", id || "unknown");
  const rows = memKind ? bucket.filter((x) => x.kind === memKind) : bucket;
  return rows.slice(-Math.max(1, Math.min(500, Number(limit) || 40))).reverse();
}

export async function getPersonaGoalMemory(uid) {
  const { db } = getFirebasePersistence();
  if (db) {
    const ref = db.collection("castle_user_memory").doc(uid || "unknown").collection("profile").doc("main");
    const snap = await ref.get();
    if (!snap.exists) {
      const profile = {
        persona: { tone: "warm-strategic", style: "concise", relationship: "operator-partner" },
        goals: ["Protect user continuity", "Improve city intelligence", "Evolve agent collaboration"],
        preferences: {},
        updatedAt: Date.now()
      };
      await ref.set(profile);
      return profile;
    }
    return snap.data();
  }

  await ensureLoaded();
  return ensureProfile(uid || "unknown");
}

export async function setPersonaGoalMemory({ uid, personaPatch = {}, goals = null, preferencesPatch = {} }) {
  if (!uid) throw new Error("uid_required");
  const { db } = getFirebasePersistence();
  if (db) {
    const ref = db.collection("castle_user_memory").doc(uid).collection("profile").doc("main");
    const current = (await ref.get()).data() || {};
    const merged = {
      persona: { ...(current.persona || {}), ...(personaPatch || {}) },
      goals: Array.isArray(goals) ? goals.slice(0, 24).map((g) => String(g).slice(0, 120)) : current.goals || [],
      preferences: { ...(current.preferences || {}), ...(preferencesPatch || {}) },
      updatedAt: Date.now()
    };
    await ref.set(merged, { merge: true });
    return merged;
  }

  await ensureLoaded();
  const p = ensureProfile(uid);
  p.persona = { ...(p.persona || {}), ...(personaPatch || {}) };
  if (Array.isArray(goals)) p.goals = goals.slice(0, 24).map((g) => String(g).slice(0, 120));
  p.preferences = { ...(p.preferences || {}), ...(preferencesPatch || {}) };
  p.updatedAt = Date.now();
  await persist();
  return p;
}

export async function autoCompactMemories({ scope = "users", id }) {
  if (!id) throw new Error("memory_id_required");
  const { db } = getFirebasePersistence();
  if (db) {
    const col = db.collection(memoryCollection(scope)).doc(id).collection("entries");
    const episodicSnap = await col.where("kind", "==", "episodic").orderBy("ts", "desc").limit(COMPACT_THRESHOLD + 60).get();
    if (episodicSnap.size <= COMPACT_THRESHOLD) return { compacted: 0, summary: null };
    const old = episodicSnap.docs.slice(COMPACT_THRESHOLD);
    const rows = old.map((d) => ({ id: d.id, ...d.data() }));
    const summary = summarizeChunk(rows);
    const batch = db.batch();
    for (const d of old) batch.delete(d.ref);
    const summaryRef = col.doc();
    batch.set(summaryRef, {
      ts: Date.now(),
      kind: "semantic",
      text: summary.text,
      tags: [...summary.tags, "auto-summary", "compacted"].slice(0, 12),
      importance: 0.84,
      meta: { source: "auto_compaction", compactedCount: old.length }
    });
    await batch.commit();
    return { compacted: old.length, summary: summaryRef.id };
  }

  await ensureLoaded();
  const bucket = ensureBucket(scope === "agents" ? "agents" : "users", id);
  const episodic = bucket.filter((x) => (x.kind || "episodic") === "episodic");
  if (episodic.length <= COMPACT_THRESHOLD) return { compacted: 0, summary: null };
  const old = episodic.slice(0, episodic.length - COMPACT_THRESHOLD);
  const oldIds = new Set(old.map((x) => x.id));
  const summary = summarizeChunk(old);
  const kept = bucket.filter((x) => !oldIds.has(x.id));
  kept.push({
    id: `mem-${Math.random().toString(36).slice(2, 10)}`,
    ts: Date.now(),
    kind: "semantic",
    text: summary.text,
    tags: [...summary.tags, "auto-summary", "compacted"].slice(0, 12),
    importance: 0.84,
    meta: { source: "auto_compaction", compactedCount: old.length }
  });
  store[scope === "agents" ? "agents" : "users"][id] = kept;
  await persist();
  return { compacted: old.length, summary: "local" };
}

export async function getMemoryContext({ uid, agentId = "", query = "", limit = HOT_LIMIT }) {
  const { db } = getFirebasePersistence();
  const memoryByKind = { episodic: [], semantic: [], procedural: [] };
  if (db) {
    const uCol = db.collection("castle_user_memory").doc(uid || "unknown").collection("entries");
    const uSnap = await uCol.orderBy("ts", "desc").limit(500).get();
    let merged = uSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (agentId) {
      const aCol = db.collection("castle_agent_memory").doc(agentId).collection("entries");
      const aSnap = await aCol.orderBy("ts", "desc").limit(400).get();
      merged = merged.concat(aSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }
    const ranked = merged
      .map((m) => ({ ...m, _score: scoreMemory(m, query) }))
      .sort((a, b) => b._score - a._score)
      .slice(0, Math.max(1, Math.min(300, Number(limit) || HOT_LIMIT)));
    for (const r of ranked) {
      const k = normalizeKind(r.kind || "episodic");
      if (memoryByKind[k].length < Math.ceil(limit / 3)) {
        memoryByKind[k].push({ ts: r.ts, text: r.text, tags: r.tags, importance: r.importance });
      }
    }
    const profile = await getPersonaGoalMemory(uid || "unknown");
    return {
      ...memoryByKind,
      persona: profile?.persona || {},
      goals: profile?.goals || [],
      preferences: profile?.preferences || {}
    };
  }

  await ensureLoaded();
  const userRows = ensureBucket("users", uid || "unknown");
  const agentRows = agentId ? ensureBucket("agents", agentId) : [];
  const merged = [...userRows, ...agentRows];
  const ranked = merged
    .map((m) => ({ ...m, _score: scoreMemory(m, query) }))
    .sort((a, b) => b._score - a._score)
    .slice(0, Math.max(1, Math.min(300, Number(limit) || HOT_LIMIT)));
  for (const r of ranked) {
    const k = normalizeKind(r.kind || "episodic");
    if (memoryByKind[k].length < Math.ceil(limit / 3)) {
      memoryByKind[k].push({ ts: r.ts, text: r.text, tags: r.tags, importance: r.importance });
    }
  }
  const profile = ensureProfile(uid || "unknown");
  return {
    ...memoryByKind,
    persona: profile?.persona || {},
    goals: profile?.goals || [],
    preferences: profile?.preferences || {}
  };
}
