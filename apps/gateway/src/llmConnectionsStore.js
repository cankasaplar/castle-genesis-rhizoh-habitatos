import { promises as fs } from "node:fs";
import { join } from "node:path";
import crypto from "node:crypto";
import { getFirebasePersistence } from "./firebasePersistence.js";

const dataDir = process.env.CASTLE_DATA_DIR || join(process.cwd(), "apps", "gateway", "data");
const filePath = join(dataDir, "llm-connections.v1.json");
const keySeed = process.env.CASTLE_STORE_SECRET || "";
const inMemory = new Map();
let loaded = false;

function getCipherKey() {
  if (!keySeed) return null;
  return crypto.createHash("sha256").update(keySeed).digest();
}

function encryptText(text) {
  const key = getCipherKey();
  if (!key) return { mode: "plain", value: text };
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    mode: "enc",
    value: `${iv.toString("base64")}.${tag.toString("base64")}.${enc.toString("base64")}`
  };
}

function decryptText(blob) {
  if (!blob) return "";
  if (blob.mode !== "enc") return String(blob.value || "");
  const key = getCipherKey();
  if (!key) return "";
  const [ivB64, tagB64, bodyB64] = String(blob.value || "").split(".");
  if (!ivB64 || !tagB64 || !bodyB64) return "";
  try {
    const iv = Buffer.from(ivB64, "base64");
    const tag = Buffer.from(tagB64, "base64");
    const body = Buffer.from(bodyB64, "base64");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8");
  } catch {
    return "";
  }
}

async function ensureLoaded() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const json = JSON.parse(raw);
    const users = json?.users || {};
    for (const [uid, rows] of Object.entries(users)) {
      inMemory.set(
        uid,
        Array.isArray(rows)
          ? rows.map((r) => ({
              ...r,
              apiKey: decryptText(r.apiKeyBlob || r.apiKey || "")
            }))
          : []
      );
    }
  } catch {
    /* first boot or corrupted file */
  }
}

async function persist() {
  await fs.mkdir(dataDir, { recursive: true });
  const users = {};
  for (const [uid, rows] of inMemory.entries()) {
    users[uid] = rows.map((r) => ({
      ...r,
      apiKeyBlob: encryptText(r.apiKey || ""),
      apiKey: undefined
    }));
  }
  await fs.writeFile(filePath, JSON.stringify({ version: 1, users }, null, 2), "utf8");
}

async function getList(uid) {
  await ensureLoaded();
  if (!inMemory.has(uid)) inMemory.set(uid, []);
  return inMemory.get(uid);
}

function maskKey(key) {
  if (!key) return "";
  const k = String(key);
  if (k.length <= 8) return `${"*".repeat(Math.max(0, k.length - 2))}${k.slice(-2)}`;
  return `${k.slice(0, 4)}...${k.slice(-4)}`;
}

export async function listConnections(uid) {
  const { db } = getFirebasePersistence();
  if (db) {
    const snap = await db.collection("castle_users").doc(uid).collection("llm_connections").get();
    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    rows.sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0));
    return rows.map((c) => ({
      id: c.id,
      provider: c.provider,
      model: c.model,
      label: c.label,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      isDefault: !!c.isDefault,
      keyMask: maskKey(c.apiKey)
    }));
  }
  const rows = await getList(uid);
  return rows.map((c) => ({
    id: c.id,
    provider: c.provider,
    model: c.model,
    label: c.label,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    isDefault: !!c.isDefault,
    keyMask: maskKey(c.apiKey)
  }));
}

export async function createConnection(uid, input) {
  const { db } = getFirebasePersistence();
  const now = Date.now();
  const provider = String(input?.provider || "").toLowerCase();
  const model = String(input?.model || "").trim();
  const apiKey = String(input?.apiKey || "").trim();
  const label = String(input?.label || `${provider}:${model}` || "llm-connection").slice(0, 80);
  if (!provider || !model || !apiKey) throw new Error("provider_model_apiKey_required");
  const row = {
    provider,
    model,
    apiKey,
    label,
    createdAt: now,
    updatedAt: now,
    isDefault: false
  };
  if (db) {
    const ref = db.collection("castle_users").doc(uid).collection("llm_connections").doc();
    const existing = await ref.parent.limit(1).get();
    row.isDefault = existing.empty;
    await ref.set(row);
    return ref.id;
  }

  row.id = `llm-${Math.random().toString(36).slice(2, 10)}`;
  const list = await getList(uid);
  row.isDefault = list.length === 0;
  list.push(row);
  await persist();
  return row.id;
}

export async function updateConnection(uid, id, input) {
  const { db } = getFirebasePersistence();
  if (db) {
    const ref = db.collection("castle_users").doc(uid).collection("llm_connections").doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new Error("connection_not_found");
    const patch = { updatedAt: Date.now() };
    if (input?.provider) patch.provider = String(input.provider).toLowerCase();
    if (input?.model) patch.model = String(input.model).trim();
    if (input?.apiKey) patch.apiKey = String(input.apiKey).trim();
    if (input?.label) patch.label = String(input.label).slice(0, 80);
    await ref.update(patch);
    return;
  }

  const list = await getList(uid);
  const row = list.find((x) => x.id === id);
  if (!row) throw new Error("connection_not_found");
  if (input?.provider) row.provider = String(input.provider).toLowerCase();
  if (input?.model) row.model = String(input.model).trim();
  if (input?.apiKey) row.apiKey = String(input.apiKey).trim();
  if (input?.label) row.label = String(input.label).slice(0, 80);
  row.updatedAt = Date.now();
  await persist();
}

export async function deleteConnection(uid, id) {
  const { db } = getFirebasePersistence();
  if (db) {
    const col = db.collection("castle_users").doc(uid).collection("llm_connections");
    const ref = col.doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new Error("connection_not_found");
    const wasDefault = !!snap.data()?.isDefault;
    await ref.delete();
    if (wasDefault) {
      const left = await col.limit(1).get();
      if (!left.empty) await left.docs[0].ref.update({ isDefault: true, updatedAt: Date.now() });
    }
    return;
  }

  const list = await getList(uid);
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) throw new Error("connection_not_found");
  const [removed] = list.splice(idx, 1);
  if (removed.isDefault && list[0]) list[0].isDefault = true;
  await persist();
}

export async function setDefaultConnection(uid, id) {
  const { db } = getFirebasePersistence();
  if (db) {
    const col = db.collection("castle_users").doc(uid).collection("llm_connections");
    const snap = await col.get();
    let found = false;
    const batch = db.batch();
    for (const doc of snap.docs) {
      const isDefault = doc.id === id;
      if (isDefault) found = true;
      batch.update(doc.ref, { isDefault, updatedAt: Date.now() });
    }
    if (!found) throw new Error("connection_not_found");
    await batch.commit();
    return;
  }

  const list = await getList(uid);
  let found = false;
  for (const c of list) {
    c.isDefault = c.id === id;
    if (c.isDefault) found = true;
  }
  if (!found) throw new Error("connection_not_found");
  await persist();
}

/** Bağlantılar Firestore’da castle_users/{uid}/llm_connections altında; başka uid’nin id’si ile okuma yapılamaz. */
export async function resolveConnection(uid, id = "") {
  const { db } = getFirebasePersistence();
  if (db) {
    const col = db.collection("castle_users").doc(uid).collection("llm_connections");
    if (id) {
      const snap = await col.doc(id).get();
      if (!snap.exists) return null;
      const parentDoc = snap.ref.parent.parent;
      if (!parentDoc || parentDoc.id !== uid) return null;
      return { id: snap.id, ...snap.data() };
    }
    const defaults = await col.where("isDefault", "==", true).limit(1).get();
    if (!defaults.empty) return { id: defaults.docs[0].id, ...defaults.docs[0].data() };
    const any = await col.limit(1).get();
    if (any.empty) return null;
    return { id: any.docs[0].id, ...any.docs[0].data() };
  }

  const list = await getList(uid);
  if (list.length === 0) return null;
  if (id) return list.find((x) => x.id === id) || null;
  return list.find((x) => x.isDefault) || list[0];
}
