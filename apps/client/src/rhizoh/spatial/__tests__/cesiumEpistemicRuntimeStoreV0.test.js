import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getCesiumEpistemicRuntimeSnapshotV0,
  setCesiumEpistemicRuntimeInstallV0,
  clearCesiumEpistemicRuntimeInstallV0,
  resetCesiumEpistemicRuntimeStoreForTestsV0,
  resyncCesiumEpistemicRuntimeWindowMirrorV0
} from "../cesiumEpistemicRuntimeStoreV0.js";

describe("cesiumEpistemicRuntimeStoreV0", () => {
  beforeEach(() => {
    resetCesiumEpistemicRuntimeStoreForTestsV0();
  });

  it("tracks install then clear", () => {
    expect(getCesiumEpistemicRuntimeSnapshotV0().installed).toBe(false);
    setCesiumEpistemicRuntimeInstallV0(
      { anchorId: "anchor_x", lon: 29, lat: 41, districtLabel: "Test" },
      "calibration_root_locked"
    );
    const s = getCesiumEpistemicRuntimeSnapshotV0();
    expect(s.installed).toBe(true);
    expect(s.mode).toBe("calibration_root_locked");
    expect(s.origin?.anchorId).toBe("anchor_x");
    clearCesiumEpistemicRuntimeInstallV0();
    expect(getCesiumEpistemicRuntimeSnapshotV0().installed).toBe(false);
  });

  it("mirrors to window only when VITE_RHIZOH_EPISTEMIC_RUNTIME_DEBUG=1", () => {
    vi.stubEnv("VITE_RHIZOH_EPISTEMIC_RUNTIME_DEBUG", "1");
    const prev = window.__CASTLE_CESIUM__;
    window.__CASTLE_CESIUM__ = {};
    try {
      setCesiumEpistemicRuntimeInstallV0(
        { anchorId: "a", lon: 28.9, lat: 41.1, districtLabel: "X" },
        "m"
      );
      resyncCesiumEpistemicRuntimeWindowMirrorV0();
      expect(window.__CASTLE_CESIUM__.rhizohEpistemicMode).toBe("m");
      clearCesiumEpistemicRuntimeInstallV0();
      expect(window.__CASTLE_CESIUM__.rhizohEpistemicOrigin).toBeUndefined();
    } finally {
      vi.unstubAllEnvs();
      window.__CASTLE_CESIUM__ = prev;
    }
  });
});
