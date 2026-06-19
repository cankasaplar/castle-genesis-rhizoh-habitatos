/**
 * Rhizoh Grounding Layer v1 — external anchor vs internal semantic weighting.
 * Prevents self-referential drift; rescues low-weight but world-important signals.
 */

import { logVoiceInfoV0 } from "./rhizohProductionLogNamespacesV0.js";
import { bootstrapInternalSemanticMassV0 } from "./causalGraphSpatialBridgeV0.js";

export const RHIZOH_GROUNDING_LAYER_SCHEMA_V1 = "rhizoh.grounding_layer.v1";

export const GROUND_SIGNAL_KIND_V1 = Object.freeze({
  USER_SPEECH: "user_speech",
  USER_ACTIVITY: "user_activity",
  GATEWAY_WS_FAIL: "gateway_ws_fail",
  GATEWAY_HTTP_OK: "gateway_http_ok",
  MIC_OPEN: "mic_open",
  FOCUS_CHANGE: "focus_change",
  EXTERNAL_ANOMALY: "external_anomaly",
  COMPUTE_DEGRADED: "compute_degraded"
});

const SIGNAL_WEIGHT_V1 = Object.freeze({
  [GROUND_SIGNAL_KIND_V1.USER_SPEECH]: 0.92,
  [GROUND_SIGNAL_KIND_V1.USER_ACTIVITY]: 0.55,
  [GROUND_SIGNAL_KIND_V1.GATEWAY_WS_FAIL]: 0.78,
  [GROUND_SIGNAL_KIND_V1.GATEWAY_HTTP_OK]: 0.35,
  [GROUND_SIGNAL_KIND_V1.MIC_OPEN]: 0.7,
  [GROUND_SIGNAL_KIND_V1.FOCUS_CHANGE]: 0.25,
  [GROUND_SIGNAL_KIND_V1.EXTERNAL_ANOMALY]: 0.88,
  [GROUND_SIGNAL_KIND_V1.COMPUTE_DEGRADED]: 0.42
});

const SIGNAL_TTL_MS_V1 = 5 * 60 * 1000;
const MISMATCH_THRESHOLD_V1 = 0.38;

/** @type {object[]} */
const groundSignalsV1 = [];
/** @type {object | null} */
let lastGroundingEvalV1 = null;

/**
 * @param {string} kind
 * @param {object} [meta]
 */
export function noteGroundSignalV1(kind, meta = {}) {
  const row = Object.freeze({
    kind,
    weight: SIGNAL_WEIGHT_V1[kind] ?? 0.3,
    atMs: Date.now(),
    meta: meta && typeof meta === "object" ? Object.freeze({ ...meta }) : null
  });
  groundSignalsV1.push(row);
  if (groundSignalsV1.length > 48) groundSignalsV1.shift();
  publishGroundingV1();
  return row;
}

function activeSignalsV1() {
  const cutoff = Date.now() - SIGNAL_TTL_MS_V1;
  return groundSignalsV1.filter((s) => s.atMs >= cutoff);
}

function externalSignalMassV1(signals) {
  if (!signals.length) return 0;
  const mass = signals.reduce((sum, s) => sum + s.weight, 0);
  return Number(Math.min(2.5, mass / signals.length).toFixed(3));
}

/**
 * @param {object} ctx
 */
export function evaluateGroundingV1(ctx = {}) {
  const signals = activeSignalsV1();
  const externalMass = externalSignalMassV1(signals);
  const rawInternalMass = Number(ctx.semanticMass ?? 0);
  const bootstrap = bootstrapInternalSemanticMassV0({ currentMass: rawInternalMass });
  const internalMass = bootstrap.bootstrapped ? bootstrap.mass : rawInternalMass;
  const mismatch = Math.abs(externalMass - internalMass) > MISMATCH_THRESHOLD_V1;

  const wsFail =
    ctx.transport?.wsUpgradeFailed === true ||
    signals.some((s) => s.kind === GROUND_SIGNAL_KIND_V1.GATEWAY_WS_FAIL);
  const userActive = signals.some(
    (s) =>
      s.kind === GROUND_SIGNAL_KIND_V1.USER_SPEECH ||
      s.kind === GROUND_SIGNAL_KIND_V1.USER_ACTIVITY ||
      s.kind === GROUND_SIGNAL_KIND_V1.MIC_OPEN
  );

  const recentLog = ctx.eventLog?.recent || [];
  const wsLoggedRecently = recentLog.some(
    (e) => e.type === "transport_switch" && Date.now() - e.atMs < 120_000
  );
  const anomalyInjected = wsFail && !wsLoggedRecently;

  /** @type {object[]} */
  const telemetryRescue = [];
  if (wsFail && ctx.governance?.suppressed) {
    telemetryRescue.push(
      Object.freeze({
        reason: "ws_fail_world_anchor",
        kind: "transport_switch",
        message: "WS blocked — world signal overrides internal suppression."
      })
    );
  }
  if (anomalyInjected) {
    telemetryRescue.push(
      Object.freeze({
        reason: "anomaly_injection",
        kind: "external_anomaly",
        message: "External anomaly not yet reflected in identity log."
      })
    );
  }
  if (mismatch && userActive && internalMass < 0.5) {
    telemetryRescue.push(
      Object.freeze({
        reason: "user_active_low_internal_mass",
        kind: "user_activity",
        message: "User active in world but internal semantic mass low."
      })
    );
  }

  const unexpectedImportant = telemetryRescue.length > 0;
  const worldAnchored = externalMass >= 0.35 || userActive || wsFail;

  const evalOut = Object.freeze({
    schema: RHIZOH_GROUNDING_LAYER_SCHEMA_V1,
    atMs: Date.now(),
    worldAnchored,
    externalMass,
    internalMass,
    internalMassBootstrapped: bootstrap.bootstrapped === true,
    internalMassSource: bootstrap.source,
    mismatch,
    anomalyInjected,
    unexpectedImportant,
    telemetryRescue: Object.freeze(telemetryRescue),
    activeSignalCount: signals.length,
    semanticBiasRisk: internalMass > 1.2 && externalMass < 0.25,
    selfReferentialDrift: mismatch && !worldAnchored
  });

  lastGroundingEvalV1 = evalOut;
  publishGroundingV1();
  return evalOut;
}

/**
 * Apply world-anchor override on governance suppression.
 * @param {object} governance
 * @param {object} grounding
 */
export function applyGroundingOverrideV1(governance, grounding) {
  if (!grounding?.unexpectedImportant || !governance) return governance;
  const rescue = grounding.telemetryRescue[0];
  if (!rescue) return governance;

  logVoiceInfoV0("GROUNDING_OVERRIDE", {
    reason: rescue.reason,
    priorSuppress: governance.suppressReason
  });

  return Object.freeze({
    ...governance,
    suppressed: false,
    suppressReason: null,
    emit: true,
    groundingOverride: rescue.reason,
    voiceEligible: governance.voiceEligible,
    uiEligible: true,
    logAllowed: true,
    logOnly: false,
    dominantChannel: governance.voiceEligible ? "voice" : "ui_presence",
    eventWeight: Math.max(governance.eventWeight, 0.55),
    telemetryRescued: true
  });
}

/**
 * Fast path — CRITICAL user events bypass heavy governance inflation.
 * @param {object} candidate
 */
export function isGovernanceFastPathV1(candidate = {}) {
  return (
    candidate.userInitiated === true ||
    candidate.presenceKind === "presence_ack" ||
    candidate.intent === "presence"
  );
}

export function getGroundingLayerSnapshotV1() {
  return (
    lastGroundingEvalV1 ||
    Object.freeze({
      schema: RHIZOH_GROUNDING_LAYER_SCHEMA_V1,
      worldAnchored: false,
      evaluated: false
    })
  );
}

function publishGroundingV1() {
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.groundingLayer = getGroundingLayerSnapshotV1();
    window.__rhizoh.groundSignals = Object.freeze(activeSignalsV1().slice(-8));
  }
}

/** @internal vitest */
export function __resetGroundingLayerForTestV1() {
  groundSignalsV1.length = 0;
  lastGroundingEvalV1 = null;
}
