/**
 * Perception alignment firewall regression — drift guard must catch re-introduced coupling.
 * @see docs/CAMERA_UNIFICATION_SPEC_V1.md §4.2 · Step 2.3
 */
import { afterEach, describe, expect, it } from "vitest";
import {
  ALIGNMENT_DRIFT_RISK_V0,
  buildPerceptionAlignmentSnapshotV0,
  buildPerceptionLensSnapshotV0,
  buildPresentationLensSnapshotV0,
  computeAlignmentDriftV0,
  normalizeAlignmentTimeSyncV0,
  publishPerceptionAlignmentSnapshotV0,
  USER_SPATIAL_EXECUTOR_SOURCES_V0,
  __resetPerceptionAlignmentPublishForTestV0
} from "../perceptionAlignmentSnapshotV0.js";

const AT = 1_700_000_000_000;

function baseInput(overrides = {}) {
  return {
    atMs: AT,
    correlationId: "firewall-regression",
    perception: buildPerceptionLensSnapshotV0({
      atMs: AT,
      capturedAtMs: AT,
      fieldState: "LISTENING",
      mountId: "t0_shell_unified_dock"
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

describe("perceptionAlignmentFirewallRegressionV0", () => {
  afterEach(() => {
    __resetPerceptionAlignmentPublishForTestV0();
  });

  it("detects false correlation when spatial moves under conversation without user source", () => {
    const snapshot = buildPerceptionAlignmentSnapshotV0(
      baseInput({
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
    expect(
      snapshot.contract.alignment.explanations.some(
        (e) => e.code === "P2_FALSE_CORRELATION_SPATIAL_UNDER_CONVERSATION"
      )
    ).toBe(true);
  });

  it("does not flag user-registry spatial activity under conversation", () => {
    for (const source of USER_SPATIAL_EXECUTOR_SOURCES_V0) {
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
            lastExecutorSource: source,
            realityMode: "REAL_MAP",
            mapSurfaceActive: true
          })
        })
      );

      const falseCorr = snapshot.contract.alignment.explanations.find(
        (e) => e.code === "P2_FALSE_CORRELATION_SPATIAL_UNDER_CONVERSATION"
      );
      expect(falseCorr, `source=${source}`).toBeUndefined();
    }
  });

  it("detects mount fragmentation when multiple Octo mounts are active", () => {
    const snapshot = buildPerceptionAlignmentSnapshotV0(
      baseInput({
        knownMountIds: ["t0_shell_unified_dock", "octo_lab_dev"]
      })
    );

    expect(snapshot.contract.alignment.semanticDriftRisk).toBe(ALIGNMENT_DRIFT_RISK_V0.HIGH);
    expect(
      snapshot.contract.alignment.explanations.some((e) => e.code === "P2_OCTO_MOUNT_FRAGMENTATION")
    ).toBe(true);
  });

  it("detects presentation-ahead-of-spatial drift without causality claim", () => {
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
    expect(ex).toBeDefined();
    expect(ex.causalClaim).toBe(false);
    expect(snapshot.contract.alignment.blockFalseCorrelation).toBe(true);
  });

  it("never marks drift explanations as causal without command evidence", () => {
    const draft = {
      contract: {
        atMs: AT,
        focus: { habitatMode: "conversation", realityMode: "REAL_MAP" },
        perception: { fieldState: "LISTENING", octoEmotion: "listening", mountId: "a" },
        spatial: {
          ready: true,
          lastExecutorOp: "fly_to",
          lastExecutorOk: true,
          lastExecutorAtMs: AT,
          lastExecutorSource: "ghost_scatter",
          geo: { lat: 41, lon: 29, height: 1000 },
          realityMode: "REAL_MAP",
          mapSurfaceActive: true
        },
        presentation: { showMapStrip: true, habitatMode: "conversation" },
        timeSync: normalizeAlignmentTimeSyncV0({ atMs: AT })
      },
      knownMountIds: ["a", "b"]
    };

    const drift = computeAlignmentDriftV0(draft);
    for (const ex of drift.explanations) {
      expect(ex.causalClaim).toBe(false);
    }
  });

  it("publish mirror remains read-only with no lens mutation side effects", () => {
    const snapshot = buildPerceptionAlignmentSnapshotV0(baseInput());
    const geo = { lat: 41.0, lon: 29.0, height: 500 };
    window.__CASTLE_CESIUM__ = { ready: true, getCameraGeo: () => geo };

    publishPerceptionAlignmentSnapshotV0(snapshot);

    expect(window.__CASTLE_PERCEPTION_ALIGNMENT__?.readOnly).toBe(true);
    expect(window.__CASTLE_PERCEPTION_ALIGNMENT__?.last).toEqual(snapshot);
    expect(window.__CASTLE_CESIUM__.getCameraGeo()).toBe(geo);
  });
});
