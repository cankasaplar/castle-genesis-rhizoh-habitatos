/**
 * Castle Projection Layer v0 — ICL-bound shared world projection node.
 * Castle ≠ new world · Castle = same world, inhabited projection cluster (WAL shared).
 * @see docs/RHIZOH_CASTLE_PROJECTION_LAYER_V0.md
 */

import {
  readLastIdentityConsistencyReportV0,
  ICL_DRIFT_CLASS_V0
} from "./rhizohIdentityConsistencyLayerV0.js";
import { readWorldIdentityV0 } from "./rhizohWorldIdentityV0.js";
import { readWalPersistenceStatusV0 } from "./rhizohWorldWalPersistenceV0.js";
import { readLastT0PresenceFrameV0 } from "./rhizohT0UnifiedPresenceFrameV0.js";

export const CASTLE_PROJECTION_SCHEMA_V0 = "castle.rhizoh.castle_projection.v0";

export const CASTLE_PROJECTION_UNITY_V0 = "icl_bound_shared_projection_v0";

export const RHIZOH_CASTLE_PROJECTION_EVENT_V0 = "rhizoh:castle-projection-v0";

/** @type {ReturnType<typeof buildCastleProjectionSnapshotV0> | null} */
let lastProjection = null;

function readRhizohV0() {
  return typeof window !== "undefined" ? window.__rhizoh || {} : {};
}

/**
 * @param {{ iclReport?: ReturnType<typeof readLastIdentityConsistencyReportV0> | null }} [ctx]
 */
export function evaluateCastleProjectionIclGateV0(ctx = {}) {
  const icl = ctx.iclReport ?? readLastIdentityConsistencyReportV0();
  if (!icl) {
    return Object.freeze({
      ok: true,
      code: "icl_bootstrap",
      enforce: true
    });
  }
  if (icl.drift?.drift_class === ICL_DRIFT_CLASS_V0.IDENTITY_BREAK) {
    return Object.freeze({
      ok: false,
      code: "icl_identity_break",
      enforce: true
    });
  }
  if (icl.equivalence?.chain_ok === false) {
    return Object.freeze({
      ok: false,
      code: "icl_chain_break",
      enforce: true
    });
  }
  return Object.freeze({
    ok: icl.ok !== false,
    code: icl.drift?.drift_class || "icl_ok",
    enforce: true
  });
}

/**
 * @param {{ iclReport?: ReturnType<typeof readLastIdentityConsistencyReportV0> | null }} [ctx]
 */
export function buildCastleProjectionSnapshotV0(ctx = {}) {
  const rh = readRhizohV0();
  const frame = rh.presenceFrame || readLastT0PresenceFrameV0();
  const episode = rh.worldEpisode || null;
  const identity = readWorldIdentityV0();
  const walPersist = readWalPersistenceStatusV0();
  const iclGate = evaluateCastleProjectionIclGateV0(ctx);

  const worldId = identity?.world_identity_id || walPersist.world_identity_id || "world_unbound";
  const nodeSuffix = worldId.replace(/^world_id_/, "").slice(0, 10) || "local";

  return Object.freeze({
    schema: CASTLE_PROJECTION_SCHEMA_V0,
    unity: CASTLE_PROJECTION_UNITY_V0,
    atMs: Number(frame?.masterNowMs) || Date.now(),
    castle_node_id: `castle_proj_${nodeSuffix}`,
    single_world: true,
    shared_wal: true,
    icl_enforced: iclGate.enforce === true,
    icl_gate: iclGate,
    world_identity_id: identity?.world_identity_id || null,
    chain_head_hash: identity?.chain_head_hash || null,
    wal_entry_id: episode?.wal_entry_id || null,
    episode_seq: episode?.current_seq ?? null,
    coherence_id: frame?.coherenceId || episode?.coherence_id || null,
    persistence: walPersist.persistence || "memory_only"
  });
}

/**
 * @param {{ iclReport?: object | null, force?: boolean }} [opts]
 */
export function publishCastleProjectionV0(opts = {}) {
  const gate = evaluateCastleProjectionIclGateV0({ iclReport: opts.iclReport });
  if (!gate.ok && !opts.force) {
    return null;
  }

  const projection = buildCastleProjectionSnapshotV0({ iclReport: opts.iclReport });
  lastProjection = projection;

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.castleProjection = projection;
    try {
      window.dispatchEvent(
        new CustomEvent(RHIZOH_CASTLE_PROJECTION_EVENT_V0, {
          detail: Object.freeze({ projection })
        })
      );
    } catch {
      /* noop */
    }
  }
  return projection;
}

export function readCastleProjectionV0() {
  return (
    lastProjection ||
    (typeof window !== "undefined" ? window.__rhizoh?.castleProjection : null) ||
    null
  );
}

export function resetRhizohCastleProjectionForTestV0() {
  lastProjection = null;
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.castleProjection;
  }
}
