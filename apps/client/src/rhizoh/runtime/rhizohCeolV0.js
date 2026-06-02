/**
 * CEOL v0 — Continuity Entry Orientation Layer (first 5s choreography).
 * @see docs/RHIZOH_CEOL_V0.md
 */

import {
  FCL_ENTRY_FIRST_V0,
  FCL_ENTRY_RETURN_V0,
  FCL_ENTRY_SAME_SESSION_V0
} from "./rhizohFlowContinuityV0.js";
import { CONTINUITY_NO_EMPTY_RESTORE_V0 } from "./continuitySeamlessEntryV0.js";

export const RHIZOH_CEOL_CONTRACT_V0 = "rhizoh-ceol-v0";

export const CEOL_BINDING_SENTENCE_V0 =
  "CEOL choreographs the first five seconds so continuity emerges before explanation — never an empty screen.";

export const CEOL_NO_EMPTY_SCREEN_GUARANTEE_V0 = CONTINUITY_NO_EMPTY_RESTORE_V0;

export const RHIZOH_CEOL_START_EVENT_V0 = "rhizoh:ceol-start";
export const RHIZOH_CEOL_CHOREOGRAPHY_EVENT_V0 = "rhizoh:ceol-choreography";

export const CEOL_STATE_T0_READY_V0 = "T0_READY";
export const CEOL_STATE_ORIENTATION_EMERGE_V0 = "ORIENTATION_EMERGE";
export const CEOL_STATE_SOFT_INVITE_V0 = "SOFT_INVITE";
export const CEOL_STATE_FLOW_THREAD_V0 = "FLOW_THREAD";
export const CEOL_STATE_PLAY_READY_V0 = "PLAY_READY";

export const CEOL_FIRST_TIMELINE_MS_V0 = Object.freeze({
  T0_READY_END: 400,
  ORIENTATION_END: 1200,
  SOFT_INVITE_END: 2800,
  FLOW_THREAD_END: 5000
});

export const CEOL_RETURN_TIMELINE_MS_V0 = Object.freeze({
  T0_READY_END: 400,
  ORIENTATION_END: 1000,
  SOFT_INVITE_END: 2000,
  FLOW_THREAD_END: 3000
});

/** @type {readonly string[]} */
export const CEOL_CHOREOGRAPHY_STATES_V0 = Object.freeze([
  CEOL_STATE_T0_READY_V0,
  CEOL_STATE_ORIENTATION_EMERGE_V0,
  CEOL_STATE_SOFT_INVITE_V0,
  CEOL_STATE_FLOW_THREAD_V0,
  CEOL_STATE_PLAY_READY_V0
]);

/**
 * @param {number} elapsedMs
 * @param {typeof CEOL_FIRST_TIMELINE_MS_V0 | typeof CEOL_RETURN_TIMELINE_MS_V0} timeline
 */
function stateForElapsedV0(elapsedMs, timeline) {
  const t = Math.max(0, Number(elapsedMs) || 0);
  if (t < timeline.T0_READY_END) return CEOL_STATE_T0_READY_V0;
  if (t < timeline.ORIENTATION_END) return CEOL_STATE_ORIENTATION_EMERGE_V0;
  if (t < timeline.SOFT_INVITE_END) return CEOL_STATE_SOFT_INVITE_V0;
  if (t < timeline.FLOW_THREAD_END) return CEOL_STATE_FLOW_THREAD_V0;
  return CEOL_STATE_PLAY_READY_V0;
}

/**
 * @param {string} state
 * @param {string} entryMode
 */
function visibilityForStateV0(_state, _entryMode) {
  /** CEOL no longer floods the screen — chrome panels default closed; user toggles open. */
  return Object.freeze({
    show_world_substrate: true,
    show_context_strip: false,
    show_soft_affordances: false,
    show_flow_continuity: false,
    show_intent_anchors: false,
    show_surface_rail: false,
    show_next_action_anchor: false,
    allow_input_focus: true
  });
}

/**
 * @param {{
 *   elapsedMs?: number,
 *   entryMode?: string,
 *   sessionStartedAt?: number
 * }} [input]
 */
export function resolveCeolChoreographyV0(input = {}) {
  const entryMode = String(
    input.entryMode || FCL_ENTRY_FIRST_V0
  );
  const timeline =
    entryMode === FCL_ENTRY_RETURN_V0
      ? CEOL_RETURN_TIMELINE_MS_V0
      : CEOL_FIRST_TIMELINE_MS_V0;

  let elapsedMs = Number(input.elapsedMs);
  if (!Number.isFinite(elapsedMs) && input.sessionStartedAt) {
    elapsedMs = Date.now() - Number(input.sessionStartedAt);
  }
  if (!Number.isFinite(elapsedMs)) elapsedMs = CEOL_FIRST_TIMELINE_MS_V0.FLOW_THREAD_END + 1;

  const sameSessionFastPath =
    entryMode === FCL_ENTRY_SAME_SESSION_V0 &&
    elapsedMs > CEOL_FIRST_TIMELINE_MS_V0.T0_READY_END;

  const state = sameSessionFastPath
    ? CEOL_STATE_PLAY_READY_V0
    : stateForElapsedV0(elapsedMs, timeline);

  const visibility = visibilityForStateV0(state, entryMode);

  const payload = Object.freeze({
    contract_version: RHIZOH_CEOL_CONTRACT_V0,
    binding: CEOL_BINDING_SENTENCE_V0,
    no_empty_screen_guarantee: CEOL_NO_EMPTY_SCREEN_GUARANTEE_V0,
    entry_mode: entryMode,
    choreography_state: state,
    elapsed_ms: elapsedMs,
    timeline_ms: timeline,
    in_entry_window: elapsedMs < timeline.FLOW_THREAD_END,
    play_ready: state === CEOL_STATE_PLAY_READY_V0,
    visibility
  });

  return payload;
}

/**
 * @param {number} [startedAt]
 */
export function emitCeolStartV0(startedAt = Date.now()) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(RHIZOH_CEOL_START_EVENT_V0, {
      detail: Object.freeze({ started_at: startedAt })
    })
  );
}

/**
 * @param {ReturnType<typeof resolveCeolChoreographyV0>} choreography
 */
export function emitCeolChoreographyV0(choreography) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(RHIZOH_CEOL_CHOREOGRAPHY_EVENT_V0, { detail: choreography })
  );
}
