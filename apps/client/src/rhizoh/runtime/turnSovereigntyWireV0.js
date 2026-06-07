/**
 * Turn sovereignty wire-in — lock envelope builder + prompt scope apply + execution hints.
 */

import { routeRhizohInput } from "../router/routeRhizohInput.js";
import { resolveRhizohConversationDepthV0 } from "./rhizohConversationDepthV0.js";
import { isVoiceIngestStrictV0 } from "./rhizohVoiceConversationAuthorityV0.js";
import {
  getTurnSovereigntyLockByIdV0,
  lockTurnSovereigntyV0,
  SOVEREIGN_REALITY_V0
} from "./behavioralTurnSovereigntyV0.js";
import {
  attemptPromptBoundaryWriteV0,
  PROMPT_BOUNDARY_SURFACE_V0
} from "./turnSovereigntyPromptFirewallV0.js";
import {
  readTurnSovereigntyEnforcementModeV0,
  shouldBlockOnBoundaryViolationV0,
  TURN_SOVEREIGNTY_ENFORCEMENT_MODE_V0
} from "./turnSovereigntyEnforcementModeV0.js";
import { getSilentOverrideHeatmapV0, getPromptBoundaryViolationRingV0 } from "./turnSovereigntyPromptFirewallV0.js";
import { getTurnSovereigntyConflictHeatmapV0 } from "./behavioralTurnSovereigntyV0.js";
import { buildTurnBehaviorConsistencyFieldV0 } from "./turnBehaviorConsistencyFieldV0.js";
import { buildTurnBehavioralDriftReportV0 } from "./turnBehavioralDriftEngineV0.js";
import { buildCalibrationGovernorStateV0 } from "./rhizohCalibrationGovernorV0.js";
import { guardExecutionSurfaceAgainstObservationLeakageV0 } from "./turnSovereigntyIndirectSemanticLeakageV0.js";

export const TURN_SOVEREIGNTY_WIRE_SCHEMA_V0 = "castle.rhizoh.turn_sovereignty_wire.v0";

/**
 * @param {object} params
 */
export function ensureTurnSovereigntyLockedV0(params = {}) {
  const turnId = String(params.turnId || "").trim();
  if (!turnId) {
    return Object.freeze({ lock: null, reason: "missing_turn_id" });
  }

  const existing = getTurnSovereigntyLockByIdV0(turnId);
  if (existing) {
    return Object.freeze({ lock: existing, reason: "already_locked", wire: buildWireHintsV0(existing) });
  }

  const text = String(params.text || "").trim();
  const modality = params.modality === "voice" ? "voice" : params.modality === "ui" ? "ui" : "text";
  const locale = String(params.locale || "tr");
  const continuity = params.continuity && typeof params.continuity === "object" ? params.continuity : {};
  const runtimeHints = params.runtime && typeof params.runtime === "object" ? params.runtime : {};

  const router =
    params.router && typeof params.router === "object"
      ? params.router
      : routeRhizohInput(text, continuity, runtimeHints);

  const depth =
    params.depth && typeof params.depth === "object"
      ? params.depth
      : resolveRhizohConversationDepthV0({
          message: text,
          conversationPhase: params.conversationPhase,
          userTurnCount: params.userTurnCount,
          voiceTurn: modality === "voice"
        });

  const lock = lockTurnSovereigntyV0({
    turnId,
    atMs: Number(params.atMs) || Date.now(),
    input: { text, modality, locale, source: params.source },
    candidates: {
      router,
      depth,
      voice: params.voice,
      command: params.command,
      fastReflex: params.fastReflex,
      instantAck: params.instantAck,
      cubeFox: params.cubeFox
    },
    runtime: {
      conversationPhase: String(params.conversationPhase || ""),
      userTurnCount: Number(params.userTurnCount) || 0,
      strictVoiceIngest: params.strictVoiceIngest ?? isVoiceIngestStrictV0(),
      gatewayMaintenance:
        runtimeHints.gatewayPhase === "maintenance" ||
        runtimeHints.healthState?.connectivity === "MAINTENANCE"
    }
  });

  return Object.freeze({
    schema: TURN_SOVEREIGNTY_WIRE_SCHEMA_V0,
    lock,
    reason: "newly_locked",
    wire: buildWireHintsV0(lock)
  });
}

/** @param {object} lock */
function buildWireHintsV0(lock) {
  if (!lock) return null;
  const reality = lock.sovereignReality;
  return Object.freeze({
    bypassLlm:
      reality !== SOVEREIGN_REALITY_V0.LLM_CONVERSATION &&
      reality !== SOVEREIGN_REALITY_V0.COMMAND_EXECUTE,
    speakPresenceAck: reality === SOVEREIGN_REALITY_V0.PRESENCE_ACK,
    speakFastReflex: reality === SOVEREIGN_REALITY_V0.FAST_REFLEX,
    silentObserve: reality === SOVEREIGN_REALITY_V0.SILENT_OBSERVE,
    sovereignOutput: lock.sovereignOutput || null,
    outputChannel: lock.outputChannel,
    suppressInstantAck:
      Array.isArray(lock.suppressed) &&
      (lock.suppressed.includes("instant_ack") || lock.suppressed.includes("instant_ack_parallel"))
  });
}

/**
 * Apply prompt scope to LLM context; strip suppressed advisory leaks.
 * @param {Record<string, unknown>} context
 * @param {object} lock
 */
export function applyTurnSovereigntyPromptScopeToContextV0(context, lock) {
  const ctx = context && typeof context === "object" ? { ...context } : {};
  if (!lock) return ctx;

  const scope = lock.promptScope;
  const suppressed = Array.isArray(lock.suppressed) ? lock.suppressed : [];

  if (suppressed.includes("arbitration_primary_frame") && ctx.perceptionArbitrationV1) {
    ctx.perceptionArbitrationV1 = Object.freeze({
      ...ctx.perceptionArbitrationV1,
      orderedPromptBlock: "[SUPPRESSED_BY_TURN_SOVEREIGNTY]",
      sovereigntySuppressed: true
    });
  }

  if (suppressed.includes("depth_directive") && scope) {
    ctx.rhizohConversationLlmDirective = scope.allowedDirectives?.[0] || ctx.rhizohConversationLlmDirective;
  }

  if (lock.sovereignReality !== SOVEREIGN_REALITY_V0.LLM_CONVERSATION) {
    return Object.freeze({
      ...ctx,
      turnSovereignty: Object.freeze({
        sovereignReality: lock.sovereignReality,
        llmBlocked: true,
        selectionReason: lock.selectionReason
      })
    });
  }

  const withSovereignty = Object.freeze({
    ...ctx,
    turnSovereignty: Object.freeze({
      sovereignReality: lock.sovereignReality,
      promptScope: scope || null,
      selectionReason: lock.selectionReason,
      subReality: lock.subReality || null,
      maxTokensCeiling: scope?.maxTokensCeiling ?? null
    })
  });

  const guarded = guardExecutionSurfaceAgainstObservationLeakageV0({
    surface: "llm_input",
    payload: withSovereignty,
    moduleId: "applyTurnSovereigntyPromptScope",
    turnId: lock.turnId
  });
  return guarded.sanitized;
}

/**
 * @param {number} maxTok
 * @param {object | null} lock
 */
export function resolveTurnSovereigntyMaxTokensV0(maxTok, lock) {
  const ceiling = lock?.promptScope?.maxTokensCeiling;
  if (!Number.isFinite(Number(ceiling))) return maxTok;
  return Math.min(Number(maxTok) || ceiling, Number(ceiling));
}

/**
 * Gate LLM fetch — firewall + partial enforcement.
 * @param {string} turnId
 * @param {string} moduleId
 */
export function gateLlmInputForTurnV0(turnId, moduleId = "queryRhizohLLM") {
  const boundary = attemptPromptBoundaryWriteV0({
    turnId,
    surface: PROMPT_BOUNDARY_SURFACE_V0.LLM_INPUT,
    moduleId,
    detail: { stage: "pre_fetch" }
  });
  const block = shouldBlockOnBoundaryViolationV0() && !boundary.allowed;
  return Object.freeze({
    ...boundary,
    block
  });
}

/**
 * @param {string} turnId
 * @param {string} [moduleId]
 */
export function gateInstantAckForTurnV0(turnId, moduleId = "voiceInstantAck") {
  const boundary = attemptPromptBoundaryWriteV0({
    turnId,
    surface: PROMPT_BOUNDARY_SURFACE_V0.INSTANT_ACK,
    moduleId
  });
  const block = shouldBlockOnBoundaryViolationV0() && !boundary.allowed;
  return Object.freeze({ ...boundary, block });
}

/**
 * @param {string} turnId
 * @param {string} [moduleId]
 */
export function gateVoiceOutputForTurnV0(turnId, moduleId = "speakRhizohReplyChunkedV0") {
  const boundary = attemptPromptBoundaryWriteV0({
    turnId,
    surface: PROMPT_BOUNDARY_SURFACE_V0.VOICE_OUTPUT,
    moduleId
  });
  const block = shouldBlockOnBoundaryViolationV0() && !boundary.allowed;
  return Object.freeze({ ...boundary, block });
}

export function exportTurnSovereigntyWireDiagnosticsV0() {
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.getTurnSovereigntyWireDiagnosticsV0 = exportTurnSovereigntyWireDiagnosticsV0;
  }
  return Object.freeze({
    schema: TURN_SOVEREIGNTY_WIRE_SCHEMA_V0,
    enforcementMode: readTurnSovereigntyEnforcementModeV0(),
    conflictHeatmap: getTurnSovereigntyConflictHeatmapV0(),
    silentOverrideHeatmap: getSilentOverrideHeatmapV0(),
    boundaryViolations: getPromptBoundaryViolationRingV0(),
    behaviorConsistency: buildTurnBehaviorConsistencyFieldV0(),
    behavioralDrift: buildTurnBehavioralDriftReportV0(),
    calibrationGovernor: buildCalibrationGovernorStateV0()
  });
}
