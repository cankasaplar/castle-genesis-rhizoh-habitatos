/**
 * Spatial Registry v1 — deterministic broad-phase (hash grid) over projected positions.
 * Index is derived; causal graph + projection fold remain source of truth.
 */

import type { EntityPos3, SpatialBucket, SpatialRegistry } from "../types/rskOntology";

export const DEFAULT_SPATIAL_BUCKET_SIZE = 1;

const BUCKET_ID_RE = /^b:(-?\d+):(-?\d+):(-?\d+)$/;

export function getSpatialBucketId(pos: EntityPos3, bucketSize: number = DEFAULT_SPATIAL_BUCKET_SIZE): string {
  const gx = Math.floor(pos.x / bucketSize);
  const gy = Math.floor(pos.y / bucketSize);
  const gz = Math.floor(pos.z / bucketSize);
  return `b:${gx}:${gy}:${gz}`;
}

export function parseSpatialBucketId(bucketId: string): { gx: number; gy: number; gz: number } | null {
  const m = bucketId.match(BUCKET_ID_RE);
  if (!m) return null;
  return { gx: Number(m[1]), gy: Number(m[2]), gz: Number(m[3]) };
}

/** 3×3×3 neighborhood (27 cells) for broad-phase candidate union. */
export function getNeighborBucketIds(bucketId: string): string[] {
  const p = parseSpatialBucketId(bucketId);
  if (!p) return [];
  const { gx, gy, gz } = p;
  const out: string[] = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dz = -1; dz <= 1; dz++) {
        out.push(`b:${gx + dx}:${gy + dy}:${gz + dz}`);
      }
    }
  }
  return out;
}

export function buildSpatialRegistryFromPositions(
  rows: ReadonlyArray<{ entityUid: string; pos: EntityPos3 }>,
  tick: number,
  bucketSize: number = DEFAULT_SPATIAL_BUCKET_SIZE
): SpatialRegistry {
  const buckets: Record<string, SpatialBucket> = {};
  for (const row of rows) {
    const id = getSpatialBucketId(row.pos, bucketSize);
    const gx = Math.floor(row.pos.x / bucketSize);
    const gy = Math.floor(row.pos.y / bucketSize);
    const gz = Math.floor(row.pos.z / bucketSize);
    if (!buckets[id]) {
      buckets[id] = {
        id,
        gridX: gx,
        gridY: gy,
        gridZ: gz,
        entityIds: [],
        lastUpdatedTick: tick
      };
    }
    const b = buckets[id];
    b.lastUpdatedTick = tick;
    if (!b.entityIds.includes(row.entityUid)) b.entityIds.push(row.entityUid);
  }
  return { buckets };
}

/** Broad-phase: entity uids in center bucket ∪ 26 neighbors of `pos` (excludes `excludeUid`). */
export function collectCandidateEntityUids(
  registry: SpatialRegistry,
  pos: EntityPos3,
  excludeUid: string,
  bucketSize: number = DEFAULT_SPATIAL_BUCKET_SIZE
): string[] {
  const center = getSpatialBucketId(pos, bucketSize);
  const out = new Set<string>();
  for (const bid of getNeighborBucketIds(center)) {
    const bucket = registry.buckets[bid];
    if (!bucket) continue;
    for (const uid of bucket.entityIds) {
      if (uid !== excludeUid) out.add(uid);
    }
  }
  return [...out];
}
