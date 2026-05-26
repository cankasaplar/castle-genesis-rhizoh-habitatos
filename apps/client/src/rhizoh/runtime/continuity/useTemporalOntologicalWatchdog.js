import { useEffect, useRef } from "react";
import {
  isOntologicalWatchdogEnabledV0,
  runTemporalOntologicalWatchdogPassV0
} from "./temporalOntologicalWatchdogV0.js";

/**
 * CORE-ELIGIBLE: periodic re-legitimization while AppRhizoh528 is mounted.
 *
 * @param {{
 *   enabled?: boolean,
 *   intervalMs?: number,
 *   localContract?: import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0,
 *   remoteContract?: import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0,
 *   selfNodeId?: string,
 *   diskKey?: string
 * }} opts
 */
export function useTemporalOntologicalWatchdog(opts = {}) {
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    if (opts.enabled === false || !isOntologicalWatchdogEnabledV0()) {
      return undefined;
    }

    const intervalMs = Number(opts.intervalMs) || 10_000;

    const tick = async () => {
      const o = optsRef.current;
      const out = await runTemporalOntologicalWatchdogPassV0({
        localContract: o.localContract,
        remoteContract: o.remoteContract,
        selfNodeId: o.selfNodeId,
        diskKey: o.diskKey,
        persist: true,
        hardReloadOnDrift: true
      });
      if (out.hardReloadScheduled && typeof window !== "undefined") {
        window.location.reload();
      }
    };

    void tick();
    const id = setInterval(() => void tick(), intervalMs);
    return () => clearInterval(id);
  }, [opts.enabled, opts.intervalMs, opts.localContract, opts.remoteContract, opts.selfNodeId, opts.diskKey]);
}
