/**
 * vNext-536 — Explicit fork header for epistemic worldlines (same parent, divergent branch id).
 */

/**
 * @param {object} o
 * @param {string} o.parentEpochHash
 * @param {string} o.branchId e.g. fork-A, experiment-7
 */
export function createLineageFork(o) {
  return Object.freeze({
    parentEpochHash: o.parentEpochHash,
    lineageBranchId: o.branchId,
    forkKind: "constitutional_worldline"
  });
}
