import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { bootRhizohOsStabilReleaseLayerV0 } from "../rhizohOsStabilReleaseLayerV0.js";
import { __resetClusterCivilizationForTestV0 } from "../rhizohClusterCivilizationV0.js";
import { RHIZOH_INTENT_CLUSTER_MAX_SIZE_V0 } from "../rhizohClusterEcologyLockV0.js";

describe("rhizohOsStabilReleaseLayerV0", () => {
  /** @type {(() => void) | undefined} */
  let dispose;

  beforeEach(() => {
    import.meta.env.DEV = false;
    import.meta.env.VITE_DEBUG = "0";
    import.meta.env.VITE_RHIZOH_KERNEL_TRACE_DEBUG = "0";
    __resetClusterCivilizationForTestV0();
  });

  afterEach(() => {
    dispose?.();
    dispose = undefined;
    __resetClusterCivilizationForTestV0();
  });

  it("boots cluster ecology with locked max size and hides kernel trace", () => {
    dispose = bootRhizohOsStabilReleaseLayerV0();
    expect(RHIZOH_INTENT_CLUSTER_MAX_SIZE_V0).toBe(64);
    expect(window.__RHIZOH_CONTEXT_INTENT__).toBeUndefined();
    expect(window.__RHIZOH_OS_STABIL_RELEASE__).toBeUndefined();
  });
});
