/**
 * RHIZOH Formal Closure Bridge v1 — field truth, sınıflandırma ve canlı bayrakları tek yüzeyde birleştirir.
 * Formal kapanış kanıtı değil; runtime içi öz-tanım + dürüstlük katmanı.
 */

import {
  RHIZOH_VNEXT_529_RELEASE_SNAPSHOT,
  evaluateRhizohFullClosureProductionReady
} from "./rhizohExecutionRoadmap.js";
import { getRhizohLiveClosureFlags } from "./rhizohClosureRegistry.js";
import { buildEpistemicKernelSurface } from "./rhizohEpistemicKernelV1.js";
import { buildFullClosureContractGraphSkeleton } from "./rhizohFullClosureContractGraph.js";
import { buildInevitableEvolutionLinePack } from "./rhizohEvolutionLineV529.js";
import { buildSolverExternalizationLayerPayload } from "./rhizohSolverExternalizationLayerV1.js";
import { buildExternalProofNetworkPayload } from "./rhizohExternalProofNetworkV1.js";

export const RHIZOH_FORMAL_CLOSURE_BRIDGE_VERSION = "v1";

function fieldTruth() {
  return RHIZOH_VNEXT_529_RELEASE_SNAPSHOT.fieldTruthV529;
}

export function getRhizohFormalClosureBridgeVersion() {
  return RHIZOH_FORMAL_CLOSURE_BRIDGE_VERSION;
}

/** Snapshot kökü — panel / telemetri. */
export function getRhizohFieldTruthV529() {
  return fieldTruth();
}

export function getRhizohFormalFieldRealityFinal() {
  return fieldTruth().formalFieldRealityFinalV529;
}

/**
 * Ontolojik sınıf — engine/simulator/full closure değil; hibrit + iskelet dayatımı.
 */
export function getRhizohClosureClassification() {
  const ft = fieldTruth();
  const ct = ft.closureClassTruth;
  const final529 = ft.formalFieldRealityFinalV529;
  const rk = final529?.runtimeKind;

  return Object.freeze({
    bridgeVersion: RHIZOH_FORMAL_CLOSURE_BRIDGE_VERSION,
    closureCapable: true,
    formallyClosed: false,
    enforcementSkeleton: !!ct?.isClosureEnforcingRuntimeSkeleton,
    mathematicalClosureSystem: ct ? !ct.notMathematicalClosureSystem : false,
    simulativeRuntime: ct ? !ct.notClosureSimulatingRuntime : false,
    hybridRuntime: rk?.hybridRuntime !== false,
    engine: rk?.engine === true,
    simulator: rk?.simulator === true,
    fullClosureSystem: rk?.closureSystem === true,
    modelsOwnLimitsInRuntime: rk?.modelsOwnLimitsInRuntime !== false,
    selfDescribedRealityAware: final529?.determinismHonestStance?.selfDescribedRealityAware !== false
  });
}

/**
 * Tek çağrılık köprü yükü — warmSwarmGpu / host bootstrap.
 * @param {{ skipLiveRegistry?: boolean, frameState?: object | null }} [options]
 */
export function buildFormalClosureBridgePayload(options = {}) {
  const ft = fieldTruth();
  const final529 = ft.formalFieldRealityFinalV529;
  const skip = !!options.skipLiveRegistry;

  let liveFlags = null;
  let productionReady = null;
  if (!skip) {
    liveFlags = getRhizohLiveClosureFlags();
    productionReady = evaluateRhizohFullClosureProductionReady().productionReady;
  }

  const base = {
    bridgeVersion: RHIZOH_FORMAL_CLOSURE_BRIDGE_VERSION,
    snapshotId: RHIZOH_VNEXT_529_RELEASE_SNAPSHOT.id,
    formalFieldRealityFinalV529: final529,
    closureClassification: getRhizohClosureClassification(),
    canonicalArchitectSentenceV529: ft.canonicalArchitectSentenceV529,
    architectLines: final529?.architectLines ?? null,
    truthAxiom: final529?.truthAxiom ?? null,
    truthAxiomInvariant: final529?.truthAxiomInvariant ?? null,
    designation: final529?.designation ?? null,
    tripleSystem: final529?.tripleSystem ?? null,
    bridgeEpistemology: final529?.bridgeEpistemology ?? null,
    systemOneLiner: final529?.systemOneLiner ?? null,
    determinismHonestStance: final529?.determinismHonestStance ?? null,
    closureClassTruth: ft.closureClassTruth,
    criticalDivergence: ft.criticalDivergence,
    criticalSolverAndProofRealityV529: ft.criticalSolverAndProofRealityV529 ?? null,
    productionLikeCorrectness: ft.productionLikeCorrectness,
    readinessHonestField: ft.readinessHonestField,
    gapClosureRealityCheckV529: ft.gapClosureRealityCheckV529,
    nextNaturalEvolutionFork: ft.nextNaturalEvolutionFork,
    nextEvolutionForkSemantics: final529?.nextEvolutionForkSemantics ?? null,
    finalSnapshotReportV529: ft.finalSnapshotReportV529 ?? null,
    fullClosureContractGraph: buildFullClosureContractGraphSkeleton(),
    liveClosureFlags: liveFlags,
    liveProductionReady: productionReady
  };
  const epistemicKernel = buildEpistemicKernelSurface(base);
  const withEpistemic = Object.freeze({ ...base, epistemicKernel });
  const inevitableEvolutionLine = buildInevitableEvolutionLinePack(withEpistemic, options.frameState ? { frameState: options.frameState } : {});
  const solverExternalizationLayer = buildSolverExternalizationLayerPayload(withEpistemic);
  const externalProofNetworkV1 = buildExternalProofNetworkPayload(withEpistemic);
  return Object.freeze({
    ...withEpistemic,
    inevitableEvolutionLine,
    solverExternalizationLayer,
    externalProofNetworkV1
  });
}
