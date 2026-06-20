/**
 * Shadow Castle Session Graph v0 — local read-model for C2C edges (SESSION_GRAPH V1.1).
 * RESEARCH-ONLY — interpretive edges only; no shared execution graph.
 * @see docs/SESSION_GRAPH_V1.md
 */

import { remoteCastlePinIdV0 } from "./shadowCastlePeerRegistryV0.js";

export const SHADOW_SESSION_GRAPH_SCHEMA_V0 = "castle.rhizoh.shadow_session_graph.v0";
export const SHADOW_SESSION_GRAPH_LS_KEY_V0 = "rhizoh.shadow_session_graph.v0";

export const SESSION_EDGE_KIND_V0 = Object.freeze({
  INVITE: "invite",
  VISIT: "visit",
  CALL: "call",
  EVENT_JOIN: "event_join"
});

/** @type {object[]} */
let edgesV0 = [];

function readPersistedEdgesV0() {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(SHADOW_SESSION_GRAPH_LS_KEY_V0);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePersistedEdgesV0(rows) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(SHADOW_SESSION_GRAPH_LS_KEY_V0, JSON.stringify(rows.slice(-64)));
  } catch {
    /* noop */
  }
}

/**
 * @param {{
 *   fromCastleId?: string,
 *   toCastleId?: string,
 *   toUid?: string,
 *   edgeKind?: string,
 *   expiresAtMs?: number | null
 * }} row
 */
export function addSessionEdgeV0(row = {}) {
  const toUid = String(row.toUid || "").trim() || null;
  const toCastleId =
    String(row.toCastleId || "").trim() || (toUid ? remoteCastlePinIdV0(toUid) : null);
  const edge = Object.freeze({
    schema: `${SHADOW_SESSION_GRAPH_SCHEMA_V0}.edge`,
    edgeId: `edge_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    fromCastleId: String(row.fromCastleId || "my_castle"),
    toCastleId,
    toUid,
    edgeKind: String(row.edgeKind || SESSION_EDGE_KIND_V0.VISIT),
    createdAtMs: Date.now(),
    expiresAtMs: Number.isFinite(Number(row.expiresAtMs)) ? Number(row.expiresAtMs) : null,
    interpretationOnly: true,
    nonExecutive: true
  });
  edgesV0 = [edge, ...edgesV0].slice(0, 64);
  writePersistedEdgesV0(edgesV0);
  return edge;
}

export function listSessionEdgesV0(limit = 16) {
  const merged = [...edgesV0, ...readPersistedEdgesV0()];
  const seen = new Set();
  /** @type {object[]} */
  const out = [];
  for (const edge of merged) {
    if (!edge?.edgeId || seen.has(edge.edgeId)) continue;
    seen.add(edge.edgeId);
    out.push(edge);
    if (out.length >= limit) break;
  }
  return Object.freeze(out);
}

export function getLatestSessionEdgeV0() {
  return listSessionEdgesV0(1)[0] || null;
}

export function getShadowSessionGraphSnapshotV0() {
  return Object.freeze({
    schema: `${SHADOW_SESSION_GRAPH_SCHEMA_V0}.snapshot`,
    edgeCount: listSessionEdgesV0(64).length,
    latest: getLatestSessionEdgeV0(),
    recent: listSessionEdgesV0(6),
    atMs: Date.now()
  });
}

/** @internal vitest */
export function __resetShadowSessionGraphForTestV0() {
  edgesV0 = [];
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(SHADOW_SESSION_GRAPH_LS_KEY_V0);
    } catch {
      /* noop */
    }
  }
}
