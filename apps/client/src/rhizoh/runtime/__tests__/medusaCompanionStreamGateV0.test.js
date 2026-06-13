import { describe, expect, it } from "vitest";
import { isMedusaCompanionStreamActiveV0 } from "../medusaCompanionStreamGateV0.js";

describe("medusaCompanionStreamGateV0", () => {
  it("returns false for null stream", () => {
    expect(isMedusaCompanionStreamActiveV0(null)).toBe(false);
  });

  it("returns false when no video tracks", () => {
    const stream = { getVideoTracks: () => [] };
    expect(isMedusaCompanionStreamActiveV0(stream)).toBe(false);
  });

  it("returns true when a live enabled video track exists", () => {
    const stream = {
      getVideoTracks: () => [{ readyState: "live", enabled: true }]
    };
    expect(isMedusaCompanionStreamActiveV0(stream)).toBe(true);
  });

  it("returns false when video track is ended", () => {
    const stream = {
      getVideoTracks: () => [{ readyState: "ended", enabled: true }]
    };
    expect(isMedusaCompanionStreamActiveV0(stream)).toBe(false);
  });
});
