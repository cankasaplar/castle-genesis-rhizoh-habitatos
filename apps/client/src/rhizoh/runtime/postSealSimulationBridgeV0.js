/**
 * Sprint B — post-seal → simulation injection bridge.
 *
 * **Law:** simulation consumes obstacle authority only after sealer drain (sealed epoch).
 * Never call from WAL ingress or rAF directly.
 */

import { setRealSimulationDiscObstaclesV0 } from "../../studio/lib/realSimulationEngineCouplingV0.ts";
import { defaultWorldAuthorityRuntimeV0 } from "./worldAuthorityRuntimeDefaultsV0.js";

export const POST_SEAL_SIMULATION_BRIDGE_SCHEMA_V0 = "castle.rhizoh.post_seal_simulation_bridge.v0";

/**
 * Stage pending obstacle authority after WAL stream (pre-seal).
 *
 * @param {import("../../studio/types/rskOntology.js").WorldAuthorityRuntimeStateV0} war
 * @param {string} roomScope
 * @param {{ discs: { x: number, z: number, r: number }[], invalidationCellKeys: number[] }} authority
 */
export function stagePendingObstacleAuthorityV0(war, roomScope, authority) {
  const room = String(roomScope || "").trim();
  const base = war ?? defaultWorldAuthorityRuntimeV0();
  return {
    ...base,
    pendingObstaclesByRoomUid: {
      ...base.pendingObstaclesByRoomUid,
      [room]: {
        sealedEpoch: -1,
        discs: authority.discs,
        invalidationCellKeys: authority.invalidationCellKeys
      }
    }
  };
}

/**
 * Promote pending → sealed and inject into real simulation coupling.
 *
 * @param {import("../../studio/types/rskOntology.js").StudioKernelState} kernel
 * @param {string} roomScope
 * @param {number} sealedEpoch
 * @returns {{ ok: boolean, injected: boolean, discCount: number }}
 */
export function applyPostSealSimulationAuthorityV0(kernel, roomScope, sealedEpoch) {
  const room = String(roomScope || "").trim();
  const war = kernel.worldAuthorityRuntime ?? defaultWorldAuthorityRuntimeV0();
  const pending = war.pendingObstaclesByRoomUid[room];
  if (!pending || !pending.discs?.length) {
    return { ok: true, injected: false, discCount: 0 };
  }
  const sealed = {
    sealedEpoch,
    discs: pending.discs,
    invalidationCellKeys: pending.invalidationCellKeys ?? []
  };
  const nextWar = {
    ...war,
    sealedObstacleByRoomUid: { ...war.sealedObstacleByRoomUid, [room]: sealed },
    pendingObstaclesByRoomUid: { ...war.pendingObstaclesByRoomUid }
  };
  delete nextWar.pendingObstaclesByRoomUid[room];

  setRealSimulationDiscObstaclesV0(sealed.discs);
  return {
    ok: true,
    injected: true,
    discCount: sealed.discs.length,
    invalidationCells: sealed.invalidationCellKeys.length,
    worldAuthorityRuntime: nextWar
  };
}

/**
 * @param {() => import("../../studio/types/rskOntology.js").StudioKernelState} getState
 * @param {(next: import("../../studio/types/rskOntology.js").StudioKernelState) => void} setState
 * @param {{ sealed: boolean, seal: import("../../studio/types/rskOntology.js").RealitySealLayerState, roomScope?: string }} tickResult
 */
export function maybeApplyPostSealBridgeOnKernelV0(getState, setState, tickResult) {
  if (!tickResult?.sealed || tickResult.sealed < 1) {
    return { applied: false };
  }
  const kernel = getState();
  const room =
    String(tickResult.roomScope || "").trim() ||
    Object.keys(kernel.worldAuthorityRuntime?.pendingObstaclesByRoomUid ?? {})[0] ||
    "";
  if (!room) return { applied: false };
  const r = applyPostSealSimulationAuthorityV0(kernel, room, tickResult.seal.realityEpoch);
  if (r.worldAuthorityRuntime) {
    setState({ ...getState(), worldAuthorityRuntime: r.worldAuthorityRuntime });
  }
  return { applied: r.injected, ...r };
}
