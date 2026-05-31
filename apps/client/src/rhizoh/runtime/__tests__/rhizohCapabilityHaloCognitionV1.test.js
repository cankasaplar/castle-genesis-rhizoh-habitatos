import { describe, expect, it } from "vitest";
import {
  RHIZOH_CAPABILITY_DEPRECATED_NAV,
  RHIZOH_CAPABILITY_HALO_NODES_V1
} from "../../../kernel/visual/rhizohCapabilityHaloConfigV1.js";
import { setPerceptionMode, readRhizohPerceptionModeV0 } from "../rhizohPerceptionModeV0.js";

describe("rhizohCapabilityHaloConfigV1 cognition-only schema", () => {
  it("marks navigation as deprecated at config level", () => {
    expect(RHIZOH_CAPABILITY_DEPRECATED_NAV).toBe(true);
  });

  it("nodes have no href or openRealMap fields", () => {
    for (const node of RHIZOH_CAPABILITY_HALO_NODES_V1) {
      expect(node).not.toHaveProperty("href");
      expect(node).not.toHaveProperty("openRealMap");
    }
  });
});

describe("rhizohPerceptionModeV0", () => {
  it("setPerceptionMode stores spatial without map side effects", () => {
    setPerceptionMode("spatial");
    expect(readRhizohPerceptionModeV0()).toBe("spatial");
    setPerceptionMode("t0");
  });
});
