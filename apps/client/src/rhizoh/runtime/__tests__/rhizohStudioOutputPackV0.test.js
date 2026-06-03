import { describe, it, expect, beforeEach } from "vitest";
import {
  buildStudioOutputPackV0,
  publishStudioOutputPackV0,
  resetRhizohStudioOutputPackForTestV0
} from "../rhizohStudioOutputPackV0.js";
import { registerRhizohArtifactV0, resetRhizohArtifactRegistryForTestV0 } from "../rhizohArtifactRegistryV0.js";

describe("rhizohStudioOutputPackV0", () => {
  beforeEach(() => {
    resetRhizohStudioOutputPackForTestV0();
    resetRhizohArtifactRegistryForTestV0();
    window.__rhizoh = {};
  });

  it("packages RAR artifact into studio output pack", () => {
    const artifact = registerRhizohArtifactV0({
      kind: "narrative_continuity",
      payload: { continuity_line: "test" },
      surfaces: ["t0_strip", "studio"]
    });
    const pack = buildStudioOutputPackV0(artifact);

    expect(pack.artifact_id).toBe(artifact.artifact_id);
    expect(pack.lived_state.persistence).toBe("memory_only");
    expect(pack.packaging_stage).toContain("rar");
    expect(pack.packaging_stage).toContain("studio");
  });

  it("publishes to window studioOutputPack", () => {
    const artifact = registerRhizohArtifactV0({ kind: "narrative_continuity", payload: {} });
    publishStudioOutputPackV0(artifact);
    expect(window.__rhizoh.studioOutputPack.artifact_id).toBe(artifact.artifact_id);
  });
});
