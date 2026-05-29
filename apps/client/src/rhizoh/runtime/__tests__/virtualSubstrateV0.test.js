import { describe, it, expect } from "vitest";
import { createAmbientBoxStateV0 } from "../ambientBoxStateV0.js";
import { fakeTVLayerV0 } from "../fakeTVLayerV0.js";
import { replayExecutionV0 } from "../replayExecutionV0.js";
import { packExecutionMirrorV0 } from "../virtualSubstrateMirrorV0.js";
import {
  projectSubstrateFromNestedExecutionResultV0,
  projectSubstrateFromRouterPartsV0,
  canonicalSubstrateParityV0
} from "../canonicalMirrorPipelineV0.js";
import { executionRouterV0 } from "../executionRouterV0.js";
import { stampExecutionCommandHashV0 } from "../executionCommandHashV0.js";
import { validateExecutionCommandV0 } from "../validateExecutionCommandV0.js";
import { deriveEpistemicKeyV0, composeEpistemicKeyInputV0 } from "../deriveEpistemicKeyV0.js";

describe("createAmbientBoxStateV0", () => {
  it("defaults when executionResult missing", () => {
    const box = createAmbientBoxStateV0(undefined, 1_700_000_000_000);
    expect(box.mode).toBe("VIRTUAL_SUBSTRATE");
    expect(box.timestamp).toBe(1_700_000_000_000);
    expect(box.light).toEqual({ color: "#000000", brightness: 0, temperature: 0 });
    expect(box.media).toEqual({ active: null, payload: null });
  });

  it("reads light.temp and light.temperature aliases", () => {
    const a = createAmbientBoxStateV0(
      { light: { color: "#aabbcc", brightness: 0.5, temp: 3200 } },
      100
    );
    expect(a.light.temperature).toBe(3200);
    const b = createAmbientBoxStateV0(
      { light: { color: "#aabbcc", brightness: 0.5, temperature: 4000 } },
      100
    );
    expect(b.light.temperature).toBe(4000);
  });
});

describe("fakeTVLayerV0", () => {
  it("returns null for empty input", () => {
    expect(fakeTVLayerV0(null)).toBeNull();
    expect(fakeTVLayerV0(undefined)).toBeNull();
  });

  it("mirrors media command as reflection surface", () => {
    const tv = fakeTVLayerV0({
      action: "OPEN_URL",
      payload: "https://www.youtube.com/@CastleGenesis/live"
    });
    expect(tv).toEqual({
      screenState: "READY",
      intent: "OPEN_URL",
      url: "https://www.youtube.com/@CastleGenesis/live",
      visualHint: "LIVE_STREAM_PREVIEW"
    });
    expect(Object.isFrozen(tv)).toBe(true);
  });
});

describe("replayExecutionV0", () => {
  it("maps history frames to frozen ambient box outputs with stable timestamps", () => {
    const out = replayExecutionV0([
      {
        frameId: "f0",
        lane: "observer",
        at: 111,
        executionResult: { light: { color: "#111111", brightness: 0.2, temp: 2700 } }
      },
      {
        frameId: "f1",
        lane: "active",
        timestamp: 222,
        executionResult: { media: { action: "OPEN_URL", payload: "https://example.com" } }
      }
    ]);
    expect(out).toHaveLength(2);
    expect(out[0].frameId).toBe("f0");
    expect(out[0].output.timestamp).toBe(111);
    expect(out[1].output.timestamp).toBe(222);
    expect(out[1].output.media.active).toBe("OPEN_URL");
  });

  it("non-array history → empty array", () => {
    expect(replayExecutionV0(/** @type {any} */ (null))).toEqual([]);
  });
});

describe("PR-3.2 paradigm: substrate matches actuator golden path", () => {
  it("HIGH_INTERACTION slice + LIGHT/MEDIA router → pack → box parity with direct executionResult", () => {
    const morningSlice = {
      ambient: { luminosity: 0.88 },
      atmosphere: { driftBloom: 0.2, visibilityBudget: 0.72 }
    };
    expect(deriveEpistemicKeyV0(composeEpistemicKeyInputV0(morningSlice))).toBe("HIGH_INTERACTION");

    const t = 9_000_000_000_000;
    const lightCmd = stampExecutionCommandHashV0({
      namespace: "LIGHT_ACTUATOR",
      type: "SET_STATE",
      lane: "active",
      provenance: { locked: true, source: "virtual_substrate" },
      color: "#ffffff",
      brightness: 0.95,
      temperature: 4500
    });
    const mediaCmd = stampExecutionCommandHashV0({
      namespace: "MEDIA_ACTUATOR",
      type: "OPEN_YOUTUBE_LIVE",
      lane: "active",
      provenance: { locked: true, source: "virtual_substrate" }
    });

    expect(validateExecutionCommandV0(lightCmd)).not.toBe(false);
    expect(validateExecutionCommandV0(mediaCmd)).not.toBe(false);

    const lightOut = executionRouterV0(lightCmd);
    const mediaOut = executionRouterV0(mediaCmd);
    const fromRes = projectSubstrateFromRouterPartsV0({ light: lightOut, media: mediaOut }, t);
    expect(fromRes.ok).toBe(true);

    const goldenRes = projectSubstrateFromNestedExecutionResultV0(
      {
        light: { color: "#ffffff", brightness: 0.95, temp: 4500 },
        media: {
          action: "OPEN_URL",
          payload: "https://www.youtube.com/@CastleGenesis/live"
        }
      },
      t
    );
    expect(goldenRes.ok).toBe(true);

    if (fromRes.ok && goldenRes.ok) {
      expect(canonicalSubstrateParityV0(fromRes.box, goldenRes.box)).toBe(true);
      const legacyBox = createAmbientBoxStateV0(
        packExecutionMirrorV0({ light: lightOut, media: mediaOut }),
        t
      );
      expect(canonicalSubstrateParityV0(fromRes.box, legacyBox)).toBe(true);
    }

    const tv = fakeTVLayerV0(mediaOut);
    expect(tv?.visualHint).toBe("LIVE_STREAM_PREVIEW");
    expect(tv?.url).toBe("https://www.youtube.com/@CastleGenesis/live");
  });
});
