import { promises as fs } from "node:fs";
import { join } from "node:path";
import { getFirebasePersistence } from "./firebasePersistence.js";

const dataDir = process.env.CASTLE_DATA_DIR || join(process.cwd(), "apps", "gateway", "data");
const filePath = join(dataDir, "studio-ops.v1.json");
let loaded = false;
const local = { sessions: {}, transcripts: {}, devices: {}, telemetry: {}, automations: {}, commands: {}, socials: {} };

async function ensureLoaded() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const json = JSON.parse(raw);
    if (json?.sessions) local.sessions = json.sessions;
    if (json?.transcripts) local.transcripts = json.transcripts;
    if (json?.devices) local.devices = json.devices;
    if (json?.telemetry) local.telemetry = json.telemetry;
    if (json?.automations) local.automations = json.automations;
    if (json?.commands) local.commands = json.commands;
    if (json?.socials) local.socials = json.socials;
  } catch {
    /* cold start */
  }
}

async function persist() {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify({ version: 1, ...local }, null, 2), "utf8");
}

function ensureArray(map, uid) {
  if (!map[uid]) map[uid] = [];
  return map[uid];
}

export async function createPublishSession(uid, input = {}) {
  const now = Date.now();
  const row = {
    protocol: String(input.protocol || "WHIP").toUpperCase(),
    target: String(input.target || ""),
    roomId: String(input.roomId || "studio-main"),
    streamKeyHint: String(input.streamKeyHint || "").slice(0, 64),
    bridge: String(input.bridge || "OBS/LiveKit/SFU"),
    status: String(input.status || "armed"),
    createdAt: now,
    updatedAt: now
  };
  const { db } = getFirebasePersistence();
  if (db) {
    const ref = db.collection("castle_studio").doc(uid).collection("publish_sessions").doc();
    await ref.set(row);
    return { id: ref.id, ...row };
  }
  await ensureLoaded();
  const arr = ensureArray(local.sessions, uid);
  const out = { id: `pub-${Math.random().toString(36).slice(2, 10)}`, ...row };
  arr.unshift(out);
  await persist();
  return out;
}

export async function listPublishSessions(uid, limit = 40) {
  const { db } = getFirebasePersistence();
  if (db) {
    const snap = await db.collection("castle_studio").doc(uid).collection("publish_sessions").orderBy("createdAt", "desc").limit(limit).get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  await ensureLoaded();
  return ensureArray(local.sessions, uid).slice(0, limit);
}

export async function updatePublishSession(uid, sessionId, patch = {}) {
  const safePatch = {
    status: patch?.status ? String(patch.status) : undefined,
    ingestUrl: patch?.ingestUrl ? String(patch.ingestUrl) : undefined,
    previewUrl: patch?.previewUrl ? String(patch.previewUrl) : undefined,
    reconnectPolicy: patch?.reconnectPolicy || undefined,
    updatedAt: Date.now()
  };
  const { db } = getFirebasePersistence();
  if (db) {
    const ref = db.collection("castle_studio").doc(uid).collection("publish_sessions").doc(String(sessionId));
    const snap = await ref.get();
    if (!snap.exists) throw new Error("publish_session_not_found");
    await ref.set(safePatch, { merge: true });
    const next = await ref.get();
    return { id: next.id, ...next.data() };
  }
  await ensureLoaded();
  const arr = ensureArray(local.sessions, uid);
  const i = arr.findIndex((x) => x.id === String(sessionId));
  if (i < 0) throw new Error("publish_session_not_found");
  arr[i] = { ...arr[i], ...safePatch };
  await persist();
  return arr[i];
}

export async function addTranscript(uid, entry = {}) {
  const row = {
    ts: Date.now(),
    source: String(entry.source || "system"),
    eventType: String(entry.eventType || "note"),
    text: String(entry.text || "").slice(0, 2000),
    roomId: String(entry.roomId || "studio-main"),
    meta: entry.meta || {}
  };
  const { db } = getFirebasePersistence();
  if (db) {
    const ref = db.collection("castle_studio").doc(uid).collection("transcripts").doc();
    await ref.set(row);
    return { id: ref.id, ...row };
  }
  await ensureLoaded();
  const arr = ensureArray(local.transcripts, uid);
  const out = { id: `tr-${Math.random().toString(36).slice(2, 10)}`, ...row };
  arr.unshift(out);
  if (arr.length > 1200) arr.length = 1200;
  await persist();
  return out;
}

export async function listTranscripts(uid, limit = 80) {
  const { db } = getFirebasePersistence();
  if (db) {
    const snap = await db.collection("castle_studio").doc(uid).collection("transcripts").orderBy("ts", "desc").limit(limit).get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  await ensureLoaded();
  return ensureArray(local.transcripts, uid).slice(0, limit);
}

export async function searchMetadata(uid, query = "", limit = 80) {
  const q = String(query || "").toLowerCase().trim();
  const rows = await listTranscripts(uid, Math.max(80, limit));
  const filtered = q
    ? rows.filter((r) => {
        const text = String(r.text || "").toLowerCase();
        const ev = String(r.eventType || "").toLowerCase();
        const src = String(r.source || "").toLowerCase();
        const meta = JSON.stringify(r.meta || {}).toLowerCase();
        return text.includes(q) || ev.includes(q) || src.includes(q) || meta.includes(q);
      })
    : rows;
  return filtered.slice(0, Math.max(1, Math.min(300, Number(limit) || 80)));
}

export async function registerDevice(uid, input = {}) {
  const now = Date.now();
  const row = {
    name: String(input.name || "device"),
    kind: String(input.kind || "drone"),
    transport: String(input.transport || "websocket"),
    endpoint: String(input.endpoint || ""),
    adapter: String(input.adapter || "websocket"), // websocket | mqtt
    capabilityProfile: Array.isArray(input.capabilityProfile) ? input.capabilityProfile.slice(0, 64).map((x) => String(x).slice(0, 40)) : [],
    safetyProfile: {
      geofence: input?.safetyProfile?.geofence || "city-default",
      speedCapMps: Number(input?.safetyProfile?.speedCapMps || 35),
      failSafeMode: String(input?.safetyProfile?.failSafeMode || "HOLD_POSITION")
    },
    status: String(input.status || "registered"),
    createdAt: now,
    updatedAt: now
  };
  const { db } = getFirebasePersistence();
  if (db) {
    const ref = db.collection("castle_robotics").doc(uid).collection("devices").doc();
    await ref.set(row);
    return { id: ref.id, ...row };
  }
  await ensureLoaded();
  const arr = ensureArray(local.devices, uid);
  const out = { id: `dev-${Math.random().toString(36).slice(2, 10)}`, ...row };
  arr.unshift(out);
  await persist();
  return out;
}

export async function listDevices(uid, limit = 80) {
  const { db } = getFirebasePersistence();
  if (db) {
    const snap = await db.collection("castle_robotics").doc(uid).collection("devices").orderBy("createdAt", "desc").limit(limit).get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  await ensureLoaded();
  return ensureArray(local.devices, uid).slice(0, limit);
}

export async function updateDevice(uid, deviceId, patch = {}) {
  const safePatch = {
    status: patch?.status ? String(patch.status) : undefined,
    endpoint: patch?.endpoint != null ? String(patch.endpoint) : undefined,
    adapter: patch?.adapter ? String(patch.adapter) : undefined,
    capabilityProfile: Array.isArray(patch?.capabilityProfile) ? patch.capabilityProfile.slice(0, 64).map((x) => String(x).slice(0, 40)) : undefined,
    safetyProfile: patch?.safetyProfile || undefined,
    lastTelemetryAt: patch?.lastTelemetryAt ? Number(patch.lastTelemetryAt) : undefined,
    safetyState: patch?.safetyState || undefined,
    updatedAt: Date.now()
  };
  const { db } = getFirebasePersistence();
  if (db) {
    const ref = db.collection("castle_robotics").doc(uid).collection("devices").doc(String(deviceId));
    const snap = await ref.get();
    if (!snap.exists) throw new Error("device_not_found");
    await ref.set(safePatch, { merge: true });
    const next = await ref.get();
    return { id: next.id, ...next.data() };
  }
  await ensureLoaded();
  const arr = ensureArray(local.devices, uid);
  const i = arr.findIndex((x) => x.id === String(deviceId));
  if (i < 0) throw new Error("device_not_found");
  arr[i] = { ...arr[i], ...safePatch };
  await persist();
  return arr[i];
}

export async function appendTelemetry(uid, deviceId, telemetry = {}) {
  const row = {
    ts: Date.now(),
    deviceId: String(deviceId),
    lat: Number(telemetry?.lat),
    lon: Number(telemetry?.lon),
    speed: Number(telemetry?.speed || 0),
    battery: Number(telemetry?.battery || 0),
    mode: String(telemetry?.mode || "unknown"),
    raw: telemetry?.raw || {}
  };
  const { db } = getFirebasePersistence();
  if (db) {
    const ref = db.collection("castle_robotics").doc(uid).collection("telemetry").doc();
    await ref.set(row);
    return { id: ref.id, ...row };
  }
  await ensureLoaded();
  const arr = ensureArray(local.telemetry, uid);
  const out = { id: `tm-${Math.random().toString(36).slice(2, 10)}`, ...row };
  arr.unshift(out);
  if (arr.length > 2000) arr.length = 2000;
  await persist();
  return out;
}

export async function listTelemetry(uid, limit = 120) {
  const { db } = getFirebasePersistence();
  if (db) {
    const snap = await db.collection("castle_robotics").doc(uid).collection("telemetry").orderBy("ts", "desc").limit(limit).get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  await ensureLoaded();
  return ensureArray(local.telemetry, uid).slice(0, limit);
}

export async function createAutomation(uid, input = {}) {
  const now = Date.now();
  const row = {
    title: String(input?.title || "automation"),
    scheduleAt: Number(input?.scheduleAt || now),
    action: String(input?.action || "NOTIFY"),
    deviceId: String(input?.deviceId || ""),
    payload: input?.payload || {},
    status: "scheduled",
    createdAt: now,
    updatedAt: now
  };
  const { db } = getFirebasePersistence();
  if (db) {
    const ref = db.collection("castle_robotics").doc(uid).collection("automations").doc();
    await ref.set(row);
    return { id: ref.id, ...row };
  }
  await ensureLoaded();
  const arr = ensureArray(local.automations, uid);
  const out = { id: `au-${Math.random().toString(36).slice(2, 10)}`, ...row };
  arr.unshift(out);
  await persist();
  return out;
}

export async function listAutomations(uid, limit = 80) {
  const { db } = getFirebasePersistence();
  if (db) {
    const snap = await db.collection("castle_robotics").doc(uid).collection("automations").orderBy("createdAt", "desc").limit(limit).get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  await ensureLoaded();
  return ensureArray(local.automations, uid).slice(0, limit);
}

export async function tickAutomations(now = Date.now()) {
  const executed = [];
  const { db } = getFirebasePersistence();
  if (db) {
    const roots = await db.collection("castle_robotics").get();
    for (const root of roots.docs) {
      const uid = root.id;
      const snap = await db
        .collection("castle_robotics")
        .doc(uid)
        .collection("automations")
        .where("status", "==", "scheduled")
        .where("scheduleAt", "<=", now)
        .limit(20)
        .get();
      for (const d of snap.docs) {
        await d.ref.set({ status: "executed", updatedAt: now, executedAt: now }, { merge: true });
        executed.push({ uid, id: d.id, ...d.data() });
      }
    }
    return executed;
  }
  await ensureLoaded();
  for (const [uid, arr] of Object.entries(local.automations)) {
    for (const a of arr) {
      if (a.status === "scheduled" && Number(a.scheduleAt || 0) <= now) {
        a.status = "executed";
        a.updatedAt = now;
        a.executedAt = now;
        executed.push({ uid, ...a });
      }
    }
  }
  if (executed.length) await persist();
  return executed;
}

export async function enqueueCommand(uid, input = {}) {
  const row = {
    id: `cmd-${Math.random().toString(36).slice(2, 10)}`,
    ts: Date.now(),
    deviceId: String(input?.deviceId || ""),
    action: String(input?.action || "NOOP"),
    params: input?.params || {},
    adapter: String(input?.adapter || "websocket"),
    status: "queued"
  };
  if (!row.deviceId) throw new Error("deviceId_required");
  const { db } = getFirebasePersistence();
  if (db) {
    await db.collection("castle_robotics").doc(uid).collection("commands").doc(row.id).set(row);
    return row;
  }
  await ensureLoaded();
  const arr = ensureArray(local.commands, uid);
  arr.unshift(row);
  if (arr.length > 2000) arr.length = 2000;
  await persist();
  return row;
}

export async function listCommands(uid, limit = 120) {
  const { db } = getFirebasePersistence();
  if (db) {
    const snap = await db.collection("castle_robotics").doc(uid).collection("commands").orderBy("ts", "desc").limit(limit).get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  await ensureLoaded();
  return ensureArray(local.commands, uid).slice(0, limit);
}

export async function updateCommandStatus(uid, id, status = "sent") {
  const nextStatus = String(status || "sent");
  const { db } = getFirebasePersistence();
  if (db) {
    const ref = db.collection("castle_robotics").doc(uid).collection("commands").doc(String(id));
    const snap = await ref.get();
    if (!snap.exists) throw new Error("command_not_found");
    await ref.set({ status: nextStatus, updatedAt: Date.now() }, { merge: true });
    const next = await ref.get();
    return { id: next.id, ...next.data() };
  }
  await ensureLoaded();
  const arr = ensureArray(local.commands, uid);
  const i = arr.findIndex((x) => x.id === String(id));
  if (i < 0) throw new Error("command_not_found");
  arr[i] = { ...arr[i], status: nextStatus, updatedAt: Date.now() };
  await persist();
  return arr[i];
}

export async function registerSocialChannel(uid, input = {}) {
  const row = {
    id: `soc-${Math.random().toString(36).slice(2, 10)}`,
    ts: Date.now(),
    platform: String(input?.platform || "telegram"), // telegram | whatsapp | slack | webhook
    connectorType: String(input?.connectorType || "webhook"),
    endpoint: String(input?.endpoint || ""),
    tokenHint: String(input?.tokenHint || "").slice(0, 64),
    status: String(input?.status || "enabled"),
    audience: String(input?.audience || "general")
  };
  const { db } = getFirebasePersistence();
  if (db) {
    await db.collection("castle_social").doc(uid).collection("channels").doc(row.id).set(row);
    return row;
  }
  await ensureLoaded();
  const arr = ensureArray(local.socials, uid);
  arr.unshift(row);
  await persist();
  return row;
}

export async function listSocialChannels(uid, limit = 80) {
  const { db } = getFirebasePersistence();
  if (db) {
    const snap = await db.collection("castle_social").doc(uid).collection("channels").orderBy("ts", "desc").limit(limit).get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  await ensureLoaded();
  return ensureArray(local.socials, uid).slice(0, limit);
}
