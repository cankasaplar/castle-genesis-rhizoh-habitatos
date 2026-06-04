/**
 * Prod browser observability bridge — publishes world OS keys on window.__rhizoh.
 * Ingress can delay AppRhizoh528T0 mount; ops smoke expects presenceFrame / liveMonitor.
 * @see docs/RHIZOH_PROD_FLOW_V0.2.md
 */

import { bootstrapRhizohContinuityFirstPaintV0 } from "./rhizohT0FirstFrameBootstrapV0.js";
import { publishProductionLiveMonitorV0 } from "./rhizohProductionDeploymentRunbookV0.js";
import {
  deriveRhizohPresenceStateV0,
  publishRhizohPresenceStateV0
} from "./rhizohPresenceStateEngineV0.js";
import { publishReslPresentationV0 } from "./rhizohReslPresentationPolicyV0.js";
import { initRhizohProductBindingV0 } from "./rhizohProductBindingV0.js";
import {
  installRhizohControlCenterV0,
  isRhizohControlCenterEnabledV0
} from "../debug/rhizohControlCenterV0.js";

let bridgeStarted = false;
/** @type {ReturnType<typeof setInterval> | null} */
let monitorTimer = null;

function publishDeployStatusAliasV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  const monitor = window.__rhizoh.liveMonitor;
  if (monitor) {
    window.__rhizoh.deployStatus = monitor;
  }
}

/**
 * Synchronous smoke keys — avoids async bootstrap race on prod first paint.
 * @param {{ fieldState?: string, returningUser?: boolean, hasAnchor?: boolean, nowMs?: number }} [ctx]
 */
export function publishProdWorldObservabilitySnapshotV0(ctx = {}) {
  if (typeof window === "undefined") return null;
  const nowMs = Number(ctx.nowMs) || Date.now();
  const state = deriveRhizohPresenceStateV0({
    shellMounted: true,
    quarantine: false,
    fieldState: ctx.fieldState || "IDLE",
    voiceListening: false,
    returningUser: ctx.returningUser === true,
    hasAnchor: ctx.hasAnchor === true,
    lastUserActivityMs: nowMs - 45_000,
    lastRhizohActivityMs: nowMs,
    nowMs
  });
  publishRhizohPresenceStateV0(state);
  publishReslPresentationV0(state, { nowMs });
  publishProductionLiveMonitorV0();
  publishDeployStatusAliasV0();
  return state;
}

/**
 * @param {{ fieldState?: string, returningUser?: boolean, hasAnchor?: boolean }} [ctx]
 */
export async function primeProdWorldObservabilityBridgeV0(ctx = {}) {
  await bootstrapRhizohContinuityFirstPaintV0({
    fieldState: ctx.fieldState || "IDLE",
    returningUser: ctx.returningUser === true,
    hasAnchor: ctx.hasAnchor === true
  });
  publishProductionLiveMonitorV0();
  publishDeployStatusAliasV0();
}

/**
 * @param {{ fieldState?: string, returningUser?: boolean, hasAnchor?: boolean }} [ctx]
 */
export function startProdWorldObservabilityBridgeV0(ctx = {}) {
  if (typeof window === "undefined" || bridgeStarted) {
    return Object.freeze({ started: false, reason: bridgeStarted ? "already_started" : "no_window" });
  }
  bridgeStarted = true;

  initRhizohProductBindingV0();
  if (isRhizohControlCenterEnabledV0()) {
    installRhizohControlCenterV0();
  }
  publishProdWorldObservabilitySnapshotV0(ctx);
  void primeProdWorldObservabilityBridgeV0(ctx).catch(() => {});

  monitorTimer = setInterval(() => {
    try {
      publishProductionLiveMonitorV0();
      publishDeployStatusAliasV0();
    } catch {
      /* noop */
    }
  }, 5000);

  return Object.freeze({ started: true, schema: "castle.rhizoh.prod_world_observability_bridge.v0" });
}

export function stopProdWorldObservabilityBridgeV0() {
  if (monitorTimer) {
    clearInterval(monitorTimer);
    monitorTimer = null;
  }
  bridgeStarted = false;
}

export function resetProdWorldObservabilityBridgeForTestV0() {
  stopProdWorldObservabilityBridgeV0();
}
