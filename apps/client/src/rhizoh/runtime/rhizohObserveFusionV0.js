/**
 * OBSERVE intent — single product entry; internal branches only.
 * Rule: physical input (box mic/cam) never spawns entities — data feed only.
 * Companion = derived fusion(world ready + map observation field), not button-spawned.
 * @see docs/RHIZOH_MEDIA_LAYER_STACK_V0.md
 */

import { isWorldFirstObservationCompleteV0, WORLD_FIRST_OBS_EVENT_V0 } from "../../castleFlight/worldFirstObservationV0.js";
import { readCesiumObservationCameraV0 } from "../../castleFlight/castleCompanionObservationPresenceV0.js";
import {
  readCastlePweV0,
  spawnObservationCompanionV0
} from "../../castleFlight/castlePersistentWorldEntityV0.js";
import { tickCompanionObservationPresenceV0 } from "../../castleFlight/castleCompanionObservationPresenceV0.js";
import { readRhizohObservationFeedV0, RHIZOH_OBS_FEED_EVENT_V0 } from "./rhizohObservationFeedV0.js";

export const RHIZOH_OBSERVE_FUSION_SCHEMA_V0 = "castle.rhizoh_observe_fusion.v0";
export const RHIZOH_OBSERVE_FUSION_EVENT_V0 = "castle:rhizoh-observe-fusion-v0";

export const OBSERVE_INTENT_COPY_TR_V0 = Object.freeze({
  worldGateTitle: "Gözlem başlat",
  worldGateSubtitle: "Dünyayı gözlemle — tek giriş. Kale ve fiziksel kamera ayrı adımlar.",
  deviceIngressOnly: "Yalnızca fiziksel giriş (Rhizoh Box). Dünya veya companion doğurmaz."
});

/**
 * @param {{ mapSurfaceActive?: boolean }} [ctx]
 */
export function isMapObservationFieldOpenV0(ctx = {}) {
  if (ctx.mapSurfaceActive === false) return false;
  try {
    if (window.__CASTLE_CESIUM__?.ready !== true) return false;
    return !!readCesiumObservationCameraV0(ctx);
  } catch {
    return false;
  }
}

/**
 * @param {{ mapSurfaceActive?: boolean }} [ctx]
 */
export function evaluateObserveFusionV0(ctx = {}) {
  const worldReady = isWorldFirstObservationCompleteV0();
  const mapField = isMapObservationFieldOpenV0(ctx);
  const feed = readRhizohObservationFeedV0();
  const deviceFeedActive = Boolean(feed?.boxStreamActive);
  const pwe = readCastlePweV0();
  const companionEligible = worldReady && mapField;
  const companionMounted = Boolean(pwe?.mounted && !pwe.destroyed);

  return Object.freeze({
    schema: RHIZOH_OBSERVE_FUSION_SCHEMA_V0,
    intent: "observe",
    worldReady,
    mapField,
    deviceFeedActive,
    companionEligible,
    companionMounted,
    companionVisible: companionMounted && Boolean(pwe?.presence?.observable),
    atMs: Date.now()
  });
}

function publishObserveFusionV0(snap) {
  if (typeof window === "undefined") return snap;
  window.__RHIZOH_OBSERVE_FUSION__ = snap;
  try {
    window.dispatchEvent(new CustomEvent(RHIZOH_OBSERVE_FUSION_EVENT_V0, { detail: snap }));
  } catch {
    /* noop */
  }
  return snap;
}

/**
 * Reconcile derived companion — never called from box camera/mic toggles.
 * @param {{ mapSurfaceActive?: boolean, owner?: string, readClientContinuity?: Function, writeClientContinuity?: Function }} [ctx]
 */
export function reconcileObserveFusionV0(ctx = {}) {
  const snap = evaluateObserveFusionV0(ctx);
  publishObserveFusionV0(snap);

  if (!snap.companionEligible) {
    if (snap.companionMounted) {
      tickCompanionObservationPresenceV0(ctx);
    }
    return snap;
  }

  if (!snap.companionMounted) {
    const owner =
      ctx.owner ||
      window.__RHIZOH_WORLD_OBS__?.owner ||
      "GUEST";
    spawnObservationCompanionV0(owner, {
      readClientContinuity: ctx.readClientContinuity,
      writeClientContinuity: ctx.writeClientContinuity
    });
  }
  tickCompanionObservationPresenceV0(ctx);
  return evaluateObserveFusionV0(ctx);
}

/**
 * @param {() => boolean} getMapActive
 * @param {{ readClientContinuity?: Function, writeClientContinuity?: Function }} [deps]
 * @returns {() => void}
 */
export function installObserveFusionBridgeV0(getMapActive = () => true, deps = {}) {
  if (typeof window === "undefined") return () => {};

  let raf = 0;
  let lastMs = 0;

  const tick = () =>
    reconcileObserveFusionV0({
      mapSurfaceActive: getMapActive(),
      ...deps
    });

  tick();

  const loop = (now) => {
    if (now - lastMs >= 280) {
      lastMs = now;
      tick();
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  const onWorld = () => tick();
  const onFeed = () => {
    publishObserveFusionV0(evaluateObserveFusionV0({ mapSurfaceActive: getMapActive() }));
  };

  window.addEventListener(WORLD_FIRST_OBS_EVENT_V0, onWorld);
  window.addEventListener(RHIZOH_OBS_FEED_EVENT_V0, onFeed);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener(WORLD_FIRST_OBS_EVENT_V0, onWorld);
    window.removeEventListener(RHIZOH_OBS_FEED_EVENT_V0, onFeed);
  };
}
