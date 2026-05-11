/**
 * RHIZOH constitutional compiler kernel — DSL katmanlarını tek async çalışma zamanı girişinde birleştirir.
 * Yerine dinamik kod üretmez; mevcut saf fonksiyonları sıralı uygular.
 */

import { constitutionalTick } from "./constitutionalDynamicsV1.js";
import { resolveRhizohThetaPhase } from "./thetaPhaseTransitionV1.js";
import {
  scoreRhizohAdversarialThetaInjection,
  immunizeRhizohThetaStressAdaptationInput
} from "./adversarialThetaInjectionDefenseV1.js";
import { stabilizeRhizohThetaEntropy } from "./thetaEntropyStabilizationV1.js";
import { computeRhizohThetaAttractorField } from "./thetaAttractorFieldV1.js";
import { detectRhizohConstitutionalPhaseCollapse } from "./constitutionalPhaseCollapseV1.js";
import { computeRhizohThetaBifurcationSensitivity } from "./thetaBifurcationMappingV1.js";
import { discoverRhizohThetaLongTermAttractor } from "./thetaFixedPointConvergenceV1.js";

export const RHIZOH_CONSTITUTIONAL_COMPILER_KERNEL_VERSION = "1.0.0";

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/**
 * @param {import('./constitutionalDynamicsV1.js').RhizohConstitutionalTickSnapshot} snapshot
 * @param {{
 *   skipSeal?: boolean,
 *   observationHistory?: import('./adversarialThetaInjectionDefenseV1.js').RhizohThetaObservation[],
 *   memoryState?: { samples: import('./thetaMemoryDriftV1.js').RhizohThetaMemorySample[], cap?: number },
 *   phaseHistory?: ReadonlyArray<{ phase?: string | null, at?: number }>,
 *   layers?: Partial<{
 *     defense: boolean,
 *     stabilization: boolean,
 *     attractor: boolean,
 *     collapse: boolean,
 *     bifurcation: boolean,
 *     fixedPointPreview: boolean
 *   }>,
 *   defenseOpts?: Parameters<typeof scoreRhizohAdversarialThetaInjection>[1],
 *   stabilizationOpts?: Parameters<typeof stabilizeRhizohThetaEntropy>[0],
 *   attractorFieldOpts?: Parameters<typeof computeRhizohThetaAttractorField>[1],
 *   collapseOpts?: Omit<Parameters<typeof detectRhizohConstitutionalPhaseCollapse>[0], "memoryState" | "phaseHistory">,
 *   bifurcationOpts?: Parameters<typeof computeRhizohThetaBifurcationSensitivity>[1],
 *   fixedPointOpts?: Omit<
 *     Parameters<typeof discoverRhizohThetaLongTermAttractor>[0],
 *     "theta0" | "stressIndex"
 *   >
 * }} [opts]
 */
export async function executeRhizohConstitutionalKernel(snapshot, opts = {}) {
  const layers = {
    defense: !!(opts.observationHistory?.length),
    stabilization: !!(opts.memoryState?.samples?.length),
    attractor: true,
    collapse: !!(opts.memoryState?.samples?.length),
    bifurcation: true,
    fixedPointPreview: true,
    ...opts.layers
  };

  /** @type {Record<string, unknown>} */
  const extensions = {};

  let working = snapshot;

  if (layers.defense && opts.observationHistory?.length) {
    const defenseScore = scoreRhizohAdversarialThetaInjection(
      opts.observationHistory,
      opts.defenseOpts
    );
    const imm = immunizeRhizohThetaStressAdaptationInput(
      {
        priorLlmStressBump: snapshot.adaptation?.priorLlmStressBump,
        adaptationDisabled: snapshot.adaptation?.disabled === true
      },
      defenseScore
    );
    extensions.defense = { defenseScore, adaptationImmunization: imm };
    working = {
      ...snapshot,
      adaptation: {
        ...(snapshot.adaptation && typeof snapshot.adaptation === "object" ? snapshot.adaptation : {}),
        priorLlmStressBump: imm.priorLlmStressBump,
        disabled: imm.adaptationDisabled
      }
    };
  }

  const tick = await constitutionalTick(working, { skipSeal: opts.skipSeal });

  let runtimeTheta = clamp01(
    tick.constitutionalAdaptation?.thetaEffective ?? tick.constitutionalAdaptation?.thetaNext ?? 0
  );

  const thetaPrev = Number(snapshot.adaptation?.thetaPrev);
  const prevTheta = Number.isFinite(thetaPrev) ? clamp01(thetaPrev) : runtimeTheta;

  if (layers.stabilization && opts.memoryState?.samples?.length) {
    const stabilization = stabilizeRhizohThetaEntropy({
      ...(opts.stabilizationOpts || {}),
      thetaProposed: runtimeTheta,
      thetaPrev: prevTheta,
      phase: tick.thetaPhase?.phase ?? null,
      memoryState: opts.memoryState
    });
    extensions.stabilization = stabilization;
    runtimeTheta = stabilization.thetaStabilized;
  }

  if (layers.attractor) {
    extensions.attractor = computeRhizohThetaAttractorField(runtimeTheta, opts.attractorFieldOpts);
  }

  if (layers.collapse && opts.memoryState?.samples?.length) {
    extensions.phaseCollapse = detectRhizohConstitutionalPhaseCollapse({
      memoryState: opts.memoryState,
      phaseHistory: opts.phaseHistory,
      ...(opts.collapseOpts || {})
    });
  }

  if (layers.bifurcation) {
    extensions.bifurcation = computeRhizohThetaBifurcationSensitivity(runtimeTheta, opts.bifurcationOpts);
  }

  if (layers.fixedPointPreview) {
    const stressIdx = clamp01(tick.constitutionalPotential?.stressIndex ?? 0.4);
    extensions.fixedPoint = discoverRhizohThetaLongTermAttractor({
      theta0: runtimeTheta,
      stressIndex: stressIdx,
      ...(opts.fixedPointOpts || {})
    });
  }

  const runtimeThetaPhase = resolveRhizohThetaPhase(runtimeTheta);

  return {
    kernelVersion: RHIZOH_CONSTITUTIONAL_COMPILER_KERNEL_VERSION,
    dynamicsVersion: tick.dynamicsVersion,
    tick,
    extensions,
    runtimeTheta,
    runtimeThetaPhase,
    layersApplied: layers
  };
}
