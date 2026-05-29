/**
 * Sprint B — real scene graph streaming (glTF / live mesh → WAL stream).
 */

import { ingestSceneGraphDiffFrameOnKernelV0 } from "./worldAuthorityStreamIngressV0.js";
import { defaultWorldAuthorityRuntimeV0 } from "./worldAuthorityRuntimeDefaultsV0.js";

export const SCENE_GRAPH_STREAM_SCHEMA_V0 = "castle.rhizoh.scene_graph_stream.v0";

/**
 * Normalize glTF JSON or flat node list into scene graph nodes.
 *
 * @param {unknown} input
 * @returns {import("../../studio/types/rskOntology.js").SceneGraphNodeV0[]}
 */
export function normalizeGltfSceneNodesV0(input) {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input
      .map((n, i) => {
        const o = /** @type {Record<string, unknown>} */ (n);
        const nodeUid = String(o.nodeUid ?? o.name ?? o.uid ?? `node:${i}`);
        return {
          nodeUid,
          parentUid: typeof o.parentUid === "string" ? o.parentUid : undefined,
          meshUid: typeof o.meshUid === "string" ? o.meshUid : undefined,
          transform:
            o.transform && typeof o.transform === "object"
              ? /** @type {import("../../studio/types/rskOntology.js").SceneGraphNodeV0["transform"]} */ (
                  o.transform
                )
              : undefined,
          bounds:
            o.bounds && typeof o.bounds === "object"
              ? /** @type {import("../../studio/types/rskOntology.js").SceneGraphNodeV0["bounds"]} */ (o.bounds)
              : undefined
        };
      })
      .filter((n) => n.nodeUid);
  }
  const root = /** @type {Record<string, unknown>} */ (input);
  const nodesArr = root.nodes;
  if (!Array.isArray(nodesArr)) return [];
  return normalizeGltfSceneNodesV0(nodesArr);
}

/**
 * @param {import("../../studio/types/rskOntology.js").WorldAuthorityRuntimeStateV0} war
 * @param {string} roomScope
 * @param {import("../../studio/types/rskOntology.js").SceneGraphNodeV0[]} nodes
 * @param {{ sourceUrl?: string, nowMs?: number }} [opts]
 */
export function applySceneGraphCacheUpdateV0(war, roomScope, nodes, opts = {}) {
  const room = String(roomScope || "").trim();
  const base = war ?? defaultWorldAuthorityRuntimeV0();
  const prev = base.sceneGraphByRoomUid[room];
  const revision = (prev?.revision ?? 0) + 1;
  const nodeMap = Object.fromEntries(nodes.map((n) => [n.nodeUid, n]));
  return {
    ...base,
    sceneGraphByRoomUid: {
      ...base.sceneGraphByRoomUid,
      [room]: {
        revision,
        nodes: nodeMap,
        sourceUrl: opts.sourceUrl,
        updatedAtMs: Number(opts.nowMs) || Date.now()
      }
    }
  };
}

/**
 * Ingest glTF / live mesh scene graph — updates cache + WAL scene_chunk stream (no direct epoch).
 *
 * @param {() => import("../../studio/types/rskOntology.js").StudioKernelState} getState
 * @param {(next: import("../../studio/types/rskOntology.js").StudioKernelState) => void} setState
 * @param {{ roomScope: string, gltfOrNodes: unknown, sourceUrl?: string, frameId?: string }} input
 * @param {{ nowMs?: number, persist?: boolean }} [opts]
 */
export function ingestGltfSceneGraphStreamOnKernelV0(getState, setState, input, opts = {}) {
  const roomScope = String(input?.roomScope || "").trim();
  if (!roomScope) {
    return { ok: false, code: "SCENE_GRAPH_ROOM_REQUIRED" };
  }
  const nodes = normalizeGltfSceneNodesV0(input.gltfOrNodes);
  const nowMs = Number(opts.nowMs) || Date.now();
  const kernel = getState();
  const war = applySceneGraphCacheUpdateV0(kernel.worldAuthorityRuntime, roomScope, nodes, {
    sourceUrl: input.sourceUrl,
    nowMs
  });
  setState({ ...kernel, worldAuthorityRuntime: war });

  const frameId =
    String(input.frameId || "").trim() ||
    `gltf:r${war.sceneGraphByRoomUid[roomScope]?.revision ?? 0}`;
  const stream = ingestSceneGraphDiffFrameOnKernelV0(getState, setState, {
    frameId,
    roomScope,
    chunk: { revision: war.sceneGraphByRoomUid[roomScope]?.revision, nodeCount: nodes.length },
    signed: true
  });
  return {
    ok: stream.ok !== false,
    roomScope,
    nodeCount: nodes.length,
    revision: war.sceneGraphByRoomUid[roomScope]?.revision,
    stream
  };
}

/**
 * Extract spatial hints from presence mesh causal payload → scene or obstacle WAL stream.
 *
 * @param {{ node?: unknown }} ev
 * @returns {{ kind: "scene" | "obstacle" | null, payload: unknown }}
 */
export function extractWalGeometryFromMeshDeltaV0(ev) {
  const node = ev?.node;
  const payload = node && typeof node === "object" ? /** @type {Record<string, unknown>} */ (node).payload : null;
  const delta = payload && typeof payload === "object" ? /** @type {Record<string, unknown>} */ (payload).delta : null;
  const d = delta && typeof delta === "object" ? /** @type {Record<string, unknown>} */ (delta) : null;
  if (!d) return { kind: null, payload: null };
  if (d.sceneGraph || d.gltfNodes || d.meshNodes) {
    return { kind: "scene", payload: d.sceneGraph ?? d.gltfNodes ?? d.meshNodes };
  }
  if (d.obstacles || d.obstacleDelta || d.discs) {
    return { kind: "obstacle", payload: d.obstacles ?? d.obstacleDelta ?? { discs: d.discs } };
  }
  return { kind: null, payload: null };
}
