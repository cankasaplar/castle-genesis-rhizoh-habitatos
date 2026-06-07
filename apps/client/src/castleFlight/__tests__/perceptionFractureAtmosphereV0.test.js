import { describe, expect, it } from "vitest";
import {
  buildPerceptionFractureAtmosphereV0,
  fractureAtmosphereToCssVarsV0,
  resolveFractureLayerStyleV0,
  PERCEPTION_FRACTURE_ATMOSPHERE_SCHEMA_V0
} from "../perceptionFractureAtmosphereV0.js";
import {
  buildPerceptionAlignmentSnapshotV0,
  buildPerceptionLensSnapshotV0,
  buildPresentationLensSnapshotV0
} from "../perceptionAlignmentSnapshotV0.js";

const AT = 1_700_000_000_000;

function baseSnapshot(overrides = {}) {
  return buildPerceptionAlignmentSnapshotV0({
    atMs: AT,
    perception: buildPerceptionLensSnapshotV0({
      atMs: AT,
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
  });
}

describe("perceptionFractureAtmosphereV0", () => {
  it("returns neutral atmosphere when contract missing", () => {
    const atmosphere = buildPerceptionFractureAtmosphereV0(null);
    expect(atmosphere.schema).toBe(PERCEPTION_FRACTURE_ATMOSPHERE_SCHEMA_V0);
    expect(atmosphere.octo.opacity).toBe(1);
    expect(atmosphere.habitat.floatPx).toBe(0);
    expect(atmosphere.spatial.parallaxFreeze).toBe(0);
  });

  it("is deterministic for identical snapshots", () => {
    const snap = baseSnapshot();
    expect(buildPerceptionFractureAtmosphereV0(snap)).toEqual(
      buildPerceptionFractureAtmosphereV0(snap)
    );
  });

  it("applies parallax freeze texture on false correlation without text tokens", () => {
    const snap = baseSnapshot({
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
    });
    const atmosphere = buildPerceptionFractureAtmosphereV0(snap);
    expect(atmosphere.spatial.parallaxFreeze).toBe(1);
    expect(atmosphere.spatial.opacity).toBeLessThan(1);
    expect(JSON.stringify(atmosphere)).not.toMatch(/risk|ghost|fly_to|HIGH/i);
  });

  it("applies habitat float on presentation ahead of spatial", () => {
    const snap = baseSnapshot({
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
    });
    const atmosphere = buildPerceptionFractureAtmosphereV0(snap);
    expect(atmosphere.habitat.floatPx).toBeGreaterThan(0);
    expect(atmosphere.spatial.shimmer).toBeGreaterThan(0);
  });

  it("exports css vars as numbers only", () => {
    const atmosphere = buildPerceptionFractureAtmosphereV0(baseSnapshot());
    const vars = fractureAtmosphereToCssVarsV0(atmosphere);
    expect(vars["--rhizoh-fracture-octo-opacity"]).toBe("1");
    expect(vars["--rhizoh-fracture-habitat-float-px"]).toBe("0px");
    expect(Object.values(vars).join(" ")).not.toMatch(/[a-z]{4,}/i);
  });

  it("derives habitat phase and wheel lag for temporal desync (post-render only)", () => {
    const snap = baseSnapshot({
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
    });
    const atmosphere = buildPerceptionFractureAtmosphereV0(snap);
    expect(atmosphere.habitat.phaseMs).toBeGreaterThanOrEqual(0);
    expect(atmosphere.wheel.phaseMs).toBeGreaterThanOrEqual(0);
    expect(resolveFractureLayerStyleV0(atmosphere, "chatDock").animation).toBeTruthy();
    expect(resolveFractureLayerStyleV0(atmosphere, "wheel").animation).toBeTruthy();
    expect(JSON.stringify(atmosphere)).not.toMatch(/routeCesium|fieldState|semanticDriftRisk/i);
  });

  it("resolveFractureLayerStyleV0 never returns explanatory strings", () => {
    const snap = baseSnapshot({
      knownMountIds: ["t0_shell_unified_dock", "octo_lab_dev"]
    });
    const atmosphere = buildPerceptionFractureAtmosphereV0(snap);
    for (const layer of ["octo", "habitat", "spatial", "shell", "chatDock", "wheel"]) {
      const style = resolveFractureLayerStyleV0(atmosphere, layer);
      for (const value of Object.values(style)) {
        if (typeof value === "string") {
          expect(value).not.toMatch(/P2_|risk|because|align/i);
        }
      }
    }
  });
});
