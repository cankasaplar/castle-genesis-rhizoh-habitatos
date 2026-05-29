/**
 * Friday prompt injection layer — readonly script runner for cohort QA.
 * Does not auto-send to LLM; surfaces next prompt + observation checklist.
 */

import { FRIDAY_PROMPT_SCRIPT_V0 } from "./cohortInvitePackV0.js";

export const FRIDAY_PROMPT_RUNNER_SCHEMA_V0 = "castle.rhizoh.friday_prompt_runner.v0";

/** @type {number} */
let stepIndex = 0;
/** @type {object[]} */
let completed = [];

/**
 * @returns {{ schema: string, stepIndex: number, total: number, current: object | null, completed: object[] }}
 */
export function getFridayPromptRunnerStateV0() {
  const current = FRIDAY_PROMPT_SCRIPT_V0[stepIndex] || null;
  return Object.freeze({
    schema: FRIDAY_PROMPT_RUNNER_SCHEMA_V0,
    stepIndex,
    total: FRIDAY_PROMPT_SCRIPT_V0.length,
    current,
    completed: completed.slice()
  });
}

/** Advance after observer marks step done. */
export function advanceFridayPromptStepV0(notes = "") {
  const current = FRIDAY_PROMPT_SCRIPT_V0[stepIndex];
  if (current) {
    completed.push(
      Object.freeze({
        ...current,
        completedAtMs: Date.now(),
        notes: String(notes || "").slice(0, 280)
      })
    );
  }
  if (stepIndex < FRIDAY_PROMPT_SCRIPT_V0.length - 1) {
    stepIndex += 1;
  }
  return getFridayPromptRunnerStateV0();
}

export function resetFridayPromptRunnerV0() {
  stepIndex = 0;
  completed = [];
  return getFridayPromptRunnerStateV0();
}

/**
 * @param {number} i
 */
export function jumpFridayPromptStepV0(i) {
  const n = Math.max(0, Math.min(FRIDAY_PROMPT_SCRIPT_V0.length - 1, Math.floor(Number(i) || 0)));
  stepIndex = n;
  return getFridayPromptRunnerStateV0();
}

export function installFridayPromptRunnerV0() {
  if (typeof window === "undefined") return () => {};
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.friday = Object.freeze({
    state: () => getFridayPromptRunnerStateV0(),
    next: (notes) => advanceFridayPromptStepV0(notes),
    reset: () => resetFridayPromptRunnerV0(),
    jump: (i) => jumpFridayPromptStepV0(i),
    script: () => FRIDAY_PROMPT_SCRIPT_V0.slice()
  });
  return () => {
    try {
      delete window.__rhizoh.friday;
    } catch {
      /* noop */
    }
  };
}
