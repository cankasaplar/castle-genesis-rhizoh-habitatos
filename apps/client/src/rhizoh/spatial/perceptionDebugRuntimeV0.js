/**
 * Perception debug runtime (v0) — yalnızca `VITE_RHIZOH_PERCEPTION_DEBUG=1` iken.
 *
 * Cesium `postRender` ile salt okunur gözlem → `perceptionDebugStoreV0`.
 * **worldPresence / projection smoothing / truth pipeline’a bağlanmaz.**
 *
 * @see perceptionSignalV0.js
 * @see perceptionDebugStoreV0.js
 */

import { observePerceptionSignalFromCesiumV0 } from "./perceptionSignalV0.js";
import { setPerceptionDebugSnapshotV0 } from "./perceptionDebugStoreV0.js";
import { isCastleDebugGranularFlagEnabled } from "../runtime/castleDebugGateV0.js";

function perceptionDebugEnabledV0() {
  return isCastleDebugGranularFlagEnabled("VITE_RHIZOH_PERCEPTION_DEBUG");
}

/**
 * @param {import("cesium").Viewer} viewer
 * @param {typeof import("cesium")} Cesium
 * @param {() => number | undefined} [getExpectedLocalFog] — projection ile karşılaştırma için; yoksa iç varsayılan.
 * @returns {() => void} teardown
 */
export function maybeInstallPerceptionDebugObserverV0(viewer, Cesium, getExpectedLocalFog) {
  if (!perceptionDebugEnabledV0() || !viewer || !Cesium) {
    return () => {};
  }
  if (typeof viewer.isDestroyed === "function" && viewer.isDestroyed()) {
    return () => {};
  }

  let active = true;
  const cb = () => {
    if (!active) return;
    if (typeof viewer.isDestroyed === "function" && viewer.isDestroyed()) return;
    const expected =
      typeof getExpectedLocalFog === "function" ? getExpectedLocalFog() : undefined;
    /** @type {import("./perceptionSignalV0.js").PerceptionSignalContextV0} */
    const ctx = {};
    if (typeof expected === "number" && Number.isFinite(expected)) {
      ctx.expectedLocalFog = expected;
    }
    const sig = observePerceptionSignalFromCesiumV0(viewer, Cesium, ctx);
    setPerceptionDebugSnapshotV0(sig);
  };

  try {
    viewer.scene.postRender.addEventListener(cb);
  } catch {
    return () => {};
  }

  return function teardownPerceptionDebugObserverV0() {
    active = false;
    try {
      viewer.scene?.postRender?.removeEventListener(cb);
    } catch {
      /* noop */
    }
  };
}
