/**
 * Conversation dock local turn — world/space shell bypasses AppRhizoh528T0 handleExecute.
 * Registry + grammar + CASTLE_CREATE must not hit postRhizohLlmTurnV0.
 */

import {
  LOCAL_AUTHORITY_LOCAL_V0,
  emitLocalActionAuthorityV0,
  resolveLocalActionAuthorityV0
} from "./rhizohLocalActionAuthorityV0.js";
import {
  executeLocalVoiceCommandV0,
  routeVoiceInputV0,
  VOICE_ROUTE_EXECUTION_V0
} from "./rhizohVoiceCommandRouterV0.js";
import { detectCastleIntentWithoutCoords } from "../../kernel/rhizohCommandParser.js";
import { openCastleInitGateFromLocalCommandV0 } from "./rhizohLocalCommandHandlersV0.js";
import { resolveOutputLanguageCodeV0 } from "./rhizohOutputLanguagePolicyV0.js";
import {
  tryExecuteSovereignVoiceWarpFromTextV0,
  tryOpenSovereignMapNodeFromTextV0,
  tryOpenSovereignMediaTubeFromTextV0
} from "./sovereignWorldMapNodesV0.js";
import { tryShowLiveMatchPinsFromTextV0 } from "./worldMapLiveMatchPinsV0.js";
import { tryResolveRhizohLocalKnowledgeV0 } from "./rhizohPolicyRouterV0.js";
import {
  commitFinalUserVisibleLanguageV0,
  LANGUAGE_COMMIT_LOCK_KEY_V0
} from "./rhizohFinalLanguageCommitV0.js";

function commitLocalConversationReplyV0(text, source) {
  return commitFinalUserVisibleLanguageV0(String(text || "").trim(), {
    source: String(source || "rhizoh_local"),
    hardRewrite: true,
    lockKey: LANGUAGE_COMMIT_LOCK_KEY_V0
  }).text;
}

export const RHIZOH_LOCAL_CONVERSATION_TURN_SCHEMA_V0 =
  "castle.rhizoh.local_conversation_turn.v0";

/**
 * @param {string} text
 * @param {{ traceId?: string, source?: string }} [opts]
 */
export function tryResolveLocalConversationTurnV0(text, opts = {}) {
  const raw = String(text || "").trim();
  if (!raw) return null;

  const localeTr = resolveOutputLanguageCodeV0() === "tr";
  const mediaOpen = tryOpenSovereignMediaTubeFromTextV0(raw, {
    source: opts.source || "conversation_dock",
    tr: localeTr
  });
  if (mediaOpen) {
    return Object.freeze({
      schema: RHIZOH_LOCAL_CONVERSATION_TURN_SCHEMA_V0,
      ok: true,
      reply: commitLocalConversationReplyV0(mediaOpen.reply, "sovereign_media_open"),
      source: "sovereign_media_open",
      llmBypass: true,
      kind: mediaOpen.kind
    });
  }

  const route = routeVoiceInputV0(raw);
  if (route.execution === VOICE_ROUTE_EXECUTION_V0.LOCAL) {
    const local = executeLocalVoiceCommandV0(route, { traceId: opts.traceId });
    return Object.freeze({
      schema: RHIZOH_LOCAL_CONVERSATION_TURN_SCHEMA_V0,
      ok: true,
      reply: commitLocalConversationReplyV0(local.reply, "local_command"),
      source: "local_command",
      llmBypass: true,
      kind: local.kind || route.canonical || route.grammarLocal?.kind,
      route
    });
  }

  const mapNodeOpen = tryOpenSovereignMapNodeFromTextV0(raw, {
    source: opts.source || "conversation_dock",
    tr: localeTr
  });
  if (mapNodeOpen) {
    return Object.freeze({
      schema: RHIZOH_LOCAL_CONVERSATION_TURN_SCHEMA_V0,
      ok: true,
      reply: commitLocalConversationReplyV0(mapNodeOpen.reply, "sovereign_map_node_open"),
      source: "sovereign_map_node_open",
      llmBypass: true,
      kind: mapNodeOpen.kind,
      nodeId: mapNodeOpen.nodeId
    });
  }

  const livePins = tryShowLiveMatchPinsFromTextV0(raw, { locale: localeTr ? "tr" : "en" });
  if (livePins) {
    return Object.freeze({
      schema: RHIZOH_LOCAL_CONVERSATION_TURN_SCHEMA_V0,
      ok: true,
      reply: commitLocalConversationReplyV0(livePins.reply, "live_match_pins"),
      source: "live_match_pins",
      llmBypass: true,
      kind: livePins.kind
    });
  }

  const voiceWarp = tryExecuteSovereignVoiceWarpFromTextV0(raw, {
    source: opts.source || "conversation_dock",
    tr: localeTr
  });
  if (voiceWarp) {
    return Object.freeze({
      schema: RHIZOH_LOCAL_CONVERSATION_TURN_SCHEMA_V0,
      ok: true,
      reply: commitLocalConversationReplyV0(voiceWarp.reply, "sovereign_voice_warp"),
      source: "sovereign_voice_warp",
      llmBypass: true,
      kind: voiceWarp.kind,
      warp: voiceWarp.target
    });
  }

  const localAction = resolveLocalActionAuthorityV0(raw);
  if (localAction.authority === LOCAL_AUTHORITY_LOCAL_V0) {
    if (localAction.kind === "CASTLE_CREATE" || detectCastleIntentWithoutCoords(raw)) {
      openCastleInitGateFromLocalCommandV0(opts.source || "conversation_dock");
    }
    emitLocalActionAuthorityV0(localAction);
    return Object.freeze({
      schema: RHIZOH_LOCAL_CONVERSATION_TURN_SCHEMA_V0,
      ok: true,
      reply: commitLocalConversationReplyV0(localAction.user_reply_tr, "local_action"),
      source: "local_action",
      llmBypass: true,
      kind: localAction.kind,
      localAction
    });
  }

  const rhizohLocal = tryResolveRhizohLocalKnowledgeV0(raw, { traceId: opts.traceId });
  if (rhizohLocal?.reply) {
    return Object.freeze({
      schema: RHIZOH_LOCAL_CONVERSATION_TURN_SCHEMA_V0,
      ok: true,
      reply: commitLocalConversationReplyV0(rhizohLocal.reply, rhizohLocal.source),
      source: rhizohLocal.source,
      llmBypass: true,
      askRhizoh: true,
      knowledgeId: rhizohLocal.knowledgeId,
      matchScore: rhizohLocal.matchScore
    });
  }

  return null;
}
