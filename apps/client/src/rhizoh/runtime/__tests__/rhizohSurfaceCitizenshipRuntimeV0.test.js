import { describe, it, expect, beforeEach } from "vitest";
import { buildT0UnifiedPresenceFrameV0 } from "../rhizohT0UnifiedPresenceFrameV0.js";
import {
  buildSurfaceBindingsV0,
  resetRhizohSurfaceBindingsForTestV0,
  RSBL_SURFACE_ID_V0
} from "../rhizohSurfaceBindingLayerV0.js";
import {
  enforceSurfaceSingularityV0,
  resetRhizohSurfaceSingularityForTestV0
} from "../rhizohSurfaceSingularityLayerV0.js";
import {
  assertReverseOwnershipV0,
  buildSurfaceCitizenshipV0,
  publishSurfaceCitizenshipV0,
  readCitizenProjectionV0,
  readCapWheelCitizenPulseV0,
  resetRhizohSurfaceCitizenshipForTestV0,
  SCR_VIOLATION_CODE_V0
} from "../rhizohSurfaceCitizenshipRuntimeV0.js";

describe("rhizohSurfaceCitizenshipRuntimeV0", () => {
  beforeEach(() => {
    resetRhizohSurfaceBindingsForTestV0();
    resetRhizohSurfaceSingularityForTestV0();
    resetRhizohSurfaceCitizenshipForTestV0();
    window.__rhizoh = {};
  });

  it("publishes citizens with reverse ownership", () => {
    const frame = buildT0UnifiedPresenceFrameV0(
      { rhizoh_is_present: true, silence_form: "listening", rhizoh_attention: "focused" },
      { orbModulation: { breathe: true, intensity01: 0.8 }, transitionFeel: {} },
      null,
      1_700_000_000_100
    );
    const bindings = buildSurfaceBindingsV0(frame, null, null);
    const ssl = enforceSurfaceSingularityV0(frame, bindings);
    publishSurfaceCitizenshipV0(ssl);

    expect(window.__rhizoh.surfaceCitizenshipAuthority.projection_only).toBe(true);
    const cap = readCitizenProjectionV0(RSBL_SURFACE_ID_V0.CAP_WHEEL);
    expect(cap?.bound).toBe(true);
    expect(readCapWheelCitizenPulseV0()).toBeGreaterThanOrEqual(0);
  });

  it("records violation on external pulse override", () => {
    const v = assertReverseOwnershipV0(RSBL_SURFACE_ID_V0.CAP_WHEEL, { externalPulse: 0.9 });
    expect(v?.code).toBe(SCR_VIOLATION_CODE_V0.EXTERNAL_PULSE);
  });

  it("builds citizenship manifest from SSL", () => {
    const frame = buildT0UnifiedPresenceFrameV0(
      { rhizoh_is_present: true, silence_form: "listening", rhizoh_attention: "idle" },
      { orbModulation: {}, transitionFeel: {} },
      null,
      1_700_000_000_200
    );
    const bindings = buildSurfaceBindingsV0(frame, null, null);
    const ssl = enforceSurfaceSingularityV0(frame, bindings);
    const citizenship = buildSurfaceCitizenshipV0(ssl);
    expect(citizenship.ownership.reverse).toBe(true);
    expect(citizenship.citizens[RSBL_SURFACE_ID_V0.CESIUM].owns_clock).toBe(false);
  });
});
