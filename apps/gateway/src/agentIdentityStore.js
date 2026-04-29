import { promises as fs } from "node:fs";
import { join } from "node:path";
import { getFirebasePersistence } from "./firebasePersistence.js";

const dataDir = process.env.CASTLE_DATA_DIR || join(process.cwd(), "apps", "gateway", "data");
const filePath = join(dataDir, "agent-identities.v1.json");
let loaded = false;
const localStore = { identities: {} };

async function ensureLoaded() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const json = JSON.parse(raw);
    if (json?.identities && typeof json.identities === "object") localStore.identities = json.identities;
  } catch {
    /* cold start */
  }
}

async function persist() {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify({ version: 1, identities: localStore.identities }, null, 2), "utf8");
}

function defaultProgress() {
  return {
    xp: 0,
    academyRank: 1,
    teachingScore: 0,
    socialTrust: 0.5,
    masteryMap: {}
  };
}

export async function registerAgentIdentity({ ownerUid, agentId, role = "AGENT_STUDENT", personaSeed = {}, capabilityLevel = 1 }) {
  if (!ownerUid || !agentId) throw new Error("ownerUid_agentId_required");
  const { db } = getFirebasePersistence();
  const now = Date.now();
  const row = {
    ownerUid: String(ownerUid),
    role: String(role),
    personaSeed: personaSeed || {},
    capabilityLevel: Math.max(1, Math.min(100, Number(capabilityLevel) || 1)),
    createdAt: now,
    updatedAt: now,
    progress: defaultProgress()
  };

  if (db) {
    await db.collection("castle_agent_identity").doc(String(agentId)).set(row, { merge: true });
    return { id: String(agentId), ...row };
  }

  await ensureLoaded();
  localStore.identities[String(agentId)] = { id: String(agentId), ...row };
  await persist();
  return localStore.identities[String(agentId)];
}

export async function listAgentIdentities(ownerUid = "") {
  const { db } = getFirebasePersistence();
  if (db) {
    let q = db.collection("castle_agent_identity");
    if (ownerUid) q = q.where("ownerUid", "==", String(ownerUid));
    const snap = await q.limit(400).get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  await ensureLoaded();
  const rows = Object.values(localStore.identities || {});
  return ownerUid ? rows.filter((r) => r.ownerUid === ownerUid) : rows;
}

export async function getAgentIdentity(agentId) {
  if (!agentId) return null;
  const { db } = getFirebasePersistence();
  if (db) {
    const snap = await db.collection("castle_agent_identity").doc(String(agentId)).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() };
  }
  await ensureLoaded();
  return localStore.identities[String(agentId)] || null;
}

export async function updateAgentIdentity(agentId, patch = {}) {
  if (!agentId) throw new Error("agentId_required");
  const { db } = getFirebasePersistence();
  if (db) {
    const ref = db.collection("castle_agent_identity").doc(String(agentId));
    const snap = await ref.get();
    if (!snap.exists) throw new Error("agent_identity_not_found");
    await ref.set({ ...patch, updatedAt: Date.now() }, { merge: true });
    const next = await ref.get();
    return { id: next.id, ...next.data() };
  }
  await ensureLoaded();
  const row = localStore.identities[String(agentId)];
  if (!row) throw new Error("agent_identity_not_found");
  localStore.identities[String(agentId)] = { ...row, ...patch, updatedAt: Date.now() };
  await persist();
  return localStore.identities[String(agentId)];
}

export async function bumpAgentProgress(agentId, delta = {}) {
  const row = await getAgentIdentity(agentId);
  if (!row) throw new Error("agent_identity_not_found");
  const nextProgress = { ...(row.progress || defaultProgress()) };
  nextProgress.xp = Math.max(0, Number(nextProgress.xp || 0) + Number(delta.xp || 0));
  nextProgress.teachingScore = Math.max(0, Number(nextProgress.teachingScore || 0) + Number(delta.teachingScore || 0));
  nextProgress.socialTrust = Math.max(0, Math.min(1, Number(nextProgress.socialTrust || 0.5) + Number(delta.socialTrust || 0)));
  if (delta.masteryTopic) {
    const key = String(delta.masteryTopic).slice(0, 48);
    nextProgress.masteryMap = nextProgress.masteryMap || {};
    nextProgress.masteryMap[key] = Math.max(0, Number(nextProgress.masteryMap[key] || 0) + Number(delta.masteryDelta || 0.1));
  }
  if (nextProgress.xp > nextProgress.academyRank * 1200) {
    nextProgress.academyRank = Math.min(12, Number(nextProgress.academyRank || 1) + 1);
  }
  return updateAgentIdentity(agentId, { progress: nextProgress });
}
