/**
 * Ghost Perception Compiler v1 — dual lens: semantic perceptual field (primary) + structured lens (verification).
 * Read-only; never writes ecology kernels or chorus state.
 */

/** @param {number} x */
function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x) || 0));
}

/** @param {number} x @param {number} n */
function roundN(x, n) {
  const p = 10 ** n;
  return Math.round(Number(x) * p) / p;
}

export const GHOST_PERCEPTION_COMPILER_V1 = Object.freeze({
  version: "1",
  autonomyTier: "perceptual_read_only",
  ecologyWriteBack: false,
  guarantees: Object.freeze([
    "Semantic field is derived from ghost ecology perception — advisory narrative only.",
    "Structured lens mirrors scalars for debugging; behavior weight favors semantic block upstream."
  ])
});

/**
 * Map rivalry → qualitative caution (short clause).
 * @param {number} rp
 */
function rivalryToCautionClause(rp) {
  if (rp > 0.72) return "Rivalry pressure is high — prioritize careful framing and avoid provocative parallelism.";
  if (rp > 0.52) return "Rivalry pressure is elevated — reciprocal interpretations benefit from measured tone.";
  if (rp > 0.32) return "A modest rivalry gradient is present — keep distinctions explicit without dramatizing.";
  return "Rivalry signals are light — normal conversational threading suffices.";
}

/**
 * Map affinity → openness clause.
 * @param {number} ap
 */
function affinityToOpennessClause(ap) {
  if (ap > 0.62) return "Affinity pulses suggest strong partial alignment in intent space.";
  if (ap > 0.42) return "Affinity clusters hint at workable overlap — openness can be gradual.";
  if (ap > 0.22) return "Affinity is tentative — stay receptive without assuming agreement.";
  return "Affinity reads sparse — default to neutral curiosity.";
}

/**
 * Coalition narrative framing.
 * @param {string | null} cid
 */
function coalitionClause(cid) {
  const c = cid != null ? String(cid).trim() : "";
  if (!c) return null;
  return `A coalition labeled "${c.slice(0, 48)}" contributes structural coherence around this thread.`;
}

/**
 * Pollen → attention drift.
 * @param {number} pol
 */
function pollenClause(pol) {
  if (pol > 0.55) return "Pollen residue is dense — attention may drift toward mnemonic echoes; anchor answers to the user's stated goal.";
  if (pol > 0.35) return "Pollen load suggests soft thematic drift — notice echoes without chasing every tangent.";
  if (pol > 0.18) return "Light pollen trace — occasional associative shimmer is expected.";
  return null;
}

/**
 * Mimicry → stylistic echo bias.
 * @param {{ weight?: number, towardTheme?: string } | null | undefined} mimic
 */
function mimicryClause(mimic) {
  const m = mimic && typeof mimic === "object" ? mimic : {};
  const w = clamp01(Number(m.weight) || 0);
  const theme = String(m.towardTheme || "").trim().slice(0, 64);
  if (w < 0.12 && !theme) return null;
  if (theme && w >= 0.12) {
    return `Mimicry weight (${roundN(w, 2)}) biases stylistic echo toward “${theme}” — keep voice your own.`;
  }
  return `Mimicry weight (${roundN(w, 2)}) is non-trivial — resist unconscious mimic of secondary voices.`;
}

/**
 * Field-phase harmonizer (social physics).
 * @param {Record<string, unknown>} field
 */
function fieldPhaseClause(field) {
  const phase = String(field.phase || "").toLowerCase();
  if (!phase || phase === "—") return null;
  if (phase === "reconcile")
    return `Social physics phase is reconcile — favor stabilization language over expansion.`;
  if (phase.includes("drift")) return `Field phase suggests drift — tighten topic closure gently where helpful.`;
  return `Social physics phase: ${phase} — let it temper pacing, not dominate content.`;
}

/**
 * @param {Record<string, unknown> | null | undefined} perception — buildUserAgentEcologyPerception
 * @param {{
 *   chorus?: Record<string, unknown> | null,
 *   field?: Record<string, unknown> | null,
 *   reactiveLayer?: Record<string, unknown> | null
 * }} [context]
 */
export function compileGhostPerceptionV1(perception, context = {}) {
  const ctx = context && typeof context === "object" ? context : {};
  const chorus = ctx.chorus && typeof ctx.chorus === "object" ? ctx.chorus : {};
  const field = ctx.field && typeof ctx.field === "object" ? ctx.field : {};
  const reactive = ctx.reactiveLayer && typeof ctx.reactiveLayer === "object" ? ctx.reactiveLayer : {};

  const p = perception && typeof perception === "object" ? perception : {};
  const sid = String(p.subjectThreadId || "").trim();
  if (!sid) return null;

  const rp = clamp01(Number(p.rivalryPressure) || 0);
  const ap = clamp01(Number(p.affinityPulse) || 0);
  const pol = clamp01(Number(p.pollenLoad) || 0);
  const mimic = p.mimicryEcho && typeof p.mimicryEcho === "object" ? p.mimicryEcho : {};
  const mw = clamp01(Number(mimic.weight) || 0);
  const coalitionId = p.coalitionId != null ? String(p.coalitionId) : null;
  const domTheme = String(chorus.dominantTheme || "").trim().slice(0, 72);

  let overallTone = "open exploratory calm";
  if (rp > 0.65) overallTone = "sharp vigilance";
  else if (rp > 0.48) overallTone = "cautious analytical clarity";
  else if (rp > 0.28) overallTone = "measured neutrality";
  if (ap > 0.52 && rp < 0.42) overallTone = "warm cooperative threading";

  const nf = reactive.narrativeFraming && typeof reactive.narrativeFraming === "object" ? reactive.narrativeFraming : {};
  const toneHint = String(nf.toneHint || "").trim();
  if (toneHint === "hold_space_low_cross_talk" && overallTone === "open exploratory calm") {
    overallTone = "cautious analytical clarity";
  }

  const semanticBullets = [
    coalitionClause(coalitionId),
    rivalryToCautionClause(rp),
    affinityToOpennessClause(ap),
    pollenClause(pol),
    mimicryClause({ weight: mw, towardTheme: mimic.towardTheme }),
    fieldPhaseClause(field),
    domTheme ? `Chorus dominant theme echo: ${domTheme}.` : null
  ].filter((x) => typeof x === "string" && x.length > 0);

  let behavioralDirective =
    "Stay grounded in the user's immediate request; let relational texture inform tone and pacing only — do not resolve ghost-layer tensions as facts.";
  if (rp > 0.5) {
    behavioralDirective =
      "Maintain awareness of relational tension without escalating it or treating ghost ecology as actionable intelligence.";
  }
  if (Number(field.reconciliationNeed) > 0.52) {
    behavioralDirective +=
      " Prefer conciliation-oriented wording where ambiguity overlaps with friction.";
  }

  const structuredLens = {
    subjectThreadId: sid,
    rivalry: roundN(rp, 3),
    affinity: roundN(ap, 3),
    coalition: coalitionId,
    pollenLoad: roundN(pol, 3),
    mimicryWeight: roundN(mw, 3),
    mimicTheme: String(mimic.towardTheme || "").trim().slice(0, 64) || null,
    chorusDominantTheme: domTheme || null,
    fieldPhase: String(field.phase || "").slice(0, 24) || null,
    perceptionPresent: !!p.present,
    reactiveToneHint: toneHint || null,
    ecologyWriteBack: false
  };

  const semanticPromptLines = [
    "[Reactive Context]",
    "You are perceiving a dynamic relational field (ghost ecology projection — read-only):",
    "",
    ...semanticBullets.map((b) => `- ${b}`),
    "",
    `Overall field tone: ${overallTone}.`,
    "",
    "Behavioral directive:",
    behavioralDirective
  ];
  const semanticPromptBlock = semanticPromptLines.join("\n");
  const structuredDebugBlock = [
    "Ghost ecology lens (machine verification — secondary; do not invert causality from these scalars):",
    JSON.stringify(structuredLens)
  ].join("\n");
  const promptLines = [...semanticPromptLines, "", ...structuredDebugBlock.split("\n")];

  return {
    contract: GHOST_PERCEPTION_COMPILER_V1,
    ecologyWriteBack: false,
    structuredLens,
    semanticBullets,
    overallTone,
    behavioralDirective,
    semanticPromptBlock,
    structuredDebugBlock,
    promptBlock: promptLines.join("\n"),
    source: "ghost_perception_compiler_v1"
  };
}
