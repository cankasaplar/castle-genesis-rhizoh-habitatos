/**
 * Catch-up cascade renderer — accelerated Layer N→M replay (deterministic).
 */

import { deriveDeterministicLayerSeedV0 } from "./simulationDeviceParityV0.js";
import { readCodexStateV0, readSimulationWorldV0 } from "./ReplayEngineV0.js";
import { logCastleLifecycleV0 } from "../rhizoh/runtime/rhizohProductionLogNamespacesV0.js";

export const RHIZOH_CATCH_UP_CASCADE_SCHEMA_V0 = "castle.rhizoh.catch_up_cascade.v0";
export const RHIZOH_CATCH_UP_CASCADE_EVENT_V0 = "rhizoh:catch-up-cascade-v0";
export const RHIZOH_CATCH_UP_CASCADE_PHASE_EVENT_V0 = "rhizoh:catch-up-cascade-phase-v0";

/**
 * @param {{ fromLayer: number, toLayer: number, canonicalSeed: number, stepMs?: number }} opts
 */
export function buildCatchUpCascadePlanV0(opts = {}) {
  const fromLayer = Math.max(0, Number(opts.fromLayer) || 0);
  const toLayer = Math.max(fromLayer, Number(opts.toLayer) || fromLayer);
  const canonicalSeed = Number(opts.canonicalSeed) || 0;
  const stepMs = Math.max(120, Number(opts.stepMs) || 380);

  const steps = [];
  for (let layer = fromLayer + 1; layer <= toLayer; layer++) {
    steps.push(
      Object.freeze({
        layer,
        seed: deriveDeterministicLayerSeedV0(canonicalSeed, layer),
        durationMs: stepMs,
        progress: (layer - fromLayer) / Math.max(1, toLayer - fromLayer)
      })
    );
  }

  return Object.freeze({
    schema: RHIZOH_CATCH_UP_CASCADE_SCHEMA_V0,
    fromLayer,
    toLayer,
    canonicalSeed,
    stepMs,
    totalSteps: steps.length,
    steps: Object.freeze(steps)
  });
}

/**
 * @param {object} plan
 * @param {(phase: object) => void | Promise<void>} [onPhase]
 */
export async function runCatchUpCascadePlanV0(plan, onPhase) {
  const steps = Array.isArray(plan?.steps) ? plan.steps : [];
  if (!steps.length) {
    return Object.freeze({ ok: true, skipped: true, reason: "no_steps" });
  }

  publishCascadeSnapshotV0(
    Object.freeze({
      active: true,
      plan,
      currentStep: 0,
      phase: "start"
    })
  );

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const phase = Object.freeze({
      schema: RHIZOH_CATCH_UP_CASCADE_SCHEMA_V0,
      index: i,
      total: steps.length,
      layer: step.layer,
      seed: step.seed,
      progress: step.progress,
      durationMs: step.durationMs
    });

    publishCascadePhaseV0(phase);
    if (typeof onPhase === "function") {
      await onPhase(phase);
    }

    await sleepMsV0(step.durationMs);
  }

  publishCascadeSnapshotV0(
    Object.freeze({
      active: false,
      plan,
      currentStep: steps.length,
      phase: "complete"
    })
  );

  logCastleLifecycleV0("catch_up_cascade_complete", {
    fromLayer: plan.fromLayer,
    toLayer: plan.toLayer,
    steps: steps.length
  });

  return Object.freeze({ ok: true, steps: steps.length });
}

/**
 * Build plan from local vs canonical authority and run if behind.
 * @param {{ canonicalLayer: number, seed: number }} canonical
 */
export async function maybeRunCatchUpCascadeV0(canonical) {
  const local = readSimulationWorldV0();
  const codex = readCodexStateV0();
  const fromLayer = Math.max(0, Number(local.cycleLayer) || Number(codex.cycleLayer) || 0);
  const toLayer = Math.max(fromLayer, Number(canonical?.canonicalLayer) || 0);
  const canonicalSeed = Number(canonical?.seed) || Number(codex.seed) || 0;

  if (toLayer <= fromLayer) {
    return Object.freeze({ ok: true, skipped: true, reason: "already_caught_up", fromLayer, toLayer });
  }

  const plan = buildCatchUpCascadePlanV0({ fromLayer, toLayer, canonicalSeed });
  const out = await runCatchUpCascadePlanV0(plan);
  return Object.freeze({ ok: true, plan, ...out });
}

function publishCascadePhaseV0(phase) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(RHIZOH_CATCH_UP_CASCADE_PHASE_EVENT_V0, { detail: phase }));
  }
}

function publishCascadeSnapshotV0(snapshot) {
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.catchUpCascade = Object.freeze(snapshot);
    window.dispatchEvent(new CustomEvent(RHIZOH_CATCH_UP_CASCADE_EVENT_V0, { detail: snapshot }));
  }
}

function sleepMsV0(ms) {
  return new Promise((resolve) => {
    if (typeof window !== "undefined") window.setTimeout(resolve, ms);
    else resolve(undefined);
  });
}
