/**
 * Pure composition: kernel outputs → single bridge frame descriptor + fingerprint.
 */

import { packBranchSegmentsForGpu } from "./branchBufferUploader.js";

/**
 * Single source of truth: prefer explicit regionalMap, then regionalSamples Map.
 * @param {object} input
 * @returns {Map<string, import("../kernel/render/fieldAtlasBuilder.js").FieldSample>}
 */
export function resolveCanonicalRegionalMap(input) {
  if (input.regionalMap instanceof Map && input.regionalMap.size > 0) {
    return new Map(input.regionalMap);
  }
  if (input.regionalSamples instanceof Map && input.regionalSamples.size > 0) {
    return new Map(input.regionalSamples);
  }
  return new Map();
}

/**
 * @param {Map<string, import("../kernel/render/fieldAtlasBuilder.js").FieldSample>} map
 */
function hashRegionalMapSample(map) {
  let h = 2166136261;
  const keys = Array.from(map.keys()).sort();
  for (const k of keys) {
    const v = map.get(k);
    for (let i = 0; i < k.length; i++) {
      h ^= k.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    const pm = v?.pressureMean || [];
    for (let i = 0; i < 5; i++) {
      h ^= ((pm[i] ?? 0) * 1e6) >>> 0;
      h = Math.imul(h, 16777619) >>> 0;
    }
    const be = v?.branchEntropy ?? 0;
    const cs = v?.conflictSeverity ?? 0;
    h ^= ((be + cs) * 1e6) >>> 0;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function frameFingerprintFnv(texels, branchPacked, epochHash, regionalMapHash) {
  const head = epochHash || "";
  let h = 2166136261;
  for (let i = 0; i < head.length; i++) {
    h ^= head.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  h ^= regionalMapHash >>> 0;
  h = Math.imul(h, 16777619) >>> 0;
  const n = Math.min(texels?.length ?? 0, 64);
  for (let i = 0; i < n; i++) {
    const x = texels[i];
    const u = new Float32Array(1);
    u[0] = x;
    const b = new Uint8Array(u.buffer);
    for (let j = 0; j < 4; j++) {
      h ^= b[j];
      h = Math.imul(h, 16777619) >>> 0;
    }
  }
  for (let i = 0; i < (branchPacked?.length ?? 0); i++) {
    h ^= (branchPacked[i] * 1000000) >>> 0;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return `0x${h.toString(16)}`;
}

/**
 * @param {object} input
 * @param {import("../kernel/render/fieldAtlasBuilder.js").FieldAtlas} [input.atlas] from buildFieldAtlas
 * @param {Map<string, import("../kernel/render/fieldAtlasBuilder.js").FieldSample>} [input.regionalMap] canonical regional field (preferred)
 * @param {Map<string, unknown> | unknown[]} [input.regionalSamples] legacy alias; used only if regionalMap empty
 * @param {import("../kernel/render/branchRiverRenderer.js").BranchRiverSegment[]} [input.branchSegments]
 * @param {Record<string, number>} [input.weatherSummary]
 * @param {string} [input.epochHash]
 * @param {number[] | null} [input.dirtyCellIndices]
 * @param {Partial<{ tier: string, drift: number, discomfort: number, legitimacyResonance: number, mutation: "pending" | "sealed" }>} [input.rhizohSovereign]
 */
export function composeFieldFrame(input) {
  const atlas = input.atlas;
  const branchPacked = packBranchSegmentsForGpu(input.branchSegments || []);
  const regionalMap = resolveCanonicalRegionalMap(input);
  const regionalCount = regionalMap.size;
  const regionalMapHash = hashRegionalMapSample(regionalMap);

  const rhizohSovereign = Object.freeze({
    tier: "L1",
    drift: 0.08,
    discomfort: 0.12,
    legitimacyResonance: 0.72,
    mutation: /** @type {"pending" | "sealed"} */ ("sealed"),
    ...(input.rhizohSovereign && typeof input.rhizohSovereign === "object" ? input.rhizohSovereign : {})
  });

  const overlayState = Object.freeze({
    epochHash: input.epochHash ?? null,
    regionalCount,
    weatherSummary: input.weatherSummary ? { ...input.weatherSummary } : {},
    cellCount: atlas?.cellCount ?? 0,
    branchSegmentCount: input.branchSegments?.length ?? 0,
    rhizohSovereign,
    layerC: Object.freeze({
      hints: ["user_node", "personal_orb", "cluster_orb", "sovereign_orb", "ghost_lineage", "collapsed_branch_artifact"]
    })
  });

  const frameFingerprint = frameFingerprintFnv(
    atlas?.texels ?? new Float32Array(0),
    branchPacked,
    input.epochHash,
    regionalMapHash
  );

  return Object.freeze({
    atlas,
    branchPacked,
    regionalMap,
    overlayState,
    frameFingerprint,
    dirtyCellIndices: input.dirtyCellIndices ?? null
  });
}
