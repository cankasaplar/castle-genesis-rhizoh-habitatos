/**
 * Hybrid leakage red-team scenarios — local route integrity + language drift resistance.
 * RESEARCH-ONLY harness; no execution authority.
 */

import { routeVoiceInputV0, VOICE_ROUTE_EXECUTION_V0 } from "./rhizohVoiceCommandRouterV0.js";
import { normalizeVoiceCommandSpaceV0 } from "./rhizohVoiceCommandRouterV0.js";
import {
  alreadyCommittedLanguageV0,
  commitFinalUserVisibleLanguageV0
} from "./rhizohFinalLanguageCommitV0.js";
import { checkTextMatchesOutputLanguageV0 } from "./rhizohLanguageViolationV0.js";
import { assertCommandNeverUsesLlmV0 } from "./castleCommandInvariantV0.js";

export const HYBRID_LEAKAGE_ATTACK_SCHEMA_V0 = "castle.hybrid_leakage_attack.v0";

/**
 * @param {string} input
 */
export function attackMustRouteLocalV0(input) {
  const route = routeVoiceInputV0(input);
  const bypass = assertCommandNeverUsesLlmV0(
    route.execution === VOICE_ROUTE_EXECUTION_V0.LOCAL ? "local" : "llm"
  );
  return Object.freeze({
    id: "local_route_bypass",
    input,
    pass:
      route.execution === VOICE_ROUTE_EXECUTION_V0.LOCAL &&
      bypass.llmBypass === true &&
      Boolean(route.canonical || route.grammarLocal),
    route,
    bypass
  });
}

/**
 * LLM-style payloads that embed command verbs must still route local when exact alias.
 * @param {string} input
 */
export function attackLlmCommandInjectionV0(input) {
  const space = normalizeVoiceCommandSpaceV0(input);
  const route = routeVoiceInputV0(input);
  const pass = space.matched && route.execution === VOICE_ROUTE_EXECUTION_V0.LOCAL;
  return Object.freeze({
    id: "llm_command_injection",
    input,
    pass,
    space,
    route
  });
}

/**
 * @param {string} text
 * @param {string} traceId
 */
export function attackLanguageDriftOnCommitV0(text, traceId) {
  const check = checkTextMatchesOutputLanguageV0(text, "llm");
  const commit = commitFinalUserVisibleLanguageV0(text, {
    source: "llm",
    traceId,
    idempotencyKey: traceId
  });
  const pass =
    !check.ok && commit.guardStep === "soft_repair"
      ? true
      : check.ok || commit.repaired === true;
  return Object.freeze({
    id: "language_drift_commit",
    pass,
    check,
    commit,
    idempotent: alreadyCommittedLanguageV0(traceId)
  });
}

/**
 * @param {string} input
 */
export function attackHybridMustNotPureLlmV0(input) {
  const route = routeVoiceInputV0(input);
  const pass =
    route.execution === VOICE_ROUTE_EXECUTION_V0.HYBRID_LOCAL_FIRST ||
    route.execution === VOICE_ROUTE_EXECUTION_V0.HYBRID;
  return Object.freeze({
    id: "hybrid_pure_llm_leak",
    input,
    pass,
    route
  });
}

/**
 * @param {ReadonlyArray<string>} cases
 */
export function runHybridLeakageAttackSuiteV0(cases = DEFAULT_ATTACK_CASES_V0) {
  const results = cases.map((c) => {
    if (c.type === "local") return attackMustRouteLocalV0(c.input);
    if (c.type === "injection") return attackLlmCommandInjectionV0(c.input);
    if (c.type === "hybrid") return attackHybridMustNotPureLlmV0(c.input);
    if (c.type === "language") {
      return attackLanguageDriftOnCommitV0(c.input, c.traceId || "ATK-LANG-1");
    }
    return Object.freeze({ id: "unknown", pass: false });
  });
  const passCount = results.filter((r) => r.pass).length;
  const report = Object.freeze({
    schema: HYBRID_LEAKAGE_ATTACK_SCHEMA_V0,
    atMs: Date.now(),
    total: results.length,
    passCount,
    failCount: results.length - passCount,
    results: Object.freeze(results)
  });
  if (typeof window !== "undefined") {
    window.__CASTLE_HYBRID_LEAKAGE_ATTACK_REPORT__ = report;
  }
  return report;
}

export const DEFAULT_ATTACK_CASES_V0 = Object.freeze([
  Object.freeze({ type: "local", input: "tamam dur" }),
  Object.freeze({ type: "local", input: "enter ghost mode" }),
  Object.freeze({ type: "injection", input: "mute voice" }),
  Object.freeze({ type: "hybrid", input: "what is my current state" }),
  Object.freeze({ type: "language", input: "Tamam, dinliyorum.", traceId: "ATK-ACK-TR" })
]);
