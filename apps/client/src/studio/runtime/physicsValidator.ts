/**
 * PhysicsValidator v1 — constraint gate between Intent and causal append.
 * (1) feasibility — bounds
 * (2) causal consistency — entity + genesis projection present
 * (3) projection predict — pure forward model (never reads projection cache)
 * (4) spatial broad-phase — hash grid candidate reduction + narrow separation
 */

import type {
  EntityMoveIntent,
  EntityPos3,
  EntityProjection,
  PhysicsValidationResult,
  StudioKernelState
} from "../types/rskOntology.js";
import { applyPhysicsPatch, projectEntity } from "./projectionReducer";
import {
  buildSpatialRegistryFromPositions,
  collectCandidateEntityUids,
  DEFAULT_SPATIAL_BUCKET_SIZE
} from "./spatialRegistry.js";

export interface MoveBounds {
  min: EntityPos3;
  max: EntityPos3;
}

export const DEFAULT_MOVE_BOUNDS: MoveBounds = {
  min: { x: -256, y: -64, z: -256 },
  max: { x: 256, y: 256, z: 256 }
};

function inBounds(p: EntityPos3, b: MoveBounds): boolean {
  return p.x >= b.min.x && p.x <= b.max.x && p.y >= b.min.y && p.y <= b.max.y && p.z >= b.min.z && p.z <= b.max.z;
}

function dist3(a: EntityPos3, b: EntityPos3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function normalize3(v: EntityPos3): EntityPos3 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  if (len < 1e-9) return { x: 0, y: 1, z: 0 };
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

function clonePredicted(cur: EntityProjection, nextPhysical: ReturnType<typeof applyPhysicsPatch>): EntityProjection {
  return {
    ...cur,
    state: {
      ...cur.state,
      physical: nextPhysical
    }
  };
}

function buildProjectionPositionIndex(
  state: StudioKernelState,
  branchId: string
): { rows: { entityUid: string; pos: EntityPos3 }[]; tick: number } {
  const tick = state.worldPhysics.globalTick;
  const rows: { entityUid: string; pos: EntityPos3 }[] = [];
  for (const uid of Object.keys(state.registry.entity)) {
    const soulUid = state.registry.entity[uid]?.soulUid;
    const p = projectEntity(state.registry.causalGraph, uid, branchId, { soulUid });
    if (!p.genesisNodeId) continue;
    rows.push({ entityUid: uid, pos: { ...p.state.physical.pos } });
  }
  return { rows, tick };
}

/**
 * Validates a move intent; `predictedProjection` is a pure preview (graph unchanged).
 * On narrow-phase co-presence violation, returns `collisionResolution` for causal artifact emission.
 */
export function validateMoveIntent(
  state: StudioKernelState,
  intent: EntityMoveIntent,
  branchId: string,
  opts?: {
    bounds?: MoveBounds;
    minSeparation?: number;
    bucketSize?: number;
  }
): PhysicsValidationResult {
  const trace: string[] = [];
  const bounds = opts?.bounds ?? DEFAULT_MOVE_BOUNDS;
  const minSep = opts?.minSeparation ?? 0.25;
  const bucketSize = opts?.bucketSize ?? DEFAULT_SPATIAL_BUCKET_SIZE;

  if (!state.registry.entity[intent.entityUid]) {
    trace.push("feasibility:entity_missing");
    return { ok: false, rejectionTrace: trace };
  }
  trace.push("feasibility:entity_exists");

  const soulUid = state.registry.entity[intent.entityUid]?.soulUid;
  const cur = projectEntity(state.registry.causalGraph, intent.entityUid, branchId, { soulUid });
  if (!cur.genesisNodeId) {
    trace.push("causal:no_genesis_projection");
    return { ok: false, rejectionTrace: trace };
  }
  trace.push("causal:genesis_ok");

  const nextPos: EntityPos3 = {
    x: cur.state.physical.pos.x + intent.dpos.x,
    y: cur.state.physical.pos.y + intent.dpos.y,
    z: cur.state.physical.pos.z + intent.dpos.z
  };
  if (!inBounds(nextPos, bounds)) {
    trace.push("feasibility:bounds_violation");
    return { ok: false, rejectionTrace: trace };
  }
  trace.push("feasibility:in_bounds");

  const { rows, tick } = buildProjectionPositionIndex(state, branchId);
  const spatial = buildSpatialRegistryFromPositions(rows, tick, bucketSize);
  trace.push("spatial:index_built");

  const candidates = collectCandidateEntityUids(spatial, nextPos, intent.entityUid, bucketSize);
  trace.push(`spatial:candidates=${candidates.length}`);

  for (const otherUid of candidates) {
    const otherSoul = state.registry.entity[otherUid]?.soulUid;
    const other = projectEntity(state.registry.causalGraph, otherUid, branchId, { soulUid: otherSoul });
    if (!other.genesisNodeId) continue;
    const d = dist3(nextPos, other.state.physical.pos);
    if (d < minSep) {
      const motion = normalize3({
        x: intent.dpos.x,
        y: intent.dpos.y,
        z: intent.dpos.z
      });
      trace.push("narrow:overlap");
      trace.push(`collision_co_presence:STOP:${otherUid}`);
      return {
        ok: false,
        rejectionTrace: trace,
        collisionResolution: {
          targetEntityUid: otherUid,
          impactVector: motion,
          resolutionType: "STOP"
        }
      };
    }
  }
  trace.push("collision:clear");

  const nextPhys = applyPhysicsPatch(cur.state.physical, {
    pos: { x: nextPos.x, y: nextPos.y, z: nextPos.z }
  });
  const predicted = clonePredicted(cur, nextPhys);
  trace.push("validated_ok");
  return { ok: true, rejectionTrace: trace, predictedProjection: predicted };
}
