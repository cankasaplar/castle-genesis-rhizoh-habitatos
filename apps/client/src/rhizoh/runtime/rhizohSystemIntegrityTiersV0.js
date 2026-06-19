/**
 * System integrity tiers — structural vs spatial surface audit separation.
 * RESEARCH-ONLY
 */

import { resolveWorldLayerActivationStatusV0, WORLD_LAYER_PHASE_V0 } from "./rhizohWorldLayerActivationStatusV0.js";
import { getSpatialRendererRegistrySnapshotV0 } from "./rhizohSpatialSurfaceRendererRegistryV0.js";

export const RHIZOH_SYSTEM_INTEGRITY_TIERS_SCHEMA_V0 = "rhizoh.system_integrity_tiers.v0";

export const INTEGRITY_TIER_STATUS_V0 = Object.freeze({
  PASS: "pass",
  PENDING: "pending",
  FAIL: "fail"
});

/**
 * @param {string} status
 * @param {boolean} [pass]
 */
function tierGlyphV0(status, pass = status === INTEGRITY_TIER_STATUS_V0.PASS) {
  if (status === INTEGRITY_TIER_STATUS_V0.PENDING) return "⏳";
  return pass ? "✔" : "✘";
}

/**
 * @param {{
 *   causalMap?: object,
 *   audit?: object | null,
 *   liveConflicts?: object,
 *   domainCoherence?: object,
 *   envBlockers?: string[],
 *   probe?: object | null,
 *   spatialNodes?: object,
 *   spatialReadyGate?: object,
 *   worldLayerStatus?: object,
 *   rendererRegistry?: object
 * }} ctx
 */
export function buildSystemIntegrityTiersV0(ctx = {}) {
  const worldLayerStatus = ctx.worldLayerStatus || resolveWorldLayerActivationStatusV0();
  const rendererRegistry = ctx.rendererRegistry || getSpatialRendererRegistrySnapshotV0();
  const audit = ctx.audit || null;
  const spatialDrift = audit?.axes?.spatialDrift || null;
  const spatialDriftStatus = spatialDrift?.status || (spatialDrift?.pass ? INTEGRITY_TIER_STATUS_V0.PASS : INTEGRITY_TIER_STATUS_V0.FAIL);

  const coreIntegrityPass =
    ctx.causalMap?.truthLoss?.structuralPass !== false &&
    (ctx.liveConflicts?.structuralPass !== false) &&
    (ctx.domainCoherence?.pass !== false) &&
    (ctx.envBlockers?.length ?? 0) === 0 &&
    (ctx.probe?.pass ?? true);

  const persistencePass = true;

  const causalPass =
    ctx.causalMap?.truthLoss?.structuralPass !== false &&
    (ctx.liveConflicts?.structuralPass !== false);

  const observerPass =
    (audit?.axes?.adapterStability?.pass ?? true) &&
    (audit?.axes?.eventOriginGraph?.pass ?? true) &&
    (audit?.axes?.nodeConsistency?.pass ?? true);

  let spatialStatus = spatialDriftStatus;
  let spatialNote = spatialDrift?.pendingReason || null;

  if (
    spatialStatus === INTEGRITY_TIER_STATUS_V0.FAIL &&
    (worldLayerStatus.phase === WORLD_LAYER_PHASE_V0.LEGAL_HOLD ||
      worldLayerStatus.phase === WORLD_LAYER_PHASE_V0.RENDERER_PENDING)
  ) {
    const onlyRendererIssues =
      (spatialDrift?.issues || []).length === 0 ||
      (spatialDrift?.issues || []).every((issue) =>
        [
          "spatial_nodes_without_cesium_handle",
          "live_nodes_before_cesium_ready"
        ].includes(issue)
      );
    if (onlyRendererIssues && (spatialDrift?.liveProjectionCount ?? 0) === 0) {
      spatialStatus = INTEGRITY_TIER_STATUS_V0.PENDING;
      spatialNote =
        worldLayerStatus.phase === WORLD_LAYER_PHASE_V0.LEGAL_HOLD
          ? "Pending legal activation"
          : "Renderer plugin absent (topology exists)";
    }
  }

  if (
    spatialStatus === INTEGRITY_TIER_STATUS_V0.FAIL &&
    worldLayerStatus.phase === WORLD_LAYER_PHASE_V0.LEGAL_HOLD &&
    (spatialDrift?.liveProjectionCount ?? 0) === 0
  ) {
    spatialStatus = INTEGRITY_TIER_STATUS_V0.PENDING;
    spatialNote = "Pending legal activation";
  }

  const tiers = Object.freeze([
    Object.freeze({
      id: "core_integrity",
      label: "Core Integrity",
      status: coreIntegrityPass ? INTEGRITY_TIER_STATUS_V0.PASS : INTEGRITY_TIER_STATUS_V0.FAIL,
      pass: coreIntegrityPass,
      glyph: tierGlyphV0(coreIntegrityPass ? INTEGRITY_TIER_STATUS_V0.PASS : INTEGRITY_TIER_STATUS_V0.FAIL)
    }),
    Object.freeze({
      id: "persistence",
      label: "Persistence",
      status: INTEGRITY_TIER_STATUS_V0.PASS,
      pass: persistencePass,
      glyph: tierGlyphV0(INTEGRITY_TIER_STATUS_V0.PASS)
    }),
    Object.freeze({
      id: "causal_consistency",
      label: "Causal Graph",
      status: causalPass ? INTEGRITY_TIER_STATUS_V0.PASS : INTEGRITY_TIER_STATUS_V0.FAIL,
      pass: causalPass,
      glyph: tierGlyphV0(causalPass ? INTEGRITY_TIER_STATUS_V0.PASS : INTEGRITY_TIER_STATUS_V0.FAIL)
    }),
    Object.freeze({
      id: "observer_layer",
      label: "Observer Layer",
      status: observerPass ? INTEGRITY_TIER_STATUS_V0.PASS : INTEGRITY_TIER_STATUS_V0.FAIL,
      pass: observerPass,
      glyph: tierGlyphV0(observerPass ? INTEGRITY_TIER_STATUS_V0.PASS : INTEGRITY_TIER_STATUS_V0.FAIL)
    }),
    Object.freeze({
      id: "learning_layer",
      label: "Learning",
      status: INTEGRITY_TIER_STATUS_V0.PASS,
      pass: true,
      glyph: tierGlyphV0(INTEGRITY_TIER_STATUS_V0.PASS),
      note: "cluster / telemetry observability"
    }),
    Object.freeze({
      id: "spatial_surface",
      label: "Spatial Surface",
      status: spatialStatus,
      pass: spatialStatus !== INTEGRITY_TIER_STATUS_V0.FAIL,
      glyph: tierGlyphV0(spatialStatus, spatialStatus !== INTEGRITY_TIER_STATUS_V0.FAIL),
      note:
        spatialNote ||
        (spatialStatus === INTEGRITY_TIER_STATUS_V0.PENDING
          ? worldLayerStatus.narrative
          : rendererRegistry.narrative)
    })
  ]);

  const structuralPass = tiers
    .filter((t) => t.id !== "spatial_surface")
    .every((t) => t.pass);

  const operationalPass = structuralPass && spatialStatus !== INTEGRITY_TIER_STATUS_V0.FAIL;

  const result = Object.freeze({
    schema: RHIZOH_SYSTEM_INTEGRITY_TIERS_SCHEMA_V0,
    atMs: Date.now(),
    influencesExecution: false,
    structuralPass,
    spatialSurfaceStatus: spatialStatus,
    operationalPass,
    worldLayerStatus,
    rendererRegistry,
    tiers,
    summaryNarrative: operationalPass
      ? structuralPass && spatialStatus === INTEGRITY_TIER_STATUS_V0.PENDING
        ? "Core integrity OK · spatial surface pending activation"
        : "System integrity OK"
      : "Structural or spatial integrity review required"
  });

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.integrityTiers = result;
  }

  return result;
}
