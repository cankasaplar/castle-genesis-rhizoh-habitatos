/**
 * Genesis observability surface lock v0.1 — epistemic invariance layer (not crash prevention).
 * Research vs observability deploy modes; H_surface mismatch (import / structural) → Legacy Drift UI.
 * Cross-version merge is out of scope here: old streams are historical slices, not silently merged.
 */

import { EPISTEMIC_VECTOR_FIELD_DYNAMICS_MODEL_V022 } from "./genesisEpistemicVectorFieldDynamicsV0.js";
import { GENESIS_SURFACE_PROTOCOL_ARTIFACT_VERSION } from "./genesisSurfaceArtifactV0.js";

export const GENESIS_SURFACE_LOCK_SPEC_VERSION = /** @type {const} */ ("v0.1");

export const GENESIS_DEPLOY_MODE_RESEARCH = /** @type {const} */ ("research");
export const GENESIS_DEPLOY_MODE_OBSERVABILITY = /** @type {const} */ ("observability");

/**
 * Locked metric-topology fingerprint for v0.2.2-pre-release + surface artifact v0.14.
 * Bump manifest + recompute (tests enforce) when observability contract changes.
 */
export const LOCKED_H_SURFACE_V022_PRE_RELEASE_V01 = /** @type {const} */ ("fnv1a32_v01:a7780189");

/** @param {string} s */
export function fnv1a32HexV01(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/**
 * Canonical observability manifest (v0.2.2-pre). Sorted slots = metric topology under lock.
 * @returns {Readonly<{ v: number; surfaceLock: string; surfaceArtifactVersion: string; modelDynamics: string; metricTopologySlots: readonly string[]; preReleaseLabel: string }>}
 */
export function buildGenesisObservabilitySurfaceManifestV022PreV01() {
  return Object.freeze({
    v: 0,
    surfaceLock: GENESIS_SURFACE_LOCK_SPEC_VERSION,
    surfaceArtifactVersion: GENESIS_SURFACE_PROTOCOL_ARTIFACT_VERSION,
    modelDynamics: EPISTEMIC_VECTOR_FIELD_DYNAMICS_MODEL_V022,
    metricTopologySlots: Object.freeze(
      [
        "anomalyField",
        "channelTVL1",
        "cumulativeIntegralTensor",
        "emaMultiScale",
        "phase01",
        "regimeCoherence",
        "regimeQuantize",
        "scaleInterference",
        "sequentialAlignment",
        "stabilityFunctional",
        "stabilityGradient"
      ].sort()
    ),
    preReleaseLabel: /** @type {const} */ ("v0.2.2-pre-release")
  });
}

/**
 * @param {ReturnType<typeof buildGenesisObservabilitySurfaceManifestV022PreV01>} manifest
 */
export function computeGenesisHSurfaceV01(manifest) {
  const canonical = JSON.stringify({
    v: manifest.v,
    surfaceLock: manifest.surfaceLock,
    surfaceArtifactVersion: manifest.surfaceArtifactVersion,
    modelDynamics: manifest.modelDynamics,
    metricTopologySlots: [...manifest.metricTopologySlots].sort()
  });
  return `fnv1a32_v01:${fnv1a32HexV01(canonical)}`;
}

export function getGenesisDeployModeV01() {
  const raw = String(
    typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_GENESIS_DEPLOY_MODE
      ? import.meta.env.VITE_GENESIS_DEPLOY_MODE
      : ""
  )
    .trim()
    .toLowerCase();
  if (raw === GENESIS_DEPLOY_MODE_OBSERVABILITY) return GENESIS_DEPLOY_MODE_OBSERVABILITY;
  return GENESIS_DEPLOY_MODE_RESEARCH;
}

/**
 * Structural contract for v0.2.2 observability slice (presence of topology nodes, not values).
 * @param {unknown} epistemicDynamicsBundle
 */
export function genesisObservabilityStructuralContractOkV01(epistemicDynamicsBundle) {
  const b = epistemicDynamicsBundle && typeof epistemicDynamicsBundle === "object" ? epistemicDynamicsBundle : null;
  const f =
    b && "epistemicAnomalyFieldV01" in b && b.epistemicAnomalyFieldV01 && typeof b.epistemicAnomalyFieldV01 === "object"
      ? /** @type {Record<string, unknown>} */ (b.epistemicAnomalyFieldV01)
      : null;
  if (!f) return false;
  const ms = f.emaMultiScaleOfA;
  return !!(
    f.scaleInterference01 &&
    f.regimeCoherence01 &&
    Array.isArray(ms) &&
    ms.length > 0
  );
}

/**
 * @param {{
 *   epistemicEpochCount?: number;
 *   passiveEpochMax?: number;
 *   structuralContractSatisfied?: boolean;
 *   importedHSurface01?: string | null;
 *   simulateLegacyDrift?: boolean;
 * }} [options]
 */
export function resolveGenesisSurfaceLockStateV01(options = {}) {
  const deployMode = getGenesisDeployModeV01();
  const manifest = buildGenesisObservabilitySurfaceManifestV022PreV01();
  const hSurfaceComputed01 = computeGenesisHSurfaceV01(manifest);
  const passiveEpochMaxRaw = Number(
    typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_GENESIS_PASSIVE_EPOCH_MAX != null
      ? import.meta.env.VITE_GENESIS_PASSIVE_EPOCH_MAX
      : 100
  );
  const passiveEpochMax = Number.isFinite(passiveEpochMaxRaw) && passiveEpochMaxRaw > 0 ? Math.floor(passiveEpochMaxRaw) : 100;
  const epistemicEpochCount = Math.max(0, Math.floor(Number(options.epistemicEpochCount ?? 0)));
  const passiveObservabilityEpoch =
    deployMode === GENESIS_DEPLOY_MODE_OBSERVABILITY && epistemicEpochCount <= passiveEpochMax;

  const simulateLegacy =
    Boolean(options.simulateLegacyDrift) ||
    String(
      typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_GENESIS_SIMULATE_LEGACY_DRIFT
        ? import.meta.env.VITE_GENESIS_SIMULATE_LEGACY_DRIFT
        : ""
    ).trim() === "1";

  const imported = options.importedHSurface01 != null ? String(options.importedHSurface01).trim() : "";
  const importedMismatch =
    deployMode === GENESIS_DEPLOY_MODE_OBSERVABILITY &&
    imported.length > 0 &&
    imported !== LOCKED_H_SURFACE_V022_PRE_RELEASE_V01;

  const structuralOk = options.structuralContractSatisfied !== false;
  const legacyDriftMode =
    deployMode === GENESIS_DEPLOY_MODE_OBSERVABILITY && (simulateLegacy || importedMismatch || !structuralOk);

  const selfTestLockMatch = hSurfaceComputed01 === LOCKED_H_SURFACE_V022_PRE_RELEASE_V01;

  return {
    v: 0,
    deployMode,
    manifest,
    hSurfaceComputed01,
    hSurfaceExpected01: LOCKED_H_SURFACE_V022_PRE_RELEASE_V01,
    legacyDriftMode,
    passiveObservabilityEpoch,
    passiveEpochMax,
    epistemicEpochCount,
    surfaceLockSpecVersion: GENESIS_SURFACE_LOCK_SPEC_VERSION,
    selfTestLockMatch
  };
}

/** @returns {Readonly<{ v: number; driftSeriesRole: string; checkpointRangeRole: string; checkpointLineageRole: string; runtimeSnapshotRole: string; uiNormalizationPolicy: string }>} */
export function genesisStreamCheckpointSeparationEnvelopeV01() {
  return Object.freeze({
    v: 0,
    driftSeriesRole: "temporal_cross_origin_stream_client_only",
    checkpointRangeRole: "gateway_get_rhizoh_genesis_checkpoint_range",
    checkpointLineageRole: "gateway_get_rhizoh_genesis_checkpoint_lineage",
    runtimeSnapshotRole: "gateway_get_rhizoh_genesis_runtime",
    uiNormalizationPolicy: "no_merge_stream_into_checkpoint_or_runtime"
  });
}
