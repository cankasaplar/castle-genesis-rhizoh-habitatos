/**
 * Catch-up replay guard — suppress live voice, ghost spawns, and spiral handoff
 * while canonical catch-up cascade is replaying past layers.
 */

let catchUpDepthV0 = 0;

/**
 * True when catch-up cascade is actively replaying (not live user interaction).
 */
export function isRhizohCatchUpReplayActiveV0() {
  if (catchUpDepthV0 > 0) return true;
  if (typeof window !== "undefined" && window.__rhizoh?.catchUpCascade?.active === true) {
    return true;
  }
  return false;
}

/**
 * Increment/decrement catch-up depth (supports nested catch-up calls).
 * @param {boolean} active
 */
export function setRhizohCatchUpReplayActiveV0(active) {
  if (active) {
    catchUpDepthV0 += 1;
  } else {
    catchUpDepthV0 = Math.max(0, catchUpDepthV0 - 1);
  }
}

/** @internal vitest */
export function __resetRhizohCatchUpGuardForTestV0() {
  catchUpDepthV0 = 0;
  if (typeof window !== "undefined" && window.__rhizoh?.catchUpCascade) {
    delete window.__rhizoh.catchUpCascade;
  }
}
