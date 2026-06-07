/**
 * Rhizoh first-contact copy — perceptual onboarding only (no execution).
 * @see docs/RHIZOH_SOFT_OPEN_PROD_PLAN_V1.md
 */

export const RHIZOH_WELCOME_SEEN_LS_KEY_V1 = "rhizoh.experience.welcome_seen.v1";

/**
 * @param {boolean} tr
 */
export function resolveRhizohFirstWelcomeCopyV1(tr) {
  if (tr) {
    return "Ben Rhizoh. Octo burada. İstersen konuşabilir, haritayı açabilir ya da Cap Wheel'den yeni bir deneyim başlatabilirsin.";
  }
  return "I'm Rhizoh. Octo is here. You can talk, open the map, or start a new experience from the Cap Wheel.";
}

/**
 * @param {boolean} tr
 */
export function resolveRhizohInviteWelcomeCopyV1(tr) {
  if (tr) {
    return "Bir ortama girdin. Ben Rhizoh. Octo burada. İstersen konuşabilir, haritayı açabilir ya da Cap Wheel'den yeni bir deneyim başlatabilirsin.";
  }
  return "You entered an experience. I'm Rhizoh. Octo is here. You can talk, open the map, or start a new experience from the Cap Wheel.";
}

/**
 * @deprecated use resolveRhizohInviteWelcomeCopyV1
 */
export function resolveEventJoinMomentCopyV1(tr, _detail = {}) {
  return resolveRhizohInviteWelcomeCopyV1(tr);
}

export function hasSeenRhizohWelcomeV1() {
  try {
    return window.localStorage.getItem(RHIZOH_WELCOME_SEEN_LS_KEY_V1) === "1";
  } catch {
    return false;
  }
}

export function markRhizohWelcomeSeenV1() {
  try {
    window.localStorage.setItem(RHIZOH_WELCOME_SEEN_LS_KEY_V1, "1");
  } catch {
    /* noop */
  }
}

/** @internal vitest */
export function __resetRhizohWelcomeSeenForTestV1() {
  try {
    window.localStorage.removeItem(RHIZOH_WELCOME_SEEN_LS_KEY_V1);
  } catch {
    /* noop */
  }
}
