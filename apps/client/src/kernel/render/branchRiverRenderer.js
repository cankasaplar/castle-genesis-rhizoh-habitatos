/**
 * vNext-538 — Layer B: branch “river” segments for lineage visualization (pure geometry hints).
 */

import { clamp01 } from "../constitutional/constitutionalState.js";

/**
 * @typedef {object} BranchRiverSegment
 * @property {string} fromHash
 * @property {string} toHash
 * @property {"fork" | "merge" | "pruned" | "mainline"} kind
 * @property {number} strength
 */

/**
 * @param {object} o
 * @param {string} o.parentEpochHash
 * @param {{ epochHash: string, lineageBranchId?: string }[]} o.children
 * @param {{ mergeAncestry?: string[] } | null} [o.mergeMeta]
 * @param {string[]} [o.prunedHashes]
 */
export function buildBranchRiverSegments(o) {
  /** @type {BranchRiverSegment[]} */
  const segs = [];
  for (const ch of o.children || []) {
    segs.push({
      fromHash: o.parentEpochHash,
      toHash: ch.epochHash,
      kind: "fork",
      strength: clamp01(0.55 + (ch.lineageBranchId && ch.lineageBranchId !== "main" ? 0.25 : 0))
    });
  }
  if (o.mergeMeta?.mergeAncestry?.length) {
    const [a, b] = o.mergeMeta.mergeAncestry;
    segs.push({
      fromHash: a,
      toHash: b,
      kind: "merge",
      strength: 0.9
    });
  }
  for (const h of o.prunedHashes || []) {
    segs.push({
      fromHash: o.parentEpochHash,
      toHash: h,
      kind: "pruned",
      strength: 0.35
    });
  }
  return Object.freeze(segs);
}
