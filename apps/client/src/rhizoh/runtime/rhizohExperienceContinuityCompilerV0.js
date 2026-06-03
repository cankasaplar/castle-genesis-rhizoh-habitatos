/**
 * ECC v1 — Experience Continuity Compiler.
 * Fuses RPSE + RESL + RCAL/TRF/MCIB into one eventless narrative stream (not graph UI).
 * TRF = reason · RESL = feel · ECC = single-story perception.
 * @see docs/RHIZOH_ECC_V1.md
 */

export const ECC_SCHEMA_V0 = "castle.rhizoh.experience_continuity_compiler.v0";

export const RHIZOH_EXPERIENCE_CONTINUITY_EVENT_V0 = "rhizoh:experience-continuity-v0";

export const ECC_MICRO_TRANSITION_V0 = Object.freeze({
  HOLD: "hold",
  DRIFT: "drift",
  SHIFT: "shift",
  SETTLE: "settle",
  BREATHE: "breathe"
});

export const ECC_FADE_CURVE_V0 = Object.freeze({
  EASE_OUT: "ease-out",
  EASE_IN_OUT: "ease-in-out",
  LINEAR: "linear"
});

const UNDERTONE_MAX_LEN_V0 = 28;

/** @type {ReturnType<typeof compileExperienceContinuityV0> | null} */
let lastCompiled = null;

function clamp01(v) {
  return Math.max(0, Math.min(1, Number(v) || 0));
}

/**
 * @param {string} loc
 */
function localeKeyV0(loc) {
  const raw = String(loc || "").toLowerCase();
  return raw.startsWith("tr") ? "tr" : "en";
}

/**
 * Eventless whisper — background reason feel, never graph labels.
 * @param {ReturnType<import("./rhizohTopologyReactivationFieldV0.js").deriveTopologyReactivationV0> | null} trf
 * @param {ReturnType<import("./rhizohCognitiveCollapseFunctionV0.js").collapseCognitiveExperienceV0> | null} ccf
 * @param {ReturnType<import("./rhizohMultiCausalIntentBlendingV0.js").blendMultiCausalIntentV0> | null} mcib
 * @param {string} loc
 */
function resolveUndertoneV0(trf, ccf, mcib, loc) {
  const tr = loc === "tr";
  const tension = clamp01(
    ccf?.tension_fade?.resolved_tension01 ?? mcib?.internal_tension01
  );
  const deform = clamp01(trf?.deformation_trigger?.magnitude01);

  if (ccf?.collapse_mode === "tension_hold" && tension > 0.12) {
    const hint = tr ? ccf.narrative_now_tr : ccf.narrative_now_en;
    if (hint && hint.length <= UNDERTONE_MAX_LEN_V0) return hint;
  }

  if (tension > 0.42 && mcib?.forks?.length && !ccf) {
    const fork = mcib.forks[0];
    const hint = tr ? fork?.label_tr : fork?.label_en;
    if (hint) return String(hint).slice(0, UNDERTONE_MAX_LEN_V0);
  }

  if (deform > 0.28 && trf?.why_reshaped?.code) {
    const code = String(trf.why_reshaped.code);
    const mapTr = Object.freeze({
      propagation_shift: "bakış kaydı",
      voice_reenergize: "ses uyandı",
      attention_redistribution: "dikkat dağıldı",
      drift_surge: "hafif kayma",
      fel_repattern: "yeniden oturdu"
    });
    const mapEn = Object.freeze({
      propagation_shift: "gaze shifted",
      voice_reenergize: "voice woke",
      attention_redistribution: "attention spread",
      drift_surge: "soft drift",
      fel_repattern: "settled again"
    });
    const m = tr ? mapTr : mapEn;
    return m[code] || null;
  }

  const whyChanged = mcib?.linear_primary?.code || null;
  if (whyChanged === "drift_shift") return tr ? "yavaş kayma" : "slow drift";
  return null;
}

/**
 * @param {ReturnType<import("./rhizohReslPresentationPolicyV0.js").resolveReslPresentationV0>} resl
 * @param {ReturnType<import("./rhizohTopologyReactivationFieldV0.js").deriveTopologyReactivationV0> | null} trf
 * @param {ReturnType<import("./rhizohCognitiveAttentionLayerV0.js").deriveCognitiveAttentionV0> | null} cognitive
 */
function deriveMicroTransitionV0(resl, trf, cognitive) {
  const inertia = cognitive?.attention_inertia;
  const ccf = inertia?.ccf;
  const mcib = inertia?.mcib;
  const propagation = inertia?.propagation;
  const deformation = clamp01(trf?.deformation_trigger?.magnitude01);
  const tension = clamp01(
    ccf?.tension_fade?.resolved_tension01 ?? mcib?.internal_tension01
  );
  const persist = clamp01(propagation?.direction_persist01 ?? 1);
  const whyChanged = Boolean(propagation?.why_changed?.code);

  let kind = ECC_MICRO_TRANSITION_V0.HOLD;
  if (deformation > 0.32 || whyChanged) kind = ECC_MICRO_TRANSITION_V0.SHIFT;
  else if (tension > 0.38) kind = ECC_MICRO_TRANSITION_V0.DRIFT;
  else if (persist > 0.82 && resl?.orbModulation?.breathe) kind = ECC_MICRO_TRANSITION_V0.BREATHE;
  else if (persist < 0.55) kind = ECC_MICRO_TRANSITION_V0.SETTLE;
  else kind = ECC_MICRO_TRANSITION_V0.HOLD;

  const collapseCoherence = clamp01(ccf?.collapse_coherence01 ?? 1);
  const undertoneWeight01 = clamp01(
    (deformation * 0.45 + tension * 0.35 + (whyChanged ? 0.12 : 0)) *
      (1 - collapseCoherence * 0.65)
  );

  return Object.freeze({
    kind,
    undertone_weight01: Number(undertoneWeight01.toFixed(4)),
    undertone_tr: resolveUndertoneV0(trf, ccf, mcib, "tr"),
    undertone_en: resolveUndertoneV0(trf, ccf, mcib, "en"),
    eventless: true
  });
}

/**
 * @param {ReturnType<import("./rhizohReslPresentationPolicyV0.js").resolveReslPresentationV0>} resl
 * @param {ReturnType<import("./rhizohCognitiveAttentionLayerV0.js").deriveCognitiveAttentionV0> | null} cognitive
 * @param {ReturnType<typeof deriveMicroTransitionV0>} micro
 */
function deriveNarrativeVelocityV0(resl, cognitive, micro) {
  const vectorMag = clamp01(cognitive?.attention_vector?.magnitude01 ?? 0.35);
  const ccf = cognitive?.attention_inertia?.ccf;
  const superposition = clamp01(
    ccf ? 1 - ccf.collapse_coherence01 : cognitive?.attention_inertia?.mcib?.superposition01
  );
  const persist = clamp01(cognitive?.attention_inertia?.propagation?.direction_persist01 ?? 1);
  const listening =
    resl?.silenceForm === "listening_hold" || resl?.attention === "listening";

  let v = 0.28 + vectorMag * 0.32 + superposition * 0.22 + (1 - persist) * 0.12;
  if (micro.kind === ECC_MICRO_TRANSITION_V0.SHIFT) v += 0.14;
  if (micro.kind === ECC_MICRO_TRANSITION_V0.BREATHE) v -= 0.1;
  if (listening) v += 0.08;
  return Number(clamp01(v).toFixed(4));
}

/**
 * @param {ReturnType<import("./rhizohReslPresentationPolicyV0.js").resolveReslPresentationV0>} resl
 * @param {number} narrativeVelocity01
 */
function deriveFadeSemanticsV0(resl, narrativeVelocity01, cognitive = null) {
  const feel = resl?.transitionFeel || {};
  const baseDuration = Math.max(120, Number(feel.durationMs) || 400);
  const baseDelay = Math.max(0, Number(feel.delayMs) || 0);
  const stretch = 1.12 - narrativeVelocity01 * 0.38;
  const tensionStretch =
    cognitive?.attention_inertia?.ccf?.tension_fade?.duration_stretch_ms || 0;
  const curveWiden =
    cognitive?.attention_inertia?.ccf?.tension_fade?.curve_widen01 || 1;

  return Object.freeze({
    eventless: true,
    curve: feel.curve || ECC_FADE_CURVE_V0.EASE_OUT,
    durationMs: Math.round(baseDuration * stretch * curveWiden + tensionStretch * 0.35),
    delayMs: baseDelay,
    opacityFloor01: Number(
      (
        0.08 +
        (1 - narrativeVelocity01) * 0.06 +
        (cognitive?.attention_inertia?.ccf?.tension_fade?.opacity_softening01 || 0)
      ).toFixed(4)
    ),
    attentionDecay01: Number(feel.attentionDecay01 ?? 0.08),
    felDampen01: Number(feel.felDampen01 ?? 0),
    reEngagePulse: feel.reEngagePulse === true
  });
}

/**
 * @param {{
 *   presence?: ReturnType<import("./rhizohPresenceStateEngineV0.js").deriveRhizohPresenceStateV0>,
 *   resl?: ReturnType<import("./rhizohReslPresentationPolicyV0.js").resolveReslPresentationV0>,
 *   cognitive?: ReturnType<import("./rhizohCognitiveAttentionLayerV0.js").deriveCognitiveAttentionV0> | null,
 *   trf?: ReturnType<import("./rhizohTopologyReactivationFieldV0.js").deriveTopologyReactivationV0> | null,
 *   locale?: string,
 *   nowMs?: number
 * }} ctx
 */
export function compileExperienceContinuityV0(ctx = {}) {
  const nowMs = Number(ctx.nowMs) || Date.now();
  const loc = localeKeyV0(ctx.locale);
  const resl = ctx.resl;
  const presence = ctx.presence;
  const cognitive = ctx.cognitive || null;
  const trf = ctx.trf || null;

  const present = presence?.rhizoh_is_present === true;
  const baseLine = resl?.continuityLine || null;

  if (!present || !baseLine) {
    return Object.freeze({
      schema: ECC_SCHEMA_V0,
      atMs: nowMs,
      stream_coherence_id: `${nowMs}:absent`,
      continuity_line: null,
      micro_transition: Object.freeze({
        kind: ECC_MICRO_TRANSITION_V0.HOLD,
        undertone_weight01: 0,
        undertone_tr: null,
        undertone_en: null,
        eventless: true
      }),
      narrative_velocity: 0,
      fade_semantics: Object.freeze({
        eventless: true,
        curve: ECC_FADE_CURVE_V0.EASE_OUT,
        durationMs: 280,
        delayMs: 0,
        opacityFloor01: 0,
        attentionDecay01: 0.2,
        felDampen01: 0,
        reEngagePulse: false
      }),
      sources: Object.freeze({ rpse: false, resl: false, trf: false, cognitive: false, ccf: false })
    });
  }

  const micro = deriveMicroTransitionV0(resl, trf, cognitive);
  const narrative_velocity = deriveNarrativeVelocityV0(resl, cognitive, micro);
  const fade_semantics = deriveFadeSemanticsV0(resl, narrative_velocity, cognitive);

  const tick = Number(presence?.tickSeq) || 0;
  const cogTick = Number(cognitive?.tickSeq) || 0;
  const trfCode = trf?.why_reshaped?.code || "none";

  return Object.freeze({
    schema: ECC_SCHEMA_V0,
    atMs: nowMs,
    stream_coherence_id: `${tick}:${cogTick}:${trfCode}:${micro.kind}`,
    continuity_line: baseLine,
    micro_transition: micro,
    narrative_velocity,
    fade_semantics,
    sources: Object.freeze({
      rpse: true,
      resl: Boolean(resl),
      trf: Boolean(trf),
      cognitive: Boolean(cognitive),
      ccf: Boolean(cognitive?.attention_inertia?.ccf)
    })
  });
}

import { runStudioExecutionLoopV0 } from "./rhizohStudioExecutionLoopV0.js";

/**
 * @param {ReturnType<typeof compileExperienceContinuityV0>} ecc
 */
export function publishExperienceContinuityV0(ecc) {
  lastCompiled = ecc;
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.experienceContinuity = ecc;
    runStudioExecutionLoopV0({
      ecc,
      frame: window.__rhizoh.presenceFrame,
      resl: window.__rhizoh.reslPresentation,
      cognitive: window.__rhizoh.cognitiveAttention
    });
    try {
      window.dispatchEvent(
        new CustomEvent(RHIZOH_EXPERIENCE_CONTINUITY_EVENT_V0, {
          detail: Object.freeze({ continuity: ecc })
        })
      );
    } catch {
      /* noop */
    }
  }
  return ecc;
}

/**
 * ECC → T0 narrative stream (temporal fusion authority).
 * @param {Parameters<typeof compileExperienceContinuityV0>[0]} ctx
 */
export function syncExperienceContinuityV0(ctx = {}) {
  const eccRaw = compileExperienceContinuityV0(ctx);
  const ccf = ctx.cognitive?.attention_inertia?.ccf || null;
  return import("./rhizohTemporalDriftGuardV0.js")
    .then((m) => {
      const ecc = m.applyTemporalDriftGuardV0(eccRaw, ccf, ctx.nowMs);
      publishExperienceContinuityV0(ecc);
      return finishSyncExperienceContinuityV0(ctx, ecc);
    })
    .catch(() => {
      publishExperienceContinuityV0(eccRaw);
      return finishSyncExperienceContinuityV0(ctx, eccRaw);
    });
}

function finishSyncExperienceContinuityV0(ctx, ecc) {
  if (!ctx.presence || !ctx.resl) return Promise.resolve(ecc);

  return import("./rhizohT0UnifiedPresenceFrameV0.js")
    .then((m) => {
      m.syncT0UnifiedPresenceFrameV0(ctx.presence, ctx.resl, ecc, ctx.nowMs);
      return ecc;
    })
    .catch(() => ecc);
}

export function readLastExperienceContinuityV0() {
  return lastCompiled;
}

export function resetExperienceContinuityForTestV0() {
  lastCompiled = null;
  import("./rhizohTemporalDriftGuardV0.js").then((m) => m.resetTemporalDriftGuardForTestV0());
}
