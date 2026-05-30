/**
 * SPECFLOW: RESEARCH-ONLY — Global coherence **execution bridge** (multi-castle → single kernel tick).
 *
 * Fuses `castleSlices` with `reduceGlobalCastleCoherenceSlicesV0`, then runs **one**
 * `runSocialCoherenceKernelTickV0` using `mergedWsRoom` as `wsRoom` — the “reducer → kernel” link
 * in `socialCoherenceKernelV0.js` evolution **B**. Live interval: `useGlobalSocialCoherenceLiveTickV0`;
 * fan-out: `distributeGlobalCoherenceKernelOutputV0`; feedback coupling: `coherenceFeedbackLoopV0.js`.
 */

import { reduceGlobalCastleCoherenceSlicesV0 } from "./globalCastleDiffReducerV0.js";
import { runSocialCoherenceKernelTickV0 } from "./socialCoherenceKernelV0.js";

export const GLOBAL_COHERENCE_KERNEL_BRIDGE_SCHEMA_V0 = "castle.rhizoh.global_coherence_kernel_bridge.v0";

/**
 * @param {{
 *   castleSlices: Parameters<typeof reduceGlobalCastleCoherenceSlicesV0>[0],
 *   reducerOpts?: Parameters<typeof reduceGlobalCastleCoherenceSlicesV0>[1],
 *   kernelInput: Omit<Parameters<typeof runSocialCoherenceKernelTickV0>[0], "wsRoom"> & {
 *     wsRoom?: Parameters<typeof runSocialCoherenceKernelTickV0>[0]["wsRoom"]
 *   }
 * }} params
 */
export function runGlobalSocialCoherenceKernelTickV0(params) {
  const p = params && typeof params === "object" ? params : {};
  const slices = Array.isArray(p.castleSlices) ? p.castleSlices : [];
  const reducerOpts =
    p.reducerOpts && typeof p.reducerOpts === "object" ? p.reducerOpts : undefined;
  const ki = p.kernelInput && typeof p.kernelInput === "object" ? p.kernelInput : {};

  const globalMerge = reduceGlobalCastleCoherenceSlicesV0(slices, reducerOpts);
  const wsRoom = globalMerge.mergedWsRoom;

  const kernel = runSocialCoherenceKernelTickV0({
    ...ki,
    wsRoom
  });

  return {
    schema: GLOBAL_COHERENCE_KERNEL_BRIDGE_SCHEMA_V0,
    globalMerge,
    kernel,
    frame: kernel.frame,
    snapshotForUi: kernel.snapshotForUi,
    snapshotForLlm: kernel.snapshotForLlm,
    snapshotForNetwork: kernel.snapshotForNetwork
  };
}
