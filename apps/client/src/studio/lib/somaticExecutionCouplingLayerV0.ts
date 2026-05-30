/**
 * SPECFLOW: RESEARCH-ONLY — **Somatic execution coupling layer**: gerçek render/sync döngüsüne
 * FSM → transform, look-at → quaternion, readiness → nav feed, multi-pet → flock bağlamak için tek giriş noktası.
 *
 * Varsayılan handler yok (no-op); `registerSomaticExecutionCouplingHandlersV0` ile motorlar enjekte edilir.
 * Sıra: nav feed → flock → FSM→transform → look-at → frame integrator post (dt / writeback kapısı).
 */

import type { StudioKernelState } from "../types/rskOntology";

export const SOMATIC_EXECUTION_COUPLING_LAYER_SCHEMA_V0 = "castle.rhizoh.somatic_execution_coupling_layer.v0";

export type SomaticCouplingTickContextV0 = {
  dtMs: number;
  nowMs: number;
  getState: () => StudioKernelState;
};

export type SomaticCouplingHandlersV0 = {
  /** Readiness / nav mesh runtime — besleme veya cache invalidation (Three yok). */
  onNavMeshRuntimeFeed?: (ctx: SomaticCouplingTickContextV0) => void;
  /** Çoklu pet: flock / spacing adımı. */
  onFlockSolverStep?: (ctx: SomaticCouplingTickContextV0) => void;
  /** Locomotion FSM → hedef transform / hız vektörü (kernel state okuma). */
  onFsmToTransform?: (ctx: SomaticCouplingTickContextV0) => void;
  /** Quaternion look-at — viewport THREE nesnelerine burada veya handler içinde dokunulur. */
  onLookAtQuaternionSolve?: (ctx: SomaticCouplingTickContextV0) => void;
  /** Minimum simulation kernel: dt ile integrasyon, accumulator tavanı, presence writeback flush (look-at sonrası). */
  onFrameIntegratorPost?: (ctx: SomaticCouplingTickContextV0) => void;
};

const ORDER: (keyof SomaticCouplingHandlersV0)[] = [
  "onNavMeshRuntimeFeed",
  "onFlockSolverStep",
  "onFsmToTransform",
  "onLookAtQuaternionSolve",
  "onFrameIntegratorPost"
];

let handlers: SomaticCouplingHandlersV0 = {};

export function registerSomaticExecutionCouplingHandlersV0(next: Partial<SomaticCouplingHandlersV0>): void {
  handlers = { ...handlers, ...next };
}

export function clearSomaticExecutionCouplingHandlersV0(): void {
  handlers = {};
}

let frameCount = 0;
let lastDtMs = 0;

export function tickSomaticExecutionCouplingV0(ctx: SomaticCouplingTickContextV0): void {
  frameCount += 1;
  lastDtMs = ctx.dtMs;
  for (const key of ORDER) {
    const fn = handlers[key];
    if (typeof fn === "function") {
      try {
        fn(ctx);
      } catch (e) {
        console.error(`[somaticExecutionCoupling] ${String(key)}`, e);
      }
    }
  }
}

export function getSomaticExecutionCouplingTickStatsV0(): {
  schema: typeof SOMATIC_EXECUTION_COUPLING_LAYER_SCHEMA_V0;
  frameCount: number;
  lastDtMs: number;
} {
  return {
    schema: SOMATIC_EXECUTION_COUPLING_LAYER_SCHEMA_V0,
    frameCount,
    lastDtMs
  };
}
