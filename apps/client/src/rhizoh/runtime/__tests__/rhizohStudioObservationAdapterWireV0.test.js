import { describe, expect, it } from "vitest";
import { ensureRhizohStudioObservationAdapterDevToolsV0 } from "../rhizohStudioObservationAdapterWireV0.js";

describe("rhizohStudioObservationAdapterWireV0", () => {
  it("exposes studioAdapters on window.__rhizoh", () => {
    const fn = ensureRhizohStudioObservationAdapterDevToolsV0();
    expect(typeof fn).toBe("function");
    const snap = fn();
    expect(snap.adapterCount).toBe(8);
    expect(snap.consumerReadyCount).toBe(8);
  });
});
