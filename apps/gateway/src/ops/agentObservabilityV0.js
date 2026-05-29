/**
 * Agent observability v0 — in-process snapshot ring + optional audit chain mirror.
 */
import crypto from "node:crypto";
import { appendRhizohConstitutionalAuditChainLine } from "../rhizohOperationalAuditGateway.js";

function canonicalJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((x) => canonicalJson(x)).join(",")}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => JSON.stringify(k) + ":" + canonicalJson(value[k])).join(",")}}`;
}

export const AGENT_OBSERVABILITY_SCHEMA_V0 = "rhizoh.agent.state_snapshot.v0";

const RING_MAX = parseIntEnv("CASTLE_AGENT_SNAPSHOT_RING", 500);

function parseIntEnv(key, fallback) {
  const n = Number(process.env[key]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

/** @type {Record<string, unknown>[]} */
const ring = [];
let snapshotSeq = 0;

export function resetAgentObservabilityRingV0() {
  ring.length = 0;
  snapshotSeq = 0;
}

/**
 * Prompt provenance hash — raw text not stored in ring.
 * @param {string} text
 */
export function hashPromptProvenanceV0(text) {
  return crypto.createHash("sha256").update(String(text || ""), "utf8").digest("hex").slice(0, 24);
}

export function canonicalObservabilityJsonV0(value) {
  return canonicalJson(value);
}

/**
 * Shallow context fingerprint — no raw user message in snapshot by default.
 * @param {unknown} context
 */
export function fingerprintAgentContextV0(context) {
  if (!context || typeof context !== "object") return { keys: [], hash: "empty" };
  const c = /** @type {Record<string, unknown>} */ (context);
  const keys = Object.keys(c).sort().slice(0, 32);
  const mem = c.memory && typeof c.memory === "object" ? /** @type {Record<string, unknown>} */ (c.memory) : {};
  const summary = {
    keys,
    memoryEpisodic: Array.isArray(mem.episodic) ? mem.episodic.length : 0,
    memorySemantic: Array.isArray(mem.semantic) ? mem.semantic.length : 0,
    agentId: c.agentId != null ? String(c.agentId).slice(0, 32) : null
  };
  let hash = "0";
  try {
    hash = crypto.createHash("sha256").update(canonicalJson(summary)).digest("hex").slice(0, 16);
  } catch {
    hash = "err";
  }
  return { ...summary, hash };
}

/**
 * @param {{
 *   traceId: string,
 *   uid?: string | null,
 *   event: string,
 *   tools?: { name: string, ok?: boolean }[],
 *   riskFlags?: string[],
 *   containmentCode?: string | null,
 *   costCode?: string | null,
 *   turnLatencyMs?: number | null,
 *   context?: unknown,
 *   provider?: string | null,
 *   model?: string | null,
 *   sessionKey?: string | null,
 *   provenance?: {
 *     source?: string,
 *     channel?: string,
 *     promptSha256?: string | null,
 *     injectionFlag?: boolean
 *   } | null,
 *   stressClass?: string | null,
 *   responseAction?: string | null,
 *   stressMatrix?: string | null
 * }} snap
 */
export function recordAgentStateSnapshotV0(snap) {
  snapshotSeq += 1;
  const prov = snap.provenance && typeof snap.provenance === "object" ? snap.provenance : null;
  const entry = Object.freeze({
    schema: AGENT_OBSERVABILITY_SCHEMA_V0,
    snapshotSeq,
    atMs: Date.now(),
    traceId: String(snap.traceId || ""),
    uid: snap.uid != null ? String(snap.uid).slice(0, 64) : null,
    sessionKey: snap.sessionKey != null ? String(snap.sessionKey).slice(0, 160) : null,
    event: String(snap.event || "unknown").slice(0, 64),
    tools: Array.isArray(snap.tools) ? snap.tools.slice(0, 16) : [],
    riskFlags: Array.isArray(snap.riskFlags) ? snap.riskFlags.slice(0, 8) : [],
    containmentCode: snap.containmentCode ?? null,
    costCode: snap.costCode ?? null,
    turnLatencyMs: snap.turnLatencyMs ?? null,
    contextFingerprint: snap.context != null ? fingerprintAgentContextV0(snap.context) : null,
    provenance: prov
      ? Object.freeze({
          source: String(prov.source || "unknown").slice(0, 32),
          channel: String(prov.channel || "").slice(0, 64),
          promptSha256: prov.promptSha256 ?? null,
          injectionFlag: prov.injectionFlag === true
        })
      : null,
    provider: snap.provider ?? null,
    model: snap.model ?? null,
    stressClass: snap.stressClass ?? null,
    responseAction: snap.responseAction ?? null,
    stressMatrix: snap.stressMatrix ?? null
  });
  ring.push(entry);
  while (ring.length > RING_MAX) ring.shift();

  if (process.env.CASTLE_AGENT_SNAPSHOT_AUDIT_CHAIN === "1") {
    try {
      appendRhizohConstitutionalAuditChainLine(canonicalJson(entry));
    } catch {
      /* best-effort */
    }
  }
  return entry;
}

/** @param {number} [limit] */
export function listRecentAgentSnapshotsV0(limit = 50) {
  const n = Math.min(RING_MAX, Math.max(1, Math.floor(Number(limit) || 50)));
  return ring.slice(-n);
}
