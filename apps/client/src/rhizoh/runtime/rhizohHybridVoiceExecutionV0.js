/**
 * Hybrid execution — local snapshot first; LLM explanation only (no re-execution).
 */

import { resolveOutputLanguageCodeV0 } from "./rhizohOutputLanguagePolicyV0.js";
import { commitFinalUserVisibleLanguageV0 } from "./rhizohFinalLanguageCommitV0.js";

export const RHIZOH_HYBRID_EXECUTION_SCHEMA_V0 = "rhizoh.hybrid_voice_execution.v0";

const HYBRID_LOCAL_REPLY_V0 = Object.freeze({
  state_query: Object.freeze({
    en: "Here is your current session snapshot.",
    tr: "İşte güncel oturum özetin."
  }),
  session_summary: Object.freeze({
    en: "Session snapshot captured locally.",
    tr: "Oturum özeti yerelde alındı."
  }),
  last_messages: Object.freeze({
    en: "Showing recent messages from local buffer.",
    tr: "Son mesajlar yerel tampondan."
  }),
  prior_utterance: Object.freeze({
    en: "Checking your prior utterance locally.",
    tr: "Önceki sözün yerelde kontrol ediliyor."
  }),
  short_query: Object.freeze({
    en: "Local context ready.",
    tr: "Yerel bağlam hazır."
  }),
  _default: Object.freeze({ en: "Local snapshot ready.", tr: "Yerel anlık görüntü hazır." })
});

/**
 * @param {ReturnType<import("./rhizohVoiceCommandRouterV0.js").routeVoiceInputV0>} route
 */
export function buildHybridLocalSnapshotV0(route) {
  const hybridId = String(route.intent?.commandCandidate || "short_query");
  const loc = resolveOutputLanguageCodeV0();
  const table = HYBRID_LOCAL_REPLY_V0[hybridId] || HYBRID_LOCAL_REPLY_V0._default;
  const localReply = table[loc] || table.en;

  const snapshot = Object.freeze({
    schema: RHIZOH_HYBRID_EXECUTION_SCHEMA_V0,
    hybridId,
    atMs: Date.now(),
    languageRuntime: typeof window !== "undefined" ? window.__CASTLE_LANGUAGE_RUNTIME__ || null : null,
    commandMemory: typeof window !== "undefined" ? window.__CASTLE_COMMAND_MEMORY__ || null : null,
    violations: typeof window !== "undefined" ? window.__RHIZOH_LANGUAGE_VIOLATIONS__ || [] : [],
    voiceTimeline:
      typeof window !== "undefined" ? window.__rhizoh?.voiceShadowTimeline || null : null
  });

  return Object.freeze({ snapshot, localReply, hybridId });
}

/**
 * @param {ReturnType<import("./rhizohVoiceCommandRouterV0.js").routeVoiceInputV0>} route
 * @param {string} userMessage
 * @param {string} traceId
 */
export function executeHybridLocalFirstV0(route, userMessage, traceId) {
  const built = buildHybridLocalSnapshotV0(route);
  const idempotencyKey = `hybrid-local:${traceId}`;
  const committed = commitFinalUserVisibleLanguageV0(built.localReply, {
    source: "ui_helpers",
    idempotencyKey,
    lockKey: "language_commit_lock",
    traceId
  });

  return Object.freeze({
    schema: RHIZOH_HYBRID_EXECUTION_SCHEMA_V0,
    phase: "hybrid_local_first",
    snapshot: built.snapshot,
    localReply: committed.text,
    hybridId: built.hybridId,
    needsLlmExplanation: true,
    llmBypassExecution: true
  });
}

/**
 * @param {object} snapshot
 * @param {string} userMessage
 */
export function buildHybridLlmConfirmDirectiveV0(snapshot, userMessage) {
  return [
    "[HYBRID_LLM_CONFIRM_V0]",
    "Local snapshot already applied. Explain or summarize only.",
    "Do NOT re-execute commands, navigation, or system actions.",
    `snapshot_keys: ${Object.keys(snapshot || {}).join(",")}`,
    `user_message: ${String(userMessage || "").slice(0, 500)}`
  ].join("\n");
}
