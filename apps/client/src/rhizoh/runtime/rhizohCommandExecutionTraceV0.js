/**
 * One-line COMMAND execution trace — grep: RHIZOH_CMD_EXEC
 * Catches semantic leak (instant_ack / LLM on hard command) in a single log object.
 */

import { logVoiceInfoV0, logVoiceWarnV0 } from "./rhizohProductionLogNamespacesV0.js";

export const RHIZOH_CMD_EXEC_TRACE_SCHEMA_V0 = "castle.rhizoh.command_execution_trace.v0";

export const CMD_EXEC_DECISION_V0 = Object.freeze({
  SILENT_EXECUTE: "SILENT_EXECUTE",
  LLM_FALLBACK: "LLM_FALLBACK",
  HYBRID: "HYBRID",
  LLM: "LLM"
});

/**
 * @param {{
 *   decision: string,
 *   matchKind?: string,
 *   commandConfidence?: number,
 *   canonical?: string | null,
 *   normalized?: string,
 *   traceId?: string,
 *   source?: string,
 *   leakFlags?: string[]
 * }} payload
 */
export function logRhizohCommandExecutionTraceV0(payload) {
  const leakFlags = Array.isArray(payload.leakFlags) ? payload.leakFlags.filter(Boolean) : [];
  const entry = Object.freeze({
    schema: RHIZOH_CMD_EXEC_TRACE_SCHEMA_V0,
    tag: "RHIZOH_CMD_EXEC",
    atMs: Date.now(),
    decision: String(payload.decision || ""),
    matchKind: String(payload.matchKind || "none"),
    commandConfidence: Number(payload.commandConfidence) || 0,
    canonical: payload.canonical ? String(payload.canonical) : null,
    normalized: String(payload.normalized || "").slice(0, 80),
    traceId: String(payload.traceId || ""),
    source: String(payload.source || ""),
    leakRisk: leakFlags.length > 0,
    leakFlags: Object.freeze(leakFlags)
  });

  if (entry.leakRisk) {
    logVoiceWarnV0("RHIZOH_CMD_EXEC", entry);
  } else {
    logVoiceInfoV0("RHIZOH_CMD_EXEC", entry);
  }

  if (typeof window !== "undefined") {
    window.__CASTLE_RHIZOH_LAST_CMD_EXEC__ = entry;
  }

  return entry;
}
