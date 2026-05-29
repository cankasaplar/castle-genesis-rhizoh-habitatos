import { describe, expect, it, vi, beforeEach } from "vitest";
import { SOVEREIGN_DEFAULT_ANCHOR_KADIKOY_V0 } from "../sovereignNodeOnboardingContractV0.js";
import {
  deriveSovereignNodePreviewV0,
  getEphemeralGeographicAnchorV0,
  resetSovereignNodeWizardStateV0,
  setEphemeralGeographicAnchorV0
} from "../sovereignNodeOnboardingWizardV0.js";

describe("sovereignNodeOnboardingWizardV0", () => {
  beforeEach(() => {
    resetSovereignNodeWizardStateV0();
    vi.stubGlobal("window", { __rhizoh: {} });
  });

  it("deriveSovereignNodeIdV0 uses kadikoy slug for istanbul anchor", async () => {
    const preview = await deriveSovereignNodePreviewV0({
      ...SOVEREIGN_DEFAULT_ANCHOR_KADIKOY_V0
    });
    expect(preview.nodeId).toBe("node:kadikoy_satellite");
    expect(preview.bootValidityTokenCreated).toBe(false);
    expect(preview.continuity).toBe("pending");
  });

  it("deriveSovereignNodePreview uses ankara_satellite for Ankara pick", async () => {
    const preview = await deriveSovereignNodePreviewV0({ lat: 39.9334, lon: 32.8597 });
    expect(preview.nodeId).toBe("node:ankara_satellite");
    expect(preview.bootValidityTokenCreated).toBe(false);
  });

  it("deriveSovereignNodePreview uses hash-based node id for custom anchor", async () => {
    const anchor = { lat: 40.1, lon: -3.7, label: "madrid" };
    const preview = await deriveSovereignNodePreviewV0(anchor);
    expect(preview.nodeId.startsWith("node:")).toBe(true);
    expect(preview.nodeId).not.toBe("node:kadikoy_satellite");
  });

  it("ephemeral anchor does not persist in wizard reset", () => {
    setEphemeralGeographicAnchorV0({ lat: 1, lon: 2 });
    resetSovereignNodeWizardStateV0();
    expect(getEphemeralGeographicAnchorV0()).toBeNull();
  });
});
