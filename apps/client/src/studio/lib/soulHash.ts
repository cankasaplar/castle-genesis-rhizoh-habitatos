/**
 * Continuity fingerprint for Soul.continuityHash — v0 local digest.
 * Later: mind/entity/memory milestone events fed from gateway.
 */
export function computeSoulContinuityHash(parts: {
  mindUids: string[];
  entityUids: string[];
  milestones: string[];
}): string {
  const s = [...parts.mindUids, ...parts.entityUids, ...parts.milestones].sort().join("|");
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `c0-${(h >>> 0).toString(16).padStart(8, "0")}`;
}
