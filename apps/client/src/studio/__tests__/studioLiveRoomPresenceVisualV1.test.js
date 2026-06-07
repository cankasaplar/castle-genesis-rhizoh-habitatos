import { describe, expect, it } from "vitest";
import {
  mapPweStateToStudioVisualV1,
  resolveStudioPresenceVisualV1,
  STUDIO_VISUAL_PRESENCE_V1
} from "../studioLiveRoomPresenceVisualV1.js";

describe("studioLiveRoomPresenceVisualV1", () => {
  it("maps speaking to emissive pulse", () => {
    const v = resolveStudioPresenceVisualV1(STUDIO_VISUAL_PRESENCE_V1.SPEAKING);
    expect(v.emissive).toBeGreaterThan(0.8);
  });

  it("maps thinking to bloom", () => {
    const v = resolveStudioPresenceVisualV1(STUDIO_VISUAL_PRESENCE_V1.THINKING);
    expect(v.bloom).toBe(1);
  });

  it("maps PWE exploring to thinking visual", () => {
    expect(mapPweStateToStudioVisualV1("exploring")).toBe(STUDIO_VISUAL_PRESENCE_V1.THINKING);
  });
});
