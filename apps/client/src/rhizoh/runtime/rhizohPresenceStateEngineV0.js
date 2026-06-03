/**
 * RPSE v1.0 — Rhizoh Presence State Engine (state-based continuity).
 * MVIC/FEL is failure narration only — not presence core.
 * @see docs/RHIZOH_PRESENCE_STATE_ENGINE_V1.0.md
 */

export const RHIZOH_PRESENCE_STATE_ENGINE_SCHEMA_V0 = "castle.rhizoh.presence_state_engine.v0";

export const RHIZOH_ATTENTION_V0 = Object.freeze({
  FOCUSED: "focused",
  PARTIAL: "partial",
  LISTENING: "listening",
  IDLE: "idle"
});

export const RHIZOH_MEMORY_CONTINUITY_V0 = Object.freeze({
  STRONG: "strong",
  WEAK: "weak",
  NONE: "none"
});

export const RHIZOH_SILENCE_FORM_V0 = Object.freeze({
  ACTIVE_IDLE: "active_idle",
  LISTENING_HOLD: "listening_hold",
  FAILURE_NARRATION: "failure_narration",
  ABSENT: "absent"
});

/** @typedef {typeof RHIZOH_ATTENTION_V0[keyof typeof RHIZOH_ATTENTION_V0]} RhizohAttentionV0 */
/** @typedef {typeof RHIZOH_MEMORY_CONTINUITY_V0[keyof typeof RHIZOH_MEMORY_CONTINUITY_V0]} RhizohMemoryContinuityV0 */
/** @typedef {typeof RHIZOH_SILENCE_FORM_V0[keyof typeof RHIZOH_SILENCE_FORM_V0]} RhizohSilenceFormV0 */

export const RPSE_IDLE_USER_GAP_MS_V0 = 30_000;
export const RPSE_FAILURE_NARRATION_DECAY_MS_V0 = 12_000;

let lastPublished = null;
let lastFelAtMs = 0;
let lastFelReason = "";

/**
 * @param {{
 *   nowMs?: number,
 *   shellMounted?: boolean,
 *   quarantine?: boolean,
 *   fieldState?: string,
 *   voiceListening?: boolean,
 *   lastUserActivityMs?: number,
 *   lastRhizohActivityMs?: number,
 *   returningUser?: boolean,
 *   hasAnchor?: boolean,
 *   sessionId?: string
 * }} [ctx]
 */
export function deriveRhizohPresenceStateV0(ctx = {}) {
  const nowMs = Number(ctx.nowMs) || Date.now();
  const shellMounted = ctx.shellMounted !== false;
  const quarantine = ctx.quarantine === true;

  if (!shellMounted || quarantine) {
    return Object.freeze({
      schema: RHIZOH_PRESENCE_STATE_ENGINE_SCHEMA_V0,
      rhizoh_is_present: false,
      rhizoh_attention: RHIZOH_ATTENTION_V0.IDLE,
      rhizoh_memory_continuity: RHIZOH_MEMORY_CONTINUITY_V0.NONE,
      silence_form: RHIZOH_SILENCE_FORM_V0.ABSENT,
      atMs: nowMs
    });
  }

  const field = String(ctx.fieldState || "IDLE").toUpperCase();
  const lastUser = Number(ctx.lastUserActivityMs) || 0;
  const userGap = lastUser > 0 ? nowMs - lastUser : Infinity;

  let attention = RHIZOH_ATTENTION_V0.IDLE;
  if (ctx.voiceListening === true || field === "LISTENING") {
    attention = RHIZOH_ATTENTION_V0.LISTENING;
  } else if (field === "INTERPRETING" || field === "EXECUTING" || field === "SPEAKING") {
    attention = RHIZOH_ATTENTION_V0.FOCUSED;
  } else if (Number.isFinite(userGap) && userGap < RPSE_IDLE_USER_GAP_MS_V0) {
    attention = RHIZOH_ATTENTION_V0.PARTIAL;
  } else {
    attention = RHIZOH_ATTENTION_V0.IDLE;
  }

  let memory = RHIZOH_MEMORY_CONTINUITY_V0.NONE;
  if (ctx.returningUser === true && ctx.hasAnchor === true) {
    memory = RHIZOH_MEMORY_CONTINUITY_V0.STRONG;
  } else if (ctx.returningUser === true || ctx.hasAnchor === true) {
    memory = RHIZOH_MEMORY_CONTINUITY_V0.WEAK;
  }

  let silenceForm = RHIZOH_SILENCE_FORM_V0.ACTIVE_IDLE;
  const felRecent =
    lastFelAtMs > 0 && nowMs - lastFelAtMs < RPSE_FAILURE_NARRATION_DECAY_MS_V0;
  if (felRecent) {
    silenceForm = RHIZOH_SILENCE_FORM_V0.FAILURE_NARRATION;
  } else if (attention === RHIZOH_ATTENTION_V0.LISTENING && field !== "SPEAKING") {
    silenceForm = RHIZOH_SILENCE_FORM_V0.LISTENING_HOLD;
  } else if (attention === RHIZOH_ATTENTION_V0.IDLE) {
    silenceForm = RHIZOH_SILENCE_FORM_V0.ACTIVE_IDLE;
  }

  return Object.freeze({
    schema: RHIZOH_PRESENCE_STATE_ENGINE_SCHEMA_V0,
    rhizoh_is_present: true,
    rhizoh_attention: attention,
    rhizoh_memory_continuity: memory,
    silence_form: silenceForm,
    sessionId: ctx.sessionId ? String(ctx.sessionId) : undefined,
    lastFelReason: felRecent ? lastFelReason : undefined,
    atMs: nowMs
  });
}

/**
 * FEL/MVIC fired — temporary failure narration (does not clear presence).
 * @param {{ reason?: string, eventTag?: string, atMs?: number }} [meta]
 */
export function noteFelFailureExpressionV0(meta = {}) {
  lastFelAtMs = Number(meta.atMs) || Date.now();
  lastFelReason = String(meta.reason || meta.eventTag || "failure").trim();
}

export function resetFelFailureExpressionForTestV0() {
  lastFelAtMs = 0;
  lastFelReason = "";
  lastPublished = null;
}

/**
 * @param {ReturnType<typeof deriveRhizohPresenceStateV0>} state
 */
export function publishRhizohPresenceStateV0(state) {
  lastPublished = state;
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.presenceState = state;
    try {
      window.dispatchEvent(
        new CustomEvent("rhizoh:presence-state-v0", { detail: Object.freeze({ state }) })
      );
    } catch {
      /* noop */
    }
    import("./rhizohReslPresentationPolicyV0.js")
      .then((m) =>
        m.publishReslPresentationV0(state, {
          lastFelChatAtMs: Number(window.__rhizoh._reslLastFelChatAtMs) || 0
        })
      )
      .catch(() => {});
  }
  return state;
}

/**
 * @param {Parameters<typeof deriveRhizohPresenceStateV0>[0]} ctx
 */
export function tickRhizohPresenceStateV0(ctx = {}) {
  const state = deriveRhizohPresenceStateV0(ctx);
  return publishRhizohPresenceStateV0(state);
}

export function readLastRhizohPresenceStateV0() {
  return lastPublished;
}
