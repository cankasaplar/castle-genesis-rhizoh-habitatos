import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  buildSystemIntegrityTiersV0,
  INTEGRITY_TIER_STATUS_V0
} from "../rhizohSystemIntegrityTiersV0.js";
import { WORLD_LAYER_PHASE_V0 } from "../rhizohWorldLayerActivationStatusV0.js";
import { SPATIAL_DRIFT_STATUS_V0 } from "../rhizohLiveConsistencyAuditV0.js";

describe("rhizohSystemIntegrityTiersV0", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_RHIZOH_CLOSED_ADMISSION", "1");
    vi.stubEnv("VITE_ONTOLOGICAL_BOOT_GATE", "0");
    vi.stubEnv("VITE_CESIUM_WORLD_PROJECTION_BIND", "1");
  });

  it("marks spatial surface pending under legal hold when only renderer absent", () => {
    const tiers = buildSystemIntegrityTiersV0({
      causalMap: { truthLoss: { structuralPass: true }, edgeCount: 3 },
      liveConflicts: { structuralPass: true },
      domainCoherence: { pass: true },
      envBlockers: [],
      audit: {
        structuralPass: true,
        axes: {
          nodeConsistency: { pass: true },
          eventOriginGraph: { pass: true },
          adapterStability: { pass: true },
          spatialDrift: {
            pass: false,
            status: SPATIAL_DRIFT_STATUS_V0.PENDING,
            pendingReason: "legal_activation_hold",
            issues: ["spatial_nodes_without_cesium_handle"],
            liveProjectionCount: 0
          }
        }
      },
      worldLayerStatus: {
        phase: WORLD_LAYER_PHASE_V0.LEGAL_HOLD,
        target: "cesium_activation",
        approved: false,
        narrative: "Spatial surface held"
      },
      rendererRegistry: {
        activeRenderer: null,
        rendererAbsent: true,
        topologyExists: true,
        narrative: "Rhizoh exists · world topology exists · renderer plugin absent"
      }
    });

    expect(tiers.structuralPass).toBe(true);
    expect(tiers.spatialSurfaceStatus).toBe(INTEGRITY_TIER_STATUS_V0.PENDING);
    expect(tiers.operationalPass).toBe(true);
    const spatial = tiers.tiers.find((t) => t.id === "spatial_surface");
    expect(spatial?.glyph).toBe("⏳");
  });

  it("fails operational integrity on true spatial drift with live projections", () => {
    const tiers = buildSystemIntegrityTiersV0({
      causalMap: { truthLoss: { structuralPass: true } },
      liveConflicts: { structuralPass: true },
      domainCoherence: { pass: true },
      envBlockers: [],
      audit: {
        axes: {
          nodeConsistency: { pass: true },
          eventOriginGraph: { pass: true },
          adapterStability: { pass: true },
          spatialDrift: {
            pass: false,
            status: SPATIAL_DRIFT_STATUS_V0.FAIL,
            issues: ["live_nodes_before_cesium_ready"],
            liveProjectionCount: 2
          }
        }
      },
      worldLayerStatus: { phase: WORLD_LAYER_PHASE_V0.ACTIVE, approved: true }
    });

    expect(tiers.structuralPass).toBe(true);
    expect(tiers.spatialSurfaceStatus).toBe(INTEGRITY_TIER_STATUS_V0.FAIL);
    expect(tiers.operationalPass).toBe(false);
  });
});
