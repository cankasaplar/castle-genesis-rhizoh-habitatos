/**
 * Simulation completion: determinism hash, prediction, desync blend, rollback queue helpers.
 */

import type { RollbackQueueV0 } from "./fixedTimestepIntegratorV0";
import { pushRollbackQueueV0 } from "./fixedTimestepIntegratorV0";

export const SIMULATION_COMPLETION_LAYER_SCHEMA_V0 = "castle.rhizoh.simulation_completion_layer.v0";

export function fnv1aHash32HexV0(input: string): string {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function hashPetTransformsDeterminismV0(
  globalTick: number,
  pets: Record<string, { transform?: { x: number; y: number; z: number; rotY: number } } | undefined>
): string {
  const keys = Object.keys(pets).sort();
  const parts: string[] = [`t=${globalTick}`];
  for (const k of keys) {
    const tr = pets[k]?.transform;
    if (!tr) continue;
    parts.push(`${k}:${tr.x.toFixed(4)},${tr.y.toFixed(4)},${tr.z.toFixed(4)},${tr.rotY.toFixed(4)}`);
  }
  return fnv1aHash32HexV0(parts.join("|"));
}

export function extrapolateXZLinearV0(
  pos: { x: number; z: number },
  vel: { x: number; z: number },
  frames: number,
  fixedDtSec: number
): { x: number; z: number } {
  const s = frames * fixedDtSec;
  return { x: pos.x + vel.x * s, z: pos.z + vel.z * s };
}

export function blendXZTowardAuthorityV0(
  local: { x: number; z: number },
  authority: { x: number; z: number },
  alpha: number
): { x: number; z: number } {
  const a = Math.min(1, Math.max(0, alpha));
  return { x: local.x + (authority.x - local.x) * a, z: local.z + (authority.z - local.z) * a };
}

export function recordRollbackPetTransformsV0(
  queue: RollbackQueueV0<Record<string, { x: number; y: number; z: number; rotY: number }>>,
  pets: Record<string, { transform?: { x: number; y: number; z: number; rotY: number } } | undefined>
): void {
  const snap: Record<string, { x: number; y: number; z: number; rotY: number }> = {};
  for (const [uid, p] of Object.entries(pets)) {
    const t = p?.transform;
    if (!t) continue;
    snap[uid] = { x: t.x, y: t.y, z: t.z, rotY: t.rotY };
  }
  pushRollbackQueueV0(queue, snap);
}
