/**
 * Layer 2 — Observation feed (physical box stream state).
 * Not Companion (PWE) and not Cesium map camera.
 * @see docs/RHIZOH_MEDIA_LAYER_STACK_V0.md
 */

export const RHIZOH_OBSERVATION_FEED_SCHEMA_V0 = "castle.rhizoh_observation_feed.v0";
export const RHIZOH_OBS_FEED_EVENT_V0 = "castle:rhizoh-observation-feed-v0";

/** Physical Rhizoh Box A/V ingress — not map frustum, not companion mood. */
export const OBSERVATION_FEED_STATE_V0 = Object.freeze({
  IDLE: "idle",
  ACTIVE: "active",
  MUTED: "muted"
});

export const OBSERVATION_FEED_COPY_TR_V0 = Object.freeze({
  cameraButtonTitle: "Box girişi — yalnızca fiziksel kamera/mikrofon",
  cameraButtonTitleOn: "Box girişini kapat (dünya/companion etkilenmez)",
  cameraAriaOff: "Rhizoh Box fiziksel giriş aç",
  cameraAriaOn: "Rhizoh Box fiziksel giriş kapat",
  pulseOn: "Box girişi açık (veri akışı)",
  pulseOff: "Box girişi kapalı",
  errorTitle: "Rhizoh Box girişi",
  errorDetail: "USB kamera veya mikrofon izni yok; cihaz bulunamadı."
});

/**
 * @param {Partial<{ state: string, source: string, muted: boolean, boxStreamActive: boolean, resolveStep?: string }>} patch
 */
export function publishRhizohObservationFeedV0(patch = {}) {
  if (typeof window === "undefined") return null;
  const prev =
    window.__RHIZOH_OBSERVATION_FEED__ && typeof window.__RHIZOH_OBSERVATION_FEED__ === "object"
      ? window.__RHIZOH_OBSERVATION_FEED__
      : {};
  const state = String(patch.state || prev.state || OBSERVATION_FEED_STATE_V0.IDLE);
  const snap = Object.freeze({
    schema: RHIZOH_OBSERVATION_FEED_SCHEMA_V0,
    layer: "observation_feed",
    state,
    muted: Boolean(patch.muted ?? prev.muted),
    boxStreamActive: Boolean(patch.boxStreamActive ?? prev.boxStreamActive),
    source: patch.source != null ? String(patch.source) : prev.source || null,
    resolveStep: patch.resolveStep != null ? String(patch.resolveStep) : prev.resolveStep || null,
    atMs: Date.now()
  });
  window.__RHIZOH_OBSERVATION_FEED__ = snap;
  try {
    window.dispatchEvent(new CustomEvent(RHIZOH_OBS_FEED_EVENT_V0, { detail: snap }));
  } catch {
    /* noop */
  }
  return snap;
}

export function readRhizohObservationFeedV0() {
  if (typeof window === "undefined") return null;
  return window.__RHIZOH_OBSERVATION_FEED__ || null;
}
