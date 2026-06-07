/**
 * Prompt Boundary Firewall — locked turn write gate (detect silent override leaks).
 * LOCKED TURN: no module may write to system prompt / LLM buffer / voice queue except permitted channel.
 */

import { logCastleLifecycleV0 } from "./rhizohProductionLogNamespacesV0.js";
import {
  SOVEREIGN_REALITY_V0,
  SOVEREIGNTY_VIOLATION_V0,
  getLastTurnSovereigntyV0,
  getTurnSovereigntyLockByIdV0,
  permitTurnOutputV0
} from "./behavioralTurnSovereigntyV0.js";
import {
  readTurnSovereigntyEnforcementModeV0,
  shouldBlockOnBoundaryViolationV0,
  shouldLogBoundaryViolationOnlyV0,
  TURN_SOVEREIGNTY_ENFORCEMENT_MODE_V0
} from "./turnSovereigntyEnforcementModeV0.js";

export const PROMPT_BOUNDARY_SURFACE_V0 = Object.freeze({
  SYSTEM_PROMPT: "system_prompt",
  LLM_INPUT: "llm_input",
  VOICE_OUTPUT: "voice_output_queue",
  INSTANT_ACK: "instant_ack"
});

/** @type {Record<string, number>} */
const silentOverrideHeatmapV0 = {};

/** @type {object[]} */
const boundaryViolationRingV0 = [];
const BOUNDARY_RING_MAX_V0 = 48;

/**
 * @param {string} turnId
 */
function resolveLockForTurnV0(turnId) {
  const id = String(turnId || "").trim();
  if (!id) return getLastTurnSovereigntyV0();
  return getTurnSovereigntyLockByIdV0(id) || (getLastTurnSovereigntyV0()?.turnId === id ? getLastTurnSovereigntyV0() : null);
}

/**
 * @param {string} surface
 * @param {string} moduleId
 * @param {object} lock
 */
function evaluateBoundaryViolationV0(surface, moduleId, lock) {
  if (!lock) return null;
  const suppressed = Array.isArray(lock.suppressed) ? lock.suppressed : [];
  const reality = lock.sovereignReality;

  if (surface === PROMPT_BOUNDARY_SURFACE_V0.LLM_INPUT) {
    if (reality !== SOVEREIGN_REALITY_V0.LLM_CONVERSATION) {
      return {
        code: SOVEREIGNTY_VIOLATION_V0.LLM_BYPASS_LEAK,
        reason: `llm_input_blocked_reality_${reality}`
      };
    }
    if (suppressed.includes("arbitration_primary_frame") && /arbitration|perception/i.test(moduleId)) {
      return {
        code: SOVEREIGNTY_VIOLATION_V0.ARBITRATION_OVERRIDE,
        reason: "arbitration_suppressed_but_writing"
      };
    }
  }

  if (surface === PROMPT_BOUNDARY_SURFACE_V0.INSTANT_ACK) {
    if (
      suppressed.includes("instant_ack") ||
      suppressed.includes("instant_ack_parallel") ||
      reality === SOVEREIGN_REALITY_V0.PRESENCE_ACK
    ) {
      if (reality === SOVEREIGN_REALITY_V0.LLM_CONVERSATION) {
        return { code: SOVEREIGNTY_VIOLATION_V0.ACK_LLM_ECHO, reason: "parallel_ack_on_llm_turn" };
      }
      return { code: SOVEREIGNTY_VIOLATION_V0.SHADOW_LEAK, reason: "instant_ack_suppressed" };
    }
  }

  if (surface === PROMPT_BOUNDARY_SURFACE_V0.VOICE_OUTPUT) {
    if (lock.outputChannel === "none" && reality !== SOVEREIGN_REALITY_V0.COMMAND_EXECUTE) {
      return { code: SOVEREIGNTY_VIOLATION_V0.SHADOW_LEAK, reason: "voice_output_on_none_channel" };
    }
  }

  if (surface === PROMPT_BOUNDARY_SURFACE_V0.SYSTEM_PROMPT) {
    if (reality === SOVEREIGN_REALITY_V0.PRESENCE_ACK || reality === SOVEREIGN_REALITY_V0.SILENT_OBSERVE) {
      return { code: SOVEREIGNTY_VIOLATION_V0.LLM_BYPASS_LEAK, reason: "system_prompt_on_non_llm_reality" };
    }
    if (suppressed.includes("depth_directive") && /depth|discourse|greet/i.test(moduleId)) {
      return {
        code: SOVEREIGNTY_VIOLATION_V0.ARBITRATION_OVERRIDE,
        reason: "depth_directive_suppressed_but_in_prompt"
      };
    }
  }

  const advisoryOnly = /advisory|shadow|observability/i.test(moduleId);
  if (advisoryOnly && surface !== PROMPT_BOUNDARY_SURFACE_V0.VOICE_OUTPUT) {
    return {
      code: SOVEREIGNTY_VIOLATION_V0.SHADOW_LEAK,
      reason: "silent_override_advisory_wrote_execution_surface"
    };
  }

  return null;
}

/**
 * @param {{
 *   turnId?: string,
 *   surface: string,
 *   moduleId?: string,
 *   detail?: Record<string, unknown>
 * }} input
 */
export function attemptPromptBoundaryWriteV0(input = {}) {
  const turnId = String(input.turnId || getLastTurnSovereigntyV0()?.turnId || "");
  const surface = String(input.surface || "");
  const moduleId = String(input.moduleId || "unknown");
  const lock = resolveLockForTurnV0(turnId);
  const mode = readTurnSovereigntyEnforcementModeV0();

  if (!lock || mode === TURN_SOVEREIGNTY_ENFORCEMENT_MODE_V0.OFF) {
    return Object.freeze({ allowed: true, reason: "no_lock_or_off", mode, lock: null });
  }

  const violation = evaluateBoundaryViolationV0(surface, moduleId, lock);
  if (!violation) {
    return Object.freeze({ allowed: true, reason: "boundary_ok", mode, lock });
  }

  const entry = Object.freeze({
    atMs: Date.now(),
    turnId: lock.turnId,
    surface,
    moduleId,
    violation,
    sovereignReality: lock.sovereignReality,
    enforcement: mode,
    detail: input.detail && typeof input.detail === "object" ? input.detail : {}
  });

  boundaryViolationRingV0.push(entry);
  if (boundaryViolationRingV0.length > BOUNDARY_RING_MAX_V0) boundaryViolationRingV0.shift();

  const heatKey = `${moduleId}→${surface}`;
  silentOverrideHeatmapV0[heatKey] = (silentOverrideHeatmapV0[heatKey] || 0) + 1;

  logCastleLifecycleV0("TURN_SOVEREIGNTY_VIOLATION", entry);

  let allowed = true;
  if (shouldLogBoundaryViolationOnlyV0()) {
    allowed = true;
  } else if (shouldBlockOnBoundaryViolationV0()) {
    if (surface === PROMPT_BOUNDARY_SURFACE_V0.LLM_INPUT) {
      const permit = permitTurnOutputV0(lock.turnId, "llm");
      allowed = permit.permitted;
    } else if (surface === PROMPT_BOUNDARY_SURFACE_V0.INSTANT_ACK) {
      const permit = permitTurnOutputV0(lock.turnId, "instant_ack");
      allowed = permit.permitted;
    } else if (surface === PROMPT_BOUNDARY_SURFACE_V0.VOICE_OUTPUT) {
      const permit = permitTurnOutputV0(lock.turnId, "tts");
      allowed = permit.permitted;
    } else if (mode === TURN_SOVEREIGNTY_ENFORCEMENT_MODE_V0.FULL) {
      allowed = false;
    }
  }

  return Object.freeze({
    allowed,
    reason: violation.reason,
    violation,
    mode,
    lock,
    silentOverride: violation.reason.includes("advisory")
  });
}

export function getPromptBoundaryViolationRingV0() {
  return Object.freeze([...boundaryViolationRingV0]);
}

export function getSilentOverrideHeatmapV0() {
  return Object.freeze({ ...silentOverrideHeatmapV0 });
}

export function resetPromptBoundaryFirewallForTestsV0() {
  boundaryViolationRingV0.length = 0;
  for (const k of Object.keys(silentOverrideHeatmapV0)) delete silentOverrideHeatmapV0[k];
}
