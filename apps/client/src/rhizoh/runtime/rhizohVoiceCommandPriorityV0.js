/**
 * Command route priority — reduces grammar/registry overlap false positives.
 */

import {
  normalizeVoiceCommandSpaceV0,
  normalizeVoiceCommandTokenV0
} from "./rhizohVoiceCommandRouterV0.js";
import { readLocalCommandRowV0 } from "./rhizohLocalCommandRegistryV0.js";
import { resolveLocalActionAuthorityV0 } from "./rhizohLocalActionAuthorityV0.js";

export const COMMAND_PRIORITY_SCORE_V0 = Object.freeze({
  lexical_match: 1.0,
  normalized_match: 0.8,
  semantic_match: 0.5
});

/**
 * @param {string} input
 * @returns {ReadonlyArray<{ kind: string, score: number, canonical: string | null, grammarLocal?: object }>}
 */
export function scoreVoiceRouteCandidatesV0(input) {
  const raw = String(input || "").trim();
  const space = normalizeVoiceCommandSpaceV0(raw);
  /** @type {Array<{ kind: string, score: number, canonical: string | null, grammarLocal?: object }>} */
  const candidates = [];

  if (space.canonical) {
    const exact = normalizeVoiceCommandTokenV0(raw) === space.normalized;
    candidates.push({
      kind: "registry",
      score: exact ? COMMAND_PRIORITY_SCORE_V0.lexical_match : COMMAND_PRIORITY_SCORE_V0.normalized_match,
      canonical: space.canonical,
      registryRow: readLocalCommandRowV0(space.canonical)
    });
  }

  const grammar = resolveLocalActionAuthorityV0(raw);
  if (grammar.authority === "local") {
    candidates.push({
      kind: "grammar",
      score: COMMAND_PRIORITY_SCORE_V0.semantic_match,
      canonical: grammar.kind,
      grammarLocal: grammar
    });
  }

  return Object.freeze(candidates.sort((a, b) => b.score - a.score));
}

/**
 * @param {string} input
 */
export function pickHighestPriorityVoiceRouteV0(input) {
  const ranked = scoreVoiceRouteCandidatesV0(input);
  return ranked[0] || null;
}
