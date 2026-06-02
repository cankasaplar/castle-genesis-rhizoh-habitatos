/**
 * COMMAND gate — hard registry / short grammar only; confidence ≥ threshold → silent execute.
 * Fuzzy hybrid / semantic_match never silent-local (LLM or HYBRID fallback).
 */

import { resolveLocalActionAuthorityV0 } from "./rhizohLocalActionAuthorityV0.js";
import {
  classifyVoiceIntentV0,
  normalizeVoiceCommandSpaceV0,
  VOICE_INTENT_TYPE_V0,
  VOICE_ROUTE_EXECUTION_V0
} from "./rhizohVoiceCommandRouterV0.js";
import { readLocalCommandRowV0 } from "./rhizohLocalCommandRegistryV0.js";
import { pickHighestPriorityVoiceRouteV0, scoreVoiceRouteCandidatesV0 } from "./rhizohVoiceCommandPriorityV0.js";

export const RHIZOH_COMMAND_GATE_SCHEMA_V0 = "castle.rhizoh.command_gate.v0";

/** Below this → never silent LOCAL; route to LLM (or HYBRID). */
export const COMMAND_EXECUTE_CONFIDENCE_MIN_V0 = 0.82;

export const COMMAND_MATCH_KIND_V0 = Object.freeze({
  REGISTRY_HARD: "registry_hard",
  GRAMMAR_HARD: "grammar_hard",
  MICRO_FAST: "micro_fast",
  FUZZY: "fuzzy",
  NONE: "none"
});

const MICRO_FAST_CONFIDENCE_V0 = 0.94;

const REGISTRY_HARD_CONFIDENCE_V0 = 0.97;
const GRAMMAR_HARD_CONFIDENCE_V0 = 0.88;
const GRAMMAR_MAX_WORDS_V0 = 4;

/**
 * @param {string} input
 * @param {{ sttInferred?: string }} [ctx]
 */
export function resolveCommandGateV0(input, ctx = {}) {
  const raw = String(input || "").trim();
  const space = normalizeVoiceCommandSpaceV0(raw);
  const intent = classifyVoiceIntentV0(raw, ctx);
  const words = space.normalized.split(/\s+/).filter(Boolean).length;

  if (space.matched && space.canonical) {
    const conf = REGISTRY_HARD_CONFIDENCE_V0;
    return Object.freeze({
      schema: RHIZOH_COMMAND_GATE_SCHEMA_V0,
      matchKind: COMMAND_MATCH_KIND_V0.REGISTRY_HARD,
      commandConfidence: conf,
      silentExecute: conf >= COMMAND_EXECUTE_CONFIDENCE_MIN_V0,
      intent,
      canonical: space.canonical,
      normalized: space.normalized,
      registryRow: readLocalCommandRowV0(space.canonical)
    });
  }

  const grammar = resolveLocalActionAuthorityV0(raw);
  if (grammar.authority === "local" && words > 0 && words <= GRAMMAR_MAX_WORDS_V0) {
    const conf = GRAMMAR_HARD_CONFIDENCE_V0;
    return Object.freeze({
      schema: RHIZOH_COMMAND_GATE_SCHEMA_V0,
      matchKind: COMMAND_MATCH_KIND_V0.GRAMMAR_HARD,
      commandConfidence: conf,
      silentExecute: conf >= COMMAND_EXECUTE_CONFIDENCE_MIN_V0,
      intent,
      canonical: grammar.kind,
      normalized: space.normalized,
      grammarLocal: grammar
    });
  }

  if (intent.type === VOICE_INTENT_TYPE_V0.MICRO && intent.microIntent) {
    return Object.freeze({
      schema: RHIZOH_COMMAND_GATE_SCHEMA_V0,
      matchKind: COMMAND_MATCH_KIND_V0.MICRO_FAST,
      commandConfidence: MICRO_FAST_CONFIDENCE_V0,
      silentExecute: true,
      intent,
      canonical: null,
      normalized: space.normalized,
      microIntent: intent.microIntent
    });
  }

  if (intent.type === VOICE_INTENT_TYPE_V0.HYBRID) {
    return Object.freeze({
      schema: RHIZOH_COMMAND_GATE_SCHEMA_V0,
      matchKind: COMMAND_MATCH_KIND_V0.FUZZY,
      commandConfidence: Number(intent.confidence) || 0,
      silentExecute: false,
      intent,
      canonical: intent.commandCandidate,
      normalized: space.normalized
    });
  }

  return Object.freeze({
    schema: RHIZOH_COMMAND_GATE_SCHEMA_V0,
    matchKind: COMMAND_MATCH_KIND_V0.NONE,
    commandConfidence: Number(intent.confidence) || 0,
    silentExecute: false,
    intent,
    canonical: null,
    normalized: space.normalized
  });
}

/**
 * Maps gate → voice route execution (LOCAL only on hard silentExecute).
 * @param {string} input
 * @param {{ sttInferred?: string }} [ctx]
 */
export function routeVoiceInputWithCommandGateV0(input, ctx = {}) {
  const gate = resolveCommandGateV0(input, ctx);
  const priorityWinner = pickHighestPriorityVoiceRouteV0(input);
  const priorityRanked = scoreVoiceRouteCandidatesV0(input);

  if (gate.silentExecute && gate.matchKind === COMMAND_MATCH_KIND_V0.REGISTRY_HARD && gate.canonical) {
    return Object.freeze({
      schema: "castle.rhizoh.voice_command_router.v0",
      execution: VOICE_ROUTE_EXECUTION_V0.LOCAL,
      intent: gate.intent,
      canonical: gate.canonical,
      normalized: gate.normalized,
      registryRow: gate.registryRow,
      commandGate: gate,
      priorityScore: priorityWinner?.score,
      priorityRanked
    });
  }

  if (gate.silentExecute && gate.matchKind === COMMAND_MATCH_KIND_V0.GRAMMAR_HARD && gate.grammarLocal) {
    return Object.freeze({
      schema: "castle.rhizoh.voice_command_router.v0",
      execution: VOICE_ROUTE_EXECUTION_V0.LOCAL,
      intent: gate.intent,
      canonical: gate.canonical,
      normalized: gate.normalized,
      grammarLocal: gate.grammarLocal,
      commandGate: gate,
      priorityScore: priorityWinner?.score,
      priorityRanked
    });
  }

  if (gate.silentExecute && gate.matchKind === COMMAND_MATCH_KIND_V0.MICRO_FAST && gate.microIntent) {
    return Object.freeze({
      schema: "castle.rhizoh.voice_command_router.v0",
      execution: VOICE_ROUTE_EXECUTION_V0.FAST_LOCAL,
      intent: gate.intent,
      microIntent: gate.microIntent,
      canonical: null,
      normalized: gate.normalized,
      commandGate: gate,
      priorityRanked
    });
  }

  if (gate.intent.type === VOICE_INTENT_TYPE_V0.HYBRID) {
    return Object.freeze({
      schema: "castle.rhizoh.voice_command_router.v0",
      execution: VOICE_ROUTE_EXECUTION_V0.HYBRID_LOCAL_FIRST,
      hybridPhases: Object.freeze(["local_snapshot", "llm_confirm"]),
      intent: gate.intent,
      canonical: null,
      normalized: gate.normalized,
      commandGate: gate,
      priorityRanked
    });
  }

  return Object.freeze({
    schema: "castle.rhizoh.voice_command_router.v0",
    execution: VOICE_ROUTE_EXECUTION_V0.LLM,
    intent: gate.intent,
    canonical: null,
    normalized: gate.normalized,
    commandGate: gate,
    priorityRanked
  });
}

/**
 * @param {ReturnType<typeof routeVoiceInputWithCommandGateV0>} route
 */
export function isHardSilentCommandRouteV0(route) {
  const gate = route?.commandGate;
  return Boolean(gate?.silentExecute && route?.execution === VOICE_ROUTE_EXECUTION_V0.LOCAL);
}
