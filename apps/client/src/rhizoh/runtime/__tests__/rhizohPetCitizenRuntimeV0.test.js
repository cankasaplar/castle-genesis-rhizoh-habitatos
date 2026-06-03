import { describe, it, expect, beforeEach } from "vitest";
import { buildT0UnifiedPresenceFrameV0 } from "../rhizohT0UnifiedPresenceFrameV0.js";
import { publishRhizohSurfaceStackV0 } from "../rhizohSurfaceStackPublishV0.js";
import { resetRhizohSurfaceBindingsForTestV0 } from "../rhizohSurfaceBindingLayerV0.js";
import { resetRhizohSurfaceSingularityForTestV0 } from "../rhizohSurfaceSingularityLayerV0.js";
import { resetRhizohSurfaceCitizenshipForTestV0 } from "../rhizohSurfaceCitizenshipRuntimeV0.js";
import {
  tickPetCitizenFromWorldStackV0,
  readPetCitizenV0,
  readPetCitizenStateV0,
  resetRhizohPetCitizenForTestV0
} from "../rhizohPetCitizenRuntimeV0.js";

describe("rhizohPetCitizenRuntimeV0", () => {
  beforeEach(() => {
    resetRhizohSurfaceBindingsForTestV0();
    resetRhizohSurfaceSingularityForTestV0();
    resetRhizohSurfaceCitizenshipForTestV0();
    resetRhizohPetCitizenForTestV0();
    window.__rhizoh = { presenceState: { rhizoh_is_present: true } };
  });

  it("never owns state — reads SCR + RCAL only", () => {
    const frame = buildT0UnifiedPresenceFrameV0(
      { rhizoh_is_present: true, silence_form: "listening", rhizoh_attention: "focused" },
      { orbModulation: { breathe: true, intensity01: 0.75 }, transitionFeel: {} },
      null,
      1_700_000_020_000
    );
    window.__rhizoh.presenceFrame = frame;
    window.__rhizoh.rcalCrystalTopology = {
      nodes: [
        { id: "focus_lock", role: "focus_lock", x: 0.3, y: -0.1, intensity01: 0.7, label: "voice" }
      ]
    };
    publishRhizohSurfaceStackV0(frame, null, null);
    const citizen = tickPetCitizenFromWorldStackV0({ frame });

    expect(citizen.inhabited).toBe(true);
    expect(citizen.owns_state).toBe(false);
    expect(citizen.validates_scr).toBe(true);
    expect(citizen.position?.world_projection).toBe(true);
    expect(readPetCitizenV0()?.seq).toBe(1);
    expect(readPetCitizenStateV0().inhabited).toBe(true);
  });
});
