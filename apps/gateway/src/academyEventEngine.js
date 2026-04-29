import { promises as fs } from "node:fs";
import { join } from "node:path";
import { getFirebasePersistence } from "./firebasePersistence.js";
import { appendMemory } from "./memoryStore.js";
import { bumpAgentProgress } from "./agentIdentityStore.js";

const dataDir = process.env.CASTLE_DATA_DIR || join(process.cwd(), "apps", "gateway", "data");
const filePath = join(dataDir, "academy-events.v1.json");
const AUTO_RESOLVE_MS = Number(process.env.CASTLE_ACADEMY_EVENT_AUTO_RESOLVE_MS || 120000);
let loaded = false;
const localStore = { events: [] };

async function ensureLoaded() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const json = JSON.parse(raw);
    if (Array.isArray(json?.events)) localStore.events = json.events;
  } catch {
    /* cold start */
  }
}

async function persist() {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify({ version: 1, events: localStore.events }, null, 2), "utf8");
}

export async function queueAcademyEvent(input = {}) {
  const { db } = getFirebasePersistence();
  const now = Date.now();
  const row = {
    type: String(input.type || "LECTURE"),
    roomId: String(input.roomId || "academy-main"),
    ownerUid: String(input.ownerUid || "unknown"),
    participants: Array.isArray(input.participants) ? input.participants.slice(0, 64) : [],
    topic: String(input.topic || "general"),
    payload: input.payload || {},
    status: "queued",
    createdAt: now,
    updatedAt: now
  };
  if (db) {
    const ref = db.collection("castle_academy_events").doc();
    await ref.set(row);
    return { id: ref.id, ...row };
  }
  await ensureLoaded();
  const event = { id: `ev-${Math.random().toString(36).slice(2, 10)}`, ...row };
  localStore.events.push(event);
  await persist();
  return event;
}

export async function listAcademyEvents({ ownerUid = "", status = "", limit = 80 } = {}) {
  const { db } = getFirebasePersistence();
  const safeLimit = Math.max(1, Math.min(300, Number(limit) || 80));
  if (db) {
    let q = db.collection("castle_academy_events");
    if (ownerUid) q = q.where("ownerUid", "==", ownerUid);
    if (status) q = q.where("status", "==", status);
    const snap = await q.orderBy("createdAt", "desc").limit(safeLimit).get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  await ensureLoaded();
  let rows = [...localStore.events];
  if (ownerUid) rows = rows.filter((r) => r.ownerUid === ownerUid);
  if (status) rows = rows.filter((r) => r.status === status);
  rows.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
  return rows.slice(0, safeLimit);
}

export async function resolveAcademyEvent(eventId, resolution = {}) {
  const { db } = getFirebasePersistence();
  if (db) {
    const ref = db.collection("castle_academy_events").doc(String(eventId));
    const snap = await ref.get();
    if (!snap.exists) throw new Error("academy_event_not_found");
    const event = { id: snap.id, ...snap.data() };
    const status = String(resolution.status || "resolved");
    await ref.set({ status, resolution, updatedAt: Date.now(), resolvedAt: Date.now() }, { merge: true });
    await applyResolutionEffects(event, resolution);
    return { ...event, status, resolution };
  }
  await ensureLoaded();
  const idx = localStore.events.findIndex((e) => e.id === eventId);
  if (idx < 0) throw new Error("academy_event_not_found");
  const event = localStore.events[idx];
  event.status = String(resolution.status || "resolved");
  event.resolution = resolution;
  event.updatedAt = Date.now();
  event.resolvedAt = Date.now();
  await persist();
  await applyResolutionEffects(event, resolution);
  return event;
}

async function applyResolutionEffects(event, resolution) {
  const gain = Number(resolution?.xpGain || 120);
  const participants = Array.isArray(event?.participants) ? event.participants : [];
  for (const p of participants) {
    if (!p?.agentId) continue;
    try {
      await bumpAgentProgress(p.agentId, {
        xp: gain,
        masteryTopic: event.topic || "academy",
        masteryDelta: 0.2,
        teachingScore: event.type === "MENTOR_SESSION" ? 1 : 0,
        socialTrust: 0.01
      });
    } catch {
      /* agent may not be registered yet */
    }
  }
  if (event?.ownerUid) {
    await appendMemory({
      scope: "users",
      id: event.ownerUid,
      kind: "semantic",
      text: `ACADEMY_EVENT:${event.type} topic=${event.topic} participants=${participants.length} status=${resolution?.status || "resolved"}`,
      tags: ["academy", "event", String(event.type || "").toLowerCase()],
      importance: 0.68,
      meta: { roomId: event.roomId, eventId: event.id }
    });
  }
}

export async function runAcademyEventTick() {
  const rows = await listAcademyEvents({ status: "queued", limit: 120 });
  const now = Date.now();
  const due = rows.filter((r) => now - Number(r.createdAt || now) > AUTO_RESOLVE_MS);
  for (const e of due) {
    await resolveAcademyEvent(e.id, { status: "resolved", auto: true, xpGain: 80 });
  }
  return { pending: rows.length, autoResolved: due.length };
}
