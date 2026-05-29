import { describe, it, expect } from "vitest";
import {
  assessContinuityHydrateV0,
  canAdvanceReplayCursorV0,
  CONTINUITY_HYDRATE_MODE_V0,
  deriveWalSegmentIdV0,
  validateCursorSegmentAnchorV0,
  WAL_SEGMENT_KEY_PATH_V0
} from "../substrateContinuityIdbV0.js";
import { REALITY_SEAL_DISK_KEY_V0 } from "../realitySealDiskV0.js";

describe("substrateContinuityIdbV0", () => {
  it("uses composite wal key path [diskKey, tick]", () => {
    expect(WAL_SEGMENT_KEY_PATH_V0).toEqual(["diskKey", "tick"]);
  });

  it("derives stable segmentId from diskKey, tick, hash", () => {
    const id = deriveWalSegmentIdV0(REALITY_SEAL_DISK_KEY_V0, 42, "abc");
    expect(id).toBe(`${REALITY_SEAL_DISK_KEY_V0}:42:abc`);
  });

  it("rejects cursor regression (stale async replay)", () => {
    const r = canAdvanceReplayCursorV0({ lastTick: 10, lastHash: "h" }, { lastTick: 9, lastHash: "h" });
    expect(r.ok).toBe(false);
    expect(r.code).toBe("cursor_regressed");
  });

  it("allows equal tick rewrite only when monotonic guard passes", () => {
    const r = canAdvanceReplayCursorV0({ lastTick: 10, lastHash: "h" }, { lastTick: 10, lastHash: "h2" });
    expect(r.ok).toBe(true);
  });

  it("enforces cursor.lastHash === segment.hash at lastTick", () => {
    const diskKey = REALITY_SEAL_DISK_KEY_V0;
    const segment = { diskKey, tick: 5, hash: "seg_hash" };
    const bad = { diskKey, lastTick: 5, lastHash: "wrong" };
    expect(validateCursorSegmentAnchorV0(bad, segment).ok).toBe(false);
    const good = {
      diskKey,
      lastTick: 5,
      lastHash: "seg_hash",
      lastSegmentId: deriveWalSegmentIdV0(diskKey, 5, "seg_hash")
    };
    expect(validateCursorSegmentAnchorV0(good, segment).ok).toBe(true);
  });

  it("cold hydrate when no cursor", () => {
    const r = assessContinuityHydrateV0({ cursor: null, segmentAtCursor: null });
    expect(r.mode).toBe(CONTINUITY_HYDRATE_MODE_V0.COLD);
  });

  it("warm_existence when cursor exists but continuity proof not required", () => {
    const r = assessContinuityHydrateV0({
      cursor: { diskKey: "k", lastTick: 1, lastHash: "h" },
      segmentAtCursor: null,
      requireContinuityProof: false
    });
    expect(r.mode).toBe(CONTINUITY_HYDRATE_MODE_V0.WARM_EXISTENCE);
  });

  it("continuity_broken when proof required but segment missing", () => {
    const r = assessContinuityHydrateV0({
      cursor: { diskKey: "k", lastTick: 1, lastHash: "h" },
      segmentAtCursor: null,
      requireContinuityProof: true
    });
    expect(r.mode).toBe(CONTINUITY_HYDRATE_MODE_V0.CONTINUITY_BROKEN);
    expect(r.issues).toContain("segment_missing");
  });

  it("continuity_ok when cursor anchored to segment", () => {
    const diskKey = REALITY_SEAL_DISK_KEY_V0;
    const hash = "deadbeef";
    const segment = { diskKey, tick: 3, hash };
    const cursor = {
      diskKey,
      lastTick: 3,
      lastHash: hash,
      lastSegmentId: deriveWalSegmentIdV0(diskKey, 3, hash)
    };
    const r = assessContinuityHydrateV0({
      cursor,
      segmentAtCursor: segment,
      requireContinuityProof: true
    });
    expect(r.mode).toBe(CONTINUITY_HYDRATE_MODE_V0.CONTINUITY_OK);
  });
});
