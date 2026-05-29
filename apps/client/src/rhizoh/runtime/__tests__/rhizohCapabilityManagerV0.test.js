import { describe, it, expect, afterEach, vi } from "vitest";
import {
  getRenderCapabilitySnapshotV0,
  getRhizohCapabilitySnapshotV0,
  RENDER_CAPABILITY_SCHEMA_V0,
  RHIZOH_CAPABILITY_SCHEMA_V0
} from "../rhizohCapabilityManagerV0.js";

describe("rhizohCapabilityManagerV0 (facade)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("aliases getRhizohCapabilitySnapshotV0 to getRenderCapabilitySnapshotV0", () => {
    expect(getRhizohCapabilitySnapshotV0).toBe(getRenderCapabilitySnapshotV0);
  });

  it("RHIZOH_CAPABILITY_SCHEMA_V0 matches render schema constant (single seal)", () => {
    expect(RHIZOH_CAPABILITY_SCHEMA_V0).toBe(RENDER_CAPABILITY_SCHEMA_V0);
  });

  it("delegates snapshot to render module", () => {
    const s = getRhizohCapabilitySnapshotV0();
    expect(s.schema).toBe(RENDER_CAPABILITY_SCHEMA_V0);
  });
});
