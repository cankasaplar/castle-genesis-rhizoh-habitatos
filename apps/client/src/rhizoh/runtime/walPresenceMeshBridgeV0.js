/**
 * Bridge gateway presence mesh deltas → WAL streamed geometry authority (Sprint B).
 */

import { ingestPresenceMeshDelta } from "../../studio/store/presenceMeshIngestSlice";
import {
  extractWalGeometryFromMeshDeltaV0,
  ingestGltfSceneGraphStreamOnKernelV0
} from "./sceneGraphStreamV0.js";
import { ingestObstacleStreamFrameOnKernelV0 } from "./worldAuthorityStreamIngressV0.js";
import { grantRosAuthorityLeaseV0 } from "./realityOperatingSystemExecutionRuntimeV0.js";

export const WAL_PRESENCE_MESH_BRIDGE_SCHEMA_V0 = "castle.rhizoh.wal_presence_mesh_bridge.v0";

/**
 * Ingest mesh delta into causal graph AND optional WAL geometry stream.
 *
 * @param {() => import("../../studio/types/rskOntology.js").StudioKernelState} getState
 * @param {(next: import("../../studio/types/rskOntology.js").StudioKernelState) => void} setState
 * @param {import("../../studio/runtime/presenceMeshClient.js").PresenceMeshDeltaEvent} ev
 * @param {{ walGeometry?: boolean, nowMs?: number }} [opts]
 */
export function ingestPresenceMeshDeltaWithWalAuthorityV0(getState, setState, ev, opts = {}) {
  const causal = ingestPresenceMeshDelta(ev);
  if (opts.walGeometry === false) {
    return { causal, wal: null };
  }

  const roomScope = String(ev?.roomUid || "").trim();
  if (roomScope) {
    grantRosAuthorityLeaseV0(roomScope, "castle:mesh:gateway", 120_000);
  }

  const hint = extractWalGeometryFromMeshDeltaV0(ev);
  if (!hint.kind) {
    return { causal, wal: { skipped: true, reason: "no_geometry_hint" } };
  }

  const frameId = `mesh:${ev.seq}:${roomScope}`;
  let wal;
  if (hint.kind === "scene") {
    wal = ingestGltfSceneGraphStreamOnKernelV0(getState, setState, {
      roomScope,
      gltfOrNodes: hint.payload,
      frameId
    });
  } else if (hint.kind === "obstacle") {
    wal = ingestObstacleStreamFrameOnKernelV0(
      getState,
      setState,
      {
        frameId,
        roomScope,
        delta: hint.payload,
        signed: true
      },
      { forceDrain: opts.forceDrain, nowMs: opts.nowMs }
    );
  }

  return { causal, wal };
}
