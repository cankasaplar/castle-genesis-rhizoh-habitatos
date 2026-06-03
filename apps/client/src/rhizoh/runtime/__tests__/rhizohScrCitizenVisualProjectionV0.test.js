import { describe, it, expect, beforeEach } from "vitest";
import { buildT0UnifiedPresenceFrameV0 } from "../rhizohT0UnifiedPresenceFrameV0.js";
import { buildSurfaceBindingsV0, resetRhizohSurfaceBindingsForTestV0, RSBL_SURFACE_ID_V0 } from "../rhizohSurfaceBindingLayerV0.js";
import { publishRhizohSurfaceStackV0 } from "../rhizohSurfaceStackPublishV0.js";
import { resetRhizohSurfaceSingularityForTestV0 } from "../rhizohSurfaceSingularityLayerV0.js";
import { resetRhizohSurfaceCitizenshipForTestV0 } from "../rhizohSurfaceCitizenshipRuntimeV0.js";
import {
  deriveScrCollectiveFieldV0,
  deriveScrSwarmFieldV0
} from "../rhizohScrCitizenVisualProjectionV0.js";
import {
  tickPetCitizenFromWorldStackV0,
  readPetCitizenStateV0,
  resetRhizohPetCitizenForTestV0
} from "../rhizohPetCitizenRuntimeV0.js";

describe("rhizohScrCitizenVisualProjectionV0", () => {
  beforeEach(() => {
    resetRhizohSurfaceBindingsForTestV0();
    resetRhizohSurfaceSingularityForTestV0();
    resetRhizohSurfaceCitizenshipForTestV0();
    resetRhizohPetCitizenForTestV0();
    window.__rhizoh = {};
  });

  it("derives collective field from swarm SCR projection", () => {
    const frame = buildT0UnifiedPresenceFrameV0(
      { rhizoh_is_present: true, silence_form: "listening", rhizoh_attention: "focused" },
      { orbModulation: { breathe: true, intensity01: 0.8 }, transitionFeel: {} },
      null,
      1_700_000_010_000
    );
    publishRhizohSurfaceStackV0(frame, null, null);
    const collective = deriveScrCollectiveFieldV0();
    const swarm = deriveScrSwarmFieldV0();

    expect(collective.density).toBeGreaterThan(0);
    expect(["low", "medium", "high"]).toContain(swarm.level);
    expect(window.__rhizoh.surfaceCitizenship.citizens[RSBL_SURFACE_ID_V0.SWARM].owns_clock).toBe(false);
  });

  it("pet inhabits after studio stack tick", () => {
    const frame = buildT0UnifiedPresenceFrameV0(
      { rhizoh_is_present: true, silence_form: "listening", rhizoh_attention: "focused" },
      { orbModulation: { breathe: true, intensity01: 0.7 }, transitionFeel: {} },
      null,
      1_700_000_011_000
    );
    window.__rhizoh.presenceFrame = frame;
    window.__rhizoh.rcalCrystalTopology = {
      nodes: [{ id: "focus_lock", role: "focus_lock", x: 0.2, y: 0.1, intensity01: 0.6 }]
    };
    publishRhizohSurfaceStackV0(frame, null, null);
    tickPetCitizenFromWorldStackV0({ frame });
    const pet = readPetCitizenStateV0();
    expect(pet.inhabited).toBe(true);
    expect(pet.owns_state).toBe(false);
    expect(pet.validates_scr).toBe(true);
  });
});
