import { describe, expect, it, beforeEach } from "vitest";
import {
  buildSurfaceBindingsV0,
  RSBL_SURFACE_ID_V0,
  RSBL_SURFACE_ROLE_V0,
  syncRhizohSurfaceBindingsV0,
  resetRhizohSurfaceBindingsForTestV0
} from "../rhizohSurfaceBindingLayerV0.js";
import { buildT0UnifiedPresenceFrameV0 } from "../rhizohT0UnifiedPresenceFrameV0.js";
import { resolveReslPresentationV0 } from "../rhizohReslPresentationPolicyV0.js";
import { deriveRhizohPresenceStateV0, resetFelFailureExpressionForTestV0 } from "../rhizohPresenceStateEngineV0.js";
import { resetT0UnifiedPresenceFrameForTestV0 } from "../rhizohT0UnifiedPresenceFrameV0.js";

describe("rhizohSurfaceBindingLayerV0", () => {
  beforeEach(() => {
    resetRhizohSurfaceBindingsForTestV0();
    resetT0UnifiedPresenceFrameForTestV0();
    resetFelFailureExpressionForTestV0();
    if (typeof window !== "undefined") window.__rhizoh = {};
  });

  it("binds all surfaces to same coherence from T0 frame", () => {
    const p = deriveRhizohPresenceStateV0({ shellMounted: true, nowMs: 1000, lastUserActivityMs: 990 });
    const resl = resolveReslPresentationV0(p, { nowMs: 1000 });
    const frame = buildT0UnifiedPresenceFrameV0(p, resl, null, 1000);
    const bindings = buildSurfaceBindingsV0(frame, resl, null);
    expect(bindings.temporal_authority).toBe("t0_presence_frame");
    expect(bindings.surfaces[RSBL_SURFACE_ID_V0.CESIUM].role).toBe(RSBL_SURFACE_ROLE_V0.PROJECTION);
    expect(bindings.surfaces[RSBL_SURFACE_ID_V0.T0_STRIP].role).toBe(RSBL_SURFACE_ROLE_V0.TRUTH);
    expect(bindings.surfaces[RSBL_SURFACE_ID_V0.CESIUM].breathe01).toBe(frame.breathe01);
  });

  it("publishes to window surfaceBindings", () => {
    const p = deriveRhizohPresenceStateV0({ shellMounted: true, nowMs: 0 });
    const resl = resolveReslPresentationV0(p, { nowMs: 0 });
    const frame = buildT0UnifiedPresenceFrameV0(p, resl, null, 0);
    syncRhizohSurfaceBindingsV0(frame, resl, null);
    expect(window.__rhizoh.surfaceBindings.coherence_id).toBeTruthy();
    expect(window.__rhizoh.surfaceBindingAuthority.truth).toBe("t0_presence_frame");
  });
});
