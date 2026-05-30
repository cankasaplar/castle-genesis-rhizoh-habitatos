/**
 * Fast conversation router — default short path; ~60–70% skips full CLAG pipeline.
 * Rule-based, no LLM.
 */

import { MF0_INTENT_V0 } from "./rhizohMeaningFrameV0.js";
import { getLastContinuityFrameV0 } from "./rhizohContinuityCacheV0.js";
import { RHIZOH_CONVERSATION_MODE_V0 } from "./rhizohConversationDepthV0.js";

export const FAST_ROUTE_V0 = Object.freeze({
  FAST_GREET: "fast_greet",
  FAST_SIMPLE: "fast_simple",
  CONTINUATION: "continuation",
  EXPRESSION_ONLY: "expression_only",
  FULL_PIPELINE: "full_pipeline"
});

export const RHIZOH_FAST_ROUTER_SCHEMA_V0 = "castle.rhizoh.fast_conversation_router.v0";

const GREET_RE_V0 =
  /^(selam|merhaba|hey|hi|hello|hola|buenos|günaydın|iyi akşam|naber|ne var|こんにちは|こんばんは)\b/ui;

const SIMPLE_ASK_RE_V0 =
  /^(nedir|ne demek|what is|qué es|とは|kaç|how much|who is|kim(dir)?)\b/ui;

/**
 * @param {{
 *   text?: string,
 *   meaningFrame?: ReturnType<import("./rhizohMeaningFrameV0.js").extractMeaningFrameV0>,
 *   conversationMode?: string,
 *   depthLevel?: number,
 *   userTurnCount?: number,
 *   voiceTurn?: boolean
 * }} input
 */
export function routeFastConversationV0(input = {}) {
  const text = String(input.text || "").trim();
  const mf = input.meaningFrame;
  const mode = String(input.conversationMode || "").toLowerCase();
  const depth = Math.max(1, Math.min(5, Math.floor(Number(input.depthLevel ?? mf?.depth) || 2)));
  const last = getLastContinuityFrameV0();

  let route = FAST_ROUTE_V0.EXPRESSION_ONLY;
  let reason = "default_expression_path";
  let targetFirstAudioMs = 480;
  let useClag = false;
  let useLlm = true;

  if (!text) {
    return freezeRoute(FAST_ROUTE_V0.FAST_SIMPLE, "empty_input", 320, false, false);
  }

  if (GREET_RE_V0.test(text) && text.length < 48) {
    return freezeRoute(FAST_ROUTE_V0.FAST_GREET, "greet_pattern", 280, false, true);
  }

  if (
    text.length < 56 &&
    (SIMPLE_ASK_RE_V0.test(text) || (mf?.intent === MF0_INTENT_V0.ASK && !/\b(çünkü|because|porque)\b/ui.test(text)))
  ) {
    return freezeRoute(FAST_ROUTE_V0.FAST_SIMPLE, "simple_ask", 360, false, true);
  }

  if (
    last &&
    mf?.continuityHook &&
    last.intent === mf.intent &&
    text.length < 200 &&
    depth <= 3
  ) {
    return freezeRoute(FAST_ROUTE_V0.CONTINUATION, "continuity_frame_reuse", 400, false, true);
  }

  const heavyMode =
    mode === RHIZOH_CONVERSATION_MODE_V0.DEBATE ||
    mode === RHIZOH_CONVERSATION_MODE_V0.NARRATIVE ||
    mode === RHIZOH_CONVERSATION_MODE_V0.DISCOURSE ||
    mode === RHIZOH_CONVERSATION_MODE_V0.SYNTHESIS;

  if (
    heavyMode ||
    depth >= 4 ||
    mf?.intent === MF0_INTENT_V0.CHALLENGE ||
    text.length > 280 ||
    (mf?.unresolvedThreads?.length || 0) >= 3
  ) {
    return freezeRoute(FAST_ROUTE_V0.FULL_PIPELINE, "depth_or_discourse", 620, true, true);
  }

  if (text.length < 120 && depth <= 2 && mf?.intent !== MF0_INTENT_V0.NARRATE) {
    route = FAST_ROUTE_V0.EXPRESSION_ONLY;
    reason = "light_turn_expression_only";
    targetFirstAudioMs = 420;
  } else if (mf?.intent === MF0_INTENT_V0.NARRATE || text.length > 140) {
    route = FAST_ROUTE_V0.EXPRESSION_ONLY;
    reason = "narrative_expression_without_clag";
    targetFirstAudioMs = 500;
  }

  return freezeRoute(route, reason, targetFirstAudioMs, useClag, useLlm);
}

/**
 * @param {string} route
 * @param {string} reason
 * @param {number} targetFirstAudioMs
 * @param {boolean} useClag
 * @param {boolean} useLlm
 */
function freezeRoute(route, reason, targetFirstAudioMs, useClag, useLlm) {
  const fastPath =
    route === FAST_ROUTE_V0.FAST_GREET ||
    route === FAST_ROUTE_V0.FAST_SIMPLE ||
    route === FAST_ROUTE_V0.CONTINUATION ||
    route === FAST_ROUTE_V0.EXPRESSION_ONLY;

  return Object.freeze({
    schema: RHIZOH_FAST_ROUTER_SCHEMA_V0,
    route,
    reason,
    fastPath,
    useClag,
    useLlm,
    targetFirstAudioMs,
    skipFullPipeline: !useClag
  });
}
