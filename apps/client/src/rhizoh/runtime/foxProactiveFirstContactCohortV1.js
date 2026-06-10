/**
 * FOX_FIRST_CONTACT_COHORT_V1 — observation metrics + instrumentation surface.
 */

import { getFoxProactiveCalibrationV1 } from "./foxProactiveAdaptationV1.js";
import { getFoxIdentityAnchorV1 } from "./foxIdentityAnchorV1.js";
import { isCastleDebugGranularFlagEnabled } from "./castleDebugGateV0.js";
import { logVoiceInfoV0 } from "./rhizohProductionLogNamespacesV0.js";
import {
  resolveFoxFirstContactDeploymentV1,
  __resetFoxFirstContactDeploymentForTestV1
} from "./foxProactiveDeploymentGateV1.js";

export {
  FOX_FIRST_CONTACT_COHORT_V1,
  FOX_FIRST_CONTACT_PHASE_V1,
  resolveFoxFirstContactDeploymentV1,
  isFoxFirstContactAnchorUserV1,
  pinFoxFirstContactAnchorUserV1,
  shouldFoxCalibrationPersistWriteV1,
  resolveFoxProactiveHardCapPerHourV1,
  resolveFoxProactiveEffectiveCooldownMinutesV1,
  __resetFoxFirstContactDeploymentForTestV1
} from "./foxProactiveDeploymentGateV1.js";

export const FOX_FIRST_CONTACT_COHORT_SCHEMA_V1 = "castle.rhizoh.fox_first_contact_cohort.v1";
export const RHIZOH_FOX_FIRST_CONTACT_METRICS_EVENT_V1 = "rhizoh:fox-first-contact-metrics-v1";

function round3(n) {
  return Math.round(Number(n) * 1000) / 1000;
}

/**
 * @param {ReturnType<typeof getFoxProactiveCalibrationV1>} calibration
 */
export function buildFoxFirstContactStabilityMetricsV1(calibration) {
  const cal = calibration || getFoxProactiveCalibrationV1();
  const drift = cal.calibrationDrift || {};
  const within = drift.withinAnchor || {};
  const anchor = getFoxIdentityAnchorV1();

  const thresholdDrift = Math.abs(Number(drift.significanceThreshold) || 0);
  const dismissRate = Number(cal.dismissRate) || 0;

  const foxStabilityOk =
    within.threshold !== false && thresholdDrift <= anchor.stabilityPrior.maxThresholdDrift + 0.001;
  const toleranceOk = within.tolerance !== false && dismissRate < 0.4;
  const identityOk =
    Object.values(within).length === 0 || Object.values(within).every((v) => v !== false);

  return Object.freeze({
    schema: FOX_FIRST_CONTACT_COHORT_SCHEMA_V1,
    atMs: Date.now(),
    foxStability: Object.freeze({
      thresholdDrift: round3(drift.significanceThreshold),
      withinAnchor: within.threshold !== false,
      ok: foxStabilityOk
    }),
    proactiveToleranceDrift: Object.freeze({
      tolerance: round3(cal.proactiveTolerance),
      drift: round3(drift.proactiveTolerance),
      dismissRate: round3(dismissRate),
      userDiscomfortSignal: dismissRate >= 0.35,
      ok: toleranceOk
    }),
    identityConsistency: Object.freeze({
      toneModulationActive: cal.toneModulation?.active === true,
      sameEntityFeel: identityOk,
      ok: identityOk
    }),
    overallStable: foxStabilityOk && toleranceOk && identityOk
  });
}

export function publishFoxFirstContactObservationV1() {
  if (typeof window === "undefined") return null;
  const deployment = resolveFoxFirstContactDeploymentV1();
  const calibration = getFoxProactiveCalibrationV1();
  const metrics = buildFoxFirstContactStabilityMetricsV1(calibration);
  const fullInstrumentation =
    deployment.active &&
    (import.meta.env?.DEV === true ||
      isCastleDebugGranularFlagEnabled("VITE_RHIZOH_PERCEPTION_DEBUG") ||
      String(import.meta.env?.VITE_FOX_FIRST_CONTACT_INSTRUMENTATION ?? "1") !== "0");

  const observation = Object.freeze({
    schema: FOX_FIRST_CONTACT_COHORT_SCHEMA_V1,
    deployment: Object.freeze({ ...deployment, fullInstrumentation }),
    metrics,
    calibration,
    identityAnchor: getFoxIdentityAnchorV1().proactiveLimits
  });

  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.foxFirstContact = observation;

  if (deployment.active && fullInstrumentation) {
    logVoiceInfoV0("FOX_FIRST_CONTACT_METRICS", {
      phase: deployment.phase,
      overallStable: metrics.overallStable,
      dismissRate: metrics.proactiveToleranceDrift.dismissRate,
      thresholdDrift: metrics.foxStability.thresholdDrift
    });
  }

  try {
    window.dispatchEvent(
      new CustomEvent(RHIZOH_FOX_FIRST_CONTACT_METRICS_EVENT_V1, { detail: observation })
    );
  } catch {
    /* noop */
  }

  return observation;
}

export function mountFoxFirstContactObservationV1() {
  publishFoxFirstContactObservationV1();
}

export function shouldShowFoxFirstContactStripV1() {
  const deploy = resolveFoxFirstContactDeploymentV1();
  if (!deploy.active) return false;
  return (
    import.meta.env?.DEV === true ||
    isCastleDebugGranularFlagEnabled("VITE_RHIZOH_PERCEPTION_DEBUG") ||
    String(import.meta.env?.VITE_FOX_FIRST_CONTACT_INSTRUMENTATION ?? "1") !== "0"
  );
}

/** @internal vitest */
export function __resetFoxFirstContactForTestV1() {
  __resetFoxFirstContactDeploymentForTestV1();
}
