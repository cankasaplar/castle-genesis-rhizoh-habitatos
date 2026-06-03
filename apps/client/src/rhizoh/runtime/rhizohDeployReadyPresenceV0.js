/**
 * Deploy-ready presence patch set — first paint, zero frame, voice entry (not new cognitive stack).
 * @see docs/RHIZOH_RELEASE_CONTROL_ROOM_V0.md § Deploy Ready Patch Set
 */

import { bootstrapRhizohContinuityFirstPaintV0 } from "./rhizohT0FirstFrameBootstrapV0.js";
import { readLastRhizohPresenceStateV0 } from "./rhizohPresenceStateEngineV0.js";
import { evaluateVoiceReadyCoherenceV0 } from "./rhizohVoiceReadyCoherenceV0.js";

export const DEPLOY_READY_PRESENCE_SCHEMA_V0 = "castle.rhizoh.deploy_ready_presence.v0";

export const ZERO_FRAME_FALLBACK_V0 = Object.freeze({
  tr: Object.freeze({
    continuityLine: "Rhizoh burada · hazır",
    badgeLabel: "Burada",
    badgeTone: "teal-soft"
  }),
  en: Object.freeze({
    continuityLine: "Rhizoh is here · ready",
    badgeLabel: "Here",
    badgeTone: "teal-soft"
  })
});

/**
 * T0 zero-frame policy — never blank strip on first paint.
 * @param {{ continuityLine?: string | null, presenceBadge?: { label?: string, tone?: string } | null, localeTr?: boolean }} input
 */
export function resolveT0ZeroFramePresenceV0(input = {}) {
  const loc = input.localeTr !== false ? "tr" : "en";
  const fb = ZERO_FRAME_FALLBACK_V0[loc] || ZERO_FRAME_FALLBACK_V0.en;
  const line = input.continuityLine || null;
  const badge = input.presenceBadge;

  if (line || badge?.label) {
    return Object.freeze({
      continuityLine: line,
      presenceBadge: badge || null,
      zero_frame_applied: false
    });
  }

  return Object.freeze({
    continuityLine: fb.continuityLine,
    presenceBadge: Object.freeze({ label: fb.badgeLabel, tone: fb.badgeTone }),
    zero_frame_applied: true
  });
}

/**
 * Voice entry gate — listen only when presence continuity is stable (silent presence before speech).
 * @param {{
 *   voiceReady?: boolean,
 *   voiceAdapterReady?: boolean,
 *   fieldState?: string,
 *   presence?: ReturnType<import("./rhizohPresenceStateEngineV0.js").deriveRhizohPresenceStateV0>,
 *   firstPaintOk?: boolean,
 *   uiShowsListening?: boolean
 * }} ctx
 */
export function evaluateVoiceEntryGateV0(ctx = {}) {
  const presence = ctx.presence || readLastRhizohPresenceStateV0();
  const firstPaintOk =
    ctx.firstPaintOk !== false &&
    (ctx.firstPaintOk === true ||
      (typeof window !== "undefined" && window.__rhizoh?.continuityFirstPaint?.ok !== false));

  const coherence = evaluateVoiceReadyCoherenceV0({
    presence,
    fieldState: ctx.fieldState || "IDLE",
    voiceReady: ctx.voiceReady === true,
    voiceAdapterReady: ctx.voiceAdapterReady === true,
    uiShowsListening: false
  });

  let allow_listen = false;
  let reason = "unknown";
  let silent_presence = true;

  if (!ctx.voiceReady) {
    reason = "voice_not_ready";
  } else if (!ctx.voiceAdapterReady && ctx.voiceAdapterReady !== undefined) {
    reason = "adapter_not_ready";
  } else if (!presence?.rhizoh_is_present) {
    reason = "presence_absent";
  } else if (firstPaintOk === false) {
    reason = "first_paint_pending";
  } else if (presence.silence_form === "absent") {
    reason = "shell_not_present";
  } else {
    allow_listen = true;
    reason = "ok";
    silent_presence = false;
  }

  return Object.freeze({
    schema: DEPLOY_READY_PRESENCE_SCHEMA_V0,
    atMs: Date.now(),
    allow_listen,
    reason,
    silent_presence,
    voice_ready_coherence: coherence,
    first_paint_ok: firstPaintOk !== false
  });
}

/**
 * Prewarm RPSE + RESL + ECC before first voice listen.
 * @param {Parameters<typeof bootstrapRhizohContinuityFirstPaintV0>[0]} [ctx]
 */
export async function prewarmVoicePresenceContinuityV0(ctx = {}) {
  return bootstrapRhizohContinuityFirstPaintV0(ctx);
}

/**
 * FEL → active_idle: RESL transition carries re-entry pulse hint (300–600ms).
 * @param {ReturnType<import("./rhizohReslTransitionSemanticsV0.js").resolveTransitionFeelV0>} feel
 * @param {string} silenceForm
 */
export function enrichFelCcfTransitionFeelV0(feel, silenceForm) {
  if (!feel || silenceForm !== "active_idle") return feel;
  if (!feel.reEngagePulse && !(Number(feel.felDampen01) > 0.4)) return feel;
  const pulseMs = Math.round(
    Math.max(320, Math.min(560, (Number(feel.durationMs) || 480) * 0.85))
  );
  return Object.freeze({
    ...feel,
    presenceReentryHint: true,
    presencePulseMs: pulseMs,
    felReentryCurve: "ease-in-out-soft"
  });
}
