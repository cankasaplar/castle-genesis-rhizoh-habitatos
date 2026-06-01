import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  buildContinuitySeamlessEntrySnapshotV0,
  CONTINUITY_SEAMLESS_BINDING_V0,
  maybeRunContinuitySeamlessEntryV0,
  runContinuitySeamlessEntryV0,
  shouldUseContinuitySeamlessEntryV0,
  TRANSITION_AS_CONTINUITY_PRINCIPLE_V0
} from "../continuitySeamlessEntryV0.js";
import { shouldUseContinuityEntryCompressionV0 } from "../continuityEntryCompressionV0.js";
import { resetMemoryAnchorSessionV0 } from "../memoryAnchorSystemV0.js";
import {
  resetExpressiveRealityTransitionSessionV0,
  RTL_SESSION_COMPLETE_KEY_V0
} from "../expressiveRealityTransitionV0.js";

describe("continuitySeamlessEntryV0", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_RHIZOH_SURFACE_CREATIVE", "1");
    vi.stubEnv("VITE_RHIZOH_RTL_FULL_CEREMONY", "");
    vi.stubEnv("VITE_RHIZOH_VISIBLE_ENTRY_PIPELINE", "");
    resetExpressiveRealityTransitionSessionV0();
    resetMemoryAnchorSessionV0();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    resetExpressiveRealityTransitionSessionV0();
    resetMemoryAnchorSessionV0();
  });

  it("locks SSOT binding sentences", () => {
    expect(CONTINUITY_SEAMLESS_BINDING_V0).toMatch(/uninterrupted play/i);
    expect(TRANSITION_AS_CONTINUITY_PRINCIPLE_V0).toMatch(/disappearance of phase boundary/i);
  });

  it("seamless is default; visible CEC is off", () => {
    expect(shouldUseContinuitySeamlessEntryV0()).toBe(true);
    expect(shouldUseContinuityEntryCompressionV0()).toBe(false);
  });

  it("runContinuitySeamlessEntry completes synchronously with no phases", () => {
    const phases = [];
    const snap = buildContinuitySeamlessEntrySnapshotV0({});
    expect(snap.continued).toBe(true);
    expect(snap.seamless).toBe(true);
    expect("phases" in snap).toBe(false);

    runContinuitySeamlessEntryV0(
      {},
      {
        onComplete: () => phases.push("done")
      }
    );
    expect(phases).toEqual(["done"]);
    expect(sessionStorage.getItem(RTL_SESSION_COMPLETE_KEY_V0)).toBe("1");
  });

  it("maybeRun starts seamless path", () => {
    const r = maybeRunContinuitySeamlessEntryV0({}, { onComplete: () => {} });
    expect(r.started).toBe(true);
    expect(r.snapshot?.continued).toBe(true);
  });
});
