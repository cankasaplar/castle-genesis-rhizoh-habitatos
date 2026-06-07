import { afterEach, describe, expect, it } from "vitest";
import {
  ALIGNMENT_DRIFT_RISK_V0,
  buildPerceptionAlignmentSnapshotV0,
  buildPerceptionLensSnapshotV0,
  buildPresentationLensSnapshotV0,
  computeAlignmentDriftV0,
  normalizeAlignmentTickMsV0,
  normalizeAlignmentTimeSyncV0,
  publishPerceptionAlignmentSnapshotV0,
  readPerceptionAlignmentFromRuntimeV0,
  readSpatialLensSnapshotV0,
  __resetPerceptionAlignmentPublishForTestV0
} from "../perceptionAlignmentSnapshotV0.js";

const AT = 1_700_000_000_000;

function baseInput(overrides = {}) {
  return {
    atMs: AT,
    correlationId: "align-test",
    perception: buildPerceptionLensSnapshotV0({
      atMs: AT,
      capturedAtMs: AT,
      fieldState: "LISTENING",
      mountId: "t0_shell_unified"
    }),
    spatial: Object.freeze({
      capturedAtMs: AT,
      frame: "wgs84",
      ready: true,
      geo: Object.freeze({ lat: 41.01, lon: 28.97, height: 1200 }),
      lastExecutorOp: null,
      lastExecutorOk: false,
      lastExecutorAtMs: null,
      lastExecutorSource: null,
      realityMode: "GLOBE",
      mapSurfaceActive: false
    }),
    presentation: buildPresentationLensSnapshotV0({
      atMs: AT,
      capturedAtMs: AT,
      fieldState: "LISTENING",
      productSurface: "world",
      realityMode: "GLOBE"
    }),
    focus: Object.freeze({
      habitatMode: "conversation",
      productSurface: "world",
      realityMode: "GLOBE",
      worldMapTool: "globe"
    }),
    ...overrides
  };
}

describe("perceptionAlignmentSnapshotV0", () => {
  afterEach(() => {
    __resetPerceptionAlignmentPublishForTestV0();
  });

  it("normalizes alignment tick deterministically", () => {
    expect(normalizeAlignmentTickMsV0(1_700_000_000_042)).toBe(1_700_000_000_000);
    expect(normalizeAlignmentTickMsV0(1_700_000_000_099)).toBe(1_700_000_000_000);
  });

  it("produces identical contract for identical input", () => {
    const a = buildPerceptionAlignmentSnapshotV0(baseInput());
    const b = buildPerceptionAlignmentSnapshotV0(baseInput());
    expect(a).toEqual(b);
    expect(a.contract.schema).toBe("castle.camera_coordinate_contract.v0");
    expect(a.readOnly).toBe(true);
  });

  it("time sync reports skew without implying causality", () => {
    const sync = normalizeAlignmentTimeSyncV0({
      atMs: AT,
      perceptionCapturedAtMs: AT,
      spatialCapturedAtMs: AT + 600,
      presentationCapturedAtMs: AT
    });
    expect(sync.maxSkewMs).toBe(600);

    const snapshot = buildPerceptionAlignmentSnapshotV0(
      baseInput({
        spatial: Object.freeze({
          ...baseInput().spatial,
          capturedAtMs: AT + 600
        })
      })
    );

    const ex = snapshot.contract.alignment.explanations.find((e) => e.code === "P2_TIME_SKEW_HIGH");
    expect(ex).toBeDefined();
    expect(ex.causalClaim).toBe(false);
    expect(ex.guardrail).toBe("downgrade_correlation_confidence");
  });

  it("flags false correlation when spatial moves under conversation without user source", () => {
    const snapshot = buildPerceptionAlignmentSnapshotV0(
      baseInput({
        focus: Object.freeze({
          habitatMode: "conversation",
          productSurface: "world",
          realityMode: "REAL_MAP",
          worldMapTool: "globe"
        }),
        spatial: Object.freeze({
          capturedAtMs: AT,
          frame: "wgs84",
          ready: true,
          geo: Object.freeze({ lat: 41.01, lon: 28.97, height: 900 }),
          lastExecutorOp: "fly_to",
          lastExecutorOk: true,
          lastExecutorAtMs: AT,
          lastExecutorSource: "ghost_scatter",
          realityMode: "REAL_MAP",
          mapSurfaceActive: true
        })
      })
    );

    expect(snapshot.contract.alignment.semanticDriftRisk).toBe(ALIGNMENT_DRIFT_RISK_V0.HIGH);
    expect(snapshot.contract.alignment.blockFalseCorrelation).toBe(true);
    expect(snapshot.contract.alignment.guardrailActive).toBe(true);

    const ex = snapshot.contract.alignment.explanations.find(
      (e) => e.code === "P2_FALSE_CORRELATION_SPATIAL_UNDER_CONVERSATION"
    );
    expect(ex?.causalClaim).toBe(false);
    expect(ex?.message).toMatch(/do not infer causality/i);
  });

  it("allows registry spatial activity under conversation with user source", () => {
    const snapshot = buildPerceptionAlignmentSnapshotV0(
      baseInput({
        spatial: Object.freeze({
          capturedAtMs: AT,
          frame: "wgs84",
          ready: true,
          geo: Object.freeze({ lat: 41.01, lon: 28.97, height: 800 }),
          lastExecutorOp: "zoom_in",
          lastExecutorOk: true,
          lastExecutorAtMs: AT,
          lastExecutorSource: "registry",
          realityMode: "REAL_MAP",
          mapSurfaceActive: true
        })
      })
    );

    const falseCorr = snapshot.contract.alignment.explanations.find(
      (e) => e.code === "P2_FALSE_CORRELATION_SPATIAL_UNDER_CONVERSATION"
    );
    expect(falseCorr).toBeUndefined();
  });

  it("detects presentation ahead of spatial readiness", () => {
    const snapshot = buildPerceptionAlignmentSnapshotV0(
      baseInput({
        focus: Object.freeze({
          habitatMode: "world",
          productSurface: "world",
          realityMode: "REAL_MAP",
          worldMapTool: "satellite"
        }),
        spatial: Object.freeze({
          capturedAtMs: AT,
          frame: "wgs84",
          ready: false,
          geo: null,
          lastExecutorOp: null,
          lastExecutorOk: false,
          lastExecutorAtMs: null,
          lastExecutorSource: null,
          realityMode: "REAL_MAP",
          mapSurfaceActive: false
        }),
        presentation: buildPresentationLensSnapshotV0({
          atMs: AT,
          habitatMode: "world",
          productSurface: "world",
          realityMode: "REAL_MAP",
          worldMapTool: "satellite"
        })
      })
    );

    const ex = snapshot.contract.alignment.explanations.find(
      (e) => e.code === "P2_PRESENTATION_AHEAD_OF_SPATIAL"
    );
    expect(ex?.severity).toBe("medium");
    expect(snapshot.contract.alignment.blockFalseCorrelation).toBe(true);
  });

  it("publish is read-only mirror with no side effects on lenses", () => {
    const snapshot = buildPerceptionAlignmentSnapshotV0(baseInput());
    const windowSpy = { routeCalls: 0 };
    window.__CASTLE_CESIUM__ = {
      ready: true,
      getCameraGeo: () => ({ lat: 1, lon: 2, height: 3 })
    };

    publishPerceptionAlignmentSnapshotV0(snapshot);

    expect(window.__CASTLE_PERCEPTION_ALIGNMENT__?.readOnly).toBe(true);
    expect(window.__CASTLE_PERCEPTION_ALIGNMENT__?.last).toEqual(snapshot);
    expect(windowSpy.routeCalls).toBe(0);
    expect(window.__CASTLE_CESIUM__.getCameraGeo()).toEqual({ lat: 1, lon: 2, height: 3 });
  });

  it("readSpatialLensSnapshotV0 does not mutate cesium api", () => {
    const geo = { lat: 41.0, lon: 29.0, height: 500 };
    const getCameraGeo = () => geo;
    window.__CASTLE_CESIUM__ = { ready: true, getCameraGeo };
    window.__CASTLE_CESIUM_EXECUTOR__ = {
      last: Object.freeze({
        op: "zoom_in",
        ok: true,
        atMs: AT,
        meta: Object.freeze({ source: "registry" })
      })
    };

    const slice = readSpatialLensSnapshotV0(AT);
    expect(slice.lastExecutorOp).toBe("zoom_in");
    expect(slice.geo).toEqual({ lat: 41, lon: 29, height: 500 });
    expect(getCameraGeo()).toBe(geo);
  });

  it("computeAlignmentDriftV0 is pure over snapshot draft", () => {
    const draft = {
      contract: {
        atMs: AT,
        focus: { habitatMode: "navigation", realityMode: "GLOBE" },
        perception: { fieldState: "IDLE", octoEmotion: "neutral" },
        spatial: { ready: true, lastExecutorOp: null },
        presentation: { showMapStrip: false },
        timeSync: normalizeAlignmentTimeSyncV0({ atMs: AT })
      },
      knownMountIds: ["a", "b"]
    };
    const drift = computeAlignmentDriftV0(draft);
    expect(drift.semanticDriftRisk).toBe(ALIGNMENT_DRIFT_RISK_V0.HIGH);
    expect(drift.explanations.some((e) => e.code === "P2_OCTO_MOUNT_FRAGMENTATION")).toBe(true);
  });

  it("readPerceptionAlignmentFromRuntimeV0 uses fixed atMs deterministically", () => {
    const a = readPerceptionAlignmentFromRuntimeV0({
      atMs: AT,
      fieldState: "IDLE",
      mountId: "dock",
      productSurface: "world",
      realityMode: "GLOBE"
    });
    const b = readPerceptionAlignmentFromRuntimeV0({
      atMs: AT,
      fieldState: "IDLE",
      mountId: "dock",
      productSurface: "world",
      realityMode: "GLOBE"
    });
    expect(a.contract.atMs).toBe(normalizeAlignmentTickMsV0(AT));
    expect(a.contract.perception.mountId).toBe("dock");
    expect(a).toEqual(b);
  });
});
