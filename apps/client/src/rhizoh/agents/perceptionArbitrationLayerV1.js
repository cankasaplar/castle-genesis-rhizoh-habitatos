/**
 * L10 Perception Arbitration Core v1 — single dominant perceptual frame; read-only.
 *
 * Resolves tension among ghost perception, reactive agent hints, and cognitive chorus framing,
 * then emits an ordered prompt stack for the LLM (primary → secondary channels → debug lens).
 */

import { formatReactiveAgentLayerForPromptV1 } from "./formatReactiveAgentForPromptV1.js";
import {
  normalizeArbitrationGovernorBuffer,
  pushArbitrationMemoryEntry,
  runArbitrationStabilityGovernorV1,
  enforceFramePersistenceSoftLimit
} from "./arbitrationStabilityGovernorV1.js";

/** @param {number} x */
function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x) || 0));
}

/** @param {number[]} xs */
function stdDev3(xs) {
  if (xs.length !== 3) return 0;
  const m = (xs[0] + xs[1] + xs[2]) / 3;
  const v = ((xs[0] - m) ** 2 + (xs[1] - m) ** 2 + (xs[2] - m) ** 2) / 3;
  return Math.sqrt(Math.max(0, v));
}

export const PERCEPTION_ARBITRATION_V1 = Object.freeze({
  version: "1",
  autonomyTier: "perceptual_arbitration_read_only",
  ecologyWriteBack: false,
  guarantees: Object.freeze([
    "Selects one dominant frame for prompt ordering; does not mutate ecology, chorus, or registry.",
    "Kernel-neutral fallback when conflict is high or signals are ambiguous."
  ])
});

/**
 * Scalar strengths for ghost / chorus / reactive agent channels (0..1).
 */
export function computeFrameDominance(input) {
  const inp = input && typeof input === "object" ? input : {};
  const gp = inp.ghostPerceptionV1 && typeof inp.ghostPerceptionV1 === "object" ? inp.ghostPerceptionV1 : null;
  const lens = gp?.structuredLens && typeof gp.structuredLens === "object" ? gp.structuredLens : {};
  const rp = clamp01(Number(lens.rivalry) || 0);
  const ap = clamp01(Number(lens.affinity) || 0);
  const pol = clamp01(Number(lens.pollenLoad) || 0);
  const mw = clamp01(Number(lens.mimicryWeight) || 0);
  const coalitionBump = lens.coalition != null && String(lens.coalition).trim() ? 0.14 : 0;

  const ghost = clamp01(0.44 * rp + 0.22 * ap + 0.26 * pol + 0.18 * mw + coalitionBump);

  const chorus = inp.chorus && typeof inp.chorus === "object" ? inp.chorus : {};
  const mb = chorus.mergedBias && typeof chorus.mergedBias === "object" ? chorus.mergedBias : {};
  const vals = [Number(mb.BUILD), Number(mb.CRISIS), Number(mb.PLAY), Number(mb.OBSERVE)].map((x) =>
    clamp01(Number(x) || 0)
  );
  const spread = vals.length ? Math.max(...vals) - Math.min(...vals) : 0;
  const dom = String(chorus.dominantTheme || "").trim();
  const conflictNote = String(chorus.conflictNote || "").trim();
  const chorusBase = dom ? 0.2 : 0.06;
  const chorusScore = clamp01(chorusBase + 0.42 * clamp01(spread * 1.15) + (conflictNote ? 0.26 : 0) + (dom ? 0.12 : 0));

  const reactive = inp.reactiveLayer && typeof inp.reactiveLayer === "object" ? inp.reactiveLayer : {};
  const is = reactive.intentShapingSoft && typeof reactive.intentShapingSoft === "object" ? reactive.intentShapingSoft : {};
  const intentSum =
    clamp01(Number(is.BUILD) || 0) +
    clamp01(Number(is.CRISIS) || 0) +
    clamp01(Number(is.PLAY) || 0) +
    clamp01(Number(is.OBSERVE) || 0);
  const steer = reactive.attentionSteering && typeof reactive.attentionSteering === "object" ? reactive.attentionSteering : {};
  const urgency = clamp01(Number(steer.urgency) || 0);
  const rivalryPeak = String(steer.mode || "") === "rivalry_peak" ? 0.07 : 0;
  const agent = clamp01(1.85 * intentSum + 0.38 * urgency + rivalryPeak);

  const conflictScore = clamp01(stdDev3([ghost, chorusScore, agent]) * 3.15);

  return {
    ghost,
    chorus: chorusScore,
    agent,
    conflictScore,
    raw: { ghost, chorus: chorusScore, agent }
  };
}

/**
 * Pick dominant frame or kernel-neutral fallback.
 */
export function resolvePerceptualFrame(input, dominance) {
  const dom = dominance && typeof dominance === "object" ? dominance : computeFrameDominance(input);
  const { ghost, chorus, agent, conflictScore } = dom;
  const rationale = [];

  const maxScore = Math.max(ghost, chorus, agent);
  const sorted = [
    ["chorus", chorus],
    ["ghost", ghost],
    ["agent", agent]
  ].sort((a, b) => b[1] - a[1]);

  /** Tie-break order: chorus → ghost → agent */
  const tieEps = 0.045;
  let dominantFrame = "neutral";
  let fallbackNeutral = false;

  if (conflictScore > 0.74) {
    fallbackNeutral = true;
    rationale.push(`High cross-channel dispersion (conflict≈${conflictScore.toFixed(2)}) — kernel-neutral frame.`);
  } else if (maxScore < 0.2) {
    fallbackNeutral = true;
    rationale.push("All perceptual channels weak — kernel-neutral frame.");
  } else if (sorted[0][1] - sorted[1][1] < tieEps) {
    fallbackNeutral = true;
    rationale.push(`Top channels tied within ${tieEps} — kernel-neutral frame.`);
  } else {
    dominantFrame = sorted[0][0];
    rationale.push(`Dominant: ${dominantFrame} (ghost=${ghost.toFixed(2)} chorus=${chorus.toFixed(2)} agent=${agent.toFixed(2)}).`);
  }

  return {
    dominantFrame,
    fallbackNeutral,
    conflictScore,
    dominanceScores: { ghost, chorus, agent },
    rationale
  };
}

function chorusFullBlock(chorus) {
  const c = chorus && typeof chorus === "object" ? chorus : {};
  const pb = String(c.promptBlock || "").trim();
  if (!pb) return "";
  return ["Cognitive conductor (single chorus — avoid conflicting sub-thread pulls):", pb].join("\n");
}

/** Richer reactive block when this channel leads or follows. */
function reactiveExpandedBlock(reactiveLayer) {
  const r = reactiveLayer && typeof reactiveLayer === "object" ? reactiveLayer : null;
  if (!r || r.ecologyWriteBack !== false) return "";
  const is = r.intentShapingSoft && typeof r.intentShapingSoft === "object" ? r.intentShapingSoft : {};
  const steer = r.attentionSteering && typeof r.attentionSteering === "object" ? r.attentionSteering : {};
  const nf = r.narrativeFraming && typeof r.narrativeFraming === "object" ? r.narrativeFraming : {};
  const bias = r.chorusSoftBias && typeof r.chorusSoftBias === "object" ? r.chorusSoftBias : {};
  const compact = formatReactiveAgentLayerForPromptV1(r);
  const lines = [
    "Reactive agent layer (read-only — no ecology write-back):",
    `Soft intent deltas BUILD=${Number(is.BUILD).toFixed(3)} CRISIS=${Number(is.CRISIS).toFixed(3)} PLAY=${Number(is.PLAY).toFixed(3)} OBSERVE=${Number(is.OBSERVE).toFixed(3)}`,
    steer.focusThreadId
      ? `Attention steer: thread=${String(steer.focusThreadId).slice(0, 48)} urgency=${Number(steer.urgency).toFixed(2)} mode=${steer.mode || ""}`
      : null,
    nf.toneHint ? `Narrative tone hint: ${nf.toneHint}` : null,
    bias.suggestedAccent ? `Suggested chorus accent: ${bias.suggestedAccent}` : null,
    compact ? `Compact shadow: ${compact}` : null
  ].filter(Boolean);
  return lines.join("\n");
}

function sectionsForChannels(chorusBlock, reactiveBlock, ghostSemantic, structuredDebug) {
  return {
    chorusChannel: chorusBlock,
    reactiveChannel: reactiveBlock,
    ghostChannel: ghostSemantic,
    structuredLensDebug: structuredDebug
  };
}

/**
 * Order prompt bodies so the dominant frame leads; others follow as secondary.
 */
export function reorderPromptStack(resolve, sections) {
  const sec = sections && typeof sections === "object" ? sections : {};
  const chorusBlock = String(sec.chorusChannel || "").trim();
  const reactiveBlock = String(sec.reactiveChannel || "").trim();
  const ghostSemantic = String(sec.ghostChannel || "").trim();
  const structuredDebug = String(sec.structuredLensDebug || "").trim();

  const neutralPrimary =
    "[PRIMARY PERCEPTUAL FRAME — kernel-neutral arbitration]\n" +
    "Multiple perceptual channels compete without a safe single winner. Answer the user's concrete request first; keep tone steady and analytical; " +
    "do not treat ghost ecology or chorus metaphors as factual claims about people or the world.";

  let primary = neutralPrimary;
  const frame = resolve?.dominantFrame || "neutral";

  if (!resolve?.fallbackNeutral && frame === "chorus") {
    primary = `[PRIMARY PERCEPTUAL FRAME — narrative-driven mode]\n${
      chorusBlock || "(Chorus channel is quiet — keep a single narrative thread; avoid sub-thread parliament.)"
    }`;
  } else if (!resolve?.fallbackNeutral && frame === "ghost") {
    primary = `[PRIMARY PERCEPTUAL FRAME — relational awareness mode]\n${
      ghostSemantic || "(Ghost ecology slice sparse — hold relational awareness lightly.)"
    }`;
  } else if (!resolve?.fallbackNeutral && frame === "agent") {
    primary = `[PRIMARY PERCEPTUAL FRAME — task-focused mode]\n${
      reactiveBlock || "(Reactive hints sparse — prioritize the user's stated task.)"
    }`;
  }

  const orderedBodies = [];
  const pushSecondary = (label, body) => {
    const b = String(body || "").trim();
    if (!b) return;
    orderedBodies.push(`${label}\n${b}`);
  };

  if (!resolve?.fallbackNeutral) {
    if (frame === "chorus") {
      pushSecondary("[Reactive Agent Bias — secondary]", reactiveBlock);
      pushSecondary("[Ghost Ecology Interpretation — secondary]", ghostSemantic);
    } else if (frame === "ghost") {
      pushSecondary("[Reactive Agent Bias — secondary]", reactiveBlock);
      pushSecondary("[Cognitive Chorus Framing — secondary]", chorusBlock);
    } else if (frame === "agent") {
      pushSecondary("[Cognitive Chorus Framing — secondary]", chorusBlock);
      pushSecondary("[Ghost Ecology Interpretation — secondary]", ghostSemantic);
    } else {
      pushSecondary("[Cognitive Chorus Framing — secondary]", chorusBlock);
      pushSecondary("[Reactive Agent Bias — secondary]", reactiveBlock);
      pushSecondary("[Ghost Ecology Interpretation — secondary]", ghostSemantic);
    }
  } else {
    pushSecondary("[Cognitive Chorus Framing — secondary]", chorusBlock);
    pushSecondary("[Reactive Agent Bias — secondary]", reactiveBlock);
    pushSecondary("[Ghost Ecology Interpretation — secondary]", ghostSemantic);
  }

  pushSecondary("[Structured Lens — debug / verification only]", structuredDebug);

  const orderedPromptBlock = [primary, ...orderedBodies].filter(Boolean).join("\n\n");

  return {
    orderedPromptBlock,
    primaryFrameHeader: frame,
    sectionsEmitted: orderedBodies.length + 1
  };
}

/**
 * Full arbitration pipeline for L10 / continuity.
 * @param {Record<string, unknown>} input
 * @param {{ governorBuffer?: Record<string, unknown> | null, governorDisabled?: boolean }} [options]
 */
export function arbitratePerceptionV1(input, options = {}) {
  const inp = input && typeof input === "object" ? input : {};
  const opts = options && typeof options === "object" ? options : {};
  const gp = inp.ghostPerceptionV1 && typeof inp.ghostPerceptionV1 === "object" ? inp.ghostPerceptionV1 : null;
  if (!gp) return null;

  const governorBuffer = normalizeArbitrationGovernorBuffer(opts.governorBuffer ?? null);
  const governorDisabled = !!opts.governorDisabled;

  const rawDominance = computeFrameDominance(inp);
  let dominance = rawDominance;
  let governorV1 = null;

  if (!governorDisabled) {
    governorV1 = runArbitrationStabilityGovernorV1({
      buffer: governorBuffer,
      rawDominance
    });
    dominance = {
      ghost: governorV1.adjustedDominance.ghost,
      chorus: governorV1.adjustedDominance.chorus,
      agent: governorV1.adjustedDominance.agent,
      conflictScore: governorV1.adjustedDominance.conflictScore,
      raw: governorV1.adjustedDominance.raw
    };
  }

  let resolved = resolvePerceptualFrame(inp, dominance);
  if (!governorDisabled && governorV1) {
    resolved = enforceFramePersistenceSoftLimit(resolved, governorBuffer, dominance);
  }
  const chorusBlock = chorusFullBlock(inp.chorus);
  const reactiveBlock = reactiveExpandedBlock(inp.reactiveLayer);
  const ghostSemantic = String(gp.semanticPromptBlock || "").trim() || String(gp.promptBlock || "").trim();
  let structuredDebug = String(gp.structuredDebugBlock || "").trim();
  if (!structuredDebug && gp.structuredLens && typeof gp.structuredLens === "object") {
    structuredDebug = [
      "Ghost ecology lens (machine verification — secondary; do not invert causality from these scalars):",
      JSON.stringify(gp.structuredLens)
    ].join("\n");
  }

  const sections = sectionsForChannels(chorusBlock, reactiveBlock, ghostSemantic, structuredDebug);
  const stack = reorderPromptStack(resolved, sections);

  const nextBuffer = pushArbitrationMemoryEntry(governorBuffer, {
    dominantFrame: resolved.dominantFrame,
    ghost: dominance.ghost,
    chorus: dominance.chorus,
    agent: dominance.agent,
    conflictScore: dominance.conflictScore
  });

  const governorOut =
    !governorDisabled && governorV1
      ? {
          ...governorV1,
          nextBuffer,
          rawDominanceScores: {
            ghost: rawDominance.ghost,
            chorus: rawDominance.chorus,
            agent: rawDominance.agent,
            conflictScore: rawDominance.conflictScore
          }
        }
      : { disabled: true, nextBuffer };

  return {
    contract: PERCEPTION_ARBITRATION_V1,
    ecologyWriteBack: false,
    dominantFrame: resolved.dominantFrame,
    fallbackNeutral: resolved.fallbackNeutral,
    rationale: resolved.rationale,
    dominanceScores: { ghost: dominance.ghost, chorus: dominance.chorus, agent: dominance.agent },
    conflictScore: dominance.conflictScore,
    orderedPromptBlock: stack.orderedPromptBlock,
    promptMeta: {
      primaryFrameHeader: stack.primaryFrameHeader,
      sectionsEmitted: stack.sectionsEmitted
    },
    governorV1: governorOut,
    source: "perception_arbitration_layer_v1"
  };
}
