import { describe, it, expect, beforeEach } from "vitest";
import { buildT0UnifiedPresenceFrameV0 } from "../rhizohT0UnifiedPresenceFrameV0.js";
import {
  buildSurfaceBindingsV0,
  resetRhizohSurfaceBindingsForTestV0,
  RSBL_SURFACE_ID_V0
} from "../rhizohSurfaceBindingLayerV0.js";
import {
  buildSurfaceSingularityV0,
  enforceSurfaceSingularityV0,
  readSurfaceProjectionV0,
  resetRhizohSurfaceSingularityForTestV0,
  SSL_SURFACE_ID_V0,
  SSL_NOW_SOURCE_V0
} from "../rhizohSurfaceSingularityLayerV0.js";

describe("rhizohSurfaceSingularityLayerV0", () => {
  beforeEach(() => {
    resetRhizohSurfaceBindingsForTestV0();
    resetRhizohSurfaceSingularityForTestV0();
    window.__rhizoh = {};
  });

  it("binds all surfaces to T0 now source", () => {
    const frame = buildT0UnifiedPresenceFrameV0(
      { rhizoh_is_present: true, silence_form: "listening", rhizoh_attention: "focused" },
      { orbModulation: { breathe: true, intensity01: 0.7 }, transitionFeel: {} },
      null,
      1_700_000_000_000
    );
    const bindings = buildSurfaceBindingsV0(frame, null, null);
    const ssl = buildSurfaceSingularityV0(frame, bindings);

    expect(ssl.now_source).toBe(SSL_NOW_SOURCE_V0);
    expect(ssl.isolation_forbidden).toBe(true);
    expect(ssl.surfaces[RSBL_SURFACE_ID_V0.CESIUM]?.bound).toBe(true);
    expect(ssl.surfaces[SSL_SURFACE_ID_V0.UI_DRAWER]?.bound).toBe(true);
    expect(ssl.surfaces[SSL_SURFACE_ID_V0.STUDIO]?.bound).toBe(true);
    expect(ssl.surfaces[SSL_SURFACE_ID_V0.PET]?.world_projection).toBe(true);
  });

  it("publishes surfaceSingularity and t0UnifiedFrame alias", () => {
    const frame = buildT0UnifiedPresenceFrameV0(
      { rhizoh_is_present: true, silence_form: "listening", rhizoh_attention: "idle" },
      { orbModulation: {}, transitionFeel: {} },
      null,
      1_700_000_000_001
    );
    const bindings = buildSurfaceBindingsV0(frame, null, null);
    enforceSurfaceSingularityV0(frame, bindings);

    expect(window.__rhizoh.surfaceSingularity.coherence_id).toBeTruthy();
    expect(window.__rhizoh.t0UnifiedFrame.coherenceId).toBe(frame.coherenceId);
    expect(window.__rhizoh.surfaceSingularityAuthority.isolation_forbidden).toBe(true);

    const cap = readSurfaceProjectionV0(RSBL_SURFACE_ID_V0.CAP_WHEEL);
    expect(cap?.coherence_id).toBe(window.__rhizoh.surfaceSingularity.coherence_id);
  });
});
