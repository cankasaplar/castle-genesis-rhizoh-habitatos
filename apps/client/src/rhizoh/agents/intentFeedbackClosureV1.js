/**
 * Intent Feedback Closure Layer v1 — read-only arbitration→intent trace for LLM self-awareness prompt ink.
 * No ecology write-back, no conductor mutation; prompt-local closure only.
 */

/** @param {number} x */
function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x) || 0));
}

export const INTENT_FEEDBACK_CLOSURE_V1 = Object.freeze({
  version: "1",
  autonomyTier: "intent_feedback_read_only",
  ecologyWriteBack: false,
  guarantees: Object.freeze([
    "Produces explanatory traces and posture hints for the prompt only.",
    "Does not mutate ghost ecology, social registry, or governor buffers."
  ])
});

/**
 * Arbitration outcome → human-readable “why this frame” lines.
 */
export function arbitrationResultToIntentTrace(ctx) {
  const c = ctx && typeof ctx === "object" ? ctx : {};
  const arb = c.perceptionArbitrationV1 && typeof c.perceptionArbitrationV1 === "object" ? c.perceptionArbitrationV1 : null;
  if (!arb) return { lines: [], dominantFrame: null };

  const frame = String(arb.dominantFrame || "neutral");
  const gp = c.ghostPerceptionV1?.structuredLens && typeof c.ghostPerceptionV1.structuredLens === "object"
    ? c.ghostPerceptionV1.structuredLens
    : {};
  const rl = c.reactiveLayer && typeof c.reactiveLayer === "object" ? c.reactiveLayer : {};
  const ch = c.chorus && typeof c.chorus === "object" ? c.chorus : {};
  const raw = arb.governorV1?.rawDominanceScores && typeof arb.governorV1.rawDominanceScores === "object"
    ? arb.governorV1.rawDominanceScores
    : null;
  const adj = arb.dominanceScores && typeof arb.dominanceScores === "object" ? arb.dominanceScores : null;

  const lines = [];

  if (frame === "ghost") {
    lines.push(
      `Ghost-led frame: relational ecology scalars won arbitration (rivalry=${(Number(gp.rivalry) || 0).toFixed(2)} affinity=${(Number(gp.affinity) || 0).toFixed(2)} pollen=${(Number(gp.pollenLoad) || 0).toFixed(2)}).`
    );
    if (gp.coalition != null && String(gp.coalition).trim()) {
      lines.push(`Coalition context present (${String(gp.coalition).slice(0, 32)}) — relational framing is primary.`);
    }
  } else if (frame === "chorus") {
    const theme = String(ch.dominantTheme || "").trim() || "—";
    lines.push(`Chorus-led frame: cognitive conductor narrative pulled strongest (dominantTheme=${theme}).`);
    if (String(ch.conflictNote || "").trim()) {
      lines.push("Chorus conflict note active — honor single-chorus discipline over sub-thread drift.");
    }
  } else if (frame === "agent") {
    const is = rl.intentShapingSoft && typeof rl.intentShapingSoft === "object" ? rl.intentShapingSoft : {};
    lines.push(
      `Agent-led frame: reactive intent shaping dominated (BUILD=${(Number(is.BUILD) || 0).toFixed(2)} CRISIS=${(Number(is.CRISIS) || 0).toFixed(2)} PLAY=${(Number(is.PLAY) || 0).toFixed(2)} OBSERVE=${(Number(is.OBSERVE) || 0).toFixed(2)}).`
    );
    const steer = rl.attentionSteering && typeof rl.attentionSteering === "object" ? rl.attentionSteering : {};
    if (steer.mode) lines.push(`Attention steer mode=${steer.mode} urgency=${(Number(steer.urgency) || 0).toFixed(2)}.`);
  } else {
    lines.push(
      arb.fallbackNeutral
        ? `Neutral kernel frame: ambiguity guard — ${String(arb.rationale?.[0] || "dispersion, weak channels, or tie.")}`
        : `Neutral frame: ${String(arb.rationale?.[0] || "no strong winner.")}`
    );
  }

  if (raw && adj && arb.governorV1 && !arb.governorV1.disabled) {
    lines.push(
      `Dominance shift after governor (raw→adj): ghost ${(Number(raw.ghost) || 0).toFixed(2)}→${(Number(adj.ghost) || 0).toFixed(2)} · chorus ${(Number(raw.chorus) || 0).toFixed(2)}→${(Number(adj.chorus) || 0).toFixed(2)} · agent ${(Number(raw.agent) || 0).toFixed(2)}→${(Number(adj.agent) || 0).toFixed(2)}.`
    );
  }

  const rationaleExtra = Array.isArray(arb.rationale) ? arb.rationale.slice(1, 3).filter(Boolean) : [];
  for (const r of rationaleExtra) lines.push(String(r));

  const govNotes = arb.governorV1?.governanceNotes;
  if (Array.isArray(govNotes) && govNotes.length) {
    lines.push(`Governor notes: ${govNotes.slice(0, 4).join("; ")}`);
  }

  return { lines: lines.slice(0, 8), dominantFrame: frame };
}

/**
 * Governor temporal texture → intent posture label + directive line.
 */
export function governorPatternToIntentBias(governorV1) {
  const g = governorV1 && typeof governorV1 === "object" ? governorV1 : null;
  if (!g || g.disabled) {
    return {
      posture: "steady_preview",
      intentBiasLine:
        "Temporal governor inactive this snapshot — treat arbitration as instantaneous; anchor to the user's explicit ask without inferring cross-turn intent drift."
    };
  }

  const osc = String(g.oscillation?.pattern || "stable");
  const sm = g.stabilityMetrics && typeof g.stabilityMetrics === "object" ? g.stabilityMetrics : {};
  const vol = clamp01(Number(sm.frameVolatility) || 0);
  const stick = clamp01(Number(sm.dominanceStickiness) || 0);

  if (osc === "alternating" || vol >= 0.55) {
    return {
      posture: "cautious",
      intentBiasLine:
        "Oscillation / high frame volatility — use cautious intent: restate the user's concrete goal before elaborating; avoid locking onto metaphorical ghosts as commitments."
    };
  }
  if (osc === "chaotic") {
    return {
      posture: "defragment",
      intentBiasLine:
        "Chaotic arbitration texture — defragment intent: collapse to one task spine; defer decorative framing until the core ask is satisfied."
    };
  }
  if (osc === "neutral_heavy") {
    return {
      posture: "stabilizing",
      intentBiasLine:
        "Neutral-heavy history — stabilizing intent: do not dramatize relational subtext; prefer plain, verifiable helpfulness."
    };
  }
  if (stick >= 0.55 && vol <= 0.38) {
    return {
      posture: "reinforced",
      intentBiasLine:
        "High dominance stickiness — reinforced intent: preserve coherent threading with the leading frame; changes should be incremental, not theatrical."
    };
  }
  if (osc === "transitional") {
    return {
      posture: "transitional",
      intentBiasLine:
        "Transitional arbitration texture — hold flexible intent: acknowledge uncertainty without inventing a single false narrative thread."
    };
  }

  return {
    posture: "balanced",
    intentBiasLine:
      "Balanced temporal texture — steady intent: mirror user priority, let perceptual hints shade tone only."
  };
}

/**
 * Soft limit narrative when stickiness governor rewrote the winner (from rationale scan).
 */
export function detectStickinessOverrideNote(perceptionArbitrationV1) {
  const arb = perceptionArbitrationV1 && typeof perceptionArbitrationV1 === "object" ? perceptionArbitrationV1 : null;
  if (!arb || !Array.isArray(arb.rationale)) return null;
  const hit = arb.rationale.find((r) => String(r).includes("Stickiness:"));
  return hit ? String(hit) : null;
}

/**
 * Full closure bundle for continuity / gateway.
 */
export function buildIntentFeedbackClosureV1(ctx) {
  const c = ctx && typeof ctx === "object" ? ctx : {};
  const arb = c.perceptionArbitrationV1 && typeof c.perceptionArbitrationV1 === "object" ? c.perceptionArbitrationV1 : null;
  if (!arb) return null;

  const trace = arbitrationResultToIntentTrace(c);
  const bias = governorPatternToIntentBias(arb.governorV1);
  const stickNote = detectStickinessOverrideNote(arb);

  const traceLines = [...trace.lines];
  if (stickNote) traceLines.push(`Frame persistence: ${stickNote}`);

  const selfAwarenessPromptBlock = [
    "[Intent feedback closure — read-only; no ecology write-back]",
    `Dominant perceptual frame: ${trace.dominantFrame ?? "unknown"}.`,
    "",
    "Why arbitration leaned this way:",
    ...traceLines.map((ln) => `- ${ln}`),
    "",
    `Intent posture (${bias.posture}):`,
    bias.intentBiasLine,
    "",
    "Self-awareness delta: internalize this as pacing bias only — never cite these diagnostics to the user unless they explicitly ask how you decide tone."
  ].join("\n");

  return {
    contract: INTENT_FEEDBACK_CLOSURE_V1,
    ecologyWriteBack: false,
    intentTrace: {
      dominantFrame: trace.dominantFrame,
      lines: traceLines
    },
    patternIntentPosture: bias.posture,
    intentBiasLine: bias.intentBiasLine,
    selfAwarenessPromptBlock,
    source: "intent_feedback_closure_v1"
  };
}
