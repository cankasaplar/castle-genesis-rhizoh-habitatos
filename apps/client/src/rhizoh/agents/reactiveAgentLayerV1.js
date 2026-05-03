/**
 * Reactive Agent Layer v1 — interprets ghost ecology perception into soft, non-mutative hints.
 *
 * Guarantees: no ecology write-back, no spawn, no chorus/registry mutation.
 * Consumers (prompt composer, UI) may READ these hints only.
 */

/** @param {number} x */
function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x) || 0));
}

/** @param {number} x @param {number} lo @param {number} hi */
function clamp(x, lo, hi) {
  return Math.max(lo, Math.min(hi, Number(x) || 0));
}

export const REACTIVE_AGENT_LAYER_V1 = Object.freeze({
  version: "1",
  autonomyTier: "reactive_read_only",
  ecologyWriteBack: false,
  selfSpawn: false,
  meshBinding: false,
  guarantees: Object.freeze([
    "Outputs are advisory shadows only — never applied to ghost ecology kernels.",
    "Chorus bias here is soft text / numeric hint for upstream prompt shaping, not conductor mutation."
  ])
});

/**
 * @param {Record<string, unknown> | null | undefined} perception — from buildUserAgentEcologyPerception
 * @param {{ chorus?: Record<string, unknown> | null, field?: Record<string, unknown> | null }} [context]
 */
export function computeReactiveAgentLayerV1(perception, context = {}) {
  const ctx = context && typeof context === "object" ? context : {};
  const chorus = ctx.chorus && typeof ctx.chorus === "object" ? ctx.chorus : {};
  const field = ctx.field && typeof ctx.field === "object" ? ctx.field : {};

  const p = perception && typeof perception === "object" ? perception : {};
  const rp = clamp01(Number(p.rivalryPressure) || 0);
  const ap = clamp01(Number(p.affinityPulse) || 0);
  const pol = clamp01(Number(p.pollenLoad) || 0);
  const mimicW = clamp01(Number(p.mimicryEcho?.weight) || 0);
  const phase = String(field.phase || "").toLowerCase();
  const drift = clamp01(Number(field.driftScore) || 0);
  const reconc = clamp01(Number(field.reconciliationNeed) || 0);

  /** Soft intent deltas (−0.12…0.12) — additive suggestion only, not merged into conductor output here */
  let BUILD = 0.055 * ap + 0.022 * (1 - rp);
  let CRISIS = 0.045 * rp * (phase === "reconcile" ? 1 : 0.55) + 0.03 * reconc;
  let PLAY = 0.038 * pol + 0.015 * (1 - drift);
  let OBSERVE = 0.05 * rp + 0.04 * mimicW + 0.035 * drift;

  BUILD = clamp(BUILD, 0, 0.12);
  CRISIS = clamp(CRISIS, 0, 0.12);
  PLAY = clamp(PLAY, 0, 0.12);
  OBSERVE = clamp(OBSERVE, 0, 0.12);

  const intentShapingSoft = {
    BUILD: Math.round(BUILD * 1000) / 1000,
    CRISIS: Math.round(CRISIS * 1000) / 1000,
    PLAY: Math.round(PLAY * 1000) / 1000,
    OBSERVE: Math.round(OBSERVE * 1000) / 1000
  };

  const rivMap = p.localRivalryMap && typeof p.localRivalryMap === "object" ? p.localRivalryMap : {};
  const affMap = p.localAffinityMap && typeof p.localAffinityMap === "object" ? p.localAffinityMap : {};

  const rivTop = Object.entries(rivMap).sort((a, b) => Number(b[1]) - Number(a[1]))[0];
  const affTop = Object.entries(affMap).sort((a, b) => Number(b[1]) - Number(a[1]))[0];

  let focusThreadId = rivTop?.[0] ?? null;
  let urgency = rivTop ? clamp01(Number(rivTop[1])) : 0;
  let mode = "rivalry_peak";

  if (!focusThreadId && affTop) {
    focusThreadId = affTop[0];
    urgency = clamp01(Number(affTop[1]) * 0.85);
    mode = "affinity_anchor";
  }

  const domTheme = String(chorus.dominantTheme || "");
  let suggestedAccent = "neutral";
  if (rp > 0.52) suggestedAccent = "tension_aware";
  else if (ap > 0.52) suggestedAccent = "coalition_soft";
  else if (pol > 0.38) suggestedAccent = "echo_resonance";

  const chorusSoftBias = {
    injectOnly: true,
    ecologyWriteBack: false,
    dominantThemeEcho: domTheme || null,
    suggestedAccent,
    promptComposerNote: [
      "Reactive layer (read-only): shape user-facing bias softly; do not replace conductor output.",
      `Ecology signals — rivalry=${rp.toFixed(2)} affinity=${ap.toFixed(2)} pollen=${pol.toFixed(2)} mimic=${mimicW.toFixed(2)}.`,
      chorus.conflictNote ? `Chorus tension flag present — respect single-chorus discipline.` : null
    ]
      .filter(Boolean)
      .join(" ")
  };

  const narrativeFraming = {
    toneHint:
      rp > 0.48
        ? "hold_space_low_cross_talk"
        : ap > 0.48
          ? "collaborative_threading"
          : pol > 0.35
            ? "memory_echo_without_claim"
            : "steady_observer",
    pollenResonance: pol > 0.32,
    coalitionContext: p.coalitionId != null
  };

  return {
    contract: REACTIVE_AGENT_LAYER_V1,
    ecologyWriteBack: false,
    intentShapingSoft,
    attentionSteering: {
      focusThreadId,
      urgency: Math.round(urgency * 1000) / 1000,
      mode
    },
    chorusSoftBias,
    narrativeFraming,
    source: "reactive_agent_layer_v1_read_only"
  };
}
