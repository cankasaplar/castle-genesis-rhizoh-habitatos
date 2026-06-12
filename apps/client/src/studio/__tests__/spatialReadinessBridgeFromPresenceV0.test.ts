import { describe, expect, it } from "vitest";
import { PresenceRole } from "../types/PresenceRole";
import { createSpatialBridge } from "../spatialReadinessBridgeFromPresenceV0";

describe("spatialReadinessBridgeFromPresenceV0", () => {
  it("accepts valid presence roles", () => {
    const bridge = createSpatialBridge();

    const a: PresenceRole = "owner";
    const b: PresenceRole = "participant";

    expect(bridge.addRole(a)).toBe(true);
    expect(bridge.addRole(b)).toBe(true);
  });
});
