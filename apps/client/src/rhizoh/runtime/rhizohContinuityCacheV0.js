/**
 * Continuity buffer — last N MF-0 frames (lightweight lens, no CLAG traversal).
 */

import { collapseMeaningFrameV0 } from "./rhizohMeaningFrameV0.js";

export const RHIZOH_CONTINUITY_CACHE_SCHEMA_V0 = "castle.rhizoh.continuity_cache.v0";
export const RHIZOH_CONTINUITY_CACHE_MAX_FRAMES_V0 = 7;

/** @type {object[]} */
const frameRingV0 = [];

/**
 * @param {ReturnType<import("./rhizohMeaningFrameV0.js").extractMeaningFrameV0>} mf
 */
export function pushContinuityFrameV0(mf) {
  if (!mf || typeof mf !== "object") return;
  frameRingV0.push(
    Object.freeze({
      atMs: Date.now(),
      traceId: mf.traceId ?? null,
      collapsed: collapseMeaningFrameV0(mf),
      intent: mf.intent,
      depth: mf.depth,
      continuityHook: mf.continuityHook,
      unresolvedThreads: mf.unresolvedThreads
    })
  );
  while (frameRingV0.length > RHIZOH_CONTINUITY_CACHE_MAX_FRAMES_V0) {
    frameRingV0.shift();
  }
}

export function getContinuityCacheSnapshotV0() {
  return Object.freeze({
    schema: RHIZOH_CONTINUITY_CACHE_SCHEMA_V0,
    frameCount: frameRingV0.length,
    frames: Object.freeze(frameRingV0.map((f) => f.collapsed)),
    lastIntent: frameRingV0.length ? frameRingV0[frameRingV0.length - 1].intent : null,
    openThreadCount: frameRingV0.length
      ? frameRingV0[frameRingV0.length - 1].unresolvedThreads?.length || 0
      : 0
  });
}

export function getLastContinuityFrameV0() {
  return frameRingV0.length ? frameRingV0[frameRingV0.length - 1] : null;
}

/**
 * @param {ReturnType<import("./rhizohMeaningFrameV0.js").extractMeaningFrameV0>} mf
 */
export function priorThreadsFromContinuityCacheV0(mf) {
  const threads = [];
  for (const f of frameRingV0) {
    if (f.unresolvedThreads?.length) threads.push(...f.unresolvedThreads);
  }
  if (mf?.unresolvedThreads?.length) threads.push(...mf.unresolvedThreads);
  return [...new Set(threads)].slice(0, 5);
}

export function resetContinuityCacheV0() {
  frameRingV0.length = 0;
}
