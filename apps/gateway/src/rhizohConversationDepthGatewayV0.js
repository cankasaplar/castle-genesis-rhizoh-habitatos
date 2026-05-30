/**
 * Gateway — depth-first conversation control (primary) with token ceiling (secondary).
 */

export const RHIZOH_GATEWAY_CONVERSATION_MODES_V0 = Object.freeze({
  greet: { depthLevel: 1, responseLength: "short", maxTokensCeiling: 200 },
  explore: { depthLevel: 2, responseLength: "medium", maxTokensCeiling: 480 },
  debate: { depthLevel: 4, responseLength: "long", maxTokensCeiling: 1200 },
  narrative: { depthLevel: 4, responseLength: "long", maxTokensCeiling: 1500 },
  synthesis: { depthLevel: 5, responseLength: "dynamic", maxTokensCeiling: 2000 },
  discourse: { depthLevel: 5, responseLength: "dynamic", maxTokensCeiling: 2600 }
});

const MODE_DIRECTIVES_V0 = Object.freeze({
  greet:
    "Mode GREET: reciprocal warmth; low density; no lecture.",
  explore:
    "Mode EXPLORE: questions and open threads; co-discovery.",
  debate:
    "Mode DEBATE: argument and counter-argument; steelman; uncertainty markers.",
  narrative:
    "Mode NARRATIVE: scene continuity; story-forward.",
  synthesis:
    "Mode SYNTHESIS: integrate threads; closure paths optional.",
  discourse:
    "Mode DISCOURSE: long-horizon callbacks; topic map when useful."
});

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function clampDepth(n) {
  const x = Math.floor(Number(n));
  if (!Number.isFinite(x)) return 2;
  return Math.max(1, Math.min(5, x));
}

/**
 * @param {Record<string, unknown>} opts
 * @param {Record<string, unknown>} [context]
 */
export function resolveRhizohConversationDepthGatewayV0(opts = {}, context = {}) {
  const modeRaw = String(opts.conversationMode || opts.conversation_mode || "")
    .trim()
    .toLowerCase();
  const modeDef =
    modeRaw && Object.prototype.hasOwnProperty.call(RHIZOH_GATEWAY_CONVERSATION_MODES_V0, modeRaw)
      ? RHIZOH_GATEWAY_CONVERSATION_MODES_V0[modeRaw]
      : RHIZOH_GATEWAY_CONVERSATION_MODES_V0.explore;

  const depthLevel =
    opts.depthLevel != null || opts.depth_level != null
      ? clampDepth(opts.depthLevel ?? opts.depth_level)
      : modeDef.depthLevel;

  const continuityStrength = clamp01(
    opts.continuityStrength ?? opts.continuity_strength ?? 0.55
  );

  const intent = String(opts.conversationIntent || opts.conversation_intent || "extend")
    .trim()
    .toLowerCase();

  const needsRecall =
    opts.needsRecall === true ||
    opts.needs_recall === true ||
    continuityStrength >= 0.62 ||
    depthLevel >= 4;

  const phraseChunking =
    opts.phraseChunking === true ||
    opts.phrase_chunking === true ||
    depthLevel >= 3;

  const orch =
    context?.rhizohProductOrchestration && typeof context.rhizohProductOrchestration === "object"
      ? context.rhizohProductOrchestration
      : null;
  const storySnap =
    context?.rhizohStoryContinuitySnapshot && typeof context.rhizohStoryContinuitySnapshot === "object"
      ? context.rhizohStoryContinuitySnapshot
      : null;

  const storyLines = [];
  if (storySnap?.who) storyLines.push(`who: ${String(storySnap.who).slice(0, 64)}`);
  if (storySnap?.where) storyLines.push(`where: ${String(storySnap.where).slice(0, 96)}`);
  if (storySnap?.whatHappenedLast || storySnap?.lastScene) {
    storyLines.push(
      `what_happened_last: ${String(storySnap.whatHappenedLast || storySnap.lastScene).slice(0, 280)}`
    );
  }
  if (Array.isArray(storySnap?.unresolvedThreads) && storySnap.unresolvedThreads.length) {
    storyLines.push(
      `openThreads: ${storySnap.unresolvedThreads.slice(0, 4).map((t) => String(t).slice(0, 80)).join(" | ")}`
    );
  }
  if (storySnap?.storyContinuityGuarantee) storyLines.push("story_continuity_guarantee: true");
  if (orch?.conversationPhase) storyLines.push(`phase: ${orch.conversationPhase}`);

  const depthDirective = [
    "## Rhizoh conversation depth (primary)",
    MODE_DIRECTIVES_V0[modeRaw] || MODE_DIRECTIVES_V0.explore,
    `INTENT: ${intent}.`,
    `depthLevel: ${depthLevel}/5.`,
    `continuityStrength: ${continuityStrength}.`,
    `responseLength (secondary): ${modeDef.responseLength}.`,
    needsRecall ? "Recall authoritative continuity when relevant." : "Stay in-the-moment.",
    phraseChunking
      ? "Use 2-4 phrase chunks (blank-line separated) for natural voice rhythm."
      : "",
    storyLines.length ? `Story snapshot: ${storyLines.join("; ")}` : ""
  ]
    .filter(Boolean)
    .join("\n");

  let maxTokensCeiling = modeDef.maxTokensCeiling;
  if (depthLevel >= 5) maxTokensCeiling = Math.max(maxTokensCeiling, 2200);
  if (depthLevel <= 1) maxTokensCeiling = Math.min(maxTokensCeiling, 220);

  return {
    conversationMode: modeRaw || "explore",
    conversationIntent: intent,
    depthLevel,
    continuityStrength,
    responseLength: modeDef.responseLength,
    maxTokensCeiling,
    needsRecall,
    phraseChunking,
    depthDirective
  };
}

/**
 * Merge depth profile into generation resolution (depth wins directive; tokens = ceiling).
 * @param {Record<string, unknown>} payload
 * @param {{ maxTokens: number, temperature: number, modeDirective: string, generationModeLabel: string | null }} baseGen
 */
export function applyConversationDepthToGenerationV0(payload, baseGen) {
  const opts = payload?.options && typeof payload.options === "object" ? payload.options : {};
  const context = payload?.context && typeof payload.context === "object" ? payload.context : {};
  const hasDepthAxis =
    opts.conversationMode != null ||
    opts.conversation_mode != null ||
    opts.depthLevel != null ||
    opts.depth_level != null ||
    opts.continuityStrength != null ||
    opts.continuity_strength != null;

  if (!hasDepthAxis) {
    return { ...baseGen, conversationDepth: null };
  }

  const depth = resolveRhizohConversationDepthGatewayV0(opts, context);
  const explicitMax = opts.maxTokens != null ? Number(opts.maxTokens) : NaN;
  const maxTokens = Number.isFinite(explicitMax) && explicitMax > 0
    ? Math.min(Math.floor(explicitMax), depth.maxTokensCeiling)
    : depth.maxTokensCeiling;

  const modeDirective = [depth.depthDirective, baseGen.modeDirective].filter(Boolean).join("\n\n");

  return {
    maxTokens,
    temperature: baseGen.temperature,
    modeDirective,
    generationModeLabel: baseGen.generationModeLabel,
    conversationDepth: depth
  };
}
