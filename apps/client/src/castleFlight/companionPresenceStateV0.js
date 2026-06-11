/**
 * Companion presence.state v0 — PWE truth (not animation, not dormancy UI).
 * dormancy = link-layer (camera/map). state = intentional companion mode.
 */

export const COMPANION_PRESENCE_STATE_V0 = Object.freeze({
  OBSERVING: "observing",
  FOLLOWING: "following",
  SLEEPING: "sleeping",
  EXPLORING: "exploring",
  TRAINING: "training"
});

export const COMPANION_PRESENCE_STATE_LIST_V0 = Object.freeze([
  COMPANION_PRESENCE_STATE_V0.OBSERVING,
  COMPANION_PRESENCE_STATE_V0.FOLLOWING,
  COMPANION_PRESENCE_STATE_V0.SLEEPING,
  COMPANION_PRESENCE_STATE_V0.EXPLORING,
  COMPANION_PRESENCE_STATE_V0.TRAINING
]);

export const COMPANION_PRESENCE_STATE_LABELS_TR_V0 = Object.freeze({
  observing: "Gözlemliyor",
  following: "Eşlik ediyor",
  sleeping: "Uyku (state)",
  exploring: "Keşif",
  training: "Eğitim"
});

export const COMPANION_DORMANCY_UI_V0 = Object.freeze({
  active: null,
  waiting: "Companion yüzeyi kapalı — gözlem alanı henüz açık değil.",
  dormant: "Companion şu anda gözlemlenmiyor."
});

/**
 * @param {string} raw
 * @returns {string}
 */
export function normalizeCompanionPresenceStateV0(raw) {
  const s = String(raw || "").trim().toLowerCase();
  if (COMPANION_PRESENCE_STATE_LIST_V0.includes(s)) return s;
  return COMPANION_PRESENCE_STATE_V0.OBSERVING;
}

/**
 * Presentation-only copy from link dormancy (does not mutate PWE).
 * @param {{ dormancy?: string, observable?: boolean }} presence
 */
export function resolveCompanionDormancyOverlayCopyV0(presence) {
  if (!presence) return null;
  if (presence.observable) return null;
  const d = String(presence.dormancy || "waiting");
  return COMPANION_DORMANCY_UI_V0[d] || COMPANION_DORMANCY_UI_V0.waiting;
}

/**
 * @param {boolean} observable
 * @param {string} [dormancy]
 */
export function shouldShowCompanionDormancyOverlayV0(observable, dormancy) {
  if (observable) return false;
  return dormancy === "dormant" || dormancy === "waiting";
}
