/**
 * Local commands never pass through LLM or OLP translation (execution path).
 * Enforcement: pre-STT routing + post-STT validation before gateway.
 */

export const CASTLE_COMMAND_INVARIANT_V0 = Object.freeze({
  schema: "castle.command_invariant.v0",
  rule: "Local commands never pass through LLM or OLP translation",
  enforcement: Object.freeze(["pre_stt_routing", "post_stt_validation"])
});

/**
 * @param {{ execution?: string, canonical?: string | null, localOnly?: boolean }} route
 * @returns {{ ok: boolean, invariant: typeof CASTLE_COMMAND_INVARIANT_V0, reason?: string }}
 */
export function validateLocalCommandPostSttV0(route) {
  const execution = String(route?.execution || "");
  if (execution !== "local") {
    return Object.freeze({ ok: true, invariant: CASTLE_COMMAND_INVARIANT_V0 });
  }
  if (!route.canonical && !route.grammarLocal) {
    return Object.freeze({
      ok: false,
      invariant: CASTLE_COMMAND_INVARIANT_V0,
      reason: "local_route_missing_canonical"
    });
  }
  return Object.freeze({ ok: true, invariant: CASTLE_COMMAND_INVARIANT_V0, localOnly: true });
}

/**
 * @param {string} execution — local | hybrid | llm
 */
export function assertCommandNeverUsesLlmV0(execution) {
  const ex = String(execution || "");
  if (ex === "local") {
    return Object.freeze({ llmBypass: true, invariant: CASTLE_COMMAND_INVARIANT_V0 });
  }
  return Object.freeze({ llmBypass: false, invariant: CASTLE_COMMAND_INVARIANT_V0 });
}

export function publishCastleCommandInvariantV0() {
  if (typeof window !== "undefined") {
    window.__CASTLE_COMMAND_INVARIANT__ = CASTLE_COMMAND_INVARIANT_V0;
  }
  return CASTLE_COMMAND_INVARIANT_V0;
}
