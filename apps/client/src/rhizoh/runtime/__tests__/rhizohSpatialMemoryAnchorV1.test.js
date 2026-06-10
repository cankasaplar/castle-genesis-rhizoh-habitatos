import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  computeSpatialCandidateScoreV1,
  readActiveSpatialMemoryMapPinsV1,
  resolvePendingSpatialConsentV1,
  stageSpatialMemoryInvitationV1,
  SPATIAL_MEMORY_STORAGE_KEY_V1
} from "../rhizohSpatialMemoryAnchorV1.js";
import { SPATIAL_SIGNIFICANCE_THRESHOLD_V1 } from "../rhizohMemoryInvitationGateV1.js";

describe("computeSpatialCandidateScoreV1", () => {
  it("marks pin eligible for future + high significance", () => {
    const row = computeSpatialCandidateScoreV1({
      message: "onumuzdeki hafta gorusmem var",
      significanceField: { score: SPATIAL_SIGNIFICANCE_THRESHOLD_V1 + 0.1, goalImpact: 0.7 }
    });
    expect(row.pinEligible).toBe(true);
    expect(row.spatialCandidateScore).toBeGreaterThan(0.5);
  });
});

describe("spatial memory consent flow", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      store: {},
      getItem(k) {
        return this.store[k] ?? null;
      },
      setItem(k, v) {
        this.store[k] = v;
      }
    });
    vi.stubGlobal("window", {
      localStorage: globalThis.localStorage,
      dispatchEvent: vi.fn()
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("stages then commits spatial anchor after consent", () => {
    const staged = stageSpatialMemoryInvitationV1({
      message: "onumuzdeki hafta is gorusmem var",
      significanceField: { score: 0.82, goalImpact: 0.7 },
      traceId: "TRC-TEST"
    });
    expect(staged.ok).toBe(true);

    const committed = resolvePendingSpatialConsentV1("evet not al");
    expect(committed.ok).toBe(true);
    expect(committed.anchor?.tier).toBe("spatial_anchor");

    const pins = readActiveSpatialMemoryMapPinsV1();
    expect(pins.length).toBe(1);
    expect(pins[0].pinType).toBe("memory_beacon");
    expect(localStorage.getItem(SPATIAL_MEMORY_STORAGE_KEY_V1)).toContain("spatial_anchor");
  });
});
