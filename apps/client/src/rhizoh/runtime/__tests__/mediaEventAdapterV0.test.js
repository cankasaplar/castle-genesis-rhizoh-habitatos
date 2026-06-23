import { describe, expect, it, beforeEach } from "vitest";
import {
  MEDIA_EVENT_TYPE_V0,
  deriveMediaFoxSignalsV0,
  getMediaEventAdapterSnapshotV0,
  ingestMediaTimelineEventV0,
  normalizeMediaTimelineEventV0,
  resetMediaEventAdapterForTestV0
} from "../mediaEventAdapterV0.js";
import {
  fuseCrossSpaceEpistemicV0,
  getCrossSpaceFusionLaneAuditV0,
  resetCrossSpaceCausalFusionForTestV0
} from "../crossSpaceCausalFusionV0.js";
import {
  bindRhizohRuntimeSurfaceV0,
  RUNTIME_SURFACE_API_KEYS_V0
} from "../rhizohRuntimeSurfaceBinderV0.js";

describe("mediaEventAdapterV0", () => {
  beforeEach(() => {
    resetMediaEventAdapterForTestV0();
    resetCrossSpaceCausalFusionForTestV0();
  });

  it("normalizes playhead events with world-heavy fox signals", () => {
    const normalized = normalizeMediaTimelineEventV0({
      eventType: MEDIA_EVENT_TYPE_V0.PLAYHEAD,
      title: "Documentary",
      positionSec: 120
    });
    expect(normalized.causalSpaceId).toBe("media.timeline.space");
    expect(normalized.foxSignals.worldSignal01).toBeGreaterThan(0.5);
    expect(normalized.interpretationOnly).toBe(true);
  });

  it("maps pause to lower continuity", () => {
    const pause = deriveMediaFoxSignalsV0(MEDIA_EVENT_TYPE_V0.PAUSE);
    const playhead = deriveMediaFoxSignalsV0(MEDIA_EVENT_TYPE_V0.PLAYHEAD);
    expect(pause.continuitySignal01).toBeLessThan(playhead.continuitySignal01);
  });

  it("ingests into media timeline lane and fusion", () => {
    const normalized = normalizeMediaTimelineEventV0({
      mediaId: "vid_1",
      eventType: MEDIA_EVENT_TYPE_V0.CHAPTER,
      title: "Chapter 3"
    });
    ingestMediaTimelineEventV0(normalized, { dispatchEvent: false });
    const audit = getCrossSpaceFusionLaneAuditV0();
    expect(audit.media.present).toBe(true);

    const fusion = fuseCrossSpaceEpistemicV0();
    expect(fusion.epistemicUpdate.laneContributions.media.present).toBe(true);
    expect(fusion.epistemicUpdate.laneContributions.media.weight).toBe(0.08);
    expect(fusion.epistemicUpdate.fusedShares.PERCEPTION).toBeGreaterThan(0);
  });

  it("snapshot tracks recent media events", () => {
    ingestMediaTimelineEventV0(
      normalizeMediaTimelineEventV0({ title: "Clip" }),
      { dispatchEvent: false }
    );
    expect(getMediaEventAdapterSnapshotV0().recentCount).toBe(1);
  });
});

describe("rhizohRuntimeSurfaceBinder media API", () => {
  beforeEach(() => {
    window.__rhizoh = {};
    resetMediaEventAdapterForTestV0();
    resetCrossSpaceCausalFusionForTestV0();
  });

  it("binds ingestMediaEvent", () => {
    bindRhizohRuntimeSurfaceV0(window.__rhizoh);
    expect(RUNTIME_SURFACE_API_KEYS_V0).toContain("ingestMediaEvent");
    const result = window.__rhizoh.ingestMediaEvent({
      title: "Live stream",
      eventType: MEDIA_EVENT_TYPE_V0.PLAYHEAD,
      positionSec: 42
    });
    expect(result.normalized.positionSec).toBe(42);
  });
});
