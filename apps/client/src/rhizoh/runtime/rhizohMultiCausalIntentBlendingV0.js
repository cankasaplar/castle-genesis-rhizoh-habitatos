/**
 * MCIB v1 — Multi-Causal Intent Blending.
 * Weighted causal superposition; competing traces — not single linear why.
 * @see docs/RHIZOH_MCIB_V1.md
 */

import { PROPAGATION_CAUSE_V0 } from "./rhizohAttentionIntentPropagationV0.js";
import {
  T0_INTENT_CONNECT_V0,
  T0_INTENT_EXPLORE_V0,
  T0_INTENT_OBSERVE_V0,
  T0_INTENT_PRODUCE_V0
} from "./t0ContextStripV0.js";

export const MCIB_SCHEMA_V0 = "castle.rhizoh.multi_causal_intent_blending.v0";

export const MCIB_CAUSE_SOURCE_V0 = Object.freeze({
  PROPAGATION: "propagation",
  SIGNAL: "signal",
  DRIFT: "drift",
  TRF: "trf",
  FORK: "fork"
});

const TARGET_V0 = Object.freeze({
  VOICE: "voice_channel",
  DIALOGUE: "dialogue",
  WORLD: "world_mesh",
  CONTINUITY: "continuity",
  USER: "user"
});

const CAUSE_LABEL_V0 = Object.freeze({
  tr: Object.freeze({
    [PROPAGATION_CAUSE_V0.VOICE_OPEN]: "Ses",
    [PROPAGATION_CAUSE_V0.USER_INTENT_EXPLORE]: "Keşif",
    [PROPAGATION_CAUSE_V0.USER_INTENT_PRODUCE]: "Üretim",
    [PROPAGATION_CAUSE_V0.USER_INTENT_OBSERVE]: "İzleme",
    [PROPAGATION_CAUSE_V0.USER_INTENT_CONNECT]: "Bağlantı",
    [PROPAGATION_CAUSE_V0.DIALOGUE_FOCUS]: "Diyalog",
    [PROPAGATION_CAUSE_V0.CONTINUITY_HOLD]: "Süreklilik",
    [PROPAGATION_CAUSE_V0.SURFACE_SHIFT]: "Yüzey",
    [PROPAGATION_CAUSE_V0.FIELD_EXECUTING]: "Yürütme",
    [PROPAGATION_CAUSE_V0.DRIFT_SHIFT]: "Drift",
    [PROPAGATION_CAUSE_V0.FEL_RETURN]: "FEL dönüşü",
    [PROPAGATION_CAUSE_V0.INITIAL]: "Başlangıç",
    competing_voice_explore: "Ses + keşif",
    competing_dialogue_continuity: "Diyalog + süreklilik",
    latent_drift: "Arka plan drift"
  }),
  en: Object.freeze({
    [PROPAGATION_CAUSE_V0.VOICE_OPEN]: "Voice",
    [PROPAGATION_CAUSE_V0.USER_INTENT_EXPLORE]: "Explore",
    [PROPAGATION_CAUSE_V0.USER_INTENT_PRODUCE]: "Produce",
    [PROPAGATION_CAUSE_V0.USER_INTENT_OBSERVE]: "Observe",
    [PROPAGATION_CAUSE_V0.USER_INTENT_CONNECT]: "Connect",
    [PROPAGATION_CAUSE_V0.DIALOGUE_FOCUS]: "Dialogue",
    [PROPAGATION_CAUSE_V0.CONTINUITY_HOLD]: "Continuity",
    [PROPAGATION_CAUSE_V0.SURFACE_SHIFT]: "Surface",
    [PROPAGATION_CAUSE_V0.FIELD_EXECUTING]: "Execute",
    [PROPAGATION_CAUSE_V0.DRIFT_SHIFT]: "Drift",
    [PROPAGATION_CAUSE_V0.FEL_RETURN]: "Post-FEL",
    [PROPAGATION_CAUSE_V0.INITIAL]: "Initial",
    competing_voice_explore: "Voice + explore",
    competing_dialogue_continuity: "Dialogue + continuity",
    latent_drift: "Background drift"
  })
});

function clamp01(v) {
  return Math.max(0, Math.min(1, Number(v) || 0));
}

/**
 * @param {Array<{ code: string, score: number, source: string }>} raw
 */
function normalizeCausesV0(raw) {
  const sum = raw.reduce((a, c) => a + c.score, 0) || 1;
  return raw
    .filter((c) => c.score > 0.02)
    .map((c) =>
      Object.freeze({
        code: c.code,
        source: c.source,
        weight01: Number((c.score / sum).toFixed(4)),
        label_tr: CAUSE_LABEL_V0.tr[c.code] || c.code,
        label_en: CAUSE_LABEL_V0.en[c.code] || c.code
      })
    )
    .sort((a, b) => b.weight01 - a.weight01);
}

/**
 * @param {ReturnType<import("./rhizohCognitiveAttentionLayerV0.js").deriveCognitiveAttentionV0>} instant
 * @param {ReturnType<import("./rhizohAttentionIntentPropagationV0.js").advanceIntentPropagationV0>} propagation
 * @param {ReturnType<import("./rhizohTopologyReactivationFieldV0.js").deriveTopologyReactivationV0> | null} [trf]
 */
function collectCauseCandidatesV0(instant, propagation, trf) {
  /** @type {Array<{ code: string, score: number, source: string }>} */
  const raw = [];
  const signals = instant?.signals || {};
  const focus = instant?.selective_focus || {};
  const drift01 = Number(instant?.intent_drift_control?.drift01) || 0;

  const persisted = propagation?.persisted_cause || PROPAGATION_CAUSE_V0.INITIAL;
  raw.push({ code: persisted, score: 0.42 + (propagation?.direction_persist01 || 0) * 0.25, source: MCIB_CAUSE_SOURCE_V0.PROPAGATION });

  if (propagation?.why_changed?.code) {
    raw.push({
      code: propagation.why_changed.code,
      score: 0.28,
      source: MCIB_CAUSE_SOURCE_V0.FORK
    });
  }

  const intentId = String(signals.intentId || focus.intentId || "");
  if (intentId === T0_INTENT_EXPLORE_V0) {
    raw.push({ code: PROPAGATION_CAUSE_V0.USER_INTENT_EXPLORE, score: signals.userPickedIntent ? 0.32 : 0.18, source: MCIB_CAUSE_SOURCE_V0.SIGNAL });
  }
  if (intentId === T0_INTENT_PRODUCE_V0) {
    raw.push({ code: PROPAGATION_CAUSE_V0.USER_INTENT_PRODUCE, score: 0.28, source: MCIB_CAUSE_SOURCE_V0.SIGNAL });
  }
  if (intentId === T0_INTENT_OBSERVE_V0) {
    raw.push({ code: PROPAGATION_CAUSE_V0.USER_INTENT_OBSERVE, score: 0.22, source: MCIB_CAUSE_SOURCE_V0.SIGNAL });
  }
  if (intentId === T0_INTENT_CONNECT_V0) {
    raw.push({ code: PROPAGATION_CAUSE_V0.USER_INTENT_CONNECT, score: 0.24, source: MCIB_CAUSE_SOURCE_V0.SIGNAL });
  }

  if (focus.primary === TARGET_V0.VOICE || signals.rpseAttention === "listening") {
    raw.push({ code: PROPAGATION_CAUSE_V0.VOICE_OPEN, score: 0.3, source: MCIB_CAUSE_SOURCE_V0.SIGNAL });
  }
  if (focus.secondary) {
    const secCode =
      focus.secondary === TARGET_V0.WORLD
        ? PROPAGATION_CAUSE_V0.USER_INTENT_EXPLORE
        : focus.secondary === TARGET_V0.DIALOGUE
          ? PROPAGATION_CAUSE_V0.DIALOGUE_FOCUS
          : PROPAGATION_CAUSE_V0.CONTINUITY_HOLD;
    raw.push({ code: secCode, score: 0.2, source: MCIB_CAUSE_SOURCE_V0.FORK });
  }
  if (focus.primary === TARGET_V0.CONTINUITY) {
    raw.push({ code: PROPAGATION_CAUSE_V0.CONTINUITY_HOLD, score: 0.22, source: MCIB_CAUSE_SOURCE_V0.SIGNAL });
  }

  if (drift01 > 0.12) {
    raw.push({ code: "latent_drift", score: drift01 * 0.35, source: MCIB_CAUSE_SOURCE_V0.DRIFT });
  }
  if (String(signals.silenceForm) === "failure_narration") {
    raw.push({ code: PROPAGATION_CAUSE_V0.FEL_RETURN, score: 0.18, source: MCIB_CAUSE_SOURCE_V0.SIGNAL });
  }

  if (trf?.active && trf.cause && trf.cause !== "quiescent_hold") {
    raw.push({ code: trf.cause, score: 0.15 + (trf.reactivation01 || 0) * 0.2, source: MCIB_CAUSE_SOURCE_V0.TRF });
  }

  return raw;
}

/**
 * @param {ReturnType<typeof normalizeCausesV0>} causes
 */
function detectAttentionForksV0(causes) {
  if (causes.length < 2) return Object.freeze([]);
  const top = causes[0];
  const second = causes[1];
  if (top.weight01 - second.weight01 > 0.18) return Object.freeze([]);

  return Object.freeze([
    Object.freeze({
      primary: top.code,
      secondary: second.code,
      weightDelta01: Number((top.weight01 - second.weight01).toFixed(4)),
      competing: true,
      label_tr: `${top.label_tr} ↔ ${second.label_tr}`,
      label_en: `${top.label_en} ↔ ${second.label_en}`
    })
  ]);
}

/**
 * @param {ReturnType<typeof normalizeCausesV0>} causes
 * @param {"tr"|"en"} loc
 */
function blendNarrativeV0(causes, loc = "tr") {
  const c = CAUSE_LABEL_V0[loc] || CAUSE_LABEL_V0.en;
  const top = causes.slice(0, 3);
  if (top.length === 0) return loc === "tr" ? "Motivasyon belirsiz" : "Motivation unclear";
  if (top.length === 1) return top[0][`label_${loc}`] || top[0].code;
  const parts = top.map((x) => x[`label_${loc}`] || x.code);
  return parts.join(loc === "tr" ? " · " : " · ");
}

/**
 * @param {ReturnType<import("./rhizohCognitiveAttentionLayerV0.js").deriveCognitiveAttentionV0>} instant
 * @param {ReturnType<import("./rhizohAttentionIntentPropagationV0.js").advanceIntentPropagationV0>} propagation
 * @param {ReturnType<import("./rhizohTopologyReactivationFieldV0.js").deriveTopologyReactivationV0> | null} [trf]
 */
export function blendMultiCausalIntentV0(instant, propagation, trf = null) {
  const causes = normalizeCausesV0(collectCauseCandidatesV0(instant, propagation, trf));
  const forks = detectAttentionForksV0(causes);
  const dominant = causes[0] || Object.freeze({ code: "initial", weight01: 1, source: MCIB_CAUSE_SOURCE_V0.PROPAGATION });
  const superposition01 = clamp01(
    causes.length > 1 ? 1 - (dominant.weight01 - (causes[1]?.weight01 || 0)) : 0.35
  );
  const internalTension01 = clamp01(forks.length > 0 ? 0.25 + superposition01 * 0.45 : superposition01 * 0.2);

  return Object.freeze({
    schema: MCIB_SCHEMA_V0,
    atMs: Number(propagation?.atMs || instant?.atMs) || Date.now(),
    causes,
    dominant: Object.freeze({
      code: dominant.code,
      weight01: dominant.weight01,
      source: dominant.source,
      label_tr: dominant.label_tr,
      label_en: dominant.label_en
    }),
    forks,
    superposition01: Number(superposition01.toFixed(4)),
    internal_tension01: Number(internalTension01.toFixed(4)),
    narrative_blended_tr: blendNarrativeV0(causes, "tr"),
    narrative_blended_en: blendNarrativeV0(causes, "en"),
    /** Linear propagation preserved for backward compat — MCIB is superset */
    linear_primary: propagation?.why_looking || null
  });
}

/**
 * Attach MCIB to inertia without re-running propagation.
 * @param {ReturnType<typeof applyAttentionInertiaV0>} inertia
 * @param {ReturnType<import("./rhizohCognitiveAttentionLayerV0.js").deriveCognitiveAttentionV0>} instant
 * @param {ReturnType<import("./rhizohTopologyReactivationFieldV0.js").deriveTopologyReactivationV0> | null} [trf]
 */
export function enrichInertiaWithMcibV0(inertia, instant, trf = null) {
  const mcib = blendMultiCausalIntentV0(instant, inertia.propagation, trf);
  return Object.freeze({
    ...inertia,
    mcib,
    projection: Object.freeze({
      ...inertia.projection,
      narrativeHint: inertia.projection?.narrativeHint,
      internalTension01: mcib.internal_tension01,
      superposition01: mcib.superposition01
    })
  });
}
