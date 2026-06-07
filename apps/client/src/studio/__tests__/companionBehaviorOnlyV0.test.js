import { describe, it, expect } from "vitest";
import {
  deriveFoxCompanionBehaviorDriveV1,
  isCompanionBehaviorOnlyV0,
  mapRhizohFieldToCompanionObserverFieldV0
} from "../companionBehaviorOnlyV0.js";
import { OBSERVER_SPECIES_FOX_V1, OBSERVER_SPECIES_OCTO_V1 } from "../observerSpeciesRegistryV0.js";

describe("companionBehaviorOnlyV0", () => {
  it("defaults behavior-only for fox anchor", () => {
    expect(isCompanionBehaviorOnlyV0(OBSERVER_SPECIES_FOX_V1.id)).toBe(true);
    expect(isCompanionBehaviorOnlyV0(OBSERVER_SPECIES_OCTO_V1.id)).toBe(false);
  });

  it("maps Rhizoh speaking to companion listening", () => {
    expect(mapRhizohFieldToCompanionObserverFieldV0("SPEAKING")).toBe("listening");
    expect(mapRhizohFieldToCompanionObserverFieldV0("interpreting")).toBe("thinking");
  });

  it("does not treat idle session as companion speech motion", () => {
    const drive = deriveFoxCompanionBehaviorDriveV1({
      fieldState: "idle",
      draftText: "",
      busy: false
    });
    expect(drive.emotion).not.toBe("speaking");
    expect(drive.live).toBe(false);
  });

  it("keeps fox attentive when Rhizoh speaks", () => {
    const drive = deriveFoxCompanionBehaviorDriveV1({
      fieldState: "speaking",
      draftText: "",
      busy: false
    });
    expect(drive.live).toBe(true);
    expect(drive.emotion).toBe("listening");
    expect(drive.companionBehaviorOnly).toBe(true);
  });
});
