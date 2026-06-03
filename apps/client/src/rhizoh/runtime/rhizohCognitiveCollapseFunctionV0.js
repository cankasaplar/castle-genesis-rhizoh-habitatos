/**
 * CCF v1 — Selective compression field (not flat collapse engine).
 * MCIB plurality → single experiential "now"; plurality trace preserved internally.
 * @see docs/RHIZOH_CCF_V1.md
 */

export const CCF_COMPRESSION_KIND_V0 = "selective";

import { PROPAGATION_CAUSE_V0 } from "./rhizohAttentionIntentPropagationV0.js";

export const CCF_SCHEMA_V0 = "castle.rhizoh.cognitive_collapse_function.v0";

export const RHIZOH_COGNITIVE_COLLAPSE_EVENT_V0 = "rhizoh:cognitive-collapse-v0";

export const CCF_COLLAPSE_MODE_V0 = Object.freeze({
  SINGULAR: "singular",
  SOFT_BLEND: "soft_blend",
  TENSION_HOLD: "tension_hold"
});

const EXPERIENTIAL_NOW_V0 = Object.freeze({
  tr: Object.freeze({
    [PROPAGATION_CAUSE_V0.VOICE_OPEN]: "Sesinde",
    [PROPAGATION_CAUSE_V0.USER_INTENT_EXPLORE]: "Keşifte",
    [PROPAGATION_CAUSE_V0.USER_INTENT_PRODUCE]: "Üretimde",
    [PROPAGATION_CAUSE_V0.USER_INTENT_OBSERVE]: "İzliyor",
    [PROPAGATION_CAUSE_V0.USER_INTENT_CONNECT]: "Bağ kuruyor",
    [PROPAGATION_CAUSE_V0.DIALOGUE_FOCUS]: "Diyalogda",
    [PROPAGATION_CAUSE_V0.CONTINUITY_HOLD]: "Süreklilikte",
    [PROPAGATION_CAUSE_V0.SURFACE_SHIFT]: "Yüzeyde",
    [PROPAGATION_CAUSE_V0.FIELD_EXECUTING]: "Yürütmede",
    [PROPAGATION_CAUSE_V0.DRIFT_SHIFT]: "Hafif kayıyor",
    [PROPAGATION_CAUSE_V0.FEL_RETURN]: "Yeniden oturdu",
    [PROPAGATION_CAUSE_V0.INITIAL]: "Burada",
    competing_voice_explore: "Dinliyor, keşif bekliyor",
    competing_dialogue_continuity: "Diyalogda, süreklilik sırada"
  }),
  en: Object.freeze({
    [PROPAGATION_CAUSE_V0.VOICE_OPEN]: "On voice",
    [PROPAGATION_CAUSE_V0.USER_INTENT_EXPLORE]: "Exploring",
    [PROPAGATION_CAUSE_V0.USER_INTENT_PRODUCE]: "Producing",
    [PROPAGATION_CAUSE_V0.USER_INTENT_OBSERVE]: "Observing",
    [PROPAGATION_CAUSE_V0.USER_INTENT_CONNECT]: "Connecting",
    [PROPAGATION_CAUSE_V0.DIALOGUE_FOCUS]: "In dialogue",
    [PROPAGATION_CAUSE_V0.CONTINUITY_HOLD]: "In continuity",
    [PROPAGATION_CAUSE_V0.SURFACE_SHIFT]: "On surface",
    [PROPAGATION_CAUSE_V0.FIELD_EXECUTING]: "Executing",
    [PROPAGATION_CAUSE_V0.DRIFT_SHIFT]: "Soft drift",
    [PROPAGATION_CAUSE_V0.FEL_RETURN]: "Settling again",
    [PROPAGATION_CAUSE_V0.INITIAL]: "Here now",
    competing_voice_explore: "Listening, explore waiting",
    competing_dialogue_continuity: "Dialogue first, continuity next"
  })
});

/** @type {ReturnType<typeof collapseCognitiveExperienceV0> | null} */
let lastCollapsed = null;

function clamp01(v) {
  return Math.max(0, Math.min(1, Number(v) || 0));
}

/**
 * @param {"tr"|"en"} loc
 * @param {ReturnType<import("./rhizohMultiCausalIntentBlendingV0.js").blendMultiCausalIntentV0>} mcib
 */
function fuseNarrativeNowV0(mcib, loc) {
  const map = EXPERIENTIAL_NOW_V0[loc] || EXPERIENTIAL_NOW_V0.en;
  const dominant = mcib?.dominant;
  const causes = mcib?.causes || [];
  const tension = clamp01(mcib?.internal_tension01);
  const forks = mcib?.forks || [];

  if (!dominant?.code) {
    return loc === "tr" ? "Şimdi burada" : "Here now";
  }

  if (tension > 0.42 && forks.length > 0) {
    const fork = forks[0];
    const forkKey = `${fork.primary}_${fork.secondary}`.includes("voice") &&
      `${fork.primary}_${fork.secondary}`.includes("explore")
      ? "competing_voice_explore"
      : fork.primary === PROPAGATION_CAUSE_V0.DIALOGUE_FOCUS &&
          fork.secondary === PROPAGATION_CAUSE_V0.CONTINUITY_HOLD
        ? "competing_dialogue_continuity"
        : null;
    if (forkKey && map[forkKey]) return map[forkKey];
    const d = map[dominant.code] || dominant[`label_${loc}`];
    return loc === "tr" ? `${d} öncelikli` : `${d} first`;
  }

  const second = causes[1];
  const gap = dominant.weight01 - (second?.weight01 || 0);

  if (gap >= 0.18 || causes.length === 1) {
    return map[dominant.code] || dominant[`label_${loc}`] || dominant.code;
  }

  const primary = map[dominant.code] || dominant[`label_${loc}`];
  if (!second) return primary;
  if (loc === "tr") {
    return `${primary}, ${(second.label_tr || second.code).toLowerCase()} eşlik ediyor`;
  }
  return `${primary}, ${second.label_en || second.code} alongside`;
}

/**
 * @param {number} internalTension01
 */
function resolveTensionFadeV0(internalTension01) {
  const preserved = clamp01(internalTension01);
  return Object.freeze({
    preserved_internal_tension01: Number(preserved.toFixed(4)),
    resolved_tension01: Number((preserved * 0.35).toFixed(4)),
    duration_stretch_ms: Math.round(80 + preserved * 240),
    opacity_softening01: Number((preserved * 0.07).toFixed(4)),
    curve_widen01: Number((1 + preserved * 0.22).toFixed(4))
  });
}

/**
 * @param {ReturnType<import("./rhizohMultiCausalIntentBlendingV0.js").blendMultiCausalIntentV0>} mcib
 */
/**
 * How much internal plurality remains as felt trace (not UI list).
 * @param {ReturnType<import("./rhizohMultiCausalIntentBlendingV0.js").blendMultiCausalIntentV0>} mcib
 * @param {string} mode
 */
function derivePluralityTraceV0(mcib, mode) {
  const causeCount = mcib?.causes?.length || 0;
  const superposition = clamp01(mcib?.superposition01);
  const forks = mcib?.forks?.length || 0;
  let trace = 0.12 + superposition * 0.35 + Math.min(0.25, (causeCount - 1) * 0.08) + forks * 0.1;
  if (mode === CCF_COLLAPSE_MODE_V0.TENSION_HOLD) trace = Math.max(trace, 0.38);
  if (mode === CCF_COLLAPSE_MODE_V0.SOFT_BLEND) trace = Math.max(trace, 0.28);
  return clamp01(trace);
}

/**
 * "Too perfect collapse" risk — high = flat single-tone consciousness risk.
 * @param {number} collapseCoherence01
 * @param {number} pluralityTrace01
 * @param {number} preservedTension01
 */
function deriveFlatRiskV0(collapseCoherence01, pluralityTrace01, preservedTension01) {
  return clamp01(
    collapseCoherence01 * 0.55 +
      (1 - pluralityTrace01) * 0.35 -
      preservedTension01 * 0.2
  );
}

function deriveCollapseModeV0(mcib) {
  const tension = clamp01(mcib?.internal_tension01);
  const superposition = clamp01(mcib?.superposition01);
  const gap =
    (mcib?.dominant?.weight01 || 0) - (mcib?.causes?.[1]?.weight01 || 0);

  if (tension > 0.4 && (mcib?.forks?.length || 0) > 0) return CCF_COLLAPSE_MODE_V0.TENSION_HOLD;
  if (gap >= 0.18 || superposition < 0.42) return CCF_COLLAPSE_MODE_V0.SINGULAR;
  return CCF_COLLAPSE_MODE_V0.SOFT_BLEND;
}

/**
 * MCIB multiplicity → single experiential now.
 * @param {ReturnType<import("./rhizohMultiCausalIntentBlendingV0.js").blendMultiCausalIntentV0>} mcib
 * @param {ReturnType<import("./rhizohAttentionIntentPropagationV0.js").advanceIntentPropagationV0>} [propagation]
 * @param {ReturnType<import("./rhizohTopologyReactivationFieldV0.js").deriveTopologyReactivationV0> | null} [trf]
 * @param {ReturnType<import("./rhizohCognitiveAttentionLayerV0.js").deriveCognitiveAttentionV0> | null} [instant]
 */
export function collapseCognitiveExperienceV0(mcib, propagation = null, trf = null, instant = null) {
  const atMs =
    Number(mcib?.atMs || propagation?.atMs || instant?.atMs) || Date.now();
  const tension = clamp01(mcib?.internal_tension01);
  const superposition = clamp01(mcib?.superposition01);
  const dominant = mcib?.dominant;
  const mode = deriveCollapseModeV0(mcib);
  const tension_fade = resolveTensionFadeV0(tension);

  const narrative_now_tr = fuseNarrativeNowV0(mcib, "tr");
  const narrative_now_en = fuseNarrativeNowV0(mcib, "en");

  const gap =
    (dominant?.weight01 || 0) - (mcib?.causes?.[1]?.weight01 || 0);
  let collapse_coherence01 = 0.58;
  if (mode === CCF_COLLAPSE_MODE_V0.SINGULAR) {
    collapse_coherence01 = 0.68 + (dominant?.weight01 || 0) * 0.28;
  } else if (mode === CCF_COLLAPSE_MODE_V0.TENSION_HOLD) {
    collapse_coherence01 = 0.52 + (1 - tension) * 0.22;
  } else {
    collapse_coherence01 = 0.55 + gap * 1.2;
  }
  collapse_coherence01 = clamp01(collapse_coherence01);
  const plurality_trace01 = derivePluralityTraceV0(mcib, mode);
  const flat_risk01 = deriveFlatRiskV0(
    collapse_coherence01,
    plurality_trace01,
    tension_fade.preserved_internal_tension01
  );

  const experiential_now_id = `${atMs}:${dominant?.code || "none"}:${mode}`;

  return Object.freeze({
    schema: CCF_SCHEMA_V0,
    atMs,
    experiential_now_id,
    compression_kind: CCF_COMPRESSION_KIND_V0,
    collapse_mode: mode,
    collapse_coherence01: Number(collapse_coherence01.toFixed(4)),
    plurality_trace01: Number(plurality_trace01.toFixed(4)),
    flat_risk01: Number(flat_risk01.toFixed(4)),
    dominant_cause: dominant
      ? Object.freeze({
          code: dominant.code,
          weight01: dominant.weight01,
          source: dominant.source
        })
      : null,
    narrative_now_tr,
    narrative_now_en,
    narrative_fused_tr: narrative_now_tr,
    narrative_fused_en: narrative_now_en,
    tension_fade,
    mcib_cause_count: mcib?.causes?.length || 0,
    trf_active: Boolean(trf?.why_reshaped?.code),
    /** MCIB plurality preserved for internal audit — not surfaced to UI */
    mcib_superposition01: Number(superposition.toFixed(4)),
    latent_echo: Object.freeze({
      cause_codes: Object.freeze((mcib?.causes || []).slice(0, 4).map((c) => c.code)),
      fork_count: mcib?.forks?.length || 0,
      trf_code: trf?.why_reshaped?.code || null
    })
  });
}

/**
 * @param {ReturnType<typeof collapseCognitiveExperienceV0>} ccf
 */
export function publishCognitiveCollapseV0(ccf) {
  lastCollapsed = ccf;
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.cognitiveCollapse = ccf;
    try {
      window.dispatchEvent(
        new CustomEvent(RHIZOH_COGNITIVE_COLLAPSE_EVENT_V0, {
          detail: Object.freeze({ collapse: ccf })
        })
      );
    } catch {
      /* noop */
    }
  }
  return ccf;
}

/**
 * @param {ReturnType<import("./rhizohAttentionInertiaFieldV0.js").applyAttentionInertiaV0>} inertia
 * @param {ReturnType<import("./rhizohCognitiveAttentionLayerV0.js").deriveCognitiveAttentionV0>} instant
 * @param {ReturnType<import("./rhizohTopologyReactivationFieldV0.js").deriveTopologyReactivationV0> | null} [trf]
 */
export function enrichInertiaWithCcfV0(inertia, instant, trf = null) {
  const mcib = inertia?.mcib;
  if (!mcib) return inertia;

  const ccf = collapseCognitiveExperienceV0(mcib, inertia.propagation, trf, instant);
  publishCognitiveCollapseV0(ccf);

  return Object.freeze({
    ...inertia,
    ccf,
    projection: Object.freeze({
      ...inertia.projection,
      narrativeHint: ccf.narrative_now_tr,
      internalTension01: Math.max(
        ccf.tension_fade.resolved_tension01,
        ccf.plurality_trace01 * 0.12
      ),
      superposition01: ccf.collapse_coherence01,
      pluralityTrace01: ccf.plurality_trace01
    })
  });
}

export function readLastCognitiveCollapseV0() {
  return lastCollapsed;
}

export function resetCognitiveCollapseForTestV0() {
  lastCollapsed = null;
}
