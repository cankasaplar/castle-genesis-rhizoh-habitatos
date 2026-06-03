/**
 * RCAL v1 — Cognitive Attention Layer (WHERE / WHAT, not UI).
 * Temporal presence sonrası: attention vector + selective focus + intent drift control.
 * @see docs/RHIZOH_COGNITIVE_ATTENTION_LAYER_V1.md
 */

import { computeAttentionVectorField } from "../social/fieldTheory/attentionVectorField.js";
import {
  T0_INTENT_CONNECT_V0,
  T0_INTENT_EXPLORE_V0,
  T0_INTENT_OBSERVE_V0,
  T0_INTENT_PRODUCE_V0,
  inferT0UserIntentFromSurfaceV0
} from "./t0ContextStripV0.js";
import {
  RHIZOH_ATTENTION_V0,
  RHIZOH_SILENCE_FORM_V0
} from "./rhizohPresenceStateEngineV0.js";
import { applyAttentionInertiaV0, resetAttentionInertiaForTestV0 } from "./rhizohAttentionInertiaFieldV0.js";
import {
  readLastTopologyReactivationV0,
  resetTopologyReactivationForTestV0
} from "./rhizohTopologyReactivationFieldV0.js";
import {
  projectRcalCrystalTopologyV0,
  publishRcalCrystalTopologyV0
} from "./rhizohRcalCrystalTopologyV0.js";
import { syncTopologyReactivationV0 } from "./rhizohTopologyReactivationFieldV0.js";
import { enrichInertiaWithMcibV0 } from "./rhizohMultiCausalIntentBlendingV0.js";
import { enrichInertiaWithCcfV0 } from "./rhizohCognitiveCollapseFunctionV0.js";
import { syncExperienceContinuityV0 } from "./rhizohExperienceContinuityCompilerV0.js";
import { readLastReslPresentationV0 } from "./rhizohReslPresentationPolicyV0.js";

export const RCAL_SCHEMA_V0 = "castle.rhizoh.cognitive_attention_layer.v0";

export const RCAL_ATTENTION_TARGET_V0 = Object.freeze({
  USER: "user",
  DIALOGUE: "dialogue",
  WORLD_MESH: "world_mesh",
  CONTINUITY: "continuity",
  VOICE_CHANNEL: "voice_channel",
  AMBIENT: "ambient"
});

export const RCAL_DRIFT_GOVERNOR_V0 = Object.freeze({
  HOLD: "hold",
  ALLOW_SHIFT: "allow_shift",
  DAMPEN: "dampen"
});

export const RHIZOH_COGNITIVE_ATTENTION_EVENT_V0 = "rhizoh:cognitive-attention-v0";

/** @type {ReturnType<typeof deriveCognitiveAttentionV0> | null} */
let lastPublished = null;
let lastFocusKey = "";
let lastFocusAtMs = 0;

function clamp01(v) {
  return Math.max(0, Math.min(1, Number(v) || 0));
}

/**
 * @param {string} intentId
 * @param {string} surfaceId
 * @param {string} routerIntent
 * @param {ReturnType<import("./rhizohPresenceStateEngineV0.js").deriveRhizohPresenceStateV0> | null} presence
 * @param {boolean} userPickedIntent
 */
function resolveSelectiveFocusV0(intentId, surfaceId, routerIntent, presence, userPickedIntent) {
  const attention = String(presence?.rhizoh_attention || RHIZOH_ATTENTION_V0.IDLE);
  const silence = String(presence?.silence_form || RHIZOH_SILENCE_FORM_V0.ABSENT);
  const router = String(routerIntent || "CHAT").toUpperCase();

  let primary = RCAL_ATTENTION_TARGET_V0.AMBIENT;
  let secondary = null;

  if (attention === RHIZOH_ATTENTION_V0.LISTENING || silence === RHIZOH_SILENCE_FORM_V0.LISTENING_HOLD) {
    primary = RCAL_ATTENTION_TARGET_V0.VOICE_CHANNEL;
    secondary = RCAL_ATTENTION_TARGET_V0.USER;
  } else if (attention === RHIZOH_ATTENTION_V0.FOCUSED || router !== "CHAT") {
    primary = RCAL_ATTENTION_TARGET_V0.DIALOGUE;
  } else if (silence === RHIZOH_SILENCE_FORM_V0.ACTIVE_IDLE && !userPickedIntent) {
    primary = RCAL_ATTENTION_TARGET_V0.CONTINUITY;
  } else if (intentId === T0_INTENT_EXPLORE_V0 || (surfaceId === "world" && !userPickedIntent)) {
    primary = RCAL_ATTENTION_TARGET_V0.WORLD_MESH;
  } else if (intentId === T0_INTENT_PRODUCE_V0 || surfaceId === "studio") {
    primary = RCAL_ATTENTION_TARGET_V0.DIALOGUE;
    secondary = RCAL_ATTENTION_TARGET_V0.WORLD_MESH;
  } else if (intentId === T0_INTENT_CONNECT_V0) {
    primary = RCAL_ATTENTION_TARGET_V0.USER;
    secondary = RCAL_ATTENTION_TARGET_V0.DIALOGUE;
  } else if (intentId === T0_INTENT_OBSERVE_V0) {
    primary = RCAL_ATTENTION_TARGET_V0.WORLD_MESH;
  } else if (attention === RHIZOH_ATTENTION_V0.PARTIAL) {
    primary = RCAL_ATTENTION_TARGET_V0.USER;
  }

  return Object.freeze({
    primary,
    secondary,
    surfaceId: String(surfaceId || "world"),
    intentId: intentId || null
  });
}

/**
 * @param {string} primary
 * @param {string | null} secondary
 * @param {number} drift01
 */
function focusToAttentionDirectionV0(primary, secondary, drift01) {
  if (primary === RCAL_ATTENTION_TARGET_V0.DIALOGUE || primary === RCAL_ATTENTION_TARGET_V0.VOICE_CHANNEL) {
    return "dialogue_focus";
  }
  if (primary === RCAL_ATTENTION_TARGET_V0.WORLD_MESH || secondary === RCAL_ATTENTION_TARGET_V0.WORLD_MESH) {
    return drift01 > 0.4 ? "room_scan" : "dialogue_focus";
  }
  return "self_anchor";
}

/**
 * @param {string} prevKey
 * @param {string} nextKey
 * @param {number} nowMs
 * @param {number} elapsedSinceFocusMs
 */
function resolveIntentDriftControlV0(prevKey, nextKey, nowMs, elapsedSinceFocusMs) {
  const shifted = prevKey && nextKey && prevKey !== nextKey;
  const recency = elapsedSinceFocusMs > 0 ? Math.min(1, 8000 / elapsedSinceFocusMs) : 0;
  let drift01 = shifted ? clamp01(0.35 + recency * 0.4) : clamp01(0.08 + recency * 0.12);

  let governor = RCAL_DRIFT_GOVERNOR_V0.HOLD;
  if (drift01 > 0.55) governor = RCAL_DRIFT_GOVERNOR_V0.DAMPEN;
  else if (shifted && elapsedSinceFocusMs > 12_000) governor = RCAL_DRIFT_GOVERNOR_V0.ALLOW_SHIFT;

  return Object.freeze({
    drift01: Number(drift01.toFixed(4)),
    damped: drift01 > 0.55,
    stickiness01: Number((1 - drift01 * 0.85).toFixed(4)),
    governor,
    shifted,
    atMs: nowMs
  });
}

/**
 * @param {{
 *   presence?: ReturnType<import("./rhizohPresenceStateEngineV0.js").deriveRhizohPresenceStateV0> | null,
 *   t0Intent?: string | null,
 *   activeSurface?: string,
 *   routerIntent?: string,
 *   lastUserActivityMs?: number,
 *   nowMs?: number
 * }} [ctx]
 */
export function deriveCognitiveAttentionV0(ctx = {}) {
  const nowMs = Number(ctx.nowMs) || Number(ctx.presence?.atMs) || Date.now();
  const presence = ctx.presence || null;
  const surfaceId = String(ctx.activeSurface || "world");
  const userPickedIntent = Boolean(ctx.t0Intent);
  const intentId = inferT0UserIntentFromSurfaceV0(surfaceId, ctx.t0Intent);
  const routerIntent = String(ctx.routerIntent || "CHAT");

  const selective_focus = resolveSelectiveFocusV0(
    intentId,
    surfaceId,
    routerIntent,
    presence,
    userPickedIntent
  );

  const focusKey = `${selective_focus.primary}|${selective_focus.intentId}|${surfaceId}`;
  const prevFocusKey = lastFocusKey;
  const elapsedSinceFocusMs = lastFocusAtMs > 0 ? nowMs - lastFocusAtMs : 0;
  if (focusKey !== lastFocusKey) {
    lastFocusKey = focusKey;
    lastFocusAtMs = nowMs;
  }

  const intent_drift_control = resolveIntentDriftControlV0(
    prevFocusKey,
    focusKey,
    nowMs,
    Math.max(1, elapsedSinceFocusMs)
  );

  const directionLabel = focusToAttentionDirectionV0(
    selective_focus.primary,
    selective_focus.secondary,
    intent_drift_control.drift01
  );

  const attention_vector = computeAttentionVectorField({
    attentionDirection: directionLabel,
    interactionMomentum: presence?.rhizoh_attention === RHIZOH_ATTENTION_V0.FOCUSED ? 0.85 : 0.35,
    coPresenceMomentum: presence?.rhizoh_is_present ? 0.5 : 0,
    driftScore: intent_drift_control.drift01
  });

  const confidence01 = clamp01(
    (presence?.rhizoh_is_present ? 0.45 : 0) +
      (intentId ? 0.2 : 0) +
      (presence?.rhizoh_attention === RHIZOH_ATTENTION_V0.LISTENING ? 0.25 : 0.12) +
      (1 - intent_drift_control.drift01) * 0.15
  );

  return Object.freeze({
    schema: RCAL_SCHEMA_V0,
    attention_vector,
    selective_focus,
    intent_drift_control,
    confidence01: Number(confidence01.toFixed(4)),
    directionLabel,
    atMs: nowMs,
    rpseAttention: presence?.rhizoh_attention || null,
    signals: Object.freeze({
      intentId,
      surfaceId,
      routerIntent,
      userPickedIntent,
      silenceForm: String(presence?.silence_form || ""),
      rpseAttention: String(presence?.rhizoh_attention || "")
    })
  });
}

/**
 * @param {ReturnType<typeof deriveCognitiveAttentionV0>} attention
 * @param {ReturnType<typeof applyAttentionInertiaV0>} [inertia]
 */
export function publishCognitiveAttentionV0(attention, inertia = null) {
  const inertiaBase = inertia || applyAttentionInertiaV0(attention, attention.atMs);
  const topologyBase = projectRcalCrystalTopologyV0(
    Object.freeze({ ...attention, attention_inertia: inertiaBase })
  );
  const topology = syncTopologyReactivationV0(topologyBase, attention);
  const inertiaMcib = enrichInertiaWithMcibV0(
    inertiaBase,
    attention,
    topology?.reactivation || null
  );
  const inertiaField = enrichInertiaWithCcfV0(
    inertiaMcib,
    attention,
    topology?.reactivation || null
  );
  const payload = Object.freeze({
    ...attention,
    attention_inertia: inertiaField
  });
  publishRcalCrystalTopologyV0(topology);
  lastPublished = payload;
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.cognitiveAttention = payload;
    try {
      window.dispatchEvent(
        new CustomEvent(RHIZOH_COGNITIVE_ATTENTION_EVENT_V0, {
          detail: Object.freeze({ attention: payload })
        })
      );
    } catch {
      /* noop */
    }
  }
  return payload;
}

/**
 * RPSE tick sonrası bilişsel katman senkronu.
 * @param {Parameters<typeof deriveCognitiveAttentionV0>[0]} ctx
 */
export function syncCognitiveAttentionAfterPresenceV0(ctx = {}) {
  const attention = deriveCognitiveAttentionV0(ctx);
  const inertia = applyAttentionInertiaV0(attention, attention.atMs);
  const payload = publishCognitiveAttentionV0(attention, inertia);
  syncExperienceContinuityV0({
    presence: ctx.presence,
    resl: readLastReslPresentationV0(),
    cognitive: payload,
    trf: readLastTopologyReactivationV0(),
    nowMs: attention.atMs
  });
  return payload;
}

export function readLastCognitiveAttentionV0() {
  return lastPublished;
}

export function resetCognitiveAttentionForTestV0() {
  lastPublished = null;
  lastFocusKey = "";
  lastFocusAtMs = 0;
  resetAttentionInertiaForTestV0();
  resetTopologyReactivationForTestV0();
  import("./rhizohExperienceContinuityCompilerV0.js").then((m) =>
    m.resetExperienceContinuityForTestV0()
  );
  import("./rhizohTemporalDriftGuardV0.js").then((m) => m.resetTemporalDriftGuardForTestV0());
  import("./rhizohCognitiveCollapseFunctionV0.js").then((m) =>
    m.resetCognitiveCollapseForTestV0()
  );
}
