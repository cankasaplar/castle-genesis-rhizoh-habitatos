/**
 * PR: HOME ANCHOR AUTHORITY — canonical identity spatial root (Castle Core, not World demo).
 * SPECFLOW: **RESEARCH-ONLY**
 *
 * **HOME_BASE** is the user's canonical home anchor — **not** a hardcoded district destiny.
 * Sarıyer / demo seeds may exist only as **world-layer calibration or atmosphere** inputs;
 * they must never become identity truth, execution authority, or continuity ownership.
 *
 * **Allowed authority chain (identity-relevant home):**
 *   Firebase Auth → User Profile → `homeAnchor` → `primaryAnchorResolverV0` → world presence / projection consumers
 *
 * **Forbidden as authority source for HOME_BASE:**
 *   UI ad-hoc selection, localStorage, demo config, map drag center, guest overlay picks.
 */

/** Witness list for audits / agent prompts (not an execution engine). */
export const HOME_ANCHOR_AUTHORITY_CHAIN_V0 = Object.freeze([
  "firebase_auth",
  "user_profile",
  "homeAnchor",
  "primaryAnchorResolverV0",
  "worldPresenceRuntime",
  "projection_runtime"
]);

export const FORBIDDEN_HOME_ANCHOR_AUTHORITY_SOURCES_V0 = Object.freeze([
  "ui_selection",
  "localStorage",
  "demo_config",
  "map_drag_center_as_identity",
  "guest_session_overlay",
  "hardcoded_demo_city"
]);

/** Policy note: incremental UI/demo removal tracks against this (see product PRs). */
export const ZERO_DEMO_POLICY_INTENT_V0 =
  "No hardcoded city, guest-first map center, or debug surface may own HOME_BASE identity anchor.";

/**
 * @param {string} sourceTag
 * @returns {{ ok: true } | { ok: false, code: "HOME_ANCHOR_AUTHORITY_VIOLATION", sourceTag: string }}
 */
export function assertHomeAnchorAuthoritySourceAllowedV0(sourceTag) {
  const t = String(sourceTag || "").trim();
  if (!t) return { ok: false, code: "HOME_ANCHOR_AUTHORITY_VIOLATION", sourceTag: String(sourceTag) };
  if (FORBIDDEN_HOME_ANCHOR_AUTHORITY_SOURCES_V0.includes(t)) {
    return { ok: false, code: "HOME_ANCHOR_AUTHORITY_VIOLATION", sourceTag: t };
  }
  return { ok: true };
}
