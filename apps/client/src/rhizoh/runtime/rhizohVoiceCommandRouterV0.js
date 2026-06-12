/**
 * Voice command vs natural language — COMMAND ≠ LANGUAGE.
 * RULESET: LOCAL_REGISTRY → execute local | HYBRID → split | else → LLM (OLP).
 */

import { resolveLocalActionAuthorityV0, emitLocalActionAuthorityV0 } from "./rhizohLocalActionAuthorityV0.js";
import { openCastleInitGateFromLocalCommandV0 } from "./rhizohLocalCommandHandlersV0.js";
import { commitFinalUserVisibleLanguageV0 } from "./rhizohFinalLanguageCommitV0.js";
import { resolveOutputLanguageCodeV0 } from "./rhizohOutputLanguagePolicyV0.js";
import {
  assertCommandNeverUsesLlmV0,
  validateLocalCommandPostSttV0,
  publishCastleCommandInvariantV0
} from "./castleCommandInvariantV0.js";
import {
  buildLocalCommandAliasIndexV0,
  readLocalCommandRowV0,
  RHIZOH_HYBRID_COMMAND_PATTERNS_V0,
  RHIZOH_LOCAL_COMMAND_REGISTRY_V0
} from "./rhizohLocalCommandRegistryV0.js";
import { dispatchLocalCommandHandlerV0 } from "./rhizohLocalCommandHandlersV0.js";
import { prewarmCommandRoutingV0 } from "./rhizohCommandRoutePreheatV0.js";
import { routeVoiceInputWithCommandGateV0 } from "./rhizohCommandGateV0.js";
import { normalizeRhizohSttBrandPhoneticsV0 } from "./rhizohSttBrandNormalizeV0.js";
import { classifyMicroIntentFromTextV0 } from "./rhizohMicroIntentRouterV0.js";

export const RHIZOH_VOICE_COMMAND_ROUTER_CONTRACT_V0 = "rhizoh.voice_command_router.v0";
export { RHIZOH_VOICE_COMMAND_EVENT_V0 } from "./rhizohLocalCommandHandlersV0.js";

export const VOICE_INTENT_TYPE_V0 = Object.freeze({
  COMMAND: "command",
  MICRO: "micro",
  HYBRID: "hybrid",
  LLM: "llm"
});

export const VOICE_ROUTE_EXECUTION_V0 = Object.freeze({
  LOCAL: "local",
  /** Template / micro-dialogue — no LLM, no heavy context. */
  FAST_LOCAL: "fast_local",
  /** @deprecated use HYBRID_LOCAL_FIRST */
  HYBRID: "hybrid_local_first",
  HYBRID_LOCAL_FIRST: "hybrid_local_first",
  HYBRID_LLM_CONFIRM: "hybrid_llm_confirm",
  LLM: "llm"
});

/** @deprecated use RHIZOH_LOCAL_COMMAND_REGISTRY_V0 */
export const RHIZOH_VOICE_COMMAND_REGISTRY_V0 = RHIZOH_LOCAL_COMMAND_REGISTRY_V0;

const ALIAS_TO_CANONICAL_V0 = buildLocalCommandAliasIndexV0(normalizeVoiceCommandTokenV0);

const LOCAL_COMMAND_REPLY_V0 = Object.freeze({
  media_play: Object.freeze({ en: "Playing.", tr: "Oynatılıyor." }),
  media_pause: Object.freeze({ en: "Playback paused.", tr: "Oynatma duraklatıldı." }),
  media_resume: Object.freeze({ en: "Playback resumed.", tr: "Oynatma devam ediyor." }),
  media_stop: Object.freeze({ en: "Playback stopped.", tr: "Oynatma durdu." }),
  mute_voice: Object.freeze({ en: "Voice muted.", tr: "Ses kapalı." }),
  unmute_voice: Object.freeze({ en: "Voice unmuted.", tr: "Ses açık." }),
  stop_listening: Object.freeze({ en: "Stopped listening.", tr: "Dinlemeyi durdurdum." }),
  start_listening: Object.freeze({ en: "Listening.", tr: "Dinliyorum." }),
  map_open: Object.freeze({ en: "Opening map.", tr: "Harita açılıyor." }),
  camera_open: Object.freeze({ en: "Opening camera.", tr: "Kamera açılıyor." }),
  mode_ghost_enter: Object.freeze({ en: "Ghost mode on.", tr: "Hayalet modu açık." }),
  mode_ghost_exit: Object.freeze({ en: "Ghost mode off.", tr: "Hayalet modu kapalı." }),
  debug_language_runtime: Object.freeze({ en: "Language runtime logged.", tr: "Dil runtime loglandı." }),
  _default: Object.freeze({ en: "Done.", tr: "Tamam." })
});

/**
 * @param {string} s
 */
export function normalizeVoiceCommandTokenV0(s) {
  const brand = normalizeRhizohSttBrandPhoneticsV0(s);
  return String(brand.text || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[’']/g, "'")
    .replace(/\s+/g, " ");
}

/**
 * @param {string} input
 */
export function normalizeVoiceCommandSpaceV0(input) {
  const raw = String(input || "").trim();
  const normalized = normalizeVoiceCommandTokenV0(raw);
  const canonical = ALIAS_TO_CANONICAL_V0.get(normalized) || null;
  return Object.freeze({
    raw,
    normalized,
    canonical,
    matched: Boolean(canonical)
  });
}

/**
 * @param {string} normalized
 */
function matchHybridPatternV0(normalized) {
  const raw = String(normalized || "");
  for (const row of RHIZOH_HYBRID_COMMAND_PATTERNS_V0) {
    if (row.re.test(raw)) return row.id;
  }
  return null;
}

/**
 * @param {string} input
 * @param {{ sttInferred?: string }} [ctx]
 */
export function classifyVoiceIntentV0(input, ctx = {}) {
  const space = normalizeVoiceCommandSpaceV0(input);
  if (space.matched && space.canonical) {
    const row = readLocalCommandRowV0(space.canonical);
    return Object.freeze({
      type: VOICE_INTENT_TYPE_V0.COMMAND,
      confidence: 0.97,
      commandCandidate: space.canonical,
      semanticPayload: space.raw,
      localOnly: row?.localOnly === true,
      layer: row?.layer || null,
      sttInferred: ctx.sttInferred || null
    });
  }

  const micro = classifyMicroIntentFromTextV0(space.raw);
  if (micro) {
    return Object.freeze({
      type: VOICE_INTENT_TYPE_V0.MICRO,
      confidence: micro.confidence,
      commandCandidate: null,
      microIntent: micro.id,
      semanticPayload: space.raw,
      localOnly: true,
      sttInferred: ctx.sttInferred || null
    });
  }

  const hybridId = matchHybridPatternV0(space.normalized);
  if (hybridId) {
    return Object.freeze({
      type: VOICE_INTENT_TYPE_V0.HYBRID,
      confidence: 0.58,
      commandCandidate: hybridId,
      semanticPayload: space.raw,
      localOnly: false,
      sttInferred: ctx.sttInferred || null
    });
  }

  const words = space.normalized.split(/\s+/).filter(Boolean);
  if (words.length <= 4 && /^(what|who|where|show|state|status)/.test(space.normalized)) {
    return Object.freeze({
      type: VOICE_INTENT_TYPE_V0.HYBRID,
      confidence: 0.52,
      commandCandidate: "short_query",
      semanticPayload: space.raw,
      localOnly: false,
      sttInferred: ctx.sttInferred || null
    });
  }

  return Object.freeze({
    type: VOICE_INTENT_TYPE_V0.LLM,
    confidence: words.length > 4 ? 0.82 : 0.62,
    commandCandidate: null,
    semanticPayload: space.raw,
    localOnly: false,
    sttInferred: ctx.sttInferred || null
  });
}

/**
 * Pre-STT routing entry (same as post-STT for text transcripts).
 * @param {string} input
 * @param {{ sttInferred?: string }} [ctx]
 */
export function routeVoiceInputV0(input, ctx = {}) {
  prewarmCommandRoutingV0();
  publishCastleCommandInvariantV0();
  const route = routeVoiceInputWithCommandGateV0(input, ctx);
  if (route.execution === VOICE_ROUTE_EXECUTION_V0.LOCAL) {
    validateLocalCommandPostSttV0(route);
    assertCommandNeverUsesLlmV0("local");
  }
  return route;
}

/** Reply text only — no FINAL_COMMIT (replay simulation). */
export function peekLocalCommandReplyTextV0(canonical) {
  const loc = resolveOutputLanguageCodeV0();
  const table = LOCAL_COMMAND_REPLY_V0[canonical] || LOCAL_COMMAND_REPLY_V0._default;
  return table[loc] || table.en;
}

function formatLocalCommandReplyV0(canonical, traceId) {
  const loc = resolveOutputLanguageCodeV0();
  const table = LOCAL_COMMAND_REPLY_V0[canonical] || LOCAL_COMMAND_REPLY_V0._default;
  const raw = table[loc] || table.en;
  const idempotencyKey = traceId ? `local-cmd:${traceId}:${canonical}` : `local-cmd:${canonical}`;
  return commitFinalUserVisibleLanguageV0(raw, {
    source: "ui_helpers",
    idempotencyKey,
    lockKey: "language_commit_lock",
    traceId
  }).text;
}

/**
 * @param {ReturnType<typeof routeVoiceInputV0>} route
 */
export function executeLocalVoiceCommandV0(route, opts = {}) {
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  const traceId = opts.traceId ? String(opts.traceId) : null;

  if (route.grammarLocal) {
    if (route.grammarLocal.kind === "CASTLE_CREATE") {
      openCastleInitGateFromLocalCommandV0("voice_grammar");
    }
    emitLocalActionAuthorityV0(route.grammarLocal);
    const reply = commitFinalUserVisibleLanguageV0(
      String(route.grammarLocal.user_reply_tr || ""),
      {
        source: "ui_helpers",
        traceId,
        idempotencyKey: traceId ? `local-grammar:${traceId}` : undefined,
        lockKey: "language_commit_lock"
      }
    ).text;
    return Object.freeze({
      ok: true,
      execution: "local",
      kind: route.grammarLocal.kind,
      reply,
      latencyMs: (typeof performance !== "undefined" ? performance.now() : Date.now()) - t0,
      llmBypass: true
    });
  }

  const canonical = String(route.canonical || "");
  dispatchLocalCommandHandlerV0(canonical, { traceId });
  const reply = formatLocalCommandReplyV0(canonical, traceId);

  return Object.freeze({
    ok: true,
    execution: "local",
    kind: canonical,
    reply,
    layer: route.registryRow?.layer || null,
    latencyMs: (typeof performance !== "undefined" ? performance.now() : Date.now()) - t0,
    llmBypass: true
  });
}
