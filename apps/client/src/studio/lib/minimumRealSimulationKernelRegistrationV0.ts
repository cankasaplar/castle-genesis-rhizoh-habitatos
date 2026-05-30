/**
 * SPECFLOW: RESEARCH-ONLY — **Minimum real simulation kernel** kaydı: beş motoru
 * `somaticExecutionCouplingLayerV0` handler’larına tek çağrıda bağlar.
 *
 * Sıra coupling içinde sabittir: nav → flock → FSM → look-at → integrator post.
 */

import {
  registerSomaticExecutionCouplingHandlersV0,
  type SomaticCouplingTickContextV0
} from "./somaticExecutionCouplingLayerV0";

export const MINIMUM_REAL_SIMULATION_KERNEL_REGISTRATION_SCHEMA_V0 =
  "castle.rhizoh.minimum_real_simulation_kernel_registration.v0";

/** Beş çekirdek motor — her biri isteğe bağlı; tanımlı olanlar coupling’e merge edilir. */
export type MinimumRealSimulationKernelEnginesV0 = {
  /** Nav mesh / obstacle runtime beslemesi → `onNavMeshRuntimeFeed` */
  navSolverRuntimeBind?: (ctx: SomaticCouplingTickContextV0) => void;
  /** FSM graph tick → `onFsmToTransform` */
  fsmGraphTick?: (ctx: SomaticCouplingTickContextV0) => void;
  /** Look-at / quaternion çözümü → `onLookAtQuaternionSolve` */
  lookAtSolverInject?: (ctx: SomaticCouplingTickContextV0) => void;
  /** Flock / spacing adımı → `onFlockSolverStep` */
  flockSolverHook?: (ctx: SomaticCouplingTickContextV0) => void;
  /** Frame integrator (look-at sonrası): süreklilik, tek writeback kapısı → `onFrameIntegratorPost` */
  integratorFrameOwner?: (ctx: SomaticCouplingTickContextV0) => void;
};

/**
 * Minimum real simulation kernel motorlarını somatic coupling’e bağlar (partial merge).
 */
export function registerMinimumRealSimulationKernelHandlersV0(
  engines: MinimumRealSimulationKernelEnginesV0
): void {
  registerSomaticExecutionCouplingHandlersV0({
    onNavMeshRuntimeFeed: engines.navSolverRuntimeBind,
    onFsmToTransform: engines.fsmGraphTick,
    onLookAtQuaternionSolve: engines.lookAtSolverInject,
    onFlockSolverStep: engines.flockSolverHook,
    onFrameIntegratorPost: engines.integratorFrameOwner
  });
}
