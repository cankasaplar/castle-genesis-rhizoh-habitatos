/**
 * SPECFLOW: CORE-ELIGIBLE — time-driven presence nudges (no LLM).
 * Distinct from `buildSocialRuntimeV0` (turn/LLM orchestration).
 */

import { SOCIAL_MODE_V0 } from "./socialModeStateMachineV0.js";

const TICKABLE_MODES = new Set([
  SOCIAL_MODE_V0.IDLE,
  SOCIAL_MODE_V0.AWARE,
  SOCIAL_MODE_V0.SOCIAL_ACTIVE
]);

/**
 * @param {{
 *   nowMs?: number,
 *   silenceMs: number,
 *   mode: string,
 *   initiativeBudget01: number
 * }} input
 */
export function evaluateSocialPresenceTickV0(input) {
  const nowMs = Math.max(0, Number(input.nowMs) || Date.now());
  const silenceMs = Math.max(0, Number(input.silenceMs) || 0);
  const modeIn = String(input.mode || SOCIAL_MODE_V0.IDLE).toUpperCase();
  const initiative01 = Math.min(1, Math.max(0, Number(input.initiativeBudget01) || 0));
  const tickable = TICKABLE_MODES.has(modeIn);

  let silenceLevel = "ACTIVE";
  if (silenceMs > 30_000) silenceLevel = "LONG";
  else if (silenceMs > 10_000) silenceLevel = "MID";

  let nextMode = null;
  if (tickable) {
    if (silenceLevel !== "ACTIVE" && modeIn === SOCIAL_MODE_V0.IDLE) {
      nextMode = SOCIAL_MODE_V0.AWARE;
    }
    if (
      silenceLevel === "MID" &&
      initiative01 > 0.6 &&
      (modeIn === SOCIAL_MODE_V0.IDLE || modeIn === SOCIAL_MODE_V0.AWARE)
    ) {
      nextMode = SOCIAL_MODE_V0.SOCIAL_ACTIVE;
    }
  }

  const shouldAmbientPing =
    tickable &&
    silenceLevel === "LONG" &&
    initiative01 > 0.5 &&
    modeIn === SOCIAL_MODE_V0.IDLE;

  let initiativeDelta = 0;
  if (silenceLevel === "ACTIVE") initiativeDelta = 0.004;
  else if (silenceLevel === "LONG" && modeIn === SOCIAL_MODE_V0.IDLE) initiativeDelta = -0.006;

  return {
    silenceMs: Math.round(silenceMs),
    silenceLevel,
    nextMode,
    shouldAmbientPing,
    initiativeDelta,
    tickAt: nowMs
  };
}
