/**
 * SCR Distributed Mesh v0.1 — multi-region T0 quorum (ICL-verified truth, not fastest node).
 * Only one T0 exists globally.
 * @see docs/RHIZOH_WORLD_EXPANSION_LAYER_V0.1.md
 */

import { readLastT0PresenceFrameV0 } from "./rhizohT0UnifiedPresenceFrameV0.js";
import { readLastIdentityConsistencyReportV0, ICL_DRIFT_CLASS_V0 } from "./rhizohIdentityConsistencyLayerV0.js";

export const SCR_DISTRIBUTED_MESH_SCHEMA_V0 = "castle.rhizoh.scr_distributed_mesh.v0";

export const SCR_SYNC_MODE_V0 = Object.freeze({
  type: "quorum_t0",
  tolerance_ms: 120,
  fallback: "last_stable_t0"
});

/** @type {Map<string, { region: string, coherence_id: string, atMs: number, jitter_ms: number }>} */
const regionNodes = new Map();

function readRhizohV0() {
  return typeof window !== "undefined" ? window.__rhizoh || {} : {};
}

/**
 * @param {{
 *   region: string,
 *   coherence_id: string,
 *   atMs?: number,
 *   jitter_ms?: number
 * }} heartbeat
 */
export function reportScrRegionHeartbeatV0(heartbeat) {
  const region = String(heartbeat?.region || "").trim();
  if (!region) return false;
  regionNodes.set(
    region,
    Object.freeze({
      region,
      coherence_id: String(heartbeat.coherence_id || ""),
      atMs: Number(heartbeat.atMs) || Date.now(),
      jitter_ms: Math.max(0, Number(heartbeat.jitter_ms) || 0)
    })
  );
  publishScrDistributedMeshV0();
  return true;
}

/**
 * Select authoritative T0 — ICL verified local frame wins; not fastest node.
 * @param {ReturnType<typeof readLastT0PresenceFrameV0>} localFrame
 * @param {ReturnType<typeof readLastIdentityConsistencyReportV0> | null} icl
 */
export function arbitrateGlobalT0V0(localFrame, icl) {
  const nodes = [...regionNodes.values()];
  const iclOk =
    icl?.equivalence?.same_world === true &&
    icl?.drift?.drift_class === ICL_DRIFT_CLASS_V0.NONE;

  const localCoherence = localFrame?.coherenceId || null;
  let authoritative = null;

  if (iclOk && localCoherence) {
    authoritative = Object.freeze({
      source: "icl_verified_local",
      coherence_id: localCoherence,
      region: "local",
      atMs: Number(localFrame?.masterNowMs) || Date.now()
    });
  } else {
    const stable = nodes
      .filter((n) => n.jitter_ms <= SCR_SYNC_MODE_V0.tolerance_ms)
      .sort((a, b) => b.atMs - a.atMs)[0];
    if (stable) {
      authoritative = Object.freeze({
        source: SCR_SYNC_MODE_V0.fallback,
        coherence_id: stable.coherence_id,
        region: stable.region,
        atMs: stable.atMs
      });
    }
  }

  const driftMs =
    nodes.length > 1
      ? Math.max(...nodes.map((n) => n.atMs)) - Math.min(...nodes.map((n) => n.atMs))
      : 0;

  return Object.freeze({
    authoritative,
    drift_ms: driftMs,
    within_tolerance: driftMs <= SCR_SYNC_MODE_V0.tolerance_ms,
    node_count: nodes.length,
    icl_verified: iclOk
  });
}

export function publishScrDistributedMeshV0() {
  const rh = readRhizohV0();
  const frame = rh.presenceFrame || readLastT0PresenceFrameV0();
  const icl = readLastIdentityConsistencyReportV0();
  const arbitration = arbitrateGlobalT0V0(frame, icl);

  const mesh = Object.freeze({
    schema: SCR_DISTRIBUTED_MESH_SCHEMA_V0,
    atMs: Date.now(),
    syncMode: SCR_SYNC_MODE_V0,
    regions: Object.freeze([...regionNodes.values()]),
    arbitration,
    global_t0: arbitration.authoritative,
    single_t0_rule: "only_one_t0_exists_globally",
    ok: arbitration.authoritative != null && arbitration.icl_verified !== false
  });

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.scrDistributedMesh = mesh;
    window.__rhizoh.scr = Object.freeze({
      ...(rh.scr || {}),
      syncMode: SCR_SYNC_MODE_V0,
      mesh_ok: mesh.ok,
      global_t0: mesh.global_t0
    });
  }

  return mesh;
}

export function readScrDistributedMeshV0() {
  return readRhizohV0().scrDistributedMesh || null;
}

export function resetRhizohScrDistributedMeshForTestV0() {
  regionNodes.clear();
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.scrDistributedMesh;
  }
}
