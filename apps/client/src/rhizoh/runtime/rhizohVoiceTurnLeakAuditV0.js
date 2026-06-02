/**
 * Post-turn leak audit — one object per voice turn. Grep: RHIZOH_VOICE_TURN_AUDIT
 */

import { logVoiceInfoV0, logVoiceWarnV0 } from "./rhizohProductionLogNamespacesV0.js";
import { CMD_EXEC_DECISION_V0 } from "./rhizohCommandExecutionTraceV0.js";
import { isVoiceInstantAckPlayingV0 } from "./voiceInstantAckV0.js";

export const RHIZOH_VOICE_TURN_LEAK_AUDIT_SCHEMA_V0 = "castle.rhizoh.voice_turn_leak_audit.v0";

/** @type {object | null} */
let activeAudit = null;

/**
 * @param {{
 *   traceId?: string,
 *   source?: string,
 *   preview?: string,
 *   inputClass?: string,
 *   cmdDecision?: string,
 *   matchKind?: string,
 *   commandConfidence?: number
 * }} [meta]
 */
export function beginVoiceTurnLeakAuditV0(meta = {}) {
  activeAudit = {
    traceId: String(meta.traceId || `VTA-${Date.now().toString(36)}`),
    source: String(meta.source || ""),
    preview: String(meta.preview || "").slice(0, 96),
    inputClass: meta.inputClass || null,
    cmdDecision: meta.cmdDecision || null,
    matchKind: meta.matchKind || null,
    commandConfidence: meta.commandConfidence ?? null,
    startedAtMs: Date.now(),
    events: []
  };
  return activeAudit;
}

/**
 * @param {string} kind
 * @param {Record<string, unknown>} [detail]
 */
/**
 * @param {Partial<{
 *   inputClass: string,
 *   cmdDecision: string,
 *   matchKind: string,
 *   commandConfidence: number
 * }>} patch
 */
export function patchVoiceTurnLeakAuditV0(patch = {}) {
  if (!activeAudit || !patch || typeof patch !== "object") return;
  if (patch.inputClass != null) activeAudit.inputClass = String(patch.inputClass);
  if (patch.cmdDecision != null) activeAudit.cmdDecision = String(patch.cmdDecision);
  if (patch.matchKind != null) activeAudit.matchKind = String(patch.matchKind);
  if (patch.commandConfidence != null) {
    activeAudit.commandConfidence = Number(patch.commandConfidence);
  }
}

export function noteVoiceTurnLeakAuditV0(kind, detail = {}) {
  if (!activeAudit) return;
  activeAudit.events.push(
    Object.freeze({
      kind: String(kind || ""),
      atMs: Date.now(),
      detail: detail && typeof detail === "object" ? Object.freeze({ ...detail }) : null
    })
  );
}

/**
 * @param {object} audit
 */
function computeLeakFlagsV0(audit) {
  const kinds = new Set(audit.events.map((e) => e.kind));
  const flags = [];

  if (audit.cmdDecision === CMD_EXEC_DECISION_V0.SILENT_EXECUTE) {
    if (kinds.has("llm_query_started")) flags.push("silent_execute_then_llm");
    if (kinds.has("instant_ack_spoken")) flags.push("silent_execute_then_instant_ack");
    if (kinds.has("llm_query_started") && kinds.has("local_execute")) {
      flags.push("silent_execute_and_llm_same_turn");
    }
  }

  if (audit.inputClass === "COMMAND" && kinds.has("llm_query_started") && !kinds.has("local_execute")) {
    flags.push("command_class_without_local_execute");
  }

  if (kinds.has("stt_script_reject") && kinds.has("input_box_written")) {
    flags.push("script_reject_but_input_shown");
  }

  if (kinds.has("local_execute") && kinds.has("instant_ack_spoken")) {
    flags.push("local_execute_with_instant_ack");
  }

  if (isVoiceInstantAckPlayingV0() && kinds.has("local_execute")) {
    flags.push("instant_ack_still_playing_at_audit");
  }

  return Object.freeze(flags);
}

/**
 * @param {boolean} [clear]
 */
export function finishVoiceTurnLeakAuditV0(clear = true) {
  if (!activeAudit) return null;

  const leakFlags = computeLeakFlagsV0(activeAudit);
  const entry = Object.freeze({
    schema: RHIZOH_VOICE_TURN_LEAK_AUDIT_SCHEMA_V0,
    tag: "RHIZOH_VOICE_TURN_AUDIT",
    traceId: activeAudit.traceId,
    source: activeAudit.source,
    preview: activeAudit.preview,
    inputClass: activeAudit.inputClass,
    cmdDecision: activeAudit.cmdDecision,
    matchKind: activeAudit.matchKind,
    commandConfidence: activeAudit.commandConfidence,
    durationMs: Date.now() - activeAudit.startedAtMs,
    eventKinds: Object.freeze(activeAudit.events.map((e) => e.kind)),
    leakRisk: leakFlags.length > 0,
    leakFlags
  });

  if (entry.leakRisk) {
    logVoiceWarnV0("RHIZOH_VOICE_TURN_AUDIT", entry);
  } else {
    logVoiceInfoV0("RHIZOH_VOICE_TURN_AUDIT", entry);
  }

  if (typeof window !== "undefined") {
    window.__CASTLE_RHIZOH_VOICE_TURN_AUDIT__ = entry;
  }

  if (clear) activeAudit = null;
  return entry;
}

/** @internal vitest */
export function __resetVoiceTurnLeakAuditForTestV0() {
  activeAudit = null;
  if (typeof window !== "undefined") {
    try {
      delete window.__CASTLE_RHIZOH_VOICE_TURN_AUDIT__;
    } catch {
      /* noop */
    }
  }
}
